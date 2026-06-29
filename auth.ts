import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email || !account.providerAccountId) {
        return false;
      }
      await db.user.upsert({
        where: { googleId: account.providerAccountId },
        update: {
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        },
        create: {
          googleId: account.providerAccountId,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        },
      });
      return true;
    },
    async jwt({ token, account }) {
      // On first sign-in `account` is present — look up our DB user once and
      // pin their id on the token so future requests skip the lookup.
      if (account?.providerAccountId) {
        const dbUser = await db.user.findUnique({
          where: { googleId: account.providerAccountId },
          select: { id: true },
        });
        if (dbUser) token.userId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
