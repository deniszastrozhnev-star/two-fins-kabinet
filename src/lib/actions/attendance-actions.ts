"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import type { AttendanceStatus } from "@prisma/client";

const VALID_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "WORKOFF"];

/**
 * Сохраняет посещаемость для набора детей на одном занятии (дата+группа).
 * Используется и обычным экраном "Посещаемость", и экраном "Отработки" —
 * в обоих случаях groupId — это группа/занятие, на котором физически была отметка,
 * а workoffClosesGroupId (когда статус WORKOFF) всегда берётся из текущей домашней
 * группы ребёнка на сервере, а не от клиента.
 */
export async function saveAttendanceAction(formData: FormData) {
  await requireTrainer();

  const groupId = String(formData.get("groupId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const childIds = formData.getAll("childId").map(String);

  if (!groupId || !dateStr || childIds.length === 0) {
    throw new Error("Не заполнены обязательные поля посещаемости");
  }
  const date = parseDateInputValue(dateStr);

  const children = await prisma.child.findMany({
    where: { id: { in: childIds } },
    select: { id: true, groupId: true },
  });
  const homeGroupById = new Map(children.map((c) => [c.id, c.groupId]));

  await prisma.$transaction(
    childIds.map((childId) => {
      const rawStatus = String(formData.get(`status-${childId}`) ?? "");
      const status = VALID_STATUSES.includes(rawStatus as AttendanceStatus)
        ? (rawStatus as AttendanceStatus)
        : "PRESENT";
      const workoffClosesGroupId =
        status === "WORKOFF" ? (homeGroupById.get(childId) ?? groupId) : null;

      return prisma.attendanceRecord.upsert({
        where: { childId_groupId_date: { childId, groupId, date } },
        create: { childId, groupId, date, status, workoffClosesGroupId },
        update: { status, workoffClosesGroupId },
      });
    }),
  );

  revalidatePath("/trainer/attendance");
  revalidatePath("/trainer/workoffs");
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");
}
