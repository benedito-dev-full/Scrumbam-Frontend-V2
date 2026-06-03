"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Maximize2,
  Plus,
} from "lucide-react";
import {
  type ColumnDef,
  type FieldValue,
} from "@/lib/types/table-fields";
import {
  PILL_TO_V3,
  STATUS_V3_KEY,
  type MemberLike,
} from "@/lib/mappers/groups-from-tasks";
import { intentionToColumn } from "@/lib/mappers/task-status.mapper";
import { useSubtasks, useUpdateTask, useUpdateTaskStatus, useCreateTask } from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import type { TaskModel } from "@/lib/types/table-fields";
import {
  Checkbox,
  EditableText,
  FieldCell,
  inputStyle,
  SegmentBar,
} from "./cells";
import {
  W_CHECK,
  W_SUBTASK_DATE,
  W_SUBTASK_NOME,
  W_SUBTASK_RESP,
  W_SUBTASK_STATUS,
  colWidth,
} from "./columns";
import { useSelection } from "./selection";
import {
  BACKEND_EDITABLE_KEYS,
  NOME_KEY,
  SUBTASK_COLUMNS,
  noopFieldChange,
  type SubtarefasMode,
} from "./types";
import { fieldErrorDescription } from "./errors";

/* ─── Linha de tarefa ────────────────────────────────────────────────────── */

export function TaskRow({
  task,
  columns,
  readOnly,
  members,
  saving,
  projectId,
  subtarefasMode,
  groupColor,
  subtaskColSpan,
  onOpenTask,
  onEditField,
}: {
  task: TaskModel;
  columns: ColumnDef[];
  readOnly: boolean;
  members?: MemberLike[];
  saving?: boolean;
  /** ID do projeto — quando presente, habilita o caret e subtarefas inline. */
  projectId?: string;
  /** Modo de exibição de subtarefas (toolbar) — controla expandir/recolher. */
  subtarefasMode?: SubtarefasMode;
  /** Cor do grupo pai — passada para a borda esquerda da sub-tabela. */
  groupColor?: string;
  /** colSpan total da linha de expansao (columns.length + 2). */
  subtaskColSpan?: number;
  /** Abre a TaskSheet compartilhada para esta task (gatilho dedicado). */
  onOpenTask?: (taskId: string) => void;
  onEditField?: (taskId: string, columnKey: string, value: FieldValue) => void;
}) {
  const [hover, setHover] = useState(false);
  // Estado de expansao da sub-tabela — gerenciado localmente no TaskRow.
  const [expanded, setExpanded] = useState(false);
  // Selecao via checkbox (null deixa o checkbox decorativo).
  const selection = useSelection();

  const hasChildren = (task.childCount ?? 0) > 0;
  // No modo backend com projectId, qualquer task pode receber filhas —
  // o caret fica visivel no hover mesmo sem filhas (igual Monday).
  const showCaret = !!projectId;

  // Reage ao controle "Mostrar subtarefas" da toolbar (paridade com a Lista),
  // ajustando o estado DURANTE a render quando o modo muda — padrão sem
  // useEffect (evita cascata). "expandidas" abre linhas COM filhas (não dispara
  // useSubtasks a toa); "recolhidas" fecha tudo; "separar" não interfere.
  const [syncedMode, setSyncedMode] = useState(subtarefasMode);
  if (syncedMode !== subtarefasMode) {
    setSyncedMode(subtarefasMode);
    if (subtarefasMode === "expandidas") {
      if (hasChildren) setExpanded(true);
    } else if (subtarefasMode === "recolhidas") {
      setExpanded(false);
    }
  }

  const td: React.CSSProperties = {
    padding: "0 8px",
    height: 38,
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    verticalAlign: "middle",
    fontSize: 13,
    color: "var(--foreground)",
    background: hover ? "var(--accent)" : "transparent",
    transition: "background .1s",
  };

  return (
    <React.Fragment>
      <tr
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <td style={{ ...td, padding: 0, textAlign: "center" }}>
          {selection ? (
            <Checkbox
              checked={selection.selectedIds.has(task.id)}
              onChange={(next) => selection.toggle(task.id, next)}
            />
          ) : (
            <Checkbox checked={false} />
          )}
        </td>

        {columns.map((c, i) => {
          const last = i === columns.length - 1;
          if (c.builtin) {
            // Titulo da tarefa: editavel no backend (via onEditField → __nome)
            // Read-only puro mostra span.
            const nomeStyle: React.CSSProperties = {
              flex: 1,
              fontWeight: 500,
              color: "var(--foreground)",
              ...(saving ? { opacity: 0.5, pointerEvents: "none" } : {}),
            };
            return (
              <td
                key={c.key}
                style={{
                  ...td,
                  fontWeight: 500,
                  borderRight: last
                    ? "1px solid var(--border)"
                    : td.borderRight,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Caret de expansao de subtarefas — visivel no hover ou quando ha filhas */}
                  {showCaret && (
                    <button
                      type="button"
                      aria-label={
                        expanded ? "Recolher subtarefas" : "Expandir subtarefas"
                      }
                      onClick={() => setExpanded((v) => !v)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 18,
                        height: 18,
                        border: 0,
                        background: "none",
                        color: "var(--muted-foreground)",
                        cursor: "pointer",
                        flexShrink: 0,
                        opacity: hover || hasChildren || expanded ? 1 : 0,
                        transition: "opacity .1s",
                        padding: 0,
                      }}
                    >
                      {expanded ? (
                        <ChevronDown size={13} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={13} strokeWidth={2.5} />
                      )}
                    </button>
                  )}
                  {/* Contador de filhas quando recolhido */}
                  {hasChildren && !expanded && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        fontWeight: 500,
                        flexShrink: 0,
                        minWidth: 20,
                      }}
                    >
                      ({task.childCount})
                    </span>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    {onEditField ? (
                      // Backend: edita o titulo via onEditField (feedback conservador).
                      <EditableText
                        value={task.nome}
                        onCommit={(v) => onEditField(task.id, NOME_KEY, v)}
                        style={nomeStyle}
                      />
                    ) : readOnly ? (
                      <span
                        style={{
                          flex: 1,
                          fontWeight: 500,
                          color: "var(--foreground)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={task.nome}
                      >
                        {task.nome}
                      </span>
                    ) : null}
                  </div>
                  {/* Botão "Abrir" — gatilho DEDICADO da TaskSheet (hover).
                      `onPointerDown` com stopPropagation garante que jamais
                      inicie um drag (coluna/linha); `onClick` com stopPropagation
                      evita disparar o editor de título da célula. Zero conflito. */}
                  {onOpenTask && (
                    <button
                      type="button"
                      aria-label="Abrir detalhes"
                      title="Abrir detalhes"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTask(task.id);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        flexShrink: 0,
                        height: 22,
                        padding: "0 8px",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--muted-foreground)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: hover ? 1 : 0,
                        transition: "opacity .1s, color .1s, border-color .1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#7c5cff";
                        e.currentTarget.style.borderColor = "#7c5cff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--muted-foreground)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <Maximize2 size={12} />
                      Abrir
                    </button>
                  )}
                  {/* Botão "+" de adicionar subtarefa — estilo Monday: círculo
                      destacado ao lado do nome. Expande a sub-tabela do pai.
                      Só no modo backend (showCaret). */}
                  {showCaret && (
                    <button
                      type="button"
                      aria-label="Adicionar subtarefa"
                      title="Adicionar subtarefa"
                      onClick={() => setExpanded(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: "50%",
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--muted-foreground)",
                        cursor: "pointer",
                        opacity: hover ? 1 : 0,
                        transition: "opacity .1s, color .1s, border-color .1s",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#7c5cff";
                        e.currentTarget.style.borderColor = "#7c5cff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--muted-foreground)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>
              </td>
            );
          }
          // Identificador (ex: DEV-94) — gatilho SECUNDARIO de abertura. É
          // texto read-only, logo clicar nele nunca conflita com editor inline.
          // stopPropagation no pointerDown evita iniciar drag.
          if (c.key === "identifier" && onOpenTask) {
            const idValue = task.fields["identifier"];
            const idLabel =
              typeof idValue === "string" && idValue.length > 0
                ? idValue
                : null;
            return (
              <td
                key={c.key}
                style={{
                  ...td,
                  borderRight: last
                    ? "1px solid var(--border)"
                    : td.borderRight,
                }}
              >
                {idLabel ? (
                  <button
                    type="button"
                    title="Abrir detalhes"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTask(task.id);
                    }}
                    style={{
                      background: "none",
                      border: 0,
                      padding: 0,
                      font: "inherit",
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--muted-foreground)",
                      cursor: "pointer",
                      textDecorationLine: hover ? "underline" : "none",
                      transition: "color .1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#7c5cff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--muted-foreground)";
                    }}
                  >
                    {idLabel}
                  </button>
                ) : null}
              </td>
            );
          }
          // No modo backend, as colunas-alvo viram editaveis via onEditField
          // (mesmo com readOnly geral). As demais respeitam readOnly.
          // Colunas custom vem do mapper com `builtin === false` e key `f_*`;
          // `identifier` (read-only, sem editor) tem `builtin` indefinido e por
          // isso nao entra aqui — so habilitamos edicao backend para os 4
          // builtin conhecidos OU colunas explicitamente custom.
          // Colunas builtin read-only (ex.: timeSpent — Fase 3 / ADR-V2-057)
          // NUNCA sao editaveis: o flag `readOnly` da ColumnDef e respeitado
          // mesmo que a key entre por algum dos ramos acima (defense-in-depth).
          const backendEditable =
            !!onEditField &&
            c.readOnly !== true &&
            (BACKEND_EDITABLE_KEYS.has(c.key) || c.builtin === false);
          const cellReadOnly = backendEditable ? false : readOnly;
          const cellOnChange = backendEditable
            ? (v: FieldValue) => onEditField!(task.id, c.key, v)
            : noopFieldChange;

          const statusV3 =
            typeof task.fields[STATUS_V3_KEY] === "string"
              ? (task.fields[STATUS_V3_KEY] as string)
              : null;

          return (
            <FieldCell
              key={c.key}
              tdStyle={td}
              column={c}
              value={task.fields[c.key] ?? null}
              onChange={cellOnChange}
              readOnly={cellReadOnly}
              members={members}
              saving={saving}
              statusV3={statusV3}
            />
          );
        })}

        <td style={{ ...td, borderRight: 0 }} />
      </tr>

      {/* Sub-tabela de subtarefas — renderizada apenas no modo backend com projectId */}
      {projectId && subtaskColSpan !== undefined && (
        <SubtaskTableRow
          parentId={task.id}
          groupColor={groupColor ?? "#6b7280"}
          colSpan={subtaskColSpan}
          projectId={projectId}
          members={members}
          expanded={expanded}
        />
      )}
    </React.Fragment>
  );
}

/* ─── Sub-tabela de subtarefas (estilo Monday) ───────────────────────────── */

/**
 * Linha de expansão que embrulha a `SubtaskTable` num `<tr><td colSpan>`.
 *
 * Renderizada imediatamente após o `<tr>` do pai no `<tbody>` do grupo.
 * Quando `expanded` é `false`, retorna `null` sem altura residual.
 * O `<td>` com `colSpan` cobre toda a largura da tabela pai; dentro dele
 * renderiza uma sub-tabela independente com 4 colunas fixas (Subelemento |
 * Resp. | Status | Data), seguindo o padrão Monday.com.
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
 * **Layout:** Tabela `<table>` com colgroup próprio de 4 colunas fixas:
 * Subelemento (280px) | Resp. (130px) | Status (140px) | Data (110px).
 * Margem esquerda de 36px com borda colorida do grupo (conexão visual ao pai).
 *
 * **Conteúdo:** Renderiza cada subtarefa com `SubtaskTaskRow` (editável inline),
 * seguido de `AddSubtaskRow` para criar nova subtarefa.
 *
 * Sem scroll próprio — as 4 colunas (~660px total) cabem na largura mínima
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
                  <td colSpan={6} style={{ height: 34, padding: "4px 8px" }}>
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
 * Cabeçalho da sub-tabela de subtarefas — 4 colunas fixas reduzidas.
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
 * Linha de uma subtarefa na sub-tabela — renderiza e edita 4 colunas
 * (Nome | Resp. | Status | Data) com feedback conservador (spinner até
 * o backend confirmar).
 *
 * **Edição inline:**
 * - Nome: `EditableText` com `useUpdateTask` (DTO.titulo)
 * - Responsável: `FieldCell` com menu de membros
 * - Status: `FieldCell` com pills coloridas; VALIDATED trava a edição
 * - Data: `FieldCell` com date picker
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
    } = {};

    if (columnKey === "__nome") {
      if (typeof value !== "string" || !value.trim()) return;
      dto.titulo = value.trim();
    } else if (columnKey === "responsavel") {
      dto.assigneeId = typeof value === "string" && value ? value : null;
    } else if (columnKey === "dueDate") {
      dto.dueDate = typeof value === "string" && value ? value : null;
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
        colSpan={6}
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

/* ─── Linha "+ Adicionar tarefa" ─────────────────────────────────────────── */

export function AddTaskRow({
  colSpan,
  onAdd,
}: {
  colSpan: number;
  onAdd: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td
        colSpan={colSpan}
        style={{
          height: 38,
          borderBottom: "1px solid var(--border)",
          background: hover ? "var(--accent)" : "transparent",
          transition: "background .1s",
          padding: 0,
        }}
      >
        <button
          type="button"
          onClick={onAdd}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 14px",
            border: 0,
            background: "none",
            color: "var(--muted-foreground)",
            fontSize: 13,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          <Plus size={14} />
          Adicionar tarefa
        </button>
      </td>
    </tr>
  );
}

/* ─── Rodape de totais ───────────────────────────────────────────────────── */

export function FooterRow({
  columns,
  tasks,
  totalSp,
}: {
  columns: ColumnDef[];
  tasks: TaskModel[];
  totalSp: number;
}) {
  const td: React.CSSProperties = {
    height: 42,
    borderRight: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--foreground) 2%, transparent)",
    verticalAlign: "middle",
  };

  return (
    <tfoot>
      <tr>
        <td style={{ ...td, borderRight: 0 }} />
        {columns.map((c) => {
          // barra segmentada para status/dropdown
          if (c.type === "status" || c.type === "dropdown") {
            const opts = c.config?.options ?? [];
            const colors = tasks
              .map((t) => opts.find((o) => o.id === t.fields[c.key])?.color)
              .filter((x): x is string => Boolean(x));
            return (
              <td key={c.key} style={{ ...td, padding: 8 }}>
                <SegmentBar colors={colors} />
              </td>
            );
          }
          // total para a coluna numerica
          if (c.type === "number") {
            return (
              <td key={c.key} style={{ ...td, textAlign: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    lineHeight: 1.2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--foreground)",
                    }}
                  >
                    {totalSp} SP
                  </span>
                  <span
                    style={{ fontSize: 10, color: "var(--muted-foreground)" }}
                  >
                    Total
                  </span>
                </div>
              </td>
            );
          }
          return <td key={c.key} style={td} />;
        })}
        <td style={{ ...td, borderRight: 0 }} />
      </tr>
    </tfoot>
  );
}

// Exportar colWidth para uso em board.tsx (re-export de columns)
export { colWidth };

// Exportar tipos necessários para board.tsx
export type { SubtarefasMode };
