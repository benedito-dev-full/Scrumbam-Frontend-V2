"use client";

import { useState } from "react";
import { Bot, ChevronDown, User, Users } from "lucide-react";
import { useProjectMembers } from "@/hooks/use-members";
import { useTeams } from "@/hooks/use-teams";
import { AI_ASSIGNEE_ID } from "@/hooks/use-task-execution";
import { cn } from "@/lib/utils";

// â”€â”€â”€ AssigneePicker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AssigneePicker({
  projectId,
  current,
  currentTeamId = null,
  onChange,
  onTeamChange,
  disabled = false,
}: {
  projectId: string;
  current: string | null;
  currentTeamId?: string | null;
  onChange: (id: string | null) => void;
  onTeamChange?: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: members = [] } = useProjectMembers(projectId);
  const { data: teams = [] } = useTeams();

  const isAi = current === AI_ASSIGNEE_ID;
  const assignedMember = members.find((m) => m.userId === current) ?? null;
  const assignedTeam = teams.find((t) => t.id === currentTeamId) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        disabled={disabled}
        title={
          disabled ? "Em execuÃ§Ã£o pela IA â€” nÃ£o Ã© possÃ­vel alterar" : undefined
        }
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] transition-colors",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-ring/60",
        )}
      >
        {isAi ? (
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-violet-500/15">
              <Bot className="size-3 text-violet-400" />
            </div>
            <span className="font-medium text-foreground">IA</span>
            <span className="rounded-full bg-violet-500/10 px-1.5 py-px text-[10px] font-semibold text-violet-400">
              automÃ¡tico
            </span>
          </div>
        ) : assignedMember ? (
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
              {assignedMember.nome.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-foreground">
              {assignedMember.nome}
            </span>
          </div>
        ) : assignedTeam ? (
          <div className="flex items-center gap-2">
            <span
              className="size-5 shrink-0 rounded-full"
              style={{
                background: assignedTeam.color ?? "var(--muted-foreground)",
              }}
            />
            <span className="font-medium text-foreground">
              {assignedTeam.nome}
            </span>
            <span className="rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
              time
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Sem responsÃ¡vel</span>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex flex-col gap-0.5 p-1">
            {/* OpÃ§Ã£o IA */}
            <button
              type="button"
              onClick={() => {
                onChange(AI_ASSIGNEE_ID);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                isAi && "bg-violet-500/10",
              )}
            >
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                <Bot className="size-3 text-violet-400" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-semibold text-foreground">IA</span>
                <span className="text-[11px] text-muted-foreground">
                  Executar automaticamente
                </span>
              </div>
              {isAi && <span className="size-1.5 rounded-full bg-violet-400" />}
            </button>

            {/* Divisor */}
            {members.length > 0 && (
              <div className="my-1 border-t border-border" />
            )}

            {/* Membros do projeto */}
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => {
                  onChange(m.userId);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                  current === m.userId && "bg-muted",
                )}
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-foreground">{m.nome}</span>
                  {m.cargo && (
                    <span className="text-[11px] text-muted-foreground">
                      {m.cargo}
                    </span>
                  )}
                </div>
                {current === m.userId && (
                  <span className="size-1.5 rounded-full bg-foreground/40" />
                )}
              </button>
            ))}

            {/* SeÃ§Ã£o Times */}
            {teams.length > 0 && (
              <>
                <div className="my-1 border-t border-border" />
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Times
                </p>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      // Selecionar um time limpa o responsÃ¡vel individual (e vice-versa)
                      onChange(null);
                      onTeamChange?.(
                        currentTeamId === team.id ? null : team.id,
                      );
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                      currentTeamId === team.id && "bg-muted",
                    )}
                  >
                    <span
                      className="size-5 shrink-0 rounded-full"
                      style={{
                        background: team.color ?? "var(--muted-foreground)",
                      }}
                    />
                    <span className="font-medium text-foreground">
                      {team.nome}
                    </span>
                    {currentTeamId === team.id && (
                      <span className="ml-auto size-1.5 rounded-full bg-foreground/40" />
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Remover */}
            {(current || currentTeamId) && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    onTeamChange?.(null);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted"
                >
                  <User className="size-3.5" />
                  Remover responsÃ¡vel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ TeamPicker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Seletor dropdown para atribuiÃ§Ã£o de time a uma task (assigneeTeamId).
 * Carrega lista de times via `useTeams()`, permite selecionar ou remover.
 * @param current - ID do time atualmente atribuÃ­do, ou null se nenhum
 * @param onChange - Callback invocado quando team Ã© selecionado ou removido
 * @param disabled - Se true, desabilita a seleÃ§Ã£o (ex: task em execuÃ§Ã£o)
 */
export function TeamPicker({
  current,
  onChange,
  disabled = false,
}: {
  current: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: teams = [] } = useTeams();
  const assignedTeam = teams.find((t) => t.id === current) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        disabled={disabled}
        title={
          disabled ? "Em execuÃ§Ã£o pela IA â€” nÃ£o Ã© possÃ­vel alterar" : undefined
        }
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] transition-colors",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-ring/60",
        )}
      >
        {assignedTeam ? (
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{
                background: assignedTeam.color ?? "var(--muted-foreground)",
              }}
            />
            <span className="font-medium text-foreground">
              {assignedTeam.nome}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Sem time</span>
          </div>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex flex-col gap-0.5 p-1">
            {/* Times disponÃ­veis */}
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  onChange(team.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                  current === team.id && "bg-muted",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background: team.color ?? "var(--muted-foreground)",
                  }}
                />
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-foreground">
                    {team.nome}
                  </span>
                  {team.memberCount !== undefined && (
                    <span className="text-[11px] text-muted-foreground">
                      {team.memberCount} membro
                      {team.memberCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {current === team.id && (
                  <span className="size-1.5 rounded-full bg-foreground/40" />
                )}
              </button>
            ))}

            {teams.length === 0 && (
              <span className="px-2.5 py-2 text-[12px] text-muted-foreground">
                Nenhum time disponÃ­vel
              </span>
            )}

            {/* Remover time */}
            {current && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Users className="size-3.5" />
                  Remover time
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

