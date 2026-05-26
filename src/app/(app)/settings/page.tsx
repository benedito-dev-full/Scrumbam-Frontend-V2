"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  Globe,
  Keyboard,
  User,
  KeyRound,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShortcutsHelpStore } from "@/lib/stores/shortcuts-help";
import { cn } from "@/lib/utils";

const APP_VERSION = "0.1.0";

/* ─── Página ─────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const router = useRouter();
  const openShortcuts = useShortcutsHelpStore((s) => s.setOpen);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <SettingsIcon className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Configurações</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">

          {/* Aparência */}
          <AparenciaCard />

          {/* Notificações */}
          <NotificacoesCard />

          {/* Idioma e região */}
          <IdiomaCard />

          {/* Atalhos de teclado */}
          <Card title="Atalhos de teclado">
            <NavRow
              icon={<Keyboard className="size-4" />}
              title="Ver atalhos disponíveis"
              subtitle="Lista completa de comandos do teclado"
              shortcut="⌘ /"
              onClick={() => openShortcuts(true)}
            />
          </Card>

          {/* Conta */}
          <Card title="Conta">
            <div className="space-y-2">
              <NavRow
                icon={<User className="size-4" />}
                title="Perfil"
                subtitle="Veja e edite suas informações pessoais"
                onClick={() => router.push("/profile")}
              />
              <NavRow
                icon={<KeyRound className="size-4" />}
                title="Alterar senha"
                subtitle="Atualize a senha usada para entrar"
                onClick={() => router.push("/profile/change-password")}
              />
            </div>
          </Card>

          {/* Sobre */}
          <Card title="Sobre">
            <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-[13px]">
              <Row label="Versão"   value={`Scrumbam · ${APP_VERSION}`} />
              <Row label="Ambiente" value={process.env.NODE_ENV === "production" ? "Produção" : "Desenvolvimento"} />
            </dl>
          </Card>

        </div>
      </div>
    </div>
  );
}

/* ─── Aparência ──────────────────────────────────────────────────────────── */

function AparenciaCard() {
  const { resolvedTheme, setTheme } = useTheme();
  const [densidade, setDensidade] = useState<"compacta" | "confortavel">("compacta");

  return (
    <Card title="Aparência">
      <div className="space-y-5">
        <SettingRow
          icon={<Sun className="size-4" />}
          title="Tema"
          description="Escolha entre claro e escuro"
        >
          <Segmented
            value={resolvedTheme === "dark" ? "dark" : "light"}
            onChange={(v) => setTheme(v)}
            options={[
              { value: "light", label: "Claro", icon: <Sun className="size-3.5" /> },
              { value: "dark",  label: "Escuro", icon: <Moon className="size-3.5" /> },
            ]}
          />
        </SettingRow>

        <SettingRow
          icon={<SettingsIcon className="size-4" />}
          title="Densidade"
          description="Ajuste o espaçamento das listas e tabelas"
        >
          <Segmented
            value={densidade}
            onChange={(v) => setDensidade(v as "compacta" | "confortavel")}
            options={[
              { value: "compacta",    label: "Compacta" },
              { value: "confortavel", label: "Confortável" },
            ]}
          />
        </SettingRow>
      </div>
    </Card>
  );
}

/* ─── Notificações ───────────────────────────────────────────────────────── */

function NotificacoesCard() {
  const [prefs, setPrefs] = useState({
    emailAtribuicoes: true,
    emailMencoes:     true,
    pushBrowser:      false,
    lembretesPrazo:   true,
    threadsQueSigo:   true,
  });

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <Card title="Notificações">
      <div className="space-y-1">
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="Email — novas atribuições"
          description="Receba um email quando uma task for atribuída a você"
          checked={prefs.emailAtribuicoes}
          onChange={() => toggle("emailAtribuicoes")}
        />
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="Email — menções"
          description="Notificações por email quando alguém te menciona"
          checked={prefs.emailMencoes}
          onChange={() => toggle("emailMencoes")}
        />
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="Notificações no navegador"
          description="Avisos em tempo real enquanto a aba estiver aberta"
          checked={prefs.pushBrowser}
          onChange={() => toggle("pushBrowser")}
        />
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="Lembretes de prazo"
          description="Avisa antes do vencimento de tasks suas"
          checked={prefs.lembretesPrazo}
          onChange={() => toggle("lembretesPrazo")}
        />
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="Threads que sigo"
          description="Atualizações em comentários que você segue"
          checked={prefs.threadsQueSigo}
          onChange={() => toggle("threadsQueSigo")}
        />
      </div>
    </Card>
  );
}

/* ─── Idioma e região ────────────────────────────────────────────────────── */

function IdiomaCard() {
  const [idioma, setIdioma] = useState("Português (Brasil)");
  const [fuso, setFuso] = useState("America/São_Paulo");
  const [primeiroDia, setPrimeiroDia] = useState<"dom" | "seg">("seg");

  return (
    <Card title="Idioma e região">
      <div className="space-y-5">
        <SettingRow
          icon={<Globe className="size-4" />}
          title="Idioma"
          description="Idioma usado em toda a interface"
        >
          <SelectField value={idioma} onChange={setIdioma} disabled />
        </SettingRow>

        <SettingRow
          icon={<Globe className="size-4" />}
          title="Fuso horário"
          description="Datas e horários são exibidos neste fuso"
        >
          <SelectField value={`${fuso} (GMT-3)`} onChange={setFuso} disabled />
        </SettingRow>

        <SettingRow
          icon={<Globe className="size-4" />}
          title="Primeiro dia da semana"
          description="Usado no planner e no calendário"
        >
          <Segmented
            value={primeiroDia}
            onChange={(v) => setPrimeiroDia(v as "dom" | "seg")}
            options={[
              { value: "dom", label: "Domingo" },
              { value: "seg", label: "Segunda" },
            ]}
          />
        </SettingRow>
      </div>
    </Card>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ icon, title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-[13px] font-medium text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ icon, title, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-[13px] font-medium text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} ariaLabel={title} />
    </div>
  );
}

interface NavRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  shortcut?: string;
  onClick: () => void;
}

function NavRow({ icon, title, subtitle, shortcut, onClick }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2.5",
        "border border-border/70 bg-background/30 text-left",
        "transition-colors hover:border-border hover:bg-muted/30",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-[13px] font-medium text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        {shortcut && (
          <kbd className="rounded border border-border bg-muted/40 px-1.5 py-px text-[10px] font-medium">
            {shortcut}
          </kbd>
        )}
        <ChevronRight className="size-4" />
      </div>
    </button>
  );
}

/* ─── Segmented control ──────────────────────────────────────────────────── */

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}

function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div className="inline-flex h-8 items-center gap-px rounded-md border border-border/70 bg-background/40 p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded px-2.5 text-[12px] font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Select field (placeholder estático no MVP) ─────────────────────────── */

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function SelectField({ value, disabled }: SelectFieldProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className="h-8 min-w-[180px] justify-between gap-2 border-border/70 bg-background/40 text-[12px] font-normal text-foreground"
    >
      <span className="truncate">{value}</span>
      <ChevronRight className="size-3 rotate-90 opacity-70" />
    </Button>
  );
}

/* ─── Switch ─────────────────────────────────────────────────────────────── */

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}

function Switch({ checked, onChange, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-muted/60",
      )}
    >
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      >
        {checked && <Check className="size-2.5 text-primary" strokeWidth={3} />}
      </span>
    </button>
  );
}
