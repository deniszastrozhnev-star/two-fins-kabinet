"use client";

import { useState } from "react";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue } from "@/lib/dates";

type GroupOption = {
  id: string;
  name: string;
  splitByAssignedTrainer: boolean;
  trainers: { id: string; name: string }[];
};

export function ChildForm({
  action,
  groups,
  initial,
  submitLabel = "Сохранить",
}: {
  action: (formData: FormData) => void;
  groups: GroupOption[];
  initial?: {
    id?: string;
    lastName?: string;
    firstName?: string;
    groupId?: string | null;
    assignedTrainerId?: string | null;
    parentPhone?: string;
    paidUntil?: Date | null;
    birthDate?: Date | null;
  };
  submitLabel?: string;
}) {
  const [groupId, setGroupId] = useState(initial?.groupId ?? "");
  const selectedGroup = groups.find((g) => g.id === groupId);
  const showAssignedTrainer = Boolean(selectedGroup?.splitByAssignedTrainer);

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
        <Select
          id="groupId"
          name="groupId"
          defaultValue={initial?.groupId ?? ""}
          onChange={(e) => setGroupId(e.target.value)}
        >
          <option value="">Без группы</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </FieldGroup>

      {showAssignedTrainer && (
        <FieldGroup
          label="Ответственный тренер"
          htmlFor="assignedTrainerId"
          hint="Группу ведут два тренера — кто из них отвечает за этого ребёнка (посещаемость и зарплата)"
        >
          <Select
            id="assignedTrainerId"
            name="assignedTrainerId"
            defaultValue={initial?.assignedTrainerId ?? ""}
          >
            <option value="">Не назначен</option>
            {selectedGroup?.trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
      )}

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

      <FieldGroup label="Дата рождения" htmlFor="birthDate">
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
