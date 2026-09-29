"use client";

import { useState } from "react";
import type { AttendanceStatus } from "@prisma/client";

const OPTIONS: { value: AttendanceStatus; label: string; on: string }[] = [
  {
    value: "PRESENT",
    label: "Пришёл",
    on: "border-emerald-500/40 bg-emerald-500/25 text-emerald-200",
  },
  {
    value: "ABSENT",
    label: "Не пришёл",
    on: "border-red-500/40 bg-red-500/25 text-red-200",
  },
  {
    value: "WORKOFF",
    label: "Отработка",
    on: "border-brand-cyan/40 bg-brand-cyan/25 text-brand-cyan",
  },
];

/** Клик по уже выбранному статусу снимает отметку целиком (значение "" в
 * скрытом поле формы — сервер удаляет запись, а не подставляет "Не пришёл"). */
export function AttendanceStatusPicker({
  name,
  defaultValue,
  hasCourseResult,
}: {
  name: string;
  defaultValue?: AttendanceStatus;
  hasCourseResult?: boolean;
}) {
  const [value, setValue] = useState<AttendanceStatus | null>(defaultValue ?? null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <input type="hidden" name={name} value={value ?? ""} />
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue((v) => (v === opt.value ? null : opt.value))}
            className={`rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-brand-text/60 transition ${
              value === opt.value ? opt.on : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hasCourseResult && (
        <p className="text-[11px] text-amber-300/80">⚠ внесена курсовка за этот день</p>
      )}
    </div>
  );
}
