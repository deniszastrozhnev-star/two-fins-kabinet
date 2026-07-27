import "server-only";
import { unstable_cache } from "next/cache";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";

export type AthletePeriod = "week" | "month";

export type AthleteRankRow = {
  athleteId: string;
  lastName: string;
  firstName: string;
  poolVolumeMeters: number;
  gymMinutes: number;
  flexibilityMinutes: number;
  rawPoints: number;
  missedDays: number;
  /** YYYY-MM-DD — не Date: результат проходит через кэш next/cache (сериализация в JSON). */
  missedDates: string[];
  points: number;
};

const MISSED_DAY_PENALTY = 2;

export function getPeriodRange(period: AthletePeriod, reference = new Date()) {
  if (period === "week") {
    return {
      start: startOfWeek(reference, { weekStartsOn: 1 }),
      end: endOfWeek(reference, { weekStartsOn: 1 }),
    };
  }
  return { start: startOfMonth(reference), end: endOfMonth(reference) };
}

export function computeAthletePoints(volumeMeters: number, gymMinutes: number): number {
  return volumeMeters / 100 + gymMinutes / 10;
}

/**
 * Рейтинг всех спортсменов за неделю/месяц, отсортированный по очкам.
 * Очки = объём/100 + минуты ОФП/10, минус 2 очка за каждый календарный день
 * без единой записи (плавание/ОФП/гибкость), но не ниже нуля. Гибкость в
 * саму формулу очков не входит — только в определение "был ли активен в
 * этот день". Штраф не начисляется за дни до регистрации спортсмена и за
 * ещё не наступившие дни периода.
 *
 * Кэшируется на 5 минут (across requests, не только в рамках одного рендера) —
 * рейтинг не обязан быть посекундно точным, а без кэша это самый частый и самый
 * тяжёлый запрос в проекте (грузится на /athlete, /athlete/rating, /trainer/athletes).
 */
async function computeAthleteLeaderboard(
  period: AthletePeriod,
  referenceDateStr: string,
): Promise<AthleteRankRow[]> {
  const reference = parseDateInputValue(referenceDateStr);
  const { start, end } = getPeriodRange(period, reference);
  const today = parseDateInputValue(toDateInputValue(reference));
  const penaltyEnd = end < today ? end : today;
  const hasPenaltyWindow = penaltyEnd >= start;

  const [poolSums, gymSums, flexSums, poolDates, gymDates, flexDates, athletes] =
    await Promise.all([
      prisma.poolWorkout.groupBy({
        by: ["athleteId"],
        where: { date: { gte: start, lte: end } },
        _sum: { volumeMeters: true },
      }),
      prisma.gymWorkout.groupBy({
        by: ["athleteId"],
        where: { date: { gte: start, lte: end } },
        _sum: { durationMinutes: true },
      }),
      prisma.flexibilityWorkout.groupBy({
        by: ["athleteId"],
        where: { date: { gte: start, lte: end } },
        _sum: { durationMinutes: true },
      }),
      hasPenaltyWindow
        ? prisma.poolWorkout.findMany({
            where: { date: { gte: start, lte: penaltyEnd } },
            select: { athleteId: true, date: true },
          })
        : Promise.resolve([]),
      hasPenaltyWindow
        ? prisma.gymWorkout.findMany({
            where: { date: { gte: start, lte: penaltyEnd } },
            select: { athleteId: true, date: true },
          })
        : Promise.resolve([]),
      hasPenaltyWindow
        ? prisma.flexibilityWorkout.findMany({
            where: { date: { gte: start, lte: penaltyEnd } },
            select: { athleteId: true, date: true },
          })
        : Promise.resolve([]),
      prisma.athlete.findMany({
        select: { id: true, lastName: true, firstName: true, createdAt: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);

  const poolByAthlete = new Map(poolSums.map((p) => [p.athleteId, p._sum.volumeMeters ?? 0]));
  const gymByAthlete = new Map(gymSums.map((g) => [g.athleteId, g._sum.durationMinutes ?? 0]));
  const flexByAthlete = new Map(flexSums.map((f) => [f.athleteId, f._sum.durationMinutes ?? 0]));

  const activeDaysByAthlete = new Map<string, Set<string>>();
  for (const row of [...poolDates, ...gymDates, ...flexDates]) {
    const key = format(row.date, "yyyy-MM-dd");
    const set = activeDaysByAthlete.get(row.athleteId) ?? new Set<string>();
    set.add(key);
    activeDaysByAthlete.set(row.athleteId, set);
  }

  const rows: AthleteRankRow[] = athletes.map((a) => {
    const poolVolumeMeters = poolByAthlete.get(a.id) ?? 0;
    const gymMinutes = gymByAthlete.get(a.id) ?? 0;
    const flexibilityMinutes = flexByAthlete.get(a.id) ?? 0;
    const rawPoints = computeAthletePoints(poolVolumeMeters, gymMinutes);

    const eligibleStart = a.createdAt > start ? a.createdAt : start;
    const missedDates: string[] = [];
    if (penaltyEnd >= eligibleStart) {
      const activeDays = activeDaysByAthlete.get(a.id) ?? new Set<string>();
      for (const day of eachDayOfInterval({ start: eligibleStart, end: penaltyEnd })) {
        const key = format(day, "yyyy-MM-dd");
        if (!activeDays.has(key)) {
          missedDates.push(key);
        }
      }
    }
    const missedDays = missedDates.length;
    const points = Math.max(0, rawPoints - missedDays * MISSED_DAY_PENALTY);

    return {
      athleteId: a.id,
      lastName: a.lastName,
      firstName: a.firstName,
      poolVolumeMeters,
      gymMinutes,
      flexibilityMinutes,
      rawPoints,
      missedDays,
      missedDates,
      points,
    };
  });

  rows.sort((a, b) => b.points - a.points);
  return rows;
}

const cachedAthleteLeaderboard = unstable_cache(
  computeAthleteLeaderboard,
  ["athlete-leaderboard"],
  { revalidate: 300, tags: ["athlete-leaderboard"] },
);

export async function getAthleteLeaderboard(
  period: AthletePeriod,
  reference = new Date(),
): Promise<AthleteRankRow[]> {
  return cachedAthleteLeaderboard(period, toDateInputValue(reference));
}
