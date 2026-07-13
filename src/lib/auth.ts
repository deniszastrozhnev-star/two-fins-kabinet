import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  maxAgeFor,
  signSession,
  verifySession,
} from "@/lib/session";

/**
 * Обёрнуто в React cache(): и layout, и сама страница вызывают requireTrainer()/
 * requireParentChild() независимо — без мемоизации это два похода в базу на
 * каждую загрузку страницы вместо одного.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE_NAME)?.value);
});

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeFor(payload.role),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Требует сессию тренера в Server Component/Action; иначе редиректит на /login. Возвращает данные тренера. */
export const requireTrainer = cache(async () => {
  const session = await getSession();
  if (!session || session.role !== "trainer") {
    redirect("/login");
  }
  const trainer = await prisma.trainer.findUnique({
    where: { id: session.trainerId },
  });
  if (!trainer) {
    redirect("/login");
  }
  return trainer;
});

/** Требует сессию ГЛАВНОГО тренера; обычного тренера редиректит на /trainer. Возвращает данные тренера. */
export const requireHeadTrainer = cache(async () => {
  const trainer = await requireTrainer();
  if (trainer.role !== "HEAD") {
    redirect("/trainer");
  }
  return trainer;
});

/** Требует сессию родителя в Server Component/Action; иначе редиректит на /parent-login. Возвращает ребёнка. */
export const requireParentChild = cache(async () => {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    redirect("/parent-login");
  }
  const child = await prisma.child.findUnique({
    where: { id: session.childId },
    include: { group: true },
  });
  if (!child) {
    redirect("/parent-login");
  }
  return child;
});
