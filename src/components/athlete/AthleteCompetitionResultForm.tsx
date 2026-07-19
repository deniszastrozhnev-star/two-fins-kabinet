"use client";

import { useActionState, useRef, useEffect } from "react";
import { addAthleteCompetitionResultAction } from "@/lib/actions/athlete-competition-actions";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";

export function AthleteCompetitionResultForm() {
  const [state, formAction] = useActionState(addAthleteCompetitionResultAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <FieldGroup label="Название соревнования" htmlFor="competitionName">
        <Input id="competitionName" name="competitionName" placeholder="Городские соревнования" required />
      </FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Дата" htmlFor="competitionDate">
          <Input
            id="competitionDate"
            name="date"
            type="date"
            defaultValue={toDateInputValue(new Date())}
            required
          />
        </FieldGroup>
        <FieldGroup label="Результат (время)" htmlFor="result" hint="Формат: 32.45 или 1:02.34">
          <Input id="result" name="result" placeholder="32.45" required />
        </FieldGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Дистанция" htmlFor="distance">
          <Input id="distance" name="distance" placeholder="50 м" required />
        </FieldGroup>
        <FieldGroup label="Стиль" htmlFor="style">
          <Input id="style" name="style" placeholder="кроль" required />
        </FieldGroup>
      </div>

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
        <SaveButton>Добавить результат</SaveButton>
      </div>
    </form>
  );
}
