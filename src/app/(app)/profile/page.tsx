"use client";

import { useRouter } from "next/navigation";
import {
  User,
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
import { useMyTasks } from "@/hooks/use-tasks";
import { useSpaces } from "@/hooks/use-projects";
import { useMyTeams } from "@/hooks/use-teams";
import { cn } from "@/lib/utils";

/* ─── Mock — Atividade recente (Fase 3 futura, requer endpoint /auth/me/activity) ─── */

type AtividadeTipo = "completed" | "comment" | "assigned" | "created";

const MOCK_ATIVIDADE: {
  id: string;
  tipo: AtividadeTipo;
  titulo: string;
  contexto: string;
  tempo: string;
}[] = [
  {
    id: "a1",
    tipo: "completed",
    titulo: "Refatorar autenticação",
    contexto: "Produto",
    tempo: "há 2h",
  },
  {
    id: "a2",
    tipo: "comment",
    titulo: "SEO landing /precos",
    contexto: "Marketing",
    tempo: "há 5h",
  },
  {
    id: "a3",
    tipo: "assigned",
    titulo: "Migração para PG 16",
    contexto: "Produto",
    tempo: "ontem",
  },
  {
    id: "a4",
    tipo: "created",
    titulo: "Espaço Marketing",
    contexto: "Workspace",
    tempo: "há 2 dias",
  },
];

const tipoIcon: Record<AtividadeTipo, React.ElementType> = {
  completed: CheckCircle2,
  comment: MessageSquare,
  assigned: GitFork,
  created: Plus,
};

const tipoColor: Record<AtividadeTipo, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  comment: "bg-sky-500/15 text-sky-400",
  assigned: "bg-primary/15 text-primary",
  created: "bg-violet-500/15 text-violet-400",
};

const tipoLabel: Record<AtividadeTipo, string> = {
  completed: "Concluiu",
  comment: "Comentou em",
  assigned: "Foi atribuído",
  created: "Criou",
};

/* ─── V3 Intentions terminais (filtro de stats) ─── */

const TERMINAL_STATUSES = new Set(["DONE", "FAILED", "CANCELLED", "DISCARDED"]);

/* ─── Helpers ─── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(str: string): string {
  const colors = [
    "#3b5bdb",
    "#ae3ec9",
    "#0ca678",
    "#e8590c",
    "#f03e3e",
    "#1098ad",
    "#74b816",
    "#f59f00",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Página ─── */

export default function ProfilePage() {
  const router = useRouter();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);

  const { data: myTasks = [] } = useMyTasks();
  const { data: spaces = [] } = useSpaces();
  const { data: myTeams = [] } = useMyTeams();

  const name = user?.name ?? "Usuário";
  const email = user?.email ?? "—";
  const initials = getInitials(name);
  const color = avatarColor(name);

  // Stats reais derivadas das tasks atribuídas
  const concluidas = myTasks.filter((t) => t.status === "DONE").length;
  const emAndamento = myTasks.filter((t) => t.status === "EXECUTING").length;
  const atribuidas = myTasks.filter(
    (t) => !TERMINAL_STATUSES.has(t.status),
  ).length;
  const espacosCount = spaces.length;

  const subtitulo =
    myTeams.length > 0
      ? `Membro de ${myTeams.length} time${myTeams.length !== 1 ? "s" : ""}`
      : email;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Perfil</h1>
        </div>
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
              <p className="truncate text-[15px] font-semibold text-foreground">
                {name}
              </p>
              <p className="truncate text-[13px] text-muted-foreground">
                {subtitulo}
              </p>
              {myTeams.length > 0 && (
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground/80">
                  {email}
                </p>
              )}
            </div>
          </section>

          {/* Mini stats reais */}
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Concluídas" value={concluidas} />
            <StatCard label="Em andamento" value={emAndamento} />
            <StatCard label="Atribuídas" value={atribuidas} />
            <StatCard label="Espaços" value={espacosCount} />
          </section>

          {/* Informações pessoais — só campos com fonte de verdade no backend */}
          <Card title="Informações pessoais">
            <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-[13px]">
              <Row label="Email" value={email} />
              <Row
                label="Times"
                value={
                  myTeams.length > 0
                    ? myTeams.map((t) => t.nome).join(", ")
                    : "—"
                }
              />
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
                  <p className="text-[13px] font-medium text-foreground">
                    Alterar senha
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Use uma senha forte e única para esta conta
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </Card>

          {/* Espaços que participo — useSpaces real */}
          <Card title="Espaços que participo">
            {spaces.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {spaces.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => router.push(`/spaces/${s.id}`)}
                    className="flex items-center gap-2 rounded-md border border-border/70 bg-background/30 px-2.5 py-1.5 text-[13px] text-foreground transition-colors hover:bg-muted/30"
                  >
                    <SpaceChip
                      iniciais={s.nome.slice(0, 2).toUpperCase()}
                      cor={typeof s.color === "string" ? s.color : "#6366f1"}
                      size="sm"
                    />
                    {s.nome}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Você ainda não participa de nenhum espaço.
              </p>
            )}
          </Card>

          {/* Atividade recente — mock (Fase 3: requer endpoint /auth/me/activity) */}
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
                          <span className="text-muted-foreground">
                            {tipoLabel[a.tipo]}
                          </span>{" "}
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
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Subcomponentes ─── */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
      <p className="text-[22px] font-semibold leading-tight text-foreground">
        {value}
      </p>
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
