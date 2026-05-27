"use client";

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
import { useShortcutsHelpStore } from "@/lib/stores/shortcuts-help";
import { useUserPreferences } from "@/hooks/use-user-preferences";
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
              <Row label="Versão" value={`Scrumbam · ${APP_VERSION}`} />
              <Row
                label="Ambiente"
                value={
                  process.env.NODE_ENV === "production"
                    ? "Produção"
                    : "Desenvolvimento"
                }
              />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Aparência ──────────────────────────────────────────────────────────── */

function AparenciaCard() {
  const { setTheme } = useTheme();
  const { preferences, setAppearance } = useUserPreferences();

  const handleTheme = (v: "light" | "dark") => {
    setTheme(v);
    void setAppearance({ theme: v });
  };

  return (
    <Card title="Aparência">
      <div className="space-y-5">
        <SettingRow
          icon={<Sun className="size-4" />}
          title="Tema"
          description="Escolha entre claro e escuro"
        >
          <Segmented
            value={preferences.appearance.theme === "dark" ? "dark" : "light"}
            onChange={(v) => handleTheme(v as "light" | "dark")}
            options={[
              {
                value: "light",
                label: "Claro",
                icon: <Sun className="size-3.5" />,
              },
              {
                value: "dark",
                label: "Escuro",
                icon: <Moon className="size-3.5" />,
              },
            ]}
          />
        </SettingRow>

        <SettingRow
          icon={<SettingsIcon className="size-4" />}
          title="Densidade"
          description="Ajuste o espaçamento das listas e tabelas"
        >
          <Segmented
            value={preferences.appearance.density ?? "normal"}
            onChange={(v) =>
              void setAppearance({
                density: v as "compact" | "normal" | "cozy",
              })
            }
            options={[
              { value: "compact", label: "Compacta" },
              { value: "normal", label: "Padrão" },
              { value: "cozy", label: "Espaçada" },
            ]}
          />
        </SettingRow>
      </div>
    </Card>
  );
}

/* ─── Notificações ───────────────────────────────────────────────────────── */

function NotificacoesCard() {
  const { preferences, isLoading, setNotifications } = useUserPreferences();
  const { inAppEnabled, emailOnMention, emailDigest } =
    preferences.notifications;

  return (
    <Card title="Notificações">
      <p className="-mt-2 mb-3 text-[12px] text-muted-foreground">
        Suas preferências já são salvas no servidor. A entrega seletiva por
        canal será ligada em breve.
      </p>
      <div className="space-y-1">
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="No app (Inbox)"
          description="Receber notificações dentro do app"
          checked={!!inAppEnabled}
          onChange={() =>
            void setNotifications({ inAppEnabled: !inAppEnabled })
          }
          disabled={isLoading}
        />
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="Email quando me mencionarem"
          description="Receba email em menções em comentários e descrições"
          checked={!!emailOnMention}
          onChange={() =>
            void setNotifications({ emailOnMention: !emailOnMention })
          }
          disabled={isLoading}
        />
        <ToggleRow
          icon={<Bell className="size-4" />}
          title="Resumo por email"
          description="Resumo periódico das atividades do workspace"
          checked={!!emailDigest}
          onChange={() => void setNotifications({ emailDigest: !emailDigest })}
          disabled={isLoading}
        />
      </div>
    </Card>
  );
}

/* ─── Idioma e região ────────────────────────────────────────────────────── */

function IdiomaCard() {
  const { preferences, isLoading, setLocale } = useUserPreferences();
  const { language, timezone, dateFormat } = preferences.locale;

  return (
    <Card title="Idioma e região">
      <p className="-mt-2 mb-3 text-[12px] text-muted-foreground">
        Salvo no servidor. Aplicação completa (i18n, formatação server-side) em
        próximas versões.
      </p>
      <div className="space-y-5">
        <SettingRow
          icon={<Globe className="size-4" />}
          title="Idioma"
          description="Idioma usado em toda a interface"
        >
          <NativeSelect
            value={language ?? "pt-BR"}
            onChange={(v) => void setLocale({ language: v })}
            disabled={isLoading}
            options={[
              { value: "pt-BR", label: "Português (Brasil)" },
              { value: "en-US", label: "English (US)" },
              { value: "es-ES", label: "Español" },
            ]}
          />
        </SettingRow>

        <SettingRow
          icon={<Globe className="size-4" />}
          title="Fuso horário"
          description="Datas e horários serão exibidos neste fuso"
        >
          <NativeSelect
            value={timezone ?? "America/Sao_Paulo"}
            onChange={(v) => void setLocale({ timezone: v })}
            disabled={isLoading}
            options={[
              {
                value: "America/Sao_Paulo",
                label: "America/Sao_Paulo (GMT-3)",
              },
              { value: "America/Manaus", label: "America/Manaus (GMT-4)" },
              { value: "America/New_York", label: "New York (GMT-5)" },
              { value: "Europe/Lisbon", label: "Europe/Lisbon (GMT+0)" },
              { value: "UTC", label: "UTC" },
            ]}
          />
        </SettingRow>

        <SettingRow
          icon={<Globe className="size-4" />}
          title="Formato de data"
          description="Como datas aparecem na interface"
        >
          <NativeSelect
            value={dateFormat ?? "dd/MM/yyyy"}
            onChange={(v) => void setLocale({ dateFormat: v })}
            disabled={isLoading}
            options={[
              { value: "dd/MM/yyyy", label: "31/12/2026" },
              { value: "MM/dd/yyyy", label: "12/31/2026" },
              { value: "yyyy-MM-dd", label: "2026-12-31 (ISO)" },
            ]}
          />
        </SettingRow>
      </div>
    </Card>
  );
}

/* ─── Native select (compacto, estilo Linear) ─────────────────────────────── */

function NativeSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-8 min-w-[180px] rounded border border-border/70 bg-background/40 px-2 text-[12px] text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ─── Subcomponentes ──────────────────────────────────────────────────────── */

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
  disabled?: boolean;
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/30",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-[13px] font-medium text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        ariaLabel={title}
        disabled={disabled}
      />
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

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: SegmentedProps<T>) {
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

/* ─── Switch ─────────────────────────────────────────────────────────────── */

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

function Switch({ checked, onChange, ariaLabel, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed",
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
