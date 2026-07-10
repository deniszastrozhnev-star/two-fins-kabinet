"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/Field";

export function SearchBox({
  action,
  defaultValue,
  placeholder = "Поиск по имени…",
  extraHidden,
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
  extraHidden?: Record<string, string>;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} method="get" className="w-full">
      {extraHidden &&
        Object.entries(extraHidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <Input
        type="search"
        name="q"
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={() => {
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => formRef.current?.requestSubmit(), 350);
        }}
      />
    </form>
  );
}
