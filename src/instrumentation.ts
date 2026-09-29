// Точка входа Next.js, вызывается один раз при старте серверного процесса.
// Используется, чтобы поднять фоновый планировщик суточных напоминаний
// (оплата/справка/дни рождения) — см. src/lib/dailyReminderScheduler.ts за
// объяснением, почему не Vercel Cron.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { startDailyReminderScheduler } = await import("@/lib/dailyReminderScheduler");
  startDailyReminderScheduler();
}
