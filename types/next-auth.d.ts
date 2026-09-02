import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: 'FREE' | 'PRO';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    plan: 'FREE' | 'PRO';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    plan: 'FREE' | 'PRO';
  }
}
