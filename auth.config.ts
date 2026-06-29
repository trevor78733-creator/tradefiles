import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe config (no DB). Imported by proxy.ts. The full auth.ts adds the
// signIn/jwt/session callbacks that touch Prisma — those run in the Node
// runtime, not at the edge.
export const authConfig = {
  providers: [Google],
  // Fall back to SESSION_SECRET so existing .env files keep working without
  // a rename. Auth.js prefers AUTH_SECRET.
  secret: process.env.AUTH_SECRET ?? process.env.SESSION_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      if (isOnLogin) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
