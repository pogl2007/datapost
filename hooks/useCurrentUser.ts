'use client';

import { useSession } from 'next-auth/react';

export function useCurrentUser() {
  const { data: session, status, update } = useSession();

  return {
    user: session?.user ?? null,
    plan: session?.user?.plan ?? 'FREE',
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    update,
  };
}
