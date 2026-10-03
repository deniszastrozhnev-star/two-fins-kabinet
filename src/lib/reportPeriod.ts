import "server-only";
import { formatDateRu } from "@/lib/dates";

const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время
export const REPORT_PERIOD_START_DAY = 25;

export type ReportPeriod = {
  /** YYYY-MM месяца, в котором период НАЧИНАЕТСЯ (25-го числа) — ключ в URL. */
  key: string;
  start: Date;
  end: Date;
  label: string;
  startLabel: string;
};

function monthKey(year: number, month0: number): string {
  const d = new Date(Date.UTC(year, month0, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Расчётный период «Панели с цифрами»: с 25 числа месяца по 24 число
 * следующего. Границы — полночь UTC, как хранятся @db.Date. */
export function getReportPeriod(startYear: number, startMonth0: number): ReportPeriod {
  const start = new Date(Date.UTC(startYear, startMonth0, REPORT_PERIOD_START_DAY));
  const end = new Date(Date.UTC(startYear, startMonth0 + 1, REPORT_PERIOD_START_DAY - 1));
  return {
    key: monthKey(startYear, startMonth0),
    start,
    end,
    label: `${formatDateRu(start, "d MMM")} — ${formatDateRu(end, "d MMM")}`,
    startLabel: formatDateRu(start, "d MMMM"),
  };
}

/** Текущий период: если сегодня (по Новосибирску) 25-е или позже — начался
 * 25-го этого месяца, иначе — 25-го прошлого. */
export function getCurrentReportPeriod(): ReportPeriod {
  const nowNsk = new Date(Date.now() + NOVOSIBIRSK_OFFSET_MS);
  const month0 = nowNsk.getUTCDate() >= REPORT_PERIOD_START_DAY ? nowNsk.getUTCMonth() : nowNsk.getUTCMonth() - 1;
  const d = new Date(Date.UTC(nowNsk.getUTCFullYear(), month0, 1));
  return getReportPeriod(d.getUTCFullYear(), d.getUTCMonth());
}

/** Период по ключу YYYY-MM из URL; null, если ключ не разобрать. */
export function reportPeriodFromKey(key: string | undefined): ReportPeriod | null {
  const m = key?.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const month0 = Number(m[2]) - 1;
  if (month0 < 0 || month0 > 11) return null;
  return getReportPeriod(Number(m[1]), month0);
}

/** Сдвиг ключа периода на delta месяцев (-1 — предыдущий, +1 — следующий). */
export function shiftReportPeriodKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(y, m - 1 + delta);
}

/** Период, в который попадает дата (для поиска самого раннего периода с данными). */
export function reportPeriodForDate(date: Date): ReportPeriod {
  const month0 = date.getUTCDate() >= REPORT_PERIOD_START_DAY ? date.getUTCMonth() : date.getUTCMonth() - 1;
  const d = new Date(Date.UTC(date.getUTCFullYear(), month0, 1));
  return getReportPeriod(d.getUTCFullYear(), d.getUTCMonth());
}
