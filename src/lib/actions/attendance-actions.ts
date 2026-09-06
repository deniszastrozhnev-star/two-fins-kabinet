"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import type { AttendanceStatus } from "@prisma/client";

const VALID_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "WORKOFF"];

/**
 * Сохраняет посещаемость для набора детей на одном занятии (дата+группа) —
 * основной экран "Посещаемость". Дети без выбранного статуса (трениер ещё не
 * отметил) пропускаются — никакая запись для них не создаётся и не трогается,
 * а не подставляется "Пришёл" по умолчанию.
 * workoffClosesGroupId (когда статус WORKOFF) всегда берётся из текущей домашней
 * группы ребёнка на сервере, а не от клиента.
 */
export async function saveAttendanceAction(formData: FormData) {
  const trainer = await requireTrainer();

  const groupId = String(formData.get("groupId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const childIds = formData.getAll("childId").map(String);

  if (!groupId || !dateStr || childIds.length === 0) {
    throw new Error("Не заполнены обязательные поля посещаемости");
  }
  const date = parseDateInputValue(dateStr);

  const markedChildIds = childIds.filter((childId) =>
    VALID_STATUSES.includes(String(formData.get(`status-${childId}`) ?? "") as AttendanceStatus),
  );
  if (markedChildIds.length === 0) {
    return;
  }

  const children = await prisma.child.findMany({
    where: { id: { in: markedChildIds } },
    select: { id: true, groupId: true },
  });
  const homeGroupById = new Map(children.map((c) => [c.id, c.groupId]));

  await prisma.$transaction(
    markedChildIds.map((childId) => {
      const status = String(formData.get(`status-${childId}`)) as AttendanceStatus;
      const workoffClosesGroupId =
        status === "WORKOFF" ? (homeGroupById.get(childId) ?? groupId) : null;

      return prisma.attendanceRecord.upsert({
        where: { childId_groupId_date: { childId, groupId, date } },
        create: {
          childId,
          groupId,
          date,
          status,
          workoffClosesGroupId,
          markedByTrainerId: trainer.id,
        },
        update: { status, workoffClosesGroupId, markedByTrainerId: trainer.id },
      });
    }),
  );

  revalidatePath("/trainer/attendance");
  revalidatePath(`/trainer/attendance/${groupId}`);
  revalidatePath("/trainer/workoffs");
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");
}
