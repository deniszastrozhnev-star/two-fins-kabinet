import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getSessionAgeSeconds,
  sessionCookieOptions,
  signSession,
  verifySession,
} from "@/lib/session";

// Перевыпускаем cookie не чаще раза в неделю вместо безусловно на каждом
// запросе — 90-дневное скользящее окно для активных пользователей по факту
// не меняется, просто перестаём слать лишний Set-Cookie на каждый клик.
const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 7;

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

  // Важно: сравнение по границе сегмента пути, а не startsWith — иначе
  // "/athlete-login".startsWith("/athlete") тоже true, и страницу входа
  // спортсмена (как и "/parent-login" для родителя) редиректило бы саму на
  // себя в бесконечном цикле. Актуально с тех пор, как matcher расширили на
  // все пути ради канонизации хоста — раньше более узкий matcher
  // ("/athlete/:path*") эту ситуацию просто не пропускал до этой проверки.
  const inSection = (section: string) => pathname === section || pathname.startsWith(`${section}/`);

  if (inSection("/trainer") && session?.role !== "trainer") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (inSection("/parent") && session?.role !== "parent") {
    const url = request.nextUrl.clone();
    url.pathname = "/parent-login";
    return NextResponse.redirect(url);
  }

  if (inSection("/athlete") && session?.role !== "athlete") {
    const url = request.nextUrl.clone();
    url.pathname = "/athlete-login";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Скользящее продление: перевыпускаем токен с новым сроком действия, поэтому
  // активный пользователь не разлогинится, пока сам не нажмёт «Выйти» —
  // фиксированный 90-дневный срок начинает отсчитываться заново с последнего
  // визита. Не на каждом запросе — только когда токену больше недели, иначе
  // каждый клик тратит время на подпись и добавляет лишний Set-Cookie в ответ.
  if (session) {
    const age = getSessionAgeSeconds(token);
    if (age === null || age > REFRESH_THRESHOLD_SECONDS) {
      const refreshed = await signSession(session);
      response.cookies.set(
        SESSION_COOKIE_NAME,
        refreshed,
        sessionCookieOptions(session.role),
      );
    }
  }

  return response;
}
