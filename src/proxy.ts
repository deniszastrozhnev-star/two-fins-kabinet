import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";

export const config = {
  matcher: ["/trainer/:path*", "/parent/:path*"],
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

  return NextResponse.next();
}
