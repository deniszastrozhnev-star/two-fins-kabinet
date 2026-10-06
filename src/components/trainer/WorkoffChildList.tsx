"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttendedToggle } from "@/components/trainer/AttendedToggle";
import { matchesNameQuery } from "@/lib/nameSearch";

export type WorkoffChildItem = {
  id: string;
  lastName: string;
  firstName: string;
  groupName: string | null;
  balance: number;
  entitlement: number | null;
  attended: boolean;
};

/** Строки не убираются из DOM при фильтрации (только скрываются CSS-ом) —
 * иначе отметка "пришёл" в уже переключённом чекбоксе слетела бы при повторном
 * монтировании после того, как строка на секунду исчезла из-под поискового
 * запроса. Все чекбоксы остаются частью одной формы независимо от фильтра. */
export function WorkoffChildList({
  items,
  isExtra,
}: {
  items: WorkoffChildItem[];
  isExtra: boolean;
}) {
  const [query, setQuery] = useState("");

  const matchFlags = useMemo(
    () => items.map((c) => matchesNameQuery(c.lastName, c.firstName, query)),
    [items, query],
  );
  const visibleCount = matchFlags.filter(Boolean).length;

  return (
    <>
      <div className="mb-5 max-w-sm">
        <Input
          type="search"
          placeholder="Поиск ребёнка по имени…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {visibleCount === 0 && (
        <EmptyState title="Никого не нашлось" description="Попробуйте изменить запрос." />
      )}

      <Card className={visibleCount === 0 ? "hidden" : undefined}>
        <CardBody className="flex flex-col divide-y divide-white/10 p-0">
          {items.map((child, i) => (
            <div
              key={child.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 ${
                matchFlags[i] ? "" : "hidden"
              }`}
            >
              <input type="hidden" name="childId" value={child.id} />
              <div>
                <p className="font-medium">
                  {child.lastName} {child.firstName}
                </p>
                <p className="text-xs text-brand-text/50">
                  {child.groupName ?? "Без группы"}
                  {!isExtra && child.balance > 0 && (
                    <>
                      {" · "}
                      <Badge tone="amber" className="align-middle">
                        {child.balance} отраб.
                      </Badge>
                    </>
                  )}
                  {isExtra && child.entitlement != null && (
                    <>
                      {" · "}
                      <Badge tone="violet" className="align-middle">
                        право: {child.entitlement}×/нед
                      </Badge>
                    </>
                  )}
                </p>
              </div>
              <AttendedToggle
                childId={child.id}
                defaultChecked={child.attended}
                label={isExtra ? "Пришёл на допзанятие" : "Пришёл на отработку"}
              />
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
