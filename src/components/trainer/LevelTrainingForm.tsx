import { FieldGroup, Textarea } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { saveLevelTrainingAction } from "@/lib/actions/athlete-level-actions";
import type { GroupLevel } from "@prisma/client";

export function LevelTrainingForm({
  level,
  date,
  initial,
}: {
  level: GroupLevel;
  date: string;
  initial?: { ofpTask: string; flexibilityTask: string };
}) {
  return (
    <form action={saveLevelTrainingAction} className="flex flex-col gap-3">
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="date" value={date} />
      <FieldGroup label="Задание по ОФП" htmlFor={`ofpTask-${level}-${date}`}>
        <Textarea
          id={`ofpTask-${level}-${date}`}
          name="ofpTask"
          rows={3}
          defaultValue={initial?.ofpTask}
          required
        />
      </FieldGroup>
      <FieldGroup label="Задание по гибкости" htmlFor={`flexTask-${level}-${date}`}>
        <Textarea
          id={`flexTask-${level}-${date}`}
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
