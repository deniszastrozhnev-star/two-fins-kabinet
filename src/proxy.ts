import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSession,
  verifySession,
} from "@/lib/session";

// Помимо основного продакшен-алиаса Vercel-проект отдаёт ещё несколько
// доменов (team-alias, git-branch alias, per-deploy URL) — у них СВОЙ
// cookie jar, сессия с одного не видна на другом. Все они требуют Vercel SSO
// и реальным пользователям недоступны, но домен на всякий случай
// канонизируем — если пользователь всё же попадёт на другой алиас (старая
// ссылка, кэш и т.п.), редиректим на канонический до применения сессии.
const CANONICAL_HOST = "two-fins-kabinet.vercel.app";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|apple-icon.png|icon.png).*)",
  ],
};

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (process.env.NODE_ENV === "production" && host && host !== CANONICAL_HOST) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/trainer") && session?.role !== "trainer") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/parent") && session?.role !== "parent") {
    const url = request.nextUrl.clone();
    url.pathname = "/parent-login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/athlete") && session?.role !== "athlete") {
    const url = request.nextUrl.clone();
    url.pathname = "/athlete-login";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Скользящее продление: при каждом заходе перевыпускаем токен с новым
  // сроком действия, поэтому активный пользователь не разлогинится, пока
  // сам не нажмёт «Выйти» — фиксированный 90-дневный срок начинает
  // отсчитываться заново с последнего визита.
  if (session) {
    const refreshed = await signSession(session);
    response.cookies.set(
      SESSION_COOKIE_NAME,
      refreshed,
      sessionCookieOptions(session.role),
    );
  }

  return response;
}
