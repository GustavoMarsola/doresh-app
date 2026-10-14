---
name: seo-content-writer
description: |
  Escrever conteúdo otimizado para busca em pt-BR para o Doresh — páginas de recursos, personas,
  Ruach ou artigos de estudo bíblico e preparo de sermão — a partir de um brief (seo-page-brief),
  com a voz do Doresh, fidelidade bíblica (revisão do talmid), referências corretas, estrutura
  escaneável, FAQ, links internos e CTA, mais title, meta description e alts. Guarda em
  docs/seo/conteudos/<slug>.md. Usar para criar ou reescrever texto que deva ranquear e converter.
---

# Escrever conteúdo

## 1. Antes

- Ler o brief (`docs/seo/briefs/<slug>.md`). Sem brief → `seo-page-brief` primeiro
- Ler a voz e o contexto: `project/design/design_context.md` §1 e §6, `project/company_context.md`
  §2–3 (personas, D1–D5) e §10 (glossário)
- Listar os fatos e de onde vêm. Funcionalidade, número ou citação não confirmados → `[a confirmar]`

## 2. Escrever

- **Abertura**: a situação do leitor em 2–3 frases concretas, com a palavra principal ("É quinta à
  noite e o sermão de domingo ainda é uma lista de versículos soltos.") — nada de "Nos dias de hoje…"
- **Estrutura do brief**: H2/H3 com termos que as pessoas buscam; parágrafos de 2–4 frases; listas
  para passos
- **Problema → caminho → resultado**, com o dia a dia real: escolher o texto, ler o contexto,
  separar as divisões, aplicar, revisar
- **Escritura**: referências no formato "João 3.16"; citações curtas; tradução indicada; nada de
  versículo fora de contexto para sustentar uma tese
- **Responder direto** às perguntas da SERP (a 1ª frase responde, o resto explica)
- **FAQ** com 3–6 perguntas reais
- **CTA** claro e honesto ("Crie sua conta e monte seu primeiro estudo")
- **IA**: apresentar o Ruach como ajuda ao estudo, nunca como substituto da leitura das Escrituras,
  da oração ou da orientação pastoral
- Palavra principal natural: no H1, no 1º parágrafo, em 1–2 H2 e no title; sinônimos no resto

## 3. Revisão bíblica e teológica

Antes de entregar, passar o texto ao agente **`talmid`** pedindo: referências corretas, citações
fiéis ao contexto, afirmações doutrinárias equilibradas (sem tomar partido em temas controversos
entre tradições sem decisão do fundador). Registrar no arquivo que a revisão foi feita.

## 4. Qualidade

- [ ] pt-BR natural (você, celular, aplicativo, cadastro, tela, salvar)
- [ ] Tom Doresh: acolhedor, claro, reverente; sem hype, culpa ou promessas espirituais
- [ ] Nada inventado (usuários, igrejas, números, depoimentos, avaliações)
- [ ] Útil mesmo para quem não se cadastra
- [ ] Title ≤ 60, meta description 140–160, H1 único, alts descritivos
- [ ] Trechos longos de NVI/ARA só com licença confirmada (❓ Q3)
- [ ] Revisão do `talmid` feita

## 5. `docs/seo/conteudos/<slug>.md`

```markdown
---
url: /…
title: …
description: …
h1: …
autor: <pessoa real> (artigos)
revisao_teologica: talmid, AAAA-MM-DD
data: AAAA-MM-DD
brief: docs/seo/briefs/<slug>.md
---

<conteúdo em Markdown>

<!-- Links internos sugeridos: … -->
<!-- Imagens: <arquivo> — alt: … -->
<!-- A confirmar: … -->
<!-- Fontes: … -->
```

Passar ao `dev-frontend-react` (implementação) e, se a página for nova, ao `product-designer`.
Sugerir 1–2 derivados (post, roteiro curto de vídeo para o canal Doresh).
