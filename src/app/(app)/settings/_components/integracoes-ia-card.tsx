"use client";

import { useState } from "react";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useAiKeys, useUpsertAiKey } from "@/hooks/use-ai-keys";
import { useAuthStore } from "@/lib/stores/auth";
import type { AiKeyMasked, AiProviderName } from "@/lib/types/nexus";
import { cn } from "@/lib/utils";

/* ─── Metadados visuais dos provedores ───────────────────────────────────────
   Logos oficiais (OpenAI, Anthropic) + marca Gemini, mesmos SVGs usados no
   seletor do chat. Placeholder do input reflete o prefixo típico de cada um. */
interface ProviderMeta {
  id: AiProviderName;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "gemini",
    label: "Gemini",
    placeholder: "AIza…",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
          fill="url(#ia-card-gem)"
        />
        <defs>
          <linearGradient id="ia-card-gem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: "claude",
    label: "Claude",
    placeholder: "sk-ant-…",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="#d97706">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48h4.496z" />
      </svg>
    ),
  },
  {
    id: "openai",
    label: "OpenAI",
    placeholder: "sk-…",
    icon: (
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-foreground"
      >
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.006 14.5A4.501 4.501 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387 2.019-1.168a.076.076 0 0 1 .071 0l4.816 2.801a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.397-.673zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.814-2.798a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
  },
];

/** Formata ISO → "05 jun 2026" (pt-BR curto). */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Card "Integrações de IA" das Configurações.
 *
 * ADMIN-only: cadastra/rotaciona a chave de API de cada provedor da
 * organização. As chaves são cifradas no backend e nunca exibidas cruas —
 * só a versão mascarada. Renderiza `null` para não-admin (o componente pai
 * já evita montá-lo, mas reforçamos aqui).
 *
 * Escopo F4: listar + cadastrar + rotacionar. "Remover" e "provider padrão
 * da org" entram na F5.
 */
export function IntegracoesIACard() {
  const orgRole = useAuthStore((s) => s.user?.orgRole);
  const isAdmin = orgRole === "ADMIN";

  const { data: keys = [], isLoading } = useAiKeys(isAdmin);

  // Não-admin: a seção inteira some das configurações dele.
  if (!isAdmin) return null;

  const keyByProvider = new Map<AiProviderName, AiKeyMasked>(
    keys.map((k) => [k.provider, k]),
  );

  return (
    <section className="rounded-[10px] border border-border bg-card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-[15px] font-medium text-foreground">
        <Sparkles className="size-4 text-muted-foreground" />
        Integrações de IA
      </h2>
      <p className="mb-4 border-b border-border/60 pb-3 text-[12px] text-muted-foreground">
        Cadastre as chaves de API da sua organização para habilitar Claude e
        OpenAI no Nexus. As chaves são cifradas e nunca exibidas após o cadastro.
      </p>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => (
          <ProviderRow
            key={provider.id}
            meta={provider}
            current={keyByProvider.get(provider.id)}
            loading={isLoading}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── Linha de um provedor ───────────────────────────────────────────────── */

function ProviderRow({
  meta,
  current,
  loading,
}: {
  meta: ProviderMeta;
  current: AiKeyMasked | undefined;
  loading: boolean;
}) {
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const upsert = useUpsertAiKey();
  const configured = !!current?.configured;

  const handleSave = async () => {
    const key = value.trim();
    if (key.length < 10) return;
    await upsert.mutateAsync({ provider: meta.id, key });
    setValue(""); // chave crua nunca permanece na UI
    setReveal(false);
  };

  return (
    <div className="rounded-md border border-border/70 bg-background/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-md bg-muted">
            {meta.icon}
          </span>
          <div>
            <p className="text-[13px] font-medium text-foreground">
              {meta.label}
            </p>
            {configured && current ? (
              <p className="text-[11px] text-muted-foreground">
                {current.masked} · rotacionada {formatDate(current.lastRotatedAt)}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Nenhuma chave cadastrada
              </p>
            )}
          </div>
        </div>

        <span
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium",
            configured ? "text-emerald-500" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              configured ? "bg-emerald-500" : "bg-muted-foreground/50",
            )}
          />
          {configured ? "Configurado" : "Não configurado"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={reveal ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              configured
                ? `Cole uma nova chave para rotacionar (${meta.placeholder})`
                : meta.placeholder
            }
            autoComplete="off"
            disabled={loading || upsert.isPending}
            className={cn(
              "h-8 w-full rounded border border-border/70 bg-background/40 pl-2.5 pr-9 text-[12px] text-foreground",
              "placeholder:text-muted-foreground/70 outline-none focus:border-border",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            disabled={!value}
            aria-label={reveal ? "Ocultar chave" : "Mostrar chave"}
            title={reveal ? "Ocultar chave" : "Mostrar chave"}
            className={cn(
              "absolute right-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded",
              "text-muted-foreground transition-colors hover:text-foreground",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground",
            )}
          >
            {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={value.trim().length < 10 || upsert.isPending}
          className={cn(
            "h-8 shrink-0 rounded px-3 text-[12px] font-semibold transition-colors",
            value.trim().length < 10 || upsert.isPending
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:brightness-110",
          )}
        >
          {upsert.isPending
            ? "Salvando…"
            : configured
              ? "Rotacionar"
              : "Salvar"}
        </button>
      </div>
    </div>
  );
}
