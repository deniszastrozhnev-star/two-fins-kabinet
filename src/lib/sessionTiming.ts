import "server-only";
import { WEEKDAYS } from "@/lib/labels";

const NOVOSIBIRSK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, без перехода на летнее время

function nowInNovosibirsk(): Date {
  return new Date(Date.now() + NOVOSIBIRSK_OFFSET_MS);
}

function toDateInputValueUtc(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Сегодняшняя дата по Новосибирску в формате YYYY-MM-DD (для parseDateInputValue). */
export function todayNskDateInputValue(): string {
  return toDateInputValueUtc(nowInNovosibirsk());
}

/**
 * Ближайшее ещё не начавшееся занятие группы (по Новосибирску): сегодня, если
 * сегодня есть занятие и оно не началось, иначе первый следующий день из
 * расписания. Время группы — свободный текст тренера ("17:00–17:45", иногда с
 * другим разделителем), поэтому берём просто первое HH:MM в строке. Если
 * времени не разобрать — сегодняшний день пропускаем (нельзя понять, началось
 * ли занятие), берём следующий. null — если в расписании нет ни одного дня.
 */
export function nextUpcomingSession(
  group: { daysOfWeek: string[]; time: string },
): { dateInputValue: string; weekday: string } | null {
  const now = nowInNovosibirsk();
  // Тренеры пишут время и через двоеточие ("17:00"), и через точку ("12.00").
  const match = group.time.match(/(\d{1,2})[:.](\d{2})/);
  const startMinutes = match ? Number(match[1]) * 60 + Number(match[2]) : null;
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const weekday = WEEKDAYS[(day.getUTCDay() + 6) % 7];
    if (!group.daysOfWeek.includes(weekday)) continue;
    if (offset === 0 && (startMinutes === null || nowMinutes >= startMinutes)) continue;
    return { dateInputValue: toDateInputValueUtc(day), weekday };
  }
  return null;
}
