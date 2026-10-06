import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * «Ходит без оплаты»: считаются ТОЛЬКО отметки «Пришёл» (PRESENT) с датой
 * позже «оплачено до» — или все отметки «Пришёл», если оплаты не было совсем.
 * Отработки (WORKOFF), допзанятия (EXTRA) и «Не пришёл» (ABSENT) не считаются,
 * поэтому и родитель, предупредивший через «Не придём», в долг не попадает —
 * это не отметка «Пришёл». Занятие в сам день «оплачено до» оплаченным
 * считается (сравнение строгое: дата > paidUntil).
 */
export type AttendanceDebt = { lastPresent: Date | null; unpaid: number };

type DebtRow = { id: string; lastPresent: Date | null; unpaid: number };

/** Последнее «Пришёл» и число занятий без оплаты для набора детей (одним запросом). */
export async function getAttendanceDebtForChildren(
  childIds: string[],
): Promise<Map<string, AttendanceDebt>> {
  const result = new Map<string, AttendanceDebt>();
  if (childIds.length === 0) return result;
  const rows = await prisma.$queryRaw<DebtRow[]>(Prisma.sql`
    SELECT c.id,
           max(a.date) FILTER (WHERE a.status = 'PRESENT') AS "lastPresent",
           (count(a.id) FILTER (
              WHERE a.status = 'PRESENT' AND (c."paidUntil" IS NULL OR a.date > c."paidUntil")
           ))::int AS unpaid
      FROM "Child" c
      LEFT JOIN "AttendanceRecord" a ON a."childId" = c.id
     WHERE c.id IN (${Prisma.join(childIds)})
     GROUP BY c.id`);
  for (const r of rows) result.set(r.id, { lastPresent: r.lastPresent, unpaid: r.unpaid });
  return result;
}

export type UnpaidChild = {
  id: string;
  lastName: string;
  firstName: string;
  groupName: string | null;
  paidUntil: Date | null;
  lastPresent: Date;
  unpaid: number;
};

/** Все дети, у которых есть хотя бы одно занятие без оплаты; больше долг — выше. */
export async function getChildrenWithoutPayment(): Promise<UnpaidChild[]> {
  return prisma.$queryRaw<UnpaidChild[]>(Prisma.sql`
    SELECT c.id, c."lastName", c."firstName", g.name AS "groupName", c."paidUntil",
           max(a.date) AS "lastPresent",
           (count(a.id) FILTER (WHERE c."paidUntil" IS NULL OR a.date > c."paidUntil"))::int AS unpaid
      FROM "Child" c
      JOIN "AttendanceRecord" a ON a."childId" = c.id AND a.status = 'PRESENT'
      LEFT JOIN "Group" g ON g.id = c."groupId"
     GROUP BY c.id, g.id
    HAVING count(a.id) FILTER (WHERE c."paidUntil" IS NULL OR a.date > c."paidUntil") > 0
     ORDER BY unpaid DESC, max(a.date) DESC, c."lastName" ASC`);
}

/** «1 занятие», «2 занятия», «5 занятий». */
export function formatLessonsCount(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "занятие"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "занятия"
        : "занятий";
  return `${n} ${word}`;
}

/** ДД.ММ из @db.Date (полночь UTC). */
export function formatDayMonth(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}
