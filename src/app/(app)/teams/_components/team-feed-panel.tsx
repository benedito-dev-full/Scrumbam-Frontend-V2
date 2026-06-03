"use client";

import { Loader2 } from "lucide-react";

import { useTeamFeed } from "@/hooks/use-teams";
import type { TeamFeedItemDto } from "@/lib/types/api";
import { avatarColor } from "./team-detail-tabs";

const FEED_ACTION_LABEL: Record<string, string> = {
  TASK_CREATED: "criou a task",
  TASK_ASSIGNED: "atribuiu a task",
  TASK_STATUS_CHANGED: "mudou o status de",
  TASK_COMPLETED: "concluiu a task",
};

const FEED_ACTION_COLOR: Record<string, string> = {
  TASK_CREATED: "#3b82f6",
  TASK_ASSIGNED: "#a855f7",
  TASK_STATUS_CHANGED: "#f59e0b",
  TASK_COMPLETED: "#22c55e",
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function FeedItem({ item }: { item: TeamFeedItemDto }) {
  const label = FEED_ACTION_LABEL[item.acao] ?? item.acao;
  const color = FEED_ACTION_COLOR[item.acao] ?? "var(--muted-foreground)";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: item.userName
            ? avatarColor(item.userName)
            : "var(--border)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {item.userName ? item.userName.charAt(0).toUpperCase() : "?"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.5 }}
        >
          <strong style={{ fontWeight: 600 }}>
            {item.userName ?? "Alguém"}
          </strong>{" "}
          <span style={{ color }}>{label}</span>{" "}
          {item.taskNome && (
            <strong style={{ fontWeight: 600 }}>{item.taskNome}</strong>
          )}
          {item.acao === "TASK_STATUS_CHANGED" &&
            item.statusAnterior &&
            item.statusNovo && (
              <span style={{ color: "var(--muted-foreground)" }}>
                {" "}
                ({item.statusAnterior} → {item.statusNovo})
              </span>
            )}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--muted-foreground)",
            marginTop: 2,
          }}
        >
          {formatRelative(item.criadoEm)}
        </p>
      </div>
    </div>
  );
}

export function FeedPanel({ teamId }: { teamId: string }) {
  const { data, isLoading, isError } = useTeamFeed(teamId);
  const items = data?.items ?? [];

  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--card)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: items.length > 0 ? 8 : 24,
        }}
      >
        <p
          style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}
        >
          Feed{" "}
          {items.length > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "var(--muted-foreground)",
                fontWeight: 400,
              }}
            >
              ({items.length})
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "24px 0",
            color: "var(--muted-foreground)",
          }}
        >
          <Loader2
            size={14}
            strokeWidth={2}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span style={{ fontSize: 12 }}>Carregando feed...</span>
        </div>
      ) : isError ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          Não foi possível carregar o feed.
        </p>
      ) : items.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "24px 0 32px",
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            Nada para ver aqui
          </p>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            Parece que você ainda não tem nenhuma atividade de tarefas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

