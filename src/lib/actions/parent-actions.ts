"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { applyChildGroupChange } from "@/lib/childGroupChange";
import { isTodaysSessionUpcoming, todayNskDateInputValue } from "@/lib/sessionTiming";
import { parseDateInputValue } from "@/lib/dates";

export type ParentActionState = { error?: string; success?: string } | undefined;

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/** Родительский аналог трenерского updateChildGroupAction — тот же
 * конструктор и та же логика (лист ожидания, доп. занятие, пересчёт
 * тарифа), но только для СВОЕГО ребёнка и без подтверждения тренера. */
export async function changeOwnChildGroupAction(
  _prevState: ParentActionState,
  formData: FormData,
): Promise<ParentActionState> {
  const child = await requireParentChild();

  const groupId = String(formData.get("groupId") ?? "");
  const extraGroupId = String(formData.get("extraGroupId") ?? "") || null;

  const result = await applyChildGroupChange(child.id, groupId, extraGroupId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/parent", "layout");
  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${child.id}`);
  revalidatePath("/trainer/schedule");

  if (!groupId) {
    return { success: "Группа снята." };
  }

  const priceText = `Тариф: ${result.price!.toLocaleString("ru-RU")}₽/мес.`;
  const waitlistText = result.waitlisted
    ? " Мест в группе сейчас нет — ребёнок добавлен в лист ожидания."
    : "";

  return { success: `Группа изменена. ${priceText}${waitlistText}` };
}

/** «Сегодня не придём» — доступно только до начала сегодняшнего занятия
 * домашней группы (проверяется здесь же, а не только в UI). Начисляет
 * отработку сразу (см. getWorkoffBalance) и видно тренеру отдельной
 * пометкой на «Посещаемости», не как ручная отметка «Не пришёл». */
export async function notifyTodayAbsenceAction(
  _prevState: ParentActionState,
  _formData: FormData,
): Promise<ParentActionState> {
  const child = await requireParentChild();

  if (!child.groupId || !child.group) {
    return { error: "У ребёнка сейчас нет группы" };
  }
  if (!isTodaysSessionUpcoming(child.group)) {
    return { error: "Сегодня нет занятия или оно уже началось" };
  }

  const date = parseDateInputValue(todayNskDateInputValue());
  try {
    await prisma.parentAbsenceNotice.create({
      data: { childId: child.id, groupId: child.group.id, date },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { success: "Уже отмечено — тренер предупреждён." };
    }
    throw err;
  }

  revalidatePath("/parent");
  revalidatePath(`/trainer/attendance/${child.group.id}`);
  revalidatePath("/trainer/children");

  return { success: "Тренер предупреждён, отработка начислена." };
}
