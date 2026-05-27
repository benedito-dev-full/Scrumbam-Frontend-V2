'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, FileText, Sparkles, CalendarDays, Flag,
  MoreHorizontal, ChevronDown, Search, FolderTree,
  Sparkle, Bug, Wrench, BookOpen, GitPullRequest, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { GROUP_PILL_STYLE, PRIO_CONFIG, STATUS_CONFIG } from '@/components/lists/config';
import { useAllLists, type ListWithPath } from '@/hooks/use-projects';
import { useCreateTask } from '@/hooks/use-tasks';
import type { TaskPriority, TaskType, V3Intention } from '@/lib/types/api';

/* ─── Mapeamentos StatusVisual ↔ V3Intention ─────────────────────────────── */

type StatusVisual = 'backlog' | 'pronto' | 'em-progresso' | 'concluido' | 'falhou' | 'atrasado';

const VISUAL_TO_INTENTION: Record<StatusVisual, V3Intention> = {
  backlog:        'INBOX',
  pronto:         'READY',
  'em-progresso': 'EXECUTING',
  concluido:      'DONE',
  falhou:         'FAILED',
  atrasado:       'INBOX',
};

const PRIO_BACKEND_TO_VISUAL: Record<TaskPriority, keyof typeof PRIO_CONFIG> = {
  URGENT: 'urgente',
  HIGH:   'alta',
  MEDIUM: 'media',
  LOW:    'baixa',
};

const VISUAL_TO_BACKEND_PRIO: Record<keyof typeof PRIO_CONFIG, TaskPriority> = {
  urgente: 'URGENT',
  alta:    'HIGH',
  media:   'MEDIUM',
  baixa:   'LOW',
};

const ALL_STATUS_VISUAL: StatusVisual[] = ['backlog', 'pronto', 'em-progresso', 'concluido', 'falhou'];
const ALL_PRIO_VISUAL = Object.keys(PRIO_CONFIG) as (keyof typeof PRIO_CONFIG)[];

/**
 * Tipos canonicos de DTask espelhando o enum do backend (TaskType em
 * `lib/types/api.ts`). Cada entry define icone, cor e label visivel.
 *
 * Ordem definida deliberadamente — Feature primeiro por ser o caso mais
 * comum em backlog de produto.
 */
const TASK_TYPE_OPTIONS: Array<{
  value: TaskType;
  label: string;
  Icon: typeof Sparkle;
  color: string;
}> = [
  { value: 'FEATURE',     label: 'Feature',    Icon: Sparkle,          color: '#a78bfa' },
  { value: 'BUG',         label: 'Bug',        Icon: Bug,              color: '#f87171' },
  { value: 'IMPROVEMENT', label: 'Melhoria',   Icon: Wrench,           color: '#60a5fa' },
  { value: 'REVIEW',      label: 'Revisao',    Icon: GitPullRequest,   color: '#34d399' },
  { value: 'EXPLAIN',     label: 'Doc',        Icon: BookOpen,         color: '#fbbf24' },
];

/* ─── Portal de dropdown ─────────────────────────────────────────────────── */

function DropdownPortal({
  triggerRef,
  portalRef,
  children,
}: {
  triggerRef: React.RefObject<HTMLElement | null>;
  portalRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [triggerRef]);

  return createPortal(
    <div ref={portalRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}>
      {children}
    </div>,
    document.body,
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

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

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<StatusVisual>(defaultStatus ?? 'backlog');
  const [prioridade, setPrioridade] = useState<keyof typeof PRIO_CONFIG | null>(null);
  const [tipo, setTipo] = useState<TaskType | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(listId ?? null);
  const [listQuery, setListQuery] = useState('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [abaAtiva, setAbaAtiva] = useState<'tarefa' | 'documento'>('tarefa');
  const [openDropdown, setOpenDropdown] = useState<'status' | 'prioridade' | 'data' | 'tipo' | 'lista' | null>(null);
  const [descAberta, setDescAberta] = useState(false);
  const [docNome, setDocNome] = useState('');
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
    setAbaAtiva('tarefa');
    setNome('');
    setDescricao('');
    setStatus(defaultStatus ?? 'backlog');
    setPrioridade(null);
    setTipo(null);
    setSelectedListId(listId ?? null);
    setListQuery('');
    setDataVencimento('');
    setOpenDropdown(null);
    setDescAberta(false);
    setDocNome('');
    setDocPrivado(false);
    setTimeout(() => nomeRef.current?.focus(), 50);
  }, [open, defaultStatus, listId]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);

  if (!open) return null;

  function handleCriar() {
    if (!nome.trim()) {
      nomeRef.current?.focus();
      return;
    }
    if (!selectedListId) {
      toast.error('Selecione uma lista antes de criar a tarefa.');
      setOpenDropdown('lista');
      return;
    }
    const intention = VISUAL_TO_INTENTION[status];
    const backendPrio = prioridade ? VISUAL_TO_BACKEND_PRIO[prioridade] : undefined;
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
          toast.success('Tarefa criada!');
          onClose();
        },
        onError: () => {
          toast.error('Erro ao criar tarefa. Tente novamente.');
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
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%', maxWidth: 560,
          background: '#111111',
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh', overflow: 'hidden',
          position: 'relative',
        }}
      >

        {/* ── Tabs topo ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          background: '#111111',
          flexShrink: 0,
          gap: 2,
        }}>
          {([
            ['tarefa', 'Tarefa'],
            ['documento', 'Documento'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAbaAtiva(id)}
              style={{
                height: 42, padding: '0 12px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: abaAtiva === id ? 600 : 400,
                color: abaAtiva === id ? '#e4e4e4' : '#6b6b74',
                borderBottom: abaAtiva === id ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'color 120ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (abaAtiva !== id) e.currentTarget.style.color = '#a1a1aa'; }}
              onMouseLeave={(e) => { if (abaAtiva !== id) e.currentTarget.style.color = '#6b6b74'; }}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              marginLeft: 'auto',
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: '1px solid var(--border)',
              background: 'none', cursor: 'pointer', color: '#6b6b74',
              transition: 'background 120ms, color 120ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a2f'; e.currentTarget.style.color = '#c4c4c4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b6b74'; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Corpo: aba Tarefa ── */}
        {abaAtiva === 'tarefa' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

              {/* Seletor de Lista (substitui o antigo chip "Tarefa") */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, position: 'relative' }}>
                <button
                  ref={listaBtnRef}
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'lista' ? null : 'lista')}
                  style={{ ...chipStyle, maxWidth: 360 }}
                  title={selectedList ? `${selectedList.spaceName}${selectedList.folderName ? ' › ' + selectedList.folderName : ''} › ${selectedList.nome}` : 'Selecionar lista'}
                >
                  <FolderTree size={12} style={{ color: '#7c6ff7', flexShrink: 0 }} />
                  <span style={{
                    fontSize: 12,
                    color: selectedList ? '#c4c4cc' : '#6b6b74',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedList ? selectedList.nome : 'Selecionar lista…'}
                  </span>
                  <ChevronDown size={11} color="var(--muted-foreground)" style={{ flexShrink: 0 }} />
                </button>

                {openDropdown === 'lista' && (
                  <DropdownPortal triggerRef={listaBtnRef} portalRef={listaPortalRef}>
                    <div style={{ ...dropdownStyle, minWidth: 320, padding: 0, overflow: 'hidden' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 10px', borderBottom: '1px solid var(--border)',
                      }}>
                        <Search size={12} style={{ color: '#6b6b74', flexShrink: 0 }} />
                        <input
                          autoFocus
                          type="search"
                          value={listQuery}
                          onChange={(e) => setListQuery(e.target.value)}
                          placeholder="Buscar lista…"
                          style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: '#e4e4e4', fontSize: 12,
                          }}
                        />
                      </div>
                      <div style={{ maxHeight: 240, overflowY: 'auto', padding: 4 }}>
                        {listsLoading ? (
                          <div style={{ padding: '12px 10px', fontSize: 12, color: '#6b6b74', textAlign: 'center' }}>
                            Carregando listas…
                          </div>
                        ) : filteredLists.length === 0 ? (
                          <div style={{ padding: '12px 10px', fontSize: 12, color: '#6b6b74', textAlign: 'center' }}>
                            Nenhuma lista encontrada.
                          </div>
                        ) : (
                          filteredLists.map((l: ListWithPath) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                setSelectedListId(l.id);
                                setOpenDropdown(null);
                                setListQuery('');
                              }}
                              data-selected={selectedListId === l.id ? '1' : '0'}
                              style={{
                                ...dropdownItemStyle,
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 2,
                                background: selectedListId === l.id ? 'var(--border)' : 'none',
                              }}
                              {...itemHover}
                            >
                              <span style={{ fontSize: 13, color: '#e4e4e4', lineHeight: 1.2 }}>
                                {l.nome}
                              </span>
                              <span style={{ fontSize: 11, color: '#6b6b74', lineHeight: 1.2 }}>
                                {l.spaceName}
                                {l.folderName ? ` › ${l.folderName}` : ''}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </DropdownPortal>
                )}
              </div>

              {/* Título */}
              <textarea
                ref={nomeRef}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Tarefa Nome"
                rows={1}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'none', border: 'none', outline: 'none',
                  color: nome ? '#e4e4e4' : '#4a4a5a',
                  fontSize: 20, fontWeight: 500,
                  resize: 'none', lineHeight: 1.3,
                  fontFamily: 'inherit',
                  padding: 0, marginBottom: 14,
                  overflow: 'hidden',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCriar(); }
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                }}
              />

              {/* Descrição */}
              {!descAberta ? (
                <button
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: 'none', cursor: 'text',
                    color: '#6b6b74', fontSize: 13, padding: '4px 0', marginBottom: 4,
                    width: '100%', textAlign: 'left',
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
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--border)',
                    border: '1px solid var(--border)',
                    borderRadius: 7, outline: 'none',
                    color: '#c4c4c4', fontSize: 13,
                    resize: 'none', lineHeight: 1.55,
                    fontFamily: 'inherit', padding: '10px 12px',
                    minHeight: 72, marginBottom: 8,
                  }}
                />
              )}

              <button
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6b6b74', fontSize: 13, padding: '4px 0', marginBottom: 18,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6b74'; }}
              >
                <Sparkles size={14} />
                Escrever com IA
              </button>

            </div>

            {/* ── Chips de propriedades (área fixa) ── */}
            <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, position: 'relative' }}>

                {/* Status */}
                <div>
                  <button
                    ref={statusBtnRef}
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 28, padding: '0 10px', borderRadius: 5,
                      border: 'none', cursor: 'pointer',
                      background: pillStyle.bg,
                      color: pillStyle.color,
                      fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      transition: 'opacity 120ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    {statusCfg.label}
                  </button>
                  {openDropdown === 'status' && (
                    <DropdownPortal triggerRef={statusBtnRef} portalRef={statusPortalRef}>
                      <div style={dropdownStyle}>
                        {ALL_STATUS_VISUAL.map((s) => {
                          const cfg = STATUS_CONFIG[s];
                          const pill = GROUP_PILL_STYLE[s];
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setStatus(s); setOpenDropdown(null); }}
                              data-selected={status === s ? '1' : '0'}
                              style={{
                                ...dropdownItemStyle,
                                background: status === s ? 'var(--border)' : 'none',
                              }}
                              {...itemHover}
                            >
                              <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: pill.bg === '#2a2a31' ? '#71717a' : pill.bg,
                                display: 'inline-block', flexShrink: 0,
                              }} />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </DropdownPortal>
                  )}
                </div>

                {/* Data de vencimento */}
                <div>
                  <button
                    ref={dataBtnRef}
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'data' ? null : 'data')}
                    style={propChipStyle}
                  >
                    <CalendarDays size={13} />
                    {dataVencimento
                      ? new Date(dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                      : 'Data de vencimento'}
                  </button>
                  {openDropdown === 'data' && (
                    <DropdownPortal triggerRef={dataBtnRef} portalRef={dataPortalRef}>
                      <div style={{ ...dropdownStyle, padding: '10px 12px', minWidth: 'unset' }}>
                        <input
                          type="date"
                          value={dataVencimento}
                          onChange={(e) => { setDataVencimento(e.target.value); setOpenDropdown(null); }}
                          style={{
                            background: 'var(--border)',
                            border: '1px solid var(--border)',
                            borderRadius: 6, color: '#e4e4e4',
                            fontSize: 13, padding: '6px 10px',
                            outline: 'none', colorScheme: 'dark',
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
                    onClick={() => setOpenDropdown(openDropdown === 'prioridade' ? null : 'prioridade')}
                    style={{
                      ...propChipStyle,
                      color: prioCfg ? prioCfg.color : '#6b6b74',
                    }}
                  >
                    <Flag size={13} />
                    {prioCfg ? prioCfg.label : 'Prioridade'}
                  </button>
                  {openDropdown === 'prioridade' && (
                    <DropdownPortal triggerRef={prioridadeBtnRef} portalRef={prioridadePortalRef}>
                      <div style={dropdownStyle}>
                        <button
                          type="button"
                          onClick={() => { setPrioridade(null); setOpenDropdown(null); }}
                          style={{ ...dropdownItemStyle, color: '#6b6b74' }}
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
                              onClick={() => { setPrioridade(p); setOpenDropdown(null); }}
                              data-selected={prioridade === p ? '1' : '0'}
                              style={{
                                ...dropdownItemStyle,
                                color: cfg.color,
                                background: prioridade === p ? 'var(--border)' : 'none',
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
                    onClick={() => setOpenDropdown(openDropdown === 'tipo' ? null : 'tipo')}
                    style={{
                      ...propChipStyle,
                      color: tipoCfg ? tipoCfg.color : '#6b6b74',
                    }}
                  >
                    {tipoCfg ? (
                      <tipoCfg.Icon size={13} />
                    ) : (
                      <HelpCircle size={13} />
                    )}
                    {tipoCfg ? tipoCfg.label : 'Tipo'}
                  </button>
                  {openDropdown === 'tipo' && (
                    <DropdownPortal triggerRef={tipoBtnRef} portalRef={tipoPortalRef}>
                      <div style={dropdownStyle}>
                        <button
                          type="button"
                          onClick={() => { setTipo(null); setOpenDropdown(null); }}
                          style={{ ...dropdownItemStyle, color: '#6b6b74' }}
                          {...itemHover}
                        >
                          Sem tipo
                        </button>
                        {TASK_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setTipo(opt.value); setOpenDropdown(null); }}
                            data-selected={tipo === opt.value ? '1' : '0'}
                            style={{
                              ...dropdownItemStyle,
                              color: opt.color,
                              background: tipo === opt.value ? 'var(--border)' : 'none',
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
                <button type="button" style={{ ...propChipStyle, padding: '0 8px' }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Corpo: aba Documento ── */}
        {abaAtiva === 'documento' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
            <div style={{ marginBottom: 20 }}>
              <button type="button" style={chipStyle}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>☰</span>
                <span style={{ fontSize: 12, color: '#a1a1aa' }}>Meus documentos</span>
                <ChevronDown size={11} color="var(--muted-foreground)" />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={docNome}
              onChange={(e) => setDocNome(e.target.value)}
              placeholder="Dê um nome a este documento..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'none', border: 'none', outline: 'none',
                color: docNome ? '#e4e4e4' : '#4a4a54',
                fontSize: 18, fontWeight: 500,
                fontFamily: 'inherit',
                padding: 0, marginBottom: 20,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
              <button type="button" style={docActionStyle} {...docItemHover}>
                <FileText size={15} style={{ color: '#71717a', flexShrink: 0 }} />
                <span>Comece a escrever</span>
              </button>
              <button type="button" style={docActionStyle} {...docItemHover}>
                <Sparkles size={15} style={{ color: '#a78bfa', flexShrink: 0 }} />
                <span>Escrever com IA</span>
              </button>
            </div>

          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          background: '#111111', flexShrink: 0,
        }}>
          {abaAtiva === 'tarefa' ? (
            <>
              <div />
              <div style={{ display: 'flex', alignItems: 'stretch', height: 32, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                <button
                  type="button"
                  onClick={handleCriar}
                  disabled={createTask.isPending}
                  style={{
                    padding: '0 16px',
                    background: createTask.isPending ? '#c4c4c4' : '#f0f0f0',
                    border: 'none', cursor: createTask.isPending ? 'not-allowed' : 'pointer',
                    color: '#111', fontSize: 13, fontWeight: 600,
                    letterSpacing: '-0.01em',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => { if (!createTask.isPending) e.currentTarget.style.background = '#fff'; }}
                  onMouseLeave={(e) => { if (!createTask.isPending) e.currentTarget.style.background = '#f0f0f0'; }}
                >
                  {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
                </button>
                <div style={{ width: 1, background: 'rgba(0,0,0,0.2)' }} />
                <button
                  type="button"
                  style={{
                    width: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f0f0f0', border: 'none', cursor: 'pointer', color: '#555',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f0f0'; }}
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </>
          ) : abaAtiva === 'documento' ? (
            <>
              <button
                type="button"
                onClick={() => setDocPrivado((p) => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#a1a1aa', fontSize: 13,
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  width: 34, height: 18, borderRadius: 9,
                  background: docPrivado ? '#7c3aed' : '#3a3a42',
                  padding: '0 2px',
                  transition: 'background 150ms',
                  flexShrink: 0,
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#fff',
                    transform: docPrivado ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'transform 150ms',
                  }} />
                </span>
                Privado
              </button>
              <button
                type="button"
                onClick={() => { toast.success('Documento criado!'); onClose(); }}
                style={{
                  height: 34, padding: '0 20px', borderRadius: 7,
                  background: '#e4e4e4', border: 'none', cursor: 'pointer',
                  color: '#111', fontSize: 13, fontWeight: 600,
                  transition: 'background 120ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#e4e4e4'; }}
              >
                Criar documento
              </button>
            </>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Estilos compartilhados ─────────────────────────────────────────────── */

const docActionStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  height: 34, padding: '0 8px', borderRadius: 6,
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#a1a1aa', fontSize: 13, textAlign: 'left',
  transition: 'background 100ms, color 100ms',
};

const docItemHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--border)';
    e.currentTarget.style.color = '#d4d4d4';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'none';
    e.currentTarget.style.color = '#a1a1aa';
  },
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 28, padding: '0 10px', borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--border)',
  cursor: 'pointer', color: '#c4c4cc', fontSize: 12,
  transition: 'background 120ms',
};

const propChipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 28, padding: '0 11px', borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--border)', cursor: 'pointer',
  color: '#6b6b74', fontSize: 12,
  transition: 'background 120ms, color 120ms, border-color 120ms',
};

const dropdownStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid var(--border)',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  minWidth: 160, padding: '4px',
  display: 'flex', flexDirection: 'column', gap: 1,
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '7px 10px', borderRadius: 5,
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#c4c4c4', fontSize: 13, width: '100%', textAlign: 'left',
  transition: 'background 100ms',
};

const itemHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--border)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = e.currentTarget.dataset.selected === '1'
      ? 'var(--border)'
      : 'none';
  },
};

