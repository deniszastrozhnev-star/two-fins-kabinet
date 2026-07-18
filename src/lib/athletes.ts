import "server-only";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { prisma } from "@/lib/prisma";

export type AthletePeriod = "week" | "month";

export type AthleteRankRow = {
  athleteId: string;
  lastName: string;
  firstName: string;
  poolVolumeMeters: number;
  gymMinutes: number;
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

/** Рейтинг всех спортсменов за неделю/месяц, отсортированный по очкам. */
export async function getAthleteLeaderboard(
  period: AthletePeriod,
  reference = new Date(),
): Promise<AthleteRankRow[]> {
  const { start, end } = getPeriodRange(period, reference);

  const [poolSums, gymSums, athletes] = await Promise.all([
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
    prisma.athlete.findMany({
      select: { id: true, lastName: true, firstName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const poolByAthlete = new Map(poolSums.map((p) => [p.athleteId, p._sum.volumeMeters ?? 0]));
  const gymByAthlete = new Map(gymSums.map((g) => [g.athleteId, g._sum.durationMinutes ?? 0]));

  const rows: AthleteRankRow[] = athletes.map((a) => {
    const poolVolumeMeters = poolByAthlete.get(a.id) ?? 0;
    const gymMinutes = gymByAthlete.get(a.id) ?? 0;
    return {
      athleteId: a.id,
      lastName: a.lastName,
      firstName: a.firstName,
      poolVolumeMeters,
      gymMinutes,
      points: computeAthletePoints(poolVolumeMeters, gymMinutes),
    };
  });

  rows.sort((a, b) => b.points - a.points);
  return rows;
}
