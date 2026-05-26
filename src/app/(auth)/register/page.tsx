'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/use-auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  organizationName: z
    .string()
    .transform((v) => v?.trim() || undefined)
    .optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

const CYAN = '#00d2c8';
const CYAN_DIM = 'rgba(0,210,200,0.5)';
const CYAN_BG = 'rgba(0,210,200,0.06)';

export default function RegisterPage() {
  const [focused, setFocused] = useState<string | null>(null);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', organizationName: '' },
  });

  const register = useRegister();
  const onSubmit = form.handleSubmit((data) => register.mutate(data));

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    background: focused === field ? CYAN_BG : 'var(--border)',
    border: `1px solid ${focused === field ? CYAN_DIM : 'var(--border)'}`,
    color: '#e8f8f7',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color .15s, background .15s',
    boxSizing: 'border-box',
  });

  const LABEL: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: CYAN,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8f8f7', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Crie sua conta
        </h1>
        <div style={{ width: 36, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${CYAN}, #00f5ea)`, marginBottom: 12 }} />
        <p style={{ fontSize: 13, color: '#3d6664', lineHeight: 1.5 }}>
          Comece grátis, sem cartão de crédito
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Nome */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label htmlFor="name" style={LABEL}>Seu nome</label>
          <input
            id="name" type="text" autoComplete="name" placeholder="João Silva"
            style={inputStyle('name')}
            onFocus={() => setFocused('name')}
            {...form.register('name', { onBlur: () => setFocused(null) })}
          />
          {form.formState.errors.name && (
            <p style={{ fontSize: 12, color: '#f87171' }}>{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label htmlFor="email" style={LABEL}>Email</label>
          <input
            id="email" type="email" autoComplete="email" placeholder="seu@email.com"
            style={inputStyle('email')}
            onFocus={() => setFocused('email')}
            {...form.register('email', { onBlur: () => setFocused(null) })}
          />
          {form.formState.errors.email && (
            <p style={{ fontSize: 12, color: '#f87171' }}>{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label htmlFor="password" style={LABEL}>Senha</label>
          <input
            id="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres"
            style={inputStyle('password')}
            onFocus={() => setFocused('password')}
            {...form.register('password', { onBlur: () => setFocused(null) })}
          />
          {form.formState.errors.password && (
            <p style={{ fontSize: 12, color: '#f87171' }}>{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Organização */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label htmlFor="organizationName" style={LABEL}>
            Organização{' '}
            <span style={{ color: '#1a3836', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
          </label>
          <input
            id="organizationName" type="text" autoComplete="organization" placeholder="Ex: Minha Empresa"
            style={inputStyle('org')}
            onFocus={() => setFocused('org')}
            {...form.register('organizationName', { onBlur: () => setFocused(null) })}
          />
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={register.isPending}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 0,
            background: register.isPending
              ? 'rgba(0,210,200,0.3)'
              : 'linear-gradient(135deg, #00c4ba 0%, #00a89e 100%)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: register.isPending ? 'not-allowed' : 'pointer',
            marginTop: 4,
            boxShadow: register.isPending ? 'none' : '0 0 28px rgba(0,210,200,0.25)',
            letterSpacing: '-0.1px',
          }}
        >
          {register.isPending ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.75" />
              </svg>
              Criando conta...
            </span>
          ) : 'Criar conta grátis'}
        </button>
      </form>

      {/* Divisor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,210,200,0.08)' }} />
        <span style={{ fontSize: 11, color: '#1a3836' }}>ou</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,210,200,0.08)' }} />
      </div>

      {/* Link login */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#2a5c5a' }}>
        Já tem conta?{' '}
        <Link
          href="/login"
          style={{ color: CYAN, fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.75'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1'; }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
