"use client";

import { useRef } from "react";
import { moveChildGroupAction } from "@/lib/actions/group-actions";
import { Select } from "@/components/ui/Field";

export function MoveGroupSelect({
  childId,
  currentGroupId,
  groups,
}: {
  childId: string;
  currentGroupId: string;
  groups: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={moveChildGroupAction}>
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="currentGroupId" value={currentGroupId} />
      <Select
        name="newGroupId"
        defaultValue={currentGroupId}
        className="!w-auto py-1.5 text-sm"
        onChange={(e) => {
          if (
            e.target.value !== currentGroupId &&
            confirm("Перенести ребёнка в другую группу?")
          ) {
            formRef.current?.requestSubmit();
          } else {
            e.target.value = currentGroupId;
          }
        }}
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
