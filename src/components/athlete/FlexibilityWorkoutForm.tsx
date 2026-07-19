"use client";

import { useActionState, useRef, useEffect } from "react";
import { addFlexibilityWorkoutAction } from "@/lib/actions/athlete-actions";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";

export function FlexibilityWorkoutForm() {
  const [state, formAction] = useActionState(addFlexibilityWorkoutAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Дата" htmlFor="flexDate">
          <Input
            id="flexDate"
            name="date"
            type="date"
            defaultValue={toDateInputValue(new Date())}
            required
          />
        </FieldGroup>
        <FieldGroup label="Время тренировки (мин)" htmlFor="flexDuration">
          <Input
            id="flexDuration"
            name="durationMinutes"
            type="number"
            min={1}
            inputMode="numeric"
            required
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Что тянул" htmlFor="flexTask">
        <Input id="flexTask" name="task" placeholder="шпагат, плечи, спина" required />
      </FieldGroup>

      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}

      <div className="flex justify-end">
        <SaveButton>Добавить тренировку</SaveButton>
      </div>
    </form>
  );
}
