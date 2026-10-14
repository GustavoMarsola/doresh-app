---
name: feature-discovery
description: |
  Discovery de uma funcionalidade do Doresh antes de construí-la: enquadrar o problema (D1–D5)
  e a persona, reunir a evidência existente, listar hipóteses de risco (valor, usabilidade,
  viabilidade, negócio — incluindo custo de IA, LGPD e fidelidade bíblica), escolher o teste
  mais barato para cada uma, definir métrica de sucesso e eventos, e produzir
  docs/product/features/<slug>/brief.md para decisão do fundador. Usar quando surge uma ideia,
  um pedido de usuário ou um item do roadmap a começar.
---

# Feature discovery → `brief.md`

Objetivo: decidir **se** e **o quê** construir com o mínimo de esforço, antes de alguém abrir o
editor. Um bom brief cabe em 1–2 páginas e termina numa recomendação.

## 1. Ler

- `project/company_context.md` (personas, D1–D5, restrições, questões em aberto)
- `docs/product/` (roadmap, hipóteses, entrevistas, decisões) se existir
- `docs/product/features/` para não duplicar algo já estudado
- O que já existe no código (telas em `frontend/src/pages`, rotas em `backend/src/routes/api/v1`)

## 2. Enquadrar (perguntar ao usuário só o que falta)

| Pergunta | Exemplo |
|---|---|
| Que problema e de quem? | D1 — o pregador gasta a noite de quinta juntando referências de 4 fontes |
| Em que momento/contexto? | Computador, preparando o sermão; ou celular, revisando antes do culto |
| O que fazem hoje? | Bíblia física + app + Word + ChatGPT |
| Evidência? | Citação de entrevista, pedido de usuário, dado de uso — ou "hipótese" |
| Por que agora? | Bloqueia ativação, pedido recorrente, base para monetização |

Se não serve uma persona, não resolve D1–D5 ou não está nas prioridades do fundador: diga e
recomende "Depois" — o brief pode terminar aqui.

## 3. Hipóteses de risco

| Tipo | Pergunta | Testes baratos típicos |
|---|---|---|
| **Valor** | Vão usar? Resolve a dor? | Entrevista sobre o passado concreto ("da última vez que preparou um estudo…"); mostrar o resultado (ex.: esboço gerado) e perguntar "usaria isto no domingo?" |
| **Usabilidade** | Conseguem usar sem ajuda? | Protótipo clicável com 3–5 pessoas (`usability-test`) |
| **Viabilidade** | Dá para construir bem? | Conversa com `dev-backend-python`/`dev-frontend-react`; spike de ½ dia; custo por chamada de IA |
| **Negócio / ético** | Cabe na LGPD, na licença NVI/ARA, no custo de IA, na fidelidade bíblica? | Rever dados envolvidos; estimar custo por usuário ativo; revisar prompts/conteúdo com `talmid` |

Mais barato primeiro. Só se constrói "para ver" quando construir é o teste mais barato.

## 4. Solução mínima

Fluxo mínimo de ponta a ponta em 3–7 passos do ponto de vista do usuário, e o que fica **fora**.
Considerar sempre: persona e dispositivo, conteúdo sensível envolvido (estudos, oração, dúvidas de
fé), papel da IA (o que gera, como é identificado, como o usuário revisa), custo.

## 5. Métrica e eventos

- **Métrica de sucesso** com alvo e prazo (🧪 até haver base): ex. "≥ 40% dos usuários que criam
  um estudo com IA salvam ao menos uma edição em 7 dias"
- **Eventos** snake_case pt-BR, propriedades **sem conteúdo pessoal**: ex.
  `estudo_gerado_ia { sucesso, secoes, codigo_erro }`
- Ligar à métrica-norte quando fizer sentido (estudos por usuário ativo por semana 🧪)

## 6. Escrever `docs/product/features/<slug>/brief.md`

```markdown
# <Nome da funcionalidade>

> **Estado:** proposta · **Data:** AAAA-MM-DD · **Problema:** D<n> · **Persona:** <A–D>
> **Decisão:** ❓ (construir / testar primeiro / depois / não)

## Problema
<de quem, quando, o que fazem hoje, custo — evidência marcada [F] fato com fonte ou [H] hipótese>

## Personas e contexto de uso
## Evidência
## Hipóteses de risco
| # | Hipótese | Tipo | Risco | Teste | Sinal de validação |
## Solução mínima proposta
1. ...
**Fora de escopo:** ...
**Dados sensíveis / IA / custo:** ...
## Métrica de sucesso e eventos
## Dependências
<API, design, conteúdo (talmid), licenças>
## Recomendação
<uma frase + por quê + o que faria mudar a recomendação>
```

## 7. Fechamento

- Mostrar a recomendação; o fundador decide
- Aprovado: atualizar "Decisão", registrar em `docs/product/decisions/` se mudar o roadmap
  (propor, não escrever sem confirmação), passar ao `product-designer` (se há tela) e ao `product-owner`
- Testes de usabilidade necessários → `usability-test`

## Regras

- Nunca inventar citações, números ou preços de concorrentes; sem fonte → [H]
- Pessoas e igrejas anonimizadas; nenhum conteúdo de fé real de usuários
- Conteúdo bíblico/teológico do produto validado com o `talmid`
