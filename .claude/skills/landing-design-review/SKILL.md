---
name: landing-design-review
description: |
  Revisar a landing do Doresh (ou uma alteração nela) antes de ir ao ar: pt-BR e regras de
  conteúdo (nada inventado, fidelidade bíblica, licença NVI/ARA), responsivo a 360 px, temas claro
  e escuro, acessibilidade, tokens e marca, âncoras e links, CTA de cadastro, imagens e
  desempenho, SEO básico. Produz uma lista de achados por gravidade e corrige o que está no
  escopo. Usar antes de dar por feita qualquer mudança visível na landing.
---

# Revisão da landing

Revisar **o que o visitante vê**, não só o código. Se possível rodar (`run`, `npm run dev` em
`frontend/`) e ver a 1280 px e a 360 px, nos dois temas.

## 1. Escopo

```bash
git diff --name-only origin/main...HEAD -- frontend/src/pages/LandingPage.tsx frontend/src/components/landing frontend/src/content frontend/index.html frontend/public
```

Sem branch → `git diff --name-only HEAD -- frontend/`. Listar as seções tocadas.

## 2. Lista

### Texto e conteúdo
- [ ] pt-BR natural; sem inglês esquecido (alts, aria-labels, 404) nem resto de template (`@lovable_dev`)
- [ ] Tom: acolhedor, claro, reverente; sem hype, sem promessas espirituais, emojis raros ou nenhum
- [ ] Nada inventado: usuários, igrejas, números, depoimentos, avaliações
- [ ] Referências bíblicas corretas; texto bíblico/teológico revisado pelo `talmid`
- [ ] Trechos de NVI/ARA só com licença confirmada (❓ Q3)
- [ ] IA apresentada como ajuda ao estudo, nunca como substituta das Escrituras
- [ ] Marcadores `[a confirmar]` listados no relatório (inaceitáveis em produção)

### Responsivo (360 px)
- [ ] Sem rolagem horizontal; títulos grandes (`text-5xl md:text-7xl`) não estouram
- [ ] Alvos ≥ 44 px; menu mobile abre, fecha e fecha ao clicar num link
- [ ] Grades viram uma coluna; hero legível sobre a imagem

### Temas
- [ ] Claro e escuro legíveis; nada de `bg-white`/`text-gray-*`/`bg-slate-*`/hex
- [ ] Texto sobre a imagem do hero com contraste suficiente (overlay)

### Acessibilidade
- [ ] Um `h1`; `h2` por seção; sem saltos de nível
- [ ] Links/botões só com ícone com `aria-label`; imagens decorativas `alt=""`; hebraico com `lang="he" dir="rtl"`
- [ ] Foco visível; teclado chega a tudo; animações respeitam `prefers-reduced-motion`
- [ ] Contraste AA (tabela em `design_context.md` §3)

### Tokens e marca
- [ ] Uma ação dourada por seção; CTA verbo + objeto
- [ ] Ritmo consistente (`py-24`, `h2` → parágrafo → conteúdo)

### Links e conversão
- [ ] Cada `href="#..."` tem um `id` correspondente; em outras páginas usa `/#...`
- [ ] CTAs levam a `/registrar`; "Entrar" a `/login`
- [ ] Links externos `target="_blank" rel="noopener noreferrer"`

### Desempenho
- [ ] Imagens comprimidas (hero hoje em JPEG de até 128 KB), no tamanho mostrado, WebP/AVIF
- [ ] `loading="lazy"` abaixo da dobra; `width`/`height` em `<img>`
- [ ] Sem dependências pesadas novas na landing

### SEO básico (mais fundo: `seo-audit`)
- [ ] `index.html`: title/description coerentes com o H1; `og:*` presentes
- [ ] Texto real, não texto dentro de imagem

## 3. Relatório

```
## Revisão da landing: <alteração>

Verificado: <larguras, temas, navegador; o que não foi verificado>

| # | Gravidade | Onde | Problema | Correção |
|---|---|---|---|---|
| 1 | Alta | Hero | h1 estoura a 360 px | text-4xl no mobile |
```

Gravidade: **Crítica** (página quebrada, CTA não funciona, conteúdo inventado ou bíblia citada
errado) · **Alta** (inutilizável no celular, bloqueio de acessibilidade, tema ilegível, inglês visível)
· **Média** (inconsistência) · **Baixa** (detalhe). Corrigir Crítica/Alta no escopo; listar Média/Baixa.
