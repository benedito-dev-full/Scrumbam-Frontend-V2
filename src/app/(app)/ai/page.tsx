"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  useCreateMcpKey,
  useMcpKeys,
  useRevokeMcpKey,
} from "@/hooks/use-mcp";
import { toast } from "sonner";
import type { McpKeyCreatedDto, McpKeyListItemDto } from "@/lib/types/api";

/* ─── Catálogo das ferramentas expostas pelo servidor MCP ────────────────────
 * Espelha as tools reais do backend (src/mcp/tools). Informativo — mostra ao
 * usuário o que a IA conectada consegue fazer. Não é um botão clicável. */
const TOOL_GROUPS: {
  label: string;
  color: string;
  tools: { name: string; desc: string }[];
}[] = [
  {
    label: "Tarefas",
    color: "#60a5fa",
    tools: [
      { name: "list_tasks", desc: "Lista tarefas com filtros" },
      { name: "search_tasks", desc: "Busca em todo o workspace" },
      { name: "get_task", desc: "Detalhes de uma tarefa" },
      { name: "create_task", desc: "Cria uma nova tarefa" },
      { name: "update_task", desc: "Atualiza atributos" },
      { name: "update_status", desc: "Move de status (workflow)" },
    ],
  },
  {
    label: "Projetos & Membros",
    color: "#a78bfa",
    tools: [
      { name: "list_projects", desc: "Spaces, pastas e listas" },
      { name: "get_project", desc: "Detalhes de um projeto" },
      { name: "update_project", desc: "Atualiza um projeto" },
      { name: "list_members", desc: "Membros do projeto" },
    ],
  },
  {
    label: "Fases & Blocks",
    color: "#22c55e",
    tools: [
      { name: "list_phases", desc: "Fases (blocks)" },
      { name: "get_phase_tree", desc: "Árvore completa de fases" },
    ],
  },
  {
    label: "Notificações",
    color: "#f59e0b",
    tools: [
      { name: "list_notifications", desc: "Lista notificações" },
      { name: "update_notification", desc: "Marca como lida" },
      { name: "get_unread_count", desc: "Conta não lidas" },
    ],
  },
];

const TOOL_COUNT = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0);

/** Endpoint público do servidor MCP, derivado da baseURL do axios. */
const API_BASE = (api.defaults.baseURL ?? "").replace(/\/$/, "");
const MCP_ENDPOINT = `${API_BASE || "https://seu-backend"}/mcp`;

export default function AiHubPage() {
  const keysQuery = useMcpKeys();
  const createKey = useCreateMcpKey();
  const revokeKey = useRevokeMcpKey();

  const [revealed, setRevealed] = useState<McpKeyCreatedDto | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<McpKeyListItemDto | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const keys = keysQuery.data ?? [];
  const serverAvailable = !keysQuery.isError;

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copiado");
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  function handleGenerate() {
    createKey.mutate(undefined, { onSuccess: (k) => setRevealed(k) });
  }

  function handleConfirmRevoke() {
    if (!revokeTarget) return;
    revokeKey.mutate(revokeTarget.id, {
      onSettled: () => setRevokeTarget(null),
    });
  }

  const configSnippet = buildConfigSnippet(
    MCP_ENDPOINT,
    revealed?.plaintext ?? "SUA_CHAVE_MCP",
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Header ── */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">IA</h1>
          <span className="text-[11px] text-muted-foreground">
            · Central de conexões
          </span>
        </div>
        <Link
          href="/ia"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Sparkles className="size-3.5" />
          Abrir Nexus
        </Link>
      </header>

      {/* ── Conteúdo ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-6">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-[0.16] blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <StatusPill
                  loading={keysQuery.isLoading}
                  available={serverAvailable}
                />
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  Conecte qualquer IA ao seu workspace
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                  Gere uma chave <strong className="font-medium text-foreground">MCP</strong>{" "}
                  e plugue Claude, Cursor ou qualquer cliente compatível. A IA
                  passa a enxergar suas tarefas, projetos e fases — com{" "}
                  <strong className="font-medium text-foreground">
                    {TOOL_COUNT} ferramentas
                  </strong>{" "}
                  prontas, sem expor sua senha.
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={createKey.isPending || !serverAvailable}
                className="shrink-0 gap-1.5"
              >
                {createKey.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Gerar chave
              </Button>
            </div>
          </section>

          {/* REVELAÇÃO ÚNICA */}
          {revealed && (
            <RevealPanel
              value={revealed.plaintext}
              copied={copiedId === "reveal"}
              onCopy={() => copy(revealed.plaintext, "reveal")}
              onDismiss={() => setRevealed(null)}
            />
          )}

          {/* CONEXÃO */}
          <Section
            icon={<Link2 className="size-4" />}
            title="Conexão"
            description="Aponte seu cliente MCP para este endpoint e autentique com a chave no header."
          >
            <div className="space-y-3">
              <CopyRow
                label="Endpoint"
                value={MCP_ENDPOINT}
                mono
                copied={copiedId === "endpoint"}
                onCopy={() => copy(MCP_ENDPOINT, "endpoint")}
              />
              <CopyRow
                label="Header"
                value="X-MCP-Key: <sua-chave>"
                mono
                copied={copiedId === "header"}
                onCopy={() => copy("X-MCP-Key", "header")}
              />

              <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Terminal className="size-3.5" />
                    Configuração do cliente
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(configSnippet, "config")}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {copiedId === "config" ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    Copiar
                  </button>
                </div>
                <pre className="overflow-x-auto px-3 py-3 text-[12px] leading-relaxed text-foreground">
                  <code>{configSnippet}</code>
                </pre>
              </div>
            </div>
          </Section>

          {/* CHAVES */}
          <Section
            icon={<KeyRound className="size-4" />}
            title="Chaves MCP"
            description="Cada chave autentica um cliente. Revogue a qualquer momento."
          >
            {keysQuery.isLoading ? (
              <StateBox>Carregando chaves…</StateBox>
            ) : keysQuery.isError ? (
              <StateBox variant="error">
                Servidor MCP indisponível neste ambiente. Verifique se o backend
                está com MCP habilitado.
              </StateBox>
            ) : keys.length === 0 ? (
              <EmptyKeys />
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                {keys.map((k, i) => (
                  <KeyRow
                    key={k.id}
                    item={k}
                    isLast={i === keys.length - 1}
                    onRevoke={() => setRevokeTarget(k)}
                    revoking={
                      revokeKey.isPending && revokeKey.variables === k.id
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* FERRAMENTAS */}
          <Section
            icon={<Wrench className="size-4" />}
            title="Ferramentas disponíveis"
            description={`${TOOL_COUNT} ações que a IA conectada pode executar no seu workspace.`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {TOOL_GROUPS.map((group) => (
                <div
                  key={group.label}
                  className="rounded-lg border border-border bg-card p-3.5"
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: group.color }}
                    />
                    <h3 className="text-[12px] font-semibold text-foreground">
                      {group.label}
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      {group.tools.length}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {group.tools.map((t) => (
                      <li key={t.name} className="flex items-baseline gap-2">
                        <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                          {t.name}
                        </code>
                        <span className="text-[11px] text-muted-foreground">
                          {t.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Confirmação de revogação */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(v) => {
          if (revokeKey.isPending) return;
          if (!v) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar chave MCP</AlertDialogTitle>
            <AlertDialogDescription>
              A chave{" "}
              <strong>{revokeTarget ? maskKey(revokeTarget.prefix) : ""}</strong>{" "}
              deixará de autenticar imediatamente. Clientes que a usam perderão o
              acesso. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setRevokeTarget(null)}
              disabled={revokeKey.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              disabled={revokeKey.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeKey.isPending ? "Revogando…" : "Revogar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Subcomponentes ─────────────────────────────────────────────────────────── */

function StatusPill({
  loading,
  available,
}: {
  loading: boolean;
  available: boolean;
}) {
  const { dot, label } = loading
    ? { dot: "bg-muted-foreground", label: "Verificando servidor…" }
    : available
      ? { dot: "bg-emerald-500", label: "Servidor MCP ativo" }
      : { dot: "bg-amber-500", label: "Servidor MCP indisponível" };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function RevealPanel({
  value,
  copied,
  onCopy,
  onDismiss,
}: {
  value: string;
  copied: boolean;
  onCopy: () => void;
  onDismiss: () => void;
}) {
  return (
    <section className="rounded-2xl border border-primary/40 bg-primary/[0.06] p-5">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <ShieldCheck className="size-4" />
        <h2 className="text-[14px] font-semibold">Sua nova chave MCP</h2>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
          {value}
        </code>
        <Button size="xs" variant="secondary" className="gap-1.5" onClick={onCopy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <p className="flex items-center gap-1.5 text-[12px] text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-3.5 shrink-0" />
          Guarde agora — esta chave não será exibida novamente.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Já guardei
        </button>
      </div>
    </section>
  );
}

function CopyRow({
  label,
  value,
  mono,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="w-16 shrink-0 text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <code
        className={cn(
          "min-w-0 flex-1 truncate text-[12px] text-foreground",
          mono && "font-mono",
        )}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copiar ${label.toLowerCase()}`}
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

function KeyRow({
  item,
  isLast,
  onRevoke,
  revoking,
}: {
  item: McpKeyListItemDto;
  isLast: boolean;
  onRevoke: () => void;
  revoking: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 bg-card px-4 py-3",
        !isLast && "border-b border-border",
        item.disabled && "opacity-50",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <KeyRound className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="font-mono text-[13px] text-foreground">
            {maskKey(item.prefix)}
          </code>
          {item.disabled && (
            <span className="rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
              revogada
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>Criada em {formatDate(item.createdAt)}</span>
          <span>·</span>
          <span>
            {item.lastUsedAt
              ? `Último uso ${formatDate(item.lastUsedAt)}`
              : "Nunca usada"}
          </span>
          {item.scopes.length > 0 && (
            <>
              <span>·</span>
              <span className="font-mono">{item.scopes.join(", ")}</span>
            </>
          )}
        </div>
      </div>
      {!item.disabled && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Revogar chave"
          onClick={onRevoke}
          disabled={revoking}
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

function EmptyKeys() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <KeyRound className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Nenhuma chave ainda
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Gere uma chave acima para conectar sua primeira IA.
        </p>
      </div>
    </div>
  );
}

function StateBox({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "error";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border border-dashed p-10 text-center text-xs",
        variant === "error"
          ? "border-destructive/40 text-destructive"
          : "border-border text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function maskKey(prefix: string): string {
  return `${prefix}_••••••••`;
}

function buildConfigSnippet(endpoint: string, key: string): string {
  return `{
  "mcpServers": {
    "scrumban": {
      "url": "${endpoint}",
      "headers": {
        "X-MCP-Key": "${key}"
      }
    }
  }
}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
