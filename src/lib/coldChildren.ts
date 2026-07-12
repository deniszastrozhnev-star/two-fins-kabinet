import "server-only";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export type ColdChild = {
  id: string;
  lastName: string;
  firstName: string;
  note: string | null;
  groupName: string | null;
  lastAttendedAt: Date | null;
};

/**
 * Активные дети, которых не было ни на своём занятии, ни на отработке
 * последние 30 дней (или вообще ни разу, если зарегистрированы больше 30 дней назад).
 */
export async function getColdChildren(): Promise<ColdChild[]> {
  const cutoff = subDays(new Date(), 30);

  const children = await prisma.child.findMany({
    where: { status: "ACTIVE" },
    include: {
      group: { select: { name: true } },
      attendanceRecords: {
        where: { status: { in: ["PRESENT", "WORKOFF"] } },
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return children
    .filter((c) => {
      const last = c.attendanceRecords[0]?.date ?? null;
      if (last) return last < cutoff;
      return c.createdAt < cutoff;
    })
    .map((c) => ({
      id: c.id,
      lastName: c.lastName,
      firstName: c.firstName,
      note: c.note,
      groupName: c.group?.name ?? null,
      lastAttendedAt: c.attendanceRecords[0]?.date ?? null,
    }));
}
