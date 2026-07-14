"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
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
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-6">
        <h1 className="text-[12px] font-semibold tracking-[0.06em] text-foreground uppercase">
          IA{" "}
          <span className="text-muted-foreground">· Central de conexões</span>
        </h1>
        <Link
          href="/ia"
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Sparkles className="size-3.5" />
          Abrir Nexus
        </Link>
      </header>

      {/* ── Conteúdo ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-9">
          {/* HERO — a tese: um título grande, um número âncora, uma ação. */}
          <section className="grid gap-10 border-b border-border py-10 sm:grid-cols-[1.35fr_1fr] sm:items-end sm:py-14">
            <div className="min-w-0">
              <StatusPill
                loading={keysQuery.isLoading}
                available={serverAvailable}
              />
              <h2 className="mt-5 text-4xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-foreground sm:text-[52px]">
                Conecte qualquer IA
                <br />
                ao seu{" "}
                <span className="text-muted-foreground/70">workspace.</span>
              </h2>
              <p className="mt-5 max-w-[46ch] text-[14.5px] leading-relaxed text-muted-foreground">
                Gere uma chave MCP e plugue Claude, Codex ou Gemini. A IA passa
                a enxergar suas tarefas, projetos e fases — sem nunca ver sua
                senha.
              </p>
            </div>

            <div className="sm:text-right">
              <span className="block text-6xl leading-[0.9] font-semibold tracking-[-0.05em] tabular-nums text-foreground sm:text-[88px]">
                {TOOL_COUNT}
              </span>
              <span className="mt-2.5 block text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 uppercase">
                Ferramentas prontas
              </span>
              <Button
                onClick={openGenerator}
                disabled={createKey.isPending || !serverAvailable}
                className="mt-6 gap-1.5 rounded-full px-5"
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
            title="Conexão"
            description="Escolha sua IA e copie o comando pronto. Use a chave que você guardou ao gerar."
          >
            <CopyRow
              label="Endpoint"
              value={MCP_ENDPOINT}
              copied={copiedId === "endpoint"}
              onCopy={() => copy(MCP_ENDPOINT, "endpoint")}
            />
            <CopyRow
              label="Header"
              value="X-MCP-Key: <sua-chave>"
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
          </Section>

          {/* CHAVES */}
          <Section
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
              <div>
                {keys.map((k) => (
                  <KeyRow
                    key={k.id}
                    item={k}
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
            title="Ferramentas"
            description={`${TOOL_COUNT} ações que a IA conectada pode executar no seu workspace.`}
            last
          >
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {TOOL_GROUPS.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-3 flex items-baseline gap-2.5 text-[13px] font-semibold tracking-[-0.01em] text-foreground">
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: group.color }}
                    />
                    {group.label}
                    <span className="ml-auto text-[11px] font-medium tabular-nums text-muted-foreground/70">
                      {group.tools.length}
                    </span>
                  </h3>
                  <ul className="space-y-1">
                    {group.tools.map((t) => (
                      <li
                        key={t.name}
                        className="flex items-baseline gap-2 font-mono text-[12px] leading-relaxed"
                      >
                        <code className="shrink-0 text-foreground">
                          {t.name}
                        </code>
                        <span className="truncate text-muted-foreground/70">
                          — {t.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <div className="h-12" />
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
    <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
      <span
        className={cn(
          "size-1.5 rounded-full",
          dot,
          !loading && available && "shadow-[0_0_9px_var(--color-emerald-500)]",
        )}
      />
      {label}
    </span>
  );
}

/**
 * Seção da página: rótulo à esquerda, conteúdo à direita, separados por
 * hairline. Sem card — a hierarquia vem da tipografia e do espaço, não de
 * caixas empilhadas.
 */
function Section({
  title,
  description,
  children,
  last,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={cn(
        "grid gap-6 py-9 sm:grid-cols-[190px_1fr] sm:gap-11",
        !last && "border-b border-border",
      )}
    >
      <header>
        <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground/70">
            {description}
          </p>
        )}
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

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
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending || scopes.length === 0 || allowedQuery.isLoading}
            className="gap-1.5 rounded-full"
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

/**
 * Modal exibido logo após gerar uma chave MCP.
 *
 * Mostra o token em claro (UMA ÚNICA VEZ) e um seletor das 3 IAs principais
 * (Claude, OpenAI, Gemini); ao escolher, exibe o comando/config exato já com a
 * chave embutida, pronto para copiar e colar no terminal. Renderiza nada quando
 * `revealed` é `null`.
 */
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
          <div className="flex items-center gap-2 rounded-lg border border-[var(--well-border)] bg-[var(--well)] px-3 py-2 shadow-[inset_0_2px_12px_rgba(0,0,0,0.28)]">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
              {value}
            </code>
            <Button
              size="xs"
              variant="secondary"
              className="gap-1.5 rounded-full"
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
          <h3 className="mb-2.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
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
          <Button onClick={onClose} className="rounded-full">
            Já guardei
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Seletor de IA + caixa de comando.
 *
 * Renderiza abas sublinhadas (Claude / OpenAI / Gemini) e, abaixo, o comando ou
 * bloco de configuração correspondente — montado por {@link AI_PROVIDERS} com
 * `endpoint` e `apiKey` embutidos. O bloco é um "poço": recua um degrau abaixo
 * do fundo da página (`--well`) em vez de flutuar como card, para se distinguir
 * por profundidade. Reutilizado no modal de revelação (com a chave real) e na
 * seção de Conexão (com placeholder).
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
    <div className="min-w-0">
      <div className="mt-6 mb-3.5 flex gap-6">
        {AI_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProviderId(p.id)}
            aria-pressed={p.id === providerId}
            className={cn(
              "text-[13px] font-semibold tracking-[-0.01em] transition-colors",
              p.id === providerId
                ? "text-foreground underline decoration-primary decoration-2 underline-offset-[6px]"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* O poço — recua, não sobe. */}
      <div className="overflow-hidden rounded-xl border border-[var(--well-border)] bg-[var(--well)] shadow-[inset_0_2px_14px_rgba(0,0,0,0.30)]">
        <div className="flex items-center justify-between border-b border-[var(--well-border)] px-4 py-2.5">
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {provider.boxLabel}
          </span>
          <button
            type="button"
            onClick={() => copy(command, copyId)}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {copiedId === copyId ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            {copiedId === copyId ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-[1.8] break-all whitespace-pre-wrap text-foreground">
          <code>{renderCommand(command)}</code>
        </pre>
      </div>

      <p className="mt-3 text-[12px] text-muted-foreground/70">
        {provider.hint}
      </p>
    </div>
  );
}

/**
 * Realce mínimo do comando: strings entre aspas ganham `--code-string` (âmbar
 * no dark, ocre no light). É o único ponto de cor do poço — o resto fica no
 * `foreground`, para o olho pousar na chave e não no ruído.
 */
function renderCommand(command: string): React.ReactNode[] {
  return command.split(/(".*?")/g).map((part, i) =>
    part.startsWith('"') && part.endsWith('"') && part.length > 1 ? (
      <span key={i} style={{ color: "var(--code-string)" }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border py-3">
      <span className="w-[74px] shrink-0 text-[10px] font-semibold tracking-[0.13em] text-muted-foreground/70 uppercase">
        {label}
      </span>
      <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
        {value}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copiar ${label.toLowerCase()}`}
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
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
  onRevoke,
  revoking,
}: {
  item: McpKeyListItemDto;
  onRevoke: () => void;
  revoking: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-5 border-b border-border py-4",
        item.disabled && "opacity-50",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <code className="font-mono text-[15px] tracking-[-0.01em] text-foreground">
            {maskKey(item.prefix)}
          </code>
          {item.disabled && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              revogada
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[11.5px] tabular-nums text-muted-foreground/70">
          <span>Criada em {formatDate(item.createdAt)}</span>
          <span>
            {item.lastUsedAt
              ? `Último uso ${formatDate(item.lastUsedAt)}`
              : "Nunca usada"}
          </span>
        </div>
        {item.scopes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.scopes.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium tracking-[0.04em] text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
      {!item.disabled && (
        <button
          type="button"
          onClick={onRevoke}
          disabled={revoking}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
        >
          {revoking ? "Revogando…" : "Revogar"}
        </button>
      )}
    </div>
  );
}

function EmptyKeys() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
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
        "flex items-center justify-center rounded-xl border border-dashed p-10 text-center text-xs",
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
