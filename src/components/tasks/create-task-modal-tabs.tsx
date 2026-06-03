"use client";

import { X } from "lucide-react";

type CreateTaskTab = "tarefa" | "documento";

interface CreateTaskModalTabsProps {
  activeTab: CreateTaskTab;
  onActiveTabChange: (tab: CreateTaskTab) => void;
  onClose: () => void;
}

const TABS: Array<[CreateTaskTab, string]> = [
  ["tarefa", "Tarefa"],
  ["documento", "Documento"],
];

export function CreateTaskModalTabs({
  activeTab,
  onActiveTabChange,
  onClose,
}: CreateTaskModalTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid var(--border)",
        background: "#111111",
        flexShrink: 0,
        gap: 2,
      }}
    >
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onActiveTabChange(id)}
          style={{
            height: 42,
            padding: "0 12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: activeTab === id ? 600 : 400,
            color: activeTab === id ? "#e4e4e4" : "#6b6b74",
            borderBottom:
              activeTab === id
                ? "2px solid #7c3aed"
                : "2px solid transparent",
            transition: "color 120ms",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== id) e.currentTarget.style.color = "#a1a1aa";
          }}
          onMouseLeave={(e) => {
            if (activeTab !== id) e.currentTarget.style.color = "#6b6b74";
          }}
        >
          {label}
        </button>
      ))}

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        style={{
          marginLeft: "auto",
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "none",
          cursor: "pointer",
          color: "#6b6b74",
          transition: "background 120ms, color 120ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#2a2a2f";
          e.currentTarget.style.color = "#c4c4c4";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "#6b6b74";
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
