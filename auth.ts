import NextAuth from "next-auth";
import { sendVerificationRequest } from "@/lib/auth-send-request";
import { authAdapter } from "@/lib/auth-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: authAdapter,
  providers: [
    {
      id: "email",
      name: "Email",
      type: "email",
      maxAge: 60 * 60 * 24, // 24時間
      sendVerificationRequest,
      // 照合ずれを防ぐため、保存時・URL・照合時すべてで同じ形に
      normalizeIdentifier: (id) => id?.trim().toLowerCase() ?? "",
    },
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session, user }) {
      if (session.user && user?.id) {
        // セッション作成時点では User は必ず DB に存在する。このタイミングで Entitlement を1件用意する。
        await prisma.entitlement.upsert({
          where: { userId: user.id },
          create: { userId: user.id, status: "inactive" },
          update: {},
        });
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        (session.user as { id?: string; role?: string }).id = user.id;
        (session.user as { role?: string }).role = dbUser?.role ?? "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
});
