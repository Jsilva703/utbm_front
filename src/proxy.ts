import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FRONTEND_ADMIN_SESSION_COOKIE } from "@/lib/admin/types";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(FRONTEND_ADMIN_SESSION_COOKIE)?.value);

  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/admin", "/admin/athletes", "/admin/races", "/admin/tracking-sessions"],
};
