"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { notifyTodayAbsenceAction } from "@/lib/actions/parent-actions";
import { Button } from "@/components/ui/Button";

function SubmitButton({ sessionLabel }: { sessionLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? "Отмечаем…" : `Не придём на ближайшее занятие (${sessionLabel})`}
    </Button>
  );
}

/** Кнопка «Не придём на ближайшее занятие» — доступна всегда; отметка
 * относится к ближайшему ещё не начавшемуся занятию (дата считается на
 * сервере и показана в подписи). После нажатия начисляется отработка, а
 * тренер видит пометку в посещаемости на этот день. */
export function TodayAbsenceButton({
  alreadyNotified,
  sessionLabel,
}: {
  alreadyNotified: boolean;
  sessionLabel: string;
}) {
  const [state, formAction] = useActionState(notifyTodayAbsenceAction, undefined);

  const notified = alreadyNotified || state?.success != null;

  if (notified) {
    return (
      <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
        Тренер предупреждён: на ближайшее занятие ({sessionLabel}) вы не придёте.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton sessionLabel={sessionLabel} />
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
    </form>
  );
}
