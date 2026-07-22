"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAthlete, requireHeadTrainer } from "@/lib/auth";
import { ATHLETE_LEVEL_ORDER } from "@/lib/labels";
import { parseDateInputValue } from "@/lib/dates";
import type { GroupLevel, TrainingLogType } from "@prisma/client";

function revalidateLevelsPath() {
  revalidatePath("/trainer/athlete-levels");
  revalidatePath("/athlete");
  revalidatePath("/athlete/trainings");
}

const VALID_LOG_TYPES: TrainingLogType[] = ["OFP", "FLEXIBILITY"];

/** Отметка выполнения задания по уровню — уходит в архив, хранится вечно,
 * level фиксируется на момент отметки (снимок, не ссылка). */
export async function logLevelTrainingAction(formData: FormData) {
  const athlete = await requireAthlete();
  const typeRaw = String(formData.get("type") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? "");
  const done = formData.get("done") === "on";

  if (!VALID_LOG_TYPES.includes(typeRaw as TrainingLogType)) {
    throw new Error("Неизвестный тип задания");
  }
  if (!done || !dateStr || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Отметьте «Выполнено» и укажите дату и время выполнения");
  }

  const current = await prisma.athlete.findUnique({
    where: { id: athlete.id },
    select: { level: true },
  });
  if (!current?.level) {
    throw new Error("Уровень пока не назначен, обратитесь к тренеру");
  }

  await prisma.levelTrainingLog.create({
    data: {
      athleteId: athlete.id,
      level: current.level,
      type: typeRaw as TrainingLogType,
      date: parseDateInputValue(dateStr),
      durationMinutes: Math.round(durationMinutes),
    },
  });
  revalidateLevelsPath();
}

export async function deleteLevelTrainingLogAction(formData: FormData) {
  const athlete = await requireAthlete();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена запись");

  await prisma.levelTrainingLog.deleteMany({ where: { id, athleteId: athlete.id } });
  revalidateLevelsPath();
}

/** Назначение уровня спортсмену — так же, как в "Отработках": главный тренер
 * открывает список всех спортсменов и меняет уровень напрямую в списке. */
export async function assignAthleteLevelAction(formData: FormData) {
  await requireHeadTrainer();
  const athleteId = String(formData.get("athleteId") ?? "");
  const levelRaw = String(formData.get("level") ?? "");
  const level = ATHLETE_LEVEL_ORDER.includes(levelRaw as GroupLevel)
    ? (levelRaw as GroupLevel)
    : null;
  if (!athleteId) throw new Error("Не найден спортсмен");

  await prisma.athlete.update({ where: { id: athleteId }, data: { level } });
  revalidateLevelsPath();
}

/** Текстовые задания по ОФП и гибкости на конкретный день для уровня — журнал:
 * каждая дата отдельная запись, прошлые дни не перезаписываются. Повторное
 * сохранение той же даты обновляет именно эту запись (upsert по level+date). */
export async function saveLevelTrainingAction(formData: FormData) {
  await requireHeadTrainer();
  const levelRaw = String(formData.get("level") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const ofpTask = String(formData.get("ofpTask") ?? "").trim();
  const flexibilityTask = String(formData.get("flexibilityTask") ?? "").trim();

  if (!ATHLETE_LEVEL_ORDER.includes(levelRaw as GroupLevel)) {
    throw new Error("Неизвестный уровень");
  }
  if (!dateStr) throw new Error("Укажите дату");
  if (!ofpTask || !flexibilityTask) {
    throw new Error("Укажите задания по ОФП и по гибкости");
  }

  const level = levelRaw as GroupLevel;
  const date = parseDateInputValue(dateStr);
  await prisma.levelTraining.upsert({
    where: { level_date: { level, date } },
    update: { ofpTask, flexibilityTask },
    create: { level, date, ofpTask, flexibilityTask },
  });
  revalidatePath(`/trainer/athlete-levels/${level}`);
  revalidateLevelsPath();
}
