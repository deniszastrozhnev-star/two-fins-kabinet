"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "twofins:hideInAppBrowserBanner";

// Встроенные браузеры мессенджеров/соцсетей на Android — не тот же движок,
// что системный Chrome: часть JS/CSS-поведения (в т.ч. обработка тач-событий)
// и сама возможность "Добавить на экран Домой" там могут работать иначе или
// отсутствовать. Определяем по узнаваемым токенам в User-Agent — они
// добавляются самими приложениями.
const KNOWN_APPS: { pattern: RegExp; name: string }[] = [
  { pattern: /Instagram/i, name: "Instagram" },
  { pattern: /FBAN|FBAV|FB_IAB/i, name: "Facebook" },
  { pattern: /\bWhatsApp\b/i, name: "WhatsApp" },
  { pattern: /\bTelegram\b/i, name: "Telegram" },
  { pattern: /\bLine\//i, name: "Line" },
  { pattern: /MicroMessenger/i, name: "WeChat" },
  { pattern: /VKAndroidApp|VKClient/i, name: "VK" },
  { pattern: /TikTok|musical_ly|BytedanceWebview/i, name: "TikTok" },
  { pattern: /Snapchat/i, name: "Snapchat" },
  { pattern: /OKApp|Odnoklassniki/i, name: "Одноклассники" },
];

type Detection = { appName: string | null; isAndroid: boolean; isIOS: boolean } | null;

function detect(ua: string): Detection {
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  const known = KNOWN_APPS.find((app) => app.pattern.test(ua));
  if (known) return { appName: known.name, isAndroid, isIOS };

  // На Android многие встроенные браузеры не оставляют узнаваемого токена
  // приложения, но выдают себя общим маркером системного WebView ("; wv)") —
  // обычный Chrome его не добавляет. На iOS такого надёжного общего маркера
  // нет (WKWebView может выглядеть неотличимо от Safari), поэтому там
  // полагаемся только на конкретные токены выше.
  if (isAndroid && /\bwv\b/.test(ua)) {
    return { appName: null, isAndroid, isIOS };
  }

  return null;
}

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari — нестандартный, но единственный способ узнать про PWA-режим.
  return Boolean((window.navigator as { standalone?: boolean }).standalone);
}

export function InAppBrowserBanner() {
  const [detection, setDetection] = useState<Detection>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    if (isStandalone()) return;
    setDetection(detect(navigator.userAgent));
  }, []);

  if (!detection) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDetection(null);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Буфер обмена недоступен в некоторых встроенных браузерах — ссылку
      // всё ещё можно скопировать вручную из адресной строки, если она есть.
    }
  }

  const appLabel = detection.appName ? `браузере ${detection.appName}` : "встроенном браузере приложения";
  const targetBrowser = detection.isIOS ? "Safari" : "Chrome";

  return (
    <div className="relative z-30 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="font-medium text-amber-200">
            Сайт открыт во {appLabel} — часть функций и добавление на экран «Домой» здесь может не
            работать.
          </p>
          <p className="mt-1 text-amber-100/80">
            Откройте этот сайт в {targetBrowser}, чтобы всё работало без сбоев:{" "}
            {detection.isIOS
              ? "нажмите «⋯» и выберите «Открыть в Safari», либо скопируйте ссылку и вставьте её в Safari."
              : "нажмите «⋮» и выберите «Открыть в Chrome» (если такой пункт есть), либо скопируйте ссылку и вставьте её в Chrome."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="whitespace-nowrap rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-500/25"
          >
            {copied ? "Ссылка скопирована!" : "Скопировать ссылку"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Закрыть"
            className="rounded-lg px-2 py-1.5 text-lg leading-none text-amber-200/70 transition hover:text-amber-100"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
