/** Приводит номер телефона к каноническому виду (11 цифр, начинается на 7) для сравнения и хранения. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return "7" + digits.slice(1);
  }
  if (digits.length === 10) {
    return "7" + digits;
  }
  return digits;
}

/** Форматирует нормализованный номер для отображения: +7 916 123-45-67 */
export function formatPhone(normalized: string): string {
  if (normalized.length !== 11) return normalized;
  const c = normalized;
  return `+${c[0]} ${c.slice(1, 4)} ${c.slice(4, 7)}-${c.slice(7, 9)}-${c.slice(9, 11)}`;
}
