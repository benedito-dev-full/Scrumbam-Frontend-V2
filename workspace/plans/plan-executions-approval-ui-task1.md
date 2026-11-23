# Plano (escopo frontend) - Aprovar/Rejeitar execucoes de IA - Task 1

Copiado de backend/workspace/plans/plan-executions-risk-gate-prompt-mode-task1.md (secao Escopo frontend).

## Escopo frontend (contrato para a esteira do frontend — executar depois)

**Onde:** `frontend/src/components/tasks/task-detail-drawer-ai.tsx` (estado `awaiting_approval`, linhas ~32-63) + `frontend/src/hooks/use-task-execution.ts` (polling/mapeamento de status, linhas ~120-193).

**Quem vê os botões:** somente quando `project.myRole === 'MANAGER'` (campo já presente em `ProjectResponseDto`; backend reforça com 403 para não-gestor). Demais membros veem só o aviso.

**Estados:**

```
awaiting_approval ──[Aprovar]──► approved → (queued/executando) → DONE/FAILED
        │          ──[Rejeitar]─► rejected  (terminal)
        └──(1h, sweeper)────────► expired   (terminal)
```

| Estado | Gestor (MANAGER) | Membro |
|--------|------------------|--------|
| `awaiting_approval` | Badge risco (MEDIUM âmbar / HIGH vermelho) + motivo (`risk.explanation`) + expira em (`approval.expiresAt`) + **[Aprovar]** + **[Rejeitar]** | "Aguardando aprovação do gestor do projeto" + expira em |
| `approved` | segue fluxo normal de execução | idem |
| `rejected` | "Rejeitada por X: {rejectedReason}" | idem |
| `expired` | "Aprovação expirou" + opção de disparar de novo | idem |

**Endpoints:**
- `POST /api/v1/executions/:id/approve` — body `{ notes?: string (≤500) }` → 200 `ExecutionResponseDto`.
- `POST /api/v1/executions/:id/reject` — body `{ reason: string (10..1000) }` (obrigatório → modal com textarea + validação de tamanho) → 200.
- Erros: **403** (não é gestor) → esconder botões e mostrar toast; **409** (outro gestor já decidiu / expirou) → refetch e mostrar estado atual.
- Opcional: `GET /api/v1/executions?projectId=X&status=awaiting_approval` para um contador/lista "pendentes de aprovação".

**Campos da resposta usados:** `riskLevel`, `approval.status`, `approval.expiresAt`, `approval.rejectedReason`, `approval.rejectedBy`, `risk.explanation` (novo, opcional — tratar ausência).

**Correção de copy:** o texto atual "Aguardando aprovação (risco ALTO)..." deve usar `riskLevel` real.

---

