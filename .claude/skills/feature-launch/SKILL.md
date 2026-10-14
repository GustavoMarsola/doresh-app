---
name: feature-launch
description: |
  Planejar e executar o lançamento de uma funcionalidade do Doresh: critérios de prontidão
  (go/no-go), rollout (equipe → grupo de usuários convidados → todos), comunicação (novidade na
  app, e-mail, redes, YouTube), notas de versão em pt-BR, verificação de eventos, custo de IA,
  plano de reversão e revisão pós-lançamento aos 7 e 21 dias. Gera
  docs/product/launches/AAAA-MM-DD-<slug>.md. Usar quando uma funcionalidade está pronta (ou
  quase) para chegar aos usuários.
---

# Lançar uma funcionalidade

Lançar ≠ fazer deploy. Só está lançada quando as pessoas certas sabem que existe, conseguem usá-la
e conseguimos medir se resolveu o problema.

## 1. Prontidão (go / no-go)

- [ ] Critérios de aceitação verificados pelo `product-owner` (desktop + 360 px, claro + escuro, duas contas)
- [ ] `frontend-design-review` sem Críticos/Altos; teste de usabilidade sem Críticos pendentes
- [ ] Testes de isolamento entre usuários verdes (`dev-qa`); sair/entrar com outra conta não deixa dados
- [ ] Eventos chegando (conta de teste), sem conteúdo pessoal
- [ ] IA: limites por usuário ativos, custo estimado por usuário ativo aceito pelo fundador, erros com mensagem clara
- [ ] Conteúdo bíblico/teológico revisado (`talmid`); conteúdo de IA identificado
- [ ] Textos revisados (pt-BR, tom da marca)
- [ ] Política de privacidade cobre o que a funcionalidade faz (ex.: envio à OpenAI) ❓ Q6
- [ ] Plano de reversão definido

Qualquer "não" → no-go, com o que falta e quem resolve.

## 2. Rollout

Não há feature flags hoje. Opções, da mais simples:

| Opção | Quando |
|---|---|
| Lançar para todos | Baixo risco, baixo custo de IA |
| Rota/entrada escondida + convite a um grupo (líderes, pastores parceiros) | Validar com pessoas reais antes de anunciar |
| Feature flag por usuário (backend: tabela/setting) | Funcionalidade cara ou arriscada; pedir ao `dev-backend-python` — configuração, nunca `if user == ...` |

## 3. Comunicação

| Peça | Para quem | Notas |
|---|---|---|
| **Notas de versão** (`docs/product/release-notes/AAAA-MM-DD.md`) | Usuários | Benefício primeiro, linguagem simples, sem detalhes técnicos |
| **Novidade na app** | Usuários com acesso | Curta (título + 1 frase + "Ver"), dispensável, uma vez por usuário; só se o componente existir |
| **E-mail** | Usuários ativos | Só com base legal/consentimento; descadastro fácil |
| **Redes / YouTube "Doresh"** | Público | Com o `marketing-seo`; capturas só com dados fictícios |
| **Ajuda contextual** | Na tela | Estado vazio que ensina; dica junto a recursos de IA |

Modelo de notas de versão:

```markdown
# Novidades — <dia> de <mês> de <ano>

## <Benefício na linguagem do usuário>
<1–3 frases: o que passa a conseguir fazer e onde. Ex.: "Agora você pode pedir ao Ruach um esboço
a partir de um texto bíblico e editá-lo como um estudo seu.">

## Melhorias
- ...

## Correções
- ...
```

## 4. Documento de lançamento — `docs/product/launches/AAAA-MM-DD-<slug>.md`

```markdown
# Lançamento: <funcionalidade>

**Brief/Spec:** ../features/<slug>/ · **Responsável:** <...> · **Estado:** planejado | em andamento | concluído

## Prontidão
## Rollout
| Fase | Quem | Início | Fim | Notas |
## Comunicação
## Métrica de sucesso
## Custo de IA (estimado vs. real)
## Reversão
## Revisão pós-lançamento
### Dia 7
### Dia 21
```

## 5. Revisão pós-lançamento (dias 7 e 21)

- **Adoção**: usuários que usaram vs. com acesso (eventos)
- **Resultado**: métrica de sucesso vs. alvo
- **Custo**: tokens/chamadas de IA por usuário ativo
- **Qualidade**: bugs, onde as pessoas se perdem
- **Voz do usuário**: 2–3 conversas curtas (com consentimento, anonimizadas)
- **Decisão**: manter · iterar · rever o problema (`feature-discovery`) · retirar

## Regras

- Nunca anunciar o que não está lançado
- Capturas e vídeos só com dados fictícios
- Publicar, enviar e-mails e mudar flags em produção é **ação externa**: confirmar com o usuário
