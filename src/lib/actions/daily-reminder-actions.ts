"use server";

import { revalidatePath } from "next/cache";
import { requireHeadTrainer } from "@/lib/auth";
import { runDailyReminders } from "@/lib/dailyReminderScheduler";
import { setSendBirthdayGreetings } from "@/lib/appSettings";

export type RunRemindersState = { message: string } | undefined;

/**
 * Ручной запуск для HEAD-тренера — тот же самый код, что и суточный
 * планировщик (src/lib/dailyReminderScheduler.ts): оплата, справки, дни
 * рождения одним запуском. Защита от дублей — на уровне БД в каждой из
 * run*-функций, повторный запуск в тот же день безопасен. Полезно и для
 * проверки настройки, и как подстраховка, если сервер перезапустился ровно
 * в 10:00 по Новосибирску и суточный тик пропустился.
 */
export async function runDailyRemindersNowAction(
  _prevState: RunRemindersState,
): Promise<RunRemindersState> {
  await requireHeadTrainer();
  const { payment, medical, birthdays } = await runDailyReminders();

  const parts = [
    `оплата: ${payment.sent} новых${payment.alreadySent > 0 ? `, ${payment.alreadySent} уже было` : ""}`,
    `справки: ${medical.sent} новых${medical.alreadySent > 0 ? `, ${medical.alreadySent} уже было` : ""}`,
    `дни рождения: ${birthdays.sent} новых${birthdays.alreadySent > 0 ? `, ${birthdays.alreadySent} уже было` : ""}`,
  ];

  return { message: parts.join(" · ") };
}

export async function setSendBirthdayGreetingsAction(formData: FormData) {
  await requireHeadTrainer();
  const enabled = formData.get("enabled") === "on";
  await setSendBirthdayGreetings(enabled);
  revalidatePath("/trainer/settings");
}
