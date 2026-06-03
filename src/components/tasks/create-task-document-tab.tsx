"use client";

import { ChevronDown, FileText, Sparkles } from "lucide-react";

import {
  chipStyle,
  docActionStyle,
  docItemHover,
} from "@/components/tasks/create-task-modal-parts";

interface CreateTaskDocumentTabProps {
  docNome: string;
  onDocNomeChange: (value: string) => void;
}

export function CreateTaskDocumentTab({
  docNome,
  onDocNomeChange,
}: CreateTaskDocumentTabProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
      <div style={{ marginBottom: "calc(var(--section-gap) + 4px)" }}>
        <button type="button" style={chipStyle}>
          <span style={{ fontSize: 13, lineHeight: 1 }}>☰</span>
          <span style={{ fontSize: 12, color: "#a1a1aa" }}>
            Meus documentos
          </span>
          <ChevronDown size={11} color="var(--muted-foreground)" />
        </button>
      </div>

      <input
        autoFocus
        type="text"
        value={docNome}
        onChange={(e) => onDocNomeChange(e.target.value)}
        placeholder="Dê um nome a este documento..."
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "none",
          border: "none",
          outline: "none",
          color: docNome ? "#e4e4e4" : "#4a4a54",
          fontSize: 18,
          fontWeight: 500,
          fontFamily: "inherit",
          padding: 0,
          marginBottom: "calc(var(--section-gap) + 4px)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          marginBottom: "calc(var(--section-gap) + 8px)",
        }}
      >
        <button type="button" style={docActionStyle} {...docItemHover}>
          <FileText size={15} style={{ color: "#71717a", flexShrink: 0 }} />
          <span>Comece a escrever</span>
        </button>
        <button type="button" style={docActionStyle} {...docItemHover}>
          <Sparkles size={15} style={{ color: "#a78bfa", flexShrink: 0 }} />
          <span>Escrever com IA</span>
        </button>
      </div>
    </div>
  );
}
