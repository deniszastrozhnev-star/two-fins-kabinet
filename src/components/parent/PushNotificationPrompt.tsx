"use client";

import { useSyncExternalStore } from "react";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BellIcon } from "@/components/icons";

const DISMISS_KEY = "twofins:hidePushPrompt";
const dismissListeners = new Set<() => void>();

function subscribeDismissed(onStoreChange: () => void): () => void {
  dismissListeners.add(onStoreChange);
  return () => dismissListeners.delete(onStoreChange);
}

function getDismissedSnapshot(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) != null;
  } catch {
    return false;
  }
}

function getDismissedServerSnapshot(): boolean {
  return false;
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // localStorage недоступен (приватный режим) — просто не запомним выбор.
  }
  dismissListeners.forEach((listener) => listener());
}

export function PushNotificationPrompt() {
  const { status, enable, disable } = usePushSubscription();
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getDismissedServerSnapshot,
  );

  function dismiss() {
    markDismissed();
  }

  if (status === "checking" || status === "unsupported") return null;

  // Уже включено — компактная строка со статусом и возможностью отключить,
  // без баннера с крестиком (эту информацию скрывать не даём).
  if (status === "on" || status === "busy") {
    return (
      <div className="mb-4 flex items-center gap-2 text-xs text-brand-text/50">
        <BellIcon className="h-3.5 w-3.5 text-brand-cyan" />
        <span>Уведомления о новостях включены</span>
        <button
          type="button"
          onClick={disable}
          disabled={status === "busy"}
          className="underline decoration-dotted underline-offset-2 hover:text-brand-text/80 disabled:opacity-50"
        >
          отключить
        </button>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <Card className="mb-4">
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-cyan/15 text-brand-cyan">
            <BellIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Уведомления о новостях</p>
            {status === "needs-install" ? (
              <p className="mt-0.5 text-xs text-brand-text/60">
                На iPhone уведомления работают только после того, как сайт добавлен
                на экран «Домой». {" "}
                <a href="/install" className="underline decoration-dotted underline-offset-2">
                  Как это сделать
                </a>
              </p>
            ) : status === "denied" ? (
              <p className="mt-0.5 text-xs text-brand-text/60">
                Уведомления заблокированы в настройках браузера — разрешите их для
                этого сайта, чтобы получать push о новостях школы.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-brand-text/60">
                Получайте push, когда тренер публикует новость или событие школы
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status === "off" && (
            <Button type="button" size="sm" onClick={enable}>
              Включить
            </Button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Закрыть"
            className="rounded-lg px-2 py-1.5 text-lg leading-none text-brand-text/40 transition hover:text-brand-text/70"
          >
            ×
          </button>
        </div>
      </CardBody>
    </Card>
  );
}
