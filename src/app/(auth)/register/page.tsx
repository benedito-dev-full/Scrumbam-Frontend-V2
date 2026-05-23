'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useRegister } from '@/hooks/use-auth';

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  organizationName: z.string().transform((v) => v?.trim() || undefined).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

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
 * Página de registro do Scrumbam.
 *
 * Cria conta com nome, email, senha e organização opcional via Zod + RHF.
 * Em caso de sucesso, a mutation redireciona automaticamente para /.
 */
export default function RegisterPage() {
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      organizationName: '',
    },
  });

  const register = useRegister();

  const onSubmit = form.handleSubmit((data) => register.mutate(data));

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
          margin: '0 0 20px 0',
        }}
      >
        Criar conta
      </h1>

      <form onSubmit={onSubmit} noValidate>
        {/* Campo Nome */}
        <div style={fieldStyle}>
          <label htmlFor="name" style={labelStyle}>
            Nome
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="auth-input"
            style={inputStyle}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p style={errorStyle}>{form.formState.errors.name.message}</p>
          )}
        </div>

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
            autoComplete="new-password"
            className="auth-input"
            style={inputStyle}
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p style={errorStyle}>{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Campo Organização (opcional) */}
        <div style={fieldStyle}>
          <label htmlFor="organizationName" style={labelStyle}>
            Nome da organização{' '}
            <span style={{ color: '#52525b', fontStyle: 'italic' }}>
              (opcional)
            </span>
          </label>
          <input
            id="organizationName"
            type="text"
            autoComplete="organization"
            placeholder="Ex: Minha Empresa"
            className="auth-input"
            style={{ ...inputStyle, color: '#a1a1aa' }}
            {...form.register('organizationName')}
          />
          {form.formState.errors.organizationName && (
            <p style={errorStyle}>
              {form.formState.errors.organizationName.message}
            </p>
          )}
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={register.isPending}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #3b5bdb 0%, #4c6ef5 100%)',
            borderRadius: 8,
            padding: '10px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 14,
            cursor: register.isPending ? 'not-allowed' : 'pointer',
            border: 'none',
            opacity: register.isPending ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {register.isPending ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      {/* Link para login */}
      <p
        style={{
          marginTop: 20,
          fontSize: 13,
          color: '#71717a',
          textAlign: 'center',
        }}
      >
        Já tem conta?{' '}
        <Link
          href="/login"
          style={{ color: '#7c6ff7', textDecoration: 'none' }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
