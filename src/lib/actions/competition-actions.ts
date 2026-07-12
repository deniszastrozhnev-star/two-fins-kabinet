"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";

export async function addCompetitionResultAction(formData: FormData) {
  await requireTrainer();

  const childId = String(formData.get("childId") ?? "");
  const competitionName = String(formData.get("competitionName") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const result = String(formData.get("result") ?? "").trim();

  if (!childId) throw new Error("Не найден ребёнок");
  if (!competitionName || !dateStr || !result) {
    throw new Error("Заполните название, дату и результат соревнования");
  }

  await prisma.competitionResult.create({
    data: {
      childId,
      competitionName,
      date: parseDateInputValue(dateStr),
      result,
    },
  });

  revalidatePath(`/trainer/children/${childId}`);
  revalidatePath("/parent", "layout");
}

export async function deleteCompetitionResultAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  const childId = String(formData.get("childId") ?? "");
  if (!id) throw new Error("Не найден результат");

  await prisma.competitionResult.delete({ where: { id } });

  revalidatePath(`/trainer/children/${childId}`);
  revalidatePath("/parent", "layout");
}
