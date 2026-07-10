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
