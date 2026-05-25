'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '@/hooks/use-auth';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

/**
 * Página de login do Scrumban.
 *
 * Valida email e senha via Zod + React Hook Form.
 * Em caso de sucesso, a mutation redireciona automaticamente para /.
 */
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useLogin();
  const onSubmit = form.handleSubmit((data) => login.mutate(data));

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-1">
          Bem-vindo de volta
        </h1>
        <div className="w-8 h-px bg-white/20 mt-2 mb-3" />
        <p className="text-sm text-zinc-500">
          Entre na sua conta para continuar
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white bg-white/[0.04] border border-white/[0.07] placeholder-zinc-700 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-400">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-white bg-white/[0.04] border border-white/[0.07] placeholder-zinc-700 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]"
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-400">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-black bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99] mt-1"
        >
          {login.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Entrando...
            </span>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      {/* Link para registro */}
      <p className="text-center text-sm text-zinc-600 mt-8">
        Não tem conta?{' '}
        <Link
          href="/register"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Criar conta
        </Link>
      </p>

      {/* Credenciais demo */}
      {process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' && (
        <div className="mt-6 px-3.5 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs text-zinc-500 font-medium mb-1">Modo demonstração</p>
          <p className="text-xs text-zinc-600">demo@scrumban.com · demo1234</p>
        </div>
      )}
    </div>
  );
}
