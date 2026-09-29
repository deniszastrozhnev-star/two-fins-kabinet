"use server";

import { requireHeadTrainer } from "@/lib/auth";
import { runPaymentReminders } from "@/lib/paymentReminders";

export type RunRemindersState = { message: string } | undefined;

/**
 * Ручной запуск для HEAD-тренера — тот же самый код, что и суточный
 * планировщик (src/lib/paymentReminderScheduler.ts). Защита от дублей на
 * уровне БД (PaymentReminderSent) означает, что повторный запуск в тот же
 * день безопасен: уже отправленные напоминания просто не отправятся снова.
 * Полезно и для проверки настройки, и как подстраховка, если сервер
 * перезапустился ровно в 10:00 по Новосибирску и суточный тик пропустился.
 */
export async function runPaymentRemindersNowAction(
  _prevState: RunRemindersState,
): Promise<RunRemindersState> {
  await requireHeadTrainer();
  const { sent, alreadySent } = await runPaymentReminders();
  return {
    message:
      sent > 0
        ? `Отправлено новых напоминаний: ${sent}${alreadySent > 0 ? ` (уже было отправлено ранее: ${alreadySent})` : ""}.`
        : `Новых напоминаний нет${alreadySent > 0 ? ` (уже было отправлено ранее: ${alreadySent})` : " — подходящих детей не найдено"}.`,
  };
}
