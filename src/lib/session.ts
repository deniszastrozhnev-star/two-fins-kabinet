import { SignJWT, jwtVerify } from "jose";

export type SessionPayload =
  | { role: "trainer"; trainerId: string }
  | { role: "parent"; childId: string }
  | { role: "athlete"; childId: string };

const COOKIE_NAME = "session";
const TRAINER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 дней
const PARENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 дней

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET не задан в переменных окружения");
  }
  return new TextEncoder().encode(secret);
}

export function maxAgeFor(role: SessionPayload["role"]): number {
  return role === "trainer" ? TRAINER_MAX_AGE_SECONDS : PARENT_MAX_AGE_SECONDS;
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
    if (payload.role === "athlete" && typeof payload.childId === "string") {
      return { role: "athlete", childId: payload.childId };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
