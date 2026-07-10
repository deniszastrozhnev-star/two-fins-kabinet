"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import type { EventType } from "@prisma/client";

const VALID_TYPES: EventType[] = ["NEWS", "GATHERING", "COMPETITION"];

function readEventFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");
  const type = VALID_TYPES.includes(typeRaw as EventType)
    ? (typeRaw as EventType)
    : "NEWS";
  const dateStartRaw = String(formData.get("dateStart") ?? "");
  const dateEndRaw = String(formData.get("dateEnd") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const suitableFor = String(formData.get("suitableFor") ?? "").trim();

  if (!title || !dateStartRaw) {
    throw new Error("Укажите название и дату события");
  }

  return {
    title,
    type,
    dateStart: parseDateInputValue(dateStartRaw),
    dateEnd: dateEndRaw ? parseDateInputValue(dateEndRaw) : null,
    location,
    description,
    suitableFor,
  };
}

export async function createEventAction(formData: FormData) {
  await requireTrainer();
  const data = readEventFields(formData);
  await prisma.event.create({ data });
  revalidatePath("/trainer/events");
  revalidatePath("/parent", "layout");
  redirect("/trainer/events");
}

export async function updateEventAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдено событие");
  const data = readEventFields(formData);
  await prisma.event.update({ where: { id }, data });
  revalidatePath("/trainer/events");
  revalidatePath(`/trainer/events/${id}`);
  revalidatePath("/parent", "layout");
  redirect("/trainer/events");
}

export async function deleteEventAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдено событие");
  await prisma.event.delete({ where: { id } });
  revalidatePath("/trainer/events");
  revalidatePath("/parent", "layout");
  redirect("/trainer/events");
}
