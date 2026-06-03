"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Search, UserMinus } from "lucide-react";

import {
  useAddTeamMember,
  useRemoveTeamMember,
  useTeamMembers,
} from "@/hooks/use-teams";
import { useOrgMembers } from "@/hooks/use-org-members";
import type { OrgMemberDto, TeamMemberDto } from "@/lib/types/api";
import { avatarColor } from "./team-detail-tabs";

export function AddMemberPopover({
  teamId,
  currentMembers,
  anchorRef,
  onClose,
}: {
  teamId: string;
  currentMembers: TeamMemberDto[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: orgMembers = [] } = useOrgMembers();
  const addMember = useAddTeamMember(teamId);
  const alreadyInTeam = new Set(currentMembers.map((m) => m.userId));

  const filtered = orgMembers.filter((m: OrgMemberDto) => {
    const inTeam = alreadyInTeam.has(m.userId);
    const matchSearch =
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSearch && !inTeam;
  });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setTimeout(() => inputRef.current?.focus(), 50);
    const handler = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      )
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const handleAdd = async (member: OrgMemberDto) => {
    if (adding || added.has(member.userId)) return;
    setAdding(member.userId);
    try {
      await addMember.mutateAsync({ userId: member.userId, cargo: "MEMBER" });
      setAdded((prev) => new Set(prev).add(member.userId));
    } catch {
      /* silencia */
    } finally {
      setAdding(null);
    }
  };

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos.top,
        right: pos.right,
        width: 260,
        borderRadius: 10,
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 10px 6px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            height: 32,
            borderRadius: 7,
            background: "var(--border)",
            padding: "0 10px",
          }}
        >
          <Search
            size={13}
            strokeWidth={2}
            style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busque ou insira o e-mail..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--foreground)",
              fontSize: 12,
            }}
          />
        </div>
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto", padding: "4px 0" }}>
        {filtered.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              padding: "12px 14px",
            }}
          >
            {search
              ? "Nenhum resultado."
              : "Todos os membros já estão no time."}
          </p>
        ) : (
          filtered.map((m: OrgMemberDto) => {
            const isAdded = added.has(m.userId);
            const isLoading = adding === m.userId;
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => handleAdd(m)}
                disabled={isAdded || isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  padding: "7px 12px",
                  border: "none",
                  background: "none",
                  cursor: isAdded ? "default" : "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!isAdded)
                    e.currentTarget.style.background = "var(--border)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: avatarColor(m.nome),
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--foreground)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.nome}
                  </p>
                  {m.email && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--muted-foreground)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.email}
                    </p>
                  )}
                </div>
                {isLoading && (
                  <Loader2
                    size={13}
                    strokeWidth={2}
                    style={{
                      color: "var(--muted-foreground)",
                      flexShrink: 0,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                {isAdded && (
                  <Check
                    size={13}
                    strokeWidth={2.5}
                    style={{ color: "#22c55e", flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER ROW
══════════════════════════════════════════════════════════════════ */

function MemberRow({
  member,
  onRemove,
  isRemoving,
}: {
  member: TeamMemberDto;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 4px",
        borderRadius: 6,
        background: hovered ? "var(--border)" : "none",
        transition: "background .12s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: avatarColor(member.nome),
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {member.nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            color: "var(--foreground)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {member.nome}
        </p>
        <p style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
          {member.cargo === "LEAD" ? "Lead" : "Membro"}
        </p>
      </div>
      <button
        type="button"
        title="Remover do time"
        disabled={isRemoving}
        onClick={onRemove}
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          border: "none",
          background: "none",
          cursor: isRemoving ? "not-allowed" : "pointer",
          color: "#dc2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(220,38,38,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
        }}
      >
        <UserMinus size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBERS PANEL
══════════════════════════════════════════════════════════════════ */

export function MembersPanel({ teamId }: { teamId: string }) {
  const { data: members = [], isLoading } = useTeamMembers(teamId);
  const removeMember = useRemoveTeamMember(teamId);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--card)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: members.length > 0 ? 12 : 4,
        }}
      >
        <p
          style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}
        >
          Membros{" "}
          {members.length > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "var(--muted-foreground)",
                fontWeight: 400,
              }}
            >
              ({members.length})
            </span>
          )}
        </p>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted-foreground)";
          }}
        >
          <Plus size={13} strokeWidth={2} />
        </button>
        {popoverOpen && (
          <AddMemberPopover
            teamId={teamId}
            currentMembers={members}
            anchorRef={btnRef}
            onClose={() => setPopoverOpen(false)}
          />
        )}
      </div>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 0",
            color: "var(--muted-foreground)",
          }}
        >
          <Loader2
            size={13}
            strokeWidth={2}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span style={{ fontSize: 12 }}>Carregando...</span>
        </div>
      ) : members.length === 0 ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            marginTop: 6,
          }}
        >
          Nenhum membro ainda.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {members.map((m: TeamMemberDto) => (
            <MemberRow
              key={m.userId}
              member={m}
              onRemove={() => removeMember.mutate(m.userId)}
              isRemoving={removeMember.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ABA VISÃO GERAL
══════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   FEED PANEL — atividades do time (DEvento)
   Consome GET /teams/:id/feed (TASK_CREATED, TASK_ASSIGNED,
   TASK_STATUS_CHANGED, TASK_COMPLETED)
══════════════════════════════════════════════════════════════════ */

