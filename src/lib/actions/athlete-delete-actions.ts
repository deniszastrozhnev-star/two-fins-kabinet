"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";

export async function deleteAthleteAction(formData: FormData) {
  await requireHeadTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден спортсмен");

  // Все связи (PoolWorkout/GymWorkout/FlexibilityWorkout/AthleteCompetitionResult/
  // LevelTrainingLog) уже onDelete: Cascade — каскад безопасен.
  await prisma.athlete.delete({ where: { id } });

  revalidatePath("/trainer/athletes");
  revalidatePath("/trainer/athlete-levels");
  redirect("/trainer/athletes");
}
