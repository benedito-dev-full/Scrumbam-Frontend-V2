# Contrato Front ↔ Back — Execução de Tasks via Agente VPS

**Status:** Definido e confirmado — mai/2026  
**Backend:** Scrumban-Backend-V2 (padrão Devari-Core, 17 tabelas canônicas)  
**Autor:** Benedito + Claude

---

## 1. Premissa central

Toda automação de task no Scrumban roda na **VPS via assinatura Claude Max**.

- Nunca chamada avulsa à API Claude (custo por token inviável em escala)
- A VPS executa **Claude Code** com a assinatura Max
- Claude Code faz tudo: pesquisa web, cria/edita arquivos, roda comandos, cria branches, abre PRs
- O **executor é sempre o mesmo** (VPS + Claude Code). O que muda é o **prompt** enviado

---

## 2. Onde vive a Execution no banco — `DPedido`

Não existe tabela nova. O padrão Devari-Core já prevê execuções Claude Code como `DPedido` — confirmado no comentário do próprio schema:

```
// Json polimórfico — command, stdout, exitCode, riskLevel, prUrl, etc.
// Compras, vendas, PIX, execuções Claude Code (idClasse -300..-303).
dados Json?
```

Cada execução de task = um registro em `DPedido` com `idClasse` específico.

### DClasses para execuções (seeds a criar no backend)

```
idClasse = -300  →  "Execução Dev"       (task de desenvolvimento)
idClasse = -301  →  "Execução Pesquisa"  (task de pesquisa/web)
idClasse = -302  →  "Execução Doc"       (task de documentação)
idClasse = -303  →  "Execução Ops"       (task de operações/terminal)
idClasse = -304  →  "Execução Genérica"  (prompt livre)
```

### Campos usados em DPedido para execução

```typescript
DPedido {
  chave:        BigInt        // ID da execução
  idClasse:     BigInt        // -300 a -304 (tipo de execução)
  idPessoa:     BigInt        // ID do usuário que executou (DEntidade)
  idLocEscritu: BigInt        // ID do projeto/espaço (DProject)
  aprovado:     Boolean       // false = pending/running, true = concluída
  baixado:      Boolean       // false = em aberto, true = finalizada (sucesso ou falha)
  dados: {
    taskId:     string        // ID da DTask que originou a execução
    agentId:    string        // ID do agente VPS (DEntidade idClasse=-200)
    prompt:     string        // instrução enviada ao Claude Code
    status:     'pending' | 'running' | 'success' | 'failed'
    output:     string | null // resposta em texto do Claude Code
    outputUrl:  string | null // link de PR, doc, commit, etc.
    startedAt:  string        // ISO timestamp
    finishedAt: string | null // ISO timestamp
  }
}
```

---

## 3. Agente VPS no banco — `DEntidade`

O agente VPS também não precisa de tabela nova — é uma `DEntidade` com `idClasse` específico:

```
idClasse = -200  →  "Agente VPS"
```

```typescript
DEntidade {
  chave:    BigInt   // ID do agente
  idClasse: -200     // tipo "Agente VPS"
  nome:     string   // nome amigável ("Meu VPS Hetzner")
  dados: {
    hostname:      string  // ex: "api.meusite.com"
    sshHost:       string  // host para conexão SSH
    status:        'pending_install' | 'never_connected' | 'online' | 'offline'
    lastHeartbeat: string | null  // ISO timestamp
    installToken:  string | null  // token temporário de instalação
    autonomyLevel: 'conservative' | 'balanced' | 'autonomous'
  }
}
```

### Vínculo Espaço ↔ Agente — `DVincula`

O link entre espaço (DProject) e agente (DEntidade) usa `DVincula`:

```typescript
DVincula {
  idClasse:    -250           // "Vínculo Projeto-Agente"
  idLocEscritu: projectId     // ID do DProject (espaço)
  idEntidade:   agentId       // ID da DEntidade (agente VPS)
  referencia:   string        // URL do repositório remoto
  nome:         string        // branch padrão (ex: "main")
  descricao:    string        // caminho na VPS (ex: "/home/scrumban/projeto")
}
```

---

## 4. Tipos de task — só categorização visual

O tipo de task é um campo `idTaskType` → `DTabela` (lookup). Não muda o executor. Muda o template de prompt sugerido na UI.

```
idClasse DTabela = -430  →  "Tipo de Task"
  └─ id = -431  →  "Dev"       ícone Code2, cor azul
  └─ id = -432  →  "Pesquisa"  ícone Search, cor âmbar
  └─ id = -433  →  "Doc"       ícone FileText, cor verde
  └─ id = -434  →  "Ops"       ícone Terminal, cor roxo
  └─ id = -435  →  "Genérica"  ícone Sparkles, cor cinza
```

Campo `agentPrompt` (instrução para o agente) vai em `DTask.dados`:

```typescript
DTask.dados = {
  agentPrompt:   string | null  // prompt para o agente
  executionType: string | null  // 'dev'|'research'|'doc'|'ops'|'generic'
  lastPedidoId:  string | null  // ID do último DPedido de execução
  // ... outros campos V3 já existentes
}
```

---

## 5. Endpoints necessários no backend

### 5.1 Executar task com agente

```
POST /tasks/:taskId/execute
```

**Body:**
```typescript
{
  agentId?: string   // opcional — se omitido, herda do vínculo do DProject
  prompt?:  string   // opcional — se omitido, usa DTask.dados.agentPrompt
}
```

**O que o backend faz:**
1. Lê a DTask, resolve o agente (direto ou via DVincula do DProject)
2. Cria DPedido via Engine (idClasse -300 a -304, status pending)
3. Envia job para a VPS com `{ pedidoId, prompt, repoUrl, branch, path }`
4. Retorna `{ pedidoId }`

**Response:**
```typescript
{ pedidoId: string }
```

---

### 5.2 Consultar status da execução (polling)

```
GET /tasks/:taskId/execution/:pedidoId
```

**Response:**
```typescript
{
  pedidoId:   string
  status:     'pending' | 'running' | 'success' | 'failed'
  output:     string | null
  outputUrl:  string | null
  startedAt:  string
  finishedAt: string | null
}
```

O backend lê `DPedido.dados` e devolve o shape limpo para o frontend.

---

### 5.3 VPS → Backend (callback interno)

A VPS chama o backend quando a execução conclui:

```
POST /internal/agent-callback   (autenticado por token de agente)
```

**Body:**
```typescript
{
  pedidoId:  string
  agentId:   string
  status:    'success' | 'failed'
  output:    string
  outputUrl: string | null
}
```

O backend atualiza `DPedido.dados` e emite evento `order.completed` ou `order.cancelled` para o EventRouter.

---

### 5.4 Vincular agente ao Espaço

```
PATCH /projects/:projectId/agent-link
```

**Body:**
```typescript
{
  idAgent:      string
  remoteRepoUrl: string
  remoteBranch:  string
  remotePath:    string
}
```

O backend cria/atualiza DVincula com idClasse=-250.

---

### 5.5 Agentes (já existe, confirmar shape)

```
POST   /agents              // cria DEntidade idClasse=-200
GET    /agents              // lista DEntidade onde idClasse=-200
GET    /agents/:id/install-token  // gera token temporário em DEntidade.dados
DELETE /agents/:id          // soft delete
```

---

## 6. Fluxo completo — cada tipo de task

### Task Dev

```
Usuário clica [▶ Executar]
  → POST /tasks/:id/execute
  → Backend: cria DPedido idClasse=-300, dados.status='pending'
  → Backend: envia para VPS: { prompt: "Cria branch feat/x, implementa, abre PR" }
  → VPS: git checkout -b feat/x → implementa → git push → abre PR
  → VPS: callback { status:'success', output:'PR aberto', outputUrl:'github.com/.../42' }
  → Backend: DPedido.dados.status='success', baixado=true
  → Frontend polling: mostra ✅ "PR aberto" + [🔗 Ver PR #42]
```

### Task Pesquisa

```
  → POST /tasks/:id/execute
  → Backend: cria DPedido idClasse=-301
  → VPS: Claude Code acessa UOL, resume as 5 notícias
  → VPS: callback { status:'success', output:'1. Título...\n2. ...', outputUrl:null }
  → Frontend: mostra output expansível com o resumo
```

### Task Doc

```
  → POST /tasks/:id/execute
  → Backend: cria DPedido idClasse=-302
  → VPS: Claude Code escreve o documento, commita no repositório
  → VPS: callback { status:'success', output:'README criado', outputUrl:'github.com/.../README.md' }
  → Frontend: mostra ✅ + [🔗 Ver arquivo]
```

### Task Ops

```
  → POST /tasks/:id/execute
  → Backend: cria DPedido idClasse=-303
  → VPS: Claude Code executa o comando, captura output
  → VPS: callback { status:'success', output:'nginx restarted. Status: active' }
  → Frontend: mostra output como terminal (monospace)
```

---

## 7. Herança de agente

```
Task.dados.agentId !== null  → usa agente específico da task
Task.dados.agentId === null  → busca DVincula do DProject (espaço)
DVincula não existe          → erro: "Nenhum agente vinculado a este espaço"
```

Futura Opção C: herança via Lista (DVincula com idLocEscritu = DProject da lista) antes de subir para o Espaço.

---

## 8. O que o frontend precisa implementar (sem backend)

| Item | Depende de backend? |
|------|---------------------|
| Campo `executionType` na criação de task | Não (mock) |
| Campo `agentPrompt` na task | Não (mock) |
| Botão "Executar com agente" na task | Não (mock) |
| Caixa de output expansível na task | Não (mock) |
| Templates de prompt por tipo | Não (mock) |
| Polling de status | Sim |
| Callback da VPS | Sim (backend) |

---

## 9. O que o backend precisa na refatoração

1. **Seeds de DClasse** para tipos de execução (-300 a -304) e tipo de agente (-200)
2. **Seed de DVincula class** para vínculo projeto-agente (-250)
3. **Seed de DTabela classes** para tipos de task (-430 a -435)
4. **Campo `dados.agentPrompt`** e **`dados.executionType`** na DTask (JSON, sem migration)
5. **Endpoint `POST /tasks/:id/execute`** — cria DPedido via Engine, dispara VPS
6. **Endpoint `GET /tasks/:id/execution/:pedidoId`** — polling de status
7. **Endpoint `POST /internal/agent-callback`** — VPS notifica resultado
8. **Integração VPS ↔ Claude Code** — daemon na VPS que recebe jobs e executa

---

## 10. Restrições confirmadas

- ❌ Nenhuma tabela nova — tudo usa as 17 tabelas canônicas Devari-Core
- ❌ Nunca chamada direta à API Claude por token
- ❌ Execução automática ao mudar status (usuário decide explicitamente)
- ✅ Execução = DPedido (idClasse -300 a -304), resultado em dados JSON
- ✅ Agente VPS = DEntidade (idClasse -200)
- ✅ Vínculo Espaço↔Agente = DVincula (idClasse -250)
- ✅ Tipo de task = DTabela lookup (-431 a -435), só visual
- ✅ Executor sempre é VPS + Claude Code com assinatura Max
- ✅ Resultado aparece dentro da task, nunca redireciona para outra tela
