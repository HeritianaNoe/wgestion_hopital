import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { canAccess } from "@/lib/rbac";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAuthPage = pathname.startsWith("/login");

  if (isAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = req.auth?.user?.role;
  if (!canAccess(role, pathname)) {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
