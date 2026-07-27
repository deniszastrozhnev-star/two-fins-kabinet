import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Если у группы задана вместимость и она уже заполнена — ребёнок не получает
 * эту группу, а попадает в лист ожидания. Иначе — обычное назначение в группу.
 *
 * `SELECT ... FOR UPDATE` внутри транзакции блокирует именно строку этой
 * группы до конца транзакции — параллельные регистрации в ТУ ЖЕ группу
 * выстраиваются в очередь и видят актуальный count друг друга (без блокировки
 * без надобности — регистрации в разные группы идут параллельно). Без этого
 * при одновременном всплеске заявок (начало сезона) count читался одинаковым
 * у всех параллельных запросов до того, как кто-либо из них успевал
 * записать назначение — группа переполнялась сверх вместимости.
 */
export async function assignOrWaitlist(
  childId: string,
  groupId: string,
): Promise<{ waitlisted: boolean }> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { capacity: number | null }[]
    >`SELECT capacity FROM "Group" WHERE id = ${groupId} FOR UPDATE`;
    const capacity = rows[0]?.capacity ?? null;

    if (capacity != null) {
      const currentCount = await tx.child.count({ where: { groupId } });
      if (currentCount >= capacity) {
        await tx.groupWaitlist.upsert({
          where: { childId_groupId: { childId, groupId } },
          update: {},
          create: { childId, groupId },
        });
        return { waitlisted: true };
      }
    }
    await tx.child.update({ where: { id: childId }, data: { groupId } });
    return { waitlisted: false };
  }, { maxWait: 20000, timeout: 20000 });
  // Дефолтный maxWait Prisma (2с) слишком мал: при одновременном всплеске
  // заявок именно в ОДНУ и ту же популярную группу транзакции честно
  // выстраиваются в очередь на блокировку строки этой группы — без запаса
  // по ожиданию часть заявок падала бы с "Unable to start a transaction"
  // вместо того чтобы просто чуть дольше подождать своей очереди.
}
