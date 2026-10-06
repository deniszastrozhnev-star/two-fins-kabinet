"use client";

import { useState } from "react";
import {
  confirmReceiptTariffAction,
  manualReceiptResolutionAction,
} from "@/lib/actions/receipt-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { toDateInputValue, formatDateRu } from "@/lib/dates";
import { endOfMonth } from "date-fns";

export function ReceiptTariffPrompt({
  receiptId,
  childId,
  tariffRub,
}: {
  receiptId: string;
  childId: string;
  /** Тариф ребёнка сейчас (₽/мес) — именно эта сумма запишется как оплата при
   * подтверждении «по тарифу»; null — тарифа нет (нет группы/цены). */
  tariffRub: number | null;
}) {
  const [manual, setManual] = useState(false);
  const endOfThisMonth = endOfMonth(new Date());

  return (
    <div className="mt-2 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-3">
      {!manual ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <form action={confirmReceiptTariffAction}>
            <input type="hidden" name="receiptId" value={receiptId} />
            <input type="hidden" name="childId" value={childId} />
            <SaveButton>
              {tariffRub != null
                ? `Продлить по тарифу (${tariffRub.toLocaleString("ru-RU")}₽) до ${formatDateRu(endOfThisMonth)}`
                : `Продлить до ${formatDateRu(endOfThisMonth)} (тарифа нет — без суммы)`}
            </SaveButton>
          </form>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setManual(true)}
          >
            Указать количество занятий вручную
          </Button>
        </div>
      ) : (
        <form
          action={manualReceiptResolutionAction}
          className="mt-2 flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="receiptId" value={receiptId} />
          <input type="hidden" name="childId" value={childId} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-text/80">
              Оплачено до
            </label>
            <Input
              type="date"
              name="paidUntil"
              defaultValue={toDateInputValue(endOfThisMonth)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-text/80">
              Сумма, ₽
            </label>
            <Input
              type="number"
              name="amountRub"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder={tariffRub != null ? String(tariffRub) : "сумма оплаты"}
            />
          </div>
          <SaveButton>Сохранить</SaveButton>
        </form>
      )}
    </div>
  );
}
