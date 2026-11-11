import type { NextAuthConfig } from "next-auth";
import { canAccess, type AppRole } from "@/lib/rbac";

/** Edge-safe config (no Prisma, no bcrypt) – shared by middleware and auth.ts */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h = one shift
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith("/login")) {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      if (!isLoggedIn) return false; // → redirected to /login

      if (!canAccess(auth.user.role, pathname)) {
        return Response.redirect(new URL("/forbidden", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.department = user.department;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as AppRole;
      session.user.department = token.department as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
