'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check, X, Server, CheckCircle2, ArrowRight } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useCreateAgent } from '@/hooks/use-agents';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto, InstallTokenDto } from '@/lib/types/api';

// ─── Constantes ───────────────────────────────────────────────────────────────

const DRAFT_KEY = 'scrumban_vps_wizard_draft';
const DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutos

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

/** Validação do passo 1 — identificação do agente */
const step1Schema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(60, 'Máximo 60 caracteres'),
  hostname: z
    .string()
    .min(1, 'Hostname obrigatório')
    .max(255, 'Máximo 255 caracteres'),
});

type Step1Form = z.infer<typeof step1Schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface VpsWizardProps {
  /** Controla visibilidade do modal */
  open: boolean;
  /** Callback ao fechar sem concluir */
  onClose: () => void;
  /** Callback ao finalizar com sucesso — recebe o agente criado */
  onSuccess: (agent: AgentDto) => void;
}

// ─── Helpers visuais ─────────────────────────────────────────────────────────

/** Indica qual passo está ativo na barra de progresso */
function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            width: n === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background:
              n < current
                ? '#22d3ee'
                : n === current
                  ? '#0ea5e9'
                  : 'rgba(255,255,255,0.1)',
            transition: 'width .25s, background .25s',
          }}
        />
      ))}
    </div>
  );
}

/** Label do cabeçalho para cada passo */
const STEP_LABELS: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'Conectar VPS',
    subtitle: 'Identifique seu servidor',
  },
  2: {
    title: 'Instalar agente',
    subtitle: 'Execute o comando no seu VPS',
  },
  3: {
    title: 'Aguardando conexão',
    subtitle: 'Detectando o agente no servidor',
  },
  4: {
    title: 'Pronto!',
    subtitle: 'Agente conectado com sucesso',
  },
};

/** Campo de input padronizado com label e mensagem de erro */
function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 13, fontWeight: 500, color: '#a1a1aa' }}
      >
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
      )}
    </div>
  );
}

/** Estilo base de input reutilizado nos passos */
const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  color: '#e4e4e4',
  fontSize: 14,
  padding: '0 14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .15s',
};

/** Botão primário gradient */
function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  style: extraStyle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: 42,
        borderRadius: 10,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled
          ? 'rgba(255,255,255,0.05)'
          : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        color: disabled ? '#555' : '#fff',
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'opacity .15s',
        opacity: disabled ? 0.6 : 1,
        ...extraStyle,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.opacity = '0.88';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.opacity = '1';
      }}
    >
      {children}
    </button>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Wizard de 5 passos para conectar um servidor VPS como agente IA.
 *
 * Passo 1: Identificação (nome + hostname) com validação RHF + Zod
 * Passo 2: Exibe comando curl de instalação com botão de copiar
 * Passo 3: Polling simulado de conexão (3s) — avanço automático
 * Passo 4: Configuração de repositório + nível de autonomia
 * Passo 5: Tela de sucesso com animação
 *
 * O draft do formulário é salvo no localStorage com TTL de 30min.
 *
 * @example
 * <VpsWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSuccess={handleSuccess} />
 */
export function VpsWizard({ open, onClose, onSuccess }: VpsWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [createdAgent, setCreatedAgent] = useState<AgentDto | null>(null);
  const [installCommand, setInstallCommand] = useState('');
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createAgent = useCreateAgent();

  // ─── Forms ─────────────────────────────────────────────────────────────────

  const form1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: '', hostname: '' },
  });

  // ─── Draft localStorage ────────────────────────────────────────────────────

  // Carrega draft ao abrir
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        ts: number;
        name: string;
        hostname: string;
      };
      if (Date.now() - draft.ts > DRAFT_TTL_MS) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      form1.setValue('name', draft.name);
      form1.setValue('hostname', draft.hostname);
    } catch {
      // draft corrompido — ignora
    }
  }, [open, form1]);

  // Salva draft ao digitar no passo 1
  const watchName = form1.watch('name');
  const watchHostname = form1.watch('hostname');
  useEffect(() => {
    if (step !== 1) return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ts: Date.now(), name: watchName, hostname: watchHostname })
    );
  }, [watchName, watchHostname, step]);

  // ─── Reset ao fechar ───────────────────────────────────────────────────────

  function resetWizard() {
    setStep(1);
    setCreatedAgent(null);
    setInstallCommand('');
    setCopied(false);
    form1.reset();
    if (pollingRef.current) clearTimeout(pollingRef.current);
  }

  function handleClose() {
    resetWizard();
    onClose();
  }

  // ─── Passo 1 → 2 ──────────────────────────────────────────────────────────

  const onStep1Submit = form1.handleSubmit(async (data) => {
    const agent = await createAgent.mutateAsync({
      name: data.name,
      hostname: data.hostname,
    });
    setCreatedAgent(agent);

    const tokenData = await api
      .post<InstallTokenDto>(`/agents/${agent.id}/install-token`)
      .then((r) => r.data);
    setInstallCommand(tokenData.installCommand);

    localStorage.removeItem(DRAFT_KEY);
    setStep(2);
  });

  // ─── Passo 3 — polling real de status ────────────────────────────────────────

  useEffect(() => {
    if (step !== 3 || !createdAgent) return;

    function poll() {
      pollingRef.current = setTimeout(async () => {
        try {
          const updated = await api
            .get<AgentDto>(`/agents/${createdAgent!.id}`)
            .then((r) => r.data);
          if (updated.status === 'online') {
            setCreatedAgent(updated);
            setStep(4);
          } else {
            poll();
          }
        } catch {
          poll();
        }
      }, 3000);
    }

    poll();

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [step, createdAgent]);

  // ─── Copy to clipboard ─────────────────────────────────────────────────────

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  // ─── Render guard ──────────────────────────────────────────────────────────

  if (!open) return null;

  const stepMeta = STEP_LABELS[step];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Conectar VPS"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: 520,
          zIndex: 1001,
          padding: '0 16px',
        }}
      >
        <div
          style={{
            background: '#171717',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <StepDots current={step} />
                <span style={{ fontSize: 11, color: '#555' }}>
                  {step} de 4
                </span>
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#e4e4e4',
                  margin: 0,
                }}
              >
                {stepMeta.title}
              </h2>
              <p style={{ fontSize: 13, color: '#a1a1aa', margin: 0 }}>
                {stepMeta.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar wizard"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: 'rgba(255,255,255,0.04)',
                cursor: 'pointer',
                color: '#555',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#aaa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = '#555';
              }}
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Corpo do passo */}
          <div style={{ padding: '24px' }}>
            {/* ── PASSO 1: Identificação ────────────────────────────────── */}
            {step === 1 && (
              <form
                onSubmit={onStep1Submit}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <Field
                  label="Nome do agente"
                  id="agent-name"
                  error={form1.formState.errors.name?.message}
                >
                  {(() => {
                    const { onBlur: rhfBlurName, ...restName } = form1.register('name');
                    return (
                      <input
                        id="agent-name"
                        type="text"
                        placeholder="ex: Produção BR-01"
                        autoComplete="off"
                        style={{
                          ...inputStyle,
                          borderColor: form1.formState.errors.name
                            ? 'rgba(239,68,68,0.5)'
                            : 'rgba(255,255,255,0.10)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'rgba(34,211,238,0.4)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = form1.formState.errors.name
                            ? 'rgba(239,68,68,0.5)'
                            : 'rgba(255,255,255,0.10)';
                          void rhfBlurName(e);
                        }}
                        {...restName}
                      />
                    );
                  })()}
                </Field>

                <Field
                  label="Hostname / IP"
                  id="agent-hostname"
                  error={form1.formState.errors.hostname?.message}
                >
                  {(() => {
                    const { onBlur: rhfBlurHostname, ...restHostname } = form1.register('hostname');
                    return (
                      <input
                        id="agent-hostname"
                        type="text"
                        placeholder="ex: 192.168.1.100 ou meuservidor.com"
                        autoComplete="off"
                        style={{
                          ...inputStyle,
                          borderColor: form1.formState.errors.hostname
                            ? 'rgba(239,68,68,0.5)'
                            : 'rgba(255,255,255,0.10)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'rgba(34,211,238,0.4)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = form1.formState.errors.hostname
                            ? 'rgba(239,68,68,0.5)'
                            : 'rgba(255,255,255,0.10)';
                          void rhfBlurHostname(e);
                        }}
                        {...restHostname}
                      />
                    );
                  })()}
                </Field>

                <PrimaryButton
                  type="submit"
                  disabled={createAgent.isPending}
                  style={{ marginTop: 4 }}
                >
                  {createAgent.isPending ? 'Criando...' : 'Próximo'}
                  {!createAgent.isPending && <ArrowRight size={16} strokeWidth={2} />}
                </PrimaryButton>
              </form>
            )}

            {/* ── PASSO 2: Instalar ─────────────────────────────────────── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Instrução */}
                <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>
                  Execute o comando abaixo no terminal do seu VPS como{' '}
                  <code
                    style={{
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.06)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      color: '#22d3ee',
                    }}
                  >
                    root
                  </code>{' '}
                  ou com{' '}
                  <code
                    style={{
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.06)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      color: '#22d3ee',
                    }}
                  >
                    sudo
                  </code>
                  :
                </p>

                {/* Box de código */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: '#22d3ee',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      lineHeight: 1.6,
                    }}
                  >
                    {installCommand}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copiar comando de instalação"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'none',
                      cursor: 'pointer',
                      color: copied ? '#22c55e' : '#555',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'color .15s',
                    }}
                  >
                    {copied ? (
                      <Check size={13} strokeWidth={2.5} />
                    ) : (
                      <Copy size={13} strokeWidth={1.8} />
                    )}
                  </button>
                </div>

                {/* Badges informativos */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                  }}
                >
                  {[
                    { icon: '🔒', text: 'Token com expiração de 30 min' },
                    { icon: '📦', text: 'Instala apenas o daemon do agente' },
                    { icon: '🔍', text: 'Código aberto e auditável' },
                  ].map((b) => (
                    <div
                      key={b.text}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        padding: '10px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{b.icon}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#555',
                          lineHeight: 1.4,
                        }}
                      >
                        {b.text}
                      </span>
                    </div>
                  ))}
                </div>

                <PrimaryButton onClick={() => setStep(3)}>
                  Já executei o comando
                  <ArrowRight size={16} strokeWidth={2} />
                </PrimaryButton>
              </div>
            )}

            {/* ── PASSO 3: Aguardando conexão ───────────────────────────── */}
            {step === 3 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                  padding: '12px 0',
                  textAlign: 'center',
                }}
              >
                {/* Spinner CSS puro */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    border: '3px solid rgba(34,211,238,0.12)',
                    borderTop: '3px solid #22d3ee',
                    animation: 'vps-spin 0.9s linear infinite',
                  }}
                />

                <style>{`
                  @keyframes vps-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>

                <div>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#e4e4e4',
                      margin: '0 0 8px',
                    }}
                  >
                    Aguardando conexão do seu servidor...
                  </p>
                  <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.5 }}>
                    Assim que o agente iniciar, avançaremos automaticamente.
                    <br />
                    Isso pode levar alguns segundos.
                  </p>
                </div>

                {/* Hostname em destaque */}
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(34,211,238,0.06)',
                    border: '1px solid rgba(34,211,238,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Server size={14} color="#22d3ee" strokeWidth={1.5} />
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: 'monospace',
                      color: '#22d3ee',
                    }}
                  >
                    {createdAgent?.hostname}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    marginTop: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#555',
                    fontSize: 13,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#888';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#555';
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* ── PASSO 4: Sucesso ──────────────────────────────────────── */}
            {step === 4 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                  padding: '8px 0',
                  textAlign: 'center',
                }}
              >
                <style>{`
                  @keyframes vps-ring-scale {
                    0% { transform: scale(0.8); opacity: 0; }
                    60% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  @keyframes vps-check-pop {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.15); }
                    100% { transform: scale(1); opacity: 1; }
                  }
                `}</style>

                {/* Ícone check animado */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: '3px solid rgba(34,197,94,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'vps-ring-scale .45s cubic-bezier(.34,1.56,.64,1) both',
                  }}
                >
                  <div style={{ animation: 'vps-check-pop .35s .15s cubic-bezier(.34,1.56,.64,1) both', opacity: 0 }}>
                    <CheckCircle2
                      size={44}
                      color="#22c55e"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                <div>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#e4e4e4',
                      margin: '0 0 8px',
                    }}
                  >
                    Agente conectado com sucesso!
                  </p>
                  <p style={{ fontSize: 14, color: '#a1a1aa', margin: 0 }}>
                    Seu VPS está pronto para receber tarefas do Scrumban.
                  </p>
                </div>

                {/* Nome + badge online */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.15)',
                  }}
                >
                  <Server size={16} color="#22d3ee" strokeWidth={1.5} />
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e4' }}
                  >
                    {createdAgent?.nome}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 20,
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.25)',
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#22c55e',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#22c55e',
                      }}
                    >
                      Online
                    </span>
                  </div>
                </div>

                <PrimaryButton
                  onClick={() => {
                    if (createdAgent) onSuccess(createdAgent);
                    resetWizard();
                    onClose();
                  }}
                  style={{ marginTop: 4 }}
                >
                  Ver meus agentes
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
