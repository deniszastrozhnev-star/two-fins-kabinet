import "server-only";
import { prisma } from "@/lib/prisma";
import { assignOrWaitlist } from "@/lib/waitlist";
import { computeCombinedPrice } from "@/lib/registrationTariffs";

export type ChildGroupChangeResult =
  | { ok: false; error: string }
  | { ok: true; waitlisted: boolean; price: number | null };

/**
 * Общая логика смены группы/доп. занятия — используется и тренером
 * (ChildGroupForm), и родителем (ParentGroupChangeForm): тот же конструктор,
 * то же назначение с листом ожидания при нехватке мест, тот же пересчёт
 * доп. занятия и тарифа. Авторизация и revalidatePath — на вызывающей стороне,
 * здесь только сама смена данных.
 */
export async function applyChildGroupChange(
  childId: string,
  groupId: string,
  extraGroupId: string | null,
): Promise<ChildGroupChangeResult> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { groupId: true },
  });
  if (!child) return { ok: false, error: "Ребёнок не найден" };

  if (!groupId) {
    await prisma.$transaction([
      prisma.child.update({ where: { id: childId }, data: { groupId: null } }),
      prisma.extraSessionEntitlement.deleteMany({ where: { childId } }),
    ]);
    return { ok: true, waitlisted: false, price: null };
  }

  const baseGroup = await prisma.group.findUnique({ where: { id: groupId } });
  if (!baseGroup) return { ok: false, error: "Группа не найдена, обновите страницу" };

  let extraGroup = null;
  if (extraGroupId) {
    extraGroup = await prisma.group.findUnique({ where: { id: extraGroupId } });
    if (!extraGroup || extraGroup.pool !== baseGroup.pool) {
      return { ok: false, error: "Доп. занятие должно быть в группе того же бассейна" };
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

  const price = computeCombinedPrice(baseGroup, extraGroup);
  return { ok: true, waitlisted, price };
}
