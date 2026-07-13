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
  recognizedAmount,
  tariffLabel,
}: {
  receiptId: string;
  childId: string;
  recognizedAmount: number;
  tariffLabel: string;
}) {
  const [manual, setManual] = useState(false);
  const endOfThisMonth = endOfMonth(new Date());

  return (
    <div className="mt-2 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-3">
      <p className="text-sm text-brand-text/80">
        Распознано: <span className="font-semibold text-brand-cyan">{recognizedAmount.toLocaleString("ru-RU")}₽</span> — похоже на {tariffLabel}
      </p>
      {!manual ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <form action={confirmReceiptTariffAction}>
            <input type="hidden" name="receiptId" value={receiptId} />
            <input type="hidden" name="childId" value={childId} />
            <SaveButton>
              {`Продлить по тарифу до ${formatDateRu(endOfThisMonth)}`}
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
          <SaveButton>Сохранить</SaveButton>
        </form>
      )}
    </div>
  );
}
