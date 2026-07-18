"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { parseDateInputValue } from "@/lib/dates";

export type ActionState = { error?: string } | undefined;

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
  const birthDateStr = String(formData.get("birthDate") ?? "");

  if (!lastName || !firstName || !birthDateStr) {
    return { error: "Заполните все поля" };
  }
  const birthDate = parseDateInputValue(birthDateStr);

  // Спортсмены — полностью отдельная от "Детей" система: если по ФИО+дате
  // рождения записи ещё нет, она создаётся прямо здесь, самостоятельной
  // регистрацией — без участия тренера и без связи с базой учеников школы.
  let athlete = await prisma.athlete.findFirst({
    where: {
      lastName: { equals: lastName, mode: "insensitive" },
      firstName: { equals: firstName, mode: "insensitive" },
      birthDate,
    },
  });

  if (!athlete) {
    athlete = await prisma.athlete.create({ data: { lastName, firstName, birthDate } });
  }

  await setSessionCookie({ role: "athlete", athleteId: athlete.id });
  redirect("/athlete");
}
