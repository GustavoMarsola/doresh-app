# Pesquisa de mercado: features de apps de estudo bíblico e em que estágio entram no Doresh

| Campo | Valor |
|---|---|
| Data | 2026-10-23 |
| Autor | product-manager (Claude), a pedido do fundador |
| Estado | Rascunho para decisão do fundador. Não é roadmap aprovado nem spec |
| Pedido | "Pesquisa de mercado: quais as principais features e em qual estágio se encaixam (MVP, V1 ou algo mais avançado). É um app para quem ama estudar a Palavra, não só para pregadores ou ministros" |
| Complementa | `docs/product/features/planos-de-leitura/pesquisa-mercado.md` (planos de leitura e leitura em grupo, 2026-10-17). Aqui não refazemos esse trabalho: as referências a ele aparecem como **[PL n]**, onde n é o número da fonte naquele documento |

Convenção (equivalente às marcas do `company_context.md`): **[fato]** tem fonte citada · **[hipótese]** é inferência nossa, sem evidência direta · **[em aberto]** precisa de decisão ou verificação. Números entre colchetes, como [3], remetem às **Fontes** no fim.

**Sobre o público.** O Doresh é para quem estuda a Bíblia: o leigo que lê e estuda sozinho (persona D), o líder de célula ou professor de EBD (B), o estudante de teologia (C) e também quem prega (A). Preparar uma mensagem é **um** caso de uso entre vários. Por isso as features abaixo são descritas pelo que fazem pelo estudo ("organizar o que aprendi", "entender o contexto"), não pelo sermão.

---

## 1. Resumo executivo

1. **O mercado se divide em dois polos, e o meio está vazio em português.** De um lado, apps de leitura e hábito gratuitos e enormes (YouVersion, mais de 1 bilhão de instalações [PL 7]; Bíblia JFA Offline no Brasil [PL 24]). Do outro, softwares de estudo profundo, caros e em inglês (Logos, Accordance, Olive Tree) [1][4][6]. Para quem quer **estudar** em português, sem ser seminarista, há pouca coisa entre os dois [hipótese apoiada pela busca, seção 5].
2. **Ler, destacar, anotar e planos de leitura são o mínimo esperado, não diferencial.** O Doresh já tem leitura NVI/ARA, destaques e comentários; falta o básico de quem estuda: **busca no texto**, **ver e reencontrar as próprias anotações** e **levar anotações para um estudo**.
3. **IA já é comum, inclusive no Brasil** (o JFA tem chat e estudos com IA [PL 24]), mas a confiança é o problema: 83% dos cristãos praticantes nos EUA temem que a IA interprete mal a Escritura [8], e o CEO do YouVersion diz que os melhores modelos erram a citação de versículos em pelo menos 15% das vezes; por isso o YouVersion não tem chat público [9]. **IA com o texto bíblico vindo do banco e citações verificáveis** é o espaço onde o Doresh pode se destacar (D4), e o Logos mostra o modelo: respostas só a partir de fontes, com citação até a página [3].
4. **O diferencial possível do Doresh é o ciclo completo de estudo pessoal**: ler → marcar → anotar → reunir num estudo organizado → compartilhar com o grupo. Ninguém analisado em pt-BR liga as anotações do dia a dia a estudos estruturados (D1, D2, D5).
5. **Línguas originais para leigos em pt-BR é uma lacuna real, mas cara.** O que existe é em inglês, com glosas em inglês, ou exige comprar léxicos [12][13]. Fica para depois, com um teste barato antes.
6. **O MVP ainda não está fechado por três motivos que não são features:** licença NVI/ARA (Q3), política de privacidade e direitos do titular na LGPD (Q6; hoje não há exclusão nem exportação de conta) e **recuperação de senha** (não existe rota).
7. **Recomendação:** fechar o MVP com o ciclo "ler → anotar → reencontrar → estudar" e os requisitos de confiança. A V1 traz o hábito (planos, lembretes), o Ruach com fidelidade comprovada e o compartilhamento com o grupo. Originais, áudio, offline completo, comunidade e igrejas ficam para depois.

---

## 2. Panorama dos concorrentes

Pesquisa feita em 2026-10-23 (busca na web e páginas oficiais quando acessíveis). Preços **variam por país e loja**; quando só achamos agregadores, isso está dito. Concorrentes já detalhados na pesquisa de planos (YouVersion, Hallow, Glorify, Dwell, She Reads Truth, Bíblia JFA, Bíblia Sagrada, Plano Bíblico Personalizado, WhatsApp) aparecem aqui só com o essencial.

| Produto | Público principal | Features-chave | Modelo / preço | Pontos fortes | Lacunas para o nosso público |
|---|---|---|---|---|---|
| **YouVersion** [PL 1–14][9][10] | Todo cristão; leitura diária | Leitura em centenas de versões (NVI e ARA incluídas), planos, Plano com Amigos, versículo do dia, áudio, "Guided Scripture" com sequência [10] | Gratuito (ministério Life.Church) | Escala, catálogo, grátis, hub no Brasil | Pouco para **estudo**: sem estudos estruturados, sem originais; **não oferece IA que responda** sobre a Escritura por preocupação com precisão [9] |
| **Logos (Faithlife)** [1][2][3][11] | Pastores, seminaristas, estudantes sérios | Biblioteca enorme, originais, Factbook, Smart Search, **Study Assistant** (IA que responde só a partir da biblioteca do usuário, com citação até a página, sem web, recusa escrever sermão ou trabalho) [3] | Assinaturas Premium/Pro/Max (preços de agregadores divergem: a partir de US$ 9,99/mês [1][2]) + compra de livros; versão gratuita existe [11] | Profundidade, IA ancorada em fontes | Caro, curva de aprendizado alta, acervo em pt-BR limitado (usuários reclamam de falta de comentários e obras exegéticas) [11] |
| **Accordance** [4] | Estudo acadêmico, originais | Textos com morfologia, coleções | App gratuito + compras de US$ 14,99 a 69,99 por texto (App Store, mai/2026) [4]; coleções antigas até US$ 1.999 [4] | Rigor nos originais | Inglês, caro, nicho acadêmico |
| **Olive Tree** [6][PL 21] | Leigo avançado, estudante | Leitura, notas, destaques, sincronização gratuita, tela dividida com recursos, Bíblias de estudo pagas | App grátis; Bíblias de estudo avulsas (cerca de US$ 30–60) e pacotes de assinatura (US$ 5,99/mês na listagem da loja, sem data) [6] | Bom meio-termo leitura + estudo | Sem pt-BR, custo sobe rápido |
| **Blue Letter Bible** [5] | Leigo que quer ir ao original | Interlinear, léxicos, números de Strong, comentários, gratuito [5] | Gratuito (ministério) | Originais acessíveis e grátis | Inglês; interface densa |
| **STEP Bible (Tyndale House)** [7] | Estudo de originais para todos | Vocabulário original ao passar o mouse, todas as ocorrências da palavra; tem NVI em português na lista de Bíblias [7] | Gratuito | Rigor acadêmico grátis | Interface pouco amigável; interlinear não confirmado para português [7] |
| **BibleProject** [PL 16][14] | Leigo, jovens, grupos | Vídeos, podcast, aulas, planos; parceiro da YouVersion Platform [14] | Gratuito, por doações | Didática excelente | Conteúdo fixo; não é ferramenta de anotação ou estudo pessoal |
| **Bible Gateway** [15] | Leitura e consulta | 50+ versões, comparação, Plus com comentários e dicionários sem anúncios | Grátis com anúncios; **Plus R$ 24,90/mês ou R$ 249,90/ano** na App Store BR [15] | Busca e comparação de versões | Pouca organização pessoal; pt-BR limitado [hipótese] |
| **AndBible** [16] | Estudante no Android | Offline, Strong, comparação, 1.500+ documentos, **assistente de IA opcional com a chave do próprio usuário** [16] | Gratuito, código aberto (GPL) | Offline + originais grátis | Só Android; visual técnico |
| **Apps de chat bíblico com IA** (Faith Assistant/Gloo, Bible Chat, bible.ai, FaithTime) [17][18] | Público amplo, conselho espiritual | Chat sobre a Bíblia, oração, "coaching" | Freemium (Gloo+) [17] | Conversacional, fácil | Fidelidade sem garantia [9][19]; pouco estudo estruturado |
| **Bíblia JFA Offline** [PL 24][20] | Leitor brasileiro amplo | ARA, NVI, offline, cores, notas, planos, quiz, **chat e estudos com IA por versículo** [20] | Anúncios; sem anúncios R$ 24,90; Premium R$ 14,99/mês ou R$ 79,99/ano [PL 24] | 4,9 estrelas, ~384 mil avaliações [PL 24]; já tem IA em pt-BR | Sem grupos; sem organização de estudos; IA sem transparência de fontes documentada [hipótese] |
| **Outros BR com IA** (Bíblia Inteligente, Minha Bíblia, Focus Bible) [21] | Leigo, pastor | Resumos de capítulo, busca "inteligente", rascunho de sermão, contexto histórico, prévia de hebraico/grego [21] | Freemium | Entram rápido com IA | Pequenos, verificação fraca, foco em pregação em alguns |
| **Lições Bíblicas Mestre (CPAD)** [22] | Professor de EBD | Revista digital trimestral, links para as referências, glossário de 3.000 palavras, subsídios [22] | Duas lições grátis; edição paga ou assinatura da revista | Conteúdo oficial da EBD | Conteúdo fechado; sem anotação pessoal; nota 3,8 (13 avaliações) [22] |
| **Apps de memorização** (Bible Memory App, Memorise) [23] | Quem quer decorar versículos | Repetição espaçada, apagar palavras, offline, sincronização [23] | Freemium/assinatura (uma cita o custo de licença de traduções) [23] | Mecânica clara | App separado do estudo |
| **ChatGPT e similares** | Todos | Respostas gerais | Grátis/assinatura | Já está no bolso de todos | Sem fidelidade garantida, sem guardar estudo [9][19] |

**[fato] Contexto de comportamento:** quase metade (48%) dos cristãos praticantes nos EUA diz que confiaria na IA para o crescimento espiritual, mas 83% temem que ela interprete mal a Escritura (Barna/Gloo, mai/2026, n=1.514 adultos) [8]. Não encontramos pesquisa equivalente no Brasil **[em aberto]**.

---

## 3. Mapa de features por categoria

Como ler:
- **Estágio:** MVP / V1 / Avançado (critério na seção 4). "Não fazer" quando a prática contraria as regras do Doresh.
- **Hoje no Doresh:** Existe / Parcial / Não existe, conferido no código em 2026-10-23 (`backend/src/routes`, `frontend/src/pages`, `App.tsx`).
- **Riscos:** L = licença NVI/ARA (Q3) · P = LGPD, dado sensível · C = custo de IA · F = fidelidade bíblica.

### 3.1 Leitura

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Leitor por capítulo, NVI e ARA | Ler a Bíblia capítulo a capítulo e trocar de versão | Todos | **MVP** | Existe | Base de tudo | L (exibir o texto completo exige licença) |
| Conforto de leitura | Tamanho da fonte, tema claro/escuro, "continuar de onde parei" | YouVersion, JFA, Olive Tree | **MVP** | Existe (fonte, tema e última passagem guardada) | Já feito; manter | — |
| Busca no texto bíblico | Encontrar versículos por palavra ou expressão | Todos (Bible Gateway, YouVersion, JFA, BLB) | **MVP** | Não existe (`SearchBible.tsx` usa dados fictícios e não tem rota) | Quem estuda precisa achar "onde está aquele versículo"; ausência é motivo de abandono [hipótese] | L (indexar o texto é uso do texto; entra no pedido de licença) |
| Ir direto a uma referência | Digitar "Jo 3.16" e abrir | YouVersion, Bible Gateway, Logos | **MVP** | Parcial (seletor de livro e capítulo; não há campo de referência) | Atalho básico para quem estuda e para quem acompanha na igreja ou na célula | — |
| Comparar versões lado a lado | NVI e ARA em paralelo no mesmo trecho | Bible Gateway, Olive Tree, AndBible, STEP | **V1** | Não existe (só alterna) | Aprofundar sem originais: ver como duas traduções divergem já ajuda a perceber nuances (D3) | L |
| Referências cruzadas | Versículos relacionados ao lado do texto | Logos, Olive Tree, BLB, Bible Gateway | **V1** | Não existe | "A Bíblia explica a Bíblia": a forma mais fiel de aprofundar sem conteúdo autoral. Há bases antigas de domínio público (Treasury of Scripture Knowledge, séc. XIX) **[em aberto: confirmar a base e a licença]** | F (curadoria) |
| Versículo do dia | Um versículo por dia na entrada | YouVersion, JFA | **V1** | Não existe | Barato, ajuda o hábito do leigo (D) | L (mínimo) |
| Offline | Ler sem internet | JFA, AndBible, Olive Tree, YouVersion | **V1** (só os capítulos já abertos, via PWA) · **Avançado** (Bíblia inteira baixada) | Não existe (não há manifesto nem service worker) | Muito valorizado no Brasil (o "Offline" está no nome do app mais popular [PL 24]), mas baixar o texto inteiro pesa na licença | L |
| Áudio | Ouvir o capítulo | YouVersion, Dwell, JFA | **Avançado** | Não existe | Licença de áudio separada e cara; a TTS (voz sintética) sobre texto licenciado também precisa de autorização **[em aberto]** | L, custo |
| Mais traduções (ACF, NAA, NTLH, etc.) | Ampliar versões | Todos | **Avançado** | Não existe | Cada tradução é uma negociação; resolver NVI/ARA primeiro | L |

### 3.2 Anotação

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Destaques com cores | Marcar versículos | Todos | **MVP** | Existe (referência estruturada desde `6286e4e`) | Base | P |
| Comentário no versículo | Escrever uma nota presa ao trecho | Todos | **MVP** | Existe | Base | P |
| "Minhas anotações" | Ver, filtrar (livro, cor) e buscar **todos** os meus destaques e comentários | Olive Tree, Logos, YouVersion | **MVP** | Parcial (o painel inicial mostra os destaques recentes) | É o D2: anotação que não se reencontra se perde. Sem isso, destacar vira enfeite | P |
| Marcador (favorito) | Guardar um versículo para voltar | YouVersion, JFA | **V1** | Não existe | Barato; complementa a cor | P |
| Etiquetas (tags) | Agrupar anotações por tema ("graça", "oração") | Logos, Olive Tree | **V1** | Não existe | Permite estudo temático com as próprias notas; valor a validar | P |
| Compartilhar versículo como imagem/texto | Card para WhatsApp/Instagram | YouVersion, JFA | **V1** | Parcial (copiar seleção existe) | Canal de aquisição gratuito, mas só depois de Q3 | L (citação pública) |

### 3.3 Estudo e aprofundamento

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Estudos estruturados | Documento com título, introdução, seções, conclusão e referências | Logos (com outro formato), apps de sermão; raro em apps de leitura | **MVP** | Existe (editor, visualização, biblioteca com busca) | Coração do Doresh e o que o separa dos apps de leitura | P |
| Exportar estudo em PDF | Levar o estudo para imprimir ou enviar | Logos, apps de sermão | **MVP** | Existe | D5 | L (citações longas no PDF) |
| Levar anotações para um estudo | No estudo, buscar e inserir meus destaques e comentários de um livro, tema ou período | Logos (indiretamente); **não encontrado em pt-BR** | **MVP** | Não existe | É o elo que fecha o ciclo e resolve D1 e D2 juntos. Ficou viável com as referências estruturadas (`6286e4e`) | P |
| Modelos de estudo | Começar de um roteiro: estudo indutivo (observar, interpretar, aplicar), estudo de livro, de personagem, de tema, estudo para célula/EBD, esboço de mensagem | Logos (Sermon Builder e guias), revistas de EBD | **V1** | Não existe (estrutura única) | Deixa claro que o Doresh não é só para quem prega; reduz a página em branco. Conteúdo dos roteiros revisado pelo `talmid` | F |
| Introdução ao livro | Autor, data, destinatários, propósito, estrutura | Bíblias de estudo, Logos, BibleProject (vídeos) | **V1** | Não existe | Contexto é o D3 mais pedido [hipótese]; 66 textos curtos, escritos uma vez e revisados, custo fixo | F (posições sobre autoria e data variam entre tradições: apresentar com equilíbrio) |
| Dicionário bíblico, mapas, linha do tempo | Consulta de pessoas, lugares, datas | Logos, Olive Tree, Bible Gateway Plus | **Avançado** | Não existe | Exige licença de conteúdo ou produção editorial grande | L (do conteúdo), F |
| Comentários bíblicos de terceiros | Comentário versículo a versículo | Logos, Olive Tree, BLB, Bible Gateway Plus | **Avançado** | Não existe | Em pt-BR quase tudo tem direitos autorais; domínio público disponível é sobretudo em inglês | L, F |
| Plano de estudo de um livro | Roteiro para estudar um livro em N encontros | Revistas de EBD, BibleProject (guias) | **Avançado** | Não existe | Bom para B e C, mas depende de modelos e introduções prontos | F |

### 3.4 IA (Ruach)

Princípio para tudo nesta seção: **o texto bíblico nunca vem do modelo; vem do banco.** O modelo indica referências, o sistema busca o texto na versão escolhida e mostra. Isso ataca o erro de citação relatado pelo YouVersion [9] e é o que o Logos faz com a biblioteca [3].

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Perguntar sobre o trecho | No leitor, "Perguntar ao Ruach" sobre os versículos selecionados, com resposta que cita referências clicáveis | JFA (por versículo), Logos (Study Assistant), apps de chat | **V1**, com porta de qualidade | Parcial (tela, assistente flutuante e botão no leitor prontos; desligado por feature flag; passa pelo n8n) | Diferencial para D4 **se** for melhor que o ChatGPT em fidelidade. Ligar só depois de uma avaliação com o `talmid` (conjunto fixo de perguntas, taxa de citações corretas) e com aviso de privacidade (Q6) | C, F, P |
| Rascunho de estudo assistido | A IA propõe estrutura, perguntas e referências; a pessoa escreve e decide. Marcado "Gerado com IA" | JFA, Bíblia Inteligente, Logos (Pro) | **V1** | Parcial (campo `ai_generated` e selo existem; não há geração acessível no app) | Ajuda a sair da página em branco. Posicionar como apoio ao estudo, não como "escreve por você" (o Logos recusa escrever sermões [3]) | C, F |
| Contexto do capítulo | Resumo e contexto histórico do capítulo, gerado **uma vez por capítulo**, revisado e guardado | Bíblia Inteligente, Focus Bible [21] | **V1** | Não existe | Custo fixo (1.189 capítulos), não por usuário; pode ser revisado antes de publicar | C (único), F |
| Busca por tema | "Versículos sobre ansiedade" sem saber a palavra exata | YouVersion (não confirmado oficialmente [10]), Logos Smart Search | **V1** | Não existe | Busca semântica sobre o texto: custo de indexação é único; não gera texto, só encontra | L, C (baixo) |
| Perguntas para discussão em grupo | Perguntas sobre o trecho para a célula/EBD | Revistas de EBD; nenhum app de leitura encontrado | **Avançado** (junto com grupos) | Não existe | Ver O5 na pesquisa de planos [PL]: gerar uma vez por trecho, revisar, deixar o líder editar | C, F |
| Estudo de palavra original via IA | Explicar a palavra grega ou hebraica por trás de um termo | Focus Bible ("prévia") [21], apps de chat | **Não fazer sem base de dados** | Não existe | O modelo inventa léxico com facilidade; só fazer em cima de dados reais (seção 3.6) | F |

### 3.5 Comunidade e grupo

Detalhado em [PL], seções 5, 10 e 11. Resumo e estágio no contexto do produto inteiro:

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Compartilhar estudo por link (só leitura) | Enviar um estudo para o grupo sem PDF | Logos (Faithlife Groups) | **V1** | Não existe (só PDF) | D5 com pouco esforço; o destinatário vê sem precisar de conta | P (opt-in explícito, link revogável), L |
| Plano de leitura em grupo, conduzido pelo líder | Ver [PL] O1 | YouVersion, Hallow | **V1** | Não existe | É o primeiro dado compartilhado entre usuários (LGPD) e depende de Q3; por isso não entra no MVP do produto, embora [PL] o tenha posto no "Agora" daquela funcionalidade | P, L |
| Discussão por dia ou versículo | Comentários do grupo | YouVersion, Hallow, Logos | **Avançado** | Não existe | Depois de provar que o grupo usa o plano (teste concierge em [PL] seção 12) | P, moderação |
| Igreja como cliente | Vários grupos, painel agregado (k ≥ 5) | YouVersion (grátis), Hallow (pago), Planning Center | **Avançado** | Não existe | Candidato a modelo de receita (Q2) | P |
| Feed social público | Atividade religiosa visível a outros | YouVersion | **Não fazer** | — | Conflito com LGPD (dado sensível) [PL 5][PL 39] | P |

### 3.6 Conteúdo e línguas originais

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Palavra original ao tocar (Strong) | Tocar numa palavra e ver o termo grego/hebraico, significado e ocorrências | BLB, STEP, AndBible, Logos, Olive Tree | **Avançado**, com teste na V1 | Não existe | Lacuna clara em pt-BR: o que existe é em inglês ou exige comprar léxico e Bíblia com Strong [12][13]. Mas alinhar o original com NVI/ARA exige Bíblia com números de Strong (a ARA com Strong é da SBB [12]) ou um trabalho de dados grande. Teste barato na V1: protótipo com 3 passagens e 5 pessoas das personas C e D | L, F |
| Interlinear | Original com tradução palavra por palavra | BLB, STEP, Accordance | **Avançado** | Não existe | Dados abertos existem, mas com glosas em inglês **[em aberto: licença dos dados do STEPBible]**; traduzir glosas é trabalho editorial | L, F |
| Conteúdo devocional próprio | Textos diários escritos pelo Doresh | YouVersion (parceiros), Glorify, Hallow | **Não priorizar** | Não existe | Custo editorial e risco teológico; YouVersion e outros são imbatíveis e grátis [PL seção 10] | F |

### 3.7 Hábito e engajamento

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Planos de leitura individuais (só referências) | Catálogo curto de planos clássicos | Todos | **V1** | Não existe | Mínimo esperado para o leigo [PL resumo]; não é diferencial. Entra logo depois do MVP porque o MVP precisa primeiro provar o ciclo de estudo | F (divisões revisadas pelo `talmid`) |
| Progresso de leitura | Capítulos lidos, quanto da Bíblia já li | YouVersion, Olive Tree | **V1** | Não existe | Barato e motivador sem culpa | P |
| Lembretes | E-mail ou web push no horário escolhido | YouVersion, Hallow, JFA | **V1** | Não existe | Sem lembrete, o hábito depende de outro app [PL 4.2] | — |
| Memorização | Repetição espaçada, apagar palavras | Bible Memory App, Memorise [23] | **Avançado** | Não existe | Há apps dedicados; sem evidência de que nossas personas pedem isso dentro do app de estudo. Teste barato: "marcar para memorizar" num destaque | L |
| Sequências, medalhas, árvore que murcha | Gamificação por punição | YouVersion, Glorify | **Não fazer** | — | Culpa e manipulação, contra as regras do Doresh [PL 9] | — |

### 3.8 Organização

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Biblioteca de estudos com busca | Listar, buscar, ordenar estudos | Logos, apps de sermão | **MVP** | Existe | Base | P |
| Pastas ou coleções | Agrupar estudos (série da EBD, livro de Romanos, "pessoal") | Logos, Olive Tree | **V1** | Não existe | Quem estuda há meses precisa disso; não quem começa | P |
| Busca única | Buscar ao mesmo tempo em estudos, comentários e destaques | Logos, Olive Tree | **V1** | Não existe | Evolução natural de "Minhas anotações" | P |
| Duplicar estudo | Reaproveitar um estudo como base | Apps de sermão | **V1** | Não existe | Barato; útil para líderes que repetem temas | — |

### 3.9 Plataforma, conta e confiança

| Feature | O que é | Quem oferece | Estágio | Hoje | Justificativa | Riscos |
|---|---|---|---|---|---|---|
| Web responsiva com sincronização | Usar no computador e no celular com os mesmos dados | Todos os grandes | **MVP** | Existe | Base | — |
| Cadastro, verificação de e-mail, login | Conta | Todos | **MVP** | Existe | Base | P |
| Recuperar senha | "Esqueci minha senha" | Todos | **MVP** | **Não existe** (não há rota nem tela) | Sem isso, quem esquece a senha perde o acesso ao que estudou | P |
| Excluir conta e exportar meus dados | Direitos do titular | Exigência legal | **MVP** | Não existe | LGPD art. 18 (eliminação e portabilidade) [24]; com dado sensível, não dá para lançar sem | P |
| Política de privacidade, termos, consentimento para dados sensíveis e para a OpenAI | Textos e aceite | Todos | **MVP** | Não existe (Q6) | Obrigatório antes de usuários reais | P |
| Aviso de direitos autorais das traduções | "NVI © Biblica…", "ARA © SBB" | Todos os licenciados | **MVP** | Não existe [PL seção 13] | Parte do Q3 | L |
| Instalar no celular (PWA) | Ícone na tela inicial, abre como app | Comum em apps web | **V1** | Parcial (há meta tags no `index.html`, sem manifesto) | Persona D vive no celular; barato antes de pensar em app nativo | — |
| Login com Google | Entrar sem senha nova | Comum | **V1** | Não existe | Reduz atrito de cadastro, principalmente de quem chega por convite do grupo | P |
| Apps nativos (iOS/Android) | Loja | Todos os grandes | **Avançado** | Não existe | Só com tração; PWA cobre o começo | — |
| Limites de uso de IA por usuário | Cota diária/mensal | Logos (por plano), JFA (Premium) | **V1** (junto com o Ruach) | Não existe | Sem cota, o custo da OpenAI não tem teto | C |

---

## 4. Critério usado para classificar os estágios

Uma feature entra no estágio mais cedo cujas condições ela cumpre **todas**.

**MVP — "uma pessoa estuda de verdade no Doresh, com segurança"**
1. Faz parte do ciclo central **ler → marcar/anotar → reencontrar → organizar num estudo**, para pelo menos as personas D e B; **ou**
2. É requisito de confiança sem o qual não se pode pôr usuários reais (LGPD, licença, recuperar acesso); **ou**
3. É algo cuja **ausência faz o usuário desistir** num primeiro uso de estudo (busca no texto, reencontrar anotações).
4. E: custo variável perto de zero (sem IA obrigatória), sem dado compartilhado entre usuários, sem conteúdo autoral novo que precise de revisão teológica.

**V1 — "a pessoa volta toda semana, e o Doresh faz algo que os outros não fazem"**
1. Cria hábito (planos, lembretes, progresso) **ou** aprofunda o estudo (contexto, comparação, referências cruzadas) **ou** é o diferencial que já temos meio pronto (Ruach com fidelidade, compartilhar com o grupo);
2. Depende de o MVP estar validado com usuários convidados;
3. Custo de IA previsível (cache por passagem ou cota por usuário) e risco de fidelidade controlável com revisão do `talmid`;
4. Pode exigir uma decisão do fundador já tomada (Q3 para compartilhamento; Q6 para IA e grupos).

**Avançado — "o Doresh vira referência"**
1. Exige licença de conteúdo além de NVI/ARA (áudio, comentários, dicionários, mais traduções) **ou** trabalho editorial/de dados grande (originais, interlinear);
2. **ou** é para um nicho menor (persona C profunda) ou exige escala (comunidade, igrejas, apps nativos);
3. **ou** há concorrentes dedicados muito melhores e sem evidência de demanda nossa (memorização, devocional próprio).

**Não fazer:** contraria as regras do Doresh (manipulação, exposição de dado sensível) independentemente do estágio.

Observação: a classificação usa as personas e problemas **ainda em hipótese** (Q1 em aberto). Se as entrevistas mostrarem que a persona prioritária é C (estudante de teologia), originais e comparação de versões sobem; se for B (líder), compartilhar com o grupo e modelos de estudo sobem.

---

## 5. Lacunas de mercado e oportunidades de diferenciação

| # | Oportunidade | Evidência da lacuna | Persona / problema |
|---|---|---|---|
| **G1** | **Do destaque ao estudo:** anotações que viram estudo organizado, com as referências e o texto vindo da Bíblia, sem copiar e colar | Apps de leitura guardam destaques soltos (YouVersion, JFA); quem organiza estudos (Logos) é caro e em inglês [1][11]; nada equivalente encontrado em pt-BR | D, B, C · D1, D2 |
| **G2** | **IA que mostra de onde tirou:** Ruach que cita referências verificáveis, com o texto vindo do banco, responde só sobre o trecho e diz quando há posições diferentes entre tradições | YouVersion evita IA por erro de citação [9]; 83% temem má interpretação [8]; o Logos prova que IA ancorada em fontes é vendável [3]; o JFA tem IA em pt-BR sem transparência de fontes documentada [20] | Todas · D4 |
| **G3** | **Estudo para quem não é seminarista, em português:** modelos de estudo (indutivo, de livro, de personagem, para célula), introduções aos livros e referências cruzadas, sem a complexidade do Logos | Meio do mercado vazio em pt-BR (seção 2); acervo pt-BR do Logos criticado [11]; revistas de EBD são conteúdo fechado [22] | D, B · D1, D3 |
| **G4** | **Do estudo pessoal ao grupo, sem retrabalho:** compartilhar o estudo por link e conduzir a leitura da célula/EBD, com o pessoal privado por padrão | Detalhado em [PL] O1, O2, O4; ninguém liga o estudo do líder à leitura do grupo | B · D5 |
| **G5** | **Originais acessíveis em português (depois):** palavra original com significado em pt-BR ao tocar | Ferramentas boas são em inglês ou exigem compra [5][7][12][13] | C, D · D3 |

O que **não** recomendamos como diferencial: tamanho do catálogo de planos, conteúdo devocional próprio, áudio, gamificação, chat "conselheiro espiritual" genérico. Nessas frentes YouVersion, Hallow, Dwell e os apps de chat são grátis, maiores ou ambos.

---

## 6. Recomendação

### Fecha o MVP (o que falta, em ordem)

Resultado: **uma pessoa convidada lê, marca, reencontra o que marcou e organiza um estudo, com os dados protegidos.**

1. **Requisitos de confiança:** recuperar senha; excluir conta e exportar dados; política de privacidade e termos (Q6); aviso de direitos autorais; **pedido formal de licença à Biblica (NVI) e à SBB (ARA)** (Q3). Sem isso, nenhum usuário real.
2. **Busca no texto bíblico** e **ir direto a uma referência**.
3. **"Minhas anotações":** todos os destaques e comentários, filtráveis por livro e cor, com busca.
4. **Levar anotações para um estudo** (G1): o diferencial mais barato que temos, agora possível com as referências estruturadas.
5. Revisar textos da interface para o público amplo: "estudo" como termo central e "mensagem/esboço" como um tipo de estudo, não o padrão (regra do público; a tela `CreateSermon.tsx` ainda existe no código, sem rota).

Fica **fora** do MVP de propósito: Ruach (ligar só com a porta de qualidade da V1), planos, grupos, offline.

Métricas sugeridas (para aprovar): % de novos usuários que criam o primeiro destaque e o primeiro estudo na semana 1; estudos criados ou atualizados por usuário ativo por semana (métrica-norte proposta [hipótese]); retenção semana 4. Eventos sem conteúdo: `busca_biblia_realizada` {tem_resultado}, `anotacoes_filtradas` {filtro}, `anotacao_inserida_em_estudo` {tipo: destaque|comentario}, `conta_excluida`, `dados_exportados`.

### V1

Resultado: **a pessoa volta toda semana e confia no Ruach.**
- **Hábito:** planos individuais (catálogo curto), progresso de leitura, lembretes, versículo do dia, PWA instalável.
- **Aprofundar sem IA:** comparar NVI e ARA lado a lado, referências cruzadas, introdução aos livros, modelos de estudo.
- **Ruach (G2):** perguntar sobre o trecho, contexto do capítulo em cache, rascunho de estudo assistido, busca por tema, com cotas por usuário. **Porta:** avaliação de fidelidade com o `talmid` antes de ligar para todos.
- **Grupo (G4):** compartilhar estudo por link; plano de leitura conduzido pelo líder (escopo de [PL] seção 11 "Agora"), depois de Q3 e Q6.
- Organização: pastas, etiquetas, marcadores, busca única, duplicar estudo; login com Google.

### Avançado (depois)

Originais (Strong e interlinear em pt-BR, G5), offline completo, áudio, mais traduções, dicionário/mapas/linha do tempo, comentários licenciados, discussão em grupo, igreja como cliente (candidato a Q2), apps nativos, memorização.

### O que faria mudar esta recomendação

- **Q3 negada ou cara:** reavaliar fonte de texto (YouVersion Platform, que proíbe monetização [PL 9], ou traduções de domínio público) antes de qualquer feature nova.
- **Entrevistas (Q1)** mostrarem que a persona prioritária é C: comparação de versões e originais sobem; se for B, compartilhar e grupos sobem para o MVP.
- **Teste de usabilidade** mostrar que "levar anotações para um estudo" não é entendido ou não é usado: rebaixar G1 e investir em modelos de estudo.

### Próximos passos sugeridos

1. Fundador: decidir Q3 (pedir os termos) e Q6 (privacidade), e aprovar ou ajustar os estágios.
2. PM: `feature-discovery` para "Minhas anotações + levar anotações para um estudo" (G1).
3. PM: roteiro de entrevistas com as quatro personas, começando por D e B, para validar D1–D3 e a ordem da V1.
4. `talmid` + PM: desenhar a avaliação de fidelidade do Ruach (perguntas, critério de aprovação) antes de religar a feature flag.
5. `product-designer`: protótipo de G1 para teste com 5 pessoas.

---

## 7. Fontes

Acessadas em 2026-10-23, salvo indicação. Quando a fonte é agregadora ou de terceiros, isso está dito; preços de agregadores divergem entre si e devem ser confirmados nos sites oficiais antes de qualquer uso público.

**[PL n]** = fonte n de `docs/product/features/planos-de-leitura/pesquisa-mercado.md` (YouVersion, Hallow, Glorify, Dwell, She Reads Truth, Bíblia JFA Offline, Bíblia Sagrada, Plano Bíblico Personalizado, Planning Center, WhatsApp, LGPD, licença NVI/ARA).

1. Capterra, Logos Bible Software (preços e planos, agregador): https://www.capterra.com/p/275095/Logos/ ; Logos Community, "Logos Launch - What's included in the new subscriptions?": https://community.logos.com/forums/t/226128.aspx
2. The Lead Pastor, revisão do Logos (terceiros): https://theleadpastor.com/tools/logos-bible-software-review/ ; TodayTesting, revisão 2026 (terceiros): https://todaytesting.com/logos-review/
3. Logos, "What's New in Logos? November 2025" (Study Assistant): https://www.logos.com/grow/release-november-2025/ ; Logos release notes: https://logos.com/release-notes ; Reading Acts, "First Look: Logos 46 and Study Assistant" (06/11/2025): https://readingacts.com/2025/11/06/first-look-logos-46-and-study-assistant/ ; Exegesis and Theology, "Thoughts on the Study Assistant in Logos 46": https://exegesisandtheology.com/2025/11/06/thoughts-on-the-study-assistant-in-logos-46/ ; podcast "AI with guardrails: Scott Lindsey on Logos": https://www.godtube.com/podcasts/thinking-christian-clear-theology-for-a-confusing-world/ai-with-guardrails-scott-lindsey-on-logos-and-the-future-of-bible-study/
4. App Pricing Lab, compras no app do Accordance (iOS, mai/2026): https://apppricinglab.com/iap/apple/411970514 ; The Gospel Coalition, revisão do Accordance 10 (antiga): https://www.thegospelcoalition.org/themelios/review/accordance-10-ultimate-collection/
5. Blue Letter Bible: https://blueletterbible.org/ ; Bible in Year, "Blue Letter Bible App Review 2026" (terceiros): https://bibleinyear.com/blog/blue-letter-bible-app
6. Bible in Year, "Olive Tree Bible App Review 2026" (terceiros): https://bibleinyear.com/blog/olive-tree-bible-app ; Learn of Christ, revisão do Olive Tree (terceiros): https://learnofchrist.com/resources/olive-tree ; listagem da loja (espelho AppFollow, sem data): https://apps.appfollow.io/ios/bible-app-read-study-daily/332615624?country=kr
7. STEP Bible, "About STEP Bible": https://stepweb.atlassian.net/wiki/spaces/SUG/pages/12484610/About+STEP+Bible ; "Resources": https://stepweb.atlassian.net/wiki/spaces/SUG/pages/9797657/Resources ; "Biblica Bibles in Majority Languages" (2021, NVI pt-BR): https://stepweb.atlassian.net/wiki/spaces/SUG/blog/2021/01/01/1204191237/Biblica+Bibles+in+Majority+Languages ; EFCA, "Tyndale House and the STEP Bible": https://blogs.efca.org/posts/tyndale-house-and-the-step-bible-online-and-free-resource
8. Barna Group, "Christians, trust, AI, flourishing and spiritual authority" (19/05/2026; n=1.514 adultos EUA, nov/2025; n=442 pastores, dez/2025): https://www.barna.com/research/christians-trust-ai-flourishing-spiritual-authority/
9. The Christian Post / Christian Daily International, "AI's Bible misquotes range from 15% to 60%, YouVersion CEO says" (17/03/2026): https://www.christianpost.com/news/ais-bible-misquotes-range-from-15-to-60-youversion-ceo.html (afirmação do CEO; metodologia não publicada)
10. YouVersion, "Guided Scripture": https://www.bible.com/refresh ; TechEconomy (ago/2026, afirma busca por situação de vida com IA; **não confirmado** por fonte oficial): https://techeconomy.ng/10-must-have-apps-for-every-christian
11. Capterra Brasil, Logos (avaliações de usuários brasileiros, acervo em português): https://www.capterra.com.br/reviews/131777/logos ; Capterra Portugal: https://www.capterra.pt/software/131777/logos
12. Logos, "Léxico Hebraico, Aramaico e Grego de Strong" (SBB, 2002): https://www.logos.com/product/62317/lexico-hebraico-aramaico-e-grego-de-strong
13. BibliaTodo, interlinear (glosas em inglês): https://www.bibliatodo.com/pt/interlinear/online ; Bíblia Strong (Português), vitrine MuMuPlayer: https://www.mumuplayer.com/pt/apps/b-blia-strong-on-pc.html
14. faith.tools, BibleProject: https://faith.tools/app/49-bibleproject ; Learn of Christ, revisão do app BibleProject: https://learnofchrist.com/resources/bibleproject-app
15. App Store BR, Bible Gateway (preços do Plus em R$): https://apps.apple.com/BR/app/id506512797
16. F-Droid, AndBible: https://f-droid.org/pt_BR/packages/net.bible.android.activity
17. The Christian Post, Gloo adquire o Bible Chat (Faith Assistant): https://christianpost.com/news/christian-tech-company-acquires-ai-chatbot-bible-chat.html ; Gloo AI Chat: https://gloo.com/chat
18. App Store, Bible Chat (Mind Blown Apps): https://apps.apple.com/us/app/-/id6737005701 ; FaithTime, comunicado (30/01/2026): https://www.latrobebulletinnews.com/online_features/press_releases/faithtime-introduces-bible-ai-chat-to-support-scripture-understanding-and-daily-prayer/article_a0da5e4c-7c39-5052-84fb-55f3d1fd7cff.html ; UCA, bible.ai: https://insights1.uca.org.au/articles/bibleai-launches-world-first-christian-app-powered-by-ai-technology/
19. Learn of Christ, revisão do FaithGPT (risco de alucinação): https://learnofchrist.com/resources/faithgpt
20. App Store BR, Bíblia JFA Offline (IA, offline): https://apps.apple.com/BR/app/id478686126
21. App Store, Bíblia Inteligente: https://apps.apple.com/us/app/-/id6754614255 ; Minha Bíblia (mwm.ai): https://mwm.ai/pt/apps/minha-bblia/6785752012 ; Focus Bible (mwm.ai): https://mwm.ai/pt/apps/focus-bible-go-deeper/6760662988
22. App Store, Lições Bíblicas Mestre Adulto (CPAD): https://apps.apple.com/us/app/id780116812
23. App Store, The Bible Memory App: https://apps.apple.com/app/id496790833 ; Memorise: https://apps.apple.com/app/id6755938346 ; Bible Memory App: https://apps.apple.com/app/id6737760910
24. Lei 13.709/2018 (LGPD), arts. 5º, II; 11; 18: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

**Limites desta pesquisa:** não houve entrevistas nem dados de uso do Doresh; a página oficial de preços do Logos retornou 404 e usamos agregadores; não verificamos reviews em volume nas lojas; "Bíblia Sagrada" e apps da SBB não foram reavaliados além de [PL] (nenhum app oficial de estudo da SBB foi encontrado na busca).
