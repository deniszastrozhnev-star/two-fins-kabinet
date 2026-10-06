"use client";

import { useActionState, useMemo, useState } from "react";
import { updateChildGroupAction } from "@/lib/actions/extra-session-actions";
import { computeCombinedPrice, GroupOption, type ChildGroupOption } from "@/components/shared/GroupPicker";
import { SaveButton } from "@/components/trainer/SaveButton";
import { LEVEL_LABELS, LEVEL_ORDER } from "@/lib/labels";

export type { ChildGroupOption };

/** Тот же конструктор, что в онлайн-записи (уровни → группы, доп. занятие в
 * том же бассейне, живой пересчёт цены) — только для уже существующего
 * ребёнка: предзаполнен текущей группой/доп. занятием, сохранение сразу
 * назначает группу (с учётом листа ожидания) и обновляет доп. занятие. */
export function ChildGroupForm({
  childId,
  groups,
  currentGroupId,
  currentExtraGroupId,
}: {
  childId: string;
  groups: ChildGroupOption[];
  currentGroupId: string | null;
  currentExtraGroupId: string | null;
}) {
  const [state, formAction] = useActionState(updateChildGroupAction, undefined);

  const [baseGroupId, setBaseGroupId] = useState<string>(currentGroupId ?? "");
  const [wantsExtra, setWantsExtra] = useState(currentExtraGroupId != null);
  const [extraGroupId, setExtraGroupId] = useState<string>(currentExtraGroupId ?? "");

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
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="childId" value={childId} />

      <div>
        <p className="mb-2 text-sm font-medium text-brand-text/80">Группа</p>
        <div className="flex flex-col gap-3">
          <label className="relative flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm transition has-[:checked]:border-brand-cyan/50 has-[:checked]:bg-brand-cyan/10">
            <input
              type="radio"
              name="groupId"
              value=""
              checked={baseGroupId === ""}
              onChange={() => {
                setBaseGroupId("");
                setExtraGroupId("");
                setWantsExtra(false);
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span className="font-medium text-brand-text/70">Без группы</span>
          </label>
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
            Доп. занятие в другой группе
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
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}

      <div className="flex justify-end">
        <SaveButton>Сохранить группу</SaveButton>
      </div>
    </form>
  );
}
