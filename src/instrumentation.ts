// Точка входа Next.js, вызывается один раз при старте серверного процесса.
// Используется, чтобы поднять фоновый планировщик напоминаний об оплате —
// см. src/lib/paymentReminderScheduler.ts за объяснением, почему не Vercel Cron.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { startPaymentReminderScheduler } = await import("@/lib/paymentReminderScheduler");
  startPaymentReminderScheduler();
}
