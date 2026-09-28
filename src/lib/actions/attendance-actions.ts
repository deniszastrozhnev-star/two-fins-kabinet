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
 * основной экран "Посещаемость". Статус-пикер всегда шлёт значение (валидный
 * статус либо "" при повторном клике на уже выбранный — снятие отметки).
 * Пустое значение при отсутствующей записи — no-op (ребёнка никогда не
 * отмечали); пустое значение при существующей записи — запись УДАЛЯЕТСЯ (а не
 * подставляется "Не пришёл"), это и есть "снятие отметки".
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

  const statusByChild = new Map(
    childIds.map((childId) => [childId, String(formData.get(`status-${childId}`) ?? "")]),
  );
  const markedChildIds = childIds.filter((id) =>
    VALID_STATUSES.includes(statusByChild.get(id) as AttendanceStatus),
  );
  const clearCandidateIds = childIds.filter(
    (id) => !VALID_STATUSES.includes(statusByChild.get(id) as AttendanceStatus),
  );

  const [group, children, existingForClear] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId }, select: { splitByAssignedTrainer: true } }),
    prisma.child.findMany({
      where: { id: { in: markedChildIds } },
      select: { id: true, groupId: true },
    }),
    clearCandidateIds.length > 0
      ? prisma.attendanceRecord.findMany({
          where: { groupId, date, childId: { in: clearCandidateIds } },
          select: { id: true, childId: true, markedByTrainerId: true },
        })
      : Promise.resolve([]),
  ]);
  const homeGroupById = new Map(children.map((c) => [c.id, c.groupId]));

  if (markedChildIds.length === 0 && existingForClear.length === 0) {
    return;
  }

  if (!group?.splitByAssignedTrainer) {
    await prisma.$transaction([
      ...markedChildIds.map((childId) => {
        const status = statusByChild.get(childId) as AttendanceStatus;
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
      ...(existingForClear.length > 0
        ? [
            prisma.attendanceRecord.deleteMany({
              where: { id: { in: existingForClear.map((r) => r.id) } },
            }),
          ]
        : []),
    ]);
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
  // Снятие отметки (clear) в совместной группе освобождает ребёнка: запись
  // удаляется, и на следующем сохранении его снова может "забрать" любой
  // тренер — чужие записи снятием не трогаем, это тоже конфликт.
  const existingForMark = await prisma.attendanceRecord.findMany({
    where: { groupId, date, childId: { in: markedChildIds } },
    select: { childId: true, markedByTrainerId: true },
  });
  const ownerByChild = new Map(existingForMark.map((r) => [r.childId, r.markedByTrainerId]));
  const conflictChildIds: string[] = [];

  for (const childId of markedChildIds) {
    const status = statusByChild.get(childId) as AttendanceStatus;
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

  const clearableIds = existingForClear
    .filter((r) => r.markedByTrainerId === trainer.id)
    .map((r) => r.id);
  const foreignClearChildIds = existingForClear
    .filter((r) => r.markedByTrainerId !== trainer.id)
    .map((r) => r.childId);

  if (clearableIds.length > 0) {
    await prisma.attendanceRecord.deleteMany({ where: { id: { in: clearableIds } } });
  }
  conflictChildIds.push(...foreignClearChildIds);

  revalidateAttendancePaths(groupId);

  const conflictParam = conflictChildIds.length > 0 ? `&conflicts=${conflictChildIds.join(",")}` : "";
  redirect(`/trainer/attendance/${groupId}?date=${dateStr}${conflictParam}`);
}
