import "server-only";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

export async function getFinanceSettings() {
  const existing = await prisma.financeSettings.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (existing) return existing;
  return prisma.financeSettings.create({
    data: { id: SINGLETON_ID },
  });
}

export async function setMonthlyRent(monthlyRentRub: number) {
  return prisma.financeSettings.upsert({
    where: { id: SINGLETON_ID },
    update: { monthlyRentRub },
    create: { id: SINGLETON_ID, monthlyRentRub },
  });
}
