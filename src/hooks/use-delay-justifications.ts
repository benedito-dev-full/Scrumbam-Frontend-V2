"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Natureza do atraso capturada no momento do registro. */
export type DelayKind = "OPEN" | "COMPLETED_LATE";

/**
 * Opção de motivo do radio — uma DClasse-motivo (-531..-537), folha de
 * `DELAY_REASON -530`. Vem de `GET /classes?idPai=-530` (Pilar 2).
 */
export interface DelayReasonOption {
  /** Chave da DClasse (ex: "-535"), enviada como `motivoClasse` no POST. */
  chave: string;
  /** Nome exibido no radio (ex: "Problema técnico / bug"). */
  nome: string;
  /** Código textual da classe (pode ser null). */
  codigo: string | null;
}

/** Justificativa de atraso vigente de uma task (retorno de POST e GET). */
export interface DelayJustification {
  id: string;
  taskId: string;
  motivoClasse: string;
  texto: string;
  autorId: string;
  autorNome?: string | null;
  projetoId?: string | null;
  delayDays: number;
  delayKind: DelayKind | null;
  version: number;
  createdAt: string;
}

/** Payload do POST (radio obrigatório + detalhe opcional). */
export interface CreateDelayJustificationPayload {
  motivoClasse: string;
  texto?: string;
}

/** Resposta do badge de pendências. */
export interface PendingDelayCount {
  pendingCount: number;
  projectId: string | null;
}

// Shape cru de uma DClasse vinda de GET /classes (só os campos usados aqui).
interface ClasseFlat {
  chave: string;
  nome: string;
  codigo: string | null;
}

// ─── Hooks de leitura ─────────────────────────────────────────────────────────

/**
 * Lista os motivos de atraso do radio (folhas de `DELAY_REASON -530`).
 *
 * Mapeia para `GET /classes?idPai=-530`. As opções são seed (chave negativa),
 * raramente mudam — `staleTime` alto (5 min).
 *
 * @returns Resultado do useQuery com `data: DelayReasonOption[]`
 *
 * @example
 * ```tsx
 * const { data: reasons = [] } = useDelayReasons();
 * ```
 */
export function useDelayReasons() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<DelayReasonOption[]>({
    queryKey: qk.delayJustifications.reasons,
    queryFn: async () => {
      const res = await api.get<ClasseFlat[]>("/classes", {
        params: { idPai: "-530" },
      });
      return res.data.map((c) => ({
        chave: c.chave,
        nome: c.nome,
        codigo: c.codigo ?? null,
      }));
    },
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });
}

/**
 * Lê a justificativa de atraso VIGENTE de uma task (ou `null`).
 *
 * Mapeia para `GET /tasks/:taskId/delay-justification`. RBAC no backend:
 * apenas o responsável (assignee) ou org ADMIN — membro não lê de terceiros.
 *
 * @param taskId  - ID da DTask. Quando null, a query fica desabilitada.
 * @param enabled - Liga/desliga a query (ex: só busca quando o modal abre).
 * @returns Resultado do useQuery com `data: DelayJustification | null`
 */
export function useTaskDelayJustification(
  taskId: string | null,
  enabled = true,
) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<DelayJustification | null>({
    queryKey: qk.delayJustifications.byTask(taskId ?? ""),
    queryFn: async () => {
      const res = await api.get<DelayJustification | null>(
        `/tasks/${taskId}/delay-justification`,
      );
      return res.data ?? null;
    },
    enabled: !!accessToken && !!taskId && enabled,
    staleTime: 15_000,
  });
}

/**
 * Contagem de atrasos do próprio usuário sem justificativa vigente (badge).
 *
 * Mapeia para `GET /me/delay-justifications/pending-count?projectId=`.
 * Global por padrão; `projectId` recorta por projeto.
 *
 * @param projectId - Recorte opcional por projeto (null/omitido = global).
 * @returns Resultado do useQuery com `data: PendingDelayCount`
 */
export function usePendingDelayCount(projectId: string | null = null) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<PendingDelayCount>({
    queryKey: qk.delayJustifications.pendingCount(projectId),
    queryFn: async () => {
      const res = await api.get<PendingDelayCount>(
        "/me/delay-justifications/pending-count",
        { params: projectId ? { projectId } : undefined },
      );
      return res.data;
    },
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}

// ─── Painel admin de motivos (Fase 2) ─────────────────────────────────────────

/** Dimensão de agrupamento do painel admin de motivos de atraso. */
export type DelayReasonsGroupBy = "motivo" | "usuario" | "projeto";

/** Filtros compartilhados do painel (todos opcionais). */
export interface DelayReasonsFilters {
  userId?: string | null;
  projectId?: string | null;
  motivoClasse?: string | null;
  from?: string | null;
  to?: string | null;
}

/** Uma linha do ranking (semântica de key/label varia por groupBy). */
export interface DelayReasonGroup {
  key: string;
  label: string | null;
  count: number;
  avgDelayDays: number | null;
  /**
   * Quebra do grupo pela sub-dimensão (só presente quando `subGroupBy` é
   * pedido). Ex: por usuário → cada usuário com seus motivos. Ordenado por
   * count desc.
   */
  sub?: DelayReasonGroup[];
}

/** Resposta de `GET /reports/delay-reasons`. */
export interface DelayReasonsReport {
  groupBy: DelayReasonsGroupBy;
  subGroupBy: DelayReasonsGroupBy | null;
  orgId: string;
  total: number;
  groups: DelayReasonGroup[];
  filters: {
    userId: string | null;
    projectId: string | null;
    motivoClasse: string | null;
    from: string | null;
    to: string | null;
  };
}

/**
 * Agregação do painel admin de motivos de atraso (org ADMIN only no backend).
 *
 * Mapeia para `GET /reports/delay-reasons` com `groupBy` + filtros. A gaveta
 * pede um `groupBy` por vez (motivo/usuario/projeto) com os mesmos filtros —
 * 3 chamadas paralelas. `enabled` mantém a query desligada até a gaveta abrir.
 *
 * @param groupBy - Dimensão do ranking.
 * @param filters - Filtros compartilhados.
 * @param enabled - Liga a query (ex: só quando a gaveta abre e é admin).
 * @param subGroupBy - Sub-dimensão opcional do cruzamento (ex: "motivo" para
 *   quebrar cada usuário/projeto por motivo). Deve diferir de `groupBy`.
 * @returns Resultado do useQuery com `data: DelayReasonsReport`
 */
export function useDelayReasonsReport(
  groupBy: DelayReasonsGroupBy,
  filters: DelayReasonsFilters,
  enabled = true,
  subGroupBy?: DelayReasonsGroupBy,
) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<DelayReasonsReport>({
    queryKey: qk.delayJustifications.report(groupBy, filters, subGroupBy),
    queryFn: async () => {
      const params: Record<string, string> = { groupBy };
      if (subGroupBy) params.subGroupBy = subGroupBy;
      if (filters.userId) params.userId = filters.userId;
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.motivoClasse) params.motivoClasse = filters.motivoClasse;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await api.get<DelayReasonsReport>("/reports/delay-reasons", {
        params,
      });
      return res.data;
    },
    enabled: !!accessToken && enabled,
    staleTime: 30_000,
  });
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

/**
 * Cria ou edita (supersede) a justificativa de atraso vigente de uma task.
 *
 * Mapeia para `POST /tasks/:taskId/delay-justification`. Edição gera nova
 * versão (o backend supersede a anterior). Após sucesso, invalida a vigente
 * da task, todas as contagens de pendência e a raiz `tasks` (a tela /assigned
 * lê de listas my/user/team, não cobertas por byProject).
 *
 * Erros propagados ao caller: 400 (tarefa não atrasada / motivo inválido),
 * 403 (sem permissão), 404 (task inexistente).
 *
 * @example
 * ```tsx
 * const { mutateAsync, isPending } = useCreateDelayJustification();
 * await mutateAsync({ taskId, dto: { motivoClasse: "-535", texto: "..." } });
 * ```
 */
export function useCreateDelayJustification() {
  const queryClient = useQueryClient();
  return useMutation<
    DelayJustification,
    Error,
    { taskId: string; dto: CreateDelayJustificationPayload }
  >({
    mutationFn: async ({ taskId, dto }) => {
      const res = await api.post<DelayJustification>(
        `/tasks/${taskId}/delay-justification`,
        dto,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: qk.delayJustifications.byTask(variables.taskId),
      });
      // Todas as variações de pending-count (global + por projeto).
      void queryClient.invalidateQueries({
        queryKey: ["delay-justifications", "pending-count"],
      });
      // A lista /assigned lê de my/user/team → invalida a raiz de tasks.
      void queryClient.invalidateQueries({ queryKey: qk.tasks.all });
    },
  });
}
