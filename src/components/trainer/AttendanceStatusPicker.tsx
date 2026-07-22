import type { AttendanceStatus } from "@prisma/client";

const OPTIONS: { value: AttendanceStatus; label: string; on: string }[] = [
  {
    value: "PRESENT",
    label: "Пришёл",
    on: "has-[:checked]:bg-emerald-500/25 has-[:checked]:text-emerald-200",
  },
  {
    value: "ABSENT",
    label: "Не пришёл",
    on: "has-[:checked]:bg-red-500/25 has-[:checked]:text-red-200",
  },
  {
    value: "WORKOFF",
    label: "Отработка",
    on: "has-[:checked]:bg-brand-cyan/25 has-[:checked]:text-brand-cyan",
  },
];

export function AttendanceStatusPicker({
  name,
  defaultValue = "PRESENT",
}: {
  name: string;
  defaultValue?: AttendanceStatus;
}) {
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className={`relative cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-brand-text/60 transition ${opt.on}`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            defaultChecked={defaultValue === opt.value}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
