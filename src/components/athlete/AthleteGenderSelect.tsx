"use client";

import { useRef } from "react";
import { setAthleteGenderAction } from "@/lib/actions/athlete-competition-actions";
import { Select } from "@/components/ui/Field";
import { GENDER_LABELS } from "@/lib/labels";
import type { Gender } from "@prisma/client";

export function AthleteGenderSelect({ currentGender }: { currentGender: Gender | null }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setAthleteGenderAction}>
      <Select
        name="gender"
        defaultValue={currentGender ?? ""}
        className="!w-auto py-1.5 text-sm"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="">Пол не указан</option>
        {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
          <option key={g} value={g}>
            {GENDER_LABELS[g]}
          </option>
        ))}
      </Select>
    </form>
  );
}
