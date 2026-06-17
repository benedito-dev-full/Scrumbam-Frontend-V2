"use client";

import { useState } from "react";

import { Check, Lock } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ALL_MCP_SCOPES,
  MCP_PRESETS,
  MCP_SCOPE_META,
  presetForScopes,
  toolsForScopes,
  type McpPresetId,
  type McpScope,
} from "@/lib/mcp-scopes";

/** Mensagem padrão exibida quando o usuário não pode conceder um scope/preset. */
const DENIED_HINT =
  "Você não pode conceder esta permissão — peça acesso de gestor (MANAGER) a um administrador do projeto.";

interface ScopePickerProps {
  /** Scopes atualmente selecionados. */
  value: McpScope[];
  /** Callback ao mudar a seleção. */
  onChange: (scopes: McpScope[]) => void;
  /** Scopes que o usuário PODE conceder (de `GET /mcp/keys/allowed-scopes`). */
  allowedScopes: McpScope[];
  /** Enquanto os scopes permitidos carregam, desabilita tudo. */
  loadingAllowed?: boolean;
}

/**
 * Seletor de scopes para gerar uma chave MCP (ADR-V2-068, Fase 4).
 *
 * Oferece 4 presets (Somente Leitura / Leitura+Escrita / Acesso Total /
 * Personalizado) + 6 checkboxes individuais no modo Personalizado. Presets e
 * scopes que o usuário não pode conceder ficam desabilitados com tooltip
 * explicativo (role-aware via `allowedScopes`). Mostra também as tools que a
 * chave poderá chamar com a seleção atual.
 *
 * Construído sem Radix (o projeto não usa `@radix-ui`) — presets são botões em
 * grupo (radio-like) e os scopes são toggles com ícone de check.
 */
export function ScopePicker({
  value,
  onChange,
  allowedScopes,
  loadingAllowed = false,
}: ScopePickerProps) {
  const allowed = new Set(allowedScopes);
  const coveredTools = toolsForScopes(value);

  // Modo "Personalizado" precisa de estado próprio: derivá-lo só de
  // `presetForScopes(value)` faria o clique em "Personalizado" ser ignorado
  // sempre que os scopes atuais coincidissem com um preset (ex: vindo de
  // Acesso Total) — o picker voltaria a resolver para aquele preset.
  // Quando o usuário NÃO está em modo manual, `presetForScopes` já resolve
  // para "custom" se a seleção não bater nenhum preset — não precisa de effect.
  const [customMode, setCustomMode] = useState(false);
  const activePreset: McpPresetId = customMode
    ? "custom"
    : presetForScopes(value);

  /** Um preset só é selecionável se TODOS os seus scopes forem permitidos. */
  function presetAllowed(scopes: McpScope[]): boolean {
    return scopes.every((s) => allowed.has(s));
  }

  function selectPreset(id: McpPresetId) {
    if (id === "custom") {
      // Entra em modo manual mantendo a seleção atual (sem mexer nos scopes).
      setCustomMode(true);
      return;
    }
    const preset = MCP_PRESETS.find((p) => p.id === id);
    if (preset && presetAllowed(preset.scopes)) {
      setCustomMode(false);
      onChange([...preset.scopes]);
    }
  }

  function toggleScope(scope: McpScope) {
    if (!allowed.has(scope)) return;
    onChange(
      value.includes(scope)
        ? value.filter((s) => s !== scope)
        : [...ALL_MCP_SCOPES.filter((s) => value.includes(s) || s === scope)],
    );
  }

  return (
    <TooltipProvider delay={150}>
      <div className="space-y-4">
        {/* ── Presets ── */}
        <div className="grid gap-2 sm:grid-cols-2">
          {MCP_PRESETS.map((preset) => {
            const disabled = loadingAllowed || !presetAllowed(preset.scopes);
            const selected = activePreset === preset.id;
            return (
              <PresetOption
                key={preset.id}
                label={preset.label}
                description={preset.description}
                selected={selected}
                disabled={disabled}
                onSelect={() => selectPreset(preset.id)}
              />
            );
          })}
          <PresetOption
            label="Personalizado"
            description="Escolha permissões individuais."
            selected={activePreset === "custom"}
            disabled={loadingAllowed}
            onSelect={() => selectPreset("custom")}
          />
        </div>

        {/* ── Checkboxes (modo personalizado) ── */}
        {activePreset === "custom" && (
          <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Permissões
            </p>
            {ALL_MCP_SCOPES.map((scope) => {
              const meta = MCP_SCOPE_META[scope];
              const canGrant = allowed.has(scope);
              const checked = value.includes(scope);
              return (
                <ScopeCheckbox
                  key={scope}
                  scope={scope}
                  label={meta.label}
                  description={meta.description}
                  checked={checked}
                  disabled={loadingAllowed || !canGrant}
                  onToggle={() => toggleScope(scope)}
                />
              );
            })}
          </div>
        )}

        {/* ── Tools cobertas ── */}
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Esta chave poderá chamar{" "}
            <span className="text-foreground">{coveredTools.length}</span> de{" "}
            {ALL_MCP_SCOPES.reduce(
              (n, s) => n + MCP_SCOPE_META[s].tools.length,
              0,
            )}{" "}
            ferramentas
          </p>
          {coveredTools.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              Selecione ao menos uma permissão.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {coveredTools.map((tool) => (
                <code
                  key={tool}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                >
                  {tool}
                </code>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

interface PresetOptionProps {
  label: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function PresetOption({
  label,
  description,
  selected,
  disabled,
  onSelect,
}: PresetOptionProps) {
  const button = (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50 hover:bg-card",
      )}
    >
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
        {disabled && <Lock className="size-3 text-muted-foreground" />}
        {label}
      </span>
      <span className="text-[11px] leading-snug text-muted-foreground">
        {description}
      </span>
    </button>
  );

  if (!disabled) return button;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          // span wrapper: botões disabled não disparam eventos de hover
          <span className="block" />
        }
      >
        {button}
      </TooltipTrigger>
      <TooltipContent>{DENIED_HINT}</TooltipContent>
    </Tooltip>
  );
}

interface ScopeCheckboxProps {
  scope: McpScope;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ScopeCheckbox({
  label,
  description,
  checked,
  disabled,
  onToggle,
}: ScopeCheckboxProps) {
  const row = (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors",
        !disabled && "hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background",
        )}
      >
        {checked && <Check className="size-3" />}
        {!checked && disabled && (
          <Lock className="size-2.5 text-muted-foreground" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-foreground">
          {label}
        </span>
        <span className="block text-[11px] leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );

  if (!disabled) return row;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="block" />}>{row}</TooltipTrigger>
      <TooltipContent>{DENIED_HINT}</TooltipContent>
    </Tooltip>
  );
}
