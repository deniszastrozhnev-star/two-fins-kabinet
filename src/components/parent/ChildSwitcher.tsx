"use client";

import { useRef } from "react";
import { switchActiveChildAction } from "@/lib/actions/login-actions";

/** Переключатель ребёнка в шапке — показывается только если в семье
 * больше одного ребёнка; выбор сразу переподписывает сессию и обновляет
 * весь кабинет под выбранного ребёнка. */
export function ChildSwitcher({
  siblings,
  activeChildId,
}: {
  siblings: { id: string; lastName: string; firstName: string }[];
  activeChildId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchActiveChildAction}>
      <select
        name="childId"
        defaultValue={activeChildId}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-white/15 bg-brand-base/60 px-2 py-1 text-xs text-brand-text/80 outline-none focus:border-brand-cyan"
      >
        {siblings.map((s) => (
          <option key={s.id} value={s.id}>
            {s.lastName} {s.firstName}
          </option>
        ))}
      </select>
    </form>
  );
}
