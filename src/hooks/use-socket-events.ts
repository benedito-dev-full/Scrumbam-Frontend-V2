"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { getSocket, type ListEventEnvelope } from "@/lib/realtime/socket";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";

/**
 * Escuta os avisos de tempo real da lista e recarrega seus dados.
 *
 * Estratégia "avisar para invalidar": ao receber qualquer evento de board da
 * lista (`task.*` ou `block.*`), invalida as queries da lista inteira
 * (`byProject` + `blocks` + `blockTasks`) e o TanStack Query refaz o fetch.
 * O servidor NÃO envia o patch — só o aviso.
 *
 * Filtro de eco: ignora eventos cujo `actorId` é o próprio usuário logado
 * (`user.entidadeId`) — a mudança que EU fiz já está refletida pela mutação
 * local, não preciso recarregar por causa do meu próprio aviso.
 *
 * Escuta o canal único `'list:event'` (contrato ADR-V2-063). No-op em modo
 * mock ou sem token.
 *
 * @param listId - ID do DProject (List) cujos eventos queremos consumir.
 *
 * @example
 * ```tsx
 * useListRoom(listId);     // entra na sala
 * useSocketEvents(listId); // reage aos avisos da sala
 * ```
 */
export function useSocketEvents(listId: string | null): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const myEntidadeId = useAuthStore((s) => s.user?.entidadeId ?? null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!listId) return;
    const socket = getSocket(accessToken);
    if (!socket) return;

    const onListEvent = (envelope: ListEventEnvelope) => {
      // Só reage a eventos da lista que estou olhando.
      if (envelope.listId !== listId) return;
      // Filtro de eco: ignora a minha própria ação.
      if (myEntidadeId && envelope.actorId === myEntidadeId) return;

      // "Avisar para invalidar" — recarrega a lista inteira (tasks + blocks).
      queryClient.invalidateQueries({ queryKey: qk.tasks.byProject(listId) });
      queryClient.invalidateQueries({ queryKey: qk.tasks.blocks(listId) });
      queryClient.invalidateQueries({ queryKey: ["tasks", "block-tasks"] });
    };

    socket.on("list:event", onListEvent);
    return () => {
      socket.off("list:event", onListEvent);
    };
  }, [listId, accessToken, myEntidadeId, queryClient]);
}
