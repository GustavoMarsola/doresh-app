# Planos de leitura e leitura em grupo: pesquisa de concorrência e mercado

| Campo | Valor |
|---|---|
| Data | 2026-10-17 |
| Autor | product-manager (Claude), a pedido do fundador |
| Estado | Rascunho para decisão do fundador. Ainda não é brief nem spec |
| Pedido | "Planos clássicos (NT, AT, Bíblia em um ano...) e leitura em grupo, porque o ensino em comunidade traz avanço espiritual" |
| Ligação | D5 (compartilhar com o grupo), D2 (anotações dispersas), D3 (contexto); personas B (líder de célula/EBD) e D (leigo) |

Convenção usada neste documento (equivalente às marcas do `company_context.md`):
**[fato]** tem fonte citada · **[hipótese]** é inferência nossa, sem evidência direta · **[em aberto]** precisa de decisão ou verificação.
Os números entre colchetes, como [3], remetem à lista de **Fontes** no fim.

---

## 0. Resumo executivo

1. **Planos de leitura são o padrão do mercado, não um diferencial.** O YouVersion soma mais de 670 milhões de planos concluídos [7] e tem um hub regional no Brasil [10]. O Bíblia JFA Offline (4,9 estrelas, cerca de 384 mil avaliações na App Store BR) já oferece planos, ARA, NVI e até chat e estudos com IA [24]. O Doresh precisa de planos para não ficar atrás, mas não vai ganhar usuários só por tê-los.
2. **Leitura em grupo já existe, mas é genérica.** O "Plano com Amigos" do YouVersion é gratuito, permite convidar até 300 pessoas de uma vez e tem discussão privada por dia [1][3]. Ainda assim, não oferece "recuperar atraso" em grupo [4], não deixa sair e voltar [2] e não tem moderação documentada [3].
3. **O concorrente real do "ler junto" no Brasil é o WhatsApp.** 94% dos usuários estão em pelo menos um grupo e 97% abrem o aplicativo todos os dias [30]. Não há dado público sobre quantas células usam o WhatsApp para planos de leitura [hipótese forte, a validar em entrevistas].
4. **A evidência de que a comunidade ajuda é fraca, mas aponta no mesmo sentido.** A Biblica relatou cerca de 80% de conclusão num plano lido em comunidade, contra uma queda de 30% no uso de planos individuais uma semana depois do 1º de janeiro na Bible Gateway (dados de 2014) [35].
5. **Onde o Doresh pode se diferenciar:** num plano que é o roteiro da célula e da EBD, conduzido pelo líder. O líder anexa ao dia o estudo que preparou no Doresh (D5), as anotações pessoais continuam privadas por padrão e o Ruach, mais tarde, ajuda com contexto e perguntas de discussão revisadas.
6. **Os maiores riscos não são técnicos.** São a licença NVI/ARA para leitura e compartilhamento (Q3), a LGPD (fazer parte de um grupo de leitura bíblica revela convicção religiosa, que é dado sensível) [39], a falta de notificações no produto e convencer um grupo a sair do WhatsApp.

---

## 1. Escopo, método e limites

- Pesquisa feita em 2026-10-17 com busca na web e leitura direta das páginas oficiais: centrais de ajuda, páginas de preço e lojas de aplicativos. Os preços são os que aparecem nas fontes indicadas e **variam por país e por loja**.
- **Limites:** a App Store limitou parte das consultas (erro 429) e as avaliações visíveis nas lojas são poucas e antigas. Também não encontramos fóruns em pt-BR com reclamações específicas sobre o "Plano com Amigos". Por isso, a seção de reclamações se apoia mais em documentação oficial (o que o produto **não** faz) e em avaliações pontuais do que em volume de queixas.
- **Não encontrado:** nenhum aplicativo chamado "Bíblia+"/"Biblia Plus" com planos ou grupos apareceu nas buscas. Se o fundador se referia a um aplicativo específico, precisamos do link.
- He Reads Truth não foi analisado à parte. É da mesma empresa do She Reads Truth e assumimos o mesmo modelo [hipótese].

---

## 2. Tabela comparativa

Legenda: **Sim** = documentado na fonte · **Não** = a fonte indica que não existe · **?** = não verificado · "Ref." = plano só com referências; "Dev." = plano com conteúdo devocional.

| App | Planos (tipo) | Recuperar atraso | Sequência/gamificação | Ler em grupo | Discussão por dia | Papel de líder/igreja | Privacidade do que é compartilhado | Receita | pt-BR |
|---|---|---|---|---|---|---|---|---|---|
| **YouVersion** [1–7][12][13] | Ref. + Dev.; mais de 13 mil planos em mais de 50 idiomas (número não datado) [13] | "Catch Me Up" só em plano individual [4] | Sim: sequência, "Perfect Weeks", medalhas, desafios de 21 dias [13] | Sim, "Plano com Amigos" (convite de até 300 pessoas por seleção, link compartilhável no WhatsApp) [1] | Sim: "Talk It Over", privado aos participantes, com curtidas e respostas [3] | Anfitrião convida e remove [2]; perfil de igreja gratuito com planos em destaque e Insights agregados a partir de 5 pessoas [6] | Plano Privado / Só amigos; atividade do plano em grupo fica fora do feed [5] | 100% gratuito, ministério da Life.Church [12] | Sim (NVI e ARA disponíveis [14]) |
| **BibleProject** [16] | Dev. com vídeos (plano anual de 358 dias, atualizado para 2026); distribuído pelo YouVersion | Pelo YouVersion | Pelo YouVersion | Pelo YouVersion ("Plano com Amigos") | Pelo YouVersion | Guias para grupos nas coleções | Pelo YouVersion | Doações; gratuito | Parcial (página pt-BR de planos) |
| **Dwell** [17] | Planos de **áudio** (mais de 75) | ? | ? | ? | ? | ? | ? | Assinatura após 7 dias de teste (preços divergentes entre fontes) | ? |
| **Glorify** [18] | Devocionais diários e cursos (não "planos" clássicos) | ? | Sim: árvore regada pela sequência; só o devocional conta [18] | Sim: amigos, família, igreja; "Public Group" | Sim (discussão de devocionais, pedidos de oração) | ? | ? | Freemium; Glorify Plus de US$ 6,99 a 9,99/mês e de US$ 41,99 a 69,99/ano [18] | ? |
| **Hallow** (católico) [19] | "Bible in a Year" (gratuito), desafios, coleções | ? | Sim (desafios) | Sim: grupos e paróquias; grupo comum só por link de convite [19] | Sim: respostas a perguntas, reflexões, chat do grupo | Admin modera, remove, desliga o chat, aprova entradas em grupo privado; paróquias e dioceses como parceiras pagantes [19] | Por item: intenções, reflexões e conclusões, cada um com chave liga/desliga [19] | Freemium: US$ 9,99/mês, US$ 69,99/ano, família de 6 por US$ 119,99/ano; planos para paróquias [19] | ? |
| **Logos / Faithlife** [20] | Ref.; planos personalizáveis, inclusive na versão gratuita (fonte antiga) | ? | ? | Sim: Faithlife Groups de igreja com planos e pedidos de oração | "Community Notes" ancoradas no texto para o grupo | Grupo da igreja | Escolha do grupo que vê cada nota | Venda de bibliotecas; grupos gratuitos | Não |
| **Olive Tree** [21] | Ref.; planos gratuitos de 5 dias a 3 anos | ? | ? | Não documentado | Não | Não | n/a | Venda de recursos; sincronização gratuita [21] | Não |
| **She Reads Truth** [22] | Dev. com comunidade de leitura | ? | ? | Comunidade aberta (não grupos fechados) | Comentários em tempo real | Oferta para igrejas (não verificada) | ? | Planos avulsos a partir de US$ 1,99 ou assinatura mensal (US$ 2,99 a 4,99 conforme a fonte) [22]; nota 3,2 | Não |
| **Bible in One Year (Nicky & Pippa Gumbel)** [23] | Dev.: AT + NT + Salmo/Provérbio por dia, com comentário | ? | Acompanhamento de progresso | Não documentado | Não | Não | n/a | Ministério (Alpha) | **Não** (11 idiomas, sem português) [23] |
| **Bíblia JFA Offline** (MrRocco) [24] | "Planos bíblicos" e temáticos | ? | ? (há quiz) | Não mencionado | Não | Não | n/a | Anúncios, remoção de anúncios por R$ 24,90, Premium por R$ 14,99/mês ou R$ 79,99/ano, Bíblias pagas [24] | Sim: ARA, NVI e outras; **chat e estudos com IA** [24] |
| **Bíblia Sagrada** (br.biblia) [25] | Planos de leitura, devocional em áudio | ? | ? | ? | ? | ? | ? | ? | Sim; mais de 10 milhões de instalações [25] |
| **Plano Bíblico Personalizado** [26] | Gerador: o usuário escolhe período, ordem (histórica, cronológica, tradicional) e exporta em PDF | **Sim**: o plano se ajusta ao atraso [26] | ? | "Desafios em grupo" por convite, compra de R$ 19,90 [26] | Compartilhar perguntas do desafio | Criador do desafio | ? | Freemium | Sim (pequeno: 43 avaliações) |
| **Planning Center Groups / Church Center** [28] | Não (gestão de grupos) | n/a | n/a | Sim (gestão de pequenos grupos) | Chat, avisos, materiais | Líder: presença, eventos, relatórios; grupos confidenciais | Lista de membros oculta em grupos confidenciais | Por número de membros: gratuito até 15, US$ 15/mês até 75... US$ 239/mês ilimitado [28] | Não |
| **Apps de igreja BR** (ex.: IBN Caminho) [29] | Não | n/a | n/a | Gestão de células | ? | Líder registra presença e relatório do encontro [29] | ? | Contratado pela igreja [hipótese] | Sim |
| **WhatsApp** [30] | Não (o líder cola a leitura do dia) | Informal | Não | Sim; 94% dos usuários estão em grupos [30] | Sim, sem estrutura | Admin do grupo | Tudo visível para todos no grupo | Gratuito | Sim, onipresente |

---

## 3. Notas por concorrente (o essencial)

**YouVersion, a referência obrigatória**
- Escala: mais de 1 bilhão de instalações, mais de 670 milhões de planos concluídos [7]. Em 2025, 19 milhões de pessoas usaram o aplicativo no domingo de Páscoa [11]. Abriu um hub regional no Brasil, citado pelo próprio CEO [10]. Na América Latina hispânica, a rede de igrejas parceiras cresceu 74% (2.374 igrejas) e há quase 10 mil planos escritos originalmente em espanhol (agosto de 2026) [10]. **[hipótese]** Esse esforço de conteúdo local deve chegar ao português.
- Funcionamento do Plano com Amigos [1][2][3][5]:
  - Começa a partir de um plano: "Iniciar com amigos", escolher a data de início (não pode estar no passado e não muda depois de começar) e convidar amigos (até 300 por seleção) ou mandar um link (WhatsApp, SMS, e-mail).
  - Só o anfitrião convida e remove. Quem sai **não volta**, e quem é removido só volta se o plano for reiniciado.
  - Cada dia tem uma área privada de discussão com comentários, respostas e curtidas, e há aviso por e-mail quando alguém comenta. Não há moderação nem denúncia documentadas na central de ajuda.
  - Cada participante vê quem concluiu cada dia. A atividade do plano em grupo não aparece no feed social.
  - O "Catch Me Up" (recuperar atraso) **não está disponível em plano com amigos** [4].
- Igrejas [6]: perfil com logotipo, horários e planos em destaque; "Events" com notas do sermão; "Insights" com dados **anônimos e agregados, só a partir de 5 pessoas** ligadas à igreja. Tudo gratuito.
- YouVersion Platform [8][9]: APIs e SDKs gratuitos com **licença das Bíblias incluída**, mas **só para uso não comercial**. O aplicativo tem de ser gratuito, sem anúncios e sem nenhum recurso pago que dependa das Escrituras. Cada editora decide se participa. NVI e ARA estão no YouVersion [14], mas não verificamos se as editoras as liberaram na Platform **[em aberto]**.

**Hallow, o melhor modelo de grupo encontrado** [19]
- Grupos fora do diretório público, entrada por link; grupo privado com aprovação do admin.
- O admin modera: apaga mensagens, desliga o chat (só os admins postam), remove pessoas e aprova entradas. Os membros podem denunciar perfis e intenções.
- **Privacidade por tipo de conteúdo:** cada pessoa decide se compartilha intenções, reflexões ou conclusões, com uma chave para cada.
- O negócio passa pela paróquia e pela diocese (parcerias e assinaturas compradas pela paróquia) [19][43].

**Logos/Faithlife** [20]
- "Community Notes": a anotação fica presa ao versículo e é visível ao grupo escolhido. É a ideia mais próxima de "anotações do grupo vs anotações minhas". A fonte é antiga e o produto pode ter mudado **[em aberto]**.

**Brasileiros**
- **Bíblia JFA Offline** [24]: é o concorrente direto em funcionalidades (ARA, NVI, anotações, cores, planos, devocionais, chat e estudos com IA). Ganha dinheiro com anúncios, remoção de anúncios, Premium e Bíblias pagas. **Não** tem grupos.
- **Plano Bíblico Personalizado** [26]: pequeno, mas é o único brasileiro encontrado que junta plano que se ajusta ao atraso, ordem cronológica e desafio em grupo (pago, R$ 19,90). Em uma avaliação, alguém reclama que o plano pedia para ser refeito todo dia e que a leitura se perdeu. **Lição:** a confiabilidade do progresso é tudo.
- Apps de igreja (ex.: IBN Caminho) [29] gerenciam a **célula** (presença, relatório), não a **leitura**. Há espaço entre "gestão da célula" e "conteúdo para a célula".

---

## 4. Planos de leitura: catálogo e mecânicas

### 4.1 Catálogo de planos clássicos [31][32][33][34]

| Plano | Estrutura (fonte) | Para quem [hipótese] |
|---|---|---|
| **Bíblia em 1 ano (AT + NT diário)** | Uma leitura do AT e uma do NT por dia (modelo "Bible in a Year" do YouVersion e Tabletalk) [31] | D, B |
| **Cronológico** | Ordem em que os eventos aconteceram [31] | D, C |
| **Histórico** | AT na ordem da Bíblia hebraica; NT pela data provável de escrita [31] | C |
| **Do Gênesis ao Apocalipse** | Ordem canônica [31] | D |
| **Navigators** | 25 leituras por mês e dias livres para recuperar atraso; quatro leituras por dia; começa em qualquer data [31][32] | D, B (tolerante a atraso) |
| **M'Cheyne** | NT e Salmos duas vezes, AT uma vez, em 1 ou 2 anos [31] | A, C |
| **Horner** | 10 capítulos por dia, contínuo [31] | C (exigente) |
| **5x5x5 NT** | NT em 1 ano, 5 dias por semana, fim de semana para reflexão; bom para iniciantes [31][34] | D, B |
| **NT em 260 dias** | Um capítulo por dia útil [33] | D, B |
| **NT em 6 meses** | NT direto, um trecho curto por dia [31] | D |
| **Um salmo por dia** | Salmos em cerca de 5 meses [31] | D |
| **Dois anos** | AT e NT uma vez, Salmos e Provérbios quatro vezes [31] | D |
| **Gerador de plano** | O usuário define o período [31][26] | A, B (série da EBD) |

O pedido do fundador cita "AT" sozinho. Nenhuma das fontes consultadas traz um plano só do AT entre os clássicos mais citados. **[hipótese]** O AT costuma ser lido dentro de um plano da Bíblia toda ou de um cronológico. Recomendamos validar se há demanda real por "só AT" antes de incluí-lo.

### 4.2 Mecânicas observadas

| Mecânica | O que o mercado faz | Leitura para o Doresh |
|---|---|---|
| **Atraso** | YouVersion: "Catch Me Up" move o "hoje" para o primeiro dia não lido, mas não funciona em grupo [4]. Navigators: dias livres embutidos [32]. Plano Bíblico Personalizado: redistribui o que faltou [26]. Apps "sem culpa" (sem prazo, um livro de cada vez) se posicionam contra o calendário rígido [41] | O atraso é **o** momento de abandono. Oferecer "retomar de onde parei" e dias de folga desde o primeiro dia |
| **Abandono** | Bible Gateway: queda de 30% no uso de planos uma semana após 1º de janeiro, de um terço até o fim de fevereiro e de quase metade até maio (2014) [35]. YouVersion: usuários ativos diários sobem cerca de 20% em janeiro [13] | Medir a retenção nas semanas 1 e 4 do plano; o lançamento em janeiro é a janela natural (ou o início do semestre da EBD) |
| **Comunidade** | Community Bible Experience (Biblica), leitura em comunidade no modelo de clube do livro: cerca de 80% de conclusão (afirmação do editor, 2014) [35] | Evidência fraca, mas é o melhor argumento a favor do pedido do fundador. Validar com o nosso próprio teste |
| **Sequência e medalhas** | YouVersion: sequência, "Perfect Weeks", medalhas, desafio de 21 dias com 1,2 milhão de medalhas num mês de fevereiro [13]. Glorify: árvore que murcha; queixa de que só o devocional conta [18] | Funciona para engajar, mas gera culpa e "fazer pela sequência". Contraria a regra do Doresh de não manipular. Preferir **dias lidos acumulados** e marcos de conteúdo (terminou o Pentateuco) |
| **Lembretes** | YouVersion: versículo do dia por notificação [13]; controle de notificações do grupo acrescentado numa versão (fonte secundária) [15] | O Doresh **não tem notificações**. Sem lembrete, o hábito depende do WhatsApp do líder |
| **Devocional vs referências** | YouVersion, BibleProject, Gumbel e She Reads Truth vivem do conteúdo devocional [16][22][23]. Olive Tree e Ligonier usam mais planos só de referências [21][31] | Começar **só com referências**: sem custo de conteúdo e sem risco teológico. O conteúdo vem do líder (estudo do Doresh) e, mais tarde, do Ruach revisado |
| **Criados pelo usuário/igreja** | Ligonier oferece gerador [31]; Plano Bíblico Personalizado gera e exporta PDF [26]; YouVersion aceita planos de parceiros (curadoria) e igrejas destacam planos [6] | O plano do líder (série da EBD, livro da célula) é o elo com as personas A e B |

---

## 5. Leitura em grupo

### 5.1 Como os produtos fazem

- **Entrada:** convite pelo anfitrião ou por link (YouVersion [1], Hallow [19]). O link é compartilhado **no WhatsApp**: o próprio YouVersion lista o WhatsApp como canal de convite [1].
- **Tamanho:** YouVersion aceita até 300 por seleção de convite, sem limite total documentado [1]. Planning Center cobra pelo total de membros dos grupos [28]. Célula e classe de EBD são grupos pequenos **[hipótese: 5 a 30 pessoas]**.
- **Papel do líder:** convidar, remover, moderar e, no Hallow, desligar o chat para que só o admin poste [19]. A data de início é fixada pelo anfitrião [1].
- **Discussão:** por dia do plano, privada ao grupo (YouVersion [3]); perguntas e reflexões (Hallow [19]); notas ancoradas no versículo (Logos [20]).
- **Privacidade:** o progresso fica visível a todos no YouVersion [2]; no Hallow, cada tipo de conteúdo tem a sua chave [19]; no YouVersion, a atividade do grupo fica fora do feed e as atividades que já foram para o feed não podem ser apagadas [5].
- **Igreja:** perfil e dados agregados com **mínimo de 5 pessoas** para proteger o anonimato [6]; paróquias e dioceses como clientes [19].

### 5.2 O que gera retenção ou abandono

Com evidência:
- O janeiro inflado e a queda rápida depois [13][35].
- A comunidade foi associada a mais conclusão [35] (fonte antiga, do próprio editor).
- Quando o plano perde o progresso, o usuário se frustra (avaliação do Plano Bíblico Personalizado) [26]. O mesmo aparece nas queixas de navegação e de "lido" que se desmarca no She Reads Truth [22].
- A sequência que só conta uma atividade irrita quem lê de outro jeito [18].

Hipóteses a validar:
- Quem atrasa num plano em grupo sente vergonha ao ver o progresso dos outros e sai em silêncio, e no YouVersion não pode voltar [2][4].
- Dois lugares de conversa (WhatsApp + app) dividem a discussão, e o app perde.
- O líder desiste se precisar "empurrar" cada membro manualmente.
- Notificações de comentários em excesso fazem as pessoas desligarem tudo (havia queixas suficientes para o YouVersion acrescentar controle de notificações do grupo [15]).

### 5.3 Reclamações e lacunas documentadas

| Lacuna | Fonte |
|---|---|
| Não há "recuperar atraso" em plano com amigos | [4] |
| Quem sai ou é removido não pode voltar | [1][2] |
| A data de início não muda depois de começar | [1] |
| Moderação e denúncia não documentadas na discussão do plano | [3] |
| Atividades publicadas no feed não podem ser apagadas | [5] |
| Progresso e "lido" pouco confiáveis (She Reads Truth, Plano Bíblico Personalizado) | [22][26] |
| Sequência rígida demais (Glorify) | [18] |

---

## 6. Modelo de negócio observado

| Modelo | Quem | O que é pago | Grupos como alavanca |
|---|---|---|---|
| Totalmente gratuito, ministério | YouVersion [12], BibleProject [16] | Nada | Sim: o convite por link instala o app (o link leva à loja) [1] |
| Freemium com assinatura | Hallow [19], Glorify [18], Dwell [17] | Conteúdo premium (áudio, cursos, música); "Bible in a Year" é gratuito no Hallow [19] | Hallow: plano família, parcerias com paróquias; Glorify: grupos |
| B2B igreja | Hallow (paróquia e diocese) [19][43], Planning Center (por membro) [28] | Licença da comunidade | O líder traz o grupo inteiro |
| Anúncios + remoção + Premium | Bíblia JFA Offline [24] | Sem anúncios, Bíblias, recursos | Não |
| Venda de conteúdo | Olive Tree [21], Logos [20], She Reads Truth [22] | Bíblias, comentários, planos | Pouco |

Conclusões:
- **O grupo é um canal de aquisição, não algo a cobrar** [hipótese apoiada pelo padrão observado]. Ninguém entre os analisados cobra do membro para ler em grupo (a exceção é o desafio pago de R$ 19,90 de um app pequeno [26]).
- **Atenção ao conflito entre licença e receita:** a via mais barata para licenciar Bíblias, a YouVersion Platform, **proíbe qualquer monetização** de recurso que dependa das Escrituras [9]. Essa escolha condiciona o Q2 (modelo de receita).

---

## 7. WhatsApp: o concorrente real

- **[fato]** 97% dos usuários brasileiros abrem o WhatsApp todo dia e 94% estão em pelo menos um grupo; 45% já usaram Comunidades, e quem não usa cita falta de interesse (43%) e excesso de mensagens (27%) (Opinion Box, junho de 2025, 1.126 respondentes) [30].
- **[hipótese]** O roteiro típico de uma célula hoje é: o líder manda "Leitura de hoje: João 3" no grupo, poucos respondem, a conversa se mistura com avisos e a anotação de cada um se perde (D2). O WhatsApp não guarda progresso, não liga o comentário ao versículo e não separa o pessoal do coletivo.
- **Implicação:** não tentar **substituir** o WhatsApp no MVP. O Doresh deve ser **o lugar do conteúdo e do progresso**, e o WhatsApp **o canal de convite e de lembrete** (o link do dia colado pelo líder). É o que o próprio YouVersion faz no convite [1].

---

## 8. Padrões que funcionam

1. **Começar o plano é imediato:** escolher o plano, a data de início e, opcionalmente, convidar [1].
2. **Convite por link compartilhável no WhatsApp**, com uma página de destino que funciona sem o app instalado [1].
3. **Discussão presa ao dia ou ao versículo**, não um chat solto [3][20].
4. **Privacidade por tipo de conteúdo**, com o padrão privado (Hallow) [19], e atividade do grupo **fora** de qualquer feed público [5].
5. **Poderes do líder** para remover, apagar e restringir o chat, e para que só ele poste quando quiser [19].
6. **Dados de igreja só agregados, com mínimo de pessoas** (k ≥ 5) [6].
7. **Folga embutida** no plano (25 leituras por mês, 5 dias por semana) [31][32][34].
8. **Planos só de referências** para o catálogo clássico (sem custo de conteúdo) [21][31].
9. **Progresso sincronizado e confiável** como requisito mínimo [21][26].

## 9. Armadilhas a evitar

1. **Sequência que pune** e medalhas como fim em si (culpa e "ler para não perder a sequência"), o que conflita com a regra de não manipular [13][18].
2. **Grupo sem saída digna:** quem atrasa não consegue se recuperar e quem sai não volta [2][4].
3. **Progresso individual exposto por padrão** (constrangimento e possível exposição de dado sensível).
4. **Notificação em excesso** por comentário [15].
5. **Construir um segundo WhatsApp** (chat completo) antes de provar o valor.
6. **Catálogo enorme com conteúdo devocional próprio** logo de início (custo editorial e risco teológico).
7. **Compartilhar o texto bíblico inteiro** em convites e cards sem licença clara (seção 11).
8. **Perder o "lido"** ou recalcular o plano sem o usuário pedir [26].
9. **Feed social com atividade religiosa** (o YouVersion não deixa apagar o que foi para o feed [5]); para nós seria um problema de LGPD.

---

## 10. Oportunidades de diferenciação para o Doresh

Ordenadas por encaixe com as personas e com o que já existe no produto.

| # | Oportunidade | Por que é nossa | Persona / problema |
|---|---|---|---|
| O1 | **"Plano da célula/EBD" conduzido pelo líder:** o líder escolhe um plano clássico ou monta um com as referências da série e **anexa a cada dia um estudo do Doresh** (já existe `studies`) | Ninguém analisado liga o estudo preparado pelo líder à leitura diária do grupo. O YouVersion tem a discussão, mas o conteúdo é de parceiros | B, A · D5, D1 |
| O2 | **Anotações minhas vs do grupo:** destaques e comentários do dia continuam privados; a pessoa **escolhe por item** compartilhar com o grupo (modelo Hallow + Community Notes do Logos) | Resolve D2 e respeita a LGPD por desenho | D, B · D2 |
| O3 | **Retomada sem culpa em grupo:** "Estou atrasado: seguir no meu ritmo ou pular para o dia do grupo", sem medalha perdida e sem expor quem atrasou | Lacuna documentada do YouVersion [4] | D, B |
| O4 | **Integração com o WhatsApp em vez de competir:** link do dia (referência + link, sem o texto inteiro) que o líder cola no grupo; página de destino leve | Onde as células já vivem [30] | B |
| O5 | **Ruach no plano (depois):** contexto histórico do dia e 3 perguntas de discussão geradas **uma vez por plano e dia** (cache), revisadas pelo `talmid` e editáveis pelo líder | Custo de IA fixo por catálogo, e não por usuário; fidelidade bíblica como diferencial (D4) | B, D, C · D3, D4 |
| O6 | **Planos "de estudo" para pregadores e estudantes:** M'Cheyne, Histórico e um plano por livro com espaço para o estudo exegético | O nicho de estudo profundo em pt-BR é pouco servido (Logos e Olive Tree não têm pt-BR) [20][21] | A, C · D3 |
| O7 | **Igreja como cliente (depois):** vários grupos, planos da igreja e dados agregados com k ≥ 5 | Modelo Hallow/Planning Center; possível resposta ao Q2 | B2B · Q2 |

O que **não** recomendamos como diferencial: tamanho do catálogo, conteúdo devocional próprio, áudio, gamificação. Nessas frentes, YouVersion, Hallow e Dwell são imbatíveis e gratuitos ou bem financiados.

---

## 11. Proposta de escopo (Agora / Próximo / Depois)

Organizada por resultado. É uma proposta para discussão, não uma spec.

### Agora (MVP): "um líder consegue conduzir a leitura da célula por 4 semanas"

Resultado esperado: grupos que começam um plano continuam lendo na semana 4. Métrica e meta a definir com o fundador.

1. **Catálogo curto, só de referências** (de 5 a 7 planos, com as divisões validadas pelo `talmid`): Bíblia em 1 ano (AT + NT diário), NT em 260 dias úteis (ou 5x5x5), Evangelhos (duração a definir), Cronológico em 1 ano, Salmos e Provérbios, M'Cheyne. "Só AT" fica de fora até haver demanda (seção 4.1).
2. **Plano individual:**
   - Data de início e lista de dias.
   - Marcar o dia como lido.
   - Abrir o capítulo no leitor NVI/ARA que já existe.
   - Progresso confiável: "dias lidos" acumulados, **sem sequência punitiva**.
   - "Retomar de onde parei" e pausar.
3. **Grupo de leitura mínimo:**
   - O líder cria o grupo a partir de um plano, com data de início **editável**.
   - Convite por link com validade e possibilidade de revogação.
   - O membro pode sair e **voltar**.
   - O progresso aparece **agregado por padrão** ("8 de 12 leram o dia 5"). Mostrar o nome de quem leu exige opção do próprio membro.
   - **Nota do líder por dia:** comunicação de mão única, sem chat. Opcionalmente anexa um estudo do Doresh (O1).
   - O líder remove membros.
4. **"Compartilhar o dia" para o WhatsApp:** só a referência, o nome do plano e o link, **sem o texto bíblico completo**.
5. **Privacidade e LGPD desde o primeiro dia:**
   - Consentimento específico ao entrar num grupo, explicando que o grupo vê a sua participação.
   - Saída com remoção dos dados de participação.
   - Eventos só com ids, contagens e enums.
   - Público apenas maior de 18 anos no MVP **[em aberto: a EBD inclui menores]**.
6. **Eventos** (snake_case pt-BR, sem conteúdo): `plano_iniciado` {plano_id, origem: individual|grupo}, `dia_plano_concluido` {plano_id, dia_numero, dias_atraso}, `plano_retomado`, `plano_pausado`, `grupo_criado` {plano_id}, `convite_grupo_compartilhado` {canal}, `convite_grupo_aceito`, `membro_saiu_grupo`, `nota_lider_publicada` {tem_estudo_anexo: bool}.

O que fica **fora** do Agora: discussão em chat, notificações próprias, planos criados pelo usuário, IA, perfil de igreja, conteúdo devocional.

### Próximo: "o grupo conversa sobre o texto no Doresh, e o pessoal continua pessoal"

- **Discussão por dia** (comentário e resposta), com o líder podendo apagar, denúncia, opção "só o líder posta" e **resumo de notificações**, nunca uma por comentário.
- **Compartilhar com o grupo, item a item,** um destaque ou anotação feito durante o dia do plano (O2). Exige referências estruturadas (ver seção 13).
- **Plano criado pelo líder** (sequência de referências da série da EBD ou da célula).
- **Lembretes:** web push e/ou e-mail diário opcional, com horário escolhido pela pessoa.
- **Ritmo pessoal vs ritmo do grupo** (O3).

### Depois: "o Doresh ajuda a ensinar"

- **Ruach no plano** (O5): contexto do dia e perguntas de discussão geradas uma vez por plano e dia, revisadas pelo `talmid` e editáveis pelo líder, com o rótulo "gerado por IA".
- **Igreja:** vários grupos, planos da igreja, painel agregado com k ≥ 5 (O7). Candidato a resposta ao Q2.
- Planos de estudo para A e C (O6) e, se fizer sentido, conteúdo devocional de parceiros.

---

## 12. Hipóteses de risco e o teste mais barato para cada uma

| Tipo | Hipótese | Teste mais barato | O que mudaria a recomendação |
|---|---|---|---|
| Valor | Líderes de célula e EBD querem conduzir a leitura do grupo num app em vez de só no WhatsApp | De 5 a 8 entrevistas com líderes de igrejas de portes e tradições diferentes, com foco em como conduzem a leitura hoje, sem vender a solução | Se o WhatsApp + PDF bastar, priorizar plano individual + "compartilhar o dia" e adiar grupos |
| Valor | Ler em grupo aumenta a continuidade em relação a ler sozinho | Concierge: 2 ou 3 grupos reais seguindo um plano durante 4 semanas, com o progresso acompanhado num protótipo ou planilha | Se não houver diferença, grupos deixam de ser prioridade |
| Valor | Anexar um estudo do líder ao dia é valorizado (O1) | Teste de conceito com protótipo (`product-designer`) com 5 líderes | Se não, o grupo fica só com a nota do líder |
| Usabilidade | Membros pouco digitais entram pelo link do WhatsApp sem travar no cadastro | Teste de usabilidade do fluxo convite → cadastro → dia 1 no celular com 5 pessoas da persona D | Se o cadastro for a barreira, avaliar entrada com o mínimo de dados |
| Usabilidade | Progresso agregado é suficiente; o nome individual não é necessário | Perguntar no teste de conceito | Se líderes exigirem nominal, deixar opcional e com consentimento |
| Viabilidade | Sem notificações, o hábito se sustenta pelo WhatsApp do líder | Medir no concierge quantos leem sem lembrete do app | Se não se sustentar, puxar lembretes (web push/e-mail) para o Agora |
| Viabilidade | Planos precisam de referências estruturadas (livro/capítulo/versículo); hoje destaques e comentários guardam **texto livre** (ver seção 13) | Revisão técnica com o `dev-backend-python` | Se a migração for cara, o O2 vai para o Depois |
| Negócio | Grupos trazem novos usuários (cada líder convida N) | Medir `convite_grupo_aceito` por grupo criado | Se for baixo, o grupo não serve de aquisição |
| Negócio / licença | NVI e ARA podem ser exibidas a membros de grupo e citadas em convites | **Q3**: carta à Biblica (NVI) e à SBB (ARA) pedindo os termos de uso digital e de compartilhamento | Se não houver licença, considerar a YouVersion Platform (não comercial [9]) ou tradução de domínio público ou aberta |
| LGPD | Membros aceitam que o grupo veja a sua participação num plano bíblico | Texto de consentimento testado no teste de usabilidade; revisão jurídica (Q6) | Se houver resistência, o padrão vira "anônimo no grupo" |
| Custo | MVP sem IA tem custo variável perto de zero | n/a | Quando entrar o Ruach: custo fixo por catálogo (planos × dias), não por usuário |
| Fidelidade | Divisões dos planos (cronológico principalmente) estão corretas | Revisão do `talmid` | n/a |

### LGPD (detalhe)

- **[fato]** Convicção religiosa é dado pessoal sensível, e o tratamento exige consentimento específico e destacado ou outra base do art. 11 [39].
- **[hipótese de enquadramento, validar com jurídico]** Fazer parte de um grupo de leitura bíblica, o progresso e o que se escreve na discussão revelam convicção religiosa e devem ser tratados como dado sensível. Compartilhar com o grupo não torna o dado "manifestamente público".
- Cuidados mínimos:
  - Nenhum conteúdo em eventos ou logs.
  - Link de convite que não exponha o nome da igreja nem dos membros a quem não entrou.
  - Saída apaga a participação.
  - Exportação e exclusão de conta incluem os dados de grupo.
  - Menores de idade: o art. 14 exige consentimento de um dos pais ou do responsável [39], e a EBD tem crianças e adolescentes. Recomendação: **só adultos no MVP**.

### Licença NVI/ARA (detalhe)

- **[fato]** A NVI em português é da Biblica, Inc., e "Bíblia Sagrada, Nova Versão Internacional" é marca registrada no INPI [37]. Existe uma revisão de 2023 (NVI23) publicada pela Thomas Nelson Brasil [42]; não verificamos qual edição está no Doresh **[em aberto]**.
- **[fato, mas para a NIV em inglês]** A Biblica permite citar até 500 versículos sem pedir autorização, desde que não forme um livro completo nem passe de 25% da obra [36]. **Não encontramos uma política pública equivalente para a NVI em português**, e uma Bíblia completa num app vai muito além disso.
- **[em aberto]** A ARA é da Sociedade Bíblica do Brasil [14]. Não encontramos política pública de uso digital. Há um relato (de um desenvolvedor, não oficial) de que a SBB não autorizou distribuir a ARA num software de projeção [38].
- **Consequência para grupos:** exibir o texto a mais pessoas e permitir que ele seja copiado e compartilhado **agrava** um risco que já existe hoje (Q3). Enquanto não houver licença, convites e cards levam **só a referência e o link**, e um comentário pode citar um trecho curto. A YouVersion Platform resolve a licença, mas proíbe monetização [9].

---

## 13. Observações do repositório que afetam o escopo

- `bible_highlights` guarda `text` e `color`; `bible_comments` guarda `biblical_text` e `comment`. **Não há referência estruturada** (livro, capítulo, versículos) (`backend/src/infrastructure/database/models/bible_models.py`). Isso tem três consequências:
  1. Para ligar um destaque ao dia do plano e compartilhá-lo com o grupo (O2), será preciso guardar a referência.
  2. Guardar o texto bíblico copiado em cada destaque também é relevante para a licença.
  3. Fica a decisão para o `dev-backend-python`, a tomar na spec.
- Não existem notificações, grupos, convites nem papéis entre usuários. Tudo hoje é privado por usuário. Grupos introduzem o **primeiro dado compartilhado entre usuários**, com impacto em testes de isolamento (skill `qa-write-ownership-tests`) e na política de privacidade (Q6).
- O app não mostra nenhum aviso de copyright das traduções no frontend (busca por "©", "Sociedade Bíblica" e "Biblica, Inc" sem resultados).

---

## 14. Decisões e perguntas para o fundador

1. **Q3, licença:** podemos pedir agora os termos à Biblica e à SBB? Grupos ampliam a exposição do texto.
2. **Público do MVP:** só adultos (recomendado) ou também EBD infantil e de adolescentes?
3. **Discussão no app no MVP?** Recomendamos que não: nota do líder + WhatsApp no Agora, discussão no Próximo, depois do teste concierge.
4. **Sequência e medalhas:** confirmar que o Doresh **não** terá sequência punitiva (recomendado).
5. **Q2:** o modelo "igreja como cliente" (O7) entra na reflexão sobre receita? Isso pesa contra a YouVersion Platform como fonte de licença.

## 15. Próximos passos sugeridos

1. Fundador responde à seção 14.
2. PM: roteiro de entrevista com 5 a 8 líderes de célula e EBD sobre como conduzem a leitura hoje (WhatsApp, PDF, presencial).
3. `talmid`: validar as divisões dos planos do Agora.
4. PM: `feature-discovery` gera o `brief.md` desta funcionalidade a partir desta pesquisa.
5. `product-designer`: protótipo do fluxo "líder cria grupo → convite no WhatsApp → membro lê o dia 1 → retoma atrasado".

---

## Fontes

Acessadas em 2026-10-17, salvo indicação.

1. YouVersion Support, "iOS: Plan with Friends": https://help.youversion.com/l/en/article/at3uptn298-plan-with-friends
2. YouVersion Support, "iOS: Plan With Friends - Participants": https://help.youversion.com/l/en/article/mz4s3q2dsn-pwf-participants-ios
3. YouVersion Support, "iOS: Plan with Friends - Comments": https://help.youversion.com/l/en/article/ceaeiu9wax-pwf-comments-ios
4. YouVersion Support, "iOS: Catch Me Up": https://help.youversion.com/l/en/article/n5xlw4dzbq-catch-me-up
5. YouVersion Support, "iOS: Plan Privacy": https://help.youversion.com/l/en/article/865d29xbs3-plan-privacy-ios
6. YouVersion, Churches (Church Profile, Events, Insights): https://www.youversion.com/churches
7. YouVersion, Press (métricas: mais de 1 bilhão de instalações, mais de 670 milhões de planos concluídos): https://www.youversion.com/press/
8. YouVersion, "YouVersion Gives Away the Technology Behind the World's Most-Downloaded Bible App" (31/03/2026): https://www.youversion.com/news/introducing-youversion-platform
9. YouVersion Platform (termos de uso não comercial): https://www.youversion.com/platform
10. YouVersion, "YouVersion Gathers Ministry Partners to Celebrate Growing Bible Engagement in Latin America" (19/08/2026): https://www.youversion.com/news/youversion-gathers-ministry-partners-to-celebrate-growing-bible-engagement-in-latin-america ; hubs no Brasil e no México citados pelo CEO: https://assets.christianpost.com/news/youversion-opens-nairobi-hub-as-africa-ranks-among-top-app-users.html
11. ChurchLeaders, YouVersion 2025 Verse of the Year (dez/2025): https://churchleaders.com/news/2209898-youversion-2025-verse-of-the-year-bobby-gruenewald.html
12. App Store BR, Bíblia (YouVersion): https://apps.apple.com/br/app/b%C3%ADblia/id282935706
13. Outreach Magazine, "5 Tips for Bible App Engagement" (sem data na página): https://outreachmagazine.com/?p=39061
14. Bible.com, ARA (Sociedade Bíblica do Brasil): https://www.bible.com/versions/1608 ; NVI (Biblica): https://www.bible.com/versions/129
15. APKMirror, notas da versão 8.4.0 do YouVersion (fonte secundária): https://apkmirror.com/apk/life-church/bible/bible-8-4-0-release/bible-8-4-0-android-apk-download
16. BibleProject, planos: https://bibleproject.com/reading-plans/ ; plano no YouVersion: https://www.bible.com/reading-plans/22273-bibleproject-one-story-that-leads-to-jesus ; central de ajuda: https://help.bibleproject.com/hc/en-us/articles/5586207821847-Bible-reading-plans ; app: https://bibleproject.com/app/
17. Dwell, página do app (redireciona para o Google Play; preços divergentes entre fontes): https://dwellapp.io/app/android
18. App Store US, Glorify: https://apps.apple.com/US/app/id1490587079
19. Hallow Help, preços: https://help.hallow.com/en/articles/2880438-how-much-does-it-cost ; FAQ de admins de grupo: https://help.hallow.com/en/articles/10659081-faq-for-group-admins-in-the-community-tab ; criar grupo: https://help.hallow.com/en/articles/9948687-how-to-create-a-group-in-the-hallow-app ; compartilhamento e atividade: https://intercom.help/hallow-inc/en/articles/12663633-how-to-manage-sharing-and-activity-settings ; parcerias com dioceses: https://help.hallow.com/en/articles/14600884-my-diocese-partners-with-hallow-what-does-that-mean
20. Logos Support, "Groups for Church Members": https://support.logos.com/hc/en-us/articles/17804414993549-Groups-for-Church-Members ; Faithlife Groups (blog, posts antigos): https://blog.logos.com/tag/faithlife-groups/
21. Olive Tree Blog, sincronização e planos: https://olivetree.com/blog/?p=38280
22. App Store US, She Reads Truth: https://apps.apple.com/us/app/she-reads-truth/id892128363 ; FAQ: https://shopshereadstruth.com/pages/faq
23. App Store, The Bible with Nicky and Pippa Gumbel (idiomas): https://apps.apple.com/us/app/-/id504133402 ; Alpha: https://bible.alpha.org/id/about/
24. App Store BR, Bíblia JFA Offline (MrRocco): https://apps.apple.com/BR/app/id478686126
25. APKCombo, Bíblia Sagrada (br.biblia): https://apkcombo.com/pt/holy-bible/br.biblia/
26. App Store BR, Plano Bíblico Personalizado: https://apps.apple.com/BR/app/id1581039806
27. App Store BR, Bíblia em um Ano: https://apps.apple.com/br/app/biblia-em-um-ano/id6450156354
28. Planning Center Groups, recursos e preços: https://www.planningcenter.com/groups
29. App Store, IBN Caminho (exemplo de app de igreja com células): https://apps.apple.com/us/app/-/id1641112691
30. Canaltech / Opinion Box, "Pesquisa WhatsApp - Junho/2025" (16/07/2025): https://canaltech.com.br/apps/o-que-os-brasileiros-mais-fazem-no-whatsapp-segundo-pesquisa/
31. Ligonier, "Bible Reading Plans" (19/12/2025): https://www.ligonier.org/blog/bible-reading-plans/
32. The Navigators, Bible Reading Plan: https://www.navigators.org/?p=268892
33. NT em 260 dias: https://www.pursuegod.org/weekday260 ; https://chop.bible.com/reading-plans/11026-growing-in-gods-word-nt260
34. 5x5x5 New Testament: https://mybible.eu/en/plans/5x5x5-new-testament-reading-plan
35. Christianity Today, fev/2014 (Bible Gateway e Community Bible Experience): https://christianitytoday.com/ct/2014/february-web-only/read-through-bible-in-year.html
36. Biblica, Permissions (NIV): https://www.biblica.com/permissions/ ; Terms of Use: https://www.biblica.com/terms-of-use/
37. Bibleserver, NVI português (copyright e marca no INPI): https://www.bibleserver.com/bible/NVIP
38. Fórum OpenLP, relato sobre a ARA e a SBB (não oficial): https://discuss.openlp.org/d/1747-almeida-revista-e-atualizada
39. Lei 13.709/2018 (LGPD), arts. 5º, II; 11; 14: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
40. Lei 9.610/1998 (direitos autorais): https://www.planalto.gov.br/ccivil_03/leis/l9610.htm
41. Gentle Reformation, "A Guilt-Free Bible Reading Plan" (2022): https://gentlereformation.com/2022/12/30/a-guilt-free-bible-reading-plan/
42. Marcelo Berti, edição bilíngue dos Evangelhos (NVI 2023, Thomas Nelson): https://marceloberti.substack.com/p/edicao-bilingue-dos-evangelhos
43. Paróquia OLL, Hallow para a paróquia (exemplo de oferta paroquial): https://ollparish.com/hallow
