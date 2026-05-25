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

const INPUT_BASE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e8e8f0',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color .15s, background .15s',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6366f1',
  letterSpacing: '0.08em', textTransform: 'uppercase',
};

export default function RegisterPage() {
  const [focused, setFocused] = useState<string | null>(null);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', organizationName: '' },
  });

  const register = useRegister();
  const onSubmit = form.handleSubmit((data) => register.mutate(data));

  const inputStyle = (field: string): React.CSSProperties => ({
    ...INPUT_BASE,
    borderColor: focused === field ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
    background: focused === field ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.04)',
  });

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f8', marginBottom: 6, letterSpacing: '-0.3px' }}>
          Crie sua conta
        </h1>
        <div style={{ width: 32, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', marginBottom: 10 }} />
        <p style={{ fontSize: 13, color: '#6b6b80' }}>
          Comece grátis, sem cartão de crédito
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Nome */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="name" style={LABEL_STYLE}>Seu nome</label>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="email" style={LABEL_STYLE}>Email</label>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="password" style={LABEL_STYLE}>Senha</label>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="organizationName" style={LABEL_STYLE}>
            Organização{' '}
            <span style={{ color: '#3a3a4a', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
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
            width: '100%', padding: '11px 0', borderRadius: 10, border: 0,
            background: register.isPending
              ? 'rgba(99,102,241,0.4)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: register.isPending ? 'not-allowed' : 'pointer',
            marginTop: 4,
            boxShadow: register.isPending ? 'none' : '0 0 24px rgba(99,102,241,0.3)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontSize: 11, color: '#3a3a4a' }}>ou</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Link login */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#4b4b60' }}>
        Já tem conta?{' '}
        <Link
          href="/login"
          style={{ color: '#818cf8', fontWeight: 500, textDecoration: 'none' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = '#a5b4fc'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = '#818cf8'; }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
