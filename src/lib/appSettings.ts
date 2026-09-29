import "server-only";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

export async function getAppSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.appSettings.create({ data: { id: SINGLETON_ID } });
}

export async function setSendBirthdayGreetings(sendBirthdayGreetings: boolean) {
  return prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    update: { sendBirthdayGreetings },
    create: { id: SINGLETON_ID, sendBirthdayGreetings },
  });
}
