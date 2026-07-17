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
  childId: string;
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

/** Рейтинг всех спортсменов (у кого настроена дата рождения) за неделю/месяц, отсортированный по очкам. */
export async function getAthleteLeaderboard(
  period: AthletePeriod,
  reference = new Date(),
): Promise<AthleteRankRow[]> {
  const { start, end } = getPeriodRange(period, reference);

  const [poolSums, gymSums, children] = await Promise.all([
    prisma.poolWorkout.groupBy({
      by: ["childId"],
      where: { date: { gte: start, lte: end } },
      _sum: { volumeMeters: true },
    }),
    prisma.gymWorkout.groupBy({
      by: ["childId"],
      where: { date: { gte: start, lte: end } },
      _sum: { durationMinutes: true },
    }),
    prisma.child.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, lastName: true, firstName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const poolByChild = new Map(poolSums.map((p) => [p.childId, p._sum.volumeMeters ?? 0]));
  const gymByChild = new Map(gymSums.map((g) => [g.childId, g._sum.durationMinutes ?? 0]));

  const rows: AthleteRankRow[] = children.map((c) => {
    const poolVolumeMeters = poolByChild.get(c.id) ?? 0;
    const gymMinutes = gymByChild.get(c.id) ?? 0;
    return {
      childId: c.id,
      lastName: c.lastName,
      firstName: c.firstName,
      poolVolumeMeters,
      gymMinutes,
      points: computeAthletePoints(poolVolumeMeters, gymMinutes),
    };
  });

  rows.sort((a, b) => b.points - a.points);
  return rows;
}
