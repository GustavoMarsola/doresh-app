---
name: seo-page-brief
description: |
  Brief de SEO para uma nova página do Doresh (recurso, persona, Ruach, comparação) ou artigo
  (estudo bíblico, guia de preparo de sermão), ou para reotimizar a landing: cluster e intenção,
  análise da SERP, URL, title, meta description, H1, estrutura de H2/H3, perguntas a responder,
  provas, revisão bíblica, links internos, CTA, dados estruturados e requisitos para design/dev.
  Guarda em docs/seo/briefs/<slug>.md. Usar antes de escrever ou desenhar qualquer página que
  deva ranquear.
---

# Brief de página

Um brief diz **o que a página precisa ser para merecer a posição** — não o texto final
(`seo-content-writer`) nem o layout (`product-designer`).

## 1. Entrada

- Cluster de `docs/seo/palavras-chave.md` (sem ele → `seo-keyword-research` mínimo)
- Tipo: **recurso** · **persona** · **Ruach** · **comparação** · **artigo** · **reotimização**
- Nenhuma página existente já atende essa intenção (canibalização)
- Funcionalidade citada existe de verdade (ver telas e rotas); "em breve" só com decisão do fundador
- Renderização: a página vai existir como HTML indexável? (ver `seo-audit` §2) — se não, registrar o risco

## 2. SERP

`WebSearch` da principal (e 1–2 secundárias); `WebFetch` dos 3–5 primeiros. Anotar: tipo dominante
(artigo, vídeo, ferramenta), extensão, subtemas que todos cobrem, o que falta a todos (nosso ângulo:
fidelidade ao texto, contexto judaico, ferramenta prática), "as pessoas também perguntam".

## 3. `docs/seo/briefs/<slug>.md`

```markdown
# Brief — <tema>
Data: <AAAA-MM-DD> · Tipo: <...> · Estado: rascunho

## Objetivo
Visitante: <persona e momento> · Ação desejada: <criar conta / começar um estudo / perguntar ao Ruach>

## Palavras-chave
Principal: … · Secundárias: … · Intenção: …

## SERP
<o que ranqueia e por quê; nosso ângulo>

## Metadados
URL: /…  (pt-BR, sem acentos)
Title (≤ 60): …
Meta description (140–160): …
H1: …

## Estrutura
- H2 … — <o que responder>
  - H3 …
- H2 Perguntas frequentes — <perguntas reais da SERP>
- CTA final: …

## Provas e E-E-A-T
- Funcionalidades reais, capturas com dados fictícios
- Referências bíblicas conferidas; doutrina controversa apresentada com equilíbrio
- Revisão teológica: `talmid` (obrigatória em artigos)
- Autor: <pessoa real, com nome> (artigos)
- Trechos de NVI/ARA: só com licença confirmada (❓ Q3); preferir citar a referência

## Links internos
- De: … · Para: …

## Dados estruturados
<WebApplication / FAQPage / Article / BreadcrumbList> → `seo-structured-data`

## Requisitos para design/dev
- Rota, metas próprias, imagens (alt), extensão estimada, renderização indexável
```

## 4. Passar

- Conteúdo → `seo-content-writer`
- Página/seção nova → `product-designer` (`prototype-screens`) e depois `dev-frontend-react`
- Reotimização de texto existente → direto ao `dev-frontend-react` ou aplicada com OK do usuário
