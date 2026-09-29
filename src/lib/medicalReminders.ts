import "server-only";
import { Prisma, MedicalReminderKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendCombinedFamilyPushes, type FamilyReminderEntry } from "@/lib/familyReminders";
import { formatDateRu } from "@/lib/dates";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function novosibirskTodayUtcMidnight(): Date {
  const nsk = new Date(Date.now() + NOVOSIBIRSK_OFFSET_MS);
  const dateOnly = nsk.toISOString().slice(0, 10);
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

const CASES: {
  kind: MedicalReminderKind;
  offsetDays: number;
  title: string;
  body: (childName: string, dateLabel: string) => string;
}[] = [
  {
    kind: "BEFORE_14D",
    offsetDays: 14,
    title: "Скоро закончится справка",
    body: (name, d) => `${name}: анализы действительны до ${d} — через 14 дней понадобится новая справка.`,
  },
  {
    kind: "DUE_TODAY",
    offsetDays: 0,
    title: "Справка заканчивается сегодня",
    body: (name, d) => `${name}: анализы действительны до сегодня (${d}). Загрузите новую справку.`,
  },
];

/**
 * Тот же паттерн, что и src/lib/paymentReminders.ts — раз в день проверяет,
 * у кого из активных детей срок ДЕЙСТВУЮЩЕЙ справки (последней по дате
 * загрузки — см. getMedicalStatus в src/lib/medical.ts) попадает ровно на
 * одну из двух контрольных точек, и шлёт push, один раз на семью.
 * "Действующая" справка — не любая строка MedicalCertificate: у ребёнка может
 * быть несколько (история), актуальна только самая свежая по createdAt,
 * поэтому сперва берём по одной последней записи на ребёнка, а уже потом
 * проверяем, попадает ли ЕЁ validUntil в нужное окно.
 */
export async function runMedicalReminders(): Promise<{ sent: number; alreadySent: number }> {
  const today = novosibirskTodayUtcMidnight();
  let sent = 0;
  let alreadySent = 0;
  const entriesByPhone = new Map<string, FamilyReminderEntry[]>();

  const latestCerts = await prisma.medicalCertificate.findMany({
    where: { child: { status: "ACTIVE" } },
    orderBy: [{ childId: "asc" }, { createdAt: "desc" }],
    distinct: ["childId"],
    select: {
      validUntil: true,
      child: { select: { id: true, lastName: true, firstName: true, parentPhone: true } },
    },
  });

  for (const c of CASES) {
    const targetDayStart = new Date(today.getTime() + c.offsetDays * DAY_MS);
    const targetDayEnd = new Date(targetDayStart.getTime() + DAY_MS);

    const matching = latestCerts.filter(
      (cert) => cert.validUntil >= targetDayStart && cert.validUntil < targetDayEnd,
    );

    for (const cert of matching) {
      try {
        await prisma.medicalReminderSent.create({
          data: { childId: cert.child.id, kind: c.kind, validUntil: cert.validUntil },
        });
      } catch (err) {
        if (isUniqueConstraintError(err)) {
          alreadySent++;
          continue;
        }
        throw err;
      }

      const childName = `${cert.child.lastName} ${cert.child.firstName}`;
      const list = entriesByPhone.get(cert.child.parentPhone) ?? [];
      list.push({ title: c.title, body: c.body(childName, formatDateRu(cert.validUntil)) });
      entriesByPhone.set(cert.child.parentPhone, list);
      sent++;
    }
  }

  await sendCombinedFamilyPushes(entriesByPhone, "Напоминания о справке");

  return { sent, alreadySent };
}
