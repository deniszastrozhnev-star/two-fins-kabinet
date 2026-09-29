import "server-only";
import { runPaymentReminders } from "@/lib/paymentReminders";

const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время (Россия его не использует)
const DAY_MS = 24 * 60 * 60 * 1000;
const TARGET_HOUR_NSK = 10;

function msUntilNext10AmNovosibirsk(): number {
  const now = new Date();
  const nowNsk = new Date(now.getTime() + NOVOSIBIRSK_OFFSET_MS);
  const targetNskUtcStamp = Date.UTC(
    nowNsk.getUTCFullYear(),
    nowNsk.getUTCMonth(),
    nowNsk.getUTCDate(),
    TARGET_HOUR_NSK,
    0,
    0,
    0,
  );
  let targetUtcMs = targetNskUtcStamp - NOVOSIBIRSK_OFFSET_MS;
  if (targetUtcMs <= now.getTime()) {
    targetUtcMs += DAY_MS;
  }
  return targetUtcMs - now.getTime();
}

let started = false;

/**
 * Планировщик напоминаний об оплате — целиком внутри процесса Next.js, без
 * Vercel Cron. На Timeweb Cloud приложение работает как обычный долгоживущий
 * Node-процесс (не serverless-функции по запросу, как на Vercel), поэтому
 * внешний тригер не нужен: процесс сам просыпается раз в сутки в 10:00 по
 * Новосибирску. Защита от дублей — не здесь, а на уровне БД
 * (PaymentReminderSent, уникальный индекс) в runPaymentReminders, так что
 * повторный запуск/несколько инстансов процесса не приведут к повторной
 * отправке одного и того же напоминания.
 * Запускается один раз при старте сервера (см. src/instrumentation.ts) и
 * только в проде — в локальной разработке фоновый планировщик не нужен.
 */
export function startPaymentReminderScheduler(): void {
  if (started) return;
  started = true;

  const run = () => {
    runPaymentReminders()
      .then(({ sent, alreadySent }) => {
        console.log(`paymentReminders: отправлено ${sent}, уже было отправлено ранее ${alreadySent}`);
      })
      .catch((err) => console.error("paymentReminders: сбой", err));
  };

  const delay = msUntilNext10AmNovosibirsk();
  setTimeout(() => {
    run();
    setInterval(run, DAY_MS);
  }, delay);
}
