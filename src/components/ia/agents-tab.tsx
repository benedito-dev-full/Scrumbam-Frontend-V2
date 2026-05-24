'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Bot, Server, Zap, GitBranch, Plus } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useAgents } from '@/hooks/use-agents';

// ─── Componentes ──────────────────────────────────────────────────────────────
import { AgentCard } from '@/components/ia/agent-card';
import { VpsWizard } from '@/components/ia/vps-wizard';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto } from '@/lib/types/api';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * Placeholder enquanto os agentes carregam.
 */
function AgentsTabSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {[1, 2].map((n) => (
        <div
          key={n}
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '18px 20px',
            height: 130,
            animation: 'pulse 1.5s infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

/**
 * Tela de boas-vindas exibida quando nenhum agente foi conectado ainda.
 */
function EmptyState({ onConnect }: { onConnect: () => void }) {
  const FEATURES = [
    {
      Icon: Zap,
      color: '#22d3ee',
      title: 'Execução autônoma',
      description: 'O agente executa tarefas no seu servidor 24/7 sem intervenção manual.',
    },
    {
      Icon: GitBranch,
      color: '#a78bfa',
      title: 'Integração com Git',
      description: 'Cria branches, abre PRs e faz commits automaticamente.',
    },
    {
      Icon: Server,
      color: '#0ea5e9',
      title: 'Qualquer VPS',
      description: 'Funciona em qualquer Linux — DigitalOcean, Hetzner, AWS, Linode.',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        padding: '24px 0',
        textAlign: 'center',
        width: '100%',
      }}
    >
      {/* Ícone central com glow */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: -20,
            background:
              'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(34,211,238,0.08)',
            border: '1px solid rgba(34,211,238,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Bot size={34} color="#22d3ee" strokeWidth={1.4} />
        </div>
      </div>

      {/* Texto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#e4e4e4',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Automatize com agentes IA
        </h2>
        <p
          style={{
            fontSize: 14,
            color: '#a1a1aa',
            margin: 0,
            maxWidth: 400,
            lineHeight: 1.65,
          }}
        >
          Conecte um servidor e o Scrumban passa a executar tarefas
          diretamente no seu código — sem precisar abrir terminal.
        </p>
      </div>

      {/* Features */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          width: '100%',
        }}
      >
        {FEATURES.map(({ Icon, color, title, description }) => (
          <div
            key={title}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '14px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${color}14`,
                border: `1px solid ${color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={16} color={color} strokeWidth={1.6} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#d4d4d4',
                  margin: '0 0 4px',
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onConnect}
        style={{
          height: 44,
          padding: '0 28px',
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #22d3ee, #0ea5e9, #0284c7)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'opacity .15s',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.88';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <Server size={16} strokeWidth={2} />
        Conectar meu VPS
      </button>
    </div>
  );
}

// ─── Lista de agentes ─────────────────────────────────────────────────────────

/**
 * Lista de agentes com cabeçalho e botão de adicionar novo.
 */
function AgentsList({
  agents,
  onAdd,
  onExecute,
}: {
  agents: AgentDto[];
  onAdd: () => void;
  onExecute: (agent: AgentDto) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Cabeçalho da lista */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#e4e4e4',
              margin: '0 0 2px',
            }}
          >
            Meus agentes
          </h2>
          <p style={{ fontSize: 12, color: '#555', margin: 0 }}>
            {agents.length} {agents.length === 1 ? 'servidor conectado' : 'servidores conectados'}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          aria-label="Conectar novo agente"
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid rgba(34,211,238,0.2)',
            background: 'rgba(34,211,238,0.06)',
            cursor: 'pointer',
            color: '#22d3ee',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background .15s, border-color .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(34,211,238,0.10)';
            e.currentTarget.style.borderColor = 'rgba(34,211,238,0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(34,211,238,0.06)';
            e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)';
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Novo agente
        </button>
      </div>

      {/* Cards */}
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} onExecute={onExecute} />
      ))}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Aba "Agentes" da página /ia.
 *
 * Orquestra 3 estados:
 * - Carregando → skeleton
 * - Sem agentes → EmptyState com CTA para conectar
 * - Com agentes → AgentsList com botão de adicionar
 *
 * O wizard de conexão é um modal controlado por `wizardOpen`.
 *
 * @example
 * // Usado diretamente em /ia/page.tsx quando tab === 'agentes'
 * {tab === 'agentes' && <AgentsTab />}
 */
export function AgentsTab() {
  const { data: agents = [], isLoading } = useAgents();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [, setExecuteAgent] = useState<AgentDto | null>(null);

  if (isLoading) return <AgentsTabSkeleton />;

  return (
    <div style={{ width: '100%', maxWidth: 700 }}>
      {agents.length === 0 ? (
        <EmptyState onConnect={() => setWizardOpen(true)} />
      ) : (
        <AgentsList
          agents={agents}
          onAdd={() => setWizardOpen(true)}
          onExecute={setExecuteAgent}
        />
      )}

      <VpsWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => setWizardOpen(false)}
      />
    </div>
  );
}
