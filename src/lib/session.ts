import { SignJWT, jwtVerify } from "jose";

export type SessionPayload =
  | { role: "trainer"; trainerId: string }
  | { role: "parent"; childId: string }
  | { role: "athlete"; athleteId: string };

const COOKIE_NAME = "session";
// Единый срок для всех ролей — раньше тренер получал всего 30 дней, а
// родитель/спортсмен 180; вместе со скользящим продлением в src/proxy.ts
// (перевыпускает токен при каждом заходе) это означает, что вход не
// слетает, пока пользователь сам не нажмёт «Выйти» — при условии, что он
// заходит в кабинет хотя бы раз в 90 дней.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 дней

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET не задан в переменных окружения");
  }
  return new TextEncoder().encode(secret);
}

export function maxAgeFor(_role: SessionPayload["role"]): number {
  return SESSION_MAX_AGE_SECONDS;
}

/** Общие опции cookie сессии — используются и при первом входе (src/lib/auth.ts),
 * и при скользящем продлении на каждом запросе (src/proxy.ts). */
export function sessionCookieOptions(role: SessionPayload["role"]) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeFor(role),
  };
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeFor(payload.role)}s`)
    .sign(getSecretKey());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role === "trainer" && typeof payload.trainerId === "string") {
      return { role: "trainer", trainerId: payload.trainerId };
    }
    if (payload.role === "parent" && typeof payload.childId === "string") {
      return { role: "parent", childId: payload.childId };
    }
    if (payload.role === "athlete" && typeof payload.athleteId === "string") {
      return { role: "athlete", athleteId: payload.athleteId };
    }
    return null;
  } catch {
    return null;
  }
}

/** Возраст токена в секундах — без повторной crypto-проверки (используется в
 * src/proxy.ts сразу после verifySession в том же запросе, токен уже доверенный).
 * Нужен, чтобы не перевыпускать и не перезаписывать cookie на каждом запросе —
 * только когда скользящее окно правда пора продлить. */
export function getSessionAgeSeconds(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const payloadB64 = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    return typeof json.iat === "number" ? Math.floor(Date.now() / 1000) - json.iat : null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
