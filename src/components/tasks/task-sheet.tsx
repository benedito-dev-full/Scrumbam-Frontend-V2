"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ArrowUpRight } from "lucide-react";

import { CommentsPanel } from "@/components/comments/CommentsPanel";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TakeoverConfirmDialog } from "@/components/tasks/takeover-confirm-dialog";
import { TaskTimerPanel } from "@/components/tasks/task-timer-panel";
import { WorkSessionBadge } from "@/components/tasks/work-session-badge";
import { useWorkCollisionGuard } from "@/hooks/use-work-collision-guard";
import {
  INTENTION_TO_VISUAL,
  IcArrowLeft,
  IcCalendar,
  IcCheck,
  IcPlus,
  PrioridadeSelect,
  PropRow,
  StatusSelect,
  TeamSelect,
  VISUAL_TO_INTENTION,
  corData,
  diasUntilDate,
  formatarData,
  type StatusVisual,
} from "@/components/tasks/task-sheet-controls";
import { useUpdateTask, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { CommentTargetType } from "@/lib/types/comment";
import type { TaskPriority, TaskResponseDto } from "@/lib/types/api";

interface TaskSheetProps {
  task: TaskResponseDto | null;
  onClose: () => void;
}

interface SubtarefaItem {
  id: string;
  nome: string;
  concluida: boolean;
}

export function TaskSheet({ task, onClose }: TaskSheetProps) {
  const router = useRouter();
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const { run, dialogProps } = useWorkCollisionGuard();

  const [nome, setNome] = useState("");
  const [editandoNome, setEditandoNome] = useState(false);
  const [statusVisual, setStatusVisual] = useState<StatusVisual>("backlog");
  const [prioridade, setPrioridade] = useState<TaskPriority | null>(null);
  const [dataVencimento, setDataVencimento] = useState<string | null>(null);
  const [editandoData, setEditandoData] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [novaSubtarefa, setNovaSubtarefa] = useState("");
  const [subtarefas, setSubtarefas] = useState<SubtarefaItem[]>([]);
  const [visivel, setVisivel] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assigneeTeamId, setAssigneeTeamId] = useState<string | null>(null);

  const tituloInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      const id = setTimeout(() => {
        setNome(task.nome);
        setStatusVisual(INTENTION_TO_VISUAL[task.status] ?? "backlog");
        setPrioridade((task.priority as TaskPriority) ?? null);
        setDataVencimento(task.dueDate ?? null);
        setDescricao(task.descricao ?? "");
        setNovaSubtarefa("");
        setEditandoNome(false);
        setEditandoData(false);
        setSubtarefas([]);
        setAssigneeTeamId(task.assigneeTeamId ?? null);
      }, 0);
      requestAnimationFrame(() => setVisivel(true));
      return () => clearTimeout(id);
    } else {
      const hideId = setTimeout(() => setVisivel(false), 0);
      return () => clearTimeout(hideId);
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [task, onClose]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [descricao]);

  useEffect(() => {
    if (editandoNome) {
      tituloInputRef.current?.focus();
      tituloInputRef.current?.select();
    }
  }, [editandoNome]);

  const confirmarNome = useCallback(() => {
    setEditandoNome(false);
    if (!task) return;
    const novoNome = nome.trim() || task.nome;
    setNome(novoNome);
    if (novoNome !== task.nome) {
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { titulo: novoNome },
      });
    }
  }, [nome, task, updateTask]);

  const handleStatusChange = useCallback(
    (v: StatusVisual) => {
      if (!task) return;
      const intention = VISUAL_TO_INTENTION[v];
      // Otimista + mutação dentro do proceed: em Cancelar nada muda (nem o
      // visual). Guarda só ao ENTRAR em EXECUTING.
      const doIt = () => {
        setStatusVisual(v);
        updateStatus.mutate({
          id: task.id,
          status: intention,
          projectId: task.projectId,
        });
      };
      if (intention === "EXECUTING") run(task, doIt);
      else doIt();
    },
    [task, updateStatus, run],
  );

  const confirmarDescricao = useCallback(() => {
    if (!task) return;
    const original = task.descricao ?? "";
    // Só persiste se realmente mudou — mesmo mecanismo (updateTask.mutate)
    // usado por título, prioridade, dueDate e assignee.
    if (descricao !== original) {
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { descricao },
      });
    }
  }, [descricao, task, updateTask]);

  const handlePrioridadeChange = useCallback(
    (v: TaskPriority | null) => {
      if (!task) return;
      setPrioridade(v);
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { priority: v ?? undefined },
      });
    },
    [task, updateTask],
  );

  const handleDueDateChange = useCallback(
    (val: string | null) => {
      if (!task) return;
      setDataVencimento(val);
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { dueDate: val },
      });
    },
    [task, updateTask],
  );

  const handleAssigneeTeamChange = useCallback(
    (teamId: string | null) => {
      if (!task) return;
      // Otimista + mutação dentro do proceed: em Cancelar nada muda.
      run(task, () => {
        setAssigneeTeamId(teamId);
        updateTask.mutate({
          id: task.id,
          projectId: task.projectId,
          dto: { assigneeTeamId: teamId },
        });
      });
    },
    [task, updateTask, run],
  );

  const adicionarSubtarefa = useCallback(() => {
    const texto = novaSubtarefa.trim();
    if (!texto) return;
    setSubtarefas((prev) => [
      ...prev,
      { id: `sub-new-${Date.now()}`, nome: texto, concluida: false },
    ]);
    setNovaSubtarefa("");
  }, [novaSubtarefa]);

  const toggleSubtarefa = useCallback((id: string) => {
    setSubtarefas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, concluida: !s.concluida } : s)),
    );
  }, []);

  if (!task) return null;

  // Estado terminal (DONE/FAILED) = histórico. activeExecution zumbi não
  // bloqueia ações em tasks já encerradas.
  const isTerminalStatus = task.status === "DONE" || task.status === "FAILED";
  const lockDelete = Boolean(task.activeExecution) && !isTerminalStatus;

  const dataTexto = formatarData(dataVencimento);
  const dataCor = corData(dataVencimento);
  const diasRestantes = diasUntilDate(dataVencimento);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
          background: "rgba(0,0,0,0.45)",
          opacity: visivel ? 1 : 0,
          transition: "opacity .22s ease",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da tarefa: ${nome}`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          width: 560,
          maxWidth: "90vw",
          background: "var(--card)",
          borderLeft: "1px solid #26262d",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,.5)",
          transform: visivel ? "translateX(0)" : "translateX(100%)",
          transition: "transform .24s cubic-bezier(.22,.68,0,1.08)",
        }}
      >
        {/* ── Header fixo ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: 48,
            flexShrink: 0,
            borderBottom: "1px solid #1f1f27",
          }}
        >
          <button
            type="button"
            aria-label="Fechar painel"
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: 0,
              color: "var(--muted-foreground)",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.background = "none";
            }}
          >
            <IcArrowLeft size={15} />
            Fechar
          </button>

          <span
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              fontWeight: 500,
              letterSpacing: ".5px",
            }}
          >
            {task.identifier.toUpperCase()}
          </span>

          {task.projectId ? (
            <button
              type="button"
              aria-label="Ver o projeto desta tarefa"
              onClick={() => {
                onClose();
                router.push(`/lists/${task.projectId}`);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: 0,
                color: "var(--muted-foreground)",
                fontSize: 12,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 5,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
                e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
                e.currentTarget.style.background = "none";
              }}
            >
              Ver o projeto
              <ArrowUpRight size={15} />
            </button>
          ) : (
            <div
              aria-hidden="true"
              style={{ width: 30, height: 30, flexShrink: 0 }}
            />
          )}
        </div>

        {/* ── Body scrollável ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px" }}>
          {/* Título editável inline */}
          <div style={{ marginBottom: "calc(var(--section-gap) + 8px)" }}>
            {editandoNome ? (
              <input
                ref={tituloInputRef}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onBlur={confirmarNome}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmarNome();
                  if (e.key === "Escape") {
                    setNome(task.nome);
                    setEditandoNome(false);
                  }
                }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #7c5cff",
                  color: "var(--foreground)",
                  fontSize: 20,
                  fontWeight: 700,
                  outline: "none",
                  padding: "2px 0",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <h2
                role="button"
                tabIndex={0}
                onClick={() => setEditandoNome(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setEditandoNome(true);
                }}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  margin: 0,
                  cursor: "text",
                  lineHeight: 1.35,
                  padding: "2px 0",
                }}
                title="Clique para editar o título"
              >
                {nome}
              </h2>
            )}

            {/* Task #794: badge "em trabalho por Fulano · há X" — só aparece em
                EXECUTING com workSession ativa (o componente decide). */}
            <div style={{ marginTop: 10 }}>
              <WorkSessionBadge task={task} variant="full" />
            </div>
          </div>

          {/* Seção de Propriedades */}
          <section
            style={{
              background: "var(--card)",
              borderRadius: 10,
              border: "1px solid #26262d",
              padding: "12px 16px",
              marginBottom: "calc(var(--section-gap) + 8px)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                letterSpacing: ".7px",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}
            >
              Propriedades
            </p>

            <PropRow label="Status">
              <StatusSelect
                value={statusVisual}
                onChange={handleStatusChange}
              />
            </PropRow>

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <PropRow label="Prioridade">
              <PrioridadeSelect
                value={prioridade}
                onChange={handlePrioridadeChange}
              />
            </PropRow>

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <PropRow label="Time responsável">
              <TeamSelect
                value={assigneeTeamId}
                onChange={handleAssigneeTeamChange}
              />
            </PropRow>

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <PropRow label="Vencimento">
              {editandoData ? (
                <input
                  type="date"
                  autoFocus
                  defaultValue={dataVencimento ?? ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    handleDueDateChange(val);
                  }}
                  onBlur={() => setEditandoData(false)}
                  style={{
                    background: "var(--card)",
                    border: "1px solid #7c5cff",
                    borderRadius: 6,
                    color: "var(--foreground)",
                    fontSize: 12,
                    padding: "3px 8px",
                    outline: "none",
                    colorScheme: "dark",
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditandoData(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: dataCor,
                    fontSize: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.75";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <IcCalendar size={13} />
                  {dataTexto || (
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Sem data
                    </span>
                  )}
                  {diasRestantes !== null && diasRestantes < 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#fbbf24",
                        letterSpacing: ".5px",
                      }}
                    >
                      ATRASADO {Math.abs(diasRestantes)}D
                    </span>
                  )}
                  {diasRestantes === 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#7c5cff",
                        letterSpacing: ".5px",
                      }}
                    >
                      HOJE
                    </span>
                  )}
                </button>
              )}
            </PropRow>
          </section>

          {/* Seção Tempo de trabalho — timer manual por usuário (ADR-V2-057). */}
          <section style={{ marginBottom: "calc(var(--section-gap) + 12px)" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                margin: "0 0 8px",
              }}
            >
              Tempo de trabalho
            </p>
            <TaskTimerPanel
              taskId={task.id}
              projectId={task.projectId}
              timer={task.timer}
            />
          </section>

          {/* Seção Descrição */}
          <section style={{ marginBottom: "calc(var(--section-gap) + 12px)" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                margin: "0 0 8px",
              }}
            >
              Descrição
            </p>
            <textarea
              ref={textareaRef}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione uma descrição..."
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--card)",
                border: "1px solid #26262d",
                borderRadius: 8,
                color: "var(--foreground)",
                fontSize: 13,
                padding: "10px 12px",
                outline: "none",
                resize: "none",
                lineHeight: 1.6,
                fontFamily: "inherit",
                minHeight: 80,
                transition: "border-color .15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#7c5cff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                confirmarDescricao();
              }}
            />
          </section>

          {/* Seção Subtarefas */}
          <section style={{ marginBottom: "calc(var(--section-gap) + 12px)" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                margin: "0 0 8px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Subtarefas
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  background: "var(--accent)",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                {subtarefas.length}
              </span>
            </p>

            {subtarefas.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {subtarefas.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 10px",
                      borderRadius: 6,
                      background: "var(--card)",
                      border: "1px solid #22222a",
                      marginBottom: 4,
                    }}
                  >
                    <button
                      type="button"
                      aria-label={
                        s.concluida
                          ? "Desmarcar subtarefa"
                          : "Marcar subtarefa como concluída"
                      }
                      onClick={() => toggleSubtarefa(s.id)}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        flexShrink: 0,
                        background: s.concluida ? "#7c5cff" : "transparent",
                        border: `1.5px solid ${s.concluida ? "#7c5cff" : "#3d3d4a"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {s.concluida && <IcCheck size={10} />}
                    </button>
                    <span
                      style={{
                        fontSize: 13,
                        color: s.concluida
                          ? "var(--muted-foreground)"
                          : "var(--foreground)",
                        textDecoration: s.concluida ? "line-through" : "none",
                      }}
                    >
                      {s.nome}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--card)",
                border: "1px solid #26262d",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              <IcPlus size={13} />
              <input
                type="text"
                value={novaSubtarefa}
                onChange={(e) => setNovaSubtarefa(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") adicionarSubtarefa();
                }}
                placeholder="Adicionar subtarefa..."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--foreground)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </section>

          {/* Seção Atividade / Comentários */}
          <section>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                margin: "0 0 10px",
              }}
            >
              Atividade
            </p>
            <CommentsPanel
              targetType={CommentTargetType.TASK}
              targetId={task.id}
            />
          </section>

          {/* Ação destrutiva — excluir task */}
          <section
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid #1f1f27",
            }}
          >
            <button
              type="button"
              disabled={lockDelete}
              onClick={() => setDeleteOpen(true)}
              title={
                lockDelete
                  ? "Não é possível excluir enquanto há execução ativa"
                  : undefined
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.30)",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 600,
                cursor: lockDelete ? "not-allowed" : "pointer",
                opacity: lockDelete ? 0.5 : 1,
                transition: "background-color .15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!lockDelete) {
                  e.currentTarget.style.background = "rgba(239,68,68,0.20)";
                }
              }}
              onMouseLeave={(e) => {
                if (!lockDelete) {
                  e.currentTarget.style.background = "rgba(239,68,68,0.10)";
                }
              }}
            >
              <Trash2 size={14} />
              Excluir task
            </button>
          </section>
        </div>
      </div>

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        task={task}
        onSuccess={onClose}
      />
      {/* Task #795: guard de colisão (mover→EXECUTING / reatribuir time). */}
      <TakeoverConfirmDialog {...dialogProps} />
    </>
  );
}
