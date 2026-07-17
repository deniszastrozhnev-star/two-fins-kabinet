"use client";

import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";

export function ChildForm({
  action,
  groups,
  initial,
  submitLabel = "Сохранить",
}: {
  action: (formData: FormData) => void;
  groups: { id: string; name: string }[];
  initial?: {
    id?: string;
    lastName?: string;
    firstName?: string;
    groupId?: string | null;
    parentPhone?: string;
    paidUntil?: Date | null;
    birthDate?: Date | null;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Фамилия" htmlFor="lastName">
          <Input
            id="lastName"
            name="lastName"
            defaultValue={initial?.lastName}
            required
          />
        </FieldGroup>
        <FieldGroup label="Имя" htmlFor="firstName">
          <Input
            id="firstName"
            name="firstName"
            defaultValue={initial?.firstName}
            required
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Группа" htmlFor="groupId">
        <Select id="groupId" name="groupId" defaultValue={initial?.groupId ?? ""}>
          <option value="">Без группы</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <FieldGroup
        label="Телефон родителя"
        htmlFor="parentPhone"
        hint="По этому номеру родитель сможет войти в свой кабинет"
      >
        <Input
          id="parentPhone"
          name="parentPhone"
          type="tel"
          inputMode="tel"
          placeholder="+7 900 000-00-00"
          defaultValue={initial?.parentPhone}
          required
        />
      </FieldGroup>

      <FieldGroup
        label="Дата рождения"
        htmlFor="birthDate"
        hint="Нужна для входа спортсмена в свой кабинет (пароль — дата в формате ДДММГГГГ)"
      >
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={
            initial?.birthDate ? toDateInputValue(initial.birthDate) : ""
          }
        />
      </FieldGroup>

      <FieldGroup
        label="Оплачено до"
        htmlFor="paidUntil"
        hint="Можно скорректировать вручную; кнопка «Оплачено» ставит конец текущего месяца"
      >
        <Input
          id="paidUntil"
          name="paidUntil"
          type="date"
          defaultValue={
            initial?.paidUntil ? toDateInputValue(initial.paidUntil) : ""
          }
        />
      </FieldGroup>

      <div className="mt-2 flex justify-end">
        <SaveButton>{submitLabel}</SaveButton>
      </div>
    </form>
  );
}
