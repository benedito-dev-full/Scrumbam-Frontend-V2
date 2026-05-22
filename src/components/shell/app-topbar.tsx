"use client";

import { Bell, Search, Sparkles, Share2, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCommandPaletteStore } from "@/lib/stores/command-palette";

const workspaces = [
  { id: "scrumbam", name: "Scrumbam", initials: "S", current: true },
  { id: "personal", name: "Pessoal", initials: "P", current: false },
];

function WorkspaceSwitcher() {
  const current = workspaces.find((w) => w.current) ?? workspaces[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "group flex h-9 items-center gap-2 rounded-md px-1.5 pr-2 text-foreground outline-none transition-colors",
              "hover:bg-muted/60",
              "focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              "data-popup-open:bg-muted",
            )}
          />
        }
      >
        <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-[13px] font-semibold">
          {current.initials}
        </div>
        <span className="text-[14px] font-semibold">{current.name}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px]" align="start" sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Workspaces
          </DropdownMenuLabel>
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} className="gap-2">
              <div className="grid size-5 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                {w.initials}
              </div>
              <span className="flex-1">{w.name}</span>
              {w.current && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  atual
                </span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-sm">
            <Plus className="size-4" />
            Criar workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppTopbar() {
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 bg-background px-3">
      <div className="flex min-w-0 items-center gap-1">
        <WorkspaceSwitcher />
      </div>

      <div className="mx-auto flex w-full max-w-xl items-center">
        <button
          type="button"
          onClick={() => openCommandPalette(true)}
          className={cn(
            "group flex h-8 w-full items-center gap-2 rounded-md border border-border bg-muted/30 px-3 text-sm text-muted-foreground transition-colors",
            "hover:bg-muted/60 hover:border-input",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Pesquisar</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1 text-[10px] font-mono text-muted-foreground sm:inline-flex">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="IA">
                <Sparkles className="size-4" />
              </Button>
            }
          />
          <TooltipContent>Perguntar à IA</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Compartilhar">
                <Share2 className="size-4" />
              </Button>
            }
          />
          <TooltipContent>Compartilhar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Notificações">
                <Bell className="size-4" />
              </Button>
            }
          />
          <TooltipContent>Notificações</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Menu do usuário"
                className="rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
              />
            }
          >
            <Avatar size="sm">
              <AvatarImage src="" alt="" />
              <AvatarFallback>RB</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="text-sm font-medium text-foreground">Robério</div>
                <div className="text-xs text-muted-foreground">
                  roberio@gmail.com
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Atalhos de teclado</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
