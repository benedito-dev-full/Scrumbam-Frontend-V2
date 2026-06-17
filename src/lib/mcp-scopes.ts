/**
 * Catálogo canônico de scopes MCP (espelho do backend — ADR-V2-068).
 *
 * SSOT do frontend para os 6 scopes finos per-tool. Mantém paridade com
 * `src/mcp/constants.ts` do backend (Scrumban-Backend-V2):
 *
 *   tasks:read · tasks:write · notifications:read · notifications:write
 *   projects:write · executions:create
 *
 * ⚠️ DUPLICAÇÃO CONSCIENTE: estes valores precisam bater 1:1 com o backend.
 * Não há package compartilhado entre os repos hoje (ver ADR-V2-068 §"WILL NOT
 * HAVE"). Se um scope mudar no backend, atualizar aqui. A fonte de verdade em
 * runtime continua sendo `GET /mcp/keys/allowed-scopes` (role-aware) — este
 * módulo só descreve o catálogo e os presets para a UI.
 */

// ─── Catálogo ───────────────────────────────────────────────────────────────

export const MCP_SCOPES = {
  TASKS_READ: "tasks:read",
  TASKS_WRITE: "tasks:write",
  NOTIFICATIONS_READ: "notifications:read",
  NOTIFICATIONS_WRITE: "notifications:write",
  PROJECTS_WRITE: "projects:write",
  EXECUTIONS_CREATE: "executions:create",
} as const;

export type McpScope = (typeof MCP_SCOPES)[keyof typeof MCP_SCOPES];

/** Todos os scopes do catálogo, na ordem canônica de exibição. */
export const ALL_MCP_SCOPES: McpScope[] = [
  MCP_SCOPES.TASKS_READ,
  MCP_SCOPES.TASKS_WRITE,
  MCP_SCOPES.NOTIFICATIONS_READ,
  MCP_SCOPES.NOTIFICATIONS_WRITE,
  MCP_SCOPES.PROJECTS_WRITE,
  MCP_SCOPES.EXECUTIONS_CREATE,
];

/** Type guard — estreita uma string desconhecida para `McpScope`. */
export function isMcpScope(value: string): value is McpScope {
  return (ALL_MCP_SCOPES as string[]).includes(value);
}

// ─── Metadados por scope (rótulo + descrição para a UI) ──────────────────────

export interface McpScopeMeta {
  /** Rótulo curto exibido no checkbox. */
  label: string;
  /** Descrição do que o scope concede. */
  description: string;
  /** Nomes das tools cobertas por este scope (espelha o backend). */
  tools: string[];
}

export const MCP_SCOPE_META: Record<McpScope, McpScopeMeta> = {
  [MCP_SCOPES.TASKS_READ]: {
    label: "Ler tarefas e projetos",
    description: "Listar e consultar tarefas, projetos, fases e membros.",
    tools: [
      "list_tasks",
      "get_task",
      "search_tasks",
      "list_projects",
      "get_project",
      "list_blocks",
      "list_block_tasks",
      "list_members",
    ],
  },
  [MCP_SCOPES.TASKS_WRITE]: {
    label: "Escrever tarefas",
    description: "Criar, atualizar, mover de status e cronometrar tarefas.",
    tools: [
      "create_task",
      "update_task",
      "update_status",
      "update_timer",
      "delete_task",
    ],
  },
  [MCP_SCOPES.NOTIFICATIONS_READ]: {
    label: "Ler notificações",
    description: "Listar notificações e contar as não lidas.",
    tools: ["list_notifications", "get_unread_count"],
  },
  [MCP_SCOPES.NOTIFICATIONS_WRITE]: {
    label: "Escrever notificações",
    description: "Marcar notificações como lidas.",
    tools: ["update_notification"],
  },
  [MCP_SCOPES.PROJECTS_WRITE]: {
    label: "Escrever projetos",
    description: "Atualizar atributos de projetos.",
    tools: ["update_project"],
  },
  [MCP_SCOPES.EXECUTIONS_CREATE]: {
    label: "Disparar execuções de IA",
    description: "Executar tarefas via Claude Code (consome tokens de IA).",
    tools: ["execute_task"],
  },
};

/** Tools cobertas por um conjunto de scopes (sem duplicatas, ordem do catálogo). */
export function toolsForScopes(scopes: McpScope[]): string[] {
  const set = new Set<string>();
  for (const scope of ALL_MCP_SCOPES) {
    if (scopes.includes(scope)) {
      for (const tool of MCP_SCOPE_META[scope].tools) set.add(tool);
    }
  }
  return [...set];
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export type McpPresetId = "read_only" | "read_write" | "full_access" | "custom";

export interface McpPreset {
  id: Exclude<McpPresetId, "custom">;
  label: string;
  description: string;
  scopes: McpScope[];
}

/**
 * Presets prontos (espelham `MCP_SCOPE_PRESETS` do backend). O modo
 * `custom` não aparece aqui — é tratado à parte (checkboxes individuais).
 */
export const MCP_PRESETS: McpPreset[] = [
  {
    id: "read_only",
    label: "Somente Leitura",
    description: "Dashboards e integrações que só consultam o workspace.",
    scopes: [MCP_SCOPES.TASKS_READ, MCP_SCOPES.NOTIFICATIONS_READ],
  },
  {
    id: "read_write",
    label: "Leitura + Escrita",
    description: "Bots de produtividade que criam e atualizam tarefas.",
    scopes: [
      MCP_SCOPES.TASKS_READ,
      MCP_SCOPES.TASKS_WRITE,
      MCP_SCOPES.NOTIFICATIONS_READ,
      MCP_SCOPES.NOTIFICATIONS_WRITE,
    ],
  },
  {
    id: "full_access",
    label: "Acesso Total",
    description: "Automação completa, incluindo execuções de IA.",
    scopes: [...ALL_MCP_SCOPES],
  },
];

/** Compara dois conjuntos de scopes ignorando ordem. */
export function sameScopeSet(a: McpScope[], b: McpScope[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((s) => setB.has(s));
}

/**
 * Identifica qual preset corresponde exatamente a um conjunto de scopes.
 * Retorna `"custom"` quando não bate com nenhum preset (seleção manual).
 */
export function presetForScopes(scopes: McpScope[]): McpPresetId {
  const match = MCP_PRESETS.find((p) => sameScopeSet(p.scopes, scopes));
  return match ? match.id : "custom";
}
