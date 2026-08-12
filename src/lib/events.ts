import "server-only";

export function isEventPast(event: { dateStart: Date; dateEnd: Date | null }): boolean {
  return (event.dateEnd ?? event.dateStart) < new Date();
}

/** Актуальные события — ближайшие сверху; прошедшие — под ними, самые недавние сверху. */
export function sortEventsByRelevance<
  T extends { dateStart: Date; dateEnd: Date | null },
>(events: T[]): T[] {
  const upcoming = events
    .filter((e) => !isEventPast(e))
    .sort((a, b) => a.dateStart.getTime() - b.dateStart.getTime());
  const past = events
    .filter((e) => isEventPast(e))
    .sort((a, b) => b.dateStart.getTime() - a.dateStart.getTime());
  return [...upcoming, ...past];
}
