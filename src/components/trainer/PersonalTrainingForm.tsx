"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createPersonalTrainingAction } from "@/lib/actions/personal-training-actions";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";

export function PersonalTrainingForm({
  childrenList,
}: {
  childrenList: { id: string; lastName: string; firstName: string }[];
}) {
  const [state, formAction] = useActionState(
    createPersonalTrainingAction,
    undefined,
  );
  const [personType, setPersonType] = useState<"CHILD" | "ADULT">("CHILD");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div>
        <span className="mb-1.5 block text-sm font-medium text-brand-text/80">
          Кто пришёл
        </span>
        <div className="flex gap-1.5">
          <label className="relative cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-brand-text/60 has-[:checked]:bg-brand-cyan/25 has-[:checked]:text-brand-cyan">
            <input
              type="radio"
              name="personType"
              value="CHILD"
              checked={personType === "CHILD"}
              onChange={() => setPersonType("CHILD")}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            Ребёнок из базы
          </label>
          <label className="relative cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-brand-text/60 has-[:checked]:bg-brand-cyan/25 has-[:checked]:text-brand-cyan">
            <input
              type="radio"
              name="personType"
              value="ADULT"
              checked={personType === "ADULT"}
              onChange={() => setPersonType("ADULT")}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            Взрослый
          </label>
        </div>
      </div>

      {personType === "CHILD" ? (
        <FieldGroup label="Ребёнок" htmlFor="childId">
          <Select id="childId" name="childId" defaultValue="">
            <option value="" disabled>
              Выберите ребёнка…
            </option>
            {childrenList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.lastName} {c.firstName}
              </option>
            ))}
          </Select>
        </FieldGroup>
      ) : (
        <FieldGroup label="ФИО взрослого" htmlFor="adultName">
          <Input id="adultName" name="adultName" placeholder="Иванова Мария Петровна" />
        </FieldGroup>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Дата" htmlFor="ptDate">
          <Input
            id="ptDate"
            name="date"
            type="date"
            defaultValue={toDateInputValue(new Date())}
            required
          />
        </FieldGroup>
        <FieldGroup label="Время" htmlFor="ptTime">
          <Input id="ptTime" name="time" type="time" required />
        </FieldGroup>
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-text/80">
        <input type="checkbox" name="completed" defaultChecked />
        Тренировка состоялась
      </label>

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
        <SaveButton>Добавить</SaveButton>
      </div>
    </form>
  );
}
