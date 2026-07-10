import "server-only";
import { prisma } from "@/lib/prisma";

/** Остаток отработок ребёнка = кол-во "не пришёл" − кол-во "отработка". Считается на лету, нигде не хранится. */
export async function getWorkoffBalance(childId: string): Promise<number> {
  const [absent, workoff] = await Promise.all([
    prisma.attendanceRecord.count({ where: { childId, status: "ABSENT" } }),
    prisma.attendanceRecord.count({ where: { childId, status: "WORKOFF" } }),
  ]);
  return absent - workoff;
}

/** То же самое батчем для списка детей (без N+1 запросов). */
export async function getWorkoffBalances(
  childIds: string[],
): Promise<Map<string, number>> {
  const balances = new Map<string, number>(childIds.map((id) => [id, 0]));
  if (childIds.length === 0) return balances;

  const grouped = await prisma.attendanceRecord.groupBy({
    by: ["childId", "status"],
    where: { childId: { in: childIds }, status: { in: ["ABSENT", "WORKOFF"] } },
    _count: { _all: true },
  });

  for (const row of grouped) {
    const delta = row.status === "ABSENT" ? row._count._all : -row._count._all;
    balances.set(row.childId, (balances.get(row.childId) ?? 0) + delta);
  }

  return balances;
}
