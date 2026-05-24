'use client';

// Seção de automação com agente IA no overview do Espaço.
// Exibe estado vazio (sem vínculo) ou estado vinculado, com ações inline.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Bot, Link2, Unlink, Settings, AlertTriangle } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useAgents } from '@/hooks/use-agents';
import { useSpaceAgentLink, useUnlinkSpaceAgent } from '@/hooks/use-space-agent-link';

// ─── Components ───────────────────────────────────────────────────────────────
import { ProvisionModal } from '@/components/spaces/provision-modal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SpaceAgentSectionProps {
  spaceId: string;
  spaceName: string;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * Row de informação no estado vinculado.
 */
function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, color: '#555', width: 60, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 13,
        color: '#a1a1aa',
        fontFamily: mono ? 'monospace' : 'inherit',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 'calc(100% - 72px)',
      }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Badge de status do agente (Online / Offline).
 */
function StatusBadge({ online }: { online: boolean }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11,
      fontWeight: 600,
      color: online ? '#22d3ee' : '#71717a',
      background: online ? 'rgba(34,211,238,0.08)' : 'rgba(113,113,122,0.1)',
      border: `1px solid ${online ? 'rgba(34,211,238,0.2)' : 'rgba(113,113,122,0.2)'}`,
      borderRadius: 4,
      padding: '2px 7px',
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: online ? '#22d3ee' : '#71717a',
        display: 'inline-block',
      }} />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Seção de automação com agente IA no overview do Espaço.
 *
 * Estado 1 (sem vínculo): mostra card com CTA para vincular VPS.
 * Estado 2 (vinculado): mostra dados do vínculo e opções de reconfigurar/desvincular.
 *
 * @example
 * <SpaceAgentSection spaceId={id} spaceName={entidade.nome} />
 */
export function SpaceAgentSection({ spaceId, spaceName }: SpaceAgentSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [reconfiguring, setReconfiguring] = useState(false);

  const { data: agents = [] } = useAgents();
  const { data: linkData, isLoading } = useSpaceAgentLink(spaceId);
  const unlinkMutation = useUnlinkSpaceAgent(spaceId);

  const hasAgents = agents.length > 0;
  const isLinked = !!linkData?.link;
  const link = linkData?.link ?? null;
  const agent = linkData?.agent ?? null;
  const agentOnline = agent?.status === 'online';

  function handleUnlink() {
    unlinkMutation.mutate(undefined, {
      onSuccess: () => setConfirmUnlink(false),
    });
  }

  function handleOpenModal(reconfig = false) {
    setReconfiguring(reconfig);
    setModalOpen(true);
  }

  if (isLoading) {
    return (
      <div style={{
        background: '#1a1a1a',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '20px 20px',
        minHeight: 80,
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    );
  }

  return (
    <>
      <section style={{
        background: '#1a1a1a',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        marginTop: 12,
      }}>

        {/* ── Estado 1: sem vínculo ── */}
        {!isLinked && (
          <div style={{ padding: '20px 20px' }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(34,211,238,0.06)',
                border: '1px solid rgba(34,211,238,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(34,211,238,0.08)',
              }}>
                <Bot size={16} style={{ color: '#22d3ee' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e4' }}>
                Automação com agente IA
              </span>
            </div>

            {/* Descrição */}
            <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 16px', lineHeight: 1.5 }}>
              Vincule um VPS para executar tarefas automaticamente neste espaço.
            </p>

            {/* Aviso se não há agentes */}
            {!hasAgents && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 7,
                background: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.18)',
                marginBottom: 14,
              }}>
                <AlertTriangle size={13} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: '#ca8a04', lineHeight: 1.5 }}>
                  Cadastre um agente em <strong style={{ color: '#eab308' }}>IA → Agentes</strong> antes de vincular.
                </span>
              </div>
            )}

            {/* Botão CTA */}
            <button
              type="button"
              disabled={!hasAgents}
              onClick={() => handleOpenModal(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 32,
                padding: '0 16px',
                borderRadius: 7,
                border: 'none',
                cursor: hasAgents ? 'pointer' : 'not-allowed',
                background: hasAgents
                  ? 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)'
                  : 'rgba(255,255,255,0.06)',
                color: hasAgents ? '#0a0a0a' : '#555',
                fontSize: 13,
                fontWeight: 600,
                transition: 'opacity 150ms',
                opacity: hasAgents ? 1 : 0.5,
              }}
              onMouseEnter={e => { if (hasAgents) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { if (hasAgents) e.currentTarget.style.opacity = '1'; }}
            >
              <Link2 size={13} />
              Vincular VPS
            </button>
          </div>
        )}

        {/* ── Estado 2: vinculado ── */}
        {isLinked && link && (
          <>
            {/* Cabeçalho do card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: '#1e1e1e',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={14} style={{ color: '#22d3ee' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#c4c4c4' }}>Automação</span>
              </div>

              {/* Botão desvincular */}
              {confirmUnlink ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#ef4444' }}>Confirmar desvinculação?</span>
                  <button
                    type="button"
                    onClick={handleUnlink}
                    disabled={unlinkMutation.isPending}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      borderRadius: 5,
                      border: '1px solid rgba(239,68,68,0.4)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {unlinkMutation.isPending ? 'Removendo...' : 'Sim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmUnlink(false)}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      borderRadius: 5,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'none',
                      color: '#888',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmUnlink(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    height: 26,
                    padding: '0 10px',
                    borderRadius: 5,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'none',
                    color: '#71717a',
                    fontSize: 12,
                    cursor: 'pointer',
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
              )}
            </div>

            {/* Corpo: info rows */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Linha servidor + status */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#555', width: 60, flexShrink: 0 }}>Servidor</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#c4c4c4', fontWeight: 500 }}>
                    {agent?.name ?? link.agentId}
                  </span>
                  <StatusBadge online={agentOnline} />
                </div>
              </div>

              {agent?.hostname && (
                <InfoRow label="Host" value={agent.hostname} mono />
              )}
              <InfoRow label="Repo" value={link.remoteRepoUrl} mono />
              <InfoRow label="Branch" value={link.remoteBranch} />
              <InfoRow label="Pasta" value={link.remotePath} mono />
            </div>

            {/* Rodapé: botão reconfigurar */}
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <button
                type="button"
                onClick={() => handleOpenModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.09)',
                  background: 'none',
                  color: '#888892',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'background 120ms, color 120ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#252525';
                  e.currentTarget.style.color = '#c4c4c4';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#888892';
                }}
              >
                <Settings size={12} />
                Reconfigurar
              </button>
            </div>
          </>
        )}
      </section>

      {/* Modal de provisionamento */}
      <ProvisionModal
        spaceId={spaceId}
        spaceName={spaceName}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setReconfiguring(false); }}
        initialStep={reconfiguring ? 1 : 1}
        initialAgentId={reconfiguring ? (link?.agentId ?? undefined) : undefined}
        initialRepoUrl={reconfiguring ? (link?.remoteRepoUrl ?? undefined) : undefined}
      />
    </>
  );
}
