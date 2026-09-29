"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { parseDateInputValue } from "@/lib/dates";
import { assignOrWaitlist } from "@/lib/waitlist";
import { sendPaymentAcceptedPush } from "@/lib/push";

function readChildFields(formData: FormData) {
  const lastName = String(formData.get("lastName") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  // На карточке ребёнка поле группы скрыто (группа и доп. занятие
  // редактируются отдельным конструктором) — formData.has различает "поля
  // нет в форме вовсе, группу не трогаем" от "поле есть, но пусто = снять
  // группу", иначе каждое сохранение прочих полей на карточке случайно
  // снимало бы ребёнка с группы.
  const groupId = formData.has("groupId")
    ? String(formData.get("groupId") ?? "") || null
    : undefined;
  const parentPhone = normalizePhone(String(formData.get("parentPhone") ?? ""));
  const paidUntilRaw = String(formData.get("paidUntil") ?? "");
  const paidUntil = paidUntilRaw ? parseDateInputValue(paidUntilRaw) : null;
  const birthDateRaw = String(formData.get("birthDate") ?? "");
  const birthDate = birthDateRaw ? parseDateInputValue(birthDateRaw) : null;

  if (!lastName || !firstName) {
    throw new Error("Укажите фамилию и имя ребёнка");
  }

  return { lastName, firstName, groupId, parentPhone, paidUntil, birthDate };
}

export type ChildFormState = { error?: string; success?: string } | undefined;

export async function createChildAction(
  _prevState: ChildFormState,
  formData: FormData,
): Promise<ChildFormState> {
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

/** Сохраняет карточку ребёнка, включая "Оплачено до" — если дата оплаты
 * действительно изменилась (на непустое значение), сразу уходит push
 * "Оплата принята" с тем же значением, что и сохранили, без отдельного
 * захода и без отдельной кнопки "Оплачено" (та подставляет конец месяца
 * безусловно — если после ручной даты ещё нажать её, дата тихо перезапишется
 * концом месяца; теперь push уходит уже на этом шаге, второй заход не нужен). */
export async function updateChildAction(
  _prevState: ChildFormState,
  formData: FormData,
): Promise<ChildFormState> {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  const existing = await prisma.child.findUnique({
    where: { id },
    select: { groupId: true, paidUntil: true },
  });
  const { groupId: requestedGroupId, ...data } = readChildFields(formData);

  if (requestedGroupId !== undefined && requestedGroupId !== (existing?.groupId ?? null)) {
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

  const paidUntilChanged =
    (existing?.paidUntil?.getTime() ?? null) !== (data.paidUntil?.getTime() ?? null);
  if (paidUntilChanged && data.paidUntil) {
    await sendPaymentAcceptedPush(id, data.paidUntil).catch((err) =>
      console.error("updateChildAction: push failed", err),
    );
  }

  return { success: "Сохранено" };
}

export async function markPaidAction(formData: FormData) {
  await requireTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найден ребёнок");
  const paidUntil = endOfMonth(new Date());
  await prisma.child.update({
    where: { id },
    data: { paidUntil },
  });
  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${id}`);
  revalidatePath("/parent", "layout");

  // Не блокируем отметку оплаты, если push не настроен или упал.
  await sendPaymentAcceptedPush(id, paidUntil).catch((err) =>
    console.error("markPaidAction: push failed", err),
  );
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
