"use client";

import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { LEVEL_LABELS, LEVEL_ORDER, WEEKDAYS } from "@/lib/labels";
import type { GroupLevel } from "@prisma/client";

export function GroupForm({
  action,
  initial,
  submitLabel = "Сохранить",
}: {
  action: (formData: FormData) => void;
  initial?: {
    id?: string;
    name?: string;
    level?: GroupLevel;
    daysOfWeek?: string[];
    time?: string;
    pool?: string;
    capacity?: number | null;
    pricePerMonth?: number | null;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <FieldGroup label="Название группы" htmlFor="name">
        <Input id="name" name="name" defaultValue={initial?.name} required />
      </FieldGroup>

      <FieldGroup label="Уровень" htmlFor="level">
        <Select id="level" name="level" defaultValue={initial?.level ?? "NOVICE"}>
          {LEVEL_ORDER.map((level) => (
            <option key={level} value={level}>
              {LEVEL_LABELS[level]}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-brand-text/80">
          Дни недели
        </span>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => (
            <label
              key={day}
              className="relative cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-brand-text/60 has-[:checked]:bg-brand-cyan/25 has-[:checked]:text-brand-cyan"
            >
              <input
                type="checkbox"
                name="daysOfWeek"
                value={day}
                defaultChecked={initial?.daysOfWeek?.includes(day)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {day}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Время" htmlFor="time" hint="например 17:00–17:45">
          <Input id="time" name="time" defaultValue={initial?.time} required />
        </FieldGroup>
        <FieldGroup label="Бассейн" htmlFor="pool">
          <Input id="pool" name="pool" defaultValue={initial?.pool} required />
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup
          label="Вместимость"
          htmlFor="capacity"
          hint="необязательно; свыше — лист ожидания"
        >
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={0}
            defaultValue={initial?.capacity ?? ""}
          />
        </FieldGroup>
        <FieldGroup label="Тариф, ₽/мес" htmlFor="pricePerMonth">
          <Input
            id="pricePerMonth"
            name="pricePerMonth"
            type="number"
            min={0}
            defaultValue={initial?.pricePerMonth ?? ""}
          />
        </FieldGroup>
      </div>

      <div className="mt-2 flex justify-end">
        <SaveButton>{submitLabel}</SaveButton>
      </div>
    </form>
  );
}
