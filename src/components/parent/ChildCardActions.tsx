"use client";

import { usePushSubscription } from "@/lib/usePushSubscription";

/** Компактная строка под карточкой ребёнка: ссылка на чат группы (если у
 * группы она задана) и переключатель уведомлений — тот же общий статус, что
 * и в "Новостях" (usePushSubscription), синхронизируется в обе стороны без
 * перезахода на страницу. */
export function ChildCardActions({ chatUrl }: { chatUrl: string | null }) {
  const { status, enable } = usePushSubscription();

  const pushNode = (() => {
    if (status === "checking" || status === "unsupported") return null;
    if (status === "on" || status === "busy") {
      return <span className="text-brand-text/60">Уведомления включены</span>;
    }
    if (status === "needs-install") {
      return (
        <a href="/install" className="text-brand-text/60 underline decoration-dotted underline-offset-2">
          Уведомления: нужно добавить на «Домой»
        </a>
      );
    }
    if (status === "denied") {
      return <span className="text-brand-text/60">Уведомления заблокированы в браузере</span>;
    }
    return (
      <button
        type="button"
        onClick={enable}
        className="font-medium text-brand-cyan hover:underline"
      >
        Включить уведомления
      </button>
    );
  })();

  if (!chatUrl && !pushNode) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
      {chatUrl && (
        <a
          href={chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-cyan hover:underline"
        >
          Вступить в чат группы
        </a>
      )}
      {chatUrl && pushNode && <span className="text-brand-text/30">·</span>}
      {pushNode}
    </div>
  );
}
