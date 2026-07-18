"use client";

import { useActionState } from "react";
import { athleteLoginAction } from "@/lib/actions/login-actions";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function AthleteLoginForm() {
  const [state, formAction] = useActionState(athleteLoginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup label="Фамилия" htmlFor="lastName">
        <Input id="lastName" name="lastName" autoComplete="off" required />
      </FieldGroup>
      <FieldGroup label="Имя" htmlFor="firstName">
        <Input id="firstName" name="firstName" autoComplete="off" required />
      </FieldGroup>
      <FieldGroup label="Дата рождения" htmlFor="birthDate">
        <Input id="birthDate" name="birthDate" type="date" required />
      </FieldGroup>
      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      <SubmitButton>Войти</SubmitButton>
      <p className="text-center text-xs text-brand-text/50">
        Если ты ещё не регистрировался — аккаунт создастся автоматически
      </p>
    </form>
  );
}
