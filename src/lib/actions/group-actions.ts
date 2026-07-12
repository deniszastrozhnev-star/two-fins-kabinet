"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { assignOrWaitlist } from "@/lib/waitlist";
import type { GroupLevel } from "@prisma/client";

const VALID_LEVELS: GroupLevel[] = ["NOVICE", "CONFIDENT", "SPORT", "TEAM"];

function readOptionalInt(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

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
  const capacity = readOptionalInt(formData, "capacity");
  const pricePerMonth = readOptionalInt(formData, "pricePerMonth");

  if (!name || !time || !pool) {
    throw new Error("Заполните название, время и бассейн группы");
  }

  await prisma.group.create({
    data: { name, level, daysOfWeek, time, pool, capacity, pricePerMonth },
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
  const capacity = readOptionalInt(formData, "capacity");
  const pricePerMonth = readOptionalInt(formData, "pricePerMonth");

  await prisma.group.update({
    where: { id },
    data: { name, level, daysOfWeek, time, pool, capacity, pricePerMonth },
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

  if (newGroupId) {
    await assignOrWaitlist(childId, newGroupId);
  } else {
    await prisma.child.update({ where: { id: childId }, data: { groupId: null } });
  }

  revalidatePath("/trainer/schedule");
  if (currentGroupId) revalidatePath(`/trainer/schedule/${currentGroupId}`);
  if (newGroupId) revalidatePath(`/trainer/schedule/${newGroupId}`);
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");
}

/** Переводит ребёнка из листа ожидания в основной состав группы — без проверки вместимости,
 * это осознанное решение тренера. */
export async function promoteFromWaitlistAction(formData: FormData) {
  await requireTrainer();

  const childId = String(formData.get("childId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!childId || !groupId) throw new Error("Не найдена запись листа ожидания");

  await prisma.$transaction([
    prisma.groupWaitlist.delete({
      where: { childId_groupId: { childId, groupId } },
    }),
    prisma.child.update({ where: { id: childId }, data: { groupId } }),
  ]);

  revalidatePath(`/trainer/schedule/${groupId}`);
  revalidatePath("/trainer/schedule");
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");
}

export async function removeFromWaitlistAction(formData: FormData) {
  await requireTrainer();
  const childId = String(formData.get("childId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!childId || !groupId) throw new Error("Не найдена запись листа ожидания");

  await prisma.groupWaitlist.delete({
    where: { childId_groupId: { childId, groupId } },
  });

  revalidatePath(`/trainer/schedule/${groupId}`);
}

export async function deleteGroupAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена группа");
  await prisma.group.delete({ where: { id } });
  revalidatePath("/trainer/schedule");
  redirect("/trainer/schedule");
}
