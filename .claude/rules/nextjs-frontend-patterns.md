# Padroes Next.js 16 + React 19 + Frontend

**Aplicavel a:** Projetos Next.js 16 App Router, React 19, TypeScript, com shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod.

Skill carregado pelos agents Strategist, Implementer e Reviewer.

> AVISO Next.js 16: APIs, convencoes e estrutura de arquivos mudaram. SEMPRE consulte `node_modules/next/dist/docs/` antes de assumir comportamento. Heed deprecation notices.

---

## 1. APP ROUTER (Next 16)

### Estrutura

```
src/app/
  layout.tsx              # root layout (obrigatorio)
  page.tsx                # rota /
  providers.tsx           # client providers (QueryClient, Theme, etc.)
  globals.css             # tailwind base + tokens
  (group)/                # route group — nao afeta URL
    layout.tsx            # layout do grupo
    feature/
      page.tsx            # rota /feature
      [id]/
        page.tsx          # rota /feature/:id
        loading.tsx       # streaming UI
        error.tsx         # boundary
```

### Server Components por padrao

```tsx
// app/tasks/page.tsx — SERVER (default)
export default async function TasksPage() {
  // fetch direto, sem useEffect
  const tasks = await getTasks();
  return <TaskList tasks={tasks} />;
}
```

### Client Component quando precisar de interatividade

```tsx
// components/task-form.tsx
'use client';  // OBRIGATORIO no topo

import { useState } from 'react';
export function TaskForm() { ... }
```

**Regra:** Server por padrao. `'use client'` SO quando precisa de state, effects, browser APIs ou event handlers.

### Mover client para a folha

Componentes pais ficam Server, so a folha interativa vira Client. Evita arrastar bundle.

---

## 2. DATA FETCHING

### Server: fetch + cache

```tsx
// Server Component
async function getTasks(spaceId: string) {
  const res = await fetch(`${API}/spaces/${spaceId}/tasks`, {
    next: { revalidate: 60, tags: [`space:${spaceId}:tasks`] }
  });
  if (!res.ok) throw new Error('Failed to load tasks');
  return res.json();
}
```

### Client: TanStack Query

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTasks(spaceId: string) {
  return useQuery({
    queryKey: ['tasks', spaceId],
    queryFn: () => api.get(`/spaces/${spaceId}/tasks`).then(r => r.data),
    staleTime: 30_000,
  });
}
```

### Mutations + invalidacao

```tsx
const queryClient = useQueryClient();

const createTask = useMutation({
  mutationFn: (dto: CreateTaskDto) => api.post('/tasks', dto),
  onSuccess: (_, vars) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', vars.spaceId] });
  },
});
```

### Query keys consistentes

Crie um module helper:

```ts
// lib/query-keys.ts
export const qk = {
  tasks: {
    bySpace: (spaceId: string) => ['tasks', 'space', spaceId] as const,
    byId: (id: string) => ['tasks', 'id', id] as const,
  },
};
```

---

## 3. FORMS — React Hook Form + Zod

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Obrigatorio').max(120),
  dueDate: z.date().optional(),
});

type FormData = z.infer<typeof schema>;

export function TaskForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await createTask.mutateAsync(data);
    form.reset();
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

**Sempre** validar no client (UX) E no server (seguranca — backend separado).

---

## 4. STATE — quando usar o que

| Estado | Solucao |
|--------|---------|
| Server data (lista, detail) | TanStack Query |
| Form local | React Hook Form |
| UI global pequena (modal, sidebar open) | Zustand |
| UI local de 1 componente | `useState` |
| URL state (filtros, pagina) | `useSearchParams` + router |
| Theme | `next-themes` |

**NAO** use Zustand para server data. **NAO** use Context para state pesado (re-render hell).

### Zustand pattern

```tsx
// lib/stores/ui-store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

---

## 5. SHADCN/UI

### Adicionar componentes via CLI

```bash
npx shadcn@latest add button card dialog
# Cria em components/ui/
```

### Composicao, nao customizacao via prop

```tsx
// CORRETO — usa Slot + asChild
<Button asChild>
  <Link href="/tasks">Ver tasks</Link>
</Button>

// CORRETO — compor variantes com cn()
<Card className={cn('border-primary', className)}>
```

### NAO editar `components/ui/*` direto sem intencao

Esses arquivos vem do shadcn CLI. Editar e ok, mas saiba que voce esta divergindo do upstream.

---

## 6. STYLING — Tailwind CSS 4

### Tokens CSS, nao @apply

Tailwind 4 usa CSS variables. Defina tokens em `globals.css`:

```css
@theme {
  --color-primary: oklch(0.7 0.15 250);
  --radius-lg: 0.75rem;
}
```

### Use `cn()` helper

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'rounded-lg p-4',
  isActive && 'ring-2 ring-primary',
  className
)} />
```

### Variants com `class-variance-authority`

```tsx
import { cva } from 'class-variance-authority';

const badge = cva('px-2 py-1 rounded text-sm', {
  variants: {
    intent: {
      info: 'bg-blue-100 text-blue-900',
      warn: 'bg-yellow-100 text-yellow-900',
    },
  },
});
```

---

## 7. ROUTING & NAVIGATION

### Use `next/link` para navegacao interna

```tsx
import Link from 'next/link';
<Link href={`/tasks/${id}`} prefetch>Abrir</Link>
```

### Programatica: `useRouter`

```tsx
'use client';
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/tasks');
router.refresh();  // re-fetch server data
```

### Dynamic params

Next 16 params podem ser async — verificar `node_modules/next/dist/docs/` antes:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

---

## 8. PERFORMANCE

### Imagens: `next/image` SEMPRE

```tsx
import Image from 'next/image';
<Image src="/logo.png" width={120} height={40} alt="..." priority />
```

### Code splitting com dynamic

```tsx
import dynamic from 'next/dynamic';
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <Skeleton />,
});
```

### Streaming com `<Suspense>`

```tsx
<Suspense fallback={<TaskListSkeleton />}>
  <TaskList />  {/* async server component */}
</Suspense>
```

### Memoizacao seletiva

`useMemo`/`React.memo` so quando profiler mostra problema. React 19 otimiza muito sozinho.

---

## 9. ACESSIBILIDADE

- Botoes interativos: `<button>`, nunca `<div onClick>`
- Labels associados a inputs (`htmlFor`)
- Foco visivel (nao remover outline sem substituir)
- `aria-label` em icon-only buttons
- Modal/Dialog do shadcn ja vem com focus trap, mantenha

```tsx
// CORRETO
<Button aria-label="Deletar task" size="icon">
  <Trash />
</Button>
```

---

## 10. ERROR & LOADING UI

```
app/tasks/
  page.tsx
  loading.tsx     # skeleton enquanto carrega
  error.tsx       # boundary (client component)
  not-found.tsx   # 404
```

```tsx
// error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert">
      <h2>Algo deu errado</h2>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
```

---

## 11. AXIOS / API CLIENT

```ts
// lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      // redirect login, refresh token, etc.
    }
    return Promise.reject(err);
  }
);
```

**Nunca expor secrets em `NEXT_PUBLIC_*`** — qualquer var com esse prefixo vai pro bundle do cliente.

---

## 12. TYPE SAFETY

### Strict mode, zero `any`

```ts
// ERRADO
function handle(data: any) { ... }

// CORRETO
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) { ... }
}
```

### Tipos derivados de schemas Zod

```ts
const TaskSchema = z.object({ id: z.string(), title: z.string() });
type Task = z.infer<typeof TaskSchema>;
```

### Props tipadas

```tsx
interface TaskCardProps {
  task: Task;
  onSelect?: (id: string) => void;
}

export function TaskCard({ task, onSelect }: TaskCardProps) { ... }
```

---

## 13. DRAG & DROP — @dnd-kit

```tsx
'use client';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
    {tasks.map(t => <SortableTask key={t.id} task={t} />)}
  </SortableContext>
</DndContext>
```

**Persistencia:** otimista local + mutate no backend; reverter on error.

---

## 14. ERROS COMUNS A EVITAR

### `'use client'` arrastando tudo
Mover apenas a folha interativa para Client, manter pais como Server.

### `useEffect` para fetch
Use TanStack Query (client) ou async Server Component. `useEffect` so para integracao com browser API real (resize, scroll, etc.).

### State derivado em useState
```tsx
// ERRADO — duplica fonte de verdade
const [filtered, setFiltered] = useState(items.filter(...));

// CORRETO — derive na render
const filtered = useMemo(() => items.filter(...), [items, filter]);
```

### Mutar arrays/objetos em state
```tsx
// ERRADO
setTasks(tasks => { tasks.push(novo); return tasks; });

// CORRETO
setTasks(tasks => [...tasks, novo]);
```

### Console.log em producao
Use logger ou remova antes de commitar. ESLint pega.

### Index como key em listas dinamicas
Use ID estavel. Index quebra reorder/DnD.

### Fetch em Server Component sem `cache`/`revalidate`
Decida explicitamente: estatico, ISR, ou dynamic. Nao deixe default acidental.

---

## 15. CHECKLIST DE QUALIDADE (frontend)

Antes de considerar codigo "pronto":

- [ ] `npm run build` passa
- [ ] `npm run lint` sem erros
- [ ] TypeScript 0 errors
- [ ] Zero `any` injustificado
- [ ] Zero `console.log`
- [ ] Server Component por padrao, Client so onde precisa
- [ ] `'use client'` apenas em folhas interativas
- [ ] TanStack Query para server data no client (nao useEffect)
- [ ] Forms com RHF + Zod (validacao client)
- [ ] Mutations invalidam queryKeys corretas
- [ ] `next/image` para imagens (nao `<img>`)
- [ ] `next/link` para nav interna (nao `<a>`)
- [ ] Loading/error UI presentes em rotas async
- [ ] Acessibilidade: labels, aria, foco visivel
- [ ] Imports organizados (externos, internos, types)
- [ ] Nomes claros, componentes pequenos
- [ ] Sem secrets em `NEXT_PUBLIC_*`
- [ ] Consultou `node_modules/next/dist/docs/` se usou API nova do Next 16
