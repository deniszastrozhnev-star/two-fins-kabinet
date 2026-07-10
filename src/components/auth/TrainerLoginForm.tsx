"use client";

import { useActionState } from "react";
import { trainerLoginAction } from "@/lib/actions/login-actions";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function TrainerLoginForm() {
  const [state, formAction] = useActionState(trainerLoginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup label="Логин" htmlFor="username">
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
        />
      </FieldGroup>
      <FieldGroup label="Пароль" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
