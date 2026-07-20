"use client";

import { useRef } from "react";
import { assignAthleteLevelAction } from "@/lib/actions/athlete-level-actions";
import { Select } from "@/components/ui/Field";
import { ATHLETE_LEVEL_ORDER, LEVEL_LABELS } from "@/lib/labels";
import type { GroupLevel } from "@prisma/client";

export function AssignAthleteLevelSelect({
  athleteId,
  currentLevel,
}: {
  athleteId: string;
  currentLevel: GroupLevel | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={assignAthleteLevelAction}>
      <input type="hidden" name="athleteId" value={athleteId} />
      <Select
        name="level"
        defaultValue={currentLevel ?? ""}
        className="!w-auto py-1.5 text-sm"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="">Без уровня</option>
        {ATHLETE_LEVEL_ORDER.map((level) => (
          <option key={level} value={level}>
            {LEVEL_LABELS[level]}
          </option>
        ))}
      </Select>
    </form>
  );
}
