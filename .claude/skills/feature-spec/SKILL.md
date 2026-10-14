---
name: feature-spec
description: |
  Transformar um brief aprovado numa spec pronta para construir no Doresh:
  docs/product/features/<slug>/spec.md com fluxo, telas e rotas, estados (carregando, vazio,
  erro, não encontrado, IA em progresso/limite), mobile, temas claro/escuro, textos pt-BR,
  contrato de API necessário (e o que pedir ao backend), privacidade, eventos e critérios de
  aceitação, mais a divisão em histórias para o Trello. Usar antes de quebrar em histórias uma
  funcionalidade com mais de uma tela ou fluxo novo.
---

# Feature spec → `spec.md` + histórias

A spec é o contrato entre produto e engenharia (frontend **e** backend, no mesmo monolito). Tudo o
que o programador teria de inventar (um texto, um estado vazio, um limite de IA) está aqui ou
explicitamente delegado ("texto livre do programador, revisar na aceitação").

## 1. Ler

- `docs/product/features/<slug>/brief.md` (aprovado; sem brief e não trivial → `feature-discovery` primeiro)
- `project/design/design_context.md` §6 (tom) e §7 (regras da app)
- `docs/telas.md` e as páginas existentes, para reutilizar padrões e navegação
- Contrato atual: `backend/src/routes/api/v1/`, `backend/src/schemas/`
- Canvas aprovado do `product-designer`, se houver

## 2. Escrever `docs/product/features/<slug>/spec.md`

```markdown
# Spec: <Nome>

> Brief: ./brief.md · **Estado:** rascunho | aprovada · **Data:** AAAA-MM-DD

## Fluxo
<passos numerados ou mermaid, incluindo caminhos alternativos e de erro>

## Telas
| Tela | Rota | Persona/dispositivo principal | Entrada a partir de |
|---|---|---|---|
| Biblioteca de estudos | /estudos | Pregador, desktop | Navegação; fim do editor |

### <Tela 1>
- **Objetivo:** <uma frase>
- **Conteúdo:** <campos por ordem de importância>
- **Ação principal (dourada, uma só):** <...> · **Secundárias:** <...>
- **Filtros/ordenação/busca:** <...>
- **Mobile (360 px):** <o que muda>
- **Tema escuro:** <algo específico? destaques, imagens>

#### Estados
| Estado | O que se vê | Texto pt-BR |
|---|---|---|
| Carregando | Esqueleto dos cartões | — |
| Vazio (usuário novo) | Ilustração leve + texto + ação | "Você ainda não tem estudos. Crie o primeiro." |
| Vazio (filtro) | Texto + limpar filtros | "Nenhum resultado para estes filtros." |
| Erro | Toast | "Não foi possível carregar seus estudos. Tente novamente." |
| Não encontrado | Painel com voltar | "Estudo não encontrado." |
| IA em progresso | Indicador + cancelar | "Gerando esboço…" |
| Limite de IA | Aviso | "Você atingiu o limite de hoje do Ruach. Volte amanhã." |

#### Validações e mensagens
| Campo | Regra | Mensagem |

## API
| Necessidade | Endpoint | Existe? |
|---|---|---|
| Listar paginado com total real | GET /api/v1/studies?page=&per_page= | existe (total incorreto: a corrigir) |
<para o que falta: pedido ao backend no formato de `frontend-api-contract` §5>

## Privacidade e IA
- Dados do usuário envolvidos: <...> (sensíveis: sim) — isolamento por usuário em todas as rotas
- IA: o que é gerado, como é identificado, como o usuário revisa, limites e custo
- Conteúdo bíblico/teológico revisado por: `talmid`

## Eventos
| Evento | Quando | Propriedades (sem conteúdo pessoal) |

## Critérios de aceitação globais
- [ ] ...

## Fora de escopo
## Questões em aberto
```

### Regras para textos

- pt-BR, "você", frases curtas, tom acolhedor e reverente; sem hype nem emojis
- Botões com verbo + objeto ("Salvar estudo"); erros dizem o que falhou e o que fazer
- Nomes de livros e referências corretos (João 3.16; 1 Coríntios 13)

## 3. Quebrar em histórias

- Fatias verticais (API + tela), cada uma utilizável e testável sozinha
- Ordem típica: ler (lista/detalhe) → criar/editar → ações (IA, destaque, exportar) → extras
- Cada história ≤ L (2–3 dias); maior → dividir
- Modelo de cartão do agente `product-owner`; critérios referenciam seções da spec
- Dependências de backend como cartões `Backend` ligados (ou a mesma história `Fullstack`)

Mostrar a lista ao usuário e, com confirmação, criar com a skill `trello`.

## 4. Checklist

- [ ] Todas as telas com os estados pensados (ou "não se aplica")
- [ ] Mobile e tema escuro descritos
- [ ] Todos os textos visíveis escritos (ou delegados explicitamente)
- [ ] API: o que existe, o que pedir; nenhum endpoint recebe do cliente "de quem" são os dados
- [ ] Privacidade e IA tratadas; eventos sem conteúdo
- [ ] Riscos de usabilidade altos → `usability-test` antes de construir
