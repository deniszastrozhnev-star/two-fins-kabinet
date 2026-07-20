"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import { parseSwimTime } from "@/lib/swimTime";
import { upsertCourseResult } from "@/lib/courseResults";
import { COURSE_DISTANCES } from "@/lib/labels";

export async function saveCourseResultsAction(formData: FormData) {
  await requireTrainer();

  const dateStr = String(formData.get("date") ?? "");
  const distance = String(formData.get("distance") ?? "");
  if (!dateStr || !(COURSE_DISTANCES as readonly string[]).includes(distance)) {
    throw new Error("Не указана дата или дистанция");
  }
  const date = parseDateInputValue(dateStr);

  const childIds = formData.getAll("childIds").map(String);
  for (const childId of childIds) {
    const raw = String(formData.get(`time-${childId}`) ?? "").trim();
    if (!raw) continue;
    const centis = parseSwimTime(raw);
    if (centis === null) continue;
    await upsertCourseResult(childId, date, distance, centis);
  }

  revalidatePath("/trainer/attendance");
  revalidatePath("/parent");
}
