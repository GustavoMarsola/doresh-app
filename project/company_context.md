# Doresh — Contexto do produto

> Fonte de verdade de produto para todos os agentes (`product-manager`, `product-owner`,
> `product-designer`, `marketing-seo`, `dev-*`). Marcas: ✅ fato (com fonte) · 🧪 hipótese ·
> ❓ em aberto. Nunca apresente uma hipótese como fato. Quem muda um fato atualiza o
> **Histórico** no fim do arquivo.

---

## 1. O que é

✅ **Doresh** (hebraico *דּוֹרֵשׁ*, "aquele que busca, que estuda, que interpreta") é uma
plataforma cristã de estudo bíblico (README).

✅ O que a aplicação faz hoje (código em `backend/src` e `frontend/src`, 2026-10-14):

| Área | Funcionalidade | Estado |
|---|---|---|
| Bíblia | Ler capítulo a capítulo nas versões **NVI** e **ARA** (66 livros cada, JSON local) | Backend + frontend |
| Bíblia | Destacar versículos com cores e comentar trechos | Backend (`POST /bible/highlight`, `/bible/comment`) |
| Estudos | Criar estudos/sermões com introdução, seções, conclusão e referências; geração por IA | Backend (`/study`, `/studies`) + telas `CreateSermon`, `Library` |
| Ruach | Assistente de IA (OpenAI) para dúvidas bíblicas e teológicas | Tela `Ruach` + `FloatingAssistant`; parte via n8n |
| Conta | Cadastro, verificação de e-mail, login (JWT), perfil, logout | Backend + telas `Register`, `Login`, `Profile` |
| Assinaturas | Planos e pagamento via Asaas | ✅ **Removido** no commit `0d57b93` |

✅ Idioma do produto: **português do Brasil** (`<html lang="pt-BR">`, UF brasileiras em
`components/utils.ts`, histórico com Asaas/PIX/boleto).

## 2. Para quem (ICP e personas)

❓ O ICP ainda não foi definido nem validado. Hipóteses de trabalho, por ordem de interesse 🧪:

| # | Persona 🧪 | Trabalho a fazer | Momento de uso |
|---|---|---|---|
| A | **Pregador/pastor** de igreja local (muitas vezes bivocacional) | Preparar a mensagem de domingo com estrutura, referências e contexto | Durante a semana, no computador; revisão no celular |
| B | **Líder de célula / professor de EBD** | Preparar um estudo curto e fiel ao texto para o grupo | Noites da semana, celular |
| C | **Estudante de teologia / seminarista** | Aprofundar exegese, línguas originais, contexto judaico | Computador, sessões longas |
| D | **Leigo que estuda a Bíblia** sozinho | Ler, destacar, anotar e tirar dúvidas | Celular, devocional diário |

O agente `talmid` (`.claude/agents/talmid.md`) é o especialista em conteúdo bíblico e teológico:
use-o para validar fidelidade bíblica de textos, prompts do Ruach e conteúdo de marketing.

## 3. Problemas (hipóteses a validar) 🧪

| Código | Problema |
|---|---|
| D1 | Preparar um sermão/estudo leva horas espalhadas entre Bíblia física, apps, PDFs e anotações soltas |
| D2 | Anotações e destaques ficam dispersos e não se reaproveitam em estudos futuros |
| D3 | Faltam ferramentas acessíveis (em português) de contexto histórico, judaico e línguas originais |
| D4 | IA genérica responde sem fidelidade bíblica ou sem citar as Escrituras |
| D5 | Compartilhar um estudo com o grupo (PDF, WhatsApp) exige retrabalho de formatação |

## 4. Modelo de negócio

❓ **Em aberto.** As assinaturas (Asaas) foram removidas em `0d57b93`; não existe hoje cobrança,
plano nem feature flag. Qualquer proposta de monetização é do `product-manager` e precisa de
decisão do fundador. Custo variável relevante ✅: chamadas à OpenAI por mensagem do Ruach e por
estudo gerado por IA.

## 5. Metas

❓ Sem meta de negócio registrada. O `product-manager` deve propor uma métrica-norte e metas
(ex.: estudos criados por usuário ativo por semana 🧪) e registrá-las aqui depois de aprovadas.

## 6. Geografia

✅ Brasil, em pt-BR. ❓ Expansão para outros países lusófonos ou outras línguas: não decidida —
nada no código deve fechar essa porta sem necessidade, mas também não se constrói i18n antes de
haver decisão.

## 7. Restrições e cuidados

- ✅ **LGPD:** "convicção religiosa" é **dado pessoal sensível** (Lei 13.709/2018, art. 5º, II,
  e art. 11). Estudos, destaques, comentários e conversas com o Ruach ligados a um usuário são
  tratados como dados sensíveis: privados por padrão, nunca em logs, nunca em eventos de produto,
  nunca em capturas de tela públicas, nunca enviados a terceiros além do estritamente necessário
  (ex.: OpenAI para responder ao próprio usuário, com isso dito na política de privacidade)
- ❓ **Licenciamento das traduções:** NVI e ARA são traduções protegidas por direitos autorais
  (Biblica / Sociedade Bíblica do Brasil). Confirmar a licença de uso antes de qualquer
  lançamento público ou campanha de marketing
- ✅ **IA:** respostas do Ruach podem errar. Conteúdo gerado por IA é marcado como tal
  (`ai_generated` em estudos) e não substitui o texto bíblico
- Tom pastoral e respeitoso entre tradições cristãs; o produto não toma partido em questões
  denominacionais controversas sem decisão explícita do fundador

## 8. Equipe e processo

- ✅ Fundador/tecnologia: Gustavo Marsola (decide prioridades e o que vai ao ar)
- ❓ Marketing, comercial, conteúdo teológico: a definir
- ✅ Backlog no **Trello** (skill `trello`); ❓ nome e id do quadro a registrar na skill
- ✅ Agentes: `product-manager` (porquê/o quê) → `product-designer` (protótipo) →
  `product-owner` (histórias) → `dev-backend-python` / `dev-frontend-react` → `dev-qa`;
  `marketing-seo` para aquisição orgânica; `talmid` para conteúdo bíblico

## 9. Concorrência (a mapear pelo `product-manager`)

❓ Sem benchmark. Candidatos a estudar 🧪: YouVersion (Bíblia), Logos (estudo avançado),
Bíblia JFA Offline, apps de sermão com IA, ChatGPT/assistentes genéricos usados para preparar
mensagens. Citar fonte e data de tudo; não inventar preços nem funcionalidades.

✅ Benchmark de **planos de leitura e leitura em grupo** (2026-10-17):
`docs/product/features/planos-de-leitura/pesquisa-mercado.md`.

✅ Pesquisa de mercado de **features de apps de estudo bíblico** e proposta de estágios
MVP / V1 / Avançado (2026-10-23, rascunho para decisão do fundador):
`docs/product/pesquisa-mercado-features.md`.

## 10. Glossário

| Termo | Significado |
|---|---|
| Estudo | Documento do usuário com título, introdução, seções, conclusão e referências bíblicas |
| Sermão | Estudo voltado para pregação (tela `CreateSermon`) |
| Destaque | Versículo marcado com cor pelo usuário |
| Comentário | Anotação do usuário sobre um trecho bíblico |
| Ruach | Assistente de IA do Doresh (hebraico *רוּחַ*, "vento, espírito, fôlego") |
| NVI / ARA | Nova Versão Internacional / Almeida Revista e Atualizada |
| EBD | Escola Bíblica Dominical |

## 11. Questões em aberto

| # | Questão | Dono |
|---|---|---|
| Q1 | Qual o ICP prioritário (A, B, C ou D)? | product-manager + fundador |
| Q2 | Modelo de receita depois da remoção das assinaturas | product-manager + fundador |
| Q3 | Licença de uso da NVI e da ARA | fundador |
| Q4 | Domínio de produção (canonical, sitemap, e-mails) | fundador |
| Q5 | Quadro do Trello do Doresh (nome/id) | fundador |
| Q6 | Política de privacidade e termos (LGPD, uso da OpenAI) | fundador |

## Histórico

| Data | Mudança | Quem |
|---|---|---|
| 2026-10-14 | Criação a partir do README, do código e dos agentes trazidos do Impera | Claude (a pedido do fundador) |
| 2026-10-17 | Seção 9: link para a pesquisa de mercado de planos de leitura e grupos | product-manager |
| 2026-10-23 | Seção 9: link para a pesquisa de mercado de features e estágios (MVP/V1/Avançado) | product-manager |
