"use client";

import { useRef } from "react";
import { Input, FieldGroup } from "@/components/ui/Field";

export function AttendanceDateFilter({ groupId, date }: { groupId: string; date: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={`/trainer/attendance/${groupId}`}
      method="get"
      className="max-w-[220px]"
    >
      <FieldGroup label="Дата" htmlFor="date">
        <Input
          id="date"
          type="date"
          name="date"
          defaultValue={date}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </FieldGroup>
    </form>
  );
}
