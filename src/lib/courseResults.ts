import "server-only";
import { prisma } from "@/lib/prisma";
import { formatSwimTime } from "@/lib/swimTime";

export const COURSE_RESULT_NAME = "Курсовка";

/** Сохраняет курсовку ребёнку — удаляет предыдущую запись за эту дату И
 * дистанцию (если есть, от повторного сохранения того же дня той же
 * дистанции), затем создаёт новую. Фильтр по дистанции нужен, чтобы результат
 * за одну дистанцию не затирал результат за другую, внесённый в тот же день.
 * Общий helper для тренерского массового внесения (Посещаемость) и
 * самостоятельного внесения спортсменом (Тренировка в бассейне) — оба пишут в
 * одну таблицу. */
export async function upsertCourseResult(
  childId: string,
  date: Date,
  distance: string,
  resultCentis: number,
) {
  await prisma.competitionResult.deleteMany({
    where: {
      childId,
      date,
      competitionName: COURSE_RESULT_NAME,
      result: { startsWith: `${distance} —` },
    },
  });
  await prisma.competitionResult.create({
    data: {
      childId,
      date,
      competitionName: COURSE_RESULT_NAME,
      result: `${distance} — ${formatSwimTime(resultCentis)}`,
    },
  });
}
