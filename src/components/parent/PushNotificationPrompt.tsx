"use client";

import { useEffect, useState } from "react";
import { subscribePushAction, unsubscribePushAction } from "@/lib/actions/push-actions";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BellIcon } from "@/components/icons";

const DISMISS_KEY = "twofins:hidePushPrompt";

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari — нестандартный, но единственный способ узнать про PWA-режим
  // (см. такую же проверку в InAppBrowserBanner.tsx).
  return Boolean((window.navigator as { standalone?: boolean }).standalone);
}

// Web Push API ждёт applicationServerKey в виде Uint8Array, а VAPID-ключ
// приходит в URL-safe base64 — стандартное преобразование между ними.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

type Status =
  | "checking"
  | "unsupported"
  | "needs-install"
  | "denied"
  | "off"
  | "on"
  | "busy";

export function PushNotificationPrompt() {
  const [status, setStatus] = useState<Status>("checking");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    if (!supported) {
      setStatus("unsupported");
      return;
    }
    // На iPhone push работает только для сайта, добавленного на экран
    // «Домой» — вне этого режима подписка технически недоступна.
    if (isIOS && !isStandalone()) {
      setStatus("needs-install");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => setStatus(existing ? "on" : "off"))
      .catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setStatus("busy");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("VAPID public key не задан");

      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Некорректная подписка");
      }
      await subscribePushAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("on");
    } catch (err) {
      console.error("push: не удалось включить уведомления", err);
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("busy");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await unsubscribePushAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
    } catch (err) {
      console.error("push: не удалось отключить уведомления", err);
    } finally {
      setStatus("off");
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
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
