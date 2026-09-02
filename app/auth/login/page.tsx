'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Введите корректный email';
    if (password.length < 8) next.password = 'Пароль должен быть не короче 8 символов';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setErrors({ form: 'Неверный email или пароль' });
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md bg-surface2 border border-border rounded-lg p-8"
    >
      <h1 className="text-2xl font-semibold text-text mb-1">Вход в аккаунт</h1>
      <p className="text-text-secondary text-sm mb-8">Рады видеть тебя снова в DATAPOST</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Пароль"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        {errors.form && (
          <p className="text-sm text-danger bg-danger-subtle border border-danger/30 rounded-lg px-3 py-2">
            {errors.form}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" isLoading={loading}>
          Войти
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Нет аккаунта?{' '}
        <Link href="/auth/register" className="text-accent-hover hover:underline">
          Зарегистрироваться
        </Link>
      </p>

      <p className="text-center text-xs text-text-muted mt-4">
        Тестовый доступ: test@datapost.ru / test12345
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
