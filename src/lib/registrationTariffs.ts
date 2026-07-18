// Фиксированные тарифы по общему числу занятий/мес (не сумма цен отдельных групп) —
// используются конструктором онлайн-записи, когда родитель добавляет доп. занятие
// в другой группе того же бассейна.
const LAZURNY_TARIFFS: Record<number, number> = { 4: 3600, 8: 6800, 12: 9000 };
const OLIMPIK_TARIFFS: Record<number, number> = { 8: 6200 };

export function sessionsPerMonth(daysOfWeek: string[]): number {
  return daysOfWeek.length * 4;
}

export type PricedGroup = {
  pool: string;
  pricePerMonth: number | null;
  daysOfWeek: string[];
};

/**
 * Итоговая цена по общему числу занятий/мес в бассейне базовой группы. Если
 * комбинация не покрыта фиксированным тарифом — запасной вариант: сумма цен
 * обеих групп по отдельности.
 */
export function computeCombinedPrice(
  baseGroup: PricedGroup,
  extraGroup: PricedGroup | null,
): number {
  const totalSessions =
    sessionsPerMonth(baseGroup.daysOfWeek) +
    (extraGroup ? sessionsPerMonth(extraGroup.daysOfWeek) : 0);
  const table = baseGroup.pool.includes("Олимпик") ? OLIMPIK_TARIFFS : LAZURNY_TARIFFS;
  const fixed = table[totalSessions];
  if (fixed != null) return fixed;
  return (baseGroup.pricePerMonth ?? 0) + (extraGroup?.pricePerMonth ?? 0);
}
