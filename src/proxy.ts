import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSession,
  verifySession,
} from "@/lib/session";

export const config = {
  matcher: ["/trainer/:path*", "/parent/:path*", "/athlete/:path*"],
};

export async function proxy(request: NextRequest) {
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
