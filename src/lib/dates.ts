import { format } from "date-fns";
import { ru } from "date-fns/locale";

/** YYYY-MM-DD в локальном времени (без сдвига по UTC), для <input type="date"> и ключей запросов. */
export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Разбирает YYYY-MM-DD в Date на полночь UTC — так же, как Prisma хранит @db.Date. */
export function parseDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateRu(date: Date, pattern = "d MMMM yyyy"): string {
  return format(date, pattern, { locale: ru });
}

export function formatDateShortRu(date: Date): string {
  return format(date, "d MMM", { locale: ru });
}
