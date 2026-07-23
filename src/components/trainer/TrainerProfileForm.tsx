"use client";

import { useActionState } from "react";
import { updateTrainerProfileAction } from "@/lib/actions/trainer-profile-actions";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ATHLETE_RANK_LABELS, ATHLETE_RANK_ORDER } from "@/lib/labels";
import type { AthleteRank } from "@prisma/client";

export function TrainerProfileForm({
  displayName,
  bio,
  rank,
}: {
  displayName: string | null;
  bio: string | null;
  rank: AthleteRank | null;
}) {
  const [state, formAction, isPending] = useActionState(updateTrainerProfileAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup label="ФИО для отображения" hint="Видят родители на странице «Наши тренеры» вместо логина">
        <Input name="displayName" defaultValue={displayName ?? ""} placeholder="Иванова Мария Петровна" />
      </FieldGroup>

      <FieldGroup label="О себе">
        <Textarea
          name="bio"
          rows={4}
          defaultValue={bio ?? ""}
          placeholder="Пара слов о себе, опыте, специализации"
        />
      </FieldGroup>

      <FieldGroup label="Разряд в плавании">
        <Select name="rank" defaultValue={rank ?? ""}>
          <option value="">Не указан</option>
          {ATHLETE_RANK_ORDER.map((r) => (
            <option key={r} value={r}>
              {ATHLETE_RANK_LABELS[r]}
            </option>
          ))}
        </Select>
      </FieldGroup>

      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-300">{state.success}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
