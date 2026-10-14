---
name: usability-test
description: |
  Planejar, conduzir e sintetizar testes de usabilidade e de conceito do Doresh com pessoas das
  personas (pregadores/pastores, líderes de célula/EBD, estudantes de teologia, leigos):
  protótipo ou tela real, recrutamento, roteiro com tarefas realistas, regras de condução,
  registro por participante e síntese com problemas por gravidade e recomendações. Gera
  docs/product/features/<slug>/tests/AAAA-MM-DD-<tipo>.md. Usar antes de construir um fluxo
  arriscado, antes de lançar e com usuários convidados.
---

# Teste de usabilidade

5 pessoas encontram a maioria dos problemas graves de um fluxo. Testar cedo (protótipo) e antes de
lançar (tela real com dados fictícios).

## 1. Tipo

| Tipo | Quando | Material |
|---|---|---|
| **Conceito** | Validar valor antes de desenhar ("usaria este esboço no domingo?") | Resultado final (esboço, PDF, captura) |
| **Protótipo** | Fluxo novo ou arriscado, antes de construir | Canvas clicável do `product-designer` (`prototype-screens`) |
| **Tela real** | Antes de lançar | Ambiente de teste, conta de teste, **dados fictícios** |
| **Contexto real** | Leitura/devocional no celular, preparo do sermão no computador | Dispositivo da pessoa, no momento em que ela costuma estudar |

## 2. Plano (antes de marcar sessões)

```markdown
# Teste <tipo>: <funcionalidade> — AAAA-MM-DD

## Objetivo
<que decisão este teste informa; hipóteses do brief (#)>

## Participantes (3–5 por persona relevante)
| # | Persona | Igreja/tradição (anonimizada) | Experiência com apps | Dispositivo |
Critérios: variedade de tradições e de idade; ao menos 1 pessoa pouco familiarizada com tecnologia.

## Material
<link do protótipo / ambiente, conta de teste, dados fictícios>

## Tarefas
| # | Cenário (contado ao participante) | Sucesso = | Tempo esperado |
|---|---|---|---|
| T1 | "Você vai pregar sobre a parábola do semeador no domingo. Prepare um esboço com o que precisar." | Esboço salvo com referências | < 10 min |

## Perguntas finais
- O que foi mais difícil? O que esperava encontrar e não encontrou?
- (IA) "Confiaria no que o Ruach respondeu? O que faria antes de usar?"
- Escala 1–5: facilidade · utilidade
```

### Regras para tarefas
- Cenários do dia a dia, com o objetivo — **nunca** com o nome do botão
- Começar pela tarefa mais importante; 3–5 tarefas, 30–40 min no total

## 3. Conduzir

- Consentimento antes de gravar; explicar que se testa o produto, não a pessoa
- Usar dados fictícios: não pedir que a pessoa registre suas orações, dúvidas de fé ou estudos
  reais na conta de teste (dado sensível)
- Pensar em voz alta; não ajudar, não explicar, não defender o produto
- Pedido de ajuda: "o que faria se eu não estivesse aqui?"
- Respeito: conversas sobre fé são pessoais; não discutir doutrina com o participante
- Registrar por tarefa: sucesso (sim / com dificuldade / não), tempo, hesitações, citações literais

## 4. Sintetizar (mesmo arquivo, "Resultados")

```markdown
## Resultados
| Tarefa | Sucesso | Com dificuldade | Falhou | Tempo médio |

## Problemas
| # | Problema | Tela | Gravidade | Participantes | Evidência | Recomendação |
```

Gravidade: **Crítico** (impede a tarefa ou leva a erro com consequência — ex.: perder um estudo) ·
**Alto** (atraso grande ou frustração; a maioria tropeça) · **Médio** (tropeçam e se recuperam) ·
**Baixo** (cosmético). Depois: padrões (≥ 2 vezes), surpresas, hipóteses validadas/invalidadas,
recomendação (avançar / corrigir e retestar / repensar).

## 5. Fechamento

- Atualizar brief (hipóteses) e spec (mudanças), referenciando o teste
- Críticos e Altos → cartões no Trello (`trello`, com confirmação) antes do lançamento
- Citações anonimizadas; nada de nomes, igrejas identificáveis ou conteúdo de fé real
