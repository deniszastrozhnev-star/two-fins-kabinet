import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Если у группы задана вместимость и она уже заполнена — ребёнок не получает
 * эту группу, а попадает в лист ожидания. Иначе — обычное назначение в группу.
 */
export async function assignOrWaitlist(
  childId: string,
  groupId: string,
): Promise<{ waitlisted: boolean }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { capacity: true },
  });
  if (group?.capacity != null) {
    const currentCount = await prisma.child.count({ where: { groupId } });
    if (currentCount >= group.capacity) {
      await prisma.groupWaitlist.upsert({
        where: { childId_groupId: { childId, groupId } },
        update: {},
        create: { childId, groupId },
      });
      return { waitlisted: true };
    }
  }
  await prisma.child.update({ where: { id: childId }, data: { groupId } });
  return { waitlisted: false };
}
