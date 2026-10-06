"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendBroadcastPushAction } from "@/lib/actions/broadcast-push-actions";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function SendButton({ confirmMessage, disabled }: { confirmMessage: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? "Отправляем…" : "Отправить всем родителям"}
    </Button>
  );
}

/** Ручная рассылка push всем родителям — та же инфраструктура, что у
 * автоматических напоминаний, только текст и момент отправки на усмотрение
 * HEAD-тренера. Перед отправкой — подтверждение с реальным числом подписок,
 * чтобы не слать вслепую. */
export function BroadcastPushForm({ subscriberCount }: { subscriberCount: number }) {
  const [state, formAction] = useActionState(sendBroadcastPushAction, undefined);
  const [text, setText] = useState("");

  const confirmMessage =
    subscriberCount > 0
      ? `Отправить это push-уведомление? Сейчас активных подписок: ${subscriberCount}.`
      : "Сейчас нет ни одной активной подписки — уведомление никто не получит. Всё равно отправить?";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm text-brand-text/60">
        Активных подписок на push прямо сейчас: <span className="font-semibold text-brand-text">{subscriberCount}</span>
      </p>
      <Textarea
        name="text"
        placeholder="Текст уведомления для всех родителей"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        required
      />
      <div className="flex justify-end">
        <SendButton confirmMessage={confirmMessage} disabled={text.trim().length === 0} />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}
    </form>
  );
}
