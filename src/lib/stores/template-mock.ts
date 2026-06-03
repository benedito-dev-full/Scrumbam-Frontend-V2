"use client";

import { create } from "zustand";

import type { BlockDto, TaskResponseDto } from "@/lib/types/api";
import type { SpaceTemplate } from "@/lib/templates/space-templates";

/**
 * Conteúdo mock (em memória) de uma Lista criada a partir de um template.
 *
 * [MOCK — REMOVER NA INTEGRAÇÃO] Enquanto o backend não expõe
 * `POST /projects/from-template`, a criação a partir de template cria a casca
 * real da Lista (vazia) e injeta AQUI os blocos + tarefas do template. Os hooks
 * `useBlocks`/`useTasksByProject` consultam este store e, quando a lista está
 * registrada, devolvem o conteúdo mock SEM ir à rede. Nada disso persiste —
 * recarregar a página descarta o conteúdo (a casca da Lista permanece).
 */
interface MockListContent {
  /** Blocos da Lista (DTask idClasse=-200). */
  blocks: BlockDto[];
  /** Tarefas-folha (DTask idClasse=-154), ligadas ao bloco via `dados.idBloco`. */
  tasks: TaskResponseDto[];
}

interface TemplateMockState {
  /** Mapa listId → conteúdo mock registrado. */
  byList: Record<string, MockListContent>;
  /** Registra o conteúdo de um template para uma Lista recém-criada. */
  registerFromTemplate: (listId: string, template: SpaceTemplate) => void;
}

/** Paleta ciclada para colorir os blocos do template na prévia/board. */
const BLOCO_CORES = ["#7c5cff", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"];

export const useTemplateMockStore = create<TemplateMockState>((set) => ({
  byList: {},
  registerFromTemplate: (listId, template) =>
    set((state) => ({
      byList: { ...state.byList, [listId]: buildMockContent(listId, template) },
    })),
}));

/**
 * Converte um template em blocos (idClasse -200) + tarefas (idClasse -154).
 *
 * Os ids são strings NUMÉRICAS de propósito: o mapper `buildGroupsBoard`
 * ordena as tarefas-raiz com `BigInt(id)`, que estoura em ids não numéricos.
 * A base usa o relógio para não colidir com ids reais nem entre registros.
 */
function buildMockContent(listId: string, template: SpaceTemplate): MockListContent {
  const now = new Date().toISOString();
  const base = 9_000_000_000_000 + (Date.now() % 1_000_000) * 1000;

  const blocks: BlockDto[] = [];
  const tasks: TaskResponseDto[] = [];
  let taskSeq = 0;

  template.blocks.forEach((block, bi) => {
    const blockId = String(base + bi);
    blocks.push({
      id: blockId,
      identifier: `BLK-${bi + 1}`,
      nome: block.nome,
      status: "INBOX",
      statusId: "0",
      projectId: listId,
      idClasse: "-200",
      criadoEm: now,
      atualizadoEm: now,
      dados: { ordem: bi, cor: BLOCO_CORES[bi % BLOCO_CORES.length] },
    });

    block.tasks.forEach((task) => {
      taskSeq += 1;
      tasks.push({
        id: String(base + 100_000 + taskSeq),
        identifier: `TPL-${taskSeq}`,
        nome: task.titulo,
        status: "INBOX",
        statusId: "0",
        projectId: listId,
        idClasse: "-154",
        ...(task.priority ? { priority: task.priority } : {}),
        criadoEm: now,
        atualizadoEm: now,
        // Liga a tarefa ao bloco — é por `dados.idBloco` que o mapper distribui
        // as tarefas-folha pelos grupos (NÃO por idPai, que é subtarefa).
        dados: { idBloco: blockId },
      });
    });
  });

  return { blocks, tasks };
}
