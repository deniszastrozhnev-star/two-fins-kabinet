"use client";

import { useActionState } from "react";
import { runPaymentRemindersNowAction } from "@/lib/actions/payment-reminder-actions";
import { SaveButton } from "@/components/trainer/SaveButton";

export function RunPaymentRemindersButton() {
  const [state, formAction] = useActionState(runPaymentRemindersNowAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-start gap-3">
      <SaveButton>Проверить сейчас</SaveButton>
      {state?.message && <p className="text-sm text-brand-text/70">{state.message}</p>}
    </form>
  );
}
