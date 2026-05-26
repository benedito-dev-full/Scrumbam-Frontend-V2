'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Play, Server, Wifi, WifiOff, Clock } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useDeleteAgent } from '@/hooks/use-agents';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto } from '@/lib/types/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgentCardProps {
  /** Agente a ser exibido no card */
  agent: AgentDto;
  /** Callback ao clicar em "Executar" — recebe o agente completo */
  onExecute: (agent: AgentDto) => void;
}

// ─── Configuração de status ───────────────────────────────────────────────────

/**
 * Mapeia status do agente para configuração visual do badge.
 */
const STATUS_CONFIG = {
  online: {
    label: 'Online',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.25)',
    Icon: Wifi,
  },
  offline: {
    label: 'Offline',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.12)',
    border: 'rgba(107,114,128,0.25)',
    Icon: WifiOff,
  },
  pending_install: {
    label: 'Instalando',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    Icon: Clock,
  },
  never_connected: {
    label: 'Nunca conectou',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    Icon: Clock,
  },
} as const;


// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Card de exibição de um agente VPS na lista de agentes.
 *
 * Mostra nome, hostname, status, último heartbeat, nível de autonomia e
 * ações de executar (só habilitado quando online) e remover.
 *
 * @example
 * <AgentCard agent={agent} onExecute={(a) => openExecutionModal(a)} />
 */
export function AgentCard({ agent, onExecute }: AgentCardProps) {
  const deleteAgent = useDeleteAgent();
  const cfg = STATUS_CONFIG[agent.status];

  function handleDelete() {
    if (confirm(`Remover o agente "${agent.nome}"?`)) {
      deleteAgent.mutate(agent.id);
    }
  }

  const canExecute = agent.status === 'online';

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'border-color .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
    >
      {/* Linha superior: ícone + nome + badge status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Ícone servidor */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              flexShrink: 0,
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Server size={18} color="#22d3ee" strokeWidth={1.5} />
          </div>

          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#e4e4e4',
                marginBottom: 2,
              }}
            >
              {agent.nome}
            </p>
            <p style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>
              {agent.hostname ?? '—'}
            </p>
          </div>
        </div>

        {/* Badge status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            flexShrink: 0,
          }}
        >
          <cfg.Icon size={11} color={cfg.color} strokeWidth={2} />
          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Linha de metadados */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {agent.lastHeartbeat && (
          <span style={{ fontSize: 11, color: '#555' }}>
            Último sinal{' '}
            {formatDistanceToNow(new Date(agent.lastHeartbeat), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        )}
        {agent.agentVersion && (
          <span
            style={{
              fontSize: 11,
              color: '#555',
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            v{agent.agentVersion}
          </span>
        )}
      </div>

      {/* Ações */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 14,
        }}
      >
        <button
          type="button"
          onClick={() => onExecute(agent)}
          disabled={!canExecute}
          aria-label={`Executar agente ${agent.nome}`}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            border: 'none',
            cursor: canExecute ? 'pointer' : 'not-allowed',
            background: canExecute
              ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
              : 'rgba(255,255,255,0.04)',
            color: canExecute ? '#fff' : '#444',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'opacity .15s',
            opacity: canExecute ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (canExecute) e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            if (canExecute) e.currentTarget.style.opacity = '1';
          }}
        >
          <Play size={13} strokeWidth={2} />
          Executar
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteAgent.isPending}
          aria-label={`Remover agente ${agent.nome}`}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'none',
            cursor: deleteAgent.isPending ? 'not-allowed' : 'pointer',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color .15s, border-color .15s',
            opacity: deleteAgent.isPending ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!deleteAgent.isPending) {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#555';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          }}
        >
          <Trash2 size={14} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}
