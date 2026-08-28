import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_AUTH_REDIRECT,
  isAuthPublicPath,
  SIGN_IN_PATH,
} from "@/lib/auth/constants";
import { getAuthTokenKey } from "@/lib/env";

function hasSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get(getAuthTokenKey())?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = hasSession(request);

  if (pathname === "/") {
    const destination = loggedIn ? DEFAULT_AUTH_REDIRECT : SIGN_IN_PATH;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAuthPublicPath(pathname)) {
    if (loggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
    }
    return NextResponse.next();
  }

  if (!loggedIn) {
    const signInUrl = new URL(SIGN_IN_PATH, request.url);
    if (pathname !== SIGN_IN_PATH) {
      signInUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
