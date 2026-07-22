"use client";

import { useRef } from "react";
import { assignTrainerGroupsAction } from "@/lib/actions/trainer-actions";
import { Select } from "@/components/ui/Field";

export function AssignTrainerGroupsSelect({
  trainerId,
  currentGroupIds,
  groups,
}: {
  trainerId: string;
  currentGroupIds: string[];
  groups: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={assignTrainerGroupsAction}>
      <input type="hidden" name="trainerId" value={trainerId} />
      <Select
        name="groupIds"
        multiple
        defaultValue={currentGroupIds}
        className="!w-auto min-w-[180px] py-1.5 text-sm"
        size={Math.min(4, Math.max(2, groups.length))}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </Select>
    </form>
  );
}
