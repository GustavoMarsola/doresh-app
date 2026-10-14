---
name: seo-audit
description: |
  Auditoria de SEO do Doresh: técnico (renderização da SPA React servida pelo FastAPI, soft 404 do
  fallback, robots, sitemap, canonical, metas por rota, Open Graph para WhatsApp/Facebook, Core
  Web Vitals, imagens, mobile), on-page (títulos, headings, conteúdo, links, pt-BR, termos que o
  público pesquisa), dados estruturados e sinais de confiança (E-E-A-T, privacidade/LGPD).
  Produz um plano priorizado por impacto/esforço em docs/seo/relatorios/auditoria-<data>.md.
  Usar no início, depois de mudanças grandes e a cada trimestre.
---

# Auditoria de SEO

Verifique no código e, se possível, no site publicado. Cada achado diz **onde**, **por que importa**
e **o que fazer**. Suposições marcadas como "não verificado".

## 1. Coletar

```bash
cat frontend/index.html
cat frontend/public/robots.txt; ls frontend/public
grep -n "<h1\|<h2\|<h3" frontend/src/pages/LandingPage.tsx
grep -n "<img\|backgroundImage" -A1 frontend/src/pages/LandingPage.tsx
ls -la frontend/src/assets
sed -n '1,40p' backend/main.py      # fallback da SPA
```

- Domínio de produção: perguntar se não estiver em `docs/seo/estrategia.md` (Q4)
- Com domínio: `WebFetch` da home (o HTML inicial tem o texto? numa SPA, não), `/robots.txt`,
  `/sitemap.xml`, uma URL inexistente (status 200 = soft 404); `WebSearch` `site:<domínio>`
- PageSpeed / Search Console: usar o que o usuário compartilhar; não inventar métricas

## 2. Lista

### Arquitetura e indexação (o ponto principal no Doresh)
- [ ] **Renderização**: a landing é parte da SPA; o HTML inicial é `<div id="root">`. O Google
  renderiza JS com atraso; redes sociais não renderizam. Recomendar uma opção, com prós e contras:
  (a) pré-renderizar as rotas públicas no build (SSG) mantendo a SPA para a área logada;
  (b) páginas de marketing estáticas servidas pelo FastAPI antes do fallback;
  (c) manter SPA e aceitar o limite (só se o canal orgânico não for prioridade)
- [ ] **Soft 404**: o catch-all em `backend/main.py` devolve `index.html` com 200 para qualquer
  caminho. Rotas desconhecidas devem responder 404 (lista de rotas públicas conhecidas no backend,
  ou `noindex` na página NotFound como mínimo)
- [ ] **Área logada fora do índice**: `/home`, `/criar`, `/ler`, `/estudos`, `/assistente`,
  `/perfil` com `noindex` e/ou `Disallow` (são privadas e exigem login)
- [ ] **Páginas indexáveis**: hoje só `/`. Propor estrutura por intenção, por exemplo:
  `/recursos/estudo-biblico`, `/recursos/esboco-de-sermao`, `/ruach` (assistente),
  `/para/pastores`, `/para/lideres-de-celula`, `/artigos/<slug>`. Decisão com o fundador;
  implementação do `dev-frontend-react` (depende da opção de renderização)
- [ ] URLs pt-BR, minúsculas, sem acentos; uma canônica por página
- [ ] `robots.txt` com `Sitemap: https://<domínio>/sitemap.xml` (hoje lista bots sem sitemap)
- [ ] `sitemap.xml` só com páginas públicas
- [ ] HTTPS; www/sem-www consistente

### Metas e compartilhamento
- [ ] `<title>` ≤ ~60 caracteres com o termo principal + marca (hoje "Doresh - דּוֹרֵשׁ": marca sem termo de busca)
- [ ] `meta description` 140–160 caracteres com benefício + CTA, única por página
- [ ] `og:image` 1200×630 própria, `og:url`, `og:site_name`, `og:locale` `pt_BR`; remover
  `twitter:site @lovable_dev` (resto do template) ou trocar pelo perfil real
- [ ] Favicon a partir de `logo.svg` + `apple-touch-icon`; `theme-color` coerente com os tokens
- [ ] Metas por rota (com SSG ou `react-helmet-async`) — hoje todas as rotas herdam as do `index.html`

### On-page
- [ ] Um `h1` com a proposta de valor **e** termo que as pessoas pesquisam (hoje "Medite na Palavra de Deus": bonito, sem termo de busca)
- [ ] `h2` por seção com termos de busca (estudo bíblico, esboço de sermão, comentário bíblico…)
- [ ] Texto suficiente para a intenção: problema → solução → resultado
- [ ] `alt` descritivo em pt-BR; imagens decorativas com `alt=""`
- [ ] Links internos entre recursos, personas e artigos

### Desempenho (Core Web Vitals)
- [ ] Hero com `background-image` JPEG (até 128 KB) → WebP/AVIF, dimensões certas, `fetchpriority`
- [ ] Imagens abaixo da dobra com `loading="lazy"` e `width`/`height`
- [ ] Bundle: a landing não deveria carregar o código da área logada (code splitting por rota)
- [ ] Fontes Google com `display=swap` e preconnect (preconnect existe)

### Confiança, LGPD e conteúdo
- [ ] Política de privacidade e termos publicados (cadastro coleta dados; IA usa OpenAI) ❓ Q6
- [ ] Quem está por trás do Doresh (sobre, contato) — E-E-A-T
- [ ] Nada de depoimentos/números inventados; a seção comentada "testemunhos" só volta com depoimentos reais autorizados
- [ ] Trechos de NVI/ARA em páginas públicas só com licença confirmada ❓ Q3

### Dados estruturados (`seo-structured-data`)
- [ ] `Organization` + `WebSite` na home; `SoftwareApplication`/`WebApplication`; `FAQPage` se houver FAQ visível; `Article` nos artigos

## 3. Relatório — `docs/seo/relatorios/auditoria-<AAAA-MM-DD>.md`

```markdown
# Auditoria SEO — <data>
Verificado: <código / site publicado / Search Console / PageSpeed> · Não verificado: <…>

## Resumo
<3–5 linhas: estado geral e as 3 ações de maior impacto>

## Plano
| # | Prioridade | Área | Problema | Ação | Responsável | Esforço |
|---|---|---|---|---|---|---|
| 1 | Alta | Indexação | Landing só renderiza com JS | Pré-renderizar rotas públicas | dev-frontend-react | M |
```

Prioridade = impacto em visitas qualificadas e cadastros × facilidade. Correções triviais de texto
e metas podem ser feitas logo, se o usuário pedir; o resto vira tarefa para o agente certo.
