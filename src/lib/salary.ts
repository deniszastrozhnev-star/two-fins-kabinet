import "server-only";
import { prisma } from "@/lib/prisma";

export const GROUP_LESSON_RATE = 130;
export const PERSONAL_TRAINING_RATE = 600;

export type TrainerSalaryRow = {
  trainerId: string;
  username: string;
  groupCount: number;
  groupTotal: number;
  personalCount: number;
  personalTotal: number;
  total: number;
};

/** Зарплата по каждому тренеру за период [dateFrom, dateTo] (обе даты включительно). */
export async function computeSalaryReport(
  dateFrom: Date,
  dateTo: Date,
): Promise<TrainerSalaryRow[]> {
  const [trainers, groupCounts, personalCounts] = await Promise.all([
    prisma.trainer.findMany({
      orderBy: [{ role: "asc" }, { username: "asc" }],
      select: { id: true, username: true },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["markedByTrainerId"],
      where: {
        date: { gte: dateFrom, lte: dateTo },
        status: { in: ["PRESENT", "WORKOFF"] },
      },
      _count: { _all: true },
    }),
    prisma.personalTraining.groupBy({
      by: ["trainerId"],
      where: {
        date: { gte: dateFrom, lte: dateTo },
        completed: true,
      },
      _count: { _all: true },
    }),
  ]);

  const groupCountByTrainer = new Map(
    groupCounts.map((g) => [g.markedByTrainerId, g._count._all]),
  );
  const personalCountByTrainer = new Map(
    personalCounts.map((p) => [p.trainerId, p._count._all]),
  );

  return trainers.map((t) => {
    const groupCount = groupCountByTrainer.get(t.id) ?? 0;
    const personalCount = personalCountByTrainer.get(t.id) ?? 0;
    const groupTotal = groupCount * GROUP_LESSON_RATE;
    const personalTotal = personalCount * PERSONAL_TRAINING_RATE;
    return {
      trainerId: t.id,
      username: t.username,
      groupCount,
      groupTotal,
      personalCount,
      personalTotal,
      total: groupTotal + personalTotal,
    };
  });
}
