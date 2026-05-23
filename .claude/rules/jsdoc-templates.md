# JSDoc Templates (Frontend — React 19 + Next 16 + TypeScript)

Templates para documentar codigo TypeScript de forma consistente neste projeto frontend.

Idioma: comentarios/JSDoc em **portugues brasileiro**; identificadores em ingles.

---

## 1. COMPONENTE REACT

```tsx
/**
 * Card de exibicao de uma task no board.
 *
 * Renderiza titulo, assignees, prioridade e due date. Usado em `TaskList`,
 * `KanbanColumn` e `PlannerGrid`. Suporta selecao (checkbox) e abre
 * detalhes via prop `onSelect`.
 *
 * @example
 * <TaskCard task={task} onSelect={(id) => router.push(`/tasks/${id}`)} />
 */
interface TaskCardProps {
  /** Task a ser renderizada */
  task: Task;
  /** Callback ao clicar no card; recebe o id da task */
  onSelect?: (id: string) => void;
  /** Classes extras para composicao com cn() */
  className?: string;
}

export function TaskCard({ task, onSelect, className }: TaskCardProps) { ... }
```

### Dicas
- Documente o **componente** acima da interface de props (ou da funcao).
- Comente props **nao-obvias** (callbacks, flags de comportamento). Skip props triviais como `children`.
- `@example` ajuda muito em componentes com muitas variantes ou compostos.

---

## 2. HOOK CUSTOMIZADO

```tsx
/**
 * Busca as tasks de um Space via TanStack Query.
 *
 * Cacheia por `qk.tasks.bySpace(spaceId)`. `staleTime` de 30s — refetch
 * automatico ao focar a janela ou montar de novo apos esse periodo.
 *
 * @param spaceId - ID do Space (UUID)
 * @returns Resultado do `useQuery` (`data`, `isLoading`, `error`, etc.)
 *
 * @example
 * const { data: tasks, isLoading } = useTasks(space.id);
 */
export function useTasks(spaceId: string) {
  return useQuery({
    queryKey: qk.tasks.bySpace(spaceId),
    queryFn: () => api.get(`/spaces/${spaceId}/tasks`).then(r => r.data),
    staleTime: 30_000,
  });
}
```

```tsx
/**
 * Cria uma task e invalida a lista do space correspondente.
 *
 * @returns Mutation handle (`mutate`, `mutateAsync`, `isPending`, ...)
 *
 * @example
 * const createTask = useCreateTask();
 * await createTask.mutateAsync({ spaceId, title: 'Nova' });
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => api.post('/tasks', dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.tasks.bySpace(vars.spaceId) });
    },
  });
}
```

---

## 3. ZUSTAND STORE

```ts
/**
 * Store de UI global (sidebar, modais, command palette).
 *
 * Reservado para state cross-componente que NAO e server data
 * (server data vai pra TanStack Query). Cada slice deve ser pequeno
 * e focado — se crescer, dividir em stores separados.
 *
 * @example
 * const sidebarOpen = useUIStore(s => s.sidebarOpen);
 * const toggle = useUIStore(s => s.toggleSidebar);
 */
interface UIState {
  /** Sidebar principal aberta/fechada */
  sidebarOpen: boolean;
  /** Toggle do sidebar */
  toggleSidebar: () => void;
  /** Command palette (cmdk) aberto */
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
}));
```

---

## 4. SCHEMA ZOD + TYPE INFERIDO

```ts
/**
 * Input para criar uma nova task.
 *
 * Validado no client (RHF) antes do submit. O backend revalida (defesa
 * em profundidade) — schemas devem espelhar o DTO do Scrumban-Backend-V3.
 */
export const createTaskSchema = z.object({
  /** Titulo da task (1-120 caracteres) */
  title: z.string().min(1, 'Obrigatorio').max(120),
  /** Descricao em markdown (opcional) */
  description: z.string().optional(),
  /** ID do Space onde criar */
  spaceId: z.string().uuid(),
  /** Data de vencimento (ISO) */
  dueDate: z.date().optional(),
  /** Prioridade — default 'medium' no backend */
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

/** Tipo derivado do schema — fonte unica de verdade. */
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

---

## 5. SERVER COMPONENT (Page / Layout)

```tsx
/**
 * Pagina /spaces/[id] — overview de um Space.
 *
 * Server Component. Faz fetch direto (sem useEffect) com revalidate de
 * 60s e cache tag `space:{id}` para invalidacao via `revalidateTag`
 * apos mutations.
 *
 * @see qk para query keys do client side
 */
export default async function SpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const space = await getSpace(id);
  return <SpaceOverview space={space} />;
}
```

---

## 6. UTILS / HELPERS

```ts
/**
 * Combina classes Tailwind com merge inteligente (resolve conflitos).
 *
 * Wrapper de `clsx` + `tailwind-merge`. Use SEMPRE para classes
 * condicionais — nao concatene strings manualmente.
 *
 * @example
 * cn('p-4 rounded', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

```ts
/**
 * Formata data para exibicao no formato pt-BR curto.
 *
 * @param date - Date ou string ISO
 * @param withTime - Se true, inclui hora (ex.: "23 mai, 14:30")
 * @returns String formatada (ex.: "23 mai 2026")
 *
 * @example
 * formatDate(task.dueDate)         // "23 mai 2026"
 * formatDate(task.createdAt, true) // "23 mai, 14:30"
 */
export function formatDate(date: Date | string, withTime = false): string { ... }
```

---

## 7. QUERY KEYS HELPER

```ts
/**
 * Factory de query keys para TanStack Query.
 *
 * Centraliza chaves para evitar typos e facilitar invalidacao.
 * SEMPRE use este helper — nunca string inline.
 *
 * @example
 * useQuery({ queryKey: qk.tasks.byId(id), ... })
 * queryClient.invalidateQueries({ queryKey: qk.tasks.bySpace(spaceId) })
 */
export const qk = {
  tasks: {
    all: ['tasks'] as const,
    bySpace: (spaceId: string) => ['tasks', 'space', spaceId] as const,
    byId: (id: string) => ['tasks', 'id', id] as const,
  },
  spaces: {
    all: ['spaces'] as const,
    byId: (id: string) => ['spaces', id] as const,
  },
} as const;
```

---

## 8. ENUMS / CONSTANTS

```ts
/**
 * Status possiveis de uma task no quadro.
 *
 * Espelha o enum do backend. Adicionar novos status requer atualizar
 * tambem o board (`KanbanColumn`) e a paleta de cores em `space-customization.ts`.
 */
export enum TaskStatus {
  /** Backlog — ainda nao iniciada */
  PENDING = 'pending',
  /** Em execucao */
  IN_PROGRESS = 'in_progress',
  /** Concluida */
  DONE = 'done',
}
```

---

## 9. TAGS UTEIS

| Tag | Uso |
|-----|-----|
| `@deprecated` | Componente/hook obsoleto; indicar alternativa |
| `@see` | Referencia a outro componente/hook/arquivo |
| `@internal` | Publico tecnicamente mas nao deve ser usado fora do modulo |
| `@remarks` | Notas adicionais apos o `@returns` |
| `@beta` | Feature experimental, pode mudar |

```tsx
/**
 * Card legado de task.
 *
 * @deprecated Use `<TaskCard>` em vez disso. Sera removido apos a migracao do `/planner`.
 * @see TaskCard
 */
export function TaskCardLegacy() { ... }
```

---

## 10. EVITAR

### Redundancia com TypeScript

```ts
// RUIM — JSDoc so repete o que o tipo ja diz
/**
 * @param task - A task
 * @param onSelect - O callback
 */
function TaskCard({ task, onSelect }: TaskCardProps) { ... }
```

```ts
// BOM — JSDoc adiciona contexto que o tipo nao tem
/**
 * Card de exibicao de uma task no board.
 *
 * Usado em TaskList, KanbanColumn e PlannerGrid. Suporta selecao
 * via checkbox e abre detalhes via onSelect.
 */
function TaskCard({ task, onSelect }: TaskCardProps) { ... }
```

### JSDoc em tudo

NAO precisa documentar:
- Componentes triviais de 1 linha (`<Spacer />`, wrappers obvios)
- Handlers locais (`handleClick`, `onChange` inline)
- Getters/setters triviais de stores
- Helpers obvios com nome auto-explicativo

DOCUMENTE:
- Componentes publicos reusaveis (`components/ui/*`, `components/shell/*`)
- Hooks customizados (`useTasks`, `useCreateTask`)
- Stores Zustand
- Schemas Zod (com comentario por campo nao-obvio)
- Utils em `lib/`
- Server Components com fetch (deixar claro cache strategy)

---

## 11. QUANDO DOCUMENTAR

- [ ] **SEMPRE:** Componentes reusaveis publicos (`components/`)
- [ ] **SEMPRE:** Hooks customizados (`hooks/`, `lib/`)
- [ ] **SEMPRE:** Stores Zustand
- [ ] **SEMPRE:** Schemas Zod (campos nao-obvios)
- [ ] **SEMPRE:** Utils em `lib/utils.ts` e similares
- [ ] **SEMPRE:** Server Components com `fetch` (deixar cache strategy explicita)
- [ ] **RECOMENDADO:** Tipos/interfaces compartilhados
- [ ] **OPCIONAL:** Componentes internos de uma feature so usados em 1 lugar
- [ ] **EVITAR:** Components triviais, handlers locais, getters obvios
