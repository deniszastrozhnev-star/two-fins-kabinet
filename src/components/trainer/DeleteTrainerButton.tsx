"use client";

import { useActionState } from "react";
import { deleteTrainerAction } from "@/lib/actions/trainer-actions";
import { Button } from "@/components/ui/Button";

export function DeleteTrainerButton({ id, username }: { id: string; username: string }) {
  const [state, formAction] = useActionState(deleteTrainerAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Удалить тренера «${username}»?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm">
        Удалить
      </Button>
      {state?.error && <p className="mt-1 text-xs text-red-300">{state.error}</p>}
    </form>
  );
}
