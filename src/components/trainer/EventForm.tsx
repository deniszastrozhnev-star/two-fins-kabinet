"use client";

import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { toDateInputValue } from "@/lib/dates";
import type { EventType } from "@prisma/client";

export function EventForm({
  action,
  initial,
  submitLabel = "Сохранить",
}: {
  action: (formData: FormData) => void;
  initial?: {
    id?: string;
    title?: string;
    type?: EventType;
    dateStart?: Date;
    dateEnd?: Date | null;
    location?: string;
    description?: string;
    suitableFor?: string;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <FieldGroup label="Название" htmlFor="title">
        <Input id="title" name="title" defaultValue={initial?.title} required />
      </FieldGroup>

      <FieldGroup label="Тип" htmlFor="type">
        <Select id="type" name="type" defaultValue={initial?.type ?? "NEWS"}>
          {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </Select>
      </FieldGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Дата начала" htmlFor="dateStart">
          <Input
            id="dateStart"
            name="dateStart"
            type="date"
            defaultValue={
              initial?.dateStart ? toDateInputValue(initial.dateStart) : ""
            }
            required
          />
        </FieldGroup>
        <FieldGroup label="Дата окончания" htmlFor="dateEnd" hint="если нужно">
          <Input
            id="dateEnd"
            name="dateEnd"
            type="date"
            defaultValue={
              initial?.dateEnd ? toDateInputValue(initial.dateEnd) : ""
            }
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Место" htmlFor="location">
        <Input id="location" name="location" defaultValue={initial?.location} />
      </FieldGroup>

      <FieldGroup
        label="Для кого подходит"
        htmlFor="suitableFor"
        hint="например: 8–10 лет, Уверенный пловец"
      >
        <Input
          id="suitableFor"
          name="suitableFor"
          defaultValue={initial?.suitableFor}
        />
      </FieldGroup>

      <FieldGroup label="Описание" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description}
        />
      </FieldGroup>

      <div className="mt-2 flex justify-end">
        <SaveButton>{submitLabel}</SaveButton>
      </div>
    </form>
  );
}
