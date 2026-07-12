"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { parseDateInputValue } from "@/lib/dates";
import { assignOrWaitlist } from "@/lib/waitlist";

function readChildFields(formData: FormData) {
  const lastName = String(formData.get("lastName") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "") || null;
  const parentPhone = normalizePhone(String(formData.get("parentPhone") ?? ""));
  const paidUntilRaw = String(formData.get("paidUntil") ?? "");
  const paidUntil = paidUntilRaw ? parseDateInputValue(paidUntilRaw) : null;

  if (!lastName || !firstName) {
    throw new Error("Укажите фамилию и имя ребёнка");
  }

  return { lastName, firstName, groupId, parentPhone, paidUntil };
}

export async function createChildAction(formData: FormData) {
  await requireTrainer();
  const { groupId: requestedGroupId, ...data } = readChildFields(formData);
  const child = await prisma.child.create({ data: { ...data, groupId: null } });
  if (requestedGroupId) {
    await assignOrWaitlist(child.id, requestedGroupId);
  }
  revalidatePath("/trainer/children");
  revalidatePath("/trainer/schedule");
  redirect("/trainer/children");
}

export async function updateChildAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  const existing = await prisma.child.findUnique({
    where: { id },
    select: { groupId: true },
  });
  const { groupId: requestedGroupId, ...data } = readChildFields(formData);

  if (requestedGroupId !== (existing?.groupId ?? null)) {
    await prisma.child.update({ where: { id }, data: { ...data, groupId: null } });
    if (requestedGroupId) {
      await assignOrWaitlist(id, requestedGroupId);
    }
  } else {
    await prisma.child.update({ where: { id }, data });
  }

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${id}`);
  revalidatePath("/trainer/schedule");
  revalidatePath("/parent", "layout");
  redirect("/trainer/children");
}

export async function markPaidAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  await prisma.child.update({
    where: { id },
    data: { paidUntil: endOfMonth(new Date()) },
  });
  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${id}`);
  revalidatePath("/parent", "layout");
}

export async function deleteChildAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  await prisma.child.delete({ where: { id } });
  revalidatePath("/trainer/children");
  revalidatePath("/trainer/cold-children");
  redirect("/trainer/children");
}

export async function markChildSickAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  await prisma.child.update({ where: { id }, data: { status: "SICK" } });
  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${id}`);
  revalidatePath("/trainer/cold-children");
}

export async function reactivateChildAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  await prisma.child.update({ where: { id }, data: { status: "ACTIVE" } });
  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${id}`);
  revalidatePath("/trainer/cold-children");
}

export async function updateChildNoteAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  const note = String(formData.get("note") ?? "").trim() || null;
  await prisma.child.update({ where: { id }, data: { note } });
  revalidatePath("/trainer/cold-children");
  revalidatePath(`/trainer/children/${id}`);
}
