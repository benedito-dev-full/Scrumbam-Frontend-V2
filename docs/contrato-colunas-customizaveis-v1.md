# Contrato de Dados — Colunas Customizáveis v1 (8 tipos essenciais)

**Data:** 2026-05-29
**Status:** DRAFT — contrato para prototipação do frontend (evitar retrabalho)
**Escopo:** Backend Scrumban-Backend-V2 + Frontend Scrumbam-Frontend-V2
**Origem:** Meta P0 do benchmark Monday (`docs/monday-references/benchmark-monday-vs-scrumban.md` l.286)

---

## 0. Para que serve este documento

O frontend vai **prototipar** as colunas customizáveis. Para não refazer
depois, ele precisa saber **agora**:

1. **Quais são os 8 tipos** de coluna da v1.
2. **Como o backend ENVIA o schema** das colunas (a definição: que colunas a List tem).
3. **Como o backend ENVIA/RECEBE os valores** de cada coluna em cada task.

Este documento é o contrato. **Não é** plano de implementação backend — é o
acordo de formato de dados entre os dois repos.

> **Premissa arquitetural (já existe, não inventar):**
> - A **definição** das colunas mora em `DClasse.tableFields` (campo `Json?`) — confirmado em `prisma/schema.prisma:50`.
> - Os **valores** moram em `DTask.dados` (campo `Json`) — confirmado em `src/tasks/schemas/task-dados.schema.ts`.
> - Zero tabela nova, zero migration (ADR-V2-001).

---

## 1. Os 8 tipos de coluna (v1)

Decididos no benchmark (`diagrama-benchmark.md` l.38). NÃO são os 40+ do Monday.

| # | `type` (string) | Rótulo PT-BR | Tipo do valor (JSON) | Exemplo de valor |
|---|-----------------|--------------|----------------------|------------------|
| 1 | `text`     | Texto             | `string`                    | `"Aprovar com cliente"` |
| 2 | `number`   | Número            | `number`                    | `1500.5` |
| 3 | `date`     | Data              | `string` (ISO 8601 `YYYY-MM-DD`) | `"2026-06-10"` |
| 4 | `person`   | Pessoa            | `string` (chave DEntidade, BigInt-as-string) | `"123"` |
| 5 | `status`   | Status (custom)   | `string` (id da opção)      | `"opt_em_revisao"` |
| 6 | `checkbox` | Checkbox          | `boolean`                   | `true` |
| 7 | `dropdown` | Lista suspensa    | `string` (id da opção)      | `"opt_alta"` |
| 8 | `link`     | Link / URL        | `string` (URL)              | `"https://..."` |

**Notas importantes para o frontend:**
- **`status` custom ≠ status V3 da task.** A coluna `status` aqui é um campo
  livre que o usuário cria (ex: "Em revisão", "Aguardando cliente"). O **estado
  canônico da task** (INBOX→READY→...→VALIDATED) continua governado pela State
  Machine V3 e **não** é uma coluna customizável — não mexer nele por aqui.
- `person` guarda a **chave da DEntidade** como string (IDs são `BigInt` no
  backend; sempre trafegam como string no JSON para não perder precisão).
- `status` e `dropdown` são estruturalmente iguais (valor = id de uma opção). A
  diferença é só visual: `status` renderiza como pill colorida, `dropdown` como
  select simples.

---

## 2. Schema das colunas — como o backend ENVIA a definição

A List (DProject `idClasse=-352`) — ou a DClasse correspondente — carrega em
`tableFields` o array de colunas que aquela lista tem. O frontend lê isso para
saber **quais colunas renderizar e como**.

### 2.1 Endpoint

Já existe rota genérica para ler os campos de uma classe:

```
GET /classes/:id/fields        →  retorna tableFields (Json) ou null
```
(confirmado em `src/classes/classes.controller.ts:126` e `classes.service.ts:240`)

> ⚠️ A coluna `tableFields` existe no schema, mas **a forma do conteúdo abaixo é
> a proposta deste contrato** — hoje ela vem `null` no seed. O frontend deve
> programar contra **este formato**; o backend vai populá-lo na implementação.

### 2.2 Formato do `tableFields`

```jsonc
{
  "columns": [
    {
      "key": "orcamento",          // identificador estável (slug) — chave no dados.fields da task
      "type": "number",            // um dos 8 tipos da seção 1
      "label": "Orçamento",        // rótulo exibido no header da coluna
      "order": 1,                  // ordem de exibição (asc)
      "required": false,           // se obrigatório ao criar/editar
      "config": {                  // específico por tipo (ver seção 2.3); pode ser omitido
        "currency": "BRL"
      }
    },
    {
      "key": "prioridade_interna",
      "type": "dropdown",
      "label": "Prioridade interna",
      "order": 2,
      "required": false,
      "config": {
        "options": [
          { "id": "opt_alta",  "label": "Alta",  "color": "#ef4444" },
          { "id": "opt_media", "label": "Média", "color": "#f59e0b" },
          { "id": "opt_baixa", "label": "Baixa", "color": "#10b981" }
        ]
      }
    },
    {
      "key": "responsavel_extra",
      "type": "person",
      "label": "Responsável adicional",
      "order": 3,
      "required": false
    }
  ]
}
```

### 2.3 `config` por tipo

| `type` | `config` esperado | Observação |
|--------|-------------------|------------|
| `text`     | `{ "maxLength"?: number }` | opcional |
| `number`   | `{ "currency"?: "BRL"\|"USD", "decimals"?: number }` | se `currency` setado, renderizar como moeda |
| `date`     | `—` | sem config |
| `person`   | `—` | opções vêm dos membros do projeto (não embutidas) |
| `status`   | `{ "options": [{id,label,color}] }` | **options obrigatório** |
| `checkbox` | `—` | sem config |
| `dropdown` | `{ "options": [{id,label,color?}] }` | **options obrigatório** |
| `link`     | `—` | validar URL no front |

---

## 3. Valores das colunas — como trafegam na task

Os valores preenchidos pelo usuário moram em **`DTask.dados.fields`** — um
objeto chaveado por `column.key`.

### 3.1 GET /tasks/:id (resposta — recorte relevante)

```jsonc
{
  "chave": "789",
  "nome": "Aprovar layout do banner",
  "idProject": "352001",
  "idClasse": "-154",
  "dados": {
    "identifier": "DEV-12",
    "v3": { "state": "READY" },        // ← estado canônico V3 (NÃO é coluna custom)
    "fields": {                         // ← AQUI moram os valores das colunas custom
      "orcamento": 1500.5,
      "prioridade_interna": "opt_alta",
      "responsavel_extra": "123"
    }
  }
}
```

> O `dados` já é retornado pelo `/tasks` hoje (ver `task-response.dto.ts`). A
> chave **`fields`** é a adição deste contrato — um sub-objeto novo dentro de
> `dados`, sem mexer em `identifier`/`v3`/`telemetry`/`taskType` que já existem.

### 3.2 POST /tasks e PUT /tasks/:id (request — recorte relevante)

O frontend envia os valores customizados sob `dados.fields`. Mesma forma na
criação e na edição:

```jsonc
// PUT /tasks/789
{
  "dados": {
    "fields": {
      "orcamento": 2000,
      "prioridade_interna": "opt_media",
      "responsavel_extra": null          // null = limpar o valor
    }
  }
}
```

**Regras de merge (proposta a confirmar na implementação):**
- O backend faz **merge raso** em `dados.fields` (chaves enviadas sobrescrevem;
  chaves omitidas permanecem). Para **limpar** um campo, enviar `null`
  explicitamente.
- Campos não declarados no `tableFields` da lista são **ignorados/rejeitados**
  (a definir: silencioso vs 400). Recomendação: **400** para pegar bug de front cedo.

### 3.3 Tabela de serialização por tipo (o que o front manda/recebe)

| `type` | Envia/recebe | Vazio/limpo |
|--------|--------------|-------------|
| `text`     | `string` | `null` |
| `number`   | `number` (JSON number, não string) | `null` |
| `date`     | `string` `"YYYY-MM-DD"` | `null` |
| `person`   | `string` (chave DEntidade) | `null` |
| `status`   | `string` (`option.id`) | `null` |
| `checkbox` | `boolean` | `false` ou `null` |
| `dropdown` | `string` (`option.id`) | `null` |
| `link`     | `string` (URL) | `null` |

---

## 4. Checklist de prototipação para o frontend

Programar o protótipo contra **estas garantias**, que o backend vai honrar:

- [ ] Existem exatamente **8 tipos** (`text, number, date, person, status, checkbox, dropdown, link`).
- [ ] A **definição** das colunas chega via `tableFields` (array `columns` com `key/type/label/order/required/config`).
- [ ] Os **valores** ficam em `dados.fields`, chaveados por `column.key`.
- [ ] IDs (`person`) são **string** (BigInt serializado).
- [ ] A coluna `status` custom **não é** o estado V3 da task — são coisas separadas.
- [ ] `status`/`dropdown` trazem `config.options[{id,label,color}]`; o valor salvo é o `option.id`.
- [ ] Para limpar um valor, manda-se `null`.

---

## 5. O que NÃO entra na v1 (parking lot)

Para o protótipo não tentar cobrir o que não vem agora:

- Formula columns (avaliador de expressões) — P2, fora da v1.
- Mirror / Connect Boards (relação entre listas) — não planejado.
- Colunas multi-valor (multi-select, tags array) — v2.
- Validação cruzada entre colunas — v2.
- Reordenação/drag das colunas pela UI persistida — pode prototipar visual, mas
  a persistência do `order` entra junto da implementação backend.

---

## 6. Pontos em aberto (precisam de decisão antes do código backend)

1. **Onde mora o `tableFields`** — no DClasse da LIST (compartilhado por todas
   as listas daquele tipo) ou por-lista (cada DProject LIST tem seu schema)?
   O benchmark fala em "por list/board"; o `tableFields` hoje é do DClasse.
   → Provável: schema por-lista guardado em `DProject.dados.tableFields` da
   própria List, deixando `DClasse.tableFields` como default herdável. **A confirmar.**
2. **Campo desconhecido no PUT** → ignorar silencioso ou retornar 400? (Recomendo 400.)
3. **Endpoint para editar o schema** das colunas (criar/remover coluna) — fora
   deste contrato de leitura; será definido no plano de implementação.

---

**Documentos relacionados:**
- `docs/monday-references/benchmark-monday-vs-scrumban.md` — meta P0 (l.286)
- `docs/monday-references/diagrama-benchmark.md` — os 8 tipos (l.38)
- `src/tasks/schemas/task-dados.schema.ts` — schema do `dados` da task
- `prisma/schema.prisma:50` — campo `tableFields` no DClasse
