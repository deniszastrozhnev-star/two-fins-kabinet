"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addPoolWorkoutAction } from "@/lib/actions/athlete-actions";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";
import { COURSE_DISTANCES } from "@/lib/labels";

export function PoolWorkoutForm({ hasLinkedChild }: { hasLinkedChild: boolean }) {
  const [state, formAction] = useActionState(addPoolWorkoutAction, undefined);
  const [isCourse, setIsCourse] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setIsCourse(false);
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

      {hasLinkedChild && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isCourse"
              checked={isCourse}
              onChange={(e) => setIsCourse(e.target.checked)}
              className="h-4 w-4"
            />
            Это курсовка
          </label>
          {isCourse && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Дистанция" htmlFor="courseDistance">
                <Select id="courseDistance" name="courseDistance" defaultValue={COURSE_DISTANCES[1]}>
                  {COURSE_DISTANCES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Время" htmlFor="courseTime" hint="Формат: 32.45 или 1:02.34">
                <Input id="courseTime" name="courseTime" placeholder="32.45" required={isCourse} />
              </FieldGroup>
            </div>
          )}
        </div>
      )}

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
