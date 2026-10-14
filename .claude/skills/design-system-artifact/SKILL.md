---
name: design-system-artifact
description: |
  Criar ou atualizar o design system do Doresh como Artifact (tipo "Design System"), para que
  todos os canvases de protótipo usem exatamente as mesmas cores (claro e escuro), tipografia
  (Inter, Crimson Text, hebraico RTL), raios, ícones e componentes base: tokens a partir de
  project/design/design_context.md e frontend/src/index.css, ativos de marca, componentes do app
  (botões, inputs, cartão de estudo, badge de IA, versículo com destaque, bolha do Ruach,
  navegação) e README de uso. Usar uma vez antes dos primeiros protótipos e sempre que a marca ou
  os tokens mudarem.
---

# Design system do Doresh como Artifact

Fonte de verdade: `project/design/design_context.md` e `frontend/src/index.css` (valores reais) +
`.claude/skills/frontend-design-tokens/SKILL.md`. O Artifact **espelha** essas fontes; nunca as
contradiz. Algo novo (ex.: paleta de destaques DS5, correções de contraste DS1) entra marcado 🧪 e
com proposta de atualização de `design_context.md`.

## 1. Já existe?

- `docs/design/prototipos.md` tem o link "Design system"? → **atualizar** esse (§4)
- Senão: `Artifact` `action: "list"`, `type: "Design System"` → há um do Doresh? usar esse
- Não há → `Artifact` `action: "quickstart"`, `intent: "other"` → escolher o tipo **Design System**
  → publicar com o `type_url`, `title: "Doresh — Design System"`; seguir as instruções do tipo

## 2. Conteúdo

**Tokens** (formato que o tipo pedir), com os nomes semânticos do frontend:

| Grupo | Tokens |
|---|---|
| Interface (claro + escuro) | `background` `foreground` `card` `primary` `primary-foreground` `secondary` `muted` `muted-foreground` `accent` `accent-foreground` `destructive` `border` `input` `ring` |
| Propostas 🧪 | `primary` 39 85% 30%, `muted-foreground` 25 5% 40%, `destructive` 0 72% 45%, `accent-text` (escuro) 213 85% 65% |
| Destaques 🧪 | `hl-yellow` `hl-green` `hl-blue` `hl-pink` (claro + escuro, texto ≥ 4,5:1) |
| Tipo | `font-ui` Inter · `font-scripture` Crimson Text · `font-hebrew` (RTL) · escala: corpo 14–16, leitura 16–18 / 1,65, títulos 24–32 |
| Forma | `radius` 16 px (cartões), 12/8 px (controles) · sombras suaves |

**Ativos:** `frontend/public/logo.svg`, `frontend/public/torah.png` (ler cada arquivo antes de publicar).

**Componentes base** (com hover/foco/desativado, claro e escuro): Button (primary dourado, outline,
ghost, destructive), Input/Textarea com label e erro, Card de estudo (título, referências, data,
badge "Gerado com IA"), Badge, Versículo (número, texto Crimson, estados de destaque, ícone de
comentário), Bolha de chat do Ruach (usuário / Ruach / carregando / erro), Navegação (desktop e
inferior mobile), EmptyState, Toast, Skeleton.

**README** (pt-BR, curto): essência (§1), regras de cor e contraste (§3), uma ação dourada por tela,
tipografia de leitura, tom de voz (§6), IA sempre identificada, dados fictícios, e as questões DS1–DS5.

## 3. Contraste

Antes de publicar, confirmar que cada par texto/fundo dos componentes passa AA nos dois temas (use
o script de `frontend-design-tokens`). Pares novos: registrar a razão no README.

## 4. Atualizar

Quando `design_context.md`, `index.css` ou `frontend-design-tokens` mudarem: ler o Artifact, alterar
só o afetado, republicar no mesmo `url`, e avisar que canvases existentes mantêm a versão instalada
até serem revisados (listar os de `docs/design/prototipos.md`).

## 5. Fechamento

- Registrar o link em `docs/design/prototipos.md` ("Design system: <link>")
- Resposta: link, conteúdo, decisões 🧪 e o que precisa da aprovação do fundador
