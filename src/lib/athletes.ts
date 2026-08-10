import "server-only";
import { unstable_cache } from "next/cache";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";

export type AthletePeriod = "week" | "month";

export type AthleteRankRow = {
  athleteId: string;
  lastName: string;
  firstName: string;
  avatarUrl: string | null;
  poolVolumeMeters: number;
  gymMinutes: number;
  flexibilityMinutes: number;
  points: number;
};

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
 * Очки = объём/100 + минуты ОФП/10. Гибкость в саму формулу очков не входит,
 * учитывается отдельной колонкой.
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

  const [poolSums, gymSums, flexSums, athletes] = await Promise.all([
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
    prisma.athlete.findMany({
      select: { id: true, lastName: true, firstName: true, avatarUrl: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const poolByAthlete = new Map(poolSums.map((p) => [p.athleteId, p._sum.volumeMeters ?? 0]));
  const gymByAthlete = new Map(gymSums.map((g) => [g.athleteId, g._sum.durationMinutes ?? 0]));
  const flexByAthlete = new Map(flexSums.map((f) => [f.athleteId, f._sum.durationMinutes ?? 0]));

  const rows: AthleteRankRow[] = athletes.map((a) => {
    const poolVolumeMeters = poolByAthlete.get(a.id) ?? 0;
    const gymMinutes = gymByAthlete.get(a.id) ?? 0;
    const flexibilityMinutes = flexByAthlete.get(a.id) ?? 0;
    const points = computeAthletePoints(poolVolumeMeters, gymMinutes);

    return {
      athleteId: a.id,
      lastName: a.lastName,
      firstName: a.firstName,
      avatarUrl: a.avatarUrl ? `/api/avatars/${a.id}` : null,
      poolVolumeMeters,
      gymMinutes,
      flexibilityMinutes,
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
