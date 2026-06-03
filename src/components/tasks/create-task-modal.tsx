"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Sparkles,
  CalendarDays,
  Flag,
  MoreHorizontal,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  GROUP_PILL_STYLE,
  PRIO_CONFIG,
  STATUS_CONFIG,
} from "@/components/lists/config";
import { useAllLists } from "@/hooks/use-projects";
import { useCreateTask } from "@/hooks/use-tasks";
import { CreateTaskDocumentTab } from "@/components/tasks/create-task-document-tab";
import { CreateTaskModalFooter } from "@/components/tasks/create-task-modal-footer";
import { CreateTaskListSelector } from "@/components/tasks/create-task-list-selector";
import { CreateTaskModalTabs } from "@/components/tasks/create-task-modal-tabs";
import {
  ALL_PRIO_VISUAL,
  ALL_STATUS_VISUAL,
  DropdownPortal,
  TASK_TYPE_OPTIONS,
  VISUAL_TO_BACKEND_PRIO,
  VISUAL_TO_INTENTION,
  dropdownItemStyle,
  dropdownStyle,
  itemHover,
  propChipStyle,
  type StatusVisual,
} from "@/components/tasks/create-task-modal-parts";
import type { TaskType } from "@/lib/types/api";

export type { StatusVisual } from "@/components/tasks/create-task-modal-parts";

/* ─── Mapeamentos StatusVisual ↔ V3Intention ─────────────────────────────── */

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Lista pre-selecionada. Quando omitido, o usuario obrigatoriamente
   * precisa escolher uma lista no seletor antes de criar.
   */
  listId?: string;
  defaultStatus?: StatusVisual;
}

/* ─── Componente principal ───────────────────────────────────────────────── */

export function CreateTaskModal({
  open,
  onClose,
  listId,
  defaultStatus,
}: CreateTaskModalProps) {
  const createTask = useCreateTask();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<StatusVisual>(
    defaultStatus ?? "backlog",
  );
  const [prioridade, setPrioridade] = useState<keyof typeof PRIO_CONFIG | null>(
    null,
  );
  const [tipo, setTipo] = useState<TaskType | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(
    listId ?? null,
  );
  const [listQuery, setListQuery] = useState("");
  const [dataVencimento, setDataVencimento] = useState<string>("");
  const [abaAtiva, setAbaAtiva] = useState<"tarefa" | "documento">("tarefa");
  const [openDropdown, setOpenDropdown] = useState<
    "status" | "prioridade" | "data" | "tipo" | "lista" | null
  >(null);
  const [descAberta, setDescAberta] = useState(false);
  const [docNome, setDocNome] = useState("");
  const [docPrivado, setDocPrivado] = useState(false);

  const { lists: allLists, isLoading: listsLoading } = useAllLists();

  const nomeRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const dataBtnRef = useRef<HTMLButtonElement>(null);
  const prioridadeBtnRef = useRef<HTMLButtonElement>(null);
  const tipoBtnRef = useRef<HTMLButtonElement>(null);
  const listaBtnRef = useRef<HTMLButtonElement>(null);

  const statusPortalRef = useRef<HTMLDivElement>(null);
  const dataPortalRef = useRef<HTMLDivElement>(null);
  const tipoPortalRef = useRef<HTMLDivElement>(null);
  const listaPortalRef = useRef<HTMLDivElement>(null);
  const prioridadePortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAbaAtiva("tarefa");
    setNome("");
    setDescricao("");
    setStatus(defaultStatus ?? "backlog");
    setPrioridade(null);
    setTipo(null);
    setSelectedListId(listId ?? null);
    setListQuery("");
    setDataVencimento("");
    setOpenDropdown(null);
    setDescAberta(false);
    setDocNome("");
    setDocPrivado(false);
    setTimeout(() => nomeRef.current?.focus(), 50);
  }, [open, defaultStatus, listId]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!openDropdown) return;
    const portalRefs = [
      statusPortalRef,
      dataPortalRef,
      prioridadePortalRef,
      tipoPortalRef,
      listaPortalRef,
    ];
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideModal = modalRef.current?.contains(target);
      const insidePortal = portalRefs.some((r) => r.current?.contains(target));
      if (!insideModal && !insidePortal) setOpenDropdown(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdown]);

  if (!open) return null;

  function handleCriar() {
    if (!nome.trim()) {
      nomeRef.current?.focus();
      return;
    }
    if (!selectedListId) {
      toast.error("Selecione uma lista antes de criar a tarefa.");
      setOpenDropdown("lista");
      return;
    }
    const intention = VISUAL_TO_INTENTION[status];
    const backendPrio = prioridade
      ? VISUAL_TO_BACKEND_PRIO[prioridade]
      : undefined;
    createTask.mutate(
      {
        titulo: nome.trim(),
        idProject: selectedListId,
        priority: backendPrio,
        tipo: tipo ?? undefined,
        dueDate: dataVencimento || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Tarefa criada!");
          onClose();
        },
        onError: () => {
          toast.error("Erro ao criar tarefa. Tente novamente.");
        },
      },
    );
    /* Fecha otimisticamente — o invalidateQueries no hook atualiza a lista */
    void intention;
  }

  const statusCfg = STATUS_CONFIG[status];
  const pillStyle = GROUP_PILL_STYLE[status];
  const prioCfg = prioridade ? PRIO_CONFIG[prioridade] : null;
  const tipoCfg = tipo ? TASK_TYPE_OPTIONS.find((t) => t.value === tipo) : null;
  const selectedList = allLists.find((l) => l.id === selectedListId) ?? null;

  const filteredLists = listQuery.trim()
    ? allLists.filter((l) => {
        const q = listQuery.trim().toLowerCase();
        return (
          l.nome.toLowerCase().includes(q) ||
          l.spaceName.toLowerCase().includes(q) ||
          (l.folderName?.toLowerCase().includes(q) ?? false)
        );
      })
    : allLists;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#111111",
          borderRadius: 12,
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <CreateTaskModalTabs
          activeTab={abaAtiva}
          onActiveTabChange={setAbaAtiva}
          onClose={onClose}
        />
        {/* ── Corpo: aba Tarefa ── */}
        {abaAtiva === "tarefa" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
              <CreateTaskListSelector
                selectedList={selectedList}
                selectedListId={selectedListId}
                filteredLists={filteredLists}
                listQuery={listQuery}
                listsLoading={listsLoading}
                open={openDropdown === "lista"}
                triggerRef={listaBtnRef}
                portalRef={listaPortalRef}
                onOpenChange={(nextOpen) =>
                  setOpenDropdown(nextOpen ? "lista" : null)
                }
                onListQueryChange={setListQuery}
                onSelectList={(nextListId) => {
                  setSelectedListId(nextListId);
                  setOpenDropdown(null);
                  setListQuery("");
                }}
              />
              {/* Título */}
              <textarea
                ref={nomeRef}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Tarefa Nome"
                rows={1}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: nome ? "#e4e4e4" : "#4a4a5a",
                  fontSize: 20,
                  fontWeight: 500,
                  resize: "none",
                  lineHeight: 1.3,
                  fontFamily: "inherit",
                  padding: 0,
                  marginBottom: "calc(var(--section-gap) - 2px)",
                  overflow: "hidden",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCriar();
                  }
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
              />

              {/* Descrição */}
              {!descAberta ? (
                <button
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    cursor: "text",
                    color: "#6b6b74",
                    fontSize: 13,
                    padding: "4px 0",
                    marginBottom: 4,
                    width: "100%",
                    textAlign: "left",
                  }}
                  onClick={() => setDescAberta(true)}
                >
                  <FileText size={14} style={{ flexShrink: 0 }} />
                  <span>Adicionar descrição</span>
                </button>
              ) : (
                <textarea
                  autoFocus
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Adicionar descrição..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--border)",
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    outline: "none",
                    color: "#c4c4c4",
                    fontSize: 13,
                    resize: "none",
                    lineHeight: 1.55,
                    fontFamily: "inherit",
                    padding: "10px 12px",
                    minHeight: 72,
                    marginBottom: 8,
                  }}
                />
              )}

              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b6b74",
                  fontSize: 13,
                  padding: "4px 0",
                  marginBottom: "calc(var(--section-gap) + 2px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#a1a1aa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#6b6b74";
                }}
              >
                <Sparkles size={14} />
                Escrever com IA
              </button>
            </div>

            {/* ── Chips de propriedades (área fixa) ── */}
            <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: "var(--section-gap)",
                  position: "relative",
                }}
              >
                {/* Status */}
                <div>
                  <button
                    ref={statusBtnRef}
                    type="button"
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === "status" ? null : "status",
                      )
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 5,
                      border: "none",
                      cursor: "pointer",
                      background: pillStyle.bg,
                      color: pillStyle.color,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      transition: "opacity 120ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.85";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {statusCfg.label}
                  </button>
                  {openDropdown === "status" && (
                    <DropdownPortal
                      triggerRef={statusBtnRef}
                      portalRef={statusPortalRef}
                    >
                      <div style={dropdownStyle}>
                        {ALL_STATUS_VISUAL.map((s) => {
                          const cfg = STATUS_CONFIG[s];
                          const pill = GROUP_PILL_STYLE[s];
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setStatus(s);
                                setOpenDropdown(null);
                              }}
                              data-selected={status === s ? "1" : "0"}
                              style={{
                                ...dropdownItemStyle,
                                background:
                                  status === s ? "var(--border)" : "none",
                              }}
                              {...itemHover}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background:
                                    pill.bg === "#2a2a31" ? "#71717a" : pill.bg,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </DropdownPortal>
                  )}
                </div>

                {/* Data limite */}
                <div>
                  <button
                    ref={dataBtnRef}
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === "data" ? null : "data")
                    }
                    style={propChipStyle}
                  >
                    <CalendarDays size={13} />
                    {dataVencimento
                      ? new Date(
                          dataVencimento + "T12:00:00",
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "Data limite"}
                  </button>
                  {openDropdown === "data" && (
                    <DropdownPortal
                      triggerRef={dataBtnRef}
                      portalRef={dataPortalRef}
                    >
                      <div
                        style={{
                          ...dropdownStyle,
                          padding: "10px 12px",
                          minWidth: "unset",
                        }}
                      >
                        <input
                          type="date"
                          value={dataVencimento}
                          onChange={(e) => {
                            setDataVencimento(e.target.value);
                            setOpenDropdown(null);
                          }}
                          style={{
                            background: "var(--border)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            color: "#e4e4e4",
                            fontSize: 13,
                            padding: "6px 10px",
                            outline: "none",
                            colorScheme: "dark",
                          }}
                          autoFocus
                        />
                      </div>
                    </DropdownPortal>
                  )}
                </div>

                {/* Prioridade */}
                <div>
                  <button
                    ref={prioridadeBtnRef}
                    type="button"
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === "prioridade" ? null : "prioridade",
                      )
                    }
                    style={{
                      ...propChipStyle,
                      color: prioCfg ? prioCfg.color : "#6b6b74",
                    }}
                  >
                    <Flag size={13} />
                    {prioCfg ? prioCfg.label : "Prioridade"}
                  </button>
                  {openDropdown === "prioridade" && (
                    <DropdownPortal
                      triggerRef={prioridadeBtnRef}
                      portalRef={prioridadePortalRef}
                    >
                      <div style={dropdownStyle}>
                        <button
                          type="button"
                          onClick={() => {
                            setPrioridade(null);
                            setOpenDropdown(null);
                          }}
                          style={{ ...dropdownItemStyle, color: "#6b6b74" }}
                          {...itemHover}
                        >
                          Sem prioridade
                        </button>
                        {ALL_PRIO_VISUAL.map((p) => {
                          const cfg = PRIO_CONFIG[p];
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setPrioridade(p);
                                setOpenDropdown(null);
                              }}
                              data-selected={prioridade === p ? "1" : "0"}
                              style={{
                                ...dropdownItemStyle,
                                color: cfg.color,
                                background:
                                  prioridade === p ? "var(--border)" : "none",
                              }}
                              {...itemHover}
                            >
                              <Flag size={12} />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </DropdownPortal>
                  )}
                </div>

                {/* Tipo de tarefa (Feature/Bug/Melhoria/Revisao/Doc) */}
                <div>
                  <button
                    ref={tipoBtnRef}
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === "tipo" ? null : "tipo")
                    }
                    style={{
                      ...propChipStyle,
                      color: tipoCfg ? tipoCfg.color : "#6b6b74",
                    }}
                  >
                    {tipoCfg ? (
                      <tipoCfg.Icon size={13} />
                    ) : (
                      <HelpCircle size={13} />
                    )}
                    {tipoCfg ? tipoCfg.label : "Tipo"}
                  </button>
                  {openDropdown === "tipo" && (
                    <DropdownPortal
                      triggerRef={tipoBtnRef}
                      portalRef={tipoPortalRef}
                    >
                      <div style={dropdownStyle}>
                        <button
                          type="button"
                          onClick={() => {
                            setTipo(null);
                            setOpenDropdown(null);
                          }}
                          style={{ ...dropdownItemStyle, color: "#6b6b74" }}
                          {...itemHover}
                        >
                          Sem tipo
                        </button>
                        {TASK_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setTipo(opt.value);
                              setOpenDropdown(null);
                            }}
                            data-selected={tipo === opt.value ? "1" : "0"}
                            style={{
                              ...dropdownItemStyle,
                              color: opt.color,
                              background:
                                tipo === opt.value ? "var(--border)" : "none",
                            }}
                            {...itemHover}
                          >
                            <opt.Icon size={12} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </DropdownPortal>
                  )}
                </div>

                {/* Mais */}
                <button
                  type="button"
                  style={{ ...propChipStyle, padding: "0 8px" }}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "documento" && (
          <CreateTaskDocumentTab
            docNome={docNome}
            onDocNomeChange={setDocNome}
          />
        )}
        <CreateTaskModalFooter
          activeTab={abaAtiva}
          isCreating={createTask.isPending}
          docPrivado={docPrivado}
          onDocPrivadoChange={setDocPrivado}
          onCreateTask={handleCriar}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
