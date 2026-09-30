import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Остаток отработок = кол-во "не пришёл" (включая предупреждения родителя,
 * см. ниже) − кол-во "отработка". Считается на лету, нигде не хранится.
 *
 * ParentAbsenceNotice ("сегодня не придём" из кабинета родителя) даёт право
 * на отработку сразу при создании, без участия тренера — но если тренер
 * ВСЁ РАВНО потом сам отметит реальную посещаемость на тот же день и группу
 * (Пришёл/Не пришёл/Отработка), именно эта отметка в приоритете: уведомление
 * считается только пока по нему нет отдельной записи AttendanceRecord —
 * иначе один и тот же пропуск задвоил бы начисление.
 */
async function countLiveNotices(
  notices: { groupId: string; date: Date }[],
  recorded: { groupId: string; date: Date }[],
): Promise<number> {
  const recordedKeys = new Set(recorded.map((r) => `${r.groupId}_${r.date.getTime()}`));
  return notices.filter((n) => !recordedKeys.has(`${n.groupId}_${n.date.getTime()}`)).length;
}

export async function getWorkoffBalance(childId: string): Promise<number> {
  const [absent, workoff, notices, recorded] = await Promise.all([
    prisma.attendanceRecord.count({ where: { childId, status: "ABSENT" } }),
    prisma.attendanceRecord.count({ where: { childId, status: "WORKOFF" } }),
    prisma.parentAbsenceNotice.findMany({ where: { childId }, select: { groupId: true, date: true } }),
    prisma.attendanceRecord.findMany({ where: { childId }, select: { groupId: true, date: true } }),
  ]);
  const liveNotices = await countLiveNotices(notices, recorded);
  return absent + liveNotices - workoff;
}

/** То же самое батчем для списка детей (без N+1 запросов). */
export async function getWorkoffBalances(
  childIds: string[],
): Promise<Map<string, number>> {
  const balances = new Map<string, number>(childIds.map((id) => [id, 0]));
  if (childIds.length === 0) return balances;

  const [grouped, notices, recorded] = await Promise.all([
    prisma.attendanceRecord.groupBy({
      by: ["childId", "status"],
      where: { childId: { in: childIds }, status: { in: ["ABSENT", "WORKOFF"] } },
      _count: { _all: true },
    }),
    prisma.parentAbsenceNotice.findMany({
      where: { childId: { in: childIds } },
      select: { childId: true, groupId: true, date: true },
    }),
    prisma.attendanceRecord.findMany({
      where: { childId: { in: childIds } },
      select: { childId: true, groupId: true, date: true },
    }),
  ]);

  for (const row of grouped) {
    const delta = row.status === "ABSENT" ? row._count._all : -row._count._all;
    balances.set(row.childId, (balances.get(row.childId) ?? 0) + delta);
  }

  const recordedKeys = new Set(recorded.map((r) => `${r.childId}_${r.groupId}_${r.date.getTime()}`));
  for (const n of notices) {
    const key = `${n.childId}_${n.groupId}_${n.date.getTime()}`;
    if (!recordedKeys.has(key)) {
      balances.set(n.childId, (balances.get(n.childId) ?? 0) + 1);
    }
  }

  return balances;
}
