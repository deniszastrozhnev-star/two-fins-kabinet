"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import { parseSwimTime } from "@/lib/swimTime";
import { upsertCourseResult } from "@/lib/courseResults";
import { COURSE_DISTANCES } from "@/lib/labels";

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
  const athlete = await requireAthlete();

  const dateStr = String(formData.get("date") ?? "");
  const task = String(formData.get("task") ?? "").trim();
  const volumeMeters = Number(formData.get("volumeMeters") ?? "");
  const feeling = String(formData.get("feeling") ?? "").trim() || null;

  if (!dateStr || !task || !Number.isFinite(volumeMeters) || volumeMeters <= 0) {
    return { error: "Заполните дату, задание и объём (метры)" };
  }

  await prisma.poolWorkout.create({
    data: {
      athleteId: athlete.id,
      date: parseDateInputValue(dateStr),
      task,
      volumeMeters: Math.round(volumeMeters),
      feeling,
    },
  });

  if (formData.get("isCourse") === "on") {
    const distance = String(formData.get("courseDistance") ?? "");
    const timeRaw = String(formData.get("courseTime") ?? "").trim();
    const centis = parseSwimTime(timeRaw);
    if (!(COURSE_DISTANCES as readonly string[]).includes(distance) || centis === null) {
      return { error: "Не удалось разобрать время курсовки, формат: 32.45 или 1:02.34" };
    }
    const current = await prisma.athlete.findUnique({
      where: { id: athlete.id },
      select: { linkedChildId: true },
    });
    if (current?.linkedChildId) {
      await upsertCourseResult(current.linkedChildId, parseDateInputValue(dateStr), distance, centis);
      revalidatePath("/parent");
    }
  }

  revalidateAthletePaths();
  return { success: "Тренировка добавлена" };
}

export async function addGymWorkoutAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const athlete = await requireAthlete();

  const dateStr = String(formData.get("date") ?? "");
  const task = String(formData.get("task") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? "");

  if (!dateStr || !task || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: "Заполните дату, задание и время тренировки (минуты)" };
  }

  await prisma.gymWorkout.create({
    data: {
      athleteId: athlete.id,
      date: parseDateInputValue(dateStr),
      task,
      durationMinutes: Math.round(durationMinutes),
    },
  });

  revalidateAthletePaths();
  return { success: "Тренировка добавлена" };
}

export async function addFlexibilityWorkoutAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const athlete = await requireAthlete();

  const dateStr = String(formData.get("date") ?? "");
  const task = String(formData.get("task") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? "");

  if (!dateStr || !task || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: "Заполните дату, что тянул и время тренировки (минуты)" };
  }

  await prisma.flexibilityWorkout.create({
    data: {
      athleteId: athlete.id,
      date: parseDateInputValue(dateStr),
      task,
      durationMinutes: Math.round(durationMinutes),
    },
  });

  revalidateAthletePaths();
  return { success: "Тренировка добавлена" };
}

export async function deleteWorkoutAction(formData: FormData) {
  const athlete = await requireAthlete();
  const type = String(formData.get("type") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!id || (type !== "pool" && type !== "gym" && type !== "flex")) {
    throw new Error("Не найдена запись");
  }

  // Проверка владения через athleteId в where — иначе спортсмен смог бы
  // удалить чужую запись, зная её id.
  if (type === "pool") {
    await prisma.poolWorkout.deleteMany({ where: { id, athleteId: athlete.id } });
  } else if (type === "gym") {
    await prisma.gymWorkout.deleteMany({ where: { id, athleteId: athlete.id } });
  } else {
    await prisma.flexibilityWorkout.deleteMany({ where: { id, athleteId: athlete.id } });
  }

  revalidateAthletePaths();
}
