"use client";

/**
 * SpaceTree — árvore hierárquica Space -> Folder -> List conectada ao backend real.
 *
 * Usa os hooks `useSpaces`, `useFolders`, `useLists` (que chamam GET /projects)
 * e persiste o estado de colapso em localStorage com chave `scrumban:sidebar:expanded`.
 *
 * Fase C4 — criação de Folder/List + inline rename (ADR-V2-051).
 */

import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useMoveProject, useSpaces } from "@/hooks/use-projects";
import type { DProjectDto } from "@/lib/types/api";
import { CreateSpaceDialog } from "./create-space-dialog";
import { CreateSpaceChooserDialog } from "./create-space-chooser";
import { SpaceTemplateGalleryDialog } from "./space-template-gallery";
import { canDropOn, useExpandedState } from "./space-tree-state";
import {
  IcFolder,
  IcList,
  SpaceNode,
  SpaceTreeSkeleton,
} from "./space-tree-nodes";

export function SpaceTree() {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // Fluxo de criação: "+" abre o chooser; daí vai p/ modal em branco ou galeria.
  const [chooserOpen, setChooserOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { isExpanded, toggle, expand } = useExpandedState();

  const { data: spaces, isLoading } = useSpaces();

  // ─── Drag & drop: mover Listas/Pastas para um novo pai ───────────────────────
  const { mutate: moveProject } = useMoveProject();
  const [activeDrag, setActiveDrag] = useState<DProjectDto | null>(null);

  // Distância de 5px antes de iniciar o arraste — preserva cliques (navegação,
  // toggle de colapso, menus) sem disparar drag acidental.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const project = event.active.data.current?.project as DProjectDto | undefined;
    setActiveDrag(project ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const dragged = event.active.data.current?.project as DProjectDto | undefined;
    const target = event.over?.data.current?.project as DProjectDto | undefined;
    if (!dragged || !target || !canDropOn(event.active, target)) return;

    moveProject(
      {
        id: dragged.id,
        idClasse: dragged.idClasse,
        fromParentId: dragged.idPai,
        toParentId: target.id,
      },
      {
        onSuccess: () => {
          expand(target.id);
          toast.success(`"${dragged.nome}" movido para "${target.nome}"`);
        },
        onError: () => toast.error("Não foi possível mover. Tente novamente."),
      },
    );
  }

  return (
    <div>
      {/* cabeçalho da seção "Espaços" */}
      <div className="mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[12px] font-semibold text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3 shrink-0 transition-transform duration-150",
              sectionOpen && "rotate-90",
            )}
          />
          Espaços
        </button>

        {/* botão "+" ao lado do header */}
        <button
          type="button"
          aria-label="Novo espaço"
          onClick={() => setChooserOpen(true)}
          className="grid size-4 place-items-center rounded text-muted-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {/* lista de spaces */}
      {sectionOpen && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <div className="space-y-0.5">
            {isLoading && <SpaceTreeSkeleton />}
            {!isLoading && spaces?.map((space) => (
              <SpaceNode
                key={space.id}
                space={space}
                depth={0}
                isExpanded={isExpanded}
                onToggle={toggle}
              />
            ))}
            {/* "+ Novo Espaço" sempre visível no final */}
            {!isLoading && (
              <button
                type="button"
                onClick={() => setChooserOpen(true)}
                className="flex h-[34px] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-muted-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <Plus className="size-3.5 shrink-0" />
                Novo Espaço
              </button>
            )}
          </div>

          {/* Pré-visualização flutuante do item sendo arrastado */}
          <DragOverlay dropAnimation={null}>
            {activeDrag ? (
              <div className="flex h-[34px] max-w-[220px] items-center gap-2 rounded-[6px] border border-border bg-sidebar px-2.5 text-[13px] font-medium text-sidebar-foreground shadow-xl">
                {activeDrag.idClasse === "-351" ? (
                  <IcFolder className="shrink-0 text-muted-foreground" />
                ) : (
                  <IcList className="shrink-0 text-violet-400" />
                )}
                <span className="truncate">{activeDrag.nome}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Passo 1: escolher em branco ou template */}
      <CreateSpaceChooserDialog
        open={chooserOpen}
        onOpenChange={setChooserOpen}
        onChooseBlank={() => {
          setChooserOpen(false);
          setCreateDialogOpen(true);
        }}
        onChooseTemplate={() => {
          setChooserOpen(false);
          setGalleryOpen(true);
        }}
      />

      {/* Passo 2a: galeria de templates (criação real pendente) */}
      <SpaceTemplateGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onBack={() => {
          setGalleryOpen(false);
          setChooserOpen(true);
        }}
      />

      {/* Passo 2b: modal de criação de space "em branco" */}
      <CreateSpaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
