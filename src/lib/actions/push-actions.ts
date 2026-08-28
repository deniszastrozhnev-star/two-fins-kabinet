"use server";

import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";

type PushKeys = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Сохраняет/обновляет push-подписку текущего родителя. Вызывается напрямую
 * из клиентского компонента (не через <form>), поэтому принимает обычный
 * объект, а не FormData. */
export async function subscribePushAction(sub: PushKeys): Promise<void> {
  const child = await requireParentChild();
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      childId: child.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    update: {
      childId: child.id,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
}

export async function unsubscribePushAction(endpoint: string): Promise<void> {
  await requireParentChild();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
