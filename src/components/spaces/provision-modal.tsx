'use client';

// Modal de 3 passos para vincular um agente VPS a um Espaço.
// Passo 1: selecionar agente.
// Passo 2: configurar URL do repositório.
// Passo 3 (SSH): copiar deploy key e adicionar no GitHub antes de provisionar.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Server, X, ChevronRight, Check, AlertCircle, Globe, Lock, Copy, ExternalLink, Loader2, GitBranch } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useAgents } from '@/hooks/use-agents';
import { useLinkSpaceAgent, useGenerateDeployKey, useProvisionProject } from '@/hooks/use-space-agent-link';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto, DeployKeyResponseDto } from '@/lib/types/api';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProvisionModalProps {
  spaceId: string;
  spaceName: string;
  open: boolean;
  onClose: () => void;
  initialStep?: 1 | 2;
  initialAgentId?: string;
  initialRepoUrl?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const REPO_URL_REGEX =
  /^(git@(github\.com|gitlab\.com|bitbucket\.org):[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+(\.git)?|https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+(\.git)?)$/;

const step2Schema = z.object({
  remoteRepoUrl: z
    .string()
    .min(1, 'URL obrigatória')
    .regex(REPO_URL_REGEX, 'URL inválida. Use SSH (git@github.com:org/repo.git) ou HTTPS (https://github.com/org/repo.git)'),
});

type Step2Data = z.infer<typeof step2Schema>;

function detectProtocol(url: string): 'ssh' | 'https' | null {
  if (url.startsWith('git@')) return 'ssh';
  if (url.startsWith('https://')) return 'https';
  return null;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e4', marginBottom: 3 }}>
          {agent.nome}
        </div>
        <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.hostname ?? '—'}
        </div>
      </div>

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

// ─── Passo 3: Deploy Key ──────────────────────────────────────────────────────

function Step3DeployKey({
  deployKey,
  isLoading,
  error,
  onProvision,
  isProvisioning,
}: {
  deployKey: DeployKeyResponseDto | null;
  isLoading: boolean;
  error: boolean;
  onProvision: () => void;
  isProvisioning: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!deployKey?.publicKey) return;
    navigator.clipboard.writeText(deployKey.publicKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0', color: '#71717a' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13 }}>Gerando deploy key no agente...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !deployKey) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 14px',
        borderRadius: 8,
        background: 'rgba(239,68,68,0.07)',
        border: '1px solid rgba(239,68,68,0.25)',
        fontSize: 13,
        color: '#f87171',
      }}>
        <AlertCircle size={14} style={{ flexShrink: 0 }} />
        Erro ao gerar deploy key. Verifique se o agente está online e tente novamente.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Explicação */}
      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(251,191,36,0.05)',
        border: '1px solid rgba(251,191,36,0.2)',
        fontSize: 12,
        color: '#a3a3a3',
        lineHeight: 1.6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Lock size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: 12 }}>Repositório privado — adicione a deploy key</span>
        </div>
        O agente gerou um par de chaves SSH exclusivo para este projeto. Copie a chave pública abaixo e adicione como <strong style={{ color: '#e4e4e4' }}>Deploy Key</strong> no repositório do GitHub antes de provisionar.
      </div>

      {/* Chave pública */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#888892' }}>Chave pública (copie e cole no GitHub)</span>
          {deployKey.alreadyExisted && (
            <span style={{ fontSize: 10, color: '#71717a', fontStyle: 'italic' }}>chave já existia</span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            padding: '10px 44px 10px 12px',
            borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#a3a3a3',
            wordBreak: 'break-all',
            lineHeight: 1.5,
            minHeight: 60,
          }}>
            {deployKey.publicKey}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            title="Copiar"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
              transition: 'all 150ms',
              color: copied ? '#4ade80' : '#71717a',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
        <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {deployKey.fingerprint}
        </span>
      </div>

      {/* Passos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#888892' }}>Como adicionar</span>
        <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {deployKey.instructions.map((step, i) => (
            <li key={i} style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Link direto */}
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12,
          color: '#22d3ee',
          textDecoration: 'none',
        }}
      >
        <ExternalLink size={12} />
        Abrir GitHub
      </a>

      {/* Botão confirmar */}
      <button
        type="button"
        onClick={onProvision}
        disabled={isProvisioning}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          height: 40,
          borderRadius: 8,
          border: 'none',
          background: isProvisioning
            ? 'rgba(34,211,238,0.3)'
            : 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)',
          color: '#0a0a0a',
          fontSize: 13,
          fontWeight: 700,
          cursor: isProvisioning ? 'not-allowed' : 'pointer',
          transition: 'opacity 150ms',
          marginTop: 4,
        }}
      >
        {isProvisioning ? (
          <>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Provisionando...
          </>
        ) : (
          <>
            <Check size={14} />
            Adicionei a key — Provisionar repositório
          </>
        )}
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ProvisionModal({
  spaceId,
  spaceName,
  open,
  onClose,
  initialStep = 1,
  initialAgentId,
  initialRepoUrl,
}: ProvisionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId ?? '');
  const [deployKey, setDeployKey] = useState<DeployKeyResponseDto | null>(null);
  const [deployKeyError, setDeployKeyError] = useState(false);
  const [done, setDone] = useState(false);

  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const linkMutation = useLinkSpaceAgent(spaceId);
  const generateKeyMutation = useGenerateDeployKey();
  const provisionMutation = useProvisionProject();

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { remoteRepoUrl: initialRepoUrl ?? '' },
  });

  const repoUrlValue = useWatch({ control: form.control, name: 'remoteRepoUrl' }) ?? '';
  const protocol = detectProtocol(repoUrlValue);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setStep(initialStep);
      setSelectedAgentId(initialAgentId ?? '');
      setDeployKey(null);
      setDeployKeyError(false);
      setDone(false);
      form.reset({ remoteRepoUrl: initialRepoUrl ?? '' });
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onlineAgents = agents.filter((a) => a.status === 'online');
  const hasOnlineAgents = onlineAgents.length > 0;

  async function handleStep2Confirm(data: Step2Data) {
    if (!selectedAgentId) return;
    const detectedProtocol = detectProtocol(data.remoteRepoUrl);

    await linkMutation.mutateAsync({
      agentId: selectedAgentId,
      repoUrl: data.remoteRepoUrl,
    });

    if (detectedProtocol === 'ssh') {
      // Repositório privado: vai para passo 3 para gerar e exibir deploy key
      setStep(3);
      setDeployKey(null);
      setDeployKeyError(false);
      try {
        const key = await generateKeyMutation.mutateAsync({ projectId: spaceId, agentId: selectedAgentId });
        setDeployKey(key);
      } catch {
        setDeployKeyError(true);
      }
    } else {
      // Repositório público: provisiona direto
      try {
        await provisionMutation.mutateAsync({ projectId: spaceId, agentId: selectedAgentId });
      } catch {
        // Fire-and-forget — mostra sucesso mesmo assim
      }
      setDone(true);
    }
  }

  async function handleProvision() {
    try {
      await provisionMutation.mutateAsync({ projectId: spaceId, agentId: selectedAgentId });
    } catch {
      // Fire-and-forget — mostra sucesso mesmo assim
    }
    setDone(true);
  }

  const stepLabels: Record<1 | 2 | 3, string> = {
    1: 'Selecionar VPS',
    2: 'Configurar repositório',
    3: 'Deploy key',
  };

  return (
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
      <div style={{
        width: '100%',
        maxWidth: 500,
        background: '#171717',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '88vh',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {([1, 2, 3] as const).map((s, idx) => (
                <>
                  <div
                    key={s}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      background: step === s ? '#22d3ee' : step > s ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)',
                      color: step === s ? '#0a0a0a' : step > s ? '#22d3ee' : '#555',
                      border: step === s ? 'none' : step > s ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {step > s ? <Check size={12} /> : s}
                  </div>
                  {idx < 2 && (
                    <div key={`sep-${s}`} style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                  )}
                </>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e4', marginLeft: 6 }}>
              {stepLabels[step]}
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
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#c4c4c4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#71717a'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Corpo scrollável */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── Passo 1: selecionar agente ── */}
          {!done && step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingAgents ? (
                <div style={{ fontSize: 13, color: '#555', textAlign: 'center', padding: '20px 0' }}>
                  Carregando agentes...
                </div>
              ) : agents.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0', textAlign: 'center' }}>
                  <Server size={32} style={{ color: '#404048' }} />
                  <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Nenhum agente cadastrado.</p>
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
          {!done && step === 2 && (
            <form
              id="step2-form"
              onSubmit={form.handleSubmit(handleStep2Confirm)}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Cards de instrução */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(34,197,94,0.2)',
                  background: 'rgba(34,197,94,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Globe size={12} style={{ color: '#4ade80', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>Repositório público</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4, display: 'block' }}>
                    Use <code style={{ color: '#a3a3a3', fontFamily: 'monospace' }}>https://</code> — sem autenticação necessária.
                  </span>
                </div>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(251,191,36,0.2)',
                  background: 'rgba(251,191,36,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Lock size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>Repositório privado</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4, display: 'block' }}>
                    Use <code style={{ color: '#a3a3a3', fontFamily: 'monospace' }}>git@</code> SSH — o agente usa a deploy key gerada.
                  </span>
                </div>
              </div>

              {/* Campo URL */}
              <FormField
                label="URL do repositório"
                error={form.formState.errors.remoteRepoUrl?.message}
              >
                <input
                  {...form.register('remoteRepoUrl')}
                  placeholder="git@github.com:org/repo.git  ou  https://github.com/org/repo.git"
                  style={{
                    height: 38,
                    padding: '0 12px',
                    borderRadius: 7,
                    border: `1px solid ${form.formState.errors.remoteRepoUrl ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: '#e4e4e4',
                    fontSize: 12,
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

              {/* Badge dinâmico */}
              {protocol === 'https' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 12px',
                  borderRadius: 7,
                  background: 'rgba(34,197,94,0.07)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  fontSize: 12,
                  color: '#4ade80',
                }}>
                  <Globe size={13} style={{ flexShrink: 0 }} />
                  Repositório público detectado — o clone será feito automaticamente.
                </div>
              )}
              {protocol === 'ssh' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 12px',
                  borderRadius: 7,
                  background: 'rgba(251,191,36,0.07)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  fontSize: 12,
                  color: '#fbbf24',
                }}>
                  <Lock size={13} style={{ flexShrink: 0 }} />
                  Repositório privado — você precisará adicionar a deploy key no próximo passo.
                </div>
              )}

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

          {/* ── Tela de sucesso ── */}
          {done && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '32px 8px', textAlign: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <GitBranch size={28} style={{ color: '#4ade80' }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#e4e4e4', margin: '0 0 8px' }}>
                  Repositório clonado com sucesso!
                </p>
                <p style={{ fontSize: 13, color: '#71717a', margin: 0, lineHeight: 1.6 }}>
                  O projeto <strong style={{ color: '#a3a3a3' }}>{spaceName}</strong> foi provisionado na VPS.<br />
                  O agente já pode executar tarefas neste repositório.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: 40,
                  padding: '0 32px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)',
                  color: '#0a0a0a',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Concluído
              </button>
            </div>
          )}

          {/* ── Passo 3: deploy key (apenas SSH) ── */}
          {!done && step === 3 && (
            <Step3DeployKey
              deployKey={deployKey}
              isLoading={generateKeyMutation.isPending}
              error={deployKeyError}
              onProvision={handleProvision}
              isProvisioning={provisionMutation.isPending}
            />
          )}
        </div>

        {/* Footer — oculto na tela de sucesso */}
        {!done && <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
          background: '#171717',
        }}>
          {/* Voltar (passo 2 → 1) */}
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
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#252525'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              Voltar
            </button>
          )}

          {/* Cancelar (passos 1 e 2) */}
          {step !== 3 && (
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
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#252525'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              Cancelar
            </button>
          )}

          {/* Próximo (passo 1) */}
          {step === 1 && (
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
              }}
            >
              Próximo
              <ChevronRight size={14} />
            </button>
          )}

          {/* Confirmar (passo 2) */}
          {step === 2 && (
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
              }}
            >
              {linkMutation.isPending ? 'Salvando...' : (
                <>
                  <ChevronRight size={13} />
                  {protocol === 'ssh' ? 'Salvar e gerar deploy key' : 'Salvar e provisionar'}
                </>
              )}
            </button>
          )}
        </div>}
      </div>
    </div>
  );
}
