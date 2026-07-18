"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import type { AttendanceStatus } from "@prisma/client";

/**
 * Экран "Отработки"/"Допзанятие": отмечает, кто из показанных детей (весь поиск
 * по школе) сегодня пришёл на отработку или доп. занятие в выбранную группу.
 * Отмеченные — получают/обновляют запись со статусом status на эту дату+группу.
 * Снятые с отметки — запись удаляется. workoffClosesGroupId проставляется только
 * для WORKOFF — для EXTRA он не имеет смысла (никакой пропуск не закрывается).
 */
export async function saveWorkoffAttendanceAction(formData: FormData) {
  const trainer = await requireTrainer();

  const groupId = String(formData.get("groupId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const statusRaw = String(formData.get("status") ?? "WORKOFF");
  const status: AttendanceStatus = statusRaw === "EXTRA" ? "EXTRA" : "WORKOFF";
  if (!groupId || !dateStr) {
    throw new Error("Не выбрана дата или группа");
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
        status,
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
            status,
            workoffClosesGroupId:
              status === "WORKOFF" ? (homeGroupById.get(childId) ?? groupId) : null,
            markedByTrainerId: trainer.id,
          },
          update: {
            status,
            workoffClosesGroupId:
              status === "WORKOFF" ? (homeGroupById.get(childId) ?? groupId) : null,
            markedByTrainerId: trainer.id,
          },
        }),
      ),
    );
  }

  revalidatePath("/trainer/workoffs");
  revalidatePath("/trainer/attendance");
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");

  const back = String(formData.get("back") ?? "");
  if (back === "attendance") {
    redirect(`/trainer/attendance?groupId=${groupId}&date=${dateStr}`);
  }
}
