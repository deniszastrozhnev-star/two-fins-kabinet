"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import type { AttendanceStatus } from "@prisma/client";

const VALID_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "WORKOFF"];

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function revalidateAttendancePaths(groupId: string) {
  revalidatePath("/trainer/attendance");
  revalidatePath(`/trainer/attendance/${groupId}`);
  revalidatePath("/trainer/workoffs");
  revalidatePath("/trainer/children");
  revalidatePath("/parent", "layout");
}

/**
 * Сохраняет посещаемость для набора детей на одном занятии (дата+группа) —
 * основной экран "Посещаемость". Дети без выбранного статуса (тренер ещё не
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

  const [group, children] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId }, select: { splitByAssignedTrainer: true } }),
    prisma.child.findMany({
      where: { id: { in: markedChildIds } },
      select: { id: true, groupId: true },
    }),
  ]);
  const homeGroupById = new Map(children.map((c) => [c.id, c.groupId]));

  if (!group?.splitByAssignedTrainer) {
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
    revalidateAttendancePaths(groupId);
    return;
  }

  // Совместная группа: закрепление ребёнка за тренером решается на лету — кто
  // первым отметил его на это занятие, тот его и "забрал" (зарплата считается
  // по markedByTrainerId). Одним upsert на всех тут не обойтись — он просто
  // перезаписал бы чужую отметку. Вместо этого каждый ребёнок обрабатывается
  // отдельно: если запись уже есть и принадлежит ДРУГОМУ тренеру — не трогаем,
  // это конфликт; если своя — обновляем; если её ещё нет — атомарный create,
  // защищённый уникальным индексом (childId, groupId, date) на уровне БД: если
  // второй тренер успел создать запись на долю секунды раньше, create падает
  // с P2002, и мы корректно считаем это конфликтом, а не перезаписываем чужое.
  const existing = await prisma.attendanceRecord.findMany({
    where: { groupId, date, childId: { in: markedChildIds } },
    select: { childId: true, markedByTrainerId: true },
  });
  const ownerByChild = new Map(existing.map((r) => [r.childId, r.markedByTrainerId]));
  const conflictChildIds: string[] = [];

  for (const childId of markedChildIds) {
    const status = String(formData.get(`status-${childId}`)) as AttendanceStatus;
    const workoffClosesGroupId =
      status === "WORKOFF" ? (homeGroupById.get(childId) ?? groupId) : null;
    const owner = ownerByChild.get(childId);

    if (owner && owner !== trainer.id) {
      conflictChildIds.push(childId);
      continue;
    }

    try {
      if (owner === trainer.id) {
        await prisma.attendanceRecord.update({
          where: { childId_groupId_date: { childId, groupId, date } },
          data: { status, workoffClosesGroupId, markedByTrainerId: trainer.id },
        });
      } else {
        await prisma.attendanceRecord.create({
          data: {
            childId,
            groupId,
            date,
            status,
            workoffClosesGroupId,
            markedByTrainerId: trainer.id,
          },
        });
      }
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        conflictChildIds.push(childId);
      } else {
        throw err;
      }
    }
  }

  revalidateAttendancePaths(groupId);

  const conflictParam = conflictChildIds.length > 0 ? `&conflicts=${conflictChildIds.join(",")}` : "";
  redirect(`/trainer/attendance/${groupId}?date=${dateStr}${conflictParam}`);
}
