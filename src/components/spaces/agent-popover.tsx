'use client';

// Popover de agente VPS vinculado ao Espaço.
// Aberto pelo botão "Agentes" na topbar da página do Espaço.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { Bot, Server, Link2, Unlink, Settings, AlertTriangle, ExternalLink } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useAgents } from '@/hooks/use-agents';
import { useSpaceAgentLink, useUnlinkSpaceAgent } from '@/hooks/use-space-agent-link';

// ─── Components ───────────────────────────────────────────────────────────────
import { ProvisionModal } from '@/components/spaces/provision-modal';

// ─── Props ────────────────────────────────────────────────────────────────────
interface AgentPopoverProps {
  spaceId: string;
  spaceName: string;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatusDot({ online }: { online: boolean }) {
  return (
    <span style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: online ? '#22c55e' : '#52525b',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{
        fontSize: 12,
        color: '#a1a1aa',
        fontFamily: mono ? 'monospace' : 'inherit',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Botão "Agentes" da topbar do Espaço com popover de vínculo VPS.
 *
 * Exibe dot de status (verde = vinculado+online, cinza = sem vínculo).
 * Ao clicar abre popover com:
 * - Estado sem vínculo: CTA para vincular (ou aviso para cadastrar agente)
 * - Estado vinculado: info do agente + ações de reconfigurar/desvincular
 *
 * @example
 * <AgentPopover spaceId={id} spaceName={entidade.nome} />
 */
export function AgentPopover({ spaceId, spaceName }: AgentPopoverProps) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: agents = [] } = useAgents();
  const { data: linkData, isLoading } = useSpaceAgentLink(spaceId);
  const unlinkMutation = useUnlinkSpaceAgent(spaceId);

  const hasAgents = agents.length > 0;
  const isLinked = !!linkData?.link;
  const link = linkData?.link ?? null;
  const agent = linkData?.agent ?? null;
  const agentOnline = agent?.status === 'online';

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setConfirmUnlink(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Fecha ao abrir o modal
  function openModal() {
    setOpen(false);
    setModalOpen(true);
  }

  function handleUnlink() {
    unlinkMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmUnlink(false);
        setOpen(false);
      },
    });
  }

  return (
    <>
      {/* ── Botão trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(v => !v); setConfirmUnlink(false); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          height: 28,
          padding: '0 10px',
          borderRadius: 6,
          border: open
            ? '1px solid rgba(34,211,238,0.25)'
            : '1px solid rgba(255,255,255,0.09)',
          background: open ? 'rgba(34,211,238,0.06)' : 'none',
          cursor: 'pointer',
          color: open ? '#22d3ee' : '#888892',
          fontSize: 12,
          fontWeight: 500,
          transition: 'background 120ms, border-color 120ms, color 120ms',
          position: 'relative',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = '#1e1e1e';
            e.currentTarget.style.color = '#c4c4c4';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#888892';
          }
        }}
      >
        <Bot size={14} />
        Agentes
        {/* Dot de status */}
        {!isLoading && (
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isLinked && agentOnline ? '#22c55e' : isLinked ? '#f59e0b' : '#3f3f46',
            display: 'inline-block',
            marginLeft: 1,
          }} />
        )}
      </button>

      {/* ── Popover ── */}
      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: (() => {
              const r = triggerRef.current?.getBoundingClientRect();
              return r ? r.bottom + 6 : 50;
            })(),
            right: (() => {
              const r = triggerRef.current?.getBoundingClientRect();
              return r ? window.innerWidth - r.right : 16;
            })(),
            zIndex: 8000,
            width: 300,
            background: '#1a1a1a',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          {/* Header do popover */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: '#1e1e1e',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bot size={14} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e4', margin: 0 }}>
                Agente VPS
              </p>
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
                {isLinked ? `Espaço "${spaceName}" vinculado` : 'Sem agente vinculado'}
              </p>
            </div>
          </div>

          {/* Corpo */}
          <div style={{ padding: '14px 14px' }}>

            {/* ── Sem vínculo ── */}
            {!isLinked && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12, color: '#71717a', margin: 0, lineHeight: 1.55 }}>
                  Vincule um VPS para executar tarefas automaticamente neste espaço.
                </p>

                {!hasAgents && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 7,
                    padding: '8px 10px',
                    borderRadius: 7,
                    background: 'rgba(234,179,8,0.06)',
                    border: '1px solid rgba(234,179,8,0.18)',
                  }}>
                    <AlertTriangle size={12} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11, color: '#ca8a04', lineHeight: 1.5 }}>
                      Cadastre um agente em <strong style={{ color: '#eab308' }}>IA → Agentes</strong> primeiro.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!hasAgents}
                  onClick={openModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    width: '100%',
                    height: 34,
                    borderRadius: 7,
                    border: 'none',
                    cursor: hasAgents ? 'pointer' : 'not-allowed',
                    background: hasAgents
                      ? 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)'
                      : 'rgba(255,255,255,0.05)',
                    color: hasAgents ? '#0a0a0a' : '#555',
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: hasAgents ? 1 : 0.5,
                    transition: 'opacity 150ms',
                  }}
                  onMouseEnter={e => { if (hasAgents) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { if (hasAgents) e.currentTarget.style.opacity = '1'; }}
                >
                  <Link2 size={13} />
                  Vincular VPS
                </button>
              </div>
            )}

            {/* ── Vinculado ── */}
            {isLinked && link && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Card do agente */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 7,
                    background: agentOnline ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${agentOnline ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Server size={14} style={{ color: agentOnline ? '#22d3ee' : '#52525b' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e4' }}>
                        {agent?.name ?? 'Agente'}
                      </span>
                      <StatusDot online={agentOnline} />
                      <span style={{ fontSize: 10, color: agentOnline ? '#22c55e' : '#52525b' }}>
                        {agentOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {agent?.hostname && (
                      <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
                        {agent.hostname}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info repo */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <InfoRow label="Repositório" value={link.remoteRepoUrl} mono />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <InfoRow label="Branch" value={link.remoteBranch} />
                    <InfoRow label="Pasta" value={link.remotePath} mono />
                  </div>
                </div>

                {/* Ações */}
                {confirmUnlink ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 12, color: '#ef4444', margin: 0, textAlign: 'center' }}>
                      Confirmar desvinculação?
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setConfirmUnlink(false)}
                        style={{
                          flex: 1,
                          height: 32,
                          borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'none',
                          color: '#888',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleUnlink}
                        disabled={unlinkMutation.isPending}
                        style={{
                          flex: 1,
                          height: 32,
                          borderRadius: 6,
                          border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {unlinkMutation.isPending ? 'Removendo...' : 'Desvincular'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setConfirmUnlink(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        flex: 1,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'none',
                        color: '#71717a',
                        fontSize: 11,
                        cursor: 'pointer',
                        justifyContent: 'center',
                        transition: 'color 120ms, border-color 120ms',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#71717a';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      }}
                    >
                      <Unlink size={11} />
                      Desvincular
                    </button>
                    <button
                      type="button"
                      onClick={openModal}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        flex: 1,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'none',
                        color: '#71717a',
                        fontSize: 11,
                        cursor: 'pointer',
                        justifyContent: 'center',
                        transition: 'color 120ms, background 120ms',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#c4c4c4';
                        e.currentTarget.style.background = '#252525';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#71717a';
                        e.currentTarget.style.background = 'none';
                      }}
                    >
                      <Settings size={11} />
                      Reconfigurar
                    </button>
                    <a
                      href="/ia"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        transition: 'color 120ms, background 120ms',
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                      title="Ver em IA"
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = '#c4c4c4';
                        (e.currentTarget as HTMLElement).style.background = '#252525';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = '#71717a';
                        (e.currentTarget as HTMLElement).style.background = 'none';
                      }}
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de provisionamento */}
      <ProvisionModal
        spaceId={spaceId}
        spaceName={spaceName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialStep={1}
        initialAgentId={isLinked ? (link?.agentId ?? undefined) : undefined}
        initialRepoUrl={isLinked ? (link?.remoteRepoUrl ?? undefined) : undefined}
      />
    </>
  );
}
