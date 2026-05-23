'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useLogin } from '@/hooks/use-auth';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#e4e4e7',
  width: '100%',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};


const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#a1a1aa',
  marginBottom: 6,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 16,
};

const errorStyle: React.CSSProperties = {
  color: '#f87171',
  fontSize: 12,
  marginTop: 4,
};

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Página de login do Scrumbam.
 *
 * Valida email e senha via Zod + React Hook Form.
 * Em caso de sucesso, a mutation redireciona automaticamente para /.
 */
export default function LoginPage() {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useLogin();

  const onSubmit = form.handleSubmit((data) => login.mutate(data));

  return (
    <div
      style={{
        background: '#141414',
        borderRadius: 12,
        padding: 28,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#e4e4e7',
          marginBottom: 20,
          margin: '0 0 20px 0',
        }}
      >
        Entrar
      </h1>

      <form onSubmit={onSubmit} noValidate>
        {/* Campo Email */}
        <div style={fieldStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="auth-input"
            style={inputStyle}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p style={errorStyle}>{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Campo Senha */}
        <div style={fieldStyle}>
          <label htmlFor="password" style={labelStyle}>
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="auth-input"
            style={inputStyle}
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p style={errorStyle}>{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={login.isPending}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #3b5bdb 0%, #4c6ef5 100%)',
            borderRadius: 8,
            padding: '10px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 14,
            cursor: login.isPending ? 'not-allowed' : 'pointer',
            border: 'none',
            opacity: login.isPending ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {login.isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {/* Link para registro */}
      <p
        style={{
          marginTop: 20,
          fontSize: 13,
          color: '#71717a',
          textAlign: 'center',
        }}
      >
        Não tem conta?{' '}
        <Link
          href="/register"
          style={{ color: '#7c6ff7', textDecoration: 'none' }}
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
