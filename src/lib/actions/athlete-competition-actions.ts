"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import { parseSwimTime } from "@/lib/swimTime";
import type { AthleteRank, FinDiscipline, Gender, TimingType } from "@prisma/client";

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

const VALID_DISCIPLINES: FinDiscipline[] = [
  "APNEA50",
  "M50",
  "M100",
  "M200",
  "M400",
  "M800",
  "M1500",
  "UNDERWATER100",
  "UNDERWATER400",
  "CLASSIC50",
  "CLASSIC100",
  "CLASSIC200",
  "CLASSIC400",
];

const VALID_TIMINGS: TimingType[] = ["MANUAL", "AUTO"];
const VALID_GENDERS: Gender[] = ["MALE", "FEMALE"];

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

/** Анкетное поле — нужно для подсказки разряда по таблице ЕВСК (норматив разный для М/Ж). */
export async function setAthleteGenderAction(formData: FormData) {
  const athlete = await requireAthlete();
  const genderRaw = String(formData.get("gender") ?? "");
  const gender = VALID_GENDERS.includes(genderRaw as Gender) ? (genderRaw as Gender) : null;

  await prisma.athlete.update({ where: { id: athlete.id }, data: { gender } });
  revalidateCompetitionPaths();
}

export async function addAthleteCompetitionResultAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const athlete = await requireAthlete();

  const competitionName = String(formData.get("competitionName") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const disciplineRaw = String(formData.get("discipline") ?? "");
  const timingRaw = String(formData.get("timing") ?? "");
  const resultRaw = String(formData.get("result") ?? "").trim();

  if (!competitionName || !dateStr || !disciplineRaw || !timingRaw || !resultRaw) {
    return { error: "Заполните все поля" };
  }
  if (!VALID_DISCIPLINES.includes(disciplineRaw as FinDiscipline)) {
    return { error: "Не удалось разобрать дисциплину" };
  }
  if (!VALID_TIMINGS.includes(timingRaw as TimingType)) {
    return { error: "Не удалось разобрать тип хронометража" };
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
      discipline: disciplineRaw as FinDiscipline,
      timing: timingRaw as TimingType,
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
