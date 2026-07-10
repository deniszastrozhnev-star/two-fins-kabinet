"use server";

import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export type ActionState = { error?: string; success?: string } | undefined;

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const trainer = await requireTrainer();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const newPasswordConfirm = String(formData.get("newPasswordConfirm") ?? "");

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return { error: "Заполните все поля" };
  }
  if (newPassword.length < 6) {
    return { error: "Новый пароль должен быть не короче 6 символов" };
  }
  if (newPassword !== newPasswordConfirm) {
    return { error: "Новый пароль и подтверждение не совпадают" };
  }

  const ok = await verifyPassword(currentPassword, trainer.passwordHash);
  if (!ok) {
    return { error: "Текущий пароль указан неверно" };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.trainer.update({
    where: { id: trainer.id },
    data: { passwordHash },
  });

  return { success: "Пароль успешно изменён" };
}
