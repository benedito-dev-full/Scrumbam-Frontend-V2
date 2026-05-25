"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Bell,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-auth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  roleLabel: string;
  email: string;
  function: string;
  lastActivity: string;
  personContact: string;
  personCreated: string;
  teams: string;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

function useMockMembers(userName?: string, userEmail?: string): Member[] {
  const name = userName ?? "Você";
  const email = userEmail ?? "voce@scrumban.com";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return [
    {
      id: "1",
      name,
      initials,
      color: "#3b5bdb",
      role: "owner",
      roleLabel: "Proprietário",
      email,
      function: "Proprietário",
      lastActivity: "mai 25",
      personContact: "05/12/2026",
      personCreated: "05/12/2026",
      teams: "",
    },
  ];
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ["Todos os usuários", "Membros", "Convidados"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const { data: me } = useMe();
  const members = useMockMembers(me?.name, me?.email);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("Todos os usuários");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold text-foreground">
            Gerenciar pessoas
          </h1>
          <button
            type="button"
            className="text-[13px] text-primary hover:underline"
          >
            Saiba mais
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Download className="size-3.5" />
          Exportar
        </button>
      </header>

      {/* ── Barra de busca + Convidar ──────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar ou convidar por e-mail"
            className="h-9 w-full rounded-lg border border-border bg-transparent pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Convidar pessoas
        </button>
      </div>

      {/* ── Filtro ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-6 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-muted"
          >
            {filter}{" "}
            <span className="text-muted-foreground">
              ({filtered.length})
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setFilter(opt);
                    setFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-4 py-2 text-[13px] transition-colors hover:bg-muted",
                    filter === opt
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabela ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[300px]">
                Nome
              </th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[200px]">
                E-mail
              </th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[140px]">
                Função
              </th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[120px]">
                Última ativ...
              </th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[120px]">
                Pessoa con...
              </th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[120px]">
                Pessoa c...
              </th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70">
                Equipes
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {/* Linha "Convidar pessoas" */}
            <tr className="border-b border-border hover:bg-muted/30 transition-colors group">
              <td colSpan={8} className="px-6 py-2.5">
                <button
                  type="button"
                  className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="grid size-5 place-items-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/60">
                    <Plus className="size-3" />
                  </span>
                  Convidar pessoas
                </button>
              </td>
            </tr>

            {/* Membros */}
            {filtered.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && search && (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-[13px] text-muted-foreground">
              Nenhum resultado para{" "}
              <span className="text-foreground">"{search}"</span>
            </p>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[13px] text-primary hover:underline"
            >
              <Plus className="size-3.5" />
              Convidar {search} por e-mail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MemberRow ────────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: Member }) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors group">
      {/* Nome */}
      <td className="px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: member.color }}
          >
            {member.initials}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{member.name}</span>
            {member.role === "owner" && (
              <span className="rounded-sm bg-violet-600/20 px-1.5 py-0.5 text-[11px] font-semibold text-violet-400">
                {member.roleLabel}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>

      {/* Função */}
      <td className="px-4 py-3 text-muted-foreground">{member.function}</td>

      {/* Última atividade */}
      <td className="px-4 py-3 text-muted-foreground">{member.lastActivity}</td>

      {/* Pessoa convidada por */}
      <td className="px-4 py-3 text-muted-foreground">{member.personContact}</td>

      {/* Pessoa criada em */}
      <td className="px-4 py-3 text-muted-foreground">{member.personCreated}</td>

      {/* Equipes */}
      <td className="px-4 py-3 text-muted-foreground">{member.teams || "—"}</td>

      {/* Ações */}
      <td className="px-2 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Notificações"
          >
            <Bell className="size-3.5" />
          </button>
          <button
            type="button"
            className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Mais opções"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
