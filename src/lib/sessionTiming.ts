import "server-only";
import { WEEKDAYS } from "@/lib/labels";

const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время

function nowInNovosibirsk(): Date {
  return new Date(Date.now() + NOVOSIBIRSK_OFFSET_MS);
}

/** Сегодняшняя дата по Новосибирску в формате YYYY-MM-DD (для parseDateInputValue). */
export function todayNskDateInputValue(): string {
  const now = nowInNovosibirsk();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Есть ли у группы занятие сегодня (по Новосибирску) и не началось ли оно ещё.
 * Время группы — свободный текст тренера ("17:00–17:45", иногда с другим
 * разделителем), поэтому берём просто первое HH:MM в строке, не полагаясь на
 * конкретный символ-разделитель.
 */
export function isTodaysSessionUpcoming(group: { daysOfWeek: string[]; time: string }): boolean {
  const now = nowInNovosibirsk();
  const todayLabel = WEEKDAYS[(now.getUTCDay() + 6) % 7];
  if (!group.daysOfWeek.includes(todayLabel)) return false;

  const match = group.time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return nowMinutes < startMinutes;
}
