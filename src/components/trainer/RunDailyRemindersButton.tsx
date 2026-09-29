"use client";

import { useActionState } from "react";
import { runDailyRemindersNowAction } from "@/lib/actions/daily-reminder-actions";
import { SaveButton } from "@/components/trainer/SaveButton";

export function RunDailyRemindersButton() {
  const [state, formAction] = useActionState(runDailyRemindersNowAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-start gap-3">
      <SaveButton>Проверить сейчас</SaveButton>
      {state?.message && <p className="text-sm text-brand-text/70">{state.message}</p>}
    </form>
  );
}
