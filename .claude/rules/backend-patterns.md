# Padroes Backend Node/TypeScript

**Aplicavel a:** Todo codigo TypeScript em `src/` de projetos backend Node.

Este skill e injetado em Strategist, Implementer e Reviewer. Contem os padroes **universais** — padroes especificos de framework (NestJS, Prisma) estao em `nestjs-prisma-patterns.md` (opcional).

---

## 1. TYPE SAFETY

### Strict mode, zero `any` injustificado

```typescript
// ERRADO
function handle(data: any) { ... }

// CORRETO — se voce nao sabe o tipo, use unknown + type guard
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // agora typescript sabe que data tem id
  }
}
```

### Tipos explicitos em funcoes publicas

```typescript
// ERRADO — return type inferido pode mudar acidentalmente
export async function getUser(id: string) { ... }

// CORRETO
export async function getUser(id: string): Promise<User | null> { ... }
```

### Validacao em runtime (boundaries)

Zod, class-validator ou similar. Valide TODO input que vem de fora (HTTP, fila, arquivo):

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(18),
});

type CreateUser = z.infer<typeof CreateUserSchema>;

function createUser(input: unknown): User {
  const data = CreateUserSchema.parse(input);  // lanca se invalido
  // data e type-safe aqui
}
```

---

## 2. IDs E NUMEROS GRANDES

### BigInt quando necessario

Se o banco usa `BIGINT` / `BIGSERIAL`: use `bigint` no TS.

```typescript
// ERRADO (perde precisao acima de 2^53-1)
const id = parseInt(req.params.id);
const id = Number(req.params.id);

// CORRETO
const id = BigInt(req.params.id);

// Ou, se IDs sao strings/UUIDs:
const id: string = req.params.id;
```

### Serializacao JSON de BigInt

`JSON.stringify` nao suporta bigint por padrao. Solucoes:
```typescript
// Opcao 1: converter para string antes
{ id: user.id.toString() }

// Opcao 2: polyfill global (uma vez no bootstrap)
(BigInt.prototype as any).toJSON = function () { return this.toString(); };
```

---

## 3. DATAS E TIMEZONE

### Centralizar logica de timezone

Nunca faca `new Date()` disperso no codigo se o projeto tem requisitos de timezone. Crie um `TimezoneService` / `DateUtils`:

```typescript
// ERRADO — depende do timezone do servidor
const start = new Date(dateStr);
start.setHours(0, 0, 0, 0);  // setHours usa timezone local!

// CORRETO — use date-fns-tz ou similar
import { zonedTimeToUtc } from 'date-fns-tz';

const start = zonedTimeToUtc(`${dateStr}T00:00:00`, 'America/Sao_Paulo');
```

### Filtros de periodo

Padronize (today, week, month, custom) em um utilitario, nao duplique em cada service.

---

## 4. QUERIES — ZERO N+1

### Loop com query = proibido

```typescript
// ERRADO — N+1 (1 query inicial + N queries no loop)
const users = await db.user.findMany();
for (const user of users) {
  user.posts = await db.post.findMany({ where: { userId: user.id } });
}
```

### Soluçcoes

**ORM com include/join (Prisma, TypeORM):**
```typescript
const users = await db.user.findMany({
  include: { posts: true }
});
```

**SQL raw com JOIN:**
```typescript
SELECT u.*, p.id as post_id, p.title
FROM users u LEFT JOIN posts p ON p.user_id = u.id
```

**Dataloader pattern (GraphQL, etc):**
```typescript
const loader = new DataLoader(ids => batchLoadPosts(ids));
```

### Como detectar N+1

- Ativar logging de queries (`DEBUG=prisma:query` ou equivalente)
- Contar queries por request: target 3-5, red flag >20

---

## 5. TRANSACTIONS

### Operacoes multi-tabela DEVEM ser atomicas

```typescript
// ERRADO — se segunda falha, banco fica inconsistente
const user = await db.user.create({ data });
await db.profile.create({ data: { userId: user.id } });  // se falha aqui, user orfao

// CORRETO — transaction
await db.$transaction(async (tx) => {
  const user = await tx.user.create({ data });
  await tx.profile.create({ data: { userId: user.id } });
});
```

### Quando usar transaction
- Criar entidade + registros filhos
- Operacoes financeiras (mov + saldo)
- Qualquer mudanca multi-tabela que precise rollback conjunto

---

## 6. VALORES MONETARIOS

### NUNCA use Float para dinheiro

```typescript
// ERRADO (JavaScript Float)
0.1 + 0.2 === 0.3  // false!

const price: number = 9.99;

// CORRETO — Decimal (Prisma, decimal.js)
import Decimal from 'decimal.js';
const price = new Decimal('9.99');
const total = price.times(3);  // 29.97 exato

// OU armazene em centavos (bigint)
const priceInCents: bigint = 999n;
```

---

## 7. ERROR HANDLING

### Exceptions especificas, nao strings genericas

```typescript
// ERRADO
if (!user) throw new Error('not found');

// CORRETO (NestJS)
if (!user) throw new NotFoundException(`User ${id} not found`);

// CORRETO (Express com framework de errors)
if (!user) throw new HttpError(404, `User ${id} not found`);
```

### Nao engolir erros

```typescript
// ERRADO — perde stacktrace, loga mal
try { ... } catch (e) { console.log(e); return null; }

// CORRETO — deixa propagar OU trate com contexto
try {
  await doWork();
} catch (e) {
  logger.error({ err: e, userId }, 'Failed to do work');
  throw e;  // re-throw ou transforme em erro de dominio
}
```

### Finally para cleanup
```typescript
const conn = await db.connect();
try {
  return await conn.query(...);
} finally {
  await conn.release();  // sempre executa
}
```

---

## 8. LOGGING

### Use logger estruturado, nunca console.log

```typescript
// ERRADO
console.log('processing user', userId);

// CORRETO — NestJS
this.logger.log(`Processing user ${userId}`);

// CORRETO — pino/winston
logger.info({ userId }, 'processing user');
```

### Niveis
- `error` — falhas que requerem atencao
- `warn` — situacoes atipicas
- `info` — eventos relevantes (requisicao, task concluida)
- `debug` — detalhes para troubleshooting

### NAO logar dados sensiveis
- Senhas (nem hasheadas)
- Tokens, API keys
- PII (CPF, email completo em casos sensiveis)
- Cartoes de credito

---

## 9. SEGURANCA BASICA

### SQL Injection
- SEMPRE use queries parametrizadas ou ORM
- NUNCA concatene input do usuario em SQL raw

```typescript
// ERRADO
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// CORRETO
db.query('SELECT * FROM users WHERE email = ?', [email]);
db.user.findFirst({ where: { email } });  // ORM
```

### Secrets
- NUNCA hardcoded no codigo
- Use `.env` + `process.env.VAR_NAME`
- `.env` no `.gitignore`

### Passwords
- SEMPRE hash com bcrypt/argon2 (nunca SHA/MD5)
- Cost factor >= 10

### Validacao de input
- Toda entrada publica validada (tamanho, tipo, range)
- Rate limiting em endpoints criticos (login, signup, reset)

---

## 10. ARQUITETURA

### Separation of Concerns

- **Controller/Route:** orquestra, nao implementa logica
- **Service:** logica de negocio
- **Repository/Model:** acesso a dados

```typescript
// ERRADO — controller fazendo query
app.get('/users/:id', async (req, res) => {
  const user = await db.user.findFirst({ where: { id: req.params.id } });
  if (!user) return res.status(404).send('not found');
  res.json({ ...user, fullName: `${user.first} ${user.last}` });
});

// CORRETO
app.get('/users/:id', async (req, res) => {
  const user = await userService.getById(req.params.id);  // delega
  res.json(user);  // service retornou DTO formatado
});
```

### DTOs / Response types
- Nunca retorne o objeto do banco direto (pode ter campos sensiveis)
- Use DTO de response com apenas o que o cliente precisa

---

## 11. TESTES

### Piramide
- **Unit:** logica isolada, mocks (rapido, maioria)
- **Integration:** com banco de verdade (ou containers), testa fluxos
- **E2E:** end-to-end (poucos, caros)

### Boa pratica
- Testes rodam em isolamento (cada teste limpa seu estado)
- Nomes descritivos (`should return 404 when user does not exist`)
- AAA (Arrange, Act, Assert)

---

## 12. PERFORMANCE

### Paginacao
Listas sem paginacao = bomba-relogio. Use cursor pagination para volumes grandes:

```typescript
// Cursor pagination (escalavel)
async list(cursor?: string, limit = 20) {
  return db.user.findMany({
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit,
    orderBy: { id: 'asc' },
  });
}
```

Offset pagination (`skip: 1000`) degrada em paginas altas. Use para UIs simples com < 100 paginas.

### Select apenas o necessario
```typescript
// ERRADO — retorna 30 colunas
db.user.findMany();

// CORRETO — so o que a view precisa
db.user.findMany({ select: { id: true, name: true, avatar: true } });
```

### Cache
- In-memory (Map) para dados quase-estaticos por processo
- Redis para cache distribuido
- Cache invalidation: melhor TTL curto que invalidacao manual errada

---

## 13. IMPORTS ORGANIZADOS

Ordem padrao:
1. Libs externas do Node (fs, path)
2. Libs externas instaladas (@nestjs, react)
3. Services/modulos internos (relativos)
4. DTOs/Types
5. Constants/enums

```typescript
// 1. Node
import { readFile } from 'fs/promises';

// 2. Externas
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

// 3. Internos
import { PrismaService } from '../prisma.service';
import { TimezoneService } from '../common/timezone.service';

// 4. DTOs/Types
import { CreateUserDto } from './dto/create-user.dto';

// 5. Constants
import { USER_ROLES } from '../common/constants';
```

---

## 14. CHECKLIST DE QUALIDADE

Antes de considerar codigo "pronto":

- [ ] Build passa
- [ ] TypeScript 0 errors
- [ ] Tests passam (novos + existentes)
- [ ] ESLint 0 errors
- [ ] Zero N+1 queries
- [ ] Zero `any` injustificado
- [ ] Zero `console.log`
- [ ] Validacao de input em boundaries
- [ ] Error handling apropriado
- [ ] Transactions em multi-tabela
- [ ] Logger em vez de console
- [ ] Imports organizados
- [ ] Secrets em env vars
- [ ] Nomes claros
- [ ] Funcoes pequenas (< 50 linhas)
