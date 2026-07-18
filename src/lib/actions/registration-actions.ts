"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { parseDateInputValue } from "@/lib/dates";
import { assignOrWaitlist } from "@/lib/waitlist";
import { computeCombinedPrice } from "@/lib/registrationTariffs";

export type ActionState = { error?: string; success?: string } | undefined;

export async function registerChildAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const phoneRaw = String(formData.get("phone") ?? "");
  const lastName = String(formData.get("lastName") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const birthDateStr = String(formData.get("birthDate") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const extraGroupId = String(formData.get("extraGroupId") ?? "") || null;

  if (!phoneRaw || !lastName || !firstName || !birthDateStr || !groupId) {
    return { error: "Заполните все поля и выберите группу" };
  }

  const baseGroup = await prisma.group.findUnique({ where: { id: groupId } });
  if (!baseGroup) {
    return { error: "Выбранная группа не найдена, обновите страницу" };
  }

  let extraGroup = null;
  if (extraGroupId) {
    extraGroup = await prisma.group.findUnique({ where: { id: extraGroupId } });
    if (!extraGroup || extraGroup.pool !== baseGroup.pool) {
      return { error: "Доп. занятие должно быть в группе того же бассейна" };
    }
  }

  const parentPhone = normalizePhone(phoneRaw);
  const birthDate = parseDateInputValue(birthDateStr);

  const child = await prisma.child.create({
    data: { lastName, firstName, parentPhone, birthDate, groupId: null },
  });

  const { waitlisted } = await assignOrWaitlist(child.id, groupId);

  if (extraGroup) {
    await prisma.extraSessionEntitlement.create({
      data: {
        childId: child.id,
        groupId: extraGroup.id,
        sessionsPerWeek: extraGroup.daysOfWeek.length,
      },
    });
  }

  revalidatePath("/trainer/children");
  revalidatePath("/trainer/schedule");

  const price = computeCombinedPrice(baseGroup, extraGroup);
  const priceText = `Итоговая стоимость: ${price.toLocaleString("ru-RU")}₽/мес.`;
  const waitlistText = waitlisted
    ? " Мест в группе сейчас нет — ребёнок добавлен в лист ожидания."
    : "";

  return {
    success: `Заявка отправлена! ${priceText}${waitlistText}`,
  };
}
