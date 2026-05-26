"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SpaceChip } from "@/components/shell/space-chip";
import { IcCaret } from "@/components/shell/entity-page";
import { useSpaces } from "@/hooks/use-projects";
import type { DProjectDto } from "@/lib/types/api";

interface SpaceSwitcherProps {
  /** ID do espaço atualmente aberto. Marcado como ativo no menu. */
  currentSpaceId: string;
  /** Nome do espaço atual — exibido no trigger enquanto a lista carrega. */
  currentSpaceName: string;
}

/**
 * Botão "Nome do espaço ▾" do header de `/spaces/[id]`. Ao abrir, lista
 * apenas os espaços aos quais o usuário tem acesso — segurança garantida
 * pelo backend via `GET /projects?idClasse=-350`, que já aplica:
 *
 * - Camada A: espaços públicos da org (qualquer DVincula -161/-162/-163)
 * - Camada B: espaços privados com DVincula explícita -171/-172/-173
 *
 * Ou seja, espaços privados em que o usuário não é membro NÃO chegam ao
 * client — não há risco de leak no frontend.
 *
 * Clicar em um espaço diferente faz `router.push('/spaces/{id}')`.
 */
export function SpaceSwitcher({ currentSpaceId, currentSpaceName }: SpaceSwitcherProps) {
  const router = useRouter();
  const { data: spaces, isLoading } = useSpaces();

  const sorted = [...(spaces ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const others = sorted.filter((s) => s.id !== currentSpaceId);
  const current = sorted.find((s) => s.id === currentSpaceId);

  const handleSelect = (id: string) => {
    if (id === currentSpaceId) return;
    router.push(`/spaces/${id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Trocar de espaço"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: 0,
              background: "none",
              cursor: "pointer",
              color: "#e4e4e4",
              fontSize: 14,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 5,
              transition: "background .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          />
        }
      >
        {currentSpaceName}
        <IcCaret />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={6} style={{ width: 260, padding: "6px 0" }}>
        <p style={{ fontSize: 11, color: "#505058", padding: "6px 12px 4px", fontWeight: 500 }}>
          Alternar espaço
        </p>

        {current && <SpaceRow space={current} active onSelect={handleSelect} />}

        {others.length > 0 && current && (
          <DropdownMenuSeparator style={{ margin: "4px 0" }} />
        )}

        {others.map((space) => (
          <SpaceRow key={space.id} space={space} onSelect={handleSelect} />
        ))}

        {isLoading && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 36, color: "#505058", fontSize: 13, gap: 6,
          }}>
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            Carregando espaços…
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div style={{ padding: "8px 12px", color: "#606068", fontSize: 12 }}>
            Nenhum outro espaço disponível.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SpaceRowProps {
  space: DProjectDto;
  active?: boolean;
  onSelect: (id: string) => void;
}

function SpaceRow({ space, active, onSelect }: SpaceRowProps) {
  const iniciais = space.nome.slice(0, 2).toUpperCase();
  const cor = space.color ?? "#6366f1";

  return (
    <button
      type="button"
      onClick={() => onSelect(space.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        height: 36,
        padding: "0 12px",
        border: 0,
        background: active ? "rgba(124,111,247,0.10)" : "none",
        cursor: active ? "default" : "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? "rgba(124,111,247,0.10)" : "none";
      }}
    >
      <SpaceChip iniciais={iniciais} cor={cor} iconName={space.icon} size="sm" />
      <span style={{
        fontSize: 13,
        color: active ? "#e4e4e4" : "#c4c4c4",
        fontWeight: active ? 500 : 400,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {space.nome}
      </span>
      {active && (
        <div
          aria-hidden
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c6ff7", flexShrink: 0 }}
        />
      )}
    </button>
  );
}
