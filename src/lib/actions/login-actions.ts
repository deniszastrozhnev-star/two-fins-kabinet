"use server";

import { redirect } from "next/navigation";
import { format, isValid } from "date-fns";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

export type ActionState = { error?: string } | undefined;

/** Разбирает пароль спортсмена ДДММГГГГ в дату; null, если формат или сама дата невалидны. */
function parseBirthDatePassword(raw: string): Date | null {
  if (!/^\d{8}$/.test(raw)) return null;
  const day = Number(raw.slice(0, 2));
  const month = Number(raw.slice(2, 4));
  const year = Number(raw.slice(4, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!isValid(date)) return null;
  // new Date переносит "31 февраля" на март и т.п. — проверяем, что компоненты не съехали
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  if (date.getTime() > Date.now()) return null;
  return date;
}

export async function trainerLoginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Введите логин и пароль" };
  }

  const trainer = await prisma.trainer.findUnique({ where: { username } });
  if (!trainer) {
    return { error: "Неверный логин или пароль" };
  }

  const ok = await verifyPassword(password, trainer.passwordHash);
  if (!ok) {
    return { error: "Неверный логин или пароль" };
  }

  await setSessionCookie({ role: "trainer", trainerId: trainer.id });
  redirect("/trainer");
}

export async function parentLoginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const lastName = String(formData.get("lastName") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "");

  if (!lastName || !firstName || !phoneRaw) {
    return { error: "Заполните все поля" };
  }

  const phone = normalizePhone(phoneRaw);
  const child = await prisma.child.findFirst({
    where: {
      parentPhone: phone,
      lastName: { equals: lastName, mode: "insensitive" },
      firstName: { equals: firstName, mode: "insensitive" },
    },
  });

  if (!child) {
    return {
      error:
        "Не удалось найти ребёнка с такими данными. Проверьте правильность фамилии, имени и номера телефона, либо обратитесь к тренеру.",
    };
  }

  await setSessionCookie({ role: "parent", childId: child.id });
  redirect("/parent");
}

export async function athleteLoginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const lastName = String(formData.get("lastName") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!lastName || !firstName || !password) {
    return { error: "Заполните все поля" };
  }

  const child = await prisma.child.findFirst({
    where: {
      lastName: { equals: lastName, mode: "insensitive" },
      firstName: { equals: firstName, mode: "insensitive" },
    },
  });

  if (!child) {
    return {
      error:
        "Не удалось найти спортсмена с такими данными. Проверьте фамилию и имя, либо обратитесь к тренеру.",
    };
  }

  if (!child.birthDate) {
    // Первый вход этого спортсмена — введённая дата рождения привязывается
    // к его записи и становится паролем на будущее.
    const birthDate = parseBirthDatePassword(password);
    if (!birthDate) {
      return {
        error: "Введите дату рождения в формате ДДММГГГГ, например 06041992",
      };
    }
    await prisma.child.update({ where: { id: child.id }, data: { birthDate } });
    await setSessionCookie({ role: "athlete", childId: child.id });
    redirect("/athlete");
  }

  if (format(child.birthDate, "ddMMyyyy") !== password) {
    return { error: "Неверный пароль" };
  }

  await setSessionCookie({ role: "athlete", childId: child.id });
  redirect("/athlete");
}
