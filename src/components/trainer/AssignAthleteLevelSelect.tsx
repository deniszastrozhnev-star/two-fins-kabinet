"use client";

import { useRef } from "react";
import { assignAthleteLevelAction } from "@/lib/actions/athlete-level-actions";
import { Select } from "@/components/ui/Field";

export function AssignAthleteLevelSelect({
  athleteId,
  currentLevelId,
  levels,
}: {
  athleteId: string;
  currentLevelId: string | null;
  levels: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={assignAthleteLevelAction}>
      <input type="hidden" name="athleteId" value={athleteId} />
      <Select
        name="levelId"
        defaultValue={currentLevelId ?? ""}
        className="!w-auto py-1.5 text-sm"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="">Без уровня</option>
        {levels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
    </form>
  );
}
