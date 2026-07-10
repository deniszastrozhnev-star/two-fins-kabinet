"use client";

import { useRef } from "react";
import { Select, Input } from "@/components/ui/Field";

export function GroupDateFilter({
  action,
  groups,
  groupId,
  date,
  groupParamName = "groupId",
  extraHidden,
}: {
  action: string;
  groups: { id: string; name: string }[];
  groupId: string;
  date: string;
  groupParamName?: string;
  extraHidden?: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      method="get"
      className="flex flex-wrap items-end gap-3"
    >
      {extraHidden &&
        Object.entries(extraHidden)
          .filter(([, v]) => v)
          .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="min-w-[220px] flex-1">
        <label className="mb-1.5 block text-sm font-medium text-brand-text/80">
          Группа
        </label>
        <Select
          name={groupParamName}
          defaultValue={groupId}
          onChange={() => formRef.current?.requestSubmit()}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-text/80">
          Дата
        </label>
        <Input
          type="date"
          name="date"
          defaultValue={date}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </div>
    </form>
  );
}
