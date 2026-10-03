import "server-only";
import { formatDateRu } from "@/lib/dates";

const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время
export const REPORT_PERIOD_START_DAY = 25;

/**
 * Расчётный период «Панели с цифрами»: с 25 числа месяца по 24 число
 * следующего. Если сегодня (по Новосибирску) 25-е или позже — период
 * начался 25-го этого месяца, иначе — 25-го прошлого. Границы — полночь UTC,
 * как хранятся @db.Date (см. parseDateInputValue).
 */
export function getCurrentReportPeriod(): { start: Date; end: Date; label: string; startLabel: string } {
  const nowNsk = new Date(Date.now() + NOVOSIBIRSK_OFFSET_MS);
  const year = nowNsk.getUTCFullYear();
  const month = nowNsk.getUTCMonth();
  const startMonth = nowNsk.getUTCDate() >= REPORT_PERIOD_START_DAY ? month : month - 1;

  const start = new Date(Date.UTC(year, startMonth, REPORT_PERIOD_START_DAY));
  const end = new Date(Date.UTC(year, startMonth + 1, REPORT_PERIOD_START_DAY - 1));

  return {
    start,
    end,
    label: `${formatDateRu(start, "d MMMM")} — ${formatDateRu(end, "d MMMM")}`,
    startLabel: formatDateRu(start, "d MMMM"),
  };
}
