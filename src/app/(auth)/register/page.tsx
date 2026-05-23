'use client';

import Link from 'next/link';
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

/**
 * Página de registro do Scrumban.
 *
 * Cria conta com nome, email, senha e organização opcional via Zod + RHF.
 * Em caso de sucesso, a mutation redireciona automaticamente para /.
 */
export default function RegisterPage() {
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', organizationName: '' },
  });

  const register = useRegister();
  const onSubmit = form.handleSubmit((data) => register.mutate(data));

  const inputClass =
    'auth-input w-full px-3.5 py-2.5 rounded-xl text-sm text-[#e4e4e7] placeholder-[#3f3f46] transition-all';
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    outline: 'none',
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#e4e4e7] mb-2">
          Crie sua conta
        </h1>
        <p className="text-sm text-[#71717a]">
          Comece grátis, sem cartão de crédito
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-[#a1a1aa]">
            Seu nome
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="João Silva"
            className={inputClass}
            style={inputStyle}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-400 mt-0.5">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

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
            className={inputClass}
            style={inputStyle}
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
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
            style={inputStyle}
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-400 mt-0.5">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Organização */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="organizationName" className="text-sm font-medium text-[#a1a1aa]">
            Organização{' '}
            <span className="text-[#3f3f46] font-normal">(opcional)</span>
          </label>
          <input
            id="organizationName"
            type="text"
            autoComplete="organization"
            placeholder="Ex: Minha Empresa"
            className={inputClass}
            style={inputStyle}
            {...form.register('organizationName')}
          />
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={register.isPending}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-2 transition-all active:scale-[0.98]"
          style={{
            background: register.isPending
              ? 'rgba(124,111,247,0.5)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            cursor: register.isPending ? 'not-allowed' : 'pointer',
            boxShadow: register.isPending ? 'none' : '0 0 20px rgba(124,111,247,0.25)',
          }}
        >
          {register.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Criando conta...
            </span>
          ) : (
            'Criar conta grátis'
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-xs text-[#3f3f46]">ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Link para login */}
      <p className="text-center text-sm text-[#52525b]">
        Já tem conta?{' '}
        <Link
          href="/login"
          className="text-[#0ea5e9] font-medium hover:text-[#67e8f9] transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
