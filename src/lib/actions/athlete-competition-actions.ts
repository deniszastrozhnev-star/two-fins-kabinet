"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import { parseSwimTime } from "@/lib/swimTime";
import type { AthleteRank } from "@prisma/client";

export type ActionState = { error?: string; success?: string } | undefined;

const VALID_RANKS: AthleteRank[] = [
  "YOUTH_3",
  "YOUTH_2",
  "YOUTH_1",
  "ADULT_3",
  "ADULT_2",
  "ADULT_1",
  "KMS",
  "MS",
  "MSMK",
];

function revalidateCompetitionPaths() {
  revalidatePath("/athlete");
  revalidatePath("/athlete/competitions");
  revalidatePath("/trainer/athletes");
}

/** Анкетное поле — заполняет сам спортсмен, тренер не подтверждает. */
export async function setAthleteRankAction(formData: FormData) {
  const athlete = await requireAthlete();
  const rankRaw = String(formData.get("rank") ?? "");
  const rank = VALID_RANKS.includes(rankRaw as AthleteRank) ? (rankRaw as AthleteRank) : null;

  await prisma.athlete.update({ where: { id: athlete.id }, data: { rank } });
  revalidateCompetitionPaths();
}

export async function addAthleteCompetitionResultAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const athlete = await requireAthlete();

  const competitionName = String(formData.get("competitionName") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const distance = String(formData.get("distance") ?? "").trim();
  const style = String(formData.get("style") ?? "").trim();
  const resultRaw = String(formData.get("result") ?? "").trim();

  if (!competitionName || !dateStr || !distance || !style || !resultRaw) {
    return { error: "Заполните все поля" };
  }

  const resultCentis = parseSwimTime(resultRaw);
  if (resultCentis === null) {
    return { error: "Не удалось разобрать время, формат: 32.45 или 1:02.34" };
  }

  await prisma.athleteCompetitionResult.create({
    data: {
      athleteId: athlete.id,
      competitionName,
      date: parseDateInputValue(dateStr),
      distance,
      style,
      resultCentis,
    },
  });

  revalidateCompetitionPaths();
  return { success: "Результат добавлен" };
}

export async function deleteAthleteCompetitionResultAction(formData: FormData) {
  const athlete = await requireAthlete();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена запись");

  await prisma.athleteCompetitionResult.deleteMany({ where: { id, athleteId: athlete.id } });
  revalidateCompetitionPaths();
}
