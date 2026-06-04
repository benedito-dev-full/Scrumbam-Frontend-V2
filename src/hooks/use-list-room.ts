"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useEffect } from "react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { getSocket } from "@/lib/realtime/socket";
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
    if (!listId) return;
    const socket = getSocket(accessToken);
    if (!socket) return;

    const join = () => socket.emit("join:list", { listId });

    // Só faz sentido emitir `join:list` quando o socket JÁ está conectado.
    // O handshake é assíncrono: se o socket acabou de ser criado, `connected`
    // ainda é false e um emit imediato se perde. Por isso:
    //  - se já conectado → entra agora;
    //  - sempre escuta `connect` → entra (e re-entra a cada reconexão, pois
    //    a sala é perdida no servidor quando a conexão cai).
    if (socket.connected) join();
    socket.on("connect", join);

    return () => {
      socket.off("connect", join);
      if (socket.connected) socket.emit("leave:list", { listId });
    };
  }, [listId, accessToken]);
}
