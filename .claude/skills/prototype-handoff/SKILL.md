---
name: prototype-handoff
description: |
  Passar um protótipo aprovado do canvas de design para a construção no Doresh: inventário de
  telas e estados com o link de cada prancheta, mapeamento para componentes shadcn/ui e padrões
  do app, tokens usados (claro e escuro), textos pt-BR, comportamento mobile, componentes ou
  tokens novos a criar, e diferenças face à spec. Atualiza docs/product/features/<slug>/spec.md
  (seção Design) e docs/design/prototipos.md, e prepara a mensagem para o product-owner e o
  dev-frontend-react. Usar quando o usuário aprova um protótipo ("aprovado", "pode construir").
---

# Passagem do protótipo para construção

O canvas mostra; a passagem **diz**. O `dev-frontend-react` não deve adivinhar espaçamentos,
textos, estados ou que componente usar.

## 1. Confirmar

- Aprovação explícita (do fundador) para **esta** versão do canvas
- Comentários em aberto (`ArtifactComments`): resolvidos ou passados a "questões em aberto"
- Ler o canvas (`Artifact` `read`) e a `spec.md`, se houver

## 2. Seção "Design" na spec

Em `docs/product/features/<slug>/spec.md` (sem spec → criar `design.md` na mesma pasta e sugerir `feature-spec`):

```markdown
## Design

> Canvas: <link> · **Aprovado em:** AAAA-MM-DD por <quem> · Design system: <link / tokens de design_context.md>

### Telas e estados
| Tela | Rota | Pranchetas (desktop / mobile / escuro) | Estados desenhados |
|---|---|---|---|
| Biblioteca | /estudos | "Biblioteca — com dados" / "— mobile" / "— escuro" | dados, carregando, vazio, vazio-filtro, erro |

### Componentes
| Elemento no protótipo | Implementação |
|---|---|
| Cartão de estudo | `Card` + `Badge` tone `ai` quando `ai_generated` |
| Texto bíblico | `font-crimson`, 16–18 px, máx. 70ch |

### Novo a criar
- Tokens: <nenhum | lista com contraste nos dois temas> → `frontend-design-tokens`
- Variantes `cva`: <...>
- Componentes compartilhados: <...>

### Mobile
<o que muda a 360–390 px>

### Tema escuro
<o que muda; tokens específicos>

### Textos
<todos os textos visíveis ainda não listados nos estados da spec, copiados literalmente>

### Diferenças face à spec
<o que o protótipo mudou; a spec é atualizada, nunca duas versões>

### Questões em aberto
```

Regras: textos copiados **literalmente**; nenhum hex em "Componentes" (só tokens/variantes).

## 3. Registro

- `docs/design/prototipos.md`: estado → **aprovado**, data
- Decisões que fecham questões de `design_context.md` (DS1–DS5): propor a atualização ao usuário
  (não alterar sem confirmação)

## 4. Mensagem de passagem

```
Funcionalidade: <nome> — protótipo aprovado
Canvas: <link> · Spec: docs/product/features/<slug>/spec.md#design
Telas: <n> (<lista>) · Estados: <n> · Mobile: sim · Escuro: sim
Novo a criar: <tokens/variantes/componentes ou "nada">
Dependências de API: <da spec>
Questões em aberto: <...>
Próximo: product-owner → histórias (`feature-spec` §3); depois dev-backend-python / dev-frontend-react
```

Mostrar ao usuário. Cartões no Trello só com confirmação (via `product-owner` / `trello`).
