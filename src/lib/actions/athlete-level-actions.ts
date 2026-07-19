"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";

function revalidateLevelsPath() {
  revalidatePath("/trainer/athlete-levels");
  revalidatePath("/athlete");
}

export async function createAthleteLevelAction(formData: FormData) {
  await requireHeadTrainer();

  const name = String(formData.get("name") ?? "").trim();
  const ofpTask = String(formData.get("ofpTask") ?? "").trim();
  if (!name || !ofpTask) {
    throw new Error("Укажите название уровня и задание по ОФП");
  }

  await prisma.athleteLevel.create({ data: { name, ofpTask } });
  revalidateLevelsPath();
}

export async function updateAthleteLevelAction(formData: FormData) {
  await requireHeadTrainer();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const ofpTask = String(formData.get("ofpTask") ?? "").trim();
  if (!id) throw new Error("Не найден уровень");
  if (!name || !ofpTask) {
    throw new Error("Укажите название уровня и задание по ОФП");
  }

  await prisma.athleteLevel.update({ where: { id }, data: { name, ofpTask } });
  revalidateLevelsPath();
}

export async function deleteAthleteLevelAction(formData: FormData) {
  await requireHeadTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден уровень");

  // onDelete: SetNull на Athlete.levelId — спортсмены останутся без уровня
  await prisma.athleteLevel.delete({ where: { id } });
  revalidateLevelsPath();
}

export async function assignAthleteLevelAction(formData: FormData) {
  await requireHeadTrainer();
  const athleteId = String(formData.get("athleteId") ?? "");
  const levelId = String(formData.get("levelId") ?? "") || null;
  if (!athleteId) throw new Error("Не найден спортсмен");

  await prisma.athlete.update({ where: { id: athleteId }, data: { levelId } });
  revalidateLevelsPath();
}
