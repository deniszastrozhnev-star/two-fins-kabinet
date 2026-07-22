"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import type { TrainerRole } from "@prisma/client";

export type ActionState = { error?: string; success?: string } | undefined;

const VALID_ROLES: TrainerRole[] = ["HEAD", "TRAINER"];

export async function createTrainerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireHeadTrainer();

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  const role = VALID_ROLES.includes(roleRaw as TrainerRole)
    ? (roleRaw as TrainerRole)
    : "TRAINER";

  if (!username || !password) {
    return { error: "Заполните логин и пароль" };
  }
  if (password.length < 6) {
    return { error: "Пароль должен быть не короче 6 символов" };
  }

  const existing = await prisma.trainer.findUnique({ where: { username } });
  if (existing) {
    return { error: "Такой логин уже занят" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.trainer.create({ data: { username, passwordHash, role } });

  revalidatePath("/trainer/team");
  return { success: `Тренер «${username}» добавлен` };
}

export async function deleteTrainerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const current = await requireHeadTrainer();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Не найден тренер" };

  if (id === current.id) {
    return { error: "Нельзя удалить самого себя" };
  }

  const target = await prisma.trainer.findUnique({ where: { id } });
  if (!target) return { error: "Не найден тренер" };

  if (target.role === "HEAD") {
    const headCount = await prisma.trainer.count({ where: { role: "HEAD" } });
    if (headCount <= 1) {
      return { error: "Нельзя удалить последнего главного тренера" };
    }
  }

  const [attendanceCount, personalTrainingCount] = await Promise.all([
    prisma.attendanceRecord.count({ where: { markedByTrainerId: id } }),
    prisma.personalTraining.count({ where: { trainerId: id } }),
  ]);
  if (attendanceCount > 0 || personalTrainingCount > 0) {
    return {
      error:
        "Нельзя удалить тренера с историей посещаемости или персональных тренировок — она нужна для отчётов и зарплаты",
    };
  }

  await prisma.trainer.delete({ where: { id } });
  revalidatePath("/trainer/team");
  return { success: `Тренер «${target.username}» удалён` };
}

/** Закреплённые группы тренера — просто пометка "своих" групп, доступ к
 * отметке посещаемости/отработкам в других группах не ограничивает. */
export async function assignTrainerGroupsAction(formData: FormData) {
  await requireHeadTrainer();
  const trainerId = String(formData.get("trainerId") ?? "");
  if (!trainerId) throw new Error("Не найден тренер");

  const groupIds = formData.getAll("groupIds").map(String);
  await prisma.trainer.update({
    where: { id: trainerId },
    data: { groups: { set: groupIds.map((id) => ({ id })) } },
  });

  revalidatePath("/trainer/team");
  revalidatePath("/trainer");
  revalidatePath("/parent/trainers");
}
