import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/appSettings";
import { sendCombinedFamilyPushes, type FamilyReminderEntry } from "@/lib/familyReminders";

const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function novosibirskTodayParts(): { month: number; day: number; year: number } {
  const nsk = new Date(Date.now() + NOVOSIBIRSK_OFFSET_MS);
  return { month: nsk.getUTCMonth() + 1, day: nsk.getUTCDate(), year: nsk.getUTCFullYear() };
}

export type BirthdayChild = {
  id: string;
  lastName: string;
  firstName: string;
  parentPhone: string;
  age: number;
};

/** Дети школы, у которых сегодня (по календарю Новосибирска) день рождения —
 * для утреннего списка у тренера. birthDate хранится как UTC-полночь
 * (см. parseDateInputValue), поэтому месяц/день читаем в UTC независимо от
 * часового пояса сервера. */
export async function getTodaysBirthdays(): Promise<BirthdayChild[]> {
  const { month, day, year } = novosibirskTodayParts();
  const children = await prisma.child.findMany({
    where: { status: "ACTIVE", birthDate: { not: null } },
    select: { id: true, lastName: true, firstName: true, parentPhone: true, birthDate: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return children
    .filter((c) => c.birthDate!.getUTCMonth() + 1 === month && c.birthDate!.getUTCDate() === day)
    .map((c) => ({
      id: c.id,
      lastName: c.lastName,
      firstName: c.firstName,
      parentPhone: c.parentPhone,
      age: year - c.birthDate!.getUTCFullYear(),
    }));
}

/**
 * Поздравления родителям — только если включено в настройках (по умолчанию
 * выключено, см. AppSettings/src/app/trainer/settings). Защита от дублей —
 * тот же паттерн: запись в BirthdayGreetingSent (уникальность по childId+год)
 * до реальной отправки, один push на семью, если именинников в ней несколько.
 */
export async function runBirthdayGreetings(): Promise<{ sent: number; alreadySent: number }> {
  const settings = await getAppSettings();
  if (!settings.sendBirthdayGreetings) {
    return { sent: 0, alreadySent: 0 };
  }

  const { year } = novosibirskTodayParts();
  const birthdays = await getTodaysBirthdays();
  let sent = 0;
  let alreadySent = 0;
  const entriesByPhone = new Map<string, FamilyReminderEntry[]>();

  for (const child of birthdays) {
    try {
      await prisma.birthdayGreetingSent.create({ data: { childId: child.id, year } });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        alreadySent++;
        continue;
      }
      throw err;
    }

    const childName = `${child.lastName} ${child.firstName}`;
    const list = entriesByPhone.get(child.parentPhone) ?? [];
    list.push({
      title: "С днём рождения! 🎉",
      body: `Поздравляем ${childName} с днём рождения! Команда Two Fins желает успехов в воде и вне её 🏊`,
    });
    entriesByPhone.set(child.parentPhone, list);
    sent++;
  }

  await sendCombinedFamilyPushes(entriesByPhone, "С днём рождения! 🎉");

  return { sent, alreadySent };
}
