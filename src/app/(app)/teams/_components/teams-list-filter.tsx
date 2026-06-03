"use client";

import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ══════════════════════════════════════════════════════════════════
   FILTER DROPDOWN — botao generico de filtro estilo topbar
══════════════════════════════════════════════════════════════════ */

/**
 * Botao de filtro generico estilo "topbar" (membros/criado/criador/classificar).
 * Mantem visual igual ao botao antigo + dropdown shadcn/Base UI.
 */
export function FilterDropdown<T extends string>({
  label,
  active,
  options,
  value,
  onChange,
  clearable = false,
}: {
  label: string;
  active: boolean;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  /** Se true, mostra item "Todas" no topo para limpar a selecao. */
  clearable?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            style={{
              height: 28,
              padding: "0 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: active ? "var(--border)" : "none",
              cursor: "pointer",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              if (!active)
                e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </span>
            <ChevronDown size={11} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-44">
        <DropdownMenuGroup>
          {clearable && (
            <DropdownMenuItem
              className="text-[13px]"
              onClick={() => onChange(null)}
            >
              <span style={{ flex: 1 }}>Todas</span>
              {value === null && <Check size={13} strokeWidth={2} />}
            </DropdownMenuItem>
          )}
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.id}
              className="text-[13px]"
              onClick={() => onChange(opt.id)}
            >
              <span style={{ flex: 1 }}>{opt.label}</span>
              {value === opt.id && <Check size={13} strokeWidth={2} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

