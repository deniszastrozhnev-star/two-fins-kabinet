import "server-only";
import { Prisma, PaymentReminderKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToChild } from "@/lib/push";
import { formatDateRu } from "@/lib/dates";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/** "Сегодня" по календарю Новосибирска, как UTC-полночь этой календарной даты —
 * не зависит от часового пояса самого сервера (сравниваем только UTC-арифметикой). */
function novosibirskTodayUtcMidnight(): Date {
  const nsk = new Date(Date.now() + NOVOSIBIRSK_OFFSET_MS);
  const dateOnly = nsk.toISOString().slice(0, 10);
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

const CASES: {
  kind: PaymentReminderKind;
  offsetDays: number;
  title: string;
  body: (dateLabel: string) => string;
}[] = [
  {
    kind: "BEFORE_3D",
    offsetDays: 3,
    title: "Скоро закончится оплата",
    body: (d) => `Занятия оплачены до ${d} — через 3 дня понадобится продление.`,
  },
  {
    kind: "DUE_TODAY",
    offsetDays: 0,
    title: "Сегодня последний оплаченный день",
    body: (d) => `Оплата заканчивается сегодня (${d}). Продлите занятия, чтобы не пропустить тренировки.`,
  },
  {
    kind: "OVERDUE_3D",
    offsetDays: -3,
    title: "Оплата просрочена",
    body: (d) => `Оплата закончилась ${d} — пожалуйста, продлите занятия.`,
  },
];

/**
 * Раз в день (см. src/instrumentation.ts) проверяет, у кого из активных детей
 * paidUntil попадает ровно на одну из трёх контрольных точек, и шлёт push —
 * по одному разу на каждую точку для каждого конкретного значения paidUntil
 * (см. комментарий к PaymentReminderSent в schema.prisma). "Отправлено" фиксируется
 * ДО реальной отправки push — уникальный индекс ловит дубль (гонка/повторный
 * тик/несколько инстансов процесса) раньше, чем уйдёт второй push.
 */
export async function runPaymentReminders(): Promise<{ sent: number; alreadySent: number }> {
  const today = novosibirskTodayUtcMidnight();
  let sent = 0;
  let alreadySent = 0;

  for (const c of CASES) {
    const targetDayStart = new Date(today.getTime() + c.offsetDays * DAY_MS);
    const targetDayEnd = new Date(targetDayStart.getTime() + DAY_MS);

    const children = await prisma.child.findMany({
      where: {
        status: "ACTIVE",
        paidUntil: { gte: targetDayStart, lt: targetDayEnd },
      },
      select: { id: true, paidUntil: true },
    });

    for (const child of children) {
      if (!child.paidUntil) continue;

      try {
        await prisma.paymentReminderSent.create({
          data: { childId: child.id, kind: c.kind, paidUntil: child.paidUntil },
        });
      } catch (err) {
        if (isUniqueConstraintError(err)) {
          alreadySent++;
          continue;
        }
        throw err;
      }

      await sendPushToChild(child.id, {
        title: c.title,
        body: c.body(formatDateRu(child.paidUntil)),
        url: "/parent",
      }).catch((err) => console.error("runPaymentReminders: push failed", err));
      sent++;
    }
  }

  return { sent, alreadySent };
}
