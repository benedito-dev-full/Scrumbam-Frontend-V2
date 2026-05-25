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
    'w-full px-3.5 py-2.5 rounded-lg text-sm text-white bg-white/[0.04] border border-white/[0.07] placeholder-zinc-700 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]';

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-1">
          Crie sua conta
        </h1>
        <div className="w-8 h-px bg-white/20 mt-2 mb-3" />
        <p className="text-sm text-zinc-500">
          Comece grátis, sem cartão de crédito
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            Seu nome
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="João Silva"
            className={inputClass}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
          )}
        </div>

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
            className={inputClass}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Organização */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="organizationName" className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            Organização{' '}
            <span className="text-zinc-700 normal-case font-normal">(opcional)</span>
          </label>
          <input
            id="organizationName"
            type="text"
            autoComplete="organization"
            placeholder="Ex: Minha Empresa"
            className={inputClass}
            {...form.register('organizationName')}
          />
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={register.isPending}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-black bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99] mt-1"
        >
          {register.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Criando conta...
            </span>
          ) : (
            'Criar conta grátis'
          )}
        </button>
      </form>

      {/* Link para login */}
      <p className="text-center text-sm text-zinc-600 mt-8">
        Já tem conta?{' '}
        <Link
          href="/login"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
