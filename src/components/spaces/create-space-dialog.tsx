"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Zap, Rocket, Target, Lightbulb, Flame, Star, Sparkles, Trophy,
  Palette, Drama, Music, Film, Mic, Guitar, Radio, Headphones,
  Smartphone, Laptop, Monitor, Keyboard, Mouse, Printer, Camera, ScanLine,
  BarChart2, TrendingUp, TrendingDown, ClipboardList, Pin, MapPin, Map, Calendar,
  Key, Lock, Unlock, Bell, BellOff, Megaphone, Volume2, VolumeX,
  Medal, Award, Ribbon, Gift,
  Globe, Compass, Mountain, Home, Building2, Hospital, Store, Hotel,
  Car, Plane, Ship, Anchor, Bike, Bus,
  Pizza, Apple, Coffee, ShoppingCart, Package, Boxes,
  Dumbbell, Gamepad2, Puzzle, Swords, Shield, Flag,
  Leaf, Flower, Trees, Sun, Moon, Cloud, Umbrella, Snowflake,
  Diamond, Crown, Heart, Smile, Users, User, Baby, Dog,
  Microscope, FlaskConical, Atom, Cpu, Database, Code, Terminal, GitBranch,
  BookOpen, BookMarked, Pen, FileText, Folder, Archive, Paperclip, Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateSpace } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Paleta & ícones ──────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#64748b", "#78716c", "#0ea5e9",
];

interface IconEntry { id: string; label: string; Icon: LucideIcon }

const ICON_LIST: IconEntry[] = [
  { id: "zap",         label: "Zap",         Icon: Zap },
  { id: "rocket",      label: "Rocket",      Icon: Rocket },
  { id: "target",      label: "Target",      Icon: Target },
  { id: "lightbulb",   label: "Lightbulb",   Icon: Lightbulb },
  { id: "flame",       label: "Flame",       Icon: Flame },
  { id: "star",        label: "Star",        Icon: Star },
  { id: "sparkles",    label: "Sparkles",    Icon: Sparkles },
  { id: "trophy",      label: "Trophy",      Icon: Trophy },
  { id: "palette",     label: "Palette",     Icon: Palette },
  { id: "drama",       label: "Drama",       Icon: Drama },
  { id: "music",       label: "Music",       Icon: Music },
  { id: "film",        label: "Film",        Icon: Film },
  { id: "mic",         label: "Mic",         Icon: Mic },
  { id: "guitar",      label: "Guitar",      Icon: Guitar },
  { id: "radio",       label: "Radio",       Icon: Radio },
  { id: "headphones",  label: "Headphones",  Icon: Headphones },
  { id: "smartphone",  label: "Smartphone",  Icon: Smartphone },
  { id: "laptop",      label: "Laptop",      Icon: Laptop },
  { id: "monitor",     label: "Monitor",     Icon: Monitor },
  { id: "keyboard",    label: "Keyboard",    Icon: Keyboard },
  { id: "mouse",       label: "Mouse",       Icon: Mouse },
  { id: "printer",     label: "Printer",     Icon: Printer },
  { id: "camera",      label: "Camera",      Icon: Camera },
  { id: "scanline",    label: "Scan",        Icon: ScanLine },
  { id: "barchart",    label: "Bar Chart",   Icon: BarChart2 },
  { id: "trending-up", label: "Trending Up", Icon: TrendingUp },
  { id: "trending-dn", label: "Trending Dn", Icon: TrendingDown },
  { id: "clipboard",   label: "Clipboard",   Icon: ClipboardList },
  { id: "pin",         label: "Pin",         Icon: Pin },
  { id: "map-pin",     label: "Map Pin",     Icon: MapPin },
  { id: "map",         label: "Map",         Icon: Map },
  { id: "calendar",    label: "Calendar",    Icon: Calendar },
  { id: "key",         label: "Key",         Icon: Key },
  { id: "lock",        label: "Lock",        Icon: Lock },
  { id: "unlock",      label: "Unlock",      Icon: Unlock },
  { id: "bell",        label: "Bell",        Icon: Bell },
  { id: "bell-off",    label: "Bell Off",    Icon: BellOff },
  { id: "megaphone",   label: "Megaphone",   Icon: Megaphone },
  { id: "volume",      label: "Volume",      Icon: Volume2 },
  { id: "volume-x",    label: "Mute",        Icon: VolumeX },
  { id: "medal",       label: "Medal",       Icon: Medal },
  { id: "award",       label: "Award",       Icon: Award },
  { id: "ribbon",      label: "Ribbon",      Icon: Ribbon },
  { id: "gift",        label: "Gift",        Icon: Gift },
  { id: "globe",       label: "Globe",       Icon: Globe },
  { id: "compass",     label: "Compass",     Icon: Compass },
  { id: "mountain",    label: "Mountain",    Icon: Mountain },
  { id: "home",        label: "Home",        Icon: Home },
  { id: "building",    label: "Building",    Icon: Building2 },
  { id: "hospital",    label: "Hospital",    Icon: Hospital },
  { id: "store",       label: "Store",       Icon: Store },
  { id: "hotel",       label: "Hotel",       Icon: Hotel },
  { id: "car",         label: "Car",         Icon: Car },
  { id: "plane",       label: "Plane",       Icon: Plane },
  { id: "ship",        label: "Ship",        Icon: Ship },
  { id: "anchor",      label: "Anchor",      Icon: Anchor },
  { id: "bike",        label: "Bike",        Icon: Bike },
  { id: "bus",         label: "Bus",         Icon: Bus },
  { id: "pizza",       label: "Pizza",       Icon: Pizza },
  { id: "apple",       label: "Apple",       Icon: Apple },
  { id: "coffee",      label: "Coffee",      Icon: Coffee },
  { id: "cart",        label: "Cart",        Icon: ShoppingCart },
  { id: "package",     label: "Package",     Icon: Package },
  { id: "boxes",       label: "Boxes",       Icon: Boxes },
  { id: "dumbbell",    label: "Dumbbell",    Icon: Dumbbell },
  { id: "gamepad",     label: "Gamepad",     Icon: Gamepad2 },
  { id: "puzzle",      label: "Puzzle",      Icon: Puzzle },
  { id: "swords",      label: "Swords",      Icon: Swords },
  { id: "shield",      label: "Shield",      Icon: Shield },
  { id: "flag",        label: "Flag",        Icon: Flag },
  { id: "leaf",        label: "Leaf",        Icon: Leaf },
  { id: "flower",      label: "Flower",      Icon: Flower },
  { id: "trees",       label: "Trees",       Icon: Trees },
  { id: "sun",         label: "Sun",         Icon: Sun },
  { id: "moon",        label: "Moon",        Icon: Moon },
  { id: "cloud",       label: "Cloud",       Icon: Cloud },
  { id: "umbrella",    label: "Umbrella",    Icon: Umbrella },
  { id: "snowflake",   label: "Snowflake",   Icon: Snowflake },
  { id: "diamond",     label: "Diamond",     Icon: Diamond },
  { id: "crown",       label: "Crown",       Icon: Crown },
  { id: "heart",       label: "Heart",       Icon: Heart },
  { id: "smile",       label: "Smile",       Icon: Smile },
  { id: "users",       label: "Users",       Icon: Users },
  { id: "user",        label: "User",        Icon: User },
  { id: "baby",        label: "Baby",        Icon: Baby },
  { id: "dog",         label: "Dog",         Icon: Dog },
  { id: "microscope",  label: "Microscope",  Icon: Microscope },
  { id: "flask",       label: "Flask",       Icon: FlaskConical },
  { id: "atom",        label: "Atom",        Icon: Atom },
  { id: "cpu",         label: "CPU",         Icon: Cpu },
  { id: "database",    label: "Database",    Icon: Database },
  { id: "code",        label: "Code",        Icon: Code },
  { id: "terminal",    label: "Terminal",    Icon: Terminal },
  { id: "git",         label: "Git",         Icon: GitBranch },
  { id: "book",        label: "Book",        Icon: BookOpen },
  { id: "bookmark",    label: "Bookmark",    Icon: BookMarked },
  { id: "pen",         label: "Pen",         Icon: Pen },
  { id: "file",        label: "File",        Icon: FileText },
  { id: "folder",      label: "Folder",      Icon: Folder },
  { id: "archive",     label: "Archive",     Icon: Archive },
  { id: "paperclip",   label: "Paperclip",   Icon: Paperclip },
  { id: "search",      label: "Search",      Icon: Search },
];

// ─── Switch ───────────────────────────────────────────────────────────────────

function Switch({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// ─── IconColorPicker ──────────────────────────────────────────────────────────

function IconColorPicker({
  color,
  iconId,
  nome,
  onColorChange,
  onIconChange,
}: {
  color: string;
  iconId: string;
  nome: string;
  onColorChange: (c: string) => void;
  onIconChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  const letter = nome.trim().charAt(0).toUpperCase() || "S";
  const selectedEntry = ICON_LIST.find((e) => e.id === iconId);
  const SelectedIcon = selectedEntry?.Icon ?? null;

  const filtered = search.trim()
    ? ICON_LIST.filter((e) => e.label.toLowerCase().includes(search.toLowerCase()))
    : ICON_LIST;

  // Fecha popover principal ao clicar fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setColorOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Avatar clicável */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setColorOpen(false); }}
        className="flex h-11 w-11 items-center justify-center rounded-md text-white font-bold text-lg select-none transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ backgroundColor: color }}
        aria-label="Escolher ícone e cor"
      >
        {SelectedIcon
          ? <SelectedIcon size={20} color="white" strokeWidth={1.75} />
          : letter
        }
      </button>

      {/* Popover principal — só ícones, sem tabs */}
      {open && (
        <div className="absolute left-0 top-[48px] z-50 w-[320px] rounded-lg border border-border bg-popover shadow-2xl">
          {/* Header: título da tab (estático) */}
          <div className="border-b border-border px-3 py-2.5">
            <span className="text-xs font-semibold text-foreground border-b-2 pb-2.5 border-primary">
              Ícone
            </span>
          </div>

          <div className="p-3 space-y-2">
            {/* Barra de pesquisa + botão cor */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                )}
              </div>

              {/* Botão círculo de cor */}
              <div ref={colorRef} className="relative shrink-0">
                <button
                  type="button"
                  title="Escolher cor"
                  onClick={() => setColorOpen((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border/60 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  style={{ backgroundColor: color }}
                  aria-label="Cor atual — clique para mudar"
                />

                {/* Sub-dropdown de cores */}
                {colorOpen && (
                  <div className="absolute right-0 top-[34px] z-[60] w-[188px] rounded-lg border border-border bg-popover p-3 shadow-2xl">
                    <div className="grid grid-cols-8 gap-1.5">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { onColorChange(c); setColorOpen(false); }}
                          className={cn(
                            "h-5 w-5 rounded-full transition-transform hover:scale-110 focus:outline-none",
                            color === c && "ring-2 ring-white ring-offset-1 ring-offset-popover scale-110",
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Cor ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid de ícones */}
            <div className="grid grid-cols-8 gap-0.5 max-h-[240px] overflow-y-auto">
              {/* Inicial (sem ícone) */}
              <button
                type="button"
                title="Usar inicial"
                onClick={() => { onIconChange(""); setOpen(false); }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white transition-colors hover:opacity-80",
                  !iconId && "ring-2 ring-offset-1 ring-offset-popover",
                )}
                style={{ backgroundColor: color }}
              >
                {letter}
              </button>

              {filtered.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => { onIconChange(id); setOpen(false); }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-muted/60",
                    iconId === id && "bg-muted/60",
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} style={{ color }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Componente principal ─────────────────────────────────────────────────────

export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [privado, setPrivado] = useState(false);
  const [color, setColor] = useState(COLOR_PALETTE[7]);
  const [iconId, setIconId] = useState("");
  const [nomeError, setNomeError] = useState<string | null>(null);

  const { mutate, isPending } = useCreateSpace();

  useEffect(() => {
    if (!open) {
      setNome("");
      setDescricao("");
      setPrivado(false);
      setColor(COLOR_PALETTE[7]);
      setIconId("");
      setNomeError(null);
    }
  }, [open]);

  function validate(): boolean {
    const trimmed = nome.trim();
    if (!trimmed) { setNomeError("Nome é obrigatório"); return false; }
    if (trimmed.length < 3) { setNomeError("Mínimo de 3 caracteres"); return false; }
    if (trimmed.length > 255) { setNomeError("Máximo de 255 caracteres"); return false; }
    setNomeError(null);
    return true;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    mutate(
      { nome: nome.trim(), privado, color, icon: iconId || undefined },
      {
        onSuccess: (created) => {
          toast.success(`Space "${created.nome}" criado`, {
            description: privado
              ? "Apenas membros convidados terão acesso."
              : "Visível para todos da organização.",
          });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error("Erro ao criar space", { description: getApiErrorMessage(err) });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-visible">
        <div className="px-7 pt-7 pb-5">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-semibold">Criar espaço</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Um espaço representa equipes, departamentos ou grupos, cada um com suas
              próprias listas, fluxos de trabalho e configurações.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-7 space-y-6">

            {/* Ícone e nome */}
            <div className="space-y-2">
              <label htmlFor="create-space-nome" className="text-sm font-medium text-foreground">
                Ícone e nome
              </label>
              <div className="flex items-center gap-3">
                <IconColorPicker
                  color={color}
                  iconId={iconId}
                  nome={nome}
                  onColorChange={setColor}
                  onIconChange={setIconId}
                />
                <div className="flex-1 space-y-1">
                  <Input
                    id="create-space-nome"
                    autoFocus
                    placeholder="por exemplo, marketing, engenharia, RH"
                    value={nome}
                    onChange={(e) => { setNome(e.target.value); if (nomeError) setNomeError(null); }}
                    aria-invalid={!!nomeError}
                    className="h-10 text-sm"
                  />
                  {nomeError && <p className="text-xs text-destructive">{nomeError}</p>}
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label htmlFor="create-space-descricao" className="text-sm font-medium text-foreground">
                Descrição<span className="ml-1 text-muted-foreground font-normal text-xs">(opcional)</span>
              </label>
              <textarea
                id="create-space-descricao"
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={cn(
                  "w-full resize-none rounded-md border border-input bg-background px-3 py-2.5",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                  "transition-colors",
                )}
              />
            </div>

            {/* Tornar privado */}
            <div className="flex items-center justify-between gap-4 border-t border-border pt-5 pb-1">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">Tornar privado</div>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Somente você e membros convidados têm acesso
                </p>
              </div>
              <Switch checked={privado} onCheckedChange={setPrivado} ariaLabel="Tornar space privado" />
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between px-7 py-4 mt-4 border-t border-border bg-muted/40">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Usar modelos
            </button>
            <Button type="submit" disabled={isPending} className="px-6">
              {isPending ? "Criando…" : "Continuar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
