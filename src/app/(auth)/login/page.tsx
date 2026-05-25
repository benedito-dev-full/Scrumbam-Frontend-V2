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

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e8e8f0',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color .15s, background .15s',
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useLogin();
  const onSubmit = form.handleSubmit((data) => login.mutate(data));

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f8', marginBottom: 6, letterSpacing: '-0.3px' }}>
          Bem-vindo de volta
        </h1>
        {/* acento índigo */}
        <div style={{ width: 32, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', marginBottom: 10 }} />
        <p style={{ fontSize: 13, color: '#6b6b80' }}>
          Entre na sua conta para continuar
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="email" style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            style={{
              ...INPUT_STYLE,
              borderColor: emailFocused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
              background: emailFocused ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.04)',
            }}
            onFocus={() => setEmailFocused(true)}
            {...form.register('email', { onBlur: () => setEmailFocused(false) })}
          />
          {form.formState.errors.email && (
            <p style={{ fontSize: 12, color: '#f87171' }}>{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="password" style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Senha
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                ...INPUT_STYLE,
                paddingRight: 42,
                borderColor: passFocused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                background: passFocused ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.04)',
              }}
              onFocus={() => setPassFocused(true)}
              {...form.register('password', { onBlur: () => setPassFocused(false) })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 0, cursor: 'pointer',
                color: '#4b4b60', padding: 2,
              }}
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p style={{ fontSize: 12, color: '#f87171' }}>{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={login.isPending}
          style={{
            width: '100%',
            padding: '11px 0',
            borderRadius: 10,
            border: 0,
            background: login.isPending
              ? 'rgba(99,102,241,0.4)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: login.isPending ? 'not-allowed' : 'pointer',
            marginTop: 4,
            transition: 'opacity .15s',
            boxShadow: login.isPending ? 'none' : '0 0 24px rgba(99,102,241,0.3)',
            letterSpacing: '-0.1px',
          }}
        >
          {login.isPending ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.75" />
              </svg>
              Entrando...
            </span>
          ) : 'Entrar'}
        </button>
      </form>

      {/* Divisor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontSize: 11, color: '#3a3a4a' }}>ou</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Link registro */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#4b4b60' }}>
        Não tem conta?{' '}
        <Link
          href="/register"
          style={{ color: '#818cf8', fontWeight: 500, textDecoration: 'none' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = '#a5b4fc'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = '#818cf8'; }}
        >
          Criar conta grátis
        </Link>
      </p>

      {/* Demo */}
      {process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' && (
        <div style={{
          marginTop: 20, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.18)',
        }}>
          <p style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, marginBottom: 3 }}>Modo demonstração</p>
          <p style={{ fontSize: 11, color: '#4b4b60' }}>demo@scrumban.com · demo1234</p>
        </div>
      )}
    </div>
  );
}
