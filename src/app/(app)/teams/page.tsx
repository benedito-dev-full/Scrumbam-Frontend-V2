"use client";

import {
  Users,
  Plus,
  Mail,
  MoreHorizontal,
  Search,
  Shield,
  Crown,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SpaceChip } from "@/components/shell/space-chip";
import { cn } from "@/lib/utils";
import { mockMembros, mockVinculos, mockEntidades } from "@/lib/mocks/entidades";
import { isEspaco } from "@/lib/types/entidade";
import type { RoleEspaco } from "@/lib/types/entidade";
import { useState } from "react";

type MembroComInfo = {
  id: string;
  nome: string;
  iniciais: string;
  email: string;
  cargo: string;
  espacos: { id: string; nome: string; iniciais: string; cor: string; role: RoleEspaco }[];
};

const cargos: Record<string, string> = {
  u1: "Product Owner",
  u2: "Tech Lead",
  u3: "Marketing Manager",
  u4: "Backend Engineer",
};

const emails: Record<string, string> = {
  u1: "roberio@fortalshop.com",
  u2: "ana@fortalshop.com",
  u3: "pedro@fortalshop.com",
  u4: "julia@fortalshop.com",
};

const cores: Record<string, string> = {
  u1: "oklch(0.66 0.19 264)",
  u2: "oklch(0.65 0.18 145)",
  u3: "oklch(0.68 0.18 30)",
  u4: "oklch(0.65 0.18 300)",
};

function buildMembros(): MembroComInfo[] {
  return mockMembros.map((m) => {
    const meusvinculos = mockVinculos.filter((v) => v.membroId === m.id);
    const espacos = meusvinculos
      .map((v) => {
        const esp = mockEntidades.find((e) => isEspaco(e) && e.id === v.espacoId);
        if (!esp || !isEspaco(esp)) return null;
        return {
          id: esp.id,
          nome: esp.nome,
          iniciais: esp.meta.iniciais,
          cor: esp.meta.cor,
          role: v.role,
        };
      })
      .filter(Boolean) as MembroComInfo["espacos"];

    return {
      id: m.id,
      nome: m.nome,
      iniciais: m.iniciais,
      email: emails[m.id] ?? `${m.id}@fortalshop.com`,
      cargo: cargos[m.id] ?? "Membro",
      espacos,
    };
  });
}

const roleIcon: Record<RoleEspaco, React.ElementType> = {
  owner: Crown,
  editor: Pencil,
  viewer: Shield,
};

const roleLabel: Record<RoleEspaco, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};

const roleColor: Record<RoleEspaco, string> = {
  owner: "text-amber-400",
  editor: "text-primary",
  viewer: "text-muted-foreground",
};

export default function TeamsPage() {
  const [busca, setBusca] = useState("");
  const membros = buildMembros();
  const filtrados = busca
    ? membros.filter(
        (m) =>
          m.nome.toLowerCase().includes(busca.toLowerCase()) ||
          m.cargo.toLowerCase().includes(busca.toLowerCase()),
      )
    : membros;

  return (
    <>
      <PageHeader busca={busca} onBusca={setBusca} />

      <div className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            {filtrados.length} {filtrados.length === 1 ? "membro" : "membros"}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)_40px] items-center bg-muted/30 px-4 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="py-2.5">Membro</div>
            <div className="py-2.5">Cargo</div>
            <div className="py-2.5">Espaços</div>
            <div />
          </div>

          {filtrados.map((m, i) => (
            <MembroRow
              key={m.id}
              membro={m}
              isLast={i === filtrados.length - 1}
            />
          ))}
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-dashed border-border px-3 text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
          >
            <Mail className="size-3.5" />
            Convidar membro por e-mail
          </button>
        </div>
      </div>
    </>
  );
}

function PageHeader({
  busca,
  onBusca,
}: {
  busca: string;
  onBusca: (v: string) => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Equipes</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar membro..."
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            className="h-7 w-52 rounded-md border border-border bg-muted/40 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Convidar
        </Button>
      </div>
    </header>
  );
}

function MembroRow({
  membro: m,
  isLast,
}: {
  membro: MembroComInfo;
  isLast: boolean;
}) {
  return (
    <div
      className={cn(
        "group grid grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)_40px] items-center bg-card px-4 transition-colors hover:bg-muted/30",
        !isLast && "border-b border-border",
      )}
    >
      <div className="flex h-14 items-center gap-3">
        <Avatar>
          <AvatarFallback>{m.iniciais}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-foreground">{m.nome}</div>
          <div className="truncate text-[11px] text-muted-foreground">{m.email}</div>
        </div>
      </div>

      <div className="flex h-14 items-center">
        <span className="text-[12px] text-muted-foreground">{m.cargo}</span>
      </div>

      <div className="flex h-14 items-center gap-2 overflow-hidden">
        {m.espacos.slice(0, 3).map((e) => {
          const RoleIcon = roleIcon[e.role];
          return (
            <div
              key={e.id}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1"
            >
              <SpaceChip iniciais={e.iniciais} cor={e.cor} size="xs" />
              <span className="text-[11px] font-medium text-foreground">{e.nome}</span>
              <RoleIcon
                className={cn("size-3", roleColor[e.role])}
                aria-label={roleLabel[e.role]}
              />
            </div>
          );
        })}
        {m.espacos.length > 3 && (
          <span className="text-[11px] text-muted-foreground">
            +{m.espacos.length - 3}
          </span>
        )}
      </div>

      <div className="grid h-14 place-items-center">
        <button
          type="button"
          aria-label="Mais ações"
          className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
