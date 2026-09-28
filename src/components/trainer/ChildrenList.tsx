"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { matchesNameQuery } from "@/lib/nameSearch";

// Ъ и Ь не встречаются как первая буква фамилии — не включаем в указатель.
const RUSSIAN_ALPHABET = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯ".split("");

export type ChildListItem = {
  id: string;
  lastName: string;
  firstName: string;
  groupName: string | null;
  phone: string;
  balance: number;
  isDuplicate: boolean;
  isSick: boolean;
  hasNewReceipt: boolean;
  paymentOk: boolean;
  medicalOk: boolean;
  contractOk: boolean;
};

/** Список детей уже отсортирован сервером (сначала проблемные, потом по
 * алфавиту) — здесь только мгновенный клиентский текстовый фильтр поверх
 * готового порядка, без запросов к серверу на каждую букву. */
export function ChildrenList({ items }: { items: ChildListItem[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => items.filter((c) => matchesNameQuery(c.lastName, c.firstName, query)),
    [items, query],
  );

  const firstIdByLetter = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of visible) {
      const letter = c.lastName[0]?.toUpperCase();
      if (letter && !map.has(letter)) map.set(letter, c.id);
    }
    return map;
  }, [visible]);

  return (
    <>
      <div className="mb-5 max-w-sm">
        <Input
          type="search"
          placeholder="Поиск по имени…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {RUSSIAN_ALPHABET.map((letter) => {
            const targetId = firstIdByLetter.get(letter);
            return targetId ? (
              <a
                key={letter}
                href={`#child-${targetId}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold text-brand-cyan transition hover:bg-white/10"
              >
                {letter}
              </a>
            ) : (
              <span
                key={letter}
                className="flex h-7 w-7 items-center justify-center text-xs font-semibold text-brand-text/25"
              >
                {letter}
              </span>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={query ? "Никого не нашлось" : "Пока нет ни одного ребёнка"}
          description={
            query
              ? "Попробуйте изменить запрос."
              : "Добавьте первого ученика, чтобы начать вести посещаемость и оплату."
          }
          action={
            !query && <LinkButton href="/trainer/children/new">Добавить ребёнка</LinkButton>
          }
        />
      ) : (
        <Card>
          <CardBody className="flex flex-col divide-y divide-white/10 p-0">
            {visible.map((child) => (
              <Link
                key={child.id}
                id={`child-${child.id}`}
                href={`/trainer/children/${child.id}`}
                className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5 sm:px-5"
              >
                <div>
                  <p className="font-medium">
                    {child.lastName} {child.firstName}
                  </p>
                  <p className="text-xs text-brand-text/50">
                    {child.groupName ?? "Без группы"} · {child.phone}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {child.isDuplicate && <Badge tone="amber">Возможный дубликат</Badge>}
                  {child.isSick && <Badge tone="violet">болеет</Badge>}
                  {child.hasNewReceipt && <Badge tone="violet">есть чек</Badge>}
                  {child.balance > 0 && (
                    <Badge tone="amber">{child.balance} отраб.</Badge>
                  )}
                  <Badge tone={child.paymentOk ? "green" : "red"}>
                    Оплата {child.paymentOk ? "✅" : "❌"}
                  </Badge>
                  <Badge tone={child.medicalOk ? "green" : "red"}>
                    Справка {child.medicalOk ? "✅" : "❌"}
                  </Badge>
                  <Badge tone={child.contractOk ? "green" : "red"}>
                    Договор {child.contractOk ? "✅" : "❌"}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}
    </>
  );
}
