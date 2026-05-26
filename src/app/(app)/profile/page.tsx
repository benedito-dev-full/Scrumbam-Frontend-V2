"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Pencil,
  LogOut,
  KeyRound,
  CheckCircle2,
  MessageSquare,
  GitFork,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceChip } from "@/components/shell/space-chip";
import { useAuthStore } from "@/lib/stores/auth";
import { useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/* ─── Mock data ──────────────────────────────────────────────────────────── */

const MOCK_PROFILE = {
  cargo: "Desenvolvedor Full-stack",
  time: "Engenharia",
  fuso: "America/São_Paulo (GMT-3)",
  idioma: "Português (Brasil)",
  criadoEm: "2026-05-23",
};

const MOCK_STATS = {
  concluidas: 12,
  emAndamento: 5,
  atribuidas: 3,
  espacos: 2,
};

const MOCK_ESPACOS = [
  { id: "1", nome: "Texte", color: "#6366f1" },
  { id: "2", nome: "Scrumban", color: "#ef4444" },
];

type AtividadeTipo = "completed" | "comment" | "assigned" | "created";

const MOCK_ATIVIDADE: {
  id: string;
  tipo: AtividadeTipo;
  titulo: string;
  contexto: string;
  tempo: string;
}[] = [
  { id: "a1", tipo: "completed", titulo: "Refatorar autenticação", contexto: "Produto",   tempo: "há 2h" },
  { id: "a2", tipo: "comment",   titulo: "SEO landing /precos",    contexto: "Marketing", tempo: "há 5h" },
  { id: "a3", tipo: "assigned",  titulo: "Migração para PG 16",    contexto: "Produto",   tempo: "ontem" },
  { id: "a4", tipo: "created",   titulo: "Espaço Marketing",       contexto: "Workspace", tempo: "há 2 dias" },
];

const tipoIcon: Record<AtividadeTipo, React.ElementType> = {
  completed: CheckCircle2,
  comment:   MessageSquare,
  assigned:  GitFork,
  created:   Plus,
};

const tipoColor: Record<AtividadeTipo, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  comment:   "bg-sky-500/15 text-sky-400",
  assigned:  "bg-primary/15 text-primary",
  created:   "bg-violet-500/15 text-violet-400",
};

const tipoLabel: Record<AtividadeTipo, string> = {
  completed: "Concluiu",
  comment:   "Comentou em",
  assigned:  "Foi atribuído",
  created:   "Criou",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(str: string): string {
  const colors = [
    "#3b5bdb", "#ae3ec9", "#0ca678", "#e8590c",
    "#f03e3e", "#1098ad", "#74b816", "#f59f00",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ─── Página ─────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const router = useRouter();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);

  const name = user?.name ?? "Usuário";
  const email = user?.email ?? "—";
  const initials = getInitials(name);
  const color = avatarColor(name);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Perfil</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" className="gap-1.5">
            <Pencil className="size-3.5" />
            Editar perfil
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="size-3.5" />
            Sair
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">

          {/* Hero card */}
          <section className="flex items-center gap-4 rounded-[10px] border border-border bg-card p-5">
            <div
              aria-hidden
              className="grid size-14 shrink-0 place-items-center rounded-full text-base font-bold text-white"
              style={{ background: color }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-foreground">{name}</p>
              <p className="truncate text-[13px] text-muted-foreground">
                {MOCK_PROFILE.cargo} · {MOCK_PROFILE.time}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground/80">
                {email} · Membro desde {formatDate(MOCK_PROFILE.criadoEm)}
              </p>
            </div>
          </section>

          {/* Mini stats */}
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Concluídas"    value={MOCK_STATS.concluidas}   />
            <StatCard label="Em andamento"  value={MOCK_STATS.emAndamento}  />
            <StatCard label="Atribuídas"    value={MOCK_STATS.atribuidas}   />
            <StatCard label="Espaços"       value={MOCK_STATS.espacos}      />
          </section>

          {/* Informações pessoais */}
          <Card title="Informações pessoais">
            <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-[13px]">
              <Row label="Email"        value={email} />
              <Row label="Cargo"        value={MOCK_PROFILE.cargo} />
              <Row label="Time"         value={MOCK_PROFILE.time} />
              <Row label="Fuso horário" value={MOCK_PROFILE.fuso} />
              <Row label="Idioma"       value={MOCK_PROFILE.idioma} />
              <Row label="Conta criada" value={formatDate(MOCK_PROFILE.criadoEm)} />
            </dl>
          </Card>

          {/* Segurança */}
          <Card title="Segurança">
            <button
              type="button"
              onClick={() => router.push("/profile/change-password")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5",
                "border border-border/70 bg-background/30 text-left",
                "transition-colors hover:border-border hover:bg-muted/30",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
                  <KeyRound className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">Alterar senha</p>
                  <p className="text-[11px] text-muted-foreground">
                    Use uma senha forte e única para esta conta
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </Card>

          {/* Espaços */}
          <Card title="Espaços que participo">
            <div className="flex flex-wrap items-center gap-2">
              {MOCK_ESPACOS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => router.push(`/spaces/${e.id}`)}
                  className="flex items-center gap-2 rounded-md border border-border/70 bg-background/30 px-2.5 py-1.5 text-[13px] text-foreground transition-colors hover:bg-muted/30"
                >
                  <SpaceChip iniciais={e.nome.slice(0, 2).toUpperCase()} cor={e.color} size="sm" />
                  {e.nome}
                </button>
              ))}
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-dashed border-border/70 px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              >
                <Plus className="size-3.5" />
                Adicionar
              </button>
            </div>
          </Card>

          {/* Atividade recente */}
          <Card title="Atividade recente">
            <ul className="-mx-2">
              {MOCK_ATIVIDADE.map((a) => {
                const Icon = tipoIcon[a.tipo];
                return (
                  <li key={a.id}>
                    <div className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/30">
                      <span
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                          tipoColor[a.tipo],
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-foreground">
                          <span className="text-muted-foreground">{tipoLabel[a.tipo]}</span>{" "}
                          <span className="font-medium">{a.titulo}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {a.contexto} · {a.tempo}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex justify-end border-t border-border/60 pt-3">
              <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground hover:text-foreground">
                Ver mais atividade
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

/* ─── Subcomponentes ──────────────────────────────────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-border bg-card p-5">
      <h2 className="mb-4 border-b border-border/60 pb-3 text-[15px] font-medium text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-border bg-card px-4 py-3.5">
      <p className="text-[22px] font-semibold leading-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </>
  );
}
