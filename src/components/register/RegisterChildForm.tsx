"use client";

import { useActionState, useMemo, useRef, useState, useEffect } from "react";
import { registerChildAction } from "@/lib/actions/registration-actions";
import { computeCombinedPrice, type PricedGroup } from "@/lib/registrationTariffs";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { LEVEL_LABELS, LEVEL_ORDER } from "@/lib/labels";
import type { GroupLevel } from "@prisma/client";

export type RegistrationGroup = PricedGroup & {
  id: string;
  name: string;
  level: GroupLevel;
  time: string;
};

function GroupOption({
  group,
  name,
  checked,
  onChange,
}: {
  group: RegistrationGroup;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm transition has-[:checked]:border-brand-cyan/50 has-[:checked]:bg-brand-cyan/10">
      <input
        type="radio"
        name={name}
        value={group.id}
        checked={checked}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <span>
        <span className="font-medium">{group.name}</span>
        <span className="block text-xs text-brand-text/50">
          {group.pool} · {group.time}
        </span>
      </span>
      <span className="whitespace-nowrap font-semibold text-brand-cyan">
        {group.pricePerMonth != null ? `${group.pricePerMonth.toLocaleString("ru-RU")}₽` : "—"}
      </span>
    </label>
  );
}

export function RegisterChildForm({ groups }: { groups: RegistrationGroup[] }) {
  const [state, formAction] = useActionState(registerChildAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const [baseGroupId, setBaseGroupId] = useState<string>("");
  const [wantsExtra, setWantsExtra] = useState(false);
  const [extraGroupId, setExtraGroupId] = useState<string>("");

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setBaseGroupId("");
      setWantsExtra(false);
      setExtraGroupId("");
    }
  }, [state]);

  const baseGroup = groups.find((g) => g.id === baseGroupId) ?? null;
  const extraCandidates = useMemo(
    () => (baseGroup ? groups.filter((g) => g.id !== baseGroup.id && g.pool === baseGroup.pool) : []),
    [groups, baseGroup],
  );
  const extraGroup = extraCandidates.find((g) => g.id === extraGroupId) ?? null;

  const price = baseGroup ? computeCombinedPrice(baseGroup, wantsExtra ? extraGroup : null) : null;

  const groupsByLevel = LEVEL_ORDER.map((level) => ({
    level,
    groups: groups.filter((g) => g.level === level),
  })).filter((section) => section.groups.length > 0);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup
          label="Телефон родителя"
          htmlFor="phone"
          hint="По этому номеру можно будет войти в личный кабинет родителя"
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+7 900 000-00-00"
            autoComplete="tel"
            required
          />
        </FieldGroup>
        <FieldGroup label="Дата рождения ребёнка" htmlFor="birthDate">
          <Input id="birthDate" name="birthDate" type="date" required />
        </FieldGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Фамилия ребёнка" htmlFor="lastName">
          <Input id="lastName" name="lastName" autoComplete="off" required />
        </FieldGroup>
        <FieldGroup label="Имя ребёнка" htmlFor="firstName">
          <Input id="firstName" name="firstName" autoComplete="off" required />
        </FieldGroup>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-text/80">Выберите группу</p>
        <div className="flex flex-col gap-4">
          {groupsByLevel.map((section) => (
            <div key={section.level}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-brand-text/50">
                {LEVEL_LABELS[section.level]}
              </p>
              <div className="flex flex-col gap-1.5">
                {section.groups.map((g) => (
                  <GroupOption
                    key={g.id}
                    group={g}
                    name="groupId"
                    checked={baseGroupId === g.id}
                    onChange={() => {
                      setBaseGroupId(g.id);
                      setExtraGroupId("");
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {baseGroup && (
        <div>
          <label className="flex items-center gap-2 text-sm text-brand-text/80">
            <input
              type="checkbox"
              checked={wantsExtra}
              onChange={(e) => {
                setWantsExtra(e.target.checked);
                setExtraGroupId("");
              }}
            />
            Добавить ещё одно занятие в другой группе
          </label>

          {wantsExtra && (
            <div className="mt-2 flex flex-col gap-1.5">
              {extraCandidates.length === 0 ? (
                <p className="text-xs text-brand-text/50">
                  Нет других групп в бассейне «{baseGroup.pool}»
                </p>
              ) : (
                extraCandidates.map((g) => (
                  <GroupOption
                    key={g.id}
                    group={g}
                    name="extraGroupId"
                    checked={extraGroupId === g.id}
                    onChange={() => setExtraGroupId(g.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {price != null && (
        <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3">
          <p className="text-sm text-brand-text/70">Итоговая стоимость</p>
          <p className="font-heading text-xl font-bold text-brand-cyan">
            {price.toLocaleString("ru-RU")}₽/мес
          </p>
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}

      <SubmitButton>Отправить заявку</SubmitButton>
    </form>
  );
}
