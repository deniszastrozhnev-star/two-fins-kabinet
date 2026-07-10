"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import type { GroupLevel } from "@prisma/client";

const VALID_LEVELS: GroupLevel[] = ["NOVICE", "CONFIDENT", "SPORT", "TEAM"];

export async function createGroupAction(formData: FormData) {
  await requireTrainer();

  const name = String(formData.get("name") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "");
  const level = VALID_LEVELS.includes(levelRaw as GroupLevel)
    ? (levelRaw as GroupLevel)
    : "NOVICE";
  const daysOfWeek = formData.getAll("daysOfWeek").map(String);
  const time = String(formData.get("time") ?? "").trim();
  const pool = String(formData.get("pool") ?? "").trim();

  if (!name || !time || !pool) {
    throw new Error("Заполните название, время и бассейн группы");
  }

  await prisma.group.create({
    data: { name, level, daysOfWeek, time, pool },
  });

  revalidatePath("/trainer/schedule");
  redirect("/trainer/schedule");
}

export async function updateGroupAction(formData: FormData) {
  await requireTrainer();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена группа");

  const name = String(formData.get("name") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "");
  const level = VALID_LEVELS.includes(levelRaw as GroupLevel)
    ? (levelRaw as GroupLevel)
    : "NOVICE";
  const daysOfWeek = formData.getAll("daysOfWeek").map(String);
  const time = String(formData.get("time") ?? "").trim();
  const pool = String(formData.get("pool") ?? "").trim();

  await prisma.group.update({
    where: { id },
    data: { name, level, daysOfWeek, time, pool },
  });

  revalidatePath("/trainer/schedule");
  revalidatePath(`/trainer/schedule/${id}`);
  redirect("/trainer/schedule");
}

export async function moveChildGroupAction(formData: FormData) {
  await requireTrainer();

  const childId = String(formData.get("childId") ?? "");
  const newGroupId = String(formData.get("newGroupId") ?? "") || null;
  const currentGroupId = String(formData.get("currentGroupId") ?? "");
  if (!childId) throw new Error("Не найден ребёнок");

  await prisma.child.update({
    where: { id: childId },
    data: { groupId: newGroupId },
  });

  revalidatePath("/trainer/schedule");
  if (currentGroupId) revalidatePath(`/trainer/schedule/${currentGroupId}`);
  if (newGroupId) revalidatePath(`/trainer/schedule/${newGroupId}`);
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");
}

export async function deleteGroupAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена группа");
  await prisma.group.delete({ where: { id } });
  revalidatePath("/trainer/schedule");
  redirect("/trainer/schedule");
}
