import "server-only";
import { prisma } from "@/lib/prisma";

type PushPayload = { title: string; body: string; url?: string };

let configured: boolean | null = null;

// web-push инициализируется один раз лениво (а не top-level import), чтобы
// отсутствие VAPID-ключей в окружении не роняло сборку/запуск — просто не
// отправляли бы уведомления. См. src/lib/contractPdf.ts за прецедентом, где
// неиспользуемый top-level import уже один раз клал весь сервер.
async function getWebPush() {
  if (configured === false) return null;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    if (configured === null) {
      console.error("push: VAPID_PRIVATE_KEY/NEXT_PUBLIC_VAPID_PUBLIC_KEY не заданы, пуши отключены");
    }
    configured = false;
    return null;
  }
  const webpush = (await import("web-push")).default;
  if (!configured) {
    webpush.setVapidDetails("mailto:deniszastrozhnev@gmail.com", publicKey, privateKey);
    configured = true;
  }
  return webpush;
}

/** Рассылает push всем подписанным родителям. Тихо no-op, если пуши не настроены. */
export async function broadcastPush(payload: PushPayload): Promise<void> {
  const webpush = await getWebPush();
  if (!webpush) return;

  const subs = await prisma.pushSubscription.findMany();
  const staleIds: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err) {
        // 404/410 — подписка отозвана или устройство больше не существует,
        // остальные коды (сеть, временный сбой push-сервиса) не трогаем.
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        } else {
          console.error("push: не удалось отправить уведомление", err);
        }
      }
    }),
  );

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } }).catch(() => {});
  }
}
