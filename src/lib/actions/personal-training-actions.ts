"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import type { PersonType } from "@prisma/client";

export type ActionState = { error?: string; success?: string } | undefined;

export async function createPersonalTrainingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const trainer = await requireTrainer();

  const dateStr = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "").trim();
  const personType = String(formData.get("personType") ?? "") as PersonType;
  const childId = String(formData.get("childId") ?? "") || null;
  const adultName = String(formData.get("adultName") ?? "").trim() || null;
  const completed = formData.get("completed") === "on";

  if (!dateStr || !time) {
    return { error: "Укажите дату и время тренировки" };
  }
  if (personType !== "CHILD" && personType !== "ADULT") {
    return { error: "Выберите, кто пришёл — ребёнок или взрослый" };
  }
  if (personType === "CHILD" && !childId) {
    return { error: "Выберите ребёнка из списка" };
  }
  if (personType === "ADULT" && !adultName) {
    return { error: "Укажите ФИО взрослого" };
  }

  await prisma.personalTraining.create({
    data: {
      trainerId: trainer.id,
      date: parseDateInputValue(dateStr),
      time,
      personType,
      childId: personType === "CHILD" ? childId : null,
      adultName: personType === "ADULT" ? adultName : null,
      completed,
    },
  });

  revalidatePath("/trainer/personal-trainings");
  revalidatePath("/trainer/report");
  return { success: "Тренировка добавлена" };
}

export async function deletePersonalTrainingAction(formData: FormData) {
  const trainer = await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена тренировка");

  await prisma.personalTraining.deleteMany({
    where: { id, trainerId: trainer.id },
  });

  revalidatePath("/trainer/personal-trainings");
  revalidatePath("/trainer/report");
}
