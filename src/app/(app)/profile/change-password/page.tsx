"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Schema ─────────────────────────────────────────────────────────────── */

const schema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual"),
    novaSenha: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve conter ao menos 1 letra maiúscula")
      .regex(/[0-9]/, "Deve conter ao menos 1 número"),
    confirmar: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "As senhas não coincidem",
    path: ["confirmar"],
  })
  .refine((d) => d.novaSenha !== d.senhaAtual, {
    message: "A nova senha deve ser diferente da atual",
    path: ["novaSenha"],
  });

type FormData = z.infer<typeof schema>;

/* ─── Página ─────────────────────────────────────────────────────────────── */

export default function ChangePasswordPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { senhaAtual: "", novaSenha: "", confirmar: "" },
  });

  const novaSenha = form.watch("novaSenha");
  const strength = computeStrength(novaSenha);

  const onSubmit = form.handleSubmit(async () => {
    setSubmitting(true);
    // mock: simula chamada de API
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSuccess(true);
    form.reset();
    setTimeout(() => router.push("/profile"), 1500);
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          aria-label="Voltar para o perfil"
        >
          <ArrowLeft className="size-4" />
        </button>
        <KeyRound className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Alterar senha</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-4 py-8">
          {success ? (
            <SuccessState />
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <p className="text-[13px] text-muted-foreground">
                  Sua senha protege o acesso à sua conta. Use uma combinação de letras,
                  números e símbolos que você não use em outros lugares.
                </p>
              </div>

              <PasswordField
                label="Senha atual"
                error={form.formState.errors.senhaAtual?.message}
                {...form.register("senhaAtual")}
              />

              <PasswordField
                label="Nova senha"
                error={form.formState.errors.novaSenha?.message}
                hint="Mínimo 8 caracteres, 1 maiúscula, 1 número"
                {...form.register("novaSenha")}
              />

              {novaSenha.length > 0 && <StrengthBar score={strength} />}

              <PasswordField
                label="Confirmar nova senha"
                error={form.formState.errors.confirmar?.message}
                {...form.register("confirmar")}
              />

              <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/profile")}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="default" size="sm" disabled={submitting}>
                  {submitting ? "Alterando…" : "Alterar senha"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Field component ────────────────────────────────────────────────────── */

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const PasswordField = (() => {
  const Field = function PasswordField({ label, error, hint, ...props }: PasswordFieldProps) {
    const [show, setShow] = useState(false);
    return (
      <div className="space-y-1.5">
        <label className="block text-[12px] font-medium text-foreground">{label}</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            className={cn(
              "block h-9 w-full rounded-md border bg-background/40 px-3 pr-10 text-[13px] text-foreground",
              "placeholder:text-muted-foreground/60",
              "outline-none transition-colors",
              "focus:border-primary/60 focus:bg-background",
              error
                ? "border-destructive/60"
                : "border-border/70 hover:border-border",
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
        {error ? (
          <p className="flex items-center gap-1 text-[11px] text-destructive">
            <AlertCircle className="size-3" />
            {error}
          </p>
        ) : hint ? (
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  };
  // forwarding ref isn't needed for RHF register pattern (works with spread)
  return Field;
})();

/* ─── Strength bar ───────────────────────────────────────────────────────── */

function computeStrength(s: string): number {
  let score = 0;
  if (s.length >= 8)  score++;
  if (s.length >= 12) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[0-9]/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  return Math.min(score, 4);
}

function StrengthBar({ score }: { score: number }) {
  const labels = ["Muito fraca", "Fraca", "Média", "Boa", "Forte"];
  const colors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-emerald-400",
  ];
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? colors[score] : "bg-muted/40",
            )}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Força da senha: <span className="text-foreground">{labels[score]}</span>
      </p>
    </div>
  );
}

/* ─── Success state ──────────────────────────────────────────────────────── */

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-border p-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
        <Check className="size-6" strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-[15px] font-medium text-foreground">Senha alterada</h2>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Redirecionando para o perfil…
        </p>
      </div>
    </div>
  );
}
