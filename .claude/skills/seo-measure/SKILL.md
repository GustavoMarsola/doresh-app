---
name: seo-measure
description: |
  Medição de SEO e aquisição orgânica do Doresh: guia de configuração (Google Search Console,
  Bing, analytics respeitoso da LGPD, conversões = cadastros e primeiro estudo, UTM para redes e
  YouTube), registro de alterações e relatório mensal com cliques, impressões, posições, páginas
  e cadastros de origem orgânica, mais as próximas ações. Guarda em
  docs/seo/relatorios/<AAAA-MM>.md. Usar para montar a medição ou quando pedirem "como está o
  SEO", "relatório", "resultados".
---

# Medir

Sem medição não há SEO, só opinião. Nunca invente números: sem dados, diga que não tem e como obtê-los.

## 1. Configuração (uma vez)

Verificar no código e perguntar o que já existe.

1. **Google Search Console** — propriedade de domínio (DNS) pelo usuário; enviar `sitemap.xml`.
   **Bing Webmaster Tools** (importa do GSC)
2. **Analytics** — preferir opção sem cookies (Plausible, Umami) só nas **páginas públicas**; GA4
   exige consentimento LGPD e banner. Na área logada, nada de analytics de terceiros que capture
   URL com ids ou conteúdo (fé é dado sensível). Decisão do usuário; implementação do
   `dev-frontend-react`; nenhum segredo no bundle
3. **Conversões** — fonte de verdade: cadastros e ativação no backend (contagens agregadas, nunca
   dados pessoais). Para atribuir origem, propor guardar `utm_*`/página de entrada no cadastro
   (história para backend + frontend, com base legal). Eventos estáveis: `cadastro_iniciado`,
   `cadastro_concluido`, `primeiro_estudo_criado`, `primeira_pergunta_ruach` — sem conteúdo
4. **UTM** nos links de redes, YouTube e e-mail (`utm_source=youtube&utm_medium=video&utm_campaign=<…>`)
5. Registrar em `docs/seo/estrategia.md` o que está ativo e desde quando

Criar contas, verificar domínios ou instalar scripts de terceiros só com pedido explícito.

## 2. Registro de alterações

`docs/seo/alteracoes.md`: data · o que mudou (página, title, conteúdo, técnico) · por quê.

## 3. Relatório mensal `docs/seo/relatorios/<AAAA-MM>.md`

```markdown
# SEO — <mês>
Fontes: <GSC export, Plausible, contagens do backend> · Período: <datas> vs <mês anterior>

## Números
| Métrica | Mês | Anterior | Δ |
|---|---|---|---|
| Cliques orgânicos | | | |
| Impressões | | | |
| Posição média | | | |
| Páginas indexadas | | | |
| Cadastros de origem orgânica | | | |
| … que criaram o primeiro estudo em 7 dias | | | |

## Consultas
- Top 10 por cliques · Oportunidades (posição 8–30, muitas impressões, CTR baixo)

## Páginas
- Melhores e piores; páginas sem impressões

## O que mudou este mês
<de docs/seo/alteracoes.md>

## Próximas ações (máx. 5)
1. …
```

Leitura honesta: SEO leva semanas a meses; enquanto a landing depender de JS, a indexação é
limitada (ver `seo-audit`). O relatório diz se a tendência e as ações estão certas, não só os totais.
