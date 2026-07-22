import "server-only";
import { prisma } from "@/lib/prisma";
import type { GroupLevel } from "@prisma/client";

/** Список дат, на которые для уровня есть задание — от свежих к старым. */
export function getLevelTrainingDates(level: GroupLevel) {
  return prisma.levelTraining.findMany({
    where: { level },
    select: { date: true },
    orderBy: { date: "desc" },
  });
}

export function getLevelTrainingForDate(level: GroupLevel, date: Date) {
  return prisma.levelTraining.findUnique({ where: { level_date: { level, date } } });
}
