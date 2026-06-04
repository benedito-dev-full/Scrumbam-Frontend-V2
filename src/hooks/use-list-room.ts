"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useEffect } from "react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { joinList, leaveList } from "@/lib/realtime/socket";
import { useAuthStore } from "@/lib/stores/auth";

/**
 * Entra na sala de tempo real `list:{listId}` enquanto o componente está
 * montado e sai automaticamente ao desmontar (ou ao trocar de lista).
 *
 * Protocolo (fechado com o backend — ADR-V2-063):
 *  - emite `join:list { listId }` → servidor valida RBAC e responde `joined:list`
 *  - emite `leave:list { listId }` no cleanup
 *
 * No-op em modo mock ou sem token (`getSocket` retorna `null`).
 *
 * @param listId - ID do DProject (List) cuja sala queremos acompanhar.
 *
 * @example
 * ```tsx
 * useListRoom(listId);        // entra na sala enquanto a página da lista vive
 * ```
 */
export function useListRoom(listId: string | null): void {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!listId || !accessToken) return;

    // joinList registra a sala como "desejada" e emite agora (se conectado) ou
    // no próximo `connect` (replay centralizado em socket.ts) — imune à corrida
    // entre o pedido de entrada e o momento em que a conexão sobe.
    joinList(accessToken, listId);

    return () => leaveList(listId);
  }, [listId, accessToken]);
}
