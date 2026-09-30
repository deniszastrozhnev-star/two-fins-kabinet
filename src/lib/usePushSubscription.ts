"use client";

import { useCallback, useSyncExternalStore } from "react";
import { subscribePushAction, unsubscribePushAction } from "@/lib/actions/push-actions";

export type PushStatus =
  | "checking"
  | "unsupported"
  | "needs-install"
  | "denied"
  | "off"
  | "on"
  | "busy";

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

// Статус подписки общий на весь таб (модульный синглтон), а не приватный
// per-компонент стейт: карточка ребёнка в шапке и полная плашка в "Новостях" —
// два разных смонтированных экземпляра одного и того же переключателя, и они
// должны немедленно видеть изменения друг друга без перезахода на страницу.
let sharedStatus: PushStatus = "checking";
let checkPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify(status: PushStatus) {
  sharedStatus = status;
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (!checkPromise) {
    checkPromise = determineStatus();
  }
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): PushStatus {
  return sharedStatus;
}

function getServerSnapshot(): PushStatus {
  return "checking";
}

async function determineStatus(): Promise<void> {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  if (!supported) return notify("unsupported");
  // На iPhone push работает только для сайта, добавленного на экран
  // «Домой» — вне этого режима подписка технически недоступна.
  if (isIOS && !isStandalone()) return notify("needs-install");
  if (Notification.permission === "denied") return notify("denied");

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    notify(existing ? "on" : "off");
  } catch {
    notify("unsupported");
  }
}

export function usePushSubscription() {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const enable = useCallback(async () => {
    notify("busy");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("VAPID public key не задан");

      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        notify(permission === "denied" ? "denied" : "off");
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
      notify("on");
    } catch (err) {
      console.error("push: не удалось включить уведомления", err);
      notify("off");
    }
  }, []);

  const disable = useCallback(async () => {
    notify("busy");
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
      notify("off");
    }
  }, []);

  return { status, enable, disable };
}
