"use client";

import React, { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useSubtasks,
  useUpdateTask,
  useUpdateTaskStatus,
  useCreateTask,
} from "@/hooks/use-tasks";
import { intentionToColumn } from "@/lib/mappers/task-status.mapper";
import { qk } from "@/lib/query-keys";
import { PILL_TO_V3, type MemberLike } from "@/lib/mappers/groups-from-tasks";
import type { FieldValue } from "@/lib/types/table-fields";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import { Checkbox, EditableText, FieldCell, inputStyle } from "./cells";
import { TimeSpentCell } from "./time-spent-cell";
import {
  W_CHECK,
  W_SUBTASK_DATE,
  W_SUBTASK_NOME,
  W_SUBTASK_PRIORITY,
  W_SUBTASK_RESP,
  W_SUBTASK_STATUS,
  W_SUBTASK_TIME,
} from "./columns";
import { useSelection } from "./selection";
import { SUBTASK_COLUMNS } from "./types";
import { fieldErrorDescription } from "./errors";

/* ─── Sub-tabela de subtarefas (estilo Monday) ───────────────────────────── */

/**
 * Linha de expansão que embrulha a `SubtaskTable` num `<tr><td colSpan>`.
 *
 * Renderizada imediatamente após o `<tr>` do pai no `<tbody>` do grupo.
 * Quando `expanded` é `false`, retorna `null` sem altura residual.
 * O `<td>` com `colSpan` cobre toda a largura da tabela pai; dentro dele
 * renderiza uma sub-tabela independente com 6 colunas fixas (Subelemento |
 * Resp. | Status | Data | Prioridade | Tempo), seguindo o padrão Monday.com.
 *
 * @param parentId   - ID da task pai.
 * @param groupColor - Cor do grupo (usada na borda esquerda da sub-tabela visual).
 * @param colSpan    - Número de colunas do bloco pai (inclui checkbox + colunas + botão add).
 * @param projectId  - ID do projeto (necessário para mutations internas).
 * @param members    - Lista de membros para resolver userId → nome na coluna de responsável.
 * @param expanded   - Controla visibilidade da sub-tabela.
 *
 * @see SubtaskTable para a tabela interna
 */
export function SubtaskTableRow({
  parentId,
  groupColor,
  colSpan,
  projectId,
  members,
  expanded,
}: {
  parentId: string;
  groupColor: string;
  colSpan: number;
  projectId: string;
  members?: MemberLike[];
  expanded: boolean;
}) {
  if (!expanded) return null;

  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          // Recuo a esquerda (28px) deixa o braco de ligacao visivel.
          // Respiro generoso EM CIMA e EMBAIXO (14px) descola a sub-tabela tanto
          // da tarefa-pai dela quanto da proxima tarefa, evidenciando a hierarquia
          // (estilo Monday — o bloco da subtarefa "flutua" entre as duas).
          padding: "14px 0 14px 28px",
          borderBottom: "1px solid var(--border)",
          // Fundo transparente: o respiro de 14px em cima/embaixo mostra o fundo
          // normal da linha, fazendo a sub-tabela (card destacado) "flutuar"
          // entre o pai e a proxima tarefa, como no Monday.
          background: "transparent",
          position: "relative",
          // NOTA: a calha lateral (cor do grupo) ja vem do GroupBox (borderLeft
          // de 4px no container scrollavel). NAO duplicar aqui — antes havia um
          // boxShadow inset que criava uma segunda barra lateral.
        }}
      >
        {/* Braco horizontal de ligacao (cor do grupo) — sai da calha lateral do
            grupo (x=0) e vai ate o card (x=28), conectando a barra lateral a
            sub-tabela, como no Monday. Centralizado verticalmente. */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: 28,
            height: 2,
            background: groupColor,
          }}
        />
        <SubtaskTable
          parentId={parentId}
          projectId={projectId}
          members={members}
          expanded={expanded}
        />
      </td>
    </tr>
  );
}

/**
 * Tabela independente de subtarefas embutida na linha de expansão do pai.
 *
 * **Lazy fetch:** Usa `useSubtasks(parentId, expanded)` — a query só dispara
 * quando `expanded=true`. Enquanto carrega, exibe 3 linhas skeleton cinzas.
 *
 * **Layout:** Tabela `<table>` com colgroup próprio de 6 colunas fixas:
 * Subelemento (280px) | Resp. (130px) | Status (140px) | Data (110px) |
 * Prioridade (120px) | Tempo (110px).
 * Margem esquerda de 36px com borda colorida do grupo (conexão visual ao pai).
 *
 * **Conteúdo:** Renderiza cada subtarefa com `SubtaskTaskRow` (editável inline),
 * seguido de `AddSubtaskRow` para criar nova subtarefa.
 *
 * Sem scroll próprio — as 6 colunas cabem na largura mínima
 * do GroupBox sem necessidade de scroll horizontal.
 *
 * @param parentId   - ID da task pai.
 * @param projectId  - ID do projeto (necessário para mutations).
 * @param members    - Membros do projeto para resolver userId → nome na coluna de responsável.
 * @param expanded   - Controla se o fetch está habilitado e a tabela é visível.
 *
 * @example
 * <SubtaskTable
 *   parentId="task-123"
 *   projectId="proj-456"
 *   members={[...]}
 *   expanded={isExpanded}
 * />
 *
 * @see SubtaskTaskRow para edição inline de cada subtarefa
 * @see AddSubtaskRow para criação de nova subtarefa
 */
export function SubtaskTable({
  parentId,
  projectId,
  members,
  expanded,
}: {
  parentId: string;
  projectId: string;
  members?: MemberLike[];
  expanded: boolean;
}) {
  const { data: subtasks = [], isLoading } = useSubtasks(parentId, expanded);
  // Qual subtarefa esta salvando agora — alimenta o spinner conservador.
  const [savingId, setSavingId] = useState<string | null>(null);

  return (
    <div
      style={{
        // Card embutido com calha lateral grossa e contínua na cor do grupo
        // (conecta visualmente ao pai, estilo Monday). Fundo de card real para
        // destacar do fundo escuro. Ocupa toda a largura disponivel (100%) —
        // como no Monday, o bloco da subtarefa se estende ate o fim mesmo com
        // poucas colunas; a coluna "+" absorve o espaco restante.
        width: "100%",
        // A calha de conexao (cor do grupo) fica no <td> pai (boxShadow inset);
        // aqui o card so tem borda neutra e encosta nela.
        border: "1px solid var(--border)",
        borderRadius: 6,
        overflow: "hidden",
        // Fundo nitidamente mais claro que o "poco" (4%) e que o cabecalho —
        // a sub-tabela tem que se destacar como um card elevado, como no Monday.
        // var(--card) ficava quase identico ao fundo; subimos o contraste.
        background: "color-mix(in srgb, var(--foreground) 9%, var(--card))",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: W_CHECK }} />
          <col style={{ width: W_SUBTASK_NOME }} />
          <col style={{ width: W_SUBTASK_RESP }} />
          <col style={{ width: W_SUBTASK_STATUS }} />
          <col style={{ width: W_SUBTASK_DATE }} />
          <col style={{ width: W_SUBTASK_PRIORITY }} />
          <col style={{ width: W_SUBTASK_TIME }} />
          {/* Coluna "+" com largura `auto` — absorve todo o espaco restante,
              fazendo o grid se estender ate o fim da tabela pai (estilo Monday). */}
          <col />
        </colgroup>

        <SubtaskHeadRow />

        <tbody>
          {isLoading
            ? /* Skeleton de carregamento — 3 linhas cinza enquanto fetch */
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={8} style={{ height: 34, padding: "4px 8px" }}>
                    <div
                      style={{
                        height: 18,
                        borderRadius: 4,
                        background:
                          "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
                        width: `${60 + i * 15}%`,
                      }}
                    />
                  </td>
                </tr>
              ))
            : subtasks.map((sub) => (
                <SubtaskTaskRow
                  key={sub.id}
                  subtask={sub}
                  projectId={projectId}
                  members={members}
                  savingId={savingId}
                  onSavingChange={setSavingId}
                  parentId={parentId}
                />
              ))}
          <AddSubtaskRow parentId={parentId} projectId={projectId} />
        </tbody>
      </table>
    </div>
  );
}

/**
 * Cabeçalho da sub-tabela de subtarefas — 6 colunas fixas reduzidas.
 *
 * Diferencia-se do cabeçalho pai por:
 * - Sem checkbox na primeira coluna (apenas espaço reservado)
 * - Sem botão de "Adicionar coluna" (colunas são fixas)
 * - Fonte menor (11px vs 12px) e cor muted
 * - Altura menor (6px padding vs 9px)
 */
export function SubtaskHeadRow() {
  const th: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    padding: "7px 8px",
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    // Cabecalho um pouco mais forte que o corpo do card (que ja e 9%) — faixa
    // de grid visivel, como no Monday. Base no proprio fundo do card para
    // contraste previsivel. TODAS as colunas (inclusive "+") usam este mesmo
    // background — nenhuma fica mais escura que as outras.
    background: "color-mix(in srgb, var(--foreground) 13%, var(--card))",
    whiteSpace: "nowrap",
    textAlign: "center",
  };
  return (
    <thead>
      <tr>
        <th style={{ ...th, padding: 0 }} />
        <th style={{ ...th, textAlign: "left", paddingLeft: 8 }}>
          Subelemento
        </th>
        <th style={th}>Resp.</th>
        <th style={th}>Status</th>
        <th style={th}>Data limite</th>
        <th style={th}>Prioridade</th>
        <th style={th}>Tempo</th>
        {/* Coluna "+" decorativa — espelha o "adicionar coluna" do Monday.
            Largura `auto`: estende o grid ate o fim. O "+" fica alinhado a
            esquerda (logo apos Data), nao centralizado no vazio.
            IMPORTANTE: opacity SO no icone — antes estava na <th> inteira, o
            que escurecia o FUNDO da coluna (deixava-a mais escura que as ativas). */}
        <th
          style={{
            ...th,
            borderRight: 0,
            textAlign: "left",
            color: "var(--muted-foreground)",
          }}
        >
          <Plus size={13} style={{ opacity: 0.4 }} />
        </th>
      </tr>
    </thead>
  );
}

/**
 * Linha de uma subtarefa na sub-tabela — renderiza e edita 6 colunas
 * (Nome | Resp. | Status | Data | Prioridade | Tempo) com feedback
 * conservador (spinner até o backend confirmar).
 *
 * **Edição inline:**
 * - Nome: `EditableText` com `useUpdateTask` (DTO.titulo)
 * - Responsável: `FieldCell` com menu de membros
 * - Status: `FieldCell` com pills coloridas; VALIDATED trava a edição
 * - Data: `FieldCell` com date picker
 * - Prioridade: `FieldCell` dropdown (LOW/MEDIUM/HIGH/URGENT)
 * - Tempo: `TimeSpentCell` com timer inline (start/stop) próprio da subtarefa
 *
 * **Invalidação:** Mutations invalidam `qk.tasks.children(parentId)` no
 * `onSuccess`, além das invalidações padrão já feitas pelos hooks
 * `useUpdateTask` e `useUpdateTaskStatus`.
 *
 * @param subtask        - DTO da subtarefa do backend.
 * @param projectId      - ID do projeto (necessário para as mutations).
 * @param members        - Membros do projeto para resolver userId → nome.
 * @param savingId       - ID da subtarefa que está salvando (mostra spinner).
 * @param onSavingChange - Callback para atualizar `savingId` no estado pai.
 * @param parentId       - ID da task pai (para invalidar `qk.tasks.children`).
 *
 * @see SubtaskTable para o contexto de parent
 * @see FieldCell para a lógica de edição por tipo de coluna
 */
export function SubtaskTaskRow({
  subtask,
  projectId,
  members,
  savingId,
  onSavingChange,
  parentId,
}: {
  subtask: TaskResponseDto;
  projectId: string;
  members?: MemberLike[];
  savingId: string | null;
  onSavingChange: (id: string | null) => void;
  parentId: string;
}) {
  const [hover, setHover] = useState(false);
  const queryClient = useQueryClient();
  // Selecao via checkbox (null deixa o checkbox decorativo).
  const selection = useSelection();

  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();

  const saving = savingId === subtask.id;

  /** Estado V3 cru da subtarefa — passado para `FieldCell` travar pilula VALIDATED. */
  const statusV3 = subtask.status ?? null;
  /** Coluna visual de status baseada no V3 Intention atual. */
  const statusColId = subtask.status
    ? intentionToColumn(subtask.status as V3Intention)
    : null;

  function handleSubtaskFieldError(error: unknown) {
    toast.error("Não foi possível salvar esta célula.", {
      description: fieldErrorDescription(error),
    });
    void queryClient.invalidateQueries({
      queryKey: qk.tasks.children(parentId),
    });
    void queryClient.invalidateQueries({
      queryKey: qk.tasks.byProject(projectId),
    });
    void queryClient.invalidateQueries({ queryKey: qk.tasks.byId(subtask.id) });
  }

  /** Salva um campo da subtarefa. */
  function handleEdit(columnKey: string, value: FieldValue) {
    if (columnKey === "status") {
      const v3 = typeof value === "string" ? PILL_TO_V3[value] : undefined;
      if (!v3) return;
      onSavingChange(subtask.id);
      updateStatus.mutate(
        { id: subtask.id, status: v3, projectId },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: qk.tasks.children(parentId),
            });
          },
          onError: handleSubtaskFieldError,
          onSettled: () => onSavingChange(null),
        },
      );
      return;
    }

    const dto: {
      titulo?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
      priority?: string;
    } = {};

    if (columnKey === "__nome") {
      if (typeof value !== "string" || !value.trim()) return;
      dto.titulo = value.trim();
    } else if (columnKey === "responsavel") {
      dto.assigneeId = typeof value === "string" && value ? value : null;
    } else if (columnKey === "dueDate") {
      dto.dueDate = typeof value === "string" && value ? value : null;
    } else if (columnKey === "prioridade") {
      // FieldCell dropdown emite o id da opcao (= TaskPriority: LOW/MEDIUM/...).
      if (typeof value !== "string" || !value) return;
      dto.priority = value;
    } else {
      return;
    }

    onSavingChange(subtask.id);
    updateTask.mutate(
      { id: subtask.id, projectId, dto },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: qk.tasks.children(parentId),
          });
        },
        onError: handleSubtaskFieldError,
        onSettled: () => onSavingChange(null),
      },
    );
  }

  const td: React.CSSProperties = {
    padding: "0 8px",
    height: 38,
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    verticalAlign: "middle",
    fontSize: 12,
    color: "var(--foreground)",
    background: hover ? "var(--accent)" : "transparent",
    transition: "background .1s",
  };

  // Celulas de campos da subtarefa usando as SUBTASK_COLUMNS
  const statusCol = SUBTASK_COLUMNS.find((c) => c.key === "status")!;
  const respCol = SUBTASK_COLUMNS.find((c) => c.key === "responsavel")!;
  const dateCol = SUBTASK_COLUMNS.find((c) => c.key === "dueDate")!;
  const priorityCol = SUBTASK_COLUMNS.find((c) => c.key === "prioridade")!;

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td
        style={{
          ...td,
          padding: 0,
          textAlign: "center",
          borderRight: "1px solid var(--border)",
        }}
      >
        {selection ? (
          <Checkbox
            checked={selection.selectedIds.has(subtask.id)}
            onChange={(next) => selection.toggle(subtask.id, next)}
          />
        ) : (
          <Checkbox checked={false} />
        )}
      </td>

      {/* Nome / titulo da subtarefa */}
      <td style={{ ...td, fontWeight: 500 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {saving && (
            <Loader2
              size={12}
              style={{
                flexShrink: 0,
                opacity: 0.5,
                animation: "spin 1s linear infinite",
              }}
            />
          )}
          <EditableText
            value={subtask.nome}
            onCommit={(v) => handleEdit("__nome", v)}
            style={{
              flex: 1,
              fontWeight: 500,
              color: "var(--foreground)",
              ...(saving ? { opacity: 0.5, pointerEvents: "none" } : {}),
            }}
          />
        </div>
      </td>

      {/* Responsavel */}
      <FieldCell
        tdStyle={td}
        column={respCol}
        value={subtask.assigneeId ?? null}
        onChange={(v) => handleEdit("responsavel", v)}
        readOnly={false}
        members={members}
        saving={saving}
      />

      {/* Status */}
      <FieldCell
        tdStyle={td}
        column={statusCol}
        value={statusColId}
        onChange={(v) => handleEdit("status", v)}
        readOnly={false}
        members={members}
        saving={saving}
        statusV3={statusV3}
      />

      {/* Data */}
      <FieldCell
        tdStyle={td}
        column={dateCol}
        value={subtask.dueDate ?? null}
        onChange={(v) => handleEdit("dueDate", v)}
        readOnly={false}
        members={members}
        saving={saving}
      />

      {/* Prioridade — dropdown com as mesmas opcoes/cores do bloco pai */}
      <FieldCell
        tdStyle={td}
        column={priorityCol}
        value={subtask.priority ?? null}
        onChange={(v) => handleEdit("prioridade", v)}
        readOnly={false}
        members={members}
        saving={saving}
      />

      {/* Tempo gasto — timer inline (start/stop) por subtarefa. Quando a
          subtarefa tem netos, o backend ja entrega aqui a soma deles (rollup). */}
      <TimeSpentCell
        tdStyle={td}
        label={subtask.timeSpentLabel ?? "—"}
        taskId={subtask.id}
        projectId={projectId}
        isRollup={subtask.timeSpentIsRollup ?? false}
      />

      {/* Celula vazia sob a coluna "+" decorativa do cabecalho */}
      <td style={{ ...td, borderRight: 0 }} />
    </tr>
  );
}

/**
 * Linha "+ Adicionar subelemento" ao final da sub-tabela.
 *
 * **Estados:**
 * - Repouso: botão clicável "Adicionar subelemento"
 * - Ativo: input inline para digitar o nome (auto-focus)
 * - Carregando (`creating`): spinner "Criando subelemento..." que cobre o
 *   ciclo inteiro — submit (POST) E refetch das children — ate a subtarefa
 *   aparecer de fato na lista (o `await invalidateQueries` segura o estado).
 *
 * **Confirmação:**
 * - Enter → cria a subtarefa (input perde foco)
 * - Blur com valor não-vazio → cria a subtarefa
 * - Escape → cancela edição
 * - Valor vazio ao blur/Enter → apenas fecha o input
 *
 * **Criação:** Chama `useCreateTask({ titulo, idProject, idPai })`.
 * A mutação invalida automaticamente `qk.tasks.children(parentId)` (já feito
 * pelo hook). Após sucesso, limpa o input e reseta o estado.
 *
 * Botão fica desabilitado (opacity 0.5, cursor not-allowed) enquanto
 * `isPending`, evitando cliques duplos.
 *
 * @param parentId  - ID da task pai (passado como `idPai` na criação).
 * @param projectId - ID do projeto (passado como `idProject` na criação).
 *
 * @example
 * <AddSubtaskRow parentId="task-123" projectId="proj-456" />
 * // Ao confirmar: cria { titulo, idProject: 'proj-456', idPai: 'task-123' }
 *
 * @see SubtaskTable para o contexto de parent
 */
export function AddSubtaskRow({
  parentId,
  projectId,
}: {
  parentId: string;
  projectId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [hover, setHover] = useState(false);
  // `creating` cobre TODO o ciclo: submit (POST) + refetch das children, ate a
  // subtarefa realmente aparecer. So o `isPending` do mutation desligava cedo
  // demais (acabava no fim do POST, mas a lista so atualizava no refetch
  // seguinte — gap em que o spinner sumia e a task ainda nao tinha aparecido).
  const [creating, setCreating] = useState(false);
  const createTask = useCreateTask();
  const queryClient = useQueryClient();

  async function commit() {
    if (creating) return;
    const nome = draft.trim();
    if (!nome) {
      setAdding(false);
      setDraft("");
      return;
    }
    setCreating(true);
    setAdding(false);
    setDraft("");
    try {
      await createTask.mutateAsync({
        titulo: nome,
        idProject: projectId,
        idPai: parentId,
      });
      // Espera o refetch das subtarefas COMPLETAR — invalidateQueries resolve
      // so quando a query ativa termina de rebuscar. Mantem o spinner ate a
      // nova subtarefa estar de fato na lista.
      await queryClient.invalidateQueries({
        queryKey: qk.tasks.children(parentId),
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td
        colSpan={8}
        style={{
          height: 32,
          padding: 0,
          borderBottom: "none",
          background: hover ? "var(--accent)" : "transparent",
          transition: "background .1s",
        }}
      >
        {creating ? (
          /* Estado de carregamento — cobre submit + refetch, ate a subtarefa
             aparecer de fato na lista. Da feedback imediato e continuo,
             evitando a sensacao de que o clique nao funcionou. */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 8px 0 44px",
              height: 32,
              color: "var(--muted-foreground)",
              fontSize: 12,
            }}
          >
            <Loader2
              size={13}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Criando subelemento...
          </div>
        ) : adding ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 8px 0 44px",
              height: 32,
            }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commit();
                if (e.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              onBlur={() => void commit()}
              placeholder="Nome do subelemento..."
              style={{
                ...inputStyle,
                height: 26,
                padding: "3px 8px",
                fontSize: 12,
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 8px 0 44px",
              border: 0,
              background: "none",
              color: "var(--muted-foreground)",
              fontSize: 12,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <Plus size={13} />
            Adicionar subelemento
          </button>
        )}
      </td>
    </tr>
  );
}
