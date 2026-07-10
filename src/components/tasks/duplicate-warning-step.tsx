"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { AlertTriangle, ArrowUpRight, CopyCheck } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { formatSince } from "@/lib/format-since";
import type { TaskDuplicateResult } from "@/lib/types/api";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DuplicateWarningStepProps {
  /** Candidatas retornadas por `GET /tasks/check-duplicates` (exatas primeiro). */
  candidates: TaskDuplicateResult[];
  /** `true` enquanto a mutação de criação está em voo (desabilita os botões). */
  isCreating: boolean;
  /** Prossegue com a criação mesmo com duplicatas (bypass consciente). */
  onCreateAnyway: () => void;
  /** Volta ao formulário (não cria). */
  onCancel: () => void;
  /** Navega para a task existente (abre a List que a contém). */
  onOpenExisting: (candidate: TaskDuplicateResult) => void;
}

// ─── DuplicateWarningStep ───────────────────────────────────────────────────────

/**
 * Passo intermediário do modal de criação: "encontramos tarefas parecidas"
 * (task #799 / DEV-128).
 *
 * Renderiza SOMENTE quando a checagem de duplicatas retornou candidatas. É uma
 * cortesia/atrito consciente — NUNCA bloqueia: o usuário sempre pode "Criar
 * mesmo assim". Também oferece "abrir a existente" para evitar recriar algo que
 * já existe (inclusive tasks concluídas — decisão #4, exibindo o status).
 *
 * Espelha a semântica do `TakeoverConfirmDialog` (task #795): paleta âmbar de
 * alerta e dois caminhos claros (prosseguir / voltar). Mantém a linguagem visual
 * dark do próprio `CreateTaskModal` (overlay inline) em vez do shadcn Dialog,
 * para não destoar dentro do modal customizado.
 *
 * @param candidates     - Lista de possíveis duplicatas (máx 5).
 * @param isCreating     - Trava os botões durante a criação.
 * @param onCreateAnyway - Cria mesmo assim (bypass).
 * @param onCancel       - Volta ao formulário.
 * @param onOpenExisting - Abre a task existente.
 */
export function DuplicateWarningStep({
  candidates,
  isCreating,
  onCreateAnyway,
  onCancel,
  onOpenExisting,
}: DuplicateWarningStepProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        background: "#111111",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ padding: "20px 20px 12px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 11,
            background: "rgba(245,158,11,0.10)",
            marginBottom: 12,
          }}
        >
          <AlertTriangle size={20} style={{ color: "#fbbf24" }} />
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            color: "#e4e4e4",
            lineHeight: 1.3,
          }}
        >
          Encontramos tarefas parecidas
        </h2>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 13,
            color: "#8b8b94",
            lineHeight: 1.5,
          }}
        >
          Já existe{" "}
          {candidates.length === 1
            ? "uma tarefa parecida"
            : "tarefas parecidas"}{" "}
          nesta lista. Confira antes de continuar — ou crie mesmo assim.
        </p>
      </div>

      {/* Lista de candidatas */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {candidates.map((c) => {
          const exact = c.matchType === "exact";
          return (
            <button
              key={c.chave}
              type="button"
              onClick={() => onOpenExisting(c)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                width: "100%",
                textAlign: "left",
                background: "var(--border)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 12px",
                cursor: "pointer",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1c1c22";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--border)";
              }}
            >
              <CopyCheck
                size={15}
                style={{ color: "#8b8b94", flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      padding: "1px 6px",
                      borderRadius: 4,
                      color: exact ? "#fbbf24" : "#a1a1aa",
                      background: exact
                        ? "rgba(245,158,11,0.12)"
                        : "rgba(161,161,170,0.12)",
                      flexShrink: 0,
                    }}
                  >
                    {exact ? "Idêntica" : "Parecida"}
                  </span>
                  {c.identifier && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6b6b74",
                        flexShrink: 0,
                      }}
                    >
                      {c.identifier}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#d4d4d8",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.nome}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b6b74",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.projectNome ?? "Lista"} · criada {formatSince(c.criadoEm)}
                </div>
              </div>
              <ArrowUpRight
                size={14}
                style={{ color: "#6b6b74", flexShrink: 0, marginTop: 2 }}
              />
            </button>
          );
        })}
      </div>

      {/* Rodapé de ações */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          padding: "16px 20px",
          flexShrink: 0,
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isCreating}
          style={{
            height: 34,
            padding: "0 14px",
            borderRadius: 7,
            border: "1px solid var(--border)",
            background: "none",
            color: "#c4c4c4",
            fontSize: 13,
            fontWeight: 500,
            cursor: isCreating ? "default" : "pointer",
            opacity: isCreating ? 0.6 : 1,
          }}
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onCreateAnyway}
          disabled={isCreating}
          style={{
            height: 34,
            padding: "0 14px",
            borderRadius: 7,
            border: "1px solid rgba(245,158,11,0.30)",
            background: "rgba(245,158,11,0.12)",
            color: "#fbbf24",
            fontSize: 13,
            fontWeight: 600,
            cursor: isCreating ? "default" : "pointer",
            opacity: isCreating ? 0.6 : 1,
          }}
        >
          {isCreating ? "Criando…" : "Criar mesmo assim"}
        </button>
      </div>
    </div>
  );
}
