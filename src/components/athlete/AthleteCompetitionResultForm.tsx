"use client";

import { useActionState, useRef, useEffect } from "react";
import { addAthleteCompetitionResultAction } from "@/lib/actions/athlete-competition-actions";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";
import { FIN_DISCIPLINE_LABELS, FIN_DISCIPLINE_ORDER, TIMING_LABELS } from "@/lib/labels";

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
        <FieldGroup label="Дисциплина" htmlFor="discipline">
          <Select id="discipline" name="discipline" defaultValue="" required>
            <option value="" disabled>
              Выберите дисциплину
            </option>
            {FIN_DISCIPLINE_ORDER.map((d) => (
              <option key={d} value={d}>
                {FIN_DISCIPLINE_LABELS[d]}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Хронометраж" htmlFor="timing">
          <Select id="timing" name="timing" defaultValue="AUTO" required>
            {(Object.keys(TIMING_LABELS) as (keyof typeof TIMING_LABELS)[]).map((t) => (
              <option key={t} value={t}>
                {TIMING_LABELS[t]}
              </option>
            ))}
          </Select>
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
