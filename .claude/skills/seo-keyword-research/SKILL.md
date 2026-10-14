---
name: seo-keyword-research
description: |
  Pesquisa de palavras-chave em pt-BR para o Doresh: parte do que o produto faz (estudo bíblico,
  esboço de sermão, leitura NVI/ARA, destaques e anotações, assistente de IA Ruach) e dos
  problemas das personas (pregadores, líderes de célula/EBD, estudantes de teologia, leigos),
  expande com pesquisa real (SERP, sugestões, "as pessoas também perguntam"), classifica por
  intenção e relevância, agrupa em clusters e mapeia cada cluster a uma página. Guarda em
  docs/seo/palavras-chave.md. Usar no início da estratégia, antes de planejar páginas/artigos e a
  cada trimestre.
---

# Pesquisa de palavras-chave

Objetivo: uma lista **curta e acionável** de clusters que levam a cadastro e primeiro estudo, não
uma planilha com mil termos.

## 1. Sementes (a partir de `project/company_context.md`)

- **Produto/ferramenta**: app de estudo bíblico, plataforma de estudo bíblico online, como montar um
  esboço de sermão, gerador de esboço de sermão, organizar estudos bíblicos, bíblia online com
  anotações, comentário bíblico online, IA para estudo bíblico, assistente bíblico com IA
- **Personas**: preparar pregação, mensagem para culto, estudo para célula, roteiro de EBD,
  exegese bíblica para iniciantes, hermenêutica, estudo de palavras no hebraico/grego
- **Problemas (D1–D5)**: como preparar um sermão rápido, onde guardar anotações da Bíblia, estudar
  a Bíblia com contexto histórico, IA que cita a Bíblia
- **Informacionais com ligação ao produto** (conteúdo revisado pelo `talmid`): estudos sobre
  passagens e temas (ex.: "estudo sobre a parábola do semeador"), significado de palavras hebraicas
  (ex.: "ruach significado"), festas bíblicas, contexto judaico dos evangelhos
- **Comparativas** (só com página honesta): alternativa ao Logos em português, app para preparar sermão
- **Marca**: "Doresh", "Doresh app", "Ruach IA"

## 2. Expandir com dados reais

- `WebSearch` de cada semente: títulos que ranqueiam, tipo de página (ferramenta, artigo, vídeo,
  portal), "as pessoas também perguntam", buscas relacionadas
- `WebFetch` dos 3–5 primeiros: profundidade e ângulo
- Volumes/dificuldade só com fonte (Keyword Planner, Search Console, ferramenta do usuário). Sem
  fonte → estimativa qualitativa **marcada como estimativa**
- Search Console com dados? Consultas em posição 8–30 com muitas impressões = oportunidades rápidas
- YouTube é buscador relevante neste nicho: anotar termos onde vídeos dominam a SERP (canal Doresh)

## 3. Classificar

| Campo | Valores |
|---|---|
| Intenção | Transacional (quer usar uma ferramenta) · Comercial (compara) · Informacional · Navegacional |
| Relevância | 3 = o Doresh faz isso · 2 = problema que resolvemos · 1 = tangencial |
| Dificuldade | quem ranqueia: grandes portais/apps (alta) vs blogs pequenos (baixa) |
| Prova | temos funcionalidade real e conteúdo fiel (revisado) para isso? sim/não |
| Persona | A, B, C ou D |

Descartar relevância 1 sem prova. Priorizar transacional/comercial de cauda longa com
funcionalidade **já construída**. Informacional só quando leva naturalmente ao produto (ex.: um
estudo bíblico que termina em "crie o seu estudo no Doresh").

## 4. Clusters e mapa

Termos com a mesma intenção (o Google mostra os mesmos resultados) = um cluster = uma página.

## 5. `docs/seo/palavras-chave.md`

```markdown
# Palavras-chave — atualizado <AAAA-MM-DD>
Fontes: <ferramentas / SERP manual / Search Console> · Volumes (est.) são estimativas

## Clusters
| Cluster | Principal | Secundárias | Intenção | Relevância | Dificuldade | Prova | Persona | Página | Estado |
|---|---|---|---|---|---|---|---|---|---|
| Esboço de sermão | como fazer esboço de sermão | esboço de pregação, estrutura de sermão | Informacional/Transacional | 3 | Média (est.) | sim | A | /recursos/esboco-de-sermao | a criar |

## Prioridades do trimestre
1. …

## Descartadas (e por quê)
- …
```

Termine com as 3–5 páginas/artigos a fazer primeiro → `seo-page-brief`.
