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
  },
  tasks: {
    all: ["tasks"] as const,
    byProject: (projectId: string) => ["tasks", "project", projectId] as const,
    byId: (id: string) => ["tasks", id] as const,
    bySprint: (sprintId: string) => ["tasks", "sprint", sprintId] as const,
    assigned: (userId: string) => ["tasks", "assigned", userId] as const,
    filtered: (filters: TaskFilters) => ["tasks", "filtered", filters] as const,
  },
  sprints: {
    byProject: (projectId: string) => ["sprints", "project", projectId] as const,
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
  },
  workflowStatuses: {
    byProject: (projectId: string) =>
      ["workflow-statuses", "project", projectId] as const,
  },
} as const;
