"use client";

import { useRef } from "react";
import { setSendBirthdayGreetingsAction } from "@/lib/actions/daily-reminder-actions";

export function BirthdayGreetingsToggle({ enabled }: { enabled: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setSendBirthdayGreetingsAction}>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-text/80">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={enabled}
          onChange={() => formRef.current?.requestSubmit()}
          className="h-4 w-4 accent-[color:var(--color-brand-cyan)]"
        />
        Поздравлять родителей push-уведомлением в день рождения ребёнка
      </label>
    </form>
  );
}
