"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth";
import { applyChildGroupChange } from "@/lib/childGroupChange";

export type ChildGroupActionState = { error?: string; success?: string } | undefined;

/** Тот же конструктор, что в онлайн-записи: группа (по листу ожидания при
 * нехватке мест) + не более одного доп. занятия в группе того же бассейна,
 * с числом занятий в неделю, производным от расписания выбранной группы
 * (как и при онлайн-записи, а не произвольным числом от тренера). */
export async function updateChildGroupAction(
  _prevState: ChildGroupActionState,
  formData: FormData,
): Promise<ChildGroupActionState> {
  await requireTrainer();

  const childId = String(formData.get("childId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const extraGroupId = String(formData.get("extraGroupId") ?? "") || null;
  if (!childId) return { error: "Не найден ребёнок" };

  const result = await applyChildGroupChange(childId, groupId, extraGroupId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${childId}`);
  revalidatePath("/trainer/schedule");
  revalidatePath("/parent", "layout");

  if (!groupId) {
    return { success: "Ребёнок убран из группы." };
  }

  const priceText = `Тариф пересчитан: ${result.price!.toLocaleString("ru-RU")}₽/мес.`;
  const waitlistText = result.waitlisted
    ? " Мест в группе сейчас нет — ребёнок добавлен в лист ожидания."
    : "";

  return { success: `Сохранено. ${priceText}${waitlistText}` };
}
