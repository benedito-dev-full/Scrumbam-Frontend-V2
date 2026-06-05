# Handoff Frontend — Feature Multi-Provider de IA (Nexus)

> **Para:** o Claude (ou dev) que vai implementar o frontend desta feature.
> **De:** sessão de backend que construiu e fez deploy da feature.
> **Status backend:** ✅ 100% implementado, testado (Reviewer ≥8), commitado e indo para produção (push → deploy → `prisma migrate deploy` → `npm run seed`).
> **Status frontend:** ❌ ainda NÃO existe. Este documento é tudo que você precisa.
> **Data:** 2026-06-05

---

## 1. O QUE A FEATURE FAZ (contexto de produto)

Hoje o chat **Nexus** (aba de IA) é acoplado a **um único provedor** (Gemini), com a chave vindo do `.env` do servidor. A feature transforma isso em **multi-provider**: o usuário pode escolher entre **Gemini, Claude e OpenAI**, e cada **organização** cadastra suas **próprias chaves de API**.

### Decisões de produto TRAVADAS (não reabrir sem o CEO)
- **Nível da chave = Organização** (não por usuário). Justificativa do CEO: uma empresa com plano team não vai pedir para cada funcionário colar a própria chave.
- **Só ADMIN/OWNER da org cadastra/edita/remove chave.** Membro comum NÃO vê nem cadastra chave — só vê *quais* providers estão disponíveis e usa o chat.
- **Cascata de resolução da chave:** `user → org → global (env) → erro`. O nível **user está desligado** (flag `ENABLE_USER_LEVEL_KEYS=false`) — **não construa UI de chave por usuário.**
- **Seleção de PROVIDER agora; seleção de MODELO específico fica para depois.** O campo `model` existe no backend mas é opcional e secundário. Foque em escolher o **provider**.
- **Chaves cifradas at-rest** no backend (AES-256-GCM). Isso é transparente para o frontend — você nunca vê a chave crua; o backend SEMPRE devolve mascarada (`sk-ant-…f3a9`).

### Estado de produção no momento deste handoff
- ✅ `GOOGLE_API_KEY` (Gemini) configurada como fallback global → **Gemini funciona para todas as orgs** mesmo sem cadastrar chave.
- ❌ **Sem** chave OpenAI no servidor. OpenAI só funciona se a org cadastrar a própria. Se alguém escolher OpenAI sem chave → erro amigável (502).
- ❌ **Sem** chave Claude global. Mesmo caso: org precisa cadastrar a própria.

---

## 2. CONTRATOS HTTP DO BACKEND (fonte da verdade — já em produção)

Base: o axios singleton do frontend (`@/lib/api`) já injeta o `Bearer` token e cuida de refresh em 401. **Todas as rotas abaixo exigem autenticação.** O `orgId` é SEMPRE derivado do JWT no backend — **nunca** mandar orgId no body.

### 2.1. `POST /ai/chat` — enviar mensagem (MODIFICADO)
A rota que já existe ganhou **dois campos opcionais** no body:

```jsonc
// Request body
{
  "content": "Quais as tasks ativas?",  // obrigatório, 1–50000 chars
  "provider": "claude",                  // OPCIONAL: "gemini" | "claude" | "openai"
  "model": "claude-sonnet-4-5"           // OPCIONAL: string ≤100 chars (deixe de fora por ora)
}
```
- Se `provider` **ausente** → backend usa a preferência da org → senão Gemini (default).
- Se `provider` **presente** → ganha de tudo (override só desta mensagem).
- Resposta: inalterada (a `NexusMessage` do assistant, igual hoje).

### 2.2. `GET /ai/providers` — disponibilidade (acessível a QUALQUER membro)
Diz quais providers a org tem chave configurada. **Use isto para popular o seletor** e desabilitar/sinalizar os não-configurados.

```jsonc
// Response 200
{
  "providers": [
    { "provider": "gemini", "configured": true  },
    { "provider": "claude", "configured": false },
    { "provider": "openai", "configured": false }
  ]
}
```
> ⚠️ `configured: true` significa que a **org** cadastrou chave OU (no caso do Gemini) que há fallback global. Na prática hoje: Gemini quase sempre `true`; Claude/OpenAI `true` só se a org cadastrou.

### 2.3. `GET /ai/preference` — preferência default da org (membro)
```jsonc
// Response 200 — quando há preferência
{ "provider": "claude", "model": "claude-sonnet-4-5" }
// Response 200 — quando NÃO há (ou sem org)
null
```

### 2.4. `PUT /ai/preference` — definir default da org (**ADMIN-only**)
```jsonc
// Request body
{ "provider": "claude", "model": "claude-sonnet-4-5" }  // model opcional
// Response 200 — a preferência persistida
{ "provider": "claude", "model": "claude-sonnet-4-5" }
```

### 2.5. `POST /ai/keys` — cadastrar/rotacionar chave (**ADMIN-only**)
```jsonc
// Request body
{ "provider": "claude", "key": "sk-ant-api03-xxxx" }  // key: 10–500 chars
// Response 201 — SEMPRE mascarada (nunca devolve a chave crua)
{
  "provider": "claude",
  "prefix": "sk-ant-",
  "masked": "sk-ant-…f3a9",
  "configured": true,
  "createdAt": "2026-06-05T10:00:00.000Z",
  "lastRotatedAt": "2026-06-05T10:00:00.000Z"
}
```
> Cadastrar de novo o mesmo provider = **rotação** (substitui a chave). Não cria duplicata.

### 2.6. `GET /ai/keys` — listar chaves da org, mascaradas (**ADMIN-only**)
```jsonc
// Response 200 — uma entrada por provider configurado (sem plaintext)
[
  { "provider": "gemini", "prefix": "AIzaSyC", "masked": "AIzaSyC…8-Y4", "configured": true, "createdAt": "...", "lastRotatedAt": "..." }
]
```

### 2.7. `DELETE /ai/keys/:provider` — remover chave (**ADMIN-only**)
```jsonc
// :provider ∈ {gemini, claude, openai}
// Response 200
{ "deleted": true, "provider": "openai" }
// Response 404 — se a org não tinha chave desse provider
```

### Códigos de erro relevantes (todas as rotas)
| Status | Significado | O que a UI faz |
|--------|-------------|----------------|
| 400 | provider inválido / org ativa ausente / body inválido | toast de erro, não retry |
| 401 | não autenticado | axios já trata (refresh) |
| 403 | **usuário não é ADMIN** da org | esconder/bloquear a UI de gestão de chave |
| 404 | chave não existe (no DELETE) | tratar como "já removida" |
| 502 | erro de auth no provedor (chave inválida) / provedor indisponível | mensagem amigável |
| 503 | rate limit / cota do provedor | mensagem amigável (já tratado no `useNexusChat`) |
| 504 | timeout do provedor | mensagem amigável |

---

## 3. O QUE JÁ EXISTE NO FRONTEND (e o que está FALSO)

Importante: **parte da UI já existe, mas é puramente cosmética e desconectada.** Não comece do zero — religue o que há.

### 3.1. `src/app/(app)/ia/_components/model-dropdown.tsx` — ⚠️ FAKE
Já existe um dropdown de modelos, MAS:
- Os modelos são **hardcoded e fictícios**: `"Nexus²"`, `"GPT-5.5"`, `"Claude Opus 4.7"`, `"Gemini 3.1 Pro"`.
- O estado é `useState("nexus2")` **local** — não persiste, não chama backend, não afeta a mensagem enviada.
- **Ação:** este componente deve ser **reescrito** para refletir os providers reais (`gemini`/`claude`/`openai`), populado por `GET /ai/providers`, e a escolha deve realmente ir no `POST /ai/chat`.

### 3.2. `src/lib/types/nexus.ts` — falta `provider`/`model`
O `SendNexusMessageDto` só tem `{ content }`. **Adicionar** os campos opcionais `provider?` e `model?`. Criar também os tipos novos (`AiProviderName`, `AiProviderAvailability`, `AiKeyMasked`, `AiProviderPreference`).

### 3.3. `src/lib/services/nexus.service.ts` — só tem chat/history
Tem `sendMessage`, `fetchHistory`, `clearHistory`. **Faltam** os wrappers das rotas novas (`/ai/providers`, `/ai/preference`, `/ai/keys`).
> Obs.: o JSDoc atual ainda diz "encaminha para o Gemini" — desatualizado, ajuste a menção.

### 3.4. `src/hooks/use-nexus-chat.ts` — `sendMessage(content)` envia só `{content}`
A `mutationFn` é `(content) => sendMessage({ content })`. **Estender** para passar o `provider` selecionado. Já trata os erros 502/503/504 com mensagens amigáveis (reaproveite — está ótimo).

### 3.5. Detecção de ADMIN — `src/hooks/use-auth.ts`
O backend devolve `user.orgRole` no login/refresh (`AuthResponseDto`). Use o `orgRole`/`use-auth` existente (já usado em `teams`, `people`, `invite-dialog`) para decidir se mostra a UI de gestão de chave. **Padrão da casa:** veja como `invite-dialog.tsx` e `teams-list.tsx` checam admin e siga o mesmo.

---

## 4. O QUE PRECISA SER CONSTRUÍDO (escopo do frontend)

Divida em **2 frentes**. A Frente A é o mínimo para o usuário escolher provider; a Frente B é a gestão de chaves (admin).

### FRENTE A — Seletor de provider no chat (todos os membros)
**Objetivo:** o usuário escolhe entre os providers configurados e a escolha vai na mensagem.

1. **Tipos** (`nexus.ts`): adicionar `provider?`/`model?` ao `SendNexusMessageDto`; criar `AiProviderName = "gemini"|"claude"|"openai"`, `AiProviderAvailability`, `AiProviderPreference`.
2. **Service** (`nexus.service.ts`): `fetchProviders()`, `fetchPreference()`. Ajustar `sendMessage` para aceitar `{ content, provider?, model? }`.
3. **Hook**: `use-ai-providers.ts` (TanStack Query sobre `GET /ai/providers`, `staleTime` ~5min). Estender `useNexusChat` para receber/repassar o `provider`.
4. **UI**: reescrever `model-dropdown.tsx` →
   - Listar os 3 providers com nome/logo **reais**.
   - `configured: false` → item desabilitado com tooltip "Configure a chave em Configurações" (ou ocultar, decisão de UX).
   - Default selecionado = preferência da org (`GET /ai/preference`) → senão Gemini.
   - A seleção é **estado da conversa**: passa para `sendMessage` como `provider`.
5. **Persistência da escolha do usuário (leve):** pode guardar a última escolha no Zustand/localStorage para reabrir o chat no mesmo provider. NÃO confundir com a preferência da ORG (essa é do admin, via `PUT /ai/preference`).

### FRENTE B — Gestão de chaves da org (somente ADMIN)
**Objetivo:** admin cadastra/rotaciona/remove a chave de cada provider e define o default da org.

Local sugerido: uma seção em **Configurações da organização** (ex.: aba "Integrações / IA" perto de onde já existem settings de org). **Não** colar isso na tela de chat.

1. **Service**: `fetchKeys()`, `upsertKey({provider, key})`, `deleteKey(provider)`, `setPreference({provider, model?})`.
2. **Hooks**: `use-ai-keys.ts` (query `GET /ai/keys` + mutations upsert/delete + setPreference), com invalidação cruzada de `GET /ai/providers` e `GET /ai/preference` após cada mutação.
3. **UI** (card por provider):
   - Mostrar estado: `configured` + `masked` (`sk-ant-…f3a9`) + `lastRotatedAt`.
   - Campo de input para colar a chave (type=password), botão **Salvar** (= cadastrar/rotacionar).
   - Botão **Remover** (com confirmação).
   - Seletor "**Provider padrão da organização**" → `PUT /ai/preference`.
   - **Gate:** a seção inteira só aparece/é editável se `orgRole` for ADMIN/OWNER. Se um membro comum chegar lá, esconder (e o backend reforça com 403 de qualquer forma).
4. **Segurança de UI:** nunca exibir/guardar a chave crua após o submit; o backend já devolve mascarada. Limpar o input após salvar.

---

## 5. REGRAS DE OURO PARA O FRONTEND (não-negociáveis)

1. **Design INTOCÁVEL + fase a fase.** O CEO foi explícito em sessões anteriores: NÃO redesenhe nada por conta própria. Implemente **uma fase por vez**, peça review (gate ≥8) e **aguarde o aval visual do CEO** antes da próxima. (Ver memória `feedback-frontend-design-intocavel`.)
2. **Nunca exponha a chave crua.** Backend só devolve mascarada — mantenha assim na UI.
3. **`orgId` jamais no body.** Sempre derivado do JWT pelo backend.
4. **Respeite o gate ADMIN.** UI de chave/preferência só para ADMIN. Membro comum: só seletor de provider no chat.
5. **Não construa UI de chave por usuário** (nível user está desligado).
6. **Modelo específico fica para depois.** Foque em provider; deixe o `model` como hook opcional (não invente seletor de modelo agora).
7. **BigInts vêm como string** (ADR-V2-025) — já é o padrão dos tipos.

---

## 6. SEQUÊNCIA SUGERIDA (fases para o CEO aprovar uma a uma)

| Fase | Entrega | Gate |
|------|---------|------|
| **F1** | Tipos + service wrappers + hook `use-ai-providers` (sem UI) | build/lint verde |
| **F2** | Reescrita do `model-dropdown` ligado a `GET /ai/providers` + default por `GET /ai/preference` | aval visual CEO |
| **F3** | `sendMessage` passando `provider` → mensagem realmente roteada | smoke: trocar provider muda resposta |
| **F4** | Seção de gestão de chaves (admin): listar + cadastrar + rotacionar | aval visual CEO |
| **F5** | Remover chave + definir preferência default da org (`PUT /ai/preference`) | aval visual CEO |
| **F6** | Polimento de erros/empty-states (provider não configurado, 403, etc.) | aval visual CEO |

> Cada fase: Implementer → Reviewer (gate ≥8) → **aval do CEO** antes da próxima. Nunca encadear automaticamente.

---

## 7. SMOKE TEST FINAL (definição de "100% funcional para o usuário")

Quando tudo estiver pronto, o usuário deve conseguir:
1. Abrir a aba Nexus e ver o seletor com os providers **reais**, com os não-configurados sinalizados.
2. Escolher Gemini e conversar normalmente (funciona out-of-the-box, há fallback global).
3. **Como admin:** ir em Configurações → IA, colar a chave Claude, salvar, ver `sk-ant-…xxxx` mascarada.
4. Voltar ao chat, escolher Claude, e a resposta vir do Claude.
5. **Como membro comum:** ver o seletor (sem o painel de chaves), e só conseguir usar os providers que o admin configurou.
6. Definir Claude como default da org → novos chats já abrem em Claude.

---

## 8. REFERÊNCIAS RÁPIDAS DE ARQUIVOS

**Backend (já em produção — leitura para conferir contrato):**
- `src/ai/ai-keys.controller.ts` — todas as rotas de keys/providers/preference
- `src/ai/dto/upsert-ai-key.dto.ts`, `ai-key-response.dto.ts`, `set-provider-pref.dto.ts`, `ai-provider-availability.dto.ts`, `send-message.dto.ts`
- `src/ai/README.md` — visão geral do módulo
- Swagger em `/api` (produção) — todos os contratos navegáveis

**Frontend (a tocar):**
- `src/lib/types/nexus.ts` — adicionar tipos
- `src/lib/services/nexus.service.ts` — adicionar wrappers
- `src/hooks/use-nexus-chat.ts` — repassar provider
- `src/app/(app)/ia/_components/model-dropdown.tsx` — reescrever (hoje é fake)
- `src/app/(app)/ia/page.tsx` — página do chat
- `src/hooks/use-auth.ts` — fonte do `orgRole` (gate admin)
- Padrão de gate admin: `src/components/shell/invite-dialog.tsx`, `src/app/(app)/teams/_components/teams-list.tsx`
```
