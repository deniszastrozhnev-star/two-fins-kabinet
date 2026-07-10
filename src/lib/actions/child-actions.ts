"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { parseDateInputValue } from "@/lib/dates";

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
  const data = readChildFields(formData);
  await prisma.child.create({ data });
  revalidatePath("/trainer/children");
  redirect("/trainer/children");
}

export async function updateChildAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  const data = readChildFields(formData);
  await prisma.child.update({ where: { id }, data });
  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${id}`);
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
  redirect("/trainer/children");
}
