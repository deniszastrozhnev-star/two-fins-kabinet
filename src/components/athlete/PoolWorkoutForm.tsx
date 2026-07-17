"use client";

import { useActionState, useRef, useEffect } from "react";
import { addPoolWorkoutAction } from "@/lib/actions/athlete-actions";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";

export function PoolWorkoutForm() {
  const [state, formAction] = useActionState(addPoolWorkoutAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Дата" htmlFor="poolDate">
          <Input
            id="poolDate"
            name="date"
            type="date"
            defaultValue={toDateInputValue(new Date())}
            required
          />
        </FieldGroup>
        <FieldGroup label="Объём за тренировку (м)" htmlFor="volumeMeters">
          <Input
            id="volumeMeters"
            name="volumeMeters"
            type="number"
            min={1}
            inputMode="numeric"
            required
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Задание" htmlFor="poolTask">
        <Input id="poolTask" name="task" placeholder="4×100 кроль" required />
      </FieldGroup>
      <FieldGroup label="Самочувствие" htmlFor="poolFeeling" hint="Что болит/не болит, где было тяжело">
        <Textarea id="poolFeeling" name="feeling" rows={2} />
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
