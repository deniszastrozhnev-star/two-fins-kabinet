"use server";

import { revalidatePath } from "next/cache";
import { requireHeadTrainer } from "@/lib/auth";
import { setMonthlyRent } from "@/lib/financeSettings";

export type ActionState = { error?: string; success?: string } | undefined;

export async function updateMonthlyRentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireHeadTrainer();

  const raw = String(formData.get("monthlyRentRub") ?? "").trim();
  const monthlyRentRub = Number(raw);
  if (!Number.isFinite(monthlyRentRub) || monthlyRentRub < 0) {
    return { error: "Укажите корректную сумму аренды" };
  }

  await setMonthlyRent(Math.round(monthlyRentRub));
  revalidatePath("/trainer/metrics");
  return { success: "Сумма аренды сохранена" };
}
