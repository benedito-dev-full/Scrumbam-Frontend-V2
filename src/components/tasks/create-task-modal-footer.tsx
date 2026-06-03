"use client";

import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

type CreateTaskTab = "tarefa" | "documento";

interface CreateTaskModalFooterProps {
  activeTab: CreateTaskTab;
  isCreating: boolean;
  docPrivado: boolean;
  onDocPrivadoChange: (value: boolean) => void;
  onCreateTask: () => void;
  onClose: () => void;
}

export function CreateTaskModalFooter({
  activeTab,
  isCreating,
  docPrivado,
  onDocPrivadoChange,
  onCreateTask,
  onClose,
}: CreateTaskModalFooterProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderTop: "1px solid var(--border)",
        background: "#111111",
        flexShrink: 0,
      }}
    >
      {activeTab === "tarefa" ? (
        <>
          <div />
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              height: 32,
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            <button
              type="button"
              onClick={onCreateTask}
              disabled={isCreating}
              style={{
                padding: "0 16px",
                background: isCreating ? "#c4c4c4" : "#f0f0f0",
                border: "none",
                cursor: isCreating ? "not-allowed" : "pointer",
                color: "#111",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                if (!isCreating) e.currentTarget.style.background = "#fff";
              }}
              onMouseLeave={(e) => {
                if (!isCreating) e.currentTarget.style.background = "#f0f0f0";
              }}
            >
              {isCreating ? "Criando..." : "Criar Tarefa"}
            </button>
            <div style={{ width: 1, background: "rgba(0,0,0,0.2)" }} />
            <button
              type="button"
              style={{
                width: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f0f0f0",
                border: "none",
                cursor: "pointer",
                color: "#555",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f0f0f0";
              }}
            >
              <ChevronDown size={12} />
            </button>
          </div>
        </>
      ) : activeTab === "documento" ? (
        <>
          <button
            type="button"
            onClick={() => onDocPrivadoChange(!docPrivado)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a1a1aa",
              fontSize: 13,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                width: 34,
                height: 18,
                borderRadius: 9,
                background: docPrivado ? "#7c3aed" : "#3a3a42",
                padding: "0 2px",
                transition: "background 150ms",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#fff",
                  transform: docPrivado ? "translateX(16px)" : "translateX(0)",
                  transition: "transform 150ms",
                }}
              />
            </span>
            Privado
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success("Documento criado!");
              onClose();
            }}
            style={{
              height: 34,
              padding: "0 20px",
              borderRadius: 7,
              background: "#e4e4e4",
              border: "none",
              cursor: "pointer",
              color: "#111",
              fontSize: 13,
              fontWeight: 600,
              transition: "background 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#e4e4e4";
            }}
          >
            Criar documento
          </button>
        </>
      ) : (
        <div />
      )}
    </div>
  );
}
