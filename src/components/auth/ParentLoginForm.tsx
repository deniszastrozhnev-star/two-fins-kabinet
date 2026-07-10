"use client";

import { useActionState } from "react";
import { parentLoginAction } from "@/lib/actions/login-actions";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function ParentLoginForm() {
  const [state, formAction] = useActionState(parentLoginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup label="Фамилия ребёнка" htmlFor="lastName">
        <Input id="lastName" name="lastName" autoComplete="off" required />
      </FieldGroup>
      <FieldGroup label="Имя ребёнка" htmlFor="firstName">
        <Input id="firstName" name="firstName" autoComplete="off" required />
      </FieldGroup>
      <FieldGroup
        label="Ваш номер телефона"
        htmlFor="phone"
        hint="Тот, что вы давали тренеру при записи в группу"
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="+7 900 000-00-00"
          autoComplete="tel"
          required
        />
      </FieldGroup>
      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      <SubmitButton>Войти</SubmitButton>
    </form>
  );
}
