"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";

export async function signUpForEventAction(formData: FormData) {
  const child = await requireParentChild();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) throw new Error("Не найдено событие");

  await prisma.eventSignup.upsert({
    where: { eventId_childId: { eventId, childId: child.id } },
    create: { eventId, childId: child.id },
    update: {},
  });

  revalidatePath("/parent/events");
  revalidatePath("/trainer/events");
}

export async function cancelSignupAction(formData: FormData) {
  const child = await requireParentChild();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) throw new Error("Не найдено событие");

  await prisma.eventSignup.deleteMany({
    where: { eventId, childId: child.id },
  });

  revalidatePath("/parent/events");
  revalidatePath("/trainer/events");
}
