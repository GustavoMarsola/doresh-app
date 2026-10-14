---
name: seo-structured-data
description: |
  Definir e validar dados estruturados JSON-LD (schema.org) para o Doresh: Organization e
  WebSite na home, WebApplication/SoftwareApplication para o app, FAQPage, Article nos artigos
  de estudo, BreadcrumbList nas páginas internas. Gera o bloco com dados reais, indica onde
  inserir (index.html para a home; por rota quando houver pré-renderização) e como validar.
  Usar quando houver página nova, FAQ, artigo, ou na auditoria.
---

# Dados estruturados

## 1. Regras

- Só dados **reais e visíveis na página** (marcação que não corresponde ao conteúdo é penalizada)
- Domínio absoluto em `url`/`@id`/`logo`: confirmar (`docs/seo/estrategia.md` ou perguntar — Q4)
- Sem `AggregateRating`/`Review` sem avaliações reais; `offers` com `price: 0` só se o gratuito for
  decisão confirmada (monetização ❓ Q2)
- Um `<script type="application/ld+json">` com `@graph` por página
- **Onde inserir**: na SPA atual, só o `frontend/index.html` chega a crawlers sem JS — serve para a
  home. Páginas internas precisam de pré-renderização (ver `seo-audit`) para o JSON-LD por rota
  ser confiável; implementação do `dev-frontend-react`
- Dados num único módulo (ex.: `frontend/src/content/seo.ts`), não espalhados

## 2. Home

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://<domínio>/#organizacao",
      "name": "Doresh",
      "url": "https://<domínio>/",
      "logo": "https://<domínio>/logo.svg",
      "description": "<igual à meta description>",
      "sameAs": ["<YouTube real>", "<Instagram real>"]
    },
    {
      "@type": "WebSite",
      "@id": "https://<domínio>/#website",
      "url": "https://<domínio>/",
      "name": "Doresh",
      "inLanguage": "pt-BR",
      "publisher": { "@id": "https://<domínio>/#organizacao" }
    },
    {
      "@type": "WebApplication",
      "name": "Doresh",
      "url": "https://<domínio>/",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "inLanguage": "pt-BR",
      "description": "<descrição visível na página>",
      "publisher": { "@id": "https://<domínio>/#organizacao" }
    }
  ]
}
```

Campos sem valor real (redes, e-mail) ficam de fora até existirem. Logo em PNG quadrado é mais
compatível que SVG para alguns consumidores — sinalizar se só houver SVG.

## 3. Outras páginas

| Página | Tipos | Campos essenciais |
|---|---|---|
| Recurso / persona | `WebPage` com `about` → app + `BreadcrumbList` | `name`, `description`, `audience.audienceType` |
| Artigo de estudo | `Article` (ou `BlogPosting`) + `BreadcrumbList` | `headline`, `description`, `author` (`Person` real), `datePublished`, `dateModified`, `image`, `inLanguage` |
| FAQ visível | `FAQPage` | `Question.name` e `acceptedAnswer.text` idênticos ao texto da página |

## 4. Validar

- JSON válido: `python3 -c "import json,sys; json.load(open(sys.argv[1]))" bloco.json`
- Ver o HTML entregue (`npm run build` + servir `backend/static` e `curl`) e confirmar o script no `<head>`
- Pedir (ou rodar, com o site publicado) o Rich Results Test e o validador schema.org; não afirmar
  "validado" sem ter feito
- Registrar em `docs/seo/estrategia.md` (seção Dados estruturados)
