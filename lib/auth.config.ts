import type { NextAuthConfig } from 'next-auth';

// Edge-safe NextAuth config (no Prisma/bcrypt imports here — those need the
// Node.js runtime and would break when this config is loaded by middleware,
// which runs on the Edge runtime). The Credentials provider (which needs
// Prisma) is added on top of this in lib/auth.ts for use in route handlers
// and server components.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
  },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = (user as { id: string }).id;
        token.plan = (user as { plan: string }).plan;
      }
      if (trigger === 'update' && session?.plan) {
        token.plan = session.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { plan?: string }).plan = token.plan as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
