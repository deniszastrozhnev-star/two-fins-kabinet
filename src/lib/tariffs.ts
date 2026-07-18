import "server-only";
import { prisma } from "@/lib/prisma";

/** Цена для родителя за одну персональную тренировку — не привязана к группе. */
export const PERSONAL_TRAINING_PRICE = 1800;

/** Комбинированный тариф из конструктора онлайн-записи (8 занятий/нед + доп. занятие = 12/мес),
    не совпадает с pricePerMonth ни одной отдельной группы — иначе OCR чека не узнает эту сумму. */
export const COMBINED_EXTRA_SESSION_TARIFF = 9000;

export type TariffMatch = { amount: number; label: string };

/** Все действующие тарифы школы: тарифы групп + персональная тренировка. */
export async function getKnownTariffs(): Promise<TariffMatch[]> {
  const groups = await prisma.group.findMany({
    where: { pricePerMonth: { not: null } },
    select: { name: true, pricePerMonth: true },
  });

  const tariffs: TariffMatch[] = groups.map((g) => ({
    amount: g.pricePerMonth!,
    label: `тариф группы «${g.name}»`,
  }));

  tariffs.push({
    amount: PERSONAL_TRAINING_PRICE,
    label: "персональная тренировка",
  });
  tariffs.push({
    amount: COMBINED_EXTRA_SESSION_TARIFF,
    label: "тариф 8 занятий/нед + допзанятие (12/мес)",
  });

  return tariffs;
}

/** Достаёт из текста числа-кандидаты (суммы) — пробелы/точки как разделители тысяч, запятая — копейки. */
export function extractAmountCandidates(text: string): number[] {
  const matches = text.match(/\d[\d\s.,]{1,9}\d|\d/g) ?? [];
  const amounts = matches
    .map((m) => {
      const normalized = m.replace(/[\s.](?=\d{3}(\D|$))/g, "").replace(",", ".");
      const value = Math.round(parseFloat(normalized));
      return Number.isFinite(value) ? value : null;
    })
    .filter((v): v is number => v !== null);
  return amounts;
}

/** Ищет среди кандидатов первое точное совпадение с действующим тарифом. */
export function matchTariff(
  candidates: number[],
  tariffs: TariffMatch[],
): TariffMatch | null {
  for (const candidate of candidates) {
    const match = tariffs.find((t) => t.amount === candidate);
    if (match) return match;
  }
  return null;
}
