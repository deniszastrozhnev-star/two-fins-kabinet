"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { ATHLETE_LEVEL_ORDER } from "@/lib/labels";
import type { GroupLevel } from "@prisma/client";

function revalidateLevelsPath() {
  revalidatePath("/trainer/athlete-levels");
  revalidatePath("/athlete");
  revalidatePath("/athlete/trainings");
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

/** Текстовые задания по ОФП и гибкости для уровня — ровно одна запись на уровень. */
export async function updateLevelTrainingAction(formData: FormData) {
  await requireHeadTrainer();
  const levelRaw = String(formData.get("level") ?? "");
  const ofpTask = String(formData.get("ofpTask") ?? "").trim();
  const flexibilityTask = String(formData.get("flexibilityTask") ?? "").trim();

  if (!ATHLETE_LEVEL_ORDER.includes(levelRaw as GroupLevel)) {
    throw new Error("Неизвестный уровень");
  }
  if (!ofpTask || !flexibilityTask) {
    throw new Error("Укажите задания по ОФП и по гибкости");
  }

  const level = levelRaw as GroupLevel;
  await prisma.levelTraining.upsert({
    where: { level },
    update: { ofpTask, flexibilityTask },
    create: { level, ofpTask, flexibilityTask },
  });
  revalidateLevelsPath();
}
