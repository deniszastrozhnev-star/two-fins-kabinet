"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { assignOrWaitlist } from "@/lib/waitlist";
import { computeCombinedPrice } from "@/lib/registrationTariffs";

export type ChildGroupActionState = { error?: string; success?: string } | undefined;

/** Тот же конструктор, что в онлайн-записи: группа (по листу ожидания при
 * нехватке мест) + не более одного доп. занятия в группе того же бассейна,
 * с числом занятий в неделю, производным от расписания выбранной группы
 * (как и при онлайн-записи, а не произвольным числом от тренера). */
export async function updateChildGroupAction(
  _prevState: ChildGroupActionState,
  formData: FormData,
): Promise<ChildGroupActionState> {
  await requireTrainer();

  const childId = String(formData.get("childId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const extraGroupId = String(formData.get("extraGroupId") ?? "") || null;
  if (!childId) return { error: "Не найден ребёнок" };

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { groupId: true },
  });
  if (!child) return { error: "Ребёнок не найден" };

  if (!groupId) {
    await prisma.$transaction([
      prisma.child.update({ where: { id: childId }, data: { groupId: null } }),
      prisma.extraSessionEntitlement.deleteMany({ where: { childId } }),
    ]);
    revalidatePath("/trainer/children");
    revalidatePath(`/trainer/children/${childId}`);
    revalidatePath("/trainer/schedule");
    revalidatePath("/parent", "layout");
    return { success: "Ребёнок убран из группы." };
  }

  const baseGroup = await prisma.group.findUnique({ where: { id: groupId } });
  if (!baseGroup) return { error: "Группа не найдена, обновите страницу" };

  let extraGroup = null;
  if (extraGroupId) {
    extraGroup = await prisma.group.findUnique({ where: { id: extraGroupId } });
    if (!extraGroup || extraGroup.pool !== baseGroup.pool) {
      return { error: "Доп. занятие должно быть в группе того же бассейна" };
    }
  }

  let waitlisted = false;
  if (groupId !== (child.groupId ?? "")) {
    const result = await assignOrWaitlist(childId, groupId);
    waitlisted = result.waitlisted;
  }

  await prisma.$transaction(async (tx) => {
    await tx.extraSessionEntitlement.deleteMany({
      where: extraGroup ? { childId, groupId: { not: extraGroup.id } } : { childId },
    });
    if (extraGroup) {
      await tx.extraSessionEntitlement.upsert({
        where: { childId_groupId: { childId, groupId: extraGroup.id } },
        update: { sessionsPerWeek: extraGroup.daysOfWeek.length },
        create: {
          childId,
          groupId: extraGroup.id,
          sessionsPerWeek: extraGroup.daysOfWeek.length,
        },
      });
    }
  });

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${childId}`);
  revalidatePath("/trainer/schedule");
  revalidatePath("/parent", "layout");

  const price = computeCombinedPrice(baseGroup, extraGroup);
  const priceText = `Тариф пересчитан: ${price.toLocaleString("ru-RU")}₽/мес.`;
  const waitlistText = waitlisted
    ? " Мест в группе сейчас нет — ребёнок добавлен в лист ожидания."
    : "";

  return { success: `Сохранено. ${priceText}${waitlistText}` };
}
