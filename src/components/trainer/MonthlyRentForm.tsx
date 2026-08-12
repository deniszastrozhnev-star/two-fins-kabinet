"use client";

import { useActionState } from "react";
import { updateMonthlyRentAction } from "@/lib/actions/finance-actions";
import { Input } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";

export function MonthlyRentForm({ monthlyRentRub }: { monthlyRentRub: number }) {
  const [state, formAction] = useActionState(updateMonthlyRentAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <Input
          name="monthlyRentRub"
          type="number"
          min={0}
          step={1000}
          defaultValue={monthlyRentRub}
          className="max-w-[160px]"
        />
        <SaveButton>Сохранить</SaveButton>
      </div>
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-300">{state.success}</p>}
    </form>
  );
}
