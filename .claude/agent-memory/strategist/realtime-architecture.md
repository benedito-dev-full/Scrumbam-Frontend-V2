---
name: realtime-architecture
description: Decisao arquitetural de WebSocket real-time para o board da lista — socket.io + salas por lista + consumer desacoplado + invalidate TanStack Query
metadata:
  type: project
---

# Real-Time WebSocket — Decisao Arquitetural (Task 6)

**Data:** 2026-06-03

## Decisao

Socket.io com salas `list:{id}`. Gateway NestJS desacoplado via RealtimeConsumer (nao injetado nos services de dominio). Frontend invalida TanStack Query ao receber evento — nao aplica patch direto.

## Estrutura

- Backend: `src/realtime/` — RealtimeGateway + RealtimeConsumer + WsJwtGuard + RealtimeModule
- Frontend: `src/lib/socket.ts` (singleton) + `SocketProvider` em providers.tsx + hooks `useListRoom` e `useSocketEvents`
- Protocolo: cliente emite `join:list` / `leave:list`; servidor emite `task.*` / `block.*` para a sala

## Fluxo

`TasksService.update() → EventProducerService → RealtimeConsumer → RealtimeGateway → socket room 'list:{id}' → useSocketEvents → invalidateQueries`

## Novos event-types a adicionar

`task.updated`, `block.updated`, `block.created`, `block.deleted` em `src/eventos/core/event-types.ts`

## Dependencias a instalar

Backend: `@nestjs/websockets @nestjs/platform-socket.io socket.io`
Frontend: `socket.io-client`

## Auth do socket

JWT via query param `?token=<accessToken>` no handshake. WsJwtGuard valida com JWT_SECRET.

## Filtro de eco

Frontend filtra actorId === myEntidadeId para nao fazer double-refetch quando o proprio usuario causou a mudanca.

## Escala futura

Redis adapter (`@socket.io/redis-adapter`) quando horizontal scaling — ioredis ja instalado no backend.

**Why:** socket.io tem rooms, reconexao automatica, fallback long-polling e suporte NestJS oficial. SSE descartado (unidirecional, sem rooms). Polling descartado (latencia, carga).

**How to apply:** Plano completo em `workspace/plans/plan-realtime-websocket-board-task6.md`. Implementer deve ler audit-log.consumer.ts e event-router.service.ts antes de criar o RealtimeConsumer.
