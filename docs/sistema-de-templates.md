# Sistema de Templates — Scrumban

> **Status:** conceito alinhado em reunião (2026-05-29) com stakeholder (Stick Road) e banco.
> Este documento registra a base do diferencial de produto "Templates" pra ser
> consolidado junto aos demais pontos da reunião.

---

## 1. Conceito central

Em ferramentas como **Monday** e **ClickUp**, "template" significa apenas uma
**estrutura vazia** — um esqueleto de workspace com páginas/views/colunas que o
usuário ainda precisa preencher tarefa por tarefa.

No **Scrumban**, o diferencial é:

> **Um template é um Espaço que já nasce cheio de tasks (testes/perguntas) prontas dentro.**

É trabalho operacional comprovado embutido — não um canvas em branco. A palavra
"template" é usada apenas pra **diferenciar** de um espaço vazio.

---

## 2. O insight — o "protocolo"

Dentro de um mesmo **tipo de trabalho**, o processo se repete em torno de **95%**,
mesmo quando os clientes/nichos são completamente diferentes.

**Exemplo real (experiência de um diretor de marketing):**
Um "evento presencial" para uma empresa de TI e um "evento presencial" para uma
marca do segmento feminino são clientes opostos — mas o **protocolo de execução é
praticamente o mesmo**. Das ~300 tasks que um evento presencial exige (copy,
landing page, campanha, criativos, copywriting, etc.), cerca de **290 se repetem
sempre**. Só ~10 mudam para encaixar no cliente específico.

Por isso o nome **"protocolo"**: é um roteiro de execução comprovado, que se
repete por **tipo de trabalho**, não por cliente.

---

## 3. O que é template (e o que NÃO é)

- **Template = um Espaço pré-preenchido.** Não cria um andar novo na árvore.
- A hierarquia do produto **continua a mesma**:

```
Workspace → Espaço → Pasta → Lista → Tasks
```

- Depois de criado, um template é um **Espaço normal** como qualquer outro.

> ⚠️ **Importante:** "template" e "categoria" **NÃO são níveis da hierarquia**.

---

## 4. Categoria — apenas no modal de criação

- **Categoria não é nível da hierarquia.** É só um **filtro/agrupador dentro do
  modal de criação**.
- Existe exclusivamente para organizar os modelos (estimativa do stakeholder:
  **~67 modelos** no total) e não jogar todos numa tela só, forçando o usuário a
  scrollar sem fim.
- **Não aparece na sidebar**, não é andar da árvore — vive só no momento da criação.

```
┌─ Modal: Criar novo espaço ──────────────────────┐
│  ○ Espaço vazio                                  │
│  ● Espaço com tasks prontas                      │
│                                                  │
│   [Marketing] [Social Media] [Dev] [Turismo]     │ ← categorias = filtros
│   ──────────                                     │
│   • Evento presencial                            │
│   • Lançamento clássico        ← modelos da      │
│   • Lançamento gratuito          categoria ativa │
│   • ...                                          │
└──────────────────────────────────────────────────┘
```

---

## 5. Fluxo de criação

Ao **criar um novo Espaço**, o usuário escolhe:

1. **Espaço vazio** (começar do zero), ou
2. **Espaço com tasks prontas** → abre a galeria de modelos, **agrupada por
   categoria** → escolhe o modelo → as tasks são **clonadas** para o novo espaço.

---

## 6. Decisões fechadas

| Tema | Decisão |
|------|---------|
| **Quem cria os modelos** | Apenas o **Scrumban** (curadoria de especialistas). O cliente **consome**, não cria. |
| **Origem das tasks** | Curadoria de especialista — protocolos montados uma vez por quem tem a visão prática (ex: diretor de marketing) e disponibilizados como biblioteca oficial. |
| **Aplicar template** | **Cópia independente** — tasks clonadas para o espaço do cliente. Editar / remover / adicionar / concluir **não afeta** o modelo original. |

---

## 7. Parking lot (apresentar aos stakeholders depois)

1. **Protocolo vinculado** — em vez de cópia 100% independente, manter o espaço
   **ligado ao modelo mestre**, permitindo *propor atualizações* aos projetos que
   nasceram dele quando o protocolo evoluir. Diferencial forte de produto; não
   entra no MVP.
2. **Clientes criarem modelos próprios** — hoje a criação é exclusiva da curadoria
   Scrumban; pode ser aberto a clientes avançados no futuro.

---

## 8. Resumo do modelo mental

| Interpretação errada (descartada) | Modelo correto |
|---|---|
| Categoria = nível da árvore | Categoria = **filtro dentro do modal de criação** |
| Template = nível da árvore | Template = **um Espaço pré-preenchido** (palavra só pra diferenciar) |
| Hierarquia: Workspace → Espaço → Categoria → Template | Hierarquia: **Workspace → Espaço → Pasta → Lista** (sem mudança) |
