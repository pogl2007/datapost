'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Database, User } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/Button';
import { PlanBadge } from '@/components/layout/PlanBadge';
import { signOut } from 'next-auth/react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, plan } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-background/90 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-text font-semibold text-lg">
          <Database size={22} className="text-accent" />
          DATAPOST
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <PlanBadge plan={plan as 'FREE' | 'PRO'} />
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors px-3 py-1.5 rounded-lg hover:bg-surface2"
              >
                <span className="h-7 w-7 rounded-full bg-accent-subtle flex items-center justify-center">
                  <User size={14} className="text-accent-hover" />
                </span>
                Мой дашборд
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  Начать бесплатно
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
