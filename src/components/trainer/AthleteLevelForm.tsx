"use client";

import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";

export function AthleteLevelForm({
  action,
  initial,
  submitLabel = "Сохранить",
}: {
  action: (formData: FormData) => void;
  initial?: {
    id?: string;
    name?: string;
    ofpTask?: string;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <FieldGroup label="Название уровня" htmlFor={`levelName-${initial?.id ?? "new"}`}>
        <Input
          id={`levelName-${initial?.id ?? "new"}`}
          name="name"
          defaultValue={initial?.name}
          required
        />
      </FieldGroup>
      <FieldGroup label="Задание по ОФП" htmlFor={`levelTask-${initial?.id ?? "new"}`}>
        <Textarea
          id={`levelTask-${initial?.id ?? "new"}`}
          name="ofpTask"
          rows={3}
          defaultValue={initial?.ofpTask}
          required
        />
      </FieldGroup>
      <div className="flex justify-end">
        <SaveButton>{submitLabel}</SaveButton>
      </div>
    </form>
  );
}
