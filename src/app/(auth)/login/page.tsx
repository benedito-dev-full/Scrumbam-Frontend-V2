'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
        <h1 className="text-2xl font-bold text-[#e4e4e7] mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-[#71717a]">
          Entre na sua conta para continuar
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#a1a1aa]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="auth-input w-full px-3.5 py-2.5 rounded-xl text-sm text-[#e4e4e7] placeholder-[#3f3f46] transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              outline: 'none',
            }}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-400 mt-0.5">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[#a1a1aa]">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="auth-input w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-[#e4e4e7] placeholder-[#3f3f46] transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                outline: 'none',
              }}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-400 mt-0.5">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-2 transition-all active:scale-[0.98]"
          style={{
            background: login.isPending
              ? 'rgba(124,111,247,0.5)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            cursor: login.isPending ? 'not-allowed' : 'pointer',
            boxShadow: login.isPending ? 'none' : '0 0 20px rgba(124,111,247,0.25)',
          }}
        >
          {login.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Entrando...
            </span>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-xs text-[#3f3f46]">ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Link para registro */}
      <p className="text-center text-sm text-[#52525b]">
        Não tem conta?{' '}
        <Link
          href="/register"
          className="text-[#0ea5e9] font-medium hover:text-[#67e8f9] transition-colors"
        >
          Criar conta grátis
        </Link>
      </p>

      {/* Credenciais demo — visível apenas em modo mock */}
      {process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' && (
        <div
          style={{
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(34,211,238,0.05)',
            border: '1px solid rgba(34,211,238,0.15)',
          }}
        >
          <p style={{ fontSize: 11, color: '#22d3ee', margin: 0, fontWeight: 600, marginBottom: 4 }}>
            Modo demonstração
          </p>
          <p style={{ fontSize: 11, color: '#71717a', margin: 0 }}>
            Email: demo@scrumban.com · Senha: demo1234
          </p>
        </div>
      )}
    </div>
  );
}
