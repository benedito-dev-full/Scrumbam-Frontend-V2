"use client";

import { useEffect, useState } from "react";
import { Hourglass, ShieldAlert } from "lucide-react";
import { useProject } from "@/hooks/use-projects";
import {
  formatExpiresIn,
  friendlyRiskReason,
  useExecutionDecision,
} from "@/hooks/use-execution-approval";
import type {
  ExecutionResponseDto,
  TaskExecution,
} from "@/hooks/use-task-execution";
import { cn } from "@/lib/utils";
import { RejectExecutionDialog } from "./reject-execution-dialog";

interface ApprovalCardProps {
  executionId: string;
  projectId: string;
  /** Nível vindo do store/activeExecution (usado até o detalhe carregar). */
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | null;
  /** Estado atual da execução (store ou detalhe) — fonte de risco/expiração. */
  current: Pick<TaskExecution, "risk" | "approval"> | null;
  /** Recebe o estado mais recente após aprovar/rejeitar/409. */
  onDecided: (data: ExecutionResponseDto) => void;
}

const LEVEL_STYLE = {
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  HIGH: "border-red-500/30 bg-red-500/10 text-red-300",
  LOW: "border-border bg-muted/30 text-muted-foreground",
} as const;

const LEVEL_LABEL = { MEDIUM: "Risco médio", HIGH: "Risco alto", LOW: "Risco baixo" };

/** Relógio que reavalia o "expira em" a cada 30s. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Cartão "aguardando aprovação" da execução de IA.
 *
 * Mostra nível/motivo do risco e a expiração. Gestor do projeto
 * (`myRole === "MANAGER"`) vê Aprovar/Rejeitar; os demais veem só o aviso.
 */
export function ApprovalCard({
  executionId,
  projectId,
  riskLevel,
  current,
  onDecided,
}: ApprovalCardProps) {
  const { data: project } = useProject(projectId);
  const decision = useExecutionDecision(executionId, onDecided);
  const [rejectOpen, setRejectOpen] = useState(false);
  const now = useNow();

  const level = riskLevel;
  const risk = current?.risk ?? null;
  const expiresAt = current?.approval?.expiresAt ?? null;
  const expired = !!expiresAt && new Date(expiresAt).getTime() <= now;
  const isManager =
    !expired &&
    (project?.myRole
      ? project.myRole === "MANAGER"
      : project?.canManage === true) && !decision.forbidden;
  const style = LEVEL_STYLE[level ?? "LOW"];

  return (
    <div
      className={cn("flex flex-col gap-2.5 rounded-lg border p-3", style)}
      role="group"
      aria-label="Aprovação pendente"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-3.5 shrink-0" />
        <span className="text-[12px] font-semibold">
          Aguardando aprovação{level ? ` — ${LEVEL_LABEL[level]}` : ""}
        </span>
      </div>

      <p className="text-[12px] leading-relaxed opacity-90">
        {friendlyRiskReason(risk, level)}
      </p>

      {expiresAt && (
        <p
          className="flex items-center gap-1.5 text-[11px] opacity-80"
          title={new Date(expiresAt).toLocaleString("pt-BR")}
        >
          <Hourglass className="size-3" />
          {formatExpiresIn(expiresAt, now)}
        </p>
      )}

      {isManager ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={decision.isPending}
            onClick={() => void decision.approve()}
            aria-label="Aprovar execução"
            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aprovar
          </button>
          <button
            type="button"
            disabled={decision.isPending}
            onClick={() => setRejectOpen(true)}
            aria-label="Rejeitar execução"
            className="flex-1 rounded-lg border border-red-500/40 px-3 py-2 text-[12px] font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rejeitar
          </button>
        </div>
      ) : (
        !expired && (
          <p className="text-[12px] font-medium">
            Aguardando aprovação do gestor do projeto
          </p>
        )
      )}

      <RejectExecutionDialog
        open={rejectOpen && !decision.forbidden}
        onOpenChange={setRejectOpen}
        onSubmit={decision.reject}
        isPending={decision.isPending}
      />
    </div>
  );
}
