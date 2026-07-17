"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAthleteChild } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";

export type ActionState = { error?: string; success?: string } | undefined;

function revalidateAthletePaths() {
  revalidatePath("/athlete");
  revalidatePath("/athlete/rating");
  revalidatePath("/trainer/athletes");
}

export async function addPoolWorkoutAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireAthleteChild();

  const dateStr = String(formData.get("date") ?? "");
  const task = String(formData.get("task") ?? "").trim();
  const volumeMeters = Number(formData.get("volumeMeters") ?? "");
  const feeling = String(formData.get("feeling") ?? "").trim() || null;

  if (!dateStr || !task || !Number.isFinite(volumeMeters) || volumeMeters <= 0) {
    return { error: "Заполните дату, задание и объём (метры)" };
  }

  await prisma.poolWorkout.create({
    data: {
      childId: child.id,
      date: parseDateInputValue(dateStr),
      task,
      volumeMeters: Math.round(volumeMeters),
      feeling,
    },
  });

  revalidateAthletePaths();
  return { success: "Тренировка добавлена" };
}

export async function addGymWorkoutAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireAthleteChild();

  const dateStr = String(formData.get("date") ?? "");
  const task = String(formData.get("task") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? "");

  if (!dateStr || !task || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: "Заполните дату, задание и время тренировки (минуты)" };
  }

  await prisma.gymWorkout.create({
    data: {
      childId: child.id,
      date: parseDateInputValue(dateStr),
      task,
      durationMinutes: Math.round(durationMinutes),
    },
  });

  revalidateAthletePaths();
  return { success: "Тренировка добавлена" };
}

export async function deleteWorkoutAction(formData: FormData) {
  const child = await requireAthleteChild();
  const type = String(formData.get("type") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!id || (type !== "pool" && type !== "gym")) {
    throw new Error("Не найдена запись");
  }

  // Проверка владения через childId в where — иначе спортсмен смог бы
  // удалить чужую запись, зная её id.
  if (type === "pool") {
    await prisma.poolWorkout.deleteMany({ where: { id, childId: child.id } });
  } else {
    await prisma.gymWorkout.deleteMany({ where: { id, childId: child.id } });
  }

  revalidateAthletePaths();
}
