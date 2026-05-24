'use client';

// Modal de criação de task — layout inspirado no ClickUp:
// título grande editável + chips de propriedades em linha + footer com ações.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, FileText, Sparkles, User, CalendarDays, Flag,
  Tag, MoreHorizontal, Paperclip, Bell, ChevronDown,
  Table2, Columns3, List,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// ─── Stores / Mocks ───────────────────────────────────────────────────────────
import { useTasksStore } from '@/lib/stores/tasks';
import { useEntidadesStore } from '@/lib/stores/entidades';
import { mockMembros } from '@/lib/mocks/entidades';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { StatusTarefa, Prioridade } from '@/lib/types/tarefa';
import { STATUS_META, PRIORIDADE_META } from '@/lib/types/tarefa';
import { GROUP_PILL_STYLE, PRIO_CONFIG } from '@/components/lists/config';

// ─── Portal de dropdown (escapa de overflow:hidden do modal) ─────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────
interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  espacoId: string;
  defaultStatus?: StatusTarefa;
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Modal de criação de task no estilo ClickUp.
 *
 * Layout: tabs no topo, título grande editável, descrição inline,
 * chips de propriedades (status, responsável, data, prioridade, etiquetas),
 * footer com modelos + criar tarefa.
 */
export function CreateTaskModal({
  open,
  onClose,
  espacoId,
  defaultStatus,
}: CreateTaskModalProps) {
  const addTask = useTasksStore((s) => s.addTask);
  const addDoc = useEntidadesStore((s) => s.addDoc);
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<StatusTarefa>(defaultStatus ?? 'pendente');
  const [prioridade, setPrioridade] = useState<Prioridade | null>(null);
  const [responsavelId, setResponsavelId] = useState<string | null>(null);
  const [dataVencimento, setDataVencimento] = useState<string>('');

  const [abaAtiva, setAbaAtiva] = useState<'tarefa' | 'documento' | 'lembrete' | 'quadro' | 'paineis'>('tarefa');

  // dropdowns abertos
  const [openDropdown, setOpenDropdown] = useState<'status' | 'prioridade' | 'responsavel' | 'data' | null>(null);
  const [descAberta, setDescAberta] = useState(false);

  // aba documento
  const [docNome, setDocNome] = useState('');
  const [docPrivado, setDocPrivado] = useState(false);

  const nomeRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const responsavelBtnRef = useRef<HTMLButtonElement>(null);
  const dataBtnRef = useRef<HTMLButtonElement>(null);
  const prioridadeBtnRef = useRef<HTMLButtonElement>(null);

  const statusPortalRef = useRef<HTMLDivElement>(null);
  const responsavelPortalRef = useRef<HTMLDivElement>(null);
  const dataPortalRef = useRef<HTMLDivElement>(null);
  const prioridadePortalRef = useRef<HTMLDivElement>(null);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    setAbaAtiva('tarefa');
    setNome('');
    setDescricao('');
    setStatus(defaultStatus ?? 'pendente');
    setPrioridade(null);
    setResponsavelId(null);
    setDataVencimento('');
    setOpenDropdown(null);
    setDescAberta(false);
    setDocNome('');
    setDocPrivado(false);
    setTimeout(() => nomeRef.current?.focus(), 50);
  }, [open, defaultStatus]);

  // Fechar com Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Fechar dropdown ao clicar fora (exclui portais que estão no body)
  useEffect(() => {
    if (!openDropdown) return;
    const portalRefs = [statusPortalRef, responsavelPortalRef, dataPortalRef, prioridadePortalRef];
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
    addTask({
      id: crypto.randomUUID(),
      espacoId,
      nome: nome.trim(),
      status,
      prioridade,
      responsavelId,
      dataVencimento: dataVencimento || null,
      subtarefas: 0,
    });
    toast.success('Tarefa criada!');
    onClose();
  }

  const statusMeta = STATUS_META[status];
  const pillStyle = GROUP_PILL_STYLE[status];
  const prioCfg = prioridade ? PRIO_CONFIG[prioridade] : null;
  const responsavel = responsavelId ? mockMembros.find((m) => m.id === responsavelId) : null;

  const statusList = Object.entries(STATUS_META) as [StatusTarefa, typeof STATUS_META[StatusTarefa]][];
  const prioList = Object.entries(PRIO_CONFIG) as [Prioridade, typeof PRIO_CONFIG[Prioridade]][];

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
          border: '1px solid rgba(255,255,255,0.1)',
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
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#111111',
          flexShrink: 0,
          gap: 2,
        }}>
          {([
            ['tarefa', 'Tarefa'],
            ['documento', 'Documento'],
            ['lembrete', 'Lembrete'],
            ['quadro', 'Quadro branco'],
            ['paineis', 'Painéis'],
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

          {/* Fechar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              marginLeft: 'auto',
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
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

            {/* Chips de contexto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              <button type="button" style={chipStyle}>
                <span style={{ fontSize: 13, color: '#888892', lineHeight: 1 }}>☰</span>
                <span style={{ fontSize: 12, color: '#c4c4cc' }}>Projeto 1</span>
                <ChevronDown size={11} color="#6b6b74" />
              </button>
              <button type="button" style={chipStyle}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: pillStyle.bg === '#2a2a31' ? '#5c6bc0' : pillStyle.bg,
                  display: 'inline-block', flexShrink: 0,
                  boxShadow: '0 0 0 2px rgba(92,107,192,0.25)',
                }} />
                <span style={{ fontSize: 12, color: '#c4c4cc' }}>Tarefa</span>
                <ChevronDown size={11} color="#6b6b74" />
              </button>
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
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 7, outline: 'none',
                  color: '#c4c4c4', fontSize: 13,
                  resize: 'none', lineHeight: 1.55,
                  fontFamily: 'inherit', padding: '10px 12px',
                  minHeight: 72, marginBottom: 8,
                }}
              />
            )}

            {/* Escrever com IA */}
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

          </div>{/* fim scroll */}

          {/* ── Área fixa: chips + campos (sem overflow para não cortar dropdowns) ── */}
          <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>

            {/* ── Chips de propriedades ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, position: 'relative' }}>

              {/* Status */}
              <div>
                <button
                  ref={statusBtnRef}
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
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
                  {statusMeta.label}
                </button>
                {openDropdown === 'status' && (
                  <DropdownPortal triggerRef={statusBtnRef} portalRef={statusPortalRef}>
                    <div style={dropdownStyle}>
                      {statusList.sort((a, b) => a[1].order - b[1].order).map(([val, meta]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => { setStatus(val); setOpenDropdown(null); }}
                          data-selected={status === val ? '1' : '0'}
                          style={{
                            ...dropdownItemStyle,
                            background: status === val ? 'rgba(255,255,255,0.06)' : 'none',
                          }}
                          {...itemHover}
                        >
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: GROUP_PILL_STYLE[val].bg === '#2a2a31' ? '#71717a' : GROUP_PILL_STYLE[val].bg,
                            display: 'inline-block', flexShrink: 0,
                          }} />
                          {meta.label}
                        </button>
                      ))}
                    </div>
                  </DropdownPortal>
                )}
              </div>

              {/* Responsável */}
              <div>
                <button
                  ref={responsavelBtnRef}
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'responsavel' ? null : 'responsavel')}
                  style={propChipStyle}
                >
                  <User size={13} />
                  {responsavel ? responsavel.nome : 'Responsável'}
                </button>
                {openDropdown === 'responsavel' && (
                  <DropdownPortal triggerRef={responsavelBtnRef} portalRef={responsavelPortalRef}>
                    <div style={dropdownStyle}>
                      <button
                        type="button"
                        onClick={() => { setResponsavelId(null); setOpenDropdown(null); }}
                        style={{ ...dropdownItemStyle, color: '#6b6b74' }}
                        {...itemHover}
                      >
                        Sem responsável
                      </button>
                      {mockMembros.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setResponsavelId(m.id); setOpenDropdown(null); }}
                          data-selected={responsavelId === m.id ? '1' : '0'}
                          style={{
                            ...dropdownItemStyle,
                            background: responsavelId === m.id ? 'rgba(255,255,255,0.06)' : 'none',
                          }}
                          {...itemHover}
                        >
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#3d2a6b', color: '#d8ccff',
                            fontSize: 10, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {m.iniciais}
                          </span>
                          {m.nome}
                        </button>
                      ))}
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
                    ? new Date(dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
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
                      {prioList.map(([val, cfg]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => { setPrioridade(val); setOpenDropdown(null); }}
                          data-selected={prioridade === val ? '1' : '0'}
                          style={{
                            ...dropdownItemStyle,
                            color: cfg.color,
                            background: prioridade === val ? 'rgba(255,255,255,0.06)' : 'none',
                          }}
                          {...itemHover}
                        >
                          <Flag size={12} />
                          {cfg.label}
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

            {/* Chip "Meus documentos" */}
            <div style={{ marginBottom: 20 }}>
              <button type="button" style={chipStyle}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>☰</span>
                <span style={{ fontSize: 12, color: '#a1a1aa' }}>Meus documentos</span>
                <ChevronDown size={11} color="#6b6b74" />
              </button>
            </div>

            {/* Nome do documento */}
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

            {/* Ações de conteúdo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
              <button
                type="button"
                style={docActionStyle}
                {...docItemHover}
                onClick={() => {
                  const id = crypto.randomUUID();
                  addDoc({
                    id,
                    idClasse: 'doc',
                    nome: docNome.trim() || 'Sem título',
                    idPai: null,
                    criadoEm: new Date().toISOString(),
                    atualizadoEm: new Date().toISOString(),
                  });
                  onClose();
                  router.push(`/docs/${id}`);
                }}
              >
                <FileText size={15} style={{ color: '#71717a', flexShrink: 0 }} />
                <span>Comece a escrever</span>
              </button>
              <button type="button" style={docActionStyle} {...docItemHover}>
                <Sparkles size={15} style={{ color: '#a78bfa', flexShrink: 0 }} />
                <span>Escrever com IA</span>
              </button>
            </div>

            {/* Add new */}
            <p style={{ fontSize: 12, color: '#4a4a54', margin: '0 0 8px', fontWeight: 400 }}>
              Add new
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {([
                [Table2, 'Tabela'],
                [Columns3, 'Coluna'],
                [List, 'Lista'],
              ] as const).map(([Icon, label]) => (
                <button key={label} type="button" style={docActionStyle} {...docItemHover}>
                  <Icon size={15} style={{ color: '#71717a', flexShrink: 0 }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* ── Corpo: abas stub (Lembrete / Quadro / Painéis) ── */}
        {(abaAtiva === 'lembrete' || abaAtiva === 'quadro' || abaAtiva === 'paineis') && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4a4a54', fontSize: 13,
          }}>
            Em breve
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: '#111111', flexShrink: 0,
        }}>
          {abaAtiva === 'tarefa' ? (
            <>
              {/* Esquerda: modelos + anexo + notificação */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button type="button" style={footerBtnStyle}>
                  <span style={{ fontSize: 12 }}>≋</span>
                  Modelos
                </button>
                <button type="button" style={{ ...footerBtnStyle, padding: '0 8px' }}>
                  <Paperclip size={13} />
                </button>
                <button type="button" style={{ ...footerBtnStyle, padding: '0 8px', gap: 4 }}>
                  <Bell size={13} />
                  <span style={{ fontSize: 11, color: '#6b6b74' }}>1</span>
                </button>
              </div>
              {/* Direita: Criar Tarefa split */}
              <div style={{ display: 'flex', alignItems: 'stretch', height: 32, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                <button
                  type="button"
                  onClick={handleCriar}
                  style={{
                    padding: '0 16px',
                    background: '#f0f0f0',
                    border: 'none', cursor: 'pointer',
                    color: '#111', fontSize: 13, fontWeight: 600,
                    letterSpacing: '-0.01em',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f0f0'; }}
                >
                  Criar Tarefa
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
              {/* Toggle Privado */}
              <button
                type="button"
                onClick={() => setDocPrivado((p) => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#a1a1aa', fontSize: 13,
                }}
              >
                {/* Toggle pill */}
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
              {/* Criar documento */}
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

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const docActionStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  height: 34, padding: '0 8px', borderRadius: 6,
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#a1a1aa', fontSize: 13, textAlign: 'left',
  transition: 'background 100ms, color 100ms',
};

const docItemHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
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
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.05)',
  cursor: 'pointer', color: '#c4c4cc', fontSize: 12,
  transition: 'background 120ms',
};

const propChipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 28, padding: '0 11px', borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
  color: '#6b6b74', fontSize: 12,
  transition: 'background 120ms, color 120ms, border-color 120ms',
};

const dropdownStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.12)',
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
    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = e.currentTarget.dataset.selected === '1'
      ? 'rgba(255,255,255,0.06)'
      : 'none';
  },
};

const footerBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 30, padding: '0 12px', borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'none', cursor: 'pointer',
  color: '#6b6b74', fontSize: 12,
  transition: 'background 120ms, color 120ms',
};
