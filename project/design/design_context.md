# Doresh — Contexto de design

> Fonte de verdade de marca e interface para `product-designer`, `dev-frontend-react` e
> `marketing-seo`. Valores lidos de `frontend/src/index.css`, `frontend/tailwind.config.ts` e
> `frontend/index.html` em 2026-10-14. Marcas: ✅ em uso · 🧪 proposta · ❓ em aberto.
> Se este arquivo e o CSS divergirem, o CSS manda até alguém decidir; registre a divergência.

---

## 1. Essência

Doresh é um lugar de **estudo sério e sereno** das Escrituras: papel claro, tinta escura, dourado
como luz de destaque, um azul profundo como acento. Calmo, legível, reverente sem ser antiquado.
Nada de "app gamificado", confete ou ruído visual.

## 2. Ativos

| Ativo | Onde |
|---|---|
| Logo (SVG) | `frontend/public/logo.svg` (favicon e PDF de sermão) |
| Imagem de marca | `frontend/public/torah.png`, `docs/torah.png` |
| Componente | `@/components/ui/logo`, `@/components/ui/dove-icon` |
| Imagens da landing | `frontend/src/assets/hero-*.jp(e)g`, `*-icon.jpg` |

❓ Não há guia de logo (área de respiro, tamanhos mínimos, versão monocromática).

## 3. Cor

### Tokens em uso ✅ (HSL em `index.css`; hex calculado)

| Token | Claro | Escuro |
|---|---|---|
| `--background` | `45 8% 97%` · #F8F8F7 | `20 14% 8%` · #171312 |
| `--foreground` | `20 14% 15%` · #2C2421 | `45 8% 95%` · #F3F3F1 |
| `--card` | #FFFFFF | `20 14% 10%` · #1D1816 |
| `--primary` (dourado) | `39 85% 35%` · #A5700D | `39 85% 45%` · #D49011 |
| `--primary-foreground` | #FAFAFA | #171312 |
| `--secondary` | `45 15% 88%` · #E5E3DC | `20 14% 15%` |
| `--muted` | `45 15% 92%` · #EEECE8 | `20 14% 15%` · #2C2421 |
| `--muted-foreground` | `25 5% 45%` · #78726D | `25 5% 65%` · #AAA5A1 |
| `--accent` (azul profundo) | `213 85% 18%` · #072A55 | `213 85% 28%` · #0B4184 |
| `--destructive` | `0 84% 60%` · #EF4343 | igual |
| `--border` / `--input` | `45 20% 88%` · #E7E3DA | `20 14% 20%` |
| `--ring` | = primary | = primary |
| `--radius` | `1rem` | |

Meta `theme-color`: `#B8860B`.

### Contraste (WCAG 2.1, calculado em 2026-10-14)

| Par | Razão | AA texto normal (4,5) |
|---|---|---|
| foreground sobre background | 14,2 | ✅ |
| accent sobre background (claro) | 13,4 | ✅ |
| **primary-foreground (branco) sobre primary** | **4,08** | ❌ |
| primary como texto sobre background / card | 4,0 / 4,26 | ❌ (só texto ≥ 24 px ou 18,66 px negrito) |
| **muted-foreground sobre background / muted** | **4,46 / 4,02** | ❌ |
| **branco sobre destructive** | **3,62** | ❌ |
| escuro: primary-foreground sobre primary | 6,84 | ✅ |
| escuro: muted-foreground sobre background | 7,54 | ✅ |
| **escuro: accent como texto sobre background** | **1,85** | ❌ (ilegível) |

### Correções propostas 🧪 (aguardam decisão; aplicar com `frontend-design-tokens`)

| Token | Hoje | Proposta | Resultado |
|---|---|---|---|
| `--primary` (claro) | `39 85% 35%` | `39 85% 30%` · #8E600B | branco sobre ele 5,26; como texto sobre bg 5,16 |
| `--muted-foreground` (claro) | `25 5% 45%` | `25 5% 40%` · #6B6561 | 5,38 sobre bg; 4,85 sobre muted |
| `--destructive` (claro) | `0 84% 60%` | `0 72% 45%` · #C52020 | branco sobre ele 5,56 |
| `--accent` como texto (escuro) | `213 85% 28%` | token novo `--accent-text` `213 85% 65%` · #5A9EF2 | 6,67 sobre bg escuro |

❓ Variáveis `--sidebar-*` são referenciadas em `tailwind.config.ts` mas **não estão definidas**
em `index.css`: qualquer classe `bg-sidebar` sai sem cor. Definir ou remover.

### Regras

- Componentes usam só tokens semânticos (`bg-primary`, `text-muted-foreground`); sem hex nem
  paleta do Tailwind (`bg-blue-500`)
- **Dourado é luz:** uma ação principal por tela, item ativo da navegação, foco, destaques. Nunca
  grandes áreas
- Estado nunca só por cor (ícone + texto)
- As **cores de destaque de versículo** escolhidas pelo usuário são conteúdo, não marca: devem
  manter o texto legível (≥ 4,5:1) nos dois temas

## 4. Tipografia ✅

| Uso | Família |
|---|---|
| Interface | **Inter** 300–700 (`font-inter`, padrão do `body`) |
| Texto bíblico e títulos de leitura | **Crimson Text** 400/600, itálico (`font-crimson`) |
| Hebraico | `font-hebrew` (Times New Roman); 🧪 avaliar uma fonte hebraica dedicada (ex.: SBL Hebrew, Frank Ruhl Libre) com `dir="rtl"` |

🧪 Escala: corpo 16/1.6 na leitura bíblica (conforto de leitura longa), 14/1.5 na interface;
títulos de página 28–32; texto bíblico nunca abaixo de 16 px no celular.

## 5. Linguagem visual

- Superfícies claras e calmas, bordas suaves, raio generoso (`--radius: 1rem`)
- Ícones Lucide de traço fino; pomba (`DoveIcon`) como símbolo do Ruach
- Animação mínima (`animate-fade-in`); respeitar `prefers-reduced-motion`
- Imagens: pergaminhos, Torá, luz; nunca imagens de pessoas reais sem licença

## 6. Tom de voz (pt-BR)

- Acolhedor, claro e reverente; "você"; frases curtas
- Bíblico sem jargão desnecessário; termos técnicos (exegese, hermenêutica) explicados na
  primeira ocorrência
- Sem hype ("revolucionário", "incrível"), sem emojis em interface, exclamação só com muita parcimônia
- Botões com verbo + objeto ("Salvar estudo", "Gerar com o Ruach"); erros dizem o que falhou e o
  que fazer ("Não foi possível salvar o estudo. Tente novamente.")
- Respeito entre tradições cristãs; nunca ironia sobre fé

✓ "Organize seus estudos e encontre de novo aquele versículo que marcou você."
✗ "A IA revolucionária que vai transformar sua vida espiritual!!!"

## 7. Regras da aplicação

- `Layout` com `header` + `navigation`; Ruach flutuante (`FloatingAssistant`) exceto nas telas
  do próprio Ruach e do perfil
- Leitura bíblica: largura de linha confortável (60–75 caracteres), número de versículo discreto,
  destaques com contraste verificado
- Mobile primeiro para leitura e Ruach (personas B e D); estudos longos também no desktop (A e C)
- Conteúdo gerado por IA sempre identificado como tal
- Dados de exemplo em protótipos e capturas: fictícios (ex.: "Pr. João Exemplo", estudo
  "A parábola do semeador"); nunca estudos reais de usuários (LGPD, dado sensível)

## 8. Landing page

`frontend/src/pages/LandingPage.tsx` (rota `/`), dentro da SPA. Seções: hero ("Medite na Palavra
de Deus"), recursos, benefícios; CTA "Começar Gratuitamente" → `/registrar`. Detalhes de SEO
técnico ficam com o `marketing-seo` (a SPA é renderizada no cliente).

## 9. Questões em aberto

| # | Questão |
|---|---|
| DS1 | Aprovar as correções de contraste da §3 |
| DS2 | Definir ou remover os tokens `--sidebar-*` |
| DS3 | Fonte hebraica dedicada (e grega, se houver estudo de línguas originais) |
| DS4 | Guia de logo e versão monocromática |
| DS5 | Paleta de cores de destaque de versículo (claro + escuro, contraste verificado) |

## Histórico

| Data | Mudança |
|---|---|
| 2026-10-14 | Criação a partir do CSS/Tailwind existentes, com cálculo de contraste |
