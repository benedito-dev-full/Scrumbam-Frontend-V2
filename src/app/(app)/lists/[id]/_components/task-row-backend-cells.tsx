"use client";

import React from "react";

import { IcCheck } from "@/components/lists/icons";
import { STATUS_CONFIG } from "@/components/lists/config";
import { AI_ASSIGNEE_ID } from "@/hooks/use-task-execution";
import type { ProjectMemberDto } from "@/hooks/use-members";
import {
  priorityToColor,
  priorityToLabel,
} from "@/lib/mappers/task-status.mapper";
import type {
  TaskPriority,
  TaskResponseDto,
  TeamResponseDto,
  V3Intention,
} from "@/lib/types/api";
import type { StatusVisualKey } from "../_lib/list-view-types";
import { ClaudeAvatar } from "./claude-avatar";

export function IcCalendarInline({
  size = 13,
  color = "var(--muted-foreground)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IcUserInline({
  size = 13,
  color = "var(--muted-foreground)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IcFlagInline({ size, color }: { size: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M3 2v12M3 2h8l-2 3.5L11 9H3"
        stroke={color ?? "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function dropItemStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 5,
    background: "none",
    border: 0,
    cursor: "pointer",
    color,
    fontSize: 12,
    textAlign: "left" as const,
  };
}

function assigneeItemStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "6px 10px",
    borderRadius: 6,
    background: "none",
    border: 0,
    cursor: "pointer",
    color,
    fontSize: 13,
    textAlign: "left" as const,
    transition: "background .1s",
  };
}

export const INTENTION_TO_VISUAL_ROW: Record<V3Intention, StatusVisualKey> = {
  INBOX: "backlog",
  READY: "pronto",
  EXECUTING: "em-progresso",
  VALIDATING: "em-progresso",
  DONE: "concluido",
  VALIDATED: "concluido",
  FAILED: "falhou",
  CANCELLED: "concluido",
  DISCARDED: "concluido",
};

export const VISUAL_TO_INTENTION_ROW: Record<StatusVisualKey, V3Intention> = {
  backlog: "INBOX",
  pronto: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
  atrasado: "INBOX",
};

export const PRIO_CONFIG_MAP = {
  urgente: { label: "Urgente", color: "#ef4444" },
  alta: { label: "Alta", color: "#f59e0b" },
  media: { label: "Média", color: "#60a5fa" },
  baixa: { label: "Baixa", color: "var(--muted-foreground)" },
};

export type PriorityVisualKey = keyof typeof PRIO_CONFIG_MAP;

const PRIO_VISUAL_MAP: Record<TaskPriority, PriorityVisualKey> = {
  URGENT: "urgente",
  HIGH: "alta",
  MEDIUM: "media",
  LOW: "baixa",
};

export const VISUAL_TO_BACKEND_PRIO: Record<PriorityVisualKey, TaskPriority> = {
  urgente: "URGENT",
  alta: "HIGH",
  media: "MEDIUM",
  baixa: "LOW",
};

const ALL_STATUS_VISUAL_ROW: StatusVisualKey[] = [
  "backlog",
  "pronto",
  "em-progresso",
  "concluido",
  "falhou",
];

const ALL_PRIO_VISUAL_ROW = Object.keys(
  PRIO_CONFIG_MAP,
) as PriorityVisualKey[];

interface BaseCellProps {
  tdStyle: React.CSSProperties;
}

interface TaskAssigneeCellProps extends BaseCellProps {
  task: TaskResponseDto;
  members: ProjectMemberDto[];
  teams: TeamResponseDto[];
  isOpen: boolean;
  assignee: ProjectMemberDto | null;
  assigneeTeam: TeamResponseDto | null;
  onToggle: () => void;
  onClose: () => void;
  onAssigneeChange: (memberId: string | null) => void;
  onTeamChange: (teamId: string | null) => void;
}

export function TaskAssigneeCell({
  task,
  members,
  teams,
  isOpen,
  assignee,
  assigneeTeam,
  tdStyle,
  onToggle,
  onClose,
  onAssigneeChange,
  onTeamChange,
}: TaskAssigneeCellProps) {
  const isAiAssignee = task.assigneeId === AI_ASSIGNEE_ID;
  const assigneeInitials = assignee
    ? assignee.nome
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
    : null;

  return (
    <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          background: "none",
          border: 0,
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
        title="Alterar responsável"
      >
        {isAiAssignee ? (
          <>
            <ClaudeAvatar size={22} />
            <span style={{ fontSize: 12, color: "#d97757", fontWeight: 600 }}>
              Claude
            </span>
          </>
        ) : assignee ? (
          <>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                background: "var(--accent)",
                color: "#d8ccff",
                fontSize: 9,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {assigneeInitials}
            </span>
            <span style={{ fontSize: 12, color: "var(--foreground)" }}>
              {assignee.nome.split(" ")[0]}
            </span>
          </>
        ) : assigneeTeam ? (
          <>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                background: assigneeTeam.color ?? "var(--muted-foreground)",
              }}
            />
            <span style={{ fontSize: 12, color: "var(--foreground)" }}>
              {assigneeTeam.nome}
            </span>
          </>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: "var(--muted-foreground)",
            }}
          >
            <IcUserInline size={13} color="var(--muted-foreground)" />
            <span style={{ fontSize: 12 }}>Atribuir</span>
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 100 }}
            onClick={onClose}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 101,
              background: "var(--card)",
              border: "1px solid #2e2e38",
              borderRadius: 10,
              padding: "6px",
              minWidth: 220,
              maxHeight: 320,
              overflowY: "auto",
              boxShadow: "0 12px 32px rgba(0,0,0,.6)",
            }}
          >
            <button
              type="button"
              onClick={() => onAssigneeChange(null)}
              style={{
                ...assigneeItemStyle("var(--muted-foreground)"),
                gap: 10,
              }}
            >
              <IcUserInline size={14} color="var(--muted-foreground)" />
              <span style={{ color: "var(--foreground)" }}>Sem responsável</span>
              {!task.assigneeId && <IcCheck size={12} />}
            </button>
            {members.map((member) => {
              const initials = member.nome
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase();
              const isSelected = task.assigneeId === member.userId;
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => onAssigneeChange(member.userId)}
                  style={{
                    ...assigneeItemStyle("var(--foreground)"),
                    gap: 8,
                    background: isSelected
                      ? "rgba(124,92,255,0.14)"
                      : "none",
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "var(--accent)",
                      color: "#d8ccff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {initials}
                  </span>
                  <span style={{ flex: 1, fontSize: 13 }}>{member.nome}</span>
                  {isSelected && <IcCheck size={12} />}
                </button>
              );
            })}
            <div style={{ borderTop: "1px solid #2e2e38", margin: "6px 4px" }} />
            <button
              type="button"
              onClick={() => onAssigneeChange(AI_ASSIGNEE_ID)}
              style={{
                ...assigneeItemStyle("#d97757"),
                gap: 8,
                background:
                  task.assigneeId === AI_ASSIGNEE_ID
                    ? "rgba(217,119,87,0.14)"
                    : "none",
              }}
            >
              <ClaudeAvatar size={20} />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#d97757",
                  fontWeight: 600,
                }}
              >
                Claude
              </span>
              {task.assigneeId === AI_ASSIGNEE_ID && <IcCheck size={12} />}
            </button>
            {teams.length > 0 && (
              <>
                <div
                  style={{ borderTop: "1px solid #2e2e38", margin: "6px 4px" }}
                />
                <span
                  style={{
                    display: "block",
                    padding: "2px 12px 4px",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Times
                </span>
                {teams.map((team) => {
                  const isTeamSelected = task.assigneeTeamId === team.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() =>
                        onTeamChange(isTeamSelected ? null : team.id)
                      }
                      style={{
                        ...assigneeItemStyle("var(--foreground)"),
                        gap: 8,
                        background: isTeamSelected
                          ? "rgba(124,92,255,0.14)"
                          : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: team.color ?? "var(--muted-foreground)",
                        }}
                      />
                      <span style={{ flex: 1, fontSize: 13 }}>{team.nome}</span>
                      {isTeamSelected && <IcCheck size={12} />}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </td>
  );
}

interface TaskDueDateCellProps extends BaseCellProps {
  dueDate: string | null | undefined;
  overdue: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDateChange: (value: string | null) => void;
}

export function TaskDueDateCell({
  dueDate,
  overdue,
  editing,
  tdStyle,
  onStartEdit,
  onStopEdit,
  onDateChange,
}: TaskDueDateCellProps) {
  const dateLabel = dueDate
    ? new Date(dueDate.slice(0, 10) + "T12:00:00").toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "short" },
      )
    : null;

  return (
    <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
      {editing ? (
        <input
          type="date"
          autoFocus
          defaultValue={dueDate?.slice(0, 10) ?? ""}
          onChange={(e) => onDateChange(e.target.value || null)}
          onBlur={onStopEdit}
          style={{
            background: "var(--card)",
            border: "1px solid #7c5cff",
            borderRadius: 5,
            color: "var(--foreground)",
            fontSize: 12,
            padding: "2px 6px",
            outline: "none",
            colorScheme: "dark",
          }}
        />
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          style={{
            background: "none",
            border: 0,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
          title="Alterar data"
        >
          {dateLabel ? (
            <span
              style={{
                fontSize: 12,
                color: overdue ? "#fbbf24" : "var(--muted-foreground)",
              }}
            >
              {overdue && "⚠ "}
              {dateLabel}
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <IcCalendarInline size={13} color="var(--muted-foreground)" />
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                Definir data
              </span>
            </span>
          )}
        </button>
      )}
    </td>
  );
}

interface TaskPriorityCellProps extends BaseCellProps {
  priority: TaskResponseDto["priority"];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onPriorityChange: (priority: PriorityVisualKey | null) => void;
}

export function TaskPriorityCell({
  priority,
  isOpen,
  tdStyle,
  onToggle,
  onClose,
  onPriorityChange,
}: TaskPriorityCellProps) {
  const prioColor = priorityToColor(priority);
  const prioLabel = priorityToLabel(priority);
  const currentPrioVisual = priority
    ? PRIO_VISUAL_MAP[priority as TaskPriority]
    : null;

  return (
    <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          background: "none",
          border: 0,
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
        title="Alterar prioridade"
      >
        {priority ? (
          <>
            <IcFlagInline size={12} color={prioColor} />
            <span style={{ fontSize: 12, color: prioColor }}>{prioLabel}</span>
          </>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <IcFlagInline size={12} color="var(--muted-foreground)" />
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
              Definir
            </span>
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 100 }}
            onClick={onClose}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 2px)",
              left: 0,
              zIndex: 101,
              background: "var(--card)",
              border: "1px solid #2e2e38",
              borderRadius: 8,
              padding: 4,
              minWidth: 150,
              boxShadow: "0 8px 24px rgba(0,0,0,.5)",
            }}
          >
            <button
              type="button"
              onClick={() => onPriorityChange(null)}
              style={dropItemStyle("var(--muted-foreground)")}
            >
              <IcFlagInline size={12} color="var(--muted-foreground)" />
              <span style={{ color: "var(--foreground)" }}>Sem prioridade</span>
              {!priority && <IcCheck size={11} />}
            </button>
            {ALL_PRIO_VISUAL_ROW.map((priorityKey) => {
              const cfg = PRIO_CONFIG_MAP[priorityKey];
              return (
                <button
                  key={priorityKey}
                  type="button"
                  onClick={() => onPriorityChange(priorityKey)}
                  style={dropItemStyle(cfg.color)}
                >
                  <IcFlagInline size={12} color={cfg.color} />
                  <span style={{ color: "var(--foreground)" }}>{cfg.label}</span>
                  {currentPrioVisual === priorityKey && <IcCheck size={11} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </td>
  );
}

interface TaskStatusCellProps extends BaseCellProps {
  statusVisual: StatusVisualKey;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onStatusChange: (status: StatusVisualKey) => void;
}

export function TaskStatusCell({
  statusVisual,
  isOpen,
  tdStyle,
  onToggle,
  onClose,
  onStatusChange,
}: TaskStatusCellProps) {
  const statusCfg = STATUS_CONFIG[statusVisual];
  const StatusIcon = statusCfg.Icon;

  return (
    <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          border: 0,
          cursor: "pointer",
          padding: 0,
          color: statusCfg.iconColor,
          fontSize: 12,
          fontWeight: 600,
        }}
        title="Alterar status"
      >
        <StatusIcon size={12} />
        <span>{statusCfg.label}</span>
      </button>
      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 100 }}
            onClick={onClose}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 2px)",
              left: 0,
              zIndex: 101,
              background: "var(--card)",
              border: "1px solid #2e2e38",
              borderRadius: 8,
              padding: 4,
              minWidth: 160,
              boxShadow: "0 8px 24px rgba(0,0,0,.5)",
            }}
          >
            {ALL_STATUS_VISUAL_ROW.map((statusKey) => {
              const cfg = STATUS_CONFIG[statusKey];
              const Icon = cfg.Icon;
              const isSelected = statusVisual === statusKey;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => onStatusChange(statusKey)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 5,
                    background: isSelected
                      ? "rgba(124,92,255,0.12)"
                      : "none",
                    border: 0,
                    cursor: "pointer",
                    textAlign: "left" as const,
                    color: cfg.iconColor,
                    fontSize: 12,
                  }}
                >
                  <Icon size={12} />
                  <span style={{ color: "var(--foreground)" }}>{cfg.label}</span>
                  {isSelected && <IcCheck size={11} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </td>
  );
}
