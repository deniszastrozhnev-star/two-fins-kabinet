"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTrainerAction } from "@/lib/actions/trainer-actions";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";

export function TrainerForm() {
  const [state, formAction] = useActionState(createTrainerAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <FieldGroup label="Логин" htmlFor="username">
        <Input id="username" name="username" required />
      </FieldGroup>
      <FieldGroup label="Пароль" htmlFor="password" hint="не короче 6 символов">
        <Input id="password" name="password" type="password" required />
      </FieldGroup>
      <FieldGroup label="Роль" htmlFor="role">
        <Select id="role" name="role" defaultValue="TRAINER">
          <option value="TRAINER">Тренер</option>
          <option value="HEAD">Главный тренер</option>
        </Select>
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
        <SaveButton>Добавить тренера</SaveButton>
      </div>
    </form>
  );
}
