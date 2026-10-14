---
name: landing-add-section
description: |
  Acrescentar ou reestruturar uma seção da landing do Doresh (frontend/src/pages/LandingPage.tsx,
  rota /) — recursos, benefícios, como funciona, Ruach, para quem é, FAQ, depoimentos reais — ou
  criar uma página pública nova, seguindo o padrão existente: seção com id âncora em pt-BR,
  container + py-24, h2 + parágrafo de contexto + grade de cartões, tokens semânticos, CTA para
  /registrar, link no menu. Usar sempre que um bloco de conteúdo entra na landing ou um existente
  é reorganizado.
---

# Acrescentar uma seção à landing

## 1. Antes de programar

- Protótipo aprovado do `product-designer`? Siga-o. Seção nova sem protótipo → sugira prototipar
  (uma linha) e avance se o usuário disser
- Conteúdo **real**: sem usuários, igrejas, números, avaliações ou depoimentos inventados. A seção
  "testemunhos" comentada só volta com depoimentos reais e autorizados por escrito. Falta conteúdo →
  perguntar ou usar `[a confirmar]` visível e dizê-lo no relatório
- Texto vindo do `marketing-seo` (`docs/seo/conteudos/`) quando a seção responde a uma intenção de busca
- Conteúdo bíblico (versículos, explicações) revisado pelo `talmid`; trechos de NVI/ARA só com
  licença confirmada (❓ Q3)
- Âncora pt-BR, minúsculas, sem acentos: `recursos`, `beneficios`, `como-funciona`, `perguntas`

## 2. Padrão existente

Seções em `LandingPage.tsx` seguem: `<section id="..." className="py-24 bg-background">` (alternando
com `bg-muted/30`) → `container mx-auto px-4` → bloco central com `h2` (`text-4xl md:text-5xl font-bold
text-foreground`) + parágrafo `text-xl text-muted-foreground` → grade de `Card` com ícone Lucide.

Se a página crescer (> ~400 linhas), extrair cada seção para `src/components/landing/<Secao>.tsx` e
o conteúdo para `src/content/landing.ts` (arrays `{ titulo, descricao, icone }`) — combinar com o
usuário na primeira vez.

```tsx
<section id="como-funciona" className="py-24 bg-muted/30">
  <div className="container mx-auto px-4">
    <div className="text-center mb-16">
      <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Do texto ao esboço em três passos</h2>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Uma frase de contexto, sem promessas que o produto não cumpre.</p>
    </div>
    <ol className="grid gap-6 md:grid-cols-3">
      {passos.map((p) => (
        <li key={p.titulo}>
          <Card className="h-full">
            <CardHeader><CardTitle>{p.titulo}</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">{p.descricao}</CardContent>
          </Card>
        </li>
      ))}
    </ol>
  </div>
</section>
```

- Tokens semânticos apenas (nada de `bg-white`, `text-gray-*`, hex); conferir no tema escuro
- Um `h2` por seção, `h3`/`CardTitle` nos cartões; nunca um segundo `h1`
- Uma ação dourada por seção no máximo; CTA principal → `/registrar`
- Imagens: comprimidas (WebP), `alt` em pt-BR, `loading="lazy"` abaixo da dobra
- Animação discreta (`animate-fade-in`) respeitando `prefers-reduced-motion`

## 3. Ligar

1. Posicionar na ordem combinada dentro de `LandingPage.tsx`
2. Menu: link `<a href="#...">` no `nav` desktop **e** no menu mobile (o arquivo importa `Menu`/`X`)
3. Se responde a intenção de busca (FAQ, recursos), avisar o `marketing-seo` (`seo-structured-data`)

## 4. Página pública nova (rota)

- Rota em `App.tsx` **fora** do `ProtectedRoute`, path pt-BR sem acentos (`/recursos/esboco-de-sermao`)
- Metas próprias (title, description, og) — exige `react-helmet-async` ou pré-renderização; decidir
  com o `marketing-seo` (ver `seo-audit` §2) antes de criar várias páginas
- Mesmo cabeçalho/rodapé da landing; links de âncora apontam para `/#...`

## 5. Feito

`landing-design-review` na seção + Definição de Pronto do `dev-frontend-react`.
