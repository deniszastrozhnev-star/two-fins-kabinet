import "server-only";
import type { PaymentConfirmationSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCombinedPrice } from "@/lib/registrationTariffs";

/** Тариф ребёнка сейчас (₽/мес): основная группа + доп. занятие в том же
 * бассейне, тем же расчётом, что в онлайн-записи и в конструкторе группы.
 * null — если группы нет или цена не задана. */
export async function getChildTariffRub(childId: string): Promise<number | null> {
  const [child, extra] = await Promise.all([
    prisma.child.findUnique({
      where: { id: childId },
      select: { group: { select: { pool: true, pricePerMonth: true, daysOfWeek: true } } },
    }),
    prisma.extraSessionEntitlement.findFirst({
      where: { childId },
      select: { group: { select: { pool: true, pricePerMonth: true, daysOfWeek: true } } },
    }),
  ]);
  if (!child?.group) return null;
  const price = computeCombinedPrice(child.group, extra?.group ?? null);
  return price > 0 ? price : null;
}

/**
 * Записывает факт подтверждённой оплаты вместе с суммой. Если amountRub не
 * передан — берётся текущий тариф ребёнка. Повторное подтверждение того же
 * срока (childId + paidUntil) не создаёт вторую оплату, а лишь уточняет
 * сумму (если она известна) — дата оплаты (paidAt) остаётся первой, чтобы
 * оплата не «переезжала» из периода в период.
 */
export async function recordPaymentConfirmation(params: {
  childId: string;
  paidUntil: Date;
  source: PaymentConfirmationSource;
  trainerId: string;
  amountRub?: number | null;
}): Promise<void> {
  const amountRub =
    params.amountRub !== undefined ? params.amountRub : await getChildTariffRub(params.childId);
  await prisma.paymentConfirmation.upsert({
    where: { childId_paidUntil: { childId: params.childId, paidUntil: params.paidUntil } },
    create: {
      childId: params.childId,
      paidUntil: params.paidUntil,
      amountRub,
      source: params.source,
      confirmedByTrainerId: params.trainerId,
    },
    update: {
      ...(amountRub != null ? { amountRub } : {}),
      source: params.source,
      confirmedByTrainerId: params.trainerId,
    },
  });
}
