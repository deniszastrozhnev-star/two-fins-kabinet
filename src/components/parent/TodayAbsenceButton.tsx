"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { notifyTodayAbsenceAction } from "@/lib/actions/parent-actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? "Отмечаем…" : "Сегодня не придём"}
    </Button>
  );
}

/** Кнопка "Сегодня не придём" — показывается родителю, только пока сегодняшнее
 * занятие ещё не началось (проверено уже на сервере, до рендера); после
 * нажатия начисляется отработка и тренер видит пометку в посещаемости. */
export function TodayAbsenceButton({ alreadyNotified }: { alreadyNotified: boolean }) {
  const [state, formAction] = useActionState(notifyTodayAbsenceAction, undefined);

  const notified = alreadyNotified || state?.success != null;

  if (notified) {
    return (
      <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
        Тренер предупреждён, что сегодня вы не придёте.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton />
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
    </form>
  );
}
