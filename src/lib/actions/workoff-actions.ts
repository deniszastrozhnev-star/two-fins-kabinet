"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";

/**
 * Экран "Отработки": отмечает, кто из показанных детей (весь поиск по школе)
 * сегодня пришёл на отработку в выбранную группу/занятие.
 * Отмеченные — получают/обновляют запись WORKOFF на эту дату+группу.
 * Снятые с отметки (были WORKOFF, но галочку убрали) — запись удаляется.
 */
export async function saveWorkoffAttendanceAction(formData: FormData) {
  await requireTrainer();

  const groupId = String(formData.get("groupId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  if (!groupId || !dateStr) {
    throw new Error("Не выбрана дата или группа отработки");
  }
  const date = parseDateInputValue(dateStr);

  const consideredIds = formData.getAll("childId").map(String);
  const checkedIds = formData.getAll("attended").map(String);
  const toRemove = consideredIds.filter((id) => !checkedIds.includes(id));

  if (toRemove.length > 0) {
    await prisma.attendanceRecord.deleteMany({
      where: {
        groupId,
        date,
        status: "WORKOFF",
        childId: { in: toRemove },
      },
    });
  }

  if (checkedIds.length > 0) {
    const children = await prisma.child.findMany({
      where: { id: { in: checkedIds } },
      select: { id: true, groupId: true },
    });
    const homeGroupById = new Map(children.map((c) => [c.id, c.groupId]));

    await prisma.$transaction(
      checkedIds.map((childId) =>
        prisma.attendanceRecord.upsert({
          where: { childId_groupId_date: { childId, groupId, date } },
          create: {
            childId,
            groupId,
            date,
            status: "WORKOFF",
            workoffClosesGroupId: homeGroupById.get(childId) ?? groupId,
          },
          update: {
            status: "WORKOFF",
            workoffClosesGroupId: homeGroupById.get(childId) ?? groupId,
          },
        }),
      ),
    );
  }

  revalidatePath("/trainer/workoffs");
  revalidatePath("/trainer/attendance");
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");
}
