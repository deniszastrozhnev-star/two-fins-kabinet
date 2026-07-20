import "server-only";
import { prisma } from "@/lib/prisma";
import { getPeriodRange, type AthletePeriod } from "@/lib/athletes";

export async function getTrainingLogHistory(
  athleteId: string,
  period: AthletePeriod,
  reference: Date,
) {
  const { start, end } = getPeriodRange(period, reference);
  return prisma.levelTrainingLog.findMany({
    where: { athleteId, date: { gte: start, lte: end } },
    orderBy: { date: "desc" },
  });
}
