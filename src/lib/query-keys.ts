import type { TaskFilters } from "@/lib/types/api";

export const qk = {
  auth: {
    me: ["auth", "me"] as const,
  },
  projects: {
    all: ["projects"] as const,
    byId: (id: string) => ["projects", id] as const,
    members: (id: string) => ["projects", id, "members"] as const,
    stats: (id: string) => ["projects", id, "stats"] as const,
    /**
     * Lista de SPACEs (idClasse=-350) do usuário na org ativa.
     * Chave estável — invalida ao trocar de org via useSwitchOrg.
     */
    spaces: ["projects", "spaces"] as const,
    /**
     * Lista de FOLDERs (idClasse=-351) filhos de um SPACE específico.
     *
     * @param spaceId - ID do SPACE pai (string serializado do BigInt)
     */
    folders: (spaceId: string) => ["projects", "folders", spaceId] as const,
    /**
     * Lista de LISTs (idClasse=-352) filhos de um FOLDER específico.
     *
     * @param folderId - ID do FOLDER pai (string serializado do BigInt)
     */
    lists: (folderId: string) => ["projects", "lists", folderId] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    byProject: (projectId: string) => ["tasks", "project", projectId] as const,
    byId: (id: string) => ["tasks", id] as const,
    children: (parentId: string) => ["tasks", "children", parentId] as const,
    bySprint: (sprintId: string) => ["tasks", "sprint", sprintId] as const,
    assigned: (userId: string) => ["tasks", "assigned", userId] as const,
    filtered: (filters: TaskFilters) => ["tasks", "filtered", filters] as const,
    /**
     * Lista de Blocks (DTask idClasse=-200) de um projeto.
     *
     * @param projectId - ID do DProject (List, idClasse=-352).
     */
    blocks: (projectId: string) => ["tasks", "blocks", projectId] as const,
    /**
     * Tasks vinculadas a um bloco via dados.idBloco (Opção A).
     *
     * @param blockId - ID do Block (DTask idClasse=-200).
     */
    blockTasks: (blockId: string) => ["tasks", "block-tasks", blockId] as const,
  },
  sprints: {
    byProject: (projectId: string) =>
      ["sprints", "project", projectId] as const,
    byId: (id: string) => ["sprints", id] as const,
  },
  teams: {
    all: ["teams"] as const,
    byId: (id: string) => ["teams", id] as const,
    members: (id: string) => ["teams", id, "members"] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    byId: (id: string) => ["organizations", id] as const,
    members: (id: string) => ["organizations", id, "members"] as const,
    invites: (id: string) => ["organizations", id, "invites"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (unreadOnly: boolean) =>
      ["notifications", "list", { unreadOnly }] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  workflowStatuses: {
    byProject: (projectId: string) =>
      ["workflow-statuses", "project", projectId] as const,
  },
} as const;
