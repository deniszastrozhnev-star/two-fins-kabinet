/** Разбирает время заплыва ("32.45", "32,45", "1:02.34") в сотые доли секунды. null — если не разобрать. */
export function parseSwimTime(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  const match = trimmed.match(/^(?:(\d+):)?(\d{1,2})(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  const fraction = match[3] ? Number(match[3].padEnd(2, "0")) : 0;
  if (seconds >= 60) return null;

  return minutes * 6000 + seconds * 100 + fraction;
}

/** Форматирует сотые доли секунды обратно в "1:02.34" (или "32.45" без минут). */
export function formatSwimTime(centis: number): string {
  const minutes = Math.floor(centis / 6000);
  const seconds = Math.floor((centis % 6000) / 100);
  const fraction = centis % 100;
  const secStr = seconds.toString().padStart(2, "0");
  const fracStr = fraction.toString().padStart(2, "0");
  return minutes > 0 ? `${minutes}:${secStr}.${fracStr}` : `${seconds}.${fracStr}`;
}
