---
name: prototype-screens
description: |
  Prototipar telas e fluxos do Doresh num canvas de design (Artifact do tipo "Design",
  pranchetas lado a lado como no Figma) antes de escrever código: inventário de telas a partir
  do brief/spec ou do pedido, pranchetas desktop (1440) e mobile (390×844), tema claro e escuro,
  os estados de cada tela, variantes para decidir, protótipo clicável para testes, marca e tokens
  do Doresh, textos pt-BR e dados fictícios. Também revisar um canvas a partir de comentários.
  Usar sempre que alguém quer "ver como fica" uma tela ou fluxo.
---

# Prototipar telas num canvas

O formato técnico do canvas (arquivos, `canvas.json`, chamadas ao Artifact, ligações entre
pranchetas) é definido pelo **tipo Design** e chega no resultado de criar/ler o canvas e nas suas
referências. **Siga-o à letra.** Esta skill decide *o quê* desenhar e *como deve parecer* no Doresh.

## 1. Enquadrar

Ler `project/design/design_context.md`, o `brief.md`/`spec.md` (se houver),
`docs/design/prototipos.md` (canvas existente? design system?) e as páginas atuais em
`frontend/src/pages/` (padrões já construídos).

Para você mesmo, uma linha cada: **funcionalidade e objetivo** (D1–D5) · **persona e dispositivo
principal** · **telas** (inventário) · **pressupostos**.

Faltando persona ou escopo e havendo quem responda: uma pergunta (AskUserQuestion). Senão, decida e
declare o pressuposto na resposta.

## 2. Canvas: criar ou reutilizar

- Já existe canvas da funcionalidade em `docs/design/prototipos.md` → **revisar** esse (§7)
- Não existe → `Artifact` `action: "quickstart"`, `intent: "design"` → criar com o `type_url`
  devolvido, `title` em pt-BR ("Editor de estudos"), `auto_open: "after_first_write"`; seguir as
  instruções do tipo
- **Design system**: se `docs/design/prototipos.md` tem o link do "Doresh — Design System", instale-o;
  se não, desenhe com os tokens abaixo e sugira `design-system-artifact` no fim

## 3. Organização

| Elemento | Convenção |
|---|---|
| Páginas | Uma por fluxo quando houver mais de ~6 pranchetas |
| Linhas | Uma por tela: estado principal desktop → estados → mobile → escuro |
| Títulos | Acima de cada linha: nome da tela ("Biblioteca de estudos") |
| Pranchetas | "Biblioteca — com dados", "Biblioteca — vazio (usuário novo)", "Biblioteca — mobile", "Biblioteca — escuro" |
| Arquivos | kebab-case sem acentos: `biblioteca-vazio.dc.html` |
| Notas | Só pressupostos e questões em aberto visíveis ao fundador |

## 4. O que desenhar por tela

**Sempre:** estado principal com dados realistas em desktop **e** mobile, e ao menos a tela
principal também no **tema escuro**.

| Estado | Como desenhar |
|---|---|
| Com dados | 6–12 itens fictícios plausíveis e variados (títulos, referências, datas, alguns "Gerado com IA") |
| Carregando | Esqueletos com a forma final, sem spinner no meio |
| Vazio (usuário novo) | Ícone leve (pomba, pergaminho) + frase curta + ação principal |
| Vazio (filtro) | "Nenhum resultado para estes filtros." + "Limpar filtros" |
| Erro | Toast com texto do tom de voz |
| Não encontrado | Painel "Estudo não encontrado." + voltar |
| IA em progresso / limite | Indicador com cancelar / aviso de limite com quando volta |

Formulários: vazio, preenchido, com erros (mensagens pt-BR por campo), salvando ("Salvando…").
Leitor: capítulo com versículos, destaque aplicado (cores da paleta DS5 🧪), comentário aberto,
texto hebraico RTL se a tela tiver.

**Tamanhos:** desktop página fluida (largura 1440); mobile 390×844 (verificar que cabe em 360).
Diálogos sobre a tela de fundo escurecida.

## 5. Visual Doresh (sem design system instalado)

```
Claro: fundo #F8F8F7 · cartão #FFFFFF · texto #2C2421 · secundário #6B6561 (🧪 contraste) · borda #E7E3DA · muted #EEECE8
Escuro: fundo #171312 · cartão #1D1816 · texto #F3F3F1 · secundário #AAA5A1 · muted #2C2421
Primária (1 por tela) dourado #8E600B com texto branco (🧪; hoje #A5700D, 4,08:1) · escuro #D49011 com texto #171312
Acento azul profundo #072A55 (claro) · como texto no escuro #5A9EF2 (🧪)
Erro #C52020 (🧪)
Inter (interface, 14–16) · Crimson Text (Escritura, títulos de leitura; ≥ 16 no mobile, entrelinha 1,6–1,7)
Raio 16 px nos cartões, 8–12 px em botões/inputs · sombras suaves · ícones Lucide traço fino · pomba = Ruach
```

Fontes do Google Fonts (como o tipo permitir). Logo: `frontend/public/logo.svg` como upload (ler o
arquivo antes de publicar).

Anatomia: cabeçalho com logo + navegação (Início, Ler, Estudos, Criar, Ruach, Perfil) e avatar;
conteúdo com largura máxima ~1200 (leitura ~70ch); Ruach flutuante no canto inferior direito.
Mobile: barra superior + navegação inferior com 4–5 destinos; Ruach acessível sem cobrir conteúdo.

**Construível:** só o que existe em shadcn/ui (Button, Input, Textarea, Select, Card, Badge, Tabs,
Dialog, Sheet, DropdownMenu, Tooltip, Toast/Sonner, Skeleton, Accordion, ScrollArea, Avatar,
Popover, Command) e padrões do app. Algo fora disso → nota.

**Acessível como desenhado:** botões, links e labels reais; `aria-label` em botões só com ícone;
contraste AA; estado com ícone + texto.

## 6. Variantes e protótipo clicável

- **Variantes** (ex.: editor em uma coluna vs. com painel de referências): lado a lado, "Opção A — …" /
  "Opção B — …", mesmo conteúdo; na resposta, recomendação + por quê
- **Clicável** (para `usability-test`): ligações entre telas cobrindo só as tarefas do roteiro, com
  caminho de volta em cada tela

## 7. Revisar um canvas

1. Ler comentários (`ArtifactComments`) e/ou o pedido no chat
2. Seguir a seção de revisão das instruções do tipo; ler só as pranchetas a mudar
3. Mudar **só** o que foi pedido; conflito com a marca ou a spec → fazer e dizer o conflito numa linha
4. Responder aos comentários tratados e dar o link

## 8. Fechamento

- Atualizar `docs/design/prototipos.md` (criar se não existir):

  ```markdown
  # Protótipos

  | Funcionalidade | Canvas | Spec | Estado | Atualizado |
  |---|---|---|---|---|
  | Editor de estudos | <link> | docs/product/features/editor-estudos/spec.md | em revisão | 2026-10-14 |

  Design system: <link ou "ainda não criado">
  ```
  Estados: rascunho · em revisão · aprovado · construído
- Resposta: link, o que foi desenhado (telas × estados × dispositivos × temas), pressupostos,
  questões em aberto, próximo passo (revisar / testar / `prototype-handoff`)
- Não abrir, capturar ou reler para verificar, salvo pedido

## Checklist

- [ ] Cada tela com desktop e mobile, estados aplicáveis e a principal no tema escuro
- [ ] Uma só ação dourada por tela; contraste AA
- [ ] Textos pt-BR reais, tom §6; referências bíblicas corretas
- [ ] Dados fictícios; nada de conteúdo real de usuários
- [ ] Conteúdo de IA identificado
- [ ] Tudo mapeia para shadcn/ui ou está sinalizado
- [ ] Alvos ≥ 44 px no mobile; sem rolagem horizontal a 360 px
- [ ] `docs/design/prototipos.md` atualizado
