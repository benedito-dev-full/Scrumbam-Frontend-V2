'use client';

// Hooks para gerenciamento de agentes VPS.
// TODO: trocar implementações mock por chamadas reais à api quando backend estiver pronto.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  AgentDto,
  CreateAgentDto,
  UpdateAgentDto,
  InstallTokenDto,
} from '@/lib/types/api';

// ─── Mock store (localStorage) ────────────────────────────────────────────────
// Simula o backend enquanto não existe endpoint real.

const STORAGE_KEY = 'scrumban_agents_mock';

function loadAgents(): AgentDto[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AgentDto[];
  } catch {
    return [];
  }
}

function saveAgents(agents: AgentDto[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

/**
 * Factory de query keys para agentes VPS.
 *
 * Centraliza chaves para evitar typos e facilitar invalidação.
 * SEMPRE use este helper — nunca string inline.
 *
 * @example
 * useQuery({ queryKey: agentKeys.all, ... })
 * queryClient.invalidateQueries({ queryKey: agentKeys.installToken(agentId) })
 */
export const agentKeys = {
  all: ['agents'] as const,
  installToken: (agentId: string) => ['agents', 'token', agentId] as const,
  executions: (agentId: string) => ['agents', 'executions', agentId] as const,
} as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Busca todos os agentes VPS do mock localStorage.
 *
 * staleTime de 10s — refetch ao focar janela após esse período.
 * Troca o queryFn por `api.get('/agents')` quando o backend estiver pronto.
 *
 * @returns Resultado do `useQuery` com `data: AgentDto[]`
 *
 * @example
 * const { data: agents = [], isLoading } = useAgents();
 */
export function useAgents() {
  return useQuery({
    queryKey: agentKeys.all,
    queryFn: (): AgentDto[] => loadAgents(),
    staleTime: 10_000,
  });
}

/**
 * Cria um novo agente VPS e o salva no mock localStorage.
 *
 * O agente começa com status `pending_install`.
 * Troca o mutationFn por `api.post('/agents', dto)` quando o backend estiver pronto.
 *
 * @returns Handle de mutation com `mutate`, `mutateAsync`, `isPending`
 *
 * @example
 * const createAgent = useCreateAgent();
 * const agent = await createAgent.mutateAsync({ name: 'Prod 01', hostname: '1.2.3.4' });
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateAgentDto): Promise<AgentDto> => {
      const agents = loadAgents();
      const newAgent: AgentDto = {
        id: crypto.randomUUID(),
        name: dto.name,
        hostname: dto.hostname,
        status: 'pending_install',
        lastHeartbeat: null,
        repoUrl: dto.repoUrl ?? null,
        repoApiKey: null,
        autonomyLevel: dto.autonomyLevel ?? 'LOW',
        orgId: 'mock-org',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      saveAgents([...agents, newAgent]);
      return newAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

/**
 * Remove um agente VPS pelo id.
 *
 * Troca o mutationFn por `api.delete(\`/agents/\${agentId}\`)` quando o backend estiver pronto.
 *
 * @returns Handle de mutation com `mutate`, `isPending`
 *
 * @example
 * const deleteAgent = useDeleteAgent();
 * deleteAgent.mutate(agent.id);
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agentId: string): Promise<void> => {
      const agents = loadAgents().filter((a) => a.id !== agentId);
      saveAgents(agents);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

/**
 * Atualiza campos de um agente existente (nome, hostname, repoUrl, autonomyLevel).
 *
 * Troca o mutationFn por `api.patch(\`/agents/\${id}\`, dto)` quando o backend estiver pronto.
 *
 * @returns Handle de mutation com `mutate`, `mutateAsync`, `isPending`
 *
 * @example
 * const updateAgent = useUpdateAgent();
 * await updateAgent.mutateAsync({ id: agent.id, autonomyLevel: 'HIGH' });
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...dto
    }: { id: string } & UpdateAgentDto): Promise<AgentDto> => {
      const agents = loadAgents();
      const idx = agents.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Agent not found');
      const updated: AgentDto = {
        ...agents[idx],
        ...dto,
        atualizadoEm: new Date().toISOString(),
      };
      agents[idx] = updated;
      saveAgents(agents);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

/**
 * Gera (mock) um token de instalação para um agente específico.
 *
 * O token é válido por 30 minutos. Em produção, trocar por
 * `api.post(\`/agents/\${agentId}/install-token\`)`.
 *
 * @param agentId - ID do agente (UUID)
 * @returns Resultado do `useQuery` com `data: InstallTokenDto`
 *
 * @example
 * const { data: tokenData } = useInstallToken(agent.id);
 */
export function useInstallToken(agentId: string) {
  return useQuery({
    queryKey: agentKeys.installToken(agentId),
    queryFn: async (): Promise<InstallTokenDto> => {
      const suffix = agentId.slice(0, 8);
      const token = `sk-agent-${suffix}-${Date.now().toString(36)}`;
      return {
        token,
        installCommand: `curl -sSL https://scrumban.com.br/install | bash -s -- --token=${token}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    },
    enabled: !!agentId,
    staleTime: 60_000,
  });
}

/**
 * Simula a conexão do agente ao VPS após instalação.
 *
 * Atualiza o status do agente para `online` no mock localStorage.
 * Em produção, esse status viria de heartbeat real do backend (polling/websocket).
 *
 * @param agentId - ID do agente a marcar como online
 * @returns Handle de mutation
 */
export function useSimulateAgentOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agentId: string): Promise<AgentDto> => {
      const agents = loadAgents();
      const idx = agents.findIndex((a) => a.id === agentId);
      if (idx === -1) throw new Error('Agent not found');
      const updated: AgentDto = {
        ...agents[idx],
        status: 'online',
        lastHeartbeat: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      agents[idx] = updated;
      saveAgents(agents);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}
