'use client';

// Modal de 2 passos para vincular um agente VPS a um Espaço.
// Passo 1: selecionar agente. Passo 2: configurar repositório.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Server, X, ChevronRight, Check, AlertCircle } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useAgents } from '@/hooks/use-agents';
import { useLinkSpaceAgent } from '@/hooks/use-space-agent-link';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto } from '@/lib/types/api';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProvisionModalProps {
  spaceId: string;
  spaceName: string;
  open: boolean;
  onClose: () => void;
  initialStep?: 1 | 2;
  /** Para re-configurar: pré-seleciona o agente atual */
  initialAgentId?: string;
  /** Para re-configurar: pré-preenche a URL do repo */
  initialRepoUrl?: string;
}

// ─── Validação do passo 2 ─────────────────────────────────────────────────────

const step2Schema = z.object({
  remoteRepoUrl: z.string().min(1, 'URL obrigatória'),
  remoteBranch: z.string().min(1, 'Branch obrigatória'),
  remotePath: z.string().min(1, 'Caminho obrigatório'),
});

type Step2Data = z.infer<typeof step2Schema>;

// ─── Utilitários ──────────────────────────────────────────────────────────────

/** Converte nome em kebab-case para sugestão de path */
function toKebab(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/** Badge de status rápido para o card do agente */
function AgentStatusBadge({ status }: { status: AgentDto['status'] }) {
  const online = status === 'online';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 600,
      color: online ? '#22d3ee' : '#52525b',
      background: online ? 'rgba(34,211,238,0.08)' : 'rgba(82,82,91,0.1)',
      border: `1px solid ${online ? 'rgba(34,211,238,0.2)' : 'rgba(82,82,91,0.2)'}`,
      borderRadius: 4,
      padding: '2px 6px',
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: online ? '#22d3ee' : '#52525b',
        display: 'inline-block',
      }} />
      {online ? 'Online' : status === 'offline' ? 'Offline' : 'Nunca conectado'}
    </span>
  );
}

/** Card de seleção de agente (radio visual) */
function AgentCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentDto;
  selected: boolean;
  onSelect: () => void;
}) {
  const online = agent.status === 'online';
  const disabled = !online;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 14px',
        borderRadius: 8,
        border: selected
          ? '1px solid rgba(34,211,238,0.4)'
          : '1px solid rgba(255,255,255,0.07)',
        background: selected
          ? 'rgba(34,211,238,0.06)'
          : 'rgba(255,255,255,0.02)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 120ms, background 120ms',
        textAlign: 'left',
      }}
    >
      {/* Ícone */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: selected ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Server size={15} style={{ color: selected ? '#22d3ee' : '#71717a' }} />
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e4', marginBottom: 3 }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.hostname}
        </div>
      </div>

      {/* Status + check */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <AgentStatusBadge status={agent.status} />
        {selected && (
          <div style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'rgba(34,211,238,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Check size={11} style={{ color: '#22d3ee' }} />
          </div>
        )}
      </div>
    </button>
  );
}

/** Campo de formulário com label e mensagem de erro */
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#888892' }}>{label}</label>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} />
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Modal de 2 passos para vincular um agente VPS ao Espaço.
 *
 * Passo 1: lista agentes disponíveis para seleção (radio visual).
 * Passo 2: formulário RHF+Zod para URL, branch e caminho na VPS.
 *
 * @example
 * <ProvisionModal spaceId={id} spaceName="Meu Projeto" open={open} onClose={() => setOpen(false)} />
 */
export function ProvisionModal({
  spaceId,
  spaceName,
  open,
  onClose,
  initialStep = 1,
  initialAgentId,
  initialRepoUrl,
}: ProvisionModalProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId ?? '');

  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const linkMutation = useLinkSpaceAgent(spaceId);

  const suggestedPath = `/home/scrumban-agent/projects/${toKebab(spaceName)}`;

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      remoteRepoUrl: initialRepoUrl ?? '',
      remoteBranch: 'main',
      remotePath: suggestedPath,
    },
  });

  // Reset ao abrir: agenda via setTimeout para não violar react-hooks/set-state-in-effect
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setStep(initialStep);
      setSelectedAgentId(initialAgentId ?? '');
      form.reset({
        remoteRepoUrl: initialRepoUrl ?? '',
        remoteBranch: 'main',
        remotePath: suggestedPath,
      });
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onlineAgents = agents.filter((a) => a.status === 'online');
  const hasOnlineAgents = onlineAgents.length > 0;

  async function handleConfirm(data: Step2Data) {
    if (!selectedAgentId) return;
    await linkMutation.mutateAsync({
      agentId: selectedAgentId,
      remoteRepoUrl: data.remoteRepoUrl,
      remoteBranch: data.remoteBranch,
      remotePath: data.remotePath,
    });
    onClose();
  }

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: '#171717',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Steps indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                background: step === 1 ? '#22d3ee' : 'rgba(34,211,238,0.15)',
                color: step === 1 ? '#0a0a0a' : '#22d3ee',
                border: step === 1 ? 'none' : '1px solid rgba(34,211,238,0.3)',
              }}>
                {step > 1 ? <Check size={12} /> : '1'}
              </div>
              <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                background: step === 2 ? '#22d3ee' : 'rgba(255,255,255,0.05)',
                color: step === 2 ? '#0a0a0a' : '#555',
                border: step === 2 ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}>
                2
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e4' }}>
              {step === 1 ? 'Selecionar VPS' : 'Configurar repositório'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'none',
              cursor: 'pointer',
              color: '#71717a',
              transition: 'background 120ms, color 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#c4c4c4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#71717a'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Corpo scrollável */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>

          {/* ── Passo 1: selecionar agente ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingAgents ? (
                <div style={{ fontSize: 13, color: '#555', textAlign: 'center', padding: '20px 0' }}>
                  Carregando agentes...
                </div>
              ) : agents.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '24px 0',
                  textAlign: 'center',
                }}>
                  <Server size={32} style={{ color: '#404048' }} />
                  <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                    Nenhum agente cadastrado.
                  </p>
                  <p style={{ fontSize: 12, color: '#404048', margin: 0 }}>
                    Vá em <strong style={{ color: '#888' }}>IA → Agentes</strong> para cadastrar um VPS.
                  </p>
                </div>
              ) : (
                <>
                  {!hasOnlineAgents && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '9px 12px',
                      borderRadius: 7,
                      background: 'rgba(234,179,8,0.06)',
                      border: '1px solid rgba(234,179,8,0.18)',
                      marginBottom: 4,
                    }}>
                      <AlertCircle size={13} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, color: '#ca8a04', lineHeight: 1.5 }}>
                        Nenhum agente online no momento. Instale o agente no VPS primeiro.
                      </span>
                    </div>
                  )}

                  {agents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      selected={selectedAgentId === agent.id}
                      onSelect={() => setSelectedAgentId(agent.id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── Passo 2: configurar repositório ── */}
          {step === 2 && (
            <form
              id="step2-form"
              onSubmit={form.handleSubmit(handleConfirm)}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <FormField
                label="URL do repositório"
                error={form.formState.errors.remoteRepoUrl?.message}
              >
                <input
                  {...form.register('remoteRepoUrl')}
                  placeholder="https://github.com/org/projeto.git"
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 7,
                    border: `1px solid ${form.formState.errors.remoteRepoUrl ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: '#e4e4e4',
                    fontSize: 13,
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'monospace',
                    transition: 'border-color 120ms',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = form.formState.errors.remoteRepoUrl ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'; }}
                />
              </FormField>

              <FormField
                label="Branch padrão"
                error={form.formState.errors.remoteBranch?.message}
              >
                <input
                  {...form.register('remoteBranch')}
                  placeholder="main"
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 7,
                    border: `1px solid ${form.formState.errors.remoteBranch ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: '#e4e4e4',
                    fontSize: 13,
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 120ms',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = form.formState.errors.remoteBranch ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'; }}
                />
              </FormField>

              <FormField
                label="Caminho na VPS"
                error={form.formState.errors.remotePath?.message}
              >
                <input
                  {...form.register('remotePath')}
                  placeholder={suggestedPath}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 7,
                    border: `1px solid ${form.formState.errors.remotePath ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: '#e4e4e4',
                    fontSize: 13,
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'monospace',
                    transition: 'border-color 120ms',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = form.formState.errors.remotePath ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'; }}
                />
              </FormField>

              {linkMutation.isError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 12px',
                  borderRadius: 7,
                  background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  fontSize: 12,
                  color: '#f87171',
                }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  Erro ao salvar vínculo. Tente novamente.
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer com ações */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
          background: '#171717',
        }}>
          {/* Botão Voltar (passo 2 → passo 1) */}
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                height: 34,
                padding: '0 16px',
                borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'none',
                color: '#888892',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#252525'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              Voltar
            </button>
          )}

          {/* Botão Cancelar */}
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 34,
              padding: '0 16px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'none',
              color: '#888892',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#252525'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            Cancelar
          </button>

          {/* Botão Próximo (passo 1) ou Confirmar (passo 2) */}
          {step === 1 ? (
            <button
              type="button"
              disabled={!selectedAgentId}
              onClick={() => setStep(2)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 18px',
                borderRadius: 7,
                border: 'none',
                cursor: selectedAgentId ? 'pointer' : 'not-allowed',
                background: selectedAgentId
                  ? 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)'
                  : 'rgba(255,255,255,0.06)',
                color: selectedAgentId ? '#0a0a0a' : '#555',
                fontSize: 13,
                fontWeight: 600,
                opacity: selectedAgentId ? 1 : 0.6,
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => { if (selectedAgentId) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { if (selectedAgentId) e.currentTarget.style.opacity = '1'; }}
            >
              Próximo
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              form="step2-form"
              disabled={linkMutation.isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 18px',
                borderRadius: 7,
                border: 'none',
                cursor: linkMutation.isPending ? 'not-allowed' : 'pointer',
                background: linkMutation.isPending
                  ? 'rgba(34,211,238,0.4)'
                  : 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)',
                color: '#0a0a0a',
                fontSize: 13,
                fontWeight: 600,
                transition: 'opacity 150ms',
              }}
            >
              {linkMutation.isPending ? 'Salvando...' : (
                <>
                  <Check size={13} />
                  Confirmar vínculo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
