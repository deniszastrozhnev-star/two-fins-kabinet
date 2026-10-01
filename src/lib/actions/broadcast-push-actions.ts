"use server";

import { revalidatePath } from "next/cache";
import { requireHeadTrainer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastPush, countActiveSubscriberFamilies } from "@/lib/push";

export type BroadcastPushState = { success?: string; error?: string } | undefined;

/** Ручная рассылка произвольного push-текста всем подписанным родителям —
 * та же инфраструктура (broadcastPush), что и у автоматических напоминаний,
 * только текст и момент отправки задаёт сам HEAD-тренер, а не планировщик.
 * Количество получателей для подтверждения в UI считается заранее на сервере
 * (см. countActiveSubscriberFamilies в src/app/trainer/settings/page.tsx) —
 * здесь пересчитываем ещё раз перед самой отправкой, чтобы в истории
 * сохранилось точное число на момент отправки, а не на момент открытия
 * страницы. */
export async function sendBroadcastPushAction(
  _prevState: BroadcastPushState,
  formData: FormData,
): Promise<BroadcastPushState> {
  const trainer = await requireHeadTrainer();

  const text = String(formData.get("text") ?? "").trim();
  if (!text) {
    return { error: "Введите текст уведомления" };
  }

  const recipientCount = await countActiveSubscriberFamilies();

  await broadcastPush({ title: "Сообщение от школы", body: text, url: "/parent" });

  await prisma.broadcastPushSent.create({
    data: { text, recipientCount, sentByTrainerId: trainer.id },
  });

  revalidatePath("/trainer/settings");
  return { success: `Отправлено. Активных подписок на момент отправки: ${recipientCount}.` };
}
