"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";

export async function addExtraSessionEntitlementAction(formData: FormData) {
  await requireTrainer();

  const childId = String(formData.get("childId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const sessionsPerWeek = Number(formData.get("sessionsPerWeek") ?? "");

  if (!childId) throw new Error("Не найден ребёнок");
  if (!groupId || !Number.isFinite(sessionsPerWeek) || sessionsPerWeek <= 0) {
    throw new Error("Выберите группу и укажите число занятий в неделю");
  }

  await prisma.extraSessionEntitlement.upsert({
    where: { childId_groupId: { childId, groupId } },
    update: { sessionsPerWeek: Math.round(sessionsPerWeek) },
    create: { childId, groupId, sessionsPerWeek: Math.round(sessionsPerWeek) },
  });

  revalidatePath(`/trainer/children/${childId}`);
}

export async function deleteExtraSessionEntitlementAction(formData: FormData) {
  await requireTrainer();

  const id = String(formData.get("id") ?? "");
  const childId = String(formData.get("childId") ?? "");
  if (!id) throw new Error("Не найдена запись");

  await prisma.extraSessionEntitlement.delete({ where: { id } });

  revalidatePath(`/trainer/children/${childId}`);
}
