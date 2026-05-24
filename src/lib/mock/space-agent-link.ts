/**
 * Mock store de vínculos Espaço↔Agente VPS.
 *
 * Espelha os campos de DProject no backend: idAgent, remotePath, remoteBranch, remoteRepoUrl.
 * Persiste vínculos no localStorage para sobreviver a reloads da página.
 *
 * Cada Espaço suporta no máximo 1 agente vinculado (Opção A).
 * O código está estruturado para facilitar a migração futura para vínculo por Lista (Opção C)
 * sem reescrita — basta adicionar funções análogas com `listId`.
 *
 * @see use-space-agent-link.ts — hooks TanStack Query que consomem este store
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Vínculo entre um Espaço e um agente VPS. */
export interface SpaceAgentLink {
  spaceId: string;
  agentId: string;
  remoteRepoUrl: string;
  remoteBranch: string;
  remotePath: string;
  /** ISO 8601 — data/hora em que o vínculo foi criado */
  linkedAt: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'scrumban_space_agent_links';

function loadLinks(): SpaceAgentLink[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SpaceAgentLink[];
  } catch {
    return [];
  }
}

function saveLinks(links: SpaceAgentLink[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Retorna o vínculo de um Espaço, ou null se não houver.
 *
 * @param spaceId - ID do Espaço
 */
export function getSpaceLink(spaceId: string): SpaceAgentLink | null {
  return loadLinks().find((l) => l.spaceId === spaceId) ?? null;
}

/**
 * Cria ou substitui o vínculo de um Espaço com um agente VPS.
 * Se já existia um vínculo para o mesmo spaceId, ele é sobrescrito.
 *
 * @param link - Dados completos do vínculo
 */
export function linkSpaceToAgent(link: SpaceAgentLink): void {
  const others = loadLinks().filter((l) => l.spaceId !== link.spaceId);
  saveLinks([...others, link]);
}

/**
 * Remove o vínculo de um Espaço, se existir.
 *
 * @param spaceId - ID do Espaço a desvincular
 */
export function unlinkSpace(spaceId: string): void {
  saveLinks(loadLinks().filter((l) => l.spaceId !== spaceId));
}

// ─── Extensão futura (Opção C — vínculo por Lista) ───────────────────────────
// export function getListLink(listId: string): SpaceAgentLink | null { ... }
// export function linkListToAgent(link: ListAgentLink): void { ... }
// export function unlinkList(listId: string): void { ... }
