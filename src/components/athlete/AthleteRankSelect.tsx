"use client";

import { useRef } from "react";
import { setAthleteRankAction } from "@/lib/actions/athlete-competition-actions";
import { Select } from "@/components/ui/Field";
import { ATHLETE_RANK_LABELS, ATHLETE_RANK_ORDER } from "@/lib/labels";

export function AthleteRankSelect({ currentRank }: { currentRank: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setAthleteRankAction}>
      <Select
        name="rank"
        defaultValue={currentRank ?? ""}
        className="!w-auto py-1.5 text-sm"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="">Не указан</option>
        {ATHLETE_RANK_ORDER.map((rank) => (
          <option key={rank} value={rank}>
            {ATHLETE_RANK_LABELS[rank]}
          </option>
        ))}
      </Select>
    </form>
  );
}
