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

const CYAN = '#00d2c8';
const CYAN_DIM = 'rgba(0,210,200,0.5)';
const CYAN_BG = 'rgba(0,210,200,0.06)';

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

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    background: focused ? CYAN_BG : 'rgba(255,255,255,0.04)',
    border: `1px solid ${focused ? CYAN_DIM : 'rgba(255,255,255,0.08)'}`,
    color: '#e8f8f7',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color .15s, background .15s',
    boxSizing: 'border-box',
  });

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8f8f7', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Bem-vindo de volta
        </h1>
        <div style={{ width: 36, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${CYAN}, #00f5ea)`, marginBottom: 12 }} />
        <p style={{ fontSize: 13, color: '#3d6664', lineHeight: 1.5 }}>
          Entre na sua conta para continuar
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label htmlFor="email" style={{ fontSize: 11, fontWeight: 600, color: CYAN, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            style={inputStyle(emailFocused)}
            onFocus={() => setEmailFocused(true)}
            {...form.register('email', { onBlur: () => setEmailFocused(false) })}
          />
          {form.formState.errors.email && (
            <p style={{ fontSize: 12, color: '#f87171' }}>{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="password" style={{ fontSize: 11, fontWeight: 600, color: CYAN, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Senha
            </label>
            <button type="button" style={{ fontSize: 12, color: '#2a5c5a', background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => { (e.currentTarget).style.color = CYAN; }}
              onMouseLeave={e => { (e.currentTarget).style.color = '#2a5c5a'; }}
            >
              Esqueceu?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              style={{ ...inputStyle(passFocused), paddingRight: 44 }}
              onFocus={() => setPassFocused(true)}
              {...form.register('password', { onBlur: () => setPassFocused(false) })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 0, cursor: 'pointer', color: '#2a5c5a', padding: 2,
                display: 'flex', alignItems: 'center',
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
            width: '100%', padding: '12px 0', borderRadius: 10, border: 0,
            background: login.isPending
              ? 'rgba(0,210,200,0.3)'
              : `linear-gradient(135deg, #00c4ba 0%, #00a89e 100%)`,
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: login.isPending ? 'not-allowed' : 'pointer',
            marginTop: 4,
            boxShadow: login.isPending ? 'none' : '0 0 28px rgba(0,210,200,0.25)',
            letterSpacing: '-0.1px',
            transition: 'opacity .15s',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 22px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,210,200,0.08)' }} />
        <span style={{ fontSize: 11, color: '#1a3836' }}>ou</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,210,200,0.08)' }} />
      </div>

      {/* Link registro */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#2a5c5a' }}>
        Não tem conta?{' '}
        <Link
          href="/register"
          style={{ color: CYAN, fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.75'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1'; }}
        >
          Criar conta grátis
        </Link>
      </p>

      {/* Demo */}
      {process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' && (
        <div style={{
          marginTop: 20, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(0,210,200,0.05)',
          border: '1px solid rgba(0,210,200,0.15)',
        }}>
          <p style={{ fontSize: 11, color: CYAN, fontWeight: 600, marginBottom: 3 }}>Modo demonstração</p>
          <p style={{ fontSize: 11, color: '#2a5c5a' }}>demo@scrumban.com · demo1234</p>
        </div>
      )}
    </div>
  );
}
