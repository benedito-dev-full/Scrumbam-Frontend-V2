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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  useAllowedMcpScopes,
  useCreateMcpKey,
  useMcpKeys,
  useRevokeMcpKey,
} from "@/hooks/use-mcp";
import { toast } from "sonner";
import { ScopePicker } from "@/components/mcp/scope-picker";
import { MCP_PRESETS, type McpScope } from "@/lib/mcp-scopes";
import type { McpKeyCreatedDto, McpKeyListItemDto } from "@/lib/types/api";

/** Seleção inicial do modal: preset "Somente Leitura" (sempre permitido). */
const DEFAULT_PICKER_SCOPES: McpScope[] =
  MCP_PRESETS.find((p) => p.id === "read_only")?.scopes ?? [];

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
      { name: "delete_task", desc: "Deleta uma tarefa (soft-delete)" },
      { name: "get_task_tree", desc: "Árvore fase → task → subtask" },
      { name: "list_my_tasks", desc: "Minhas tarefas (assignee = caller)" },
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
      { name: "list_blocks", desc: "Fases (blocks)" },
      { name: "list_block_tasks", desc: "Tarefas de um block" },
    ],
  },
  {
    label: "Métricas",
    color: "#ec4899",
    tools: [
      {
        name: "get_project_metrics",
        desc: "Flow metrics + forecast Monte Carlo",
      },
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

/** Nome do servidor MCP registrado nos clientes de IA. */
const SERVER_NAME = "scrumban";

/** Placeholder usado quando ainda não há uma chave recém-gerada em mãos. */
const KEY_PLACEHOLDER = "SUA_CHAVE_MCP";

type AiProviderId = "claude" | "openai" | "gemini";

/* ─── Provedores de IA suportados ────────────────────────────────────────────
 * Cada provedor sabe montar o comando/config exato para registrar este servidor
 * MCP, já com a chave embutida — o usuário só copia e cola. A sintaxe foi
 * verificada nas CLIs reais (jun/2026):
 *   • Claude Code e Gemini CLI aceitam header via flag `--header`. O `--header`
 *     é variádico, então nome e URL vêm ANTES das flags — senão a flag "engole"
 *     os positionais e a CLI reclama de `missing required argument 'name'`.
 *   • Codex (OpenAI) NÃO aceita header customizado por flag — só via
 *     ~/.codex/config.toml (github.com/openai/codex/issues/5180). */
interface AiProvider {
  id: AiProviderId;
  /** Rótulo exibido no seletor. */
  label: string;
  /** Legenda da caixa de código (terminal vs. arquivo de config). */
  boxLabel: string;
  /** Dica curta de onde aplicar. */
  hint: string;
  /** Monta o comando/config final dado o endpoint e a chave. */
  build: (endpoint: string, key: string) => string;
}

const AI_PROVIDERS: AiProvider[] = [
  {
    id: "claude",
    label: "Claude Code",
    boxLabel: "Comando do terminal",
    hint: "Cole no terminal — registra o servidor MCP no Claude Code.",
    build: (endpoint, key) =>
      `claude mcp add ${SERVER_NAME} ${endpoint} --transport http --header "X-MCP-Key: ${key}"`,
  },
  {
    id: "openai",
    label: "Codex (OpenAI)",
    boxLabel: "~/.codex/config.toml",
    hint: "O Codex não aceita header por flag — cole este bloco em ~/.codex/config.toml.",
    build: (endpoint, key) =>
      `[mcp_servers.${SERVER_NAME}]\nurl = "${endpoint}"\nhttp_headers = { "X-MCP-Key" = "${key}" }`,
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    boxLabel: "Comando do terminal",
    hint: "Cole no terminal — registra o servidor MCP no Gemini CLI.",
    build: (endpoint, key) =>
      `gemini mcp add ${SERVER_NAME} ${endpoint} --transport http --header "X-MCP-Key: ${key}"`,
  },
];

export default function AiHubPage() {
  const keysQuery = useMcpKeys();
  const createKey = useCreateMcpKey();
  const revokeKey = useRevokeMcpKey();

  const [revealed, setRevealed] = useState<McpKeyCreatedDto | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<McpKeyListItemDto | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [pickerScopes, setPickerScopes] = useState<McpScope[]>(
    DEFAULT_PICKER_SCOPES,
  );

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

  function openGenerator() {
    setPickerScopes(DEFAULT_PICKER_SCOPES);
    setGenOpen(true);
  }

  function handleGenerate() {
    if (pickerScopes.length === 0) return;
    createKey.mutate(
      { scopes: pickerScopes },
      {
        onSuccess: (k) => {
          setGenOpen(false);
          setRevealed(k);
        },
      },
    );
  }

  function handleConfirmRevoke() {
    if (!revokeTarget) return;
    revokeKey.mutate(revokeTarget.id, {
      onSettled: () => setRevokeTarget(null),
    });
  }

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
                  Gere uma chave{" "}
                  <strong className="font-medium text-foreground">MCP</strong> e
                  plugue Claude, Cursor ou qualquer cliente compatível. A IA
                  passa a enxergar suas tarefas, projetos e fases — com{" "}
                  <strong className="font-medium text-foreground">
                    {TOOL_COUNT} ferramentas
                  </strong>{" "}
                  prontas, sem expor sua senha.
                </p>
              </div>
              <Button
                onClick={openGenerator}
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

          {/* CONEXÃO */}
          <Section
            icon={<Link2 className="size-4" />}
            title="Conexão"
            description="Escolha sua IA e copie o comando pronto. Use a chave que você guardou ao gerar."
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

              <ProviderPicker
                endpoint={MCP_ENDPOINT}
                apiKey={KEY_PLACEHOLDER}
                copy={copy}
                copiedId={copiedId}
                idPrefix="conexao"
              />
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

      {/* Seleção de escopos + geração da chave */}
      <GenerateKeyDialog
        open={genOpen}
        onOpenChange={(v) => {
          if (createKey.isPending) return;
          setGenOpen(v);
        }}
        scopes={pickerScopes}
        onScopesChange={setPickerScopes}
        onConfirm={handleGenerate}
        pending={createKey.isPending}
      />

      {/* Revelação da nova chave + comando por IA */}
      <KeyRevealDialog
        revealed={revealed}
        endpoint={MCP_ENDPOINT}
        copy={copy}
        copiedId={copiedId}
        onClose={() => setRevealed(null)}
      />

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
              <strong>
                {revokeTarget ? maskKey(revokeTarget.prefix) : ""}
              </strong>{" "}
              deixará de autenticar imediatamente. Clientes que a usam perderão
              o acesso. Essa ação não pode ser desfeita.
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

/**
 * Modal exibido logo após gerar uma chave MCP.
 *
 * Mostra o token em claro (UMA ÚNICA VEZ) e um seletor das 3 IAs principais
 * (Claude, OpenAI, Gemini); ao escolher, exibe o comando/config exato já com a
 * chave embutida, pronto para copiar e colar no terminal. Renderiza nada quando
 * `revealed` é `null`.
 */
/**
 * Modal de seleção de escopos + geração da chave MCP (ADR-V2-068, Fase 4).
 *
 * Carrega os scopes que o usuário pode conceder ao abrir (`allowed-scopes`) e
 * delega a seleção ao `ScopePicker`. Confirmar dispara a geração (o parent
 * fecha este modal e abre o de revelação no sucesso).
 */
function GenerateKeyDialog({
  open,
  onOpenChange,
  scopes,
  onScopesChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopes: McpScope[];
  onScopesChange: (scopes: McpScope[]) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  // Só busca os scopes permitidos enquanto o modal está aberto.
  const allowedQuery = useAllowedMcpScopes(open);
  const allowedScopes = allowedQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Gerar chave MCP
          </DialogTitle>
          <DialogDescription>
            Escolha o que esta chave poderá fazer. Você só pode conceder
            permissões compatíveis com o seu nível de acesso.
          </DialogDescription>
        </DialogHeader>

        {allowedQuery.isError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
            Não foi possível carregar suas permissões. Tente novamente.
          </div>
        ) : (
          <ScopePicker
            value={scopes}
            onChange={onScopesChange}
            allowedScopes={allowedScopes}
            loadingAllowed={allowedQuery.isLoading}
          />
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending || scopes.length === 0 || allowedQuery.isLoading}
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Gerar chave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeyRevealDialog({
  revealed,
  endpoint,
  copy,
  copiedId,
  onClose,
}: {
  revealed: McpKeyCreatedDto | null;
  endpoint: string;
  copy: (text: string, id: string) => void;
  copiedId: string | null;
  onClose: () => void;
}) {
  const value = revealed?.plaintext ?? "";

  return (
    <Dialog
      open={!!revealed}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Sua nova chave MCP
          </DialogTitle>
          <DialogDescription>
            Copie a chave e conecte sua IA com o comando pronto abaixo. Por
            segurança, ela não será exibida novamente.
          </DialogDescription>
        </DialogHeader>

        {/* Chave em claro */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
              {value}
            </code>
            <Button
              size="xs"
              variant="secondary"
              className="gap-1.5"
              onClick={() => copy(value, "reveal-key")}
            >
              {copiedId === "reveal-key" ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedId === "reveal-key" ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-3.5 shrink-0" />
            Guarde agora — esta chave não será exibida novamente.
          </p>
        </div>

        {/* Comando por IA */}
        <div className="min-w-0">
          <h3 className="mb-2.5 text-[13px] font-medium text-foreground">
            Conecte sua IA
          </h3>
          <ProviderPicker
            endpoint={endpoint}
            apiKey={value || KEY_PLACEHOLDER}
            copy={copy}
            copiedId={copiedId}
            idPrefix="reveal"
          />
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Já guardei</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Seletor de IA + caixa de comando.
 *
 * Renderiza um controle segmentado (Claude / OpenAI / Gemini) e, abaixo, o
 * comando ou bloco de configuração correspondente — montado por
 * {@link AI_PROVIDERS} com `endpoint` e `apiKey` embutidos. Reutilizado no modal
 * de revelação (com a chave real) e na seção de Conexão (com placeholder).
 *
 * @param idPrefix - Prefixo único do id de cópia, para isolar o feedback de
 *   "copiado" entre instâncias distintas (ex.: `"reveal"` vs. `"conexao"`).
 */
function ProviderPicker({
  endpoint,
  apiKey,
  copy,
  copiedId,
  idPrefix,
}: {
  endpoint: string;
  apiKey: string;
  copy: (text: string, id: string) => void;
  copiedId: string | null;
  idPrefix: string;
}) {
  const [providerId, setProviderId] = useState<AiProviderId>("claude");
  const provider =
    AI_PROVIDERS.find((p) => p.id === providerId) ?? AI_PROVIDERS[0];
  const command = provider.build(endpoint, apiKey);
  const copyId = `${idPrefix}-cmd`;

  return (
    <div className="min-w-0 space-y-2.5">
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
        {AI_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProviderId(p.id)}
            aria-pressed={p.id === providerId}
            className={cn(
              "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
              p.id === providerId
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Terminal className="size-3.5" />
            {provider.boxLabel}
          </span>
          <button
            type="button"
            onClick={() => copy(command, copyId)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copiedId === copyId ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            Copiar
          </button>
        </div>
        <pre className="px-3 py-3 text-[12px] leading-relaxed whitespace-pre-wrap break-all text-foreground">
          <code>{command}</code>
        </pre>
      </div>

      <p className="text-[11px] text-muted-foreground">{provider.hint}</p>
    </div>
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
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
