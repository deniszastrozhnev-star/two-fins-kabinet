"use client";

import { FieldGroup, Textarea } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { updateLevelTrainingAction } from "@/lib/actions/athlete-level-actions";
import type { GroupLevel } from "@prisma/client";

export function LevelTrainingForm({
  level,
  initial,
}: {
  level: GroupLevel;
  initial?: { ofpTask: string; flexibilityTask: string };
}) {
  return (
    <form action={updateLevelTrainingAction} className="flex flex-col gap-3">
      <input type="hidden" name="level" value={level} />
      <FieldGroup label="Задание по ОФП" htmlFor={`ofpTask-${level}`}>
        <Textarea
          id={`ofpTask-${level}`}
          name="ofpTask"
          rows={3}
          defaultValue={initial?.ofpTask}
          required
        />
      </FieldGroup>
      <FieldGroup label="Задание по гибкости" htmlFor={`flexTask-${level}`}>
        <Textarea
          id={`flexTask-${level}`}
          name="flexibilityTask"
          rows={3}
          defaultValue={initial?.flexibilityTask}
          required
        />
      </FieldGroup>
      <div className="flex justify-end">
        <SaveButton>Сохранить</SaveButton>
      </div>
    </form>
  );
}
