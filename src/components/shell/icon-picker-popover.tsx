"use client";

import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { COLORS, ICONS, getIconByName } from "@/lib/space-customization";
import { cn } from "@/lib/utils";

type Tab = "icon" | "color";

type IconPickerPopoverProps = {
  cor: string;
  iniciais: string;
  iconName?: string | null;
  onColorChange: (color: string) => void;
  onIconChange: (name: string | null) => void;
};

export function IconPickerPopover({
  cor,
  iniciais,
  iconName,
  onColorChange,
  onIconChange,
}: IconPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("icon");
  const [query, setQuery] = useState("");

  const SelectedIcon = getIconByName(iconName);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setTab("icon");
        }
      }}
    >
      <Popover.Trigger
        render={
          <button
            type="button"
            aria-label="Escolher ícone ou cor do espaço"
            className="grid size-8 shrink-0 place-items-center rounded-md outline-none ring-offset-2 ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring data-popup-open:ring-2 data-popup-open:ring-ring"
            style={{ background: cor }}
          >
            {SelectedIcon ? (
              <SelectedIcon className="size-4 text-white" strokeWidth={2.25} />
            ) : (
              <span className="text-[13px] font-semibold text-white">
                {iniciais || "?"}
              </span>
            )}
          </button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          side="bottom"
          sideOffset={8}
          className="z-[60]"
        >
          <Popover.Popup className="z-[60] w-[340px] rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <TabStrip tab={tab} onChange={setTab} />

            {tab === "icon" ? (
              <IconTab
                query={query}
                onQueryChange={setQuery}
                iniciais={iniciais}
                cor={cor}
                iconName={iconName}
                onIconSelect={(name) => {
                  onIconChange(name);
                  setOpen(false);
                }}
              />
            ) : (
              <ColorTab
                cor={cor}
                onColorChange={(c) => {
                  onColorChange(c);
                  setOpen(false);
                }}
              />
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TabStrip({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "icon", label: "Ícone" },
    { id: "color", label: "Cor" },
  ];
  return (
    <div className="flex items-center border-b border-border">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            data-active={active ? "" : undefined}
            className={cn(
              "-mb-px h-9 border-b-2 border-transparent px-3 text-xs font-medium text-muted-foreground outline-none transition-colors",
              "hover:text-foreground",
              "data-active:border-primary data-active:text-foreground",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function IconTab({
  query,
  onQueryChange,
  iniciais,
  cor,
  iconName,
  onIconSelect,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  iniciais: string;
  cor: string;
  iconName?: string | null;
  onIconSelect: (name: string | null) => void;
}) {
  const filtered = useMemo(() => {
    if (!query.trim()) return ICONS;
    const q = query.toLowerCase().trim();
    return ICONS.filter(
      (i) =>
        i.name.includes(q) ||
        i.label.toLowerCase().includes(q) ||
        i.keywords.includes(q),
    );
  }, [query]);

  const showLetterOption = !query.trim();

  return (
    <div className="mt-2 space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar ícone..."
          className="h-7 pl-8 text-xs"
          autoFocus
        />
      </div>

      <div className="grid max-h-72 grid-cols-8 gap-1 overflow-y-auto pr-0.5">
        {showLetterOption && (
          <IconCell
            active={!iconName}
            onClick={() => onIconSelect(null)}
            label="Iniciais"
          >
            <div
              className="grid size-5 place-items-center rounded text-[10px] font-semibold text-white"
              style={{ background: cor }}
            >
              {iniciais || "?"}
            </div>
          </IconCell>
        )}

        {filtered.map((entry) => {
          const Icon = entry.Icon;
          const active = iconName === entry.name;
          return (
            <IconCell
              key={entry.name}
              active={active}
              onClick={() => onIconSelect(entry.name)}
              label={entry.label}
            >
              <Icon className="size-4 text-foreground" strokeWidth={2} />
            </IconCell>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-8 py-8 text-center text-xs text-muted-foreground">
            Nenhum ícone com “{query}”.
          </div>
        )}
      </div>
    </div>
  );
}

function IconCell({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-md transition-colors outline-none",
        "hover:bg-muted focus-visible:bg-muted",
        active && "bg-primary/15 ring-1 ring-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function ColorTab({
  cor,
  onColorChange,
}: {
  cor: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 pb-1">
      {COLORS.map((c) => {
        const active = cor === c.value;
        return (
          <button
            key={c.value}
            type="button"
            aria-label={c.label}
            aria-pressed={active}
            onClick={() => onColorChange(c.value)}
            className={cn(
              "grid h-9 place-items-center rounded-md ring-offset-2 ring-offset-popover transition-all",
              active && "ring-2 ring-ring",
            )}
            style={{ background: c.value }}
          >
            {active && (
              <Check className="size-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
