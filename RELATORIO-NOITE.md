# Relatório da noite — 09/09/2026

Branch: `melhorias/noite-2026-09-09`, já empurrada para o GitHub. Nada foi
publicado: o Pages constrói da `main`, que está intocada — o site no ar é o
mesmo de quando você foi dormir.

**Abrir o Pull Request com um clique:**
<https://github.com/EnzoGaliazzo/distririo/compare/main...melhorias/noite-2026-09-09?expand=1>

O `gh` não está instalado nesta máquina, então não consigo abrir o PR por linha
de comando. O link acima já vem com o comparativo pronto.

---

## Como o trabalho está organizado

O briefing foi escrito para uma sessão longa e contínua. Aqui ele roda como
**execuções separadas de hora em hora** (01:13 às 06:13), e cada execução começa
sem memória da anterior. Adaptei sem mudar o conteúdo:

- a ordem do backlog (P0 → P3) é a fila, em `tools/noturno/BACKLOG.md`;
- cada execução pega o primeiro item não concluído, faz **um item**, verifica,
  commita e marca no backlog;
- este relatório e o `PERGUNTAS-PARA-O-ENZO.md` são o estado compartilhado
  entre execuções — é por eles que cada turno sabe onde o anterior parou.

Seis execuções não fecham 19 tarefas. A fila está ordenada para que o que dá
dinheiro venha antes do que é bonito.

## Correções ao briefing

Conferi os números do briefing contra o repositório antes de começar. Quatro não
batiam, e estão registrados no fim do `PERGUNTAS-PARA-O-ENZO.md`. Os que mudam
o trabalho:

- o CSS está em `style.css`, na raiz, não em `assets/style.css`;
- são **426** produtos e 426 páginas, não 428;
- **`404.html` já existe**, com busca, links de categoria e CTA de WhatsApp —
  a tarefa 18 já estava feita antes da noite começar;
- `gh` não está instalado, então não consigo abrir o PR por linha de comando.
  Empurro a branch e deixo aqui o link de abrir o PR com um clique.

## Regra que estou seguindo em todo texto

Nada de fato comercial inventado: preço, pedido mínimo, prazo, forma de
pagamento, depoimento, número de clientes, unidades por caixa, EAN. Onde o texto
precisaria de um desses e o dado não existe no repositório, entra um marcador
`[FALTA: ...]` visível e a pergunta vai para o `PERGUNTAS-PARA-O-ENZO.md`.

Isso é o que mais vai travar tarefa esta noite — o FAQ (P0 nº 3), a prova social
(P0 nº 4), a área de cobertura (P0 nº 5) e as páginas locais (P1 nº 7) dependem
quase inteiramente de dado que só você tem. Vou montar a estrutura de todas e
deixar o conteúdo marcado.

---

## Trabalho feito

### Antes da noite começar — política de privacidade (commit `ae03ac6`)

Não estava no briefing, mas é falha de conformidade e entrou primeiro.

A validação de CNPJ do formulário "Quero ser cliente" envia o número digitado
para a BrasilAPI, que lê o cadastro público da Receita. Isso é compartilhamento
com operador externo e não estava declarado em lugar nenhum da política. A falha
entrou junto com a própria validação, no mesmo dia.

A seção 3 ganhou uma cláusula dizendo qual dado sai (só o CNPJ), para quem, com
que finalidade, que a resposta não é gravada e que a conferência não é
obrigatória. A lista de dados coletados também dizia "cidade" quando o
formulário passou a pedir bairro.

Verificado: links sem quebra, zero imagens órfãs, `app.js` sem erro de sintaxe,
build idempotente.

---

*(cada execução acrescenta a sua seção aqui abaixo)*

### 01:20 — tarefa 8: contadores entregando "0" no HTML (commit `3f02f4b`)

Melhor achado do seu briefing, e eram **dois** bugs no mesmo lugar.

**O que estava errado.** O HTML entregava `<div data-count-to="428">0</div>`. O
número só aparecia depois que o JS animava — então o Google, os previews de link
no WhatsApp e quem tem JS bloqueado liam "0 Produtos no catálogo", "0 Anos de
mercado", "0 Marcas parceiras". E o 428 já estava velho: o catálogo tem 426
desde a unificação das linhas duplicadas do ERP. O número aparecia à mão em seis
lugares de texto corrido, além dos contadores.

**O que fiz.** Cada contador agora diz o que conta (`data-stat="produtos"`), e o
`tools/gerar.js` preenche o valor a partir do `data/produtos.json`, escrito no
HTML. O total em texto corrido também. Produto novo no catálogo atualiza os dez
contadores das três páginas sozinho — que era a parte da sua tarefa 20 que
faltava.

`marcas` e `anos` continuam à mão de propósito: 16 é o número de marcas
parceiras do seletor da home, não as 22 marcas distintas do JSON (que inclui
submarcas como Choklers e Mix Nutri), e 9 é a idade da empresa.

**Um erro meu no caminho, para você saber.** A primeira versão zerava os
contadores fora da tela, para a contagem subir bonito quando o visitante
chegasse neles. Isso troca um bug por outro: se o observador não disparar, o
visitante vê 0 onde o HTML trazia 426. Desfiz — agora quem zera é a própria
animação, no quadro em que começa. Falhando o observador, fica o número certo.

**Verificado** em 375 px: o HTML cru entrega 426/33/16, a tela mostra 426/33/16
antes e depois de rolar, console limpo, sem overflow horizontal.

### 02:05 — tarefa 1: lista de pedido no catálogo (commit `f439cf2`)

A maior lacuna do site, e a que dá dinheiro. O site promete em todo lugar "você
manda a lista e a gente confirma na conversa", mas o catálogo não deixava montar
lista nenhuma — o comerciante tinha que abrir produto por produto e digitar tudo
à mão no WhatsApp.

**O que ficou pronto.** Botão "Adicionar à lista" nos 426 cartões e nas 426
páginas de produto; botão flutuante com a contagem; painel lateral com ajuste de
quantidade e remoção; tudo guardado no `localStorage` do próprio aparelho,
seguindo o padrão `guardar`/`recuperar` que já existia. Nada sai para servidor
nenhum, e a lista sobrevive a fechar o navegador: o comerciante monta hoje e
manda amanhã. Sincroniza entre abas do mesmo navegador.

**Duas decisões que tomei sozinho, para você discordar se quiser:**

O botão fica **fora** do `<a>` do cartão. Botão dentro de link é HTML inválido e
o clique viraria navegação em vez de adicionar. Isso mudou um pouco o cartão: o
botão aparece embaixo, com borda, ocupando a largura toda.

A mensagem é cortada pelo **tamanho da URL final**, não do texto. Acento vira
três caracteres depois do encode, e cortar por número de letras erraria feio.
Testado com 60 produtos de nomes longos e acentuados: a URL fica em 1810
caracteres, leva os 32 primeiros e avisa que o resto segue na conversa. O painel
diz isso na tela antes de o comerciante enviar, para ele não ser pego de
surpresa.

**Entrou junto** um `medir()` que só dispara evento se houve consentimento — a
lista já usa em abrir, adicionar, remover e enviar. O resto dos eventos do GA4 é
a tarefa 3, a próxima da fila.

**Verificado** em 375 px: 426 botões, nenhum dentro de link, console limpo, sem
overflow horizontal, quantidade acumulando, painel abrindo, remoção funcionando,
e a lista atravessando da loja para a página de produto.

**O que eu faria a seguir nisso:** um campo de observação por item ("me manda
2 caixas se tiver da validade nova") e um jeito de o comerciante repetir o
último pedido. Nenhum dos dois é necessário para a lista servir hoje.

### 02:30 — tarefa 3: eventos no GA4 (commit `54770bf`)

O GA4 estava instalado e media só pageview. Agora mede o funil inteiro.

**O que passa a ser medido:** clique em WhatsApp **com a origem** (botão
flutuante, lista, rodapé, faixa final, página de produto ou conteúdo — antes só
registrava o texto do link, o que não dizia de onde a pessoa veio); clique em
cartão de produto, com nome, marca e categoria; busca, com o termo e quantos
resultados deu; uso de filtro, com qual, o valor e quantos resultados sobraram;
envio de formulário, e o de cadastro leva o ramo e o bairro — que é o que
interessa para saber de onde vem lead. A lista de pedido já media abrir,
adicionar, remover e enviar.

**Decisão que tomei:** unifiquei os três eventos antigos
(`job_application_submit`, `client_signup_submit`, `contact_form_submit`) num
`formulario_enviado` com parâmetro. Três nomes soltos são chatos de ler em
relatório; um evento com dimensão você filtra e compara.

A busca só mede 1,2 s depois da última tecla. Sem isso, "propolis" viraria oito
eventos e o relatório ficaria inútil.

**A trava do consentimento foi testada nos dois sentidos:** com
`DR_GA_CARREGADO` falso, zero eventos disparam; ligando, voltam a sair. Nada é
medido de quem recusou os cookies.

**Onde isso te serve:** em uma semana você vai saber quais produtos as pessoas
clicam, o que buscam e não acham (termo com zero resultados é pedido de compra
que você está perdendo), de qual página sai mais WhatsApp, e quantas listas são
montadas mas não enviadas.

### 03:05 — tarefa 2: formulário de cadastro em duas etapas (commit `9a4a793`)

Eram **9 campos obrigatórios** para um lead B2B que quase sempre chega do
celular, no balcão, com uma mão livre. Agora são **4**.

**Etapa 1**, obrigatória: CNPJ, nome do responsável, WhatsApp e o consentimento
LGPD. Quem parar aqui já vira lead com CNPJ conferido na Receita — mais
qualificação do que o formulário antigo dava com o dobro dos campos.

**Etapa 2**, opcional: razão social (que a consulta de CNPJ preenche sozinha),
ramo, bairro e mensagem.

**Duas decisões minhas, para você discordar se quiser.** Tirei as duas caixas de
confirmação que eu mesmo tinha criado ontem. A de "Tenho CNPJ ativo" virou
redundante quando o campo passou a consultar a Receita: pedir que a pessoa
confirme o que o site já verificou é atrito sem contrapartida. A de "meu negócio
é mercadinho, farmácia..." era o campo "Ramo de atividade" com outra roupa, e o
campo captura melhor. O consentimento LGPD ficou — é base legal, não pode ser
opcional.

A mensagem do WhatsApp monta só com o que foi preenchido, sem "*Ramo:*" vazio
para quem parou na etapa 1. O evento leva `completou_etapa2`, para você medir
quantos param no meio.

**Verificado** em 375 px: 4 obrigatórios visíveis, barra o avanço com campo
vazio, avança preenchido, envia só com a etapa 1, console limpo, sem overflow.

### 03:35 — tarefa 4: FAQ (commit `d83693f`) — estrutura pronta, esperando você

O `contato.html` já tinha cinco perguntas com `FAQPage`. Faltavam as três do seu
briefing: **prazo de entrega**, **formas de pagamento** e **pré-venda x pronta
entrega**. Entraram, com a resposta marcada em amarelo, e as perguntas
correspondentes estão nos itens 1 a 4 do `PERGUNTAS-PARA-O-ENZO.md`.

**A parte que importa é o que eu impedi.** O gerador de JSON-LD agora pula
pergunta cuja resposta ainda está pendente. Sem isso, o rich snippet do Google
mostraria literalmente "[FALTA: prazo em dias úteis...]" para quem buscasse
"prazo de entrega distribuidora Duque de Caxias" — pior do que não ter snippet
nenhum. Oito perguntas aparecem na página, cinco vão para o schema, e as três
entram sozinhas quando você responder.

**Duas respostas que já estavam no ar continuam vagas** e eu não mexi porque
dependem de você: "Qual a área de entrega?" responde "todo o Rio de Janeiro" e
"Tem pedido mínimo?" responde "pode variar". São exatamente o atrito que o seu
briefing quer tirar. Com os itens 1 e 6 do PERGUNTAS respondidos, viram resposta
de verdade em cinco minutos.

### 04:50 — tarefa 10: páginas de marca (commit `7dbf237`)

Até agora a marca só existia como opção de um `<select>` no filtro da loja.
Robô nenhum abre um `<select>`, então quem procura **"distribuidor Mondelez Rio
de Janeiro"** — que é busca de quem já decidiu comprar — não encontrava nada
nosso. Agora são **18 páginas**, uma por marca, em `/marca/<slug>.html`.

O que tem em cada uma: um resumo escrito só com o que dá para conferir no
catálogo, três contadores reais (produtos, categorias, "só CNPJ"), a grade
completa da marca reaproveitando o mesmo cartão da loja — com o botão
"Adicionar à lista" funcionando igual —, os dois CTAs e a navegação para as
outras 17 marcas. No `<head>`, schema `Brand` e `BreadcrumbList`.

**Não inventei nada.** O texto só afirma o que sai do `data/produtos.json`: o
número de itens, em que categorias eles caem, e as frases de cobertura e de
entrega que já estavam no site. Nada de "marca líder", "pronta entrega" ou
prazo.

**O corte em 4 produtos.** Marca com um ou dois itens viraria uma página de
duas linhas: raso para o Google e beco sem saída para quem chega. Ficaram de
fora Aqua Coco, Ace, Hemovital e Pronabol — 39 dos 426 produtos, que continuam
alcançáveis pela loja e pela página de produto de sempre.

**Como se chega nelas** (página órfã não serve para nada):

- a ficha de 387 páginas de produto passou a linkar "Marca" para a página da
  marca;
- o fim do catálogo ganhou o bloco "Marcas que distribuímos", com as 18;
- as 18 URLs entraram no `sitemap.xml` com priority 0.7, acima das de produto.

**Verificado:** `gerar.js` roda duas vezes sem gerar diferença; `checar-links`
passou 453 páginas e 16.495 referências sem um caminho quebrado; o JSON-LD das
18 é parseável; a grade cai para uma coluna a 375 px; os links da lista de
marcas têm 44 px de altura, que é o alvo de toque de celular; e o botão
"Pedir X no WhatsApp" saiu vermelho sobre branco, legível — era o erro que eu
já tinha cometido com o `.btn-ghost`, então dessa vez fui olhar o elemento
renderizado.

**Um achado no caminho:** o site diz "426 produtos de **16 marcas parceiras**",
mas o catálogo tem **22 marcas distintas**. Não mexi, porque "parceira" pode
ser acordo comercial formal — e aí 16 está certo e é outro número. Virou o
item 14 do `PERGUNTAS-PARA-O-ENZO.md`.

### 05:40 — tarefa 9: página de produto mais funda (commit `54d133c`)

As 426 páginas eram uma foto, cinco linhas de ficha e dois botões — quase
idênticas entre si. Para o Google isso é conteúdo raso, que ele pode nem
indexar; para quem cai ali vindo de uma busca, é beco sem saída, porque não
havia para onde ir a não ser voltar.

**Parágrafo de apresentação.** Montado só do que o `data/produtos.json` sabe:
onde o item se encaixa (linha da marca, como Trident, ou categoria do
catálogo, como Suplementos), a embalagem, os sabores quando o campo traz uma
lista, e como se compra. **Nada de peso, unidades por caixa, EAN ou validade**
— nada disso está no dado.

**Bloco de relacionados.** Até quatro produtos de verdade: primeiro os irmãos
da mesma categoria, depois o resto da marca, mais o link "Ver os N produtos
<marca>". As 426 páginas têm pelo menos um relacionado e a maioria tem quatro.
Isso é o que faz a página deixar de ser folha solta: agora ela leva para outros
produtos, para a página da marca e para a categoria.

**Um erro que estava no ar.** O campo `linha` aparecia na ficha sempre como
"Sabores", mas em boa parte do catálogo ele guarda o nome da linha, não
sabores. O site dizia, literalmente, **"Sabores: Proteção Solar"**. Agora o
rótulo é "Sabores" quando o valor é uma lista separada por vírgula e "Linha"
quando não é.

Detalhe de redação: a frase de abertura não usa artigo antes do nome do
produto. "O Geleia Baldoni Morango" sairia errado em todo nome feminino do
catálogo.

**Verificado:** build idempotente, `checar-links` em 453 páginas e 21.502
referências sem caminho quebrado, a 375 px sem overflow horizontal, a grade de
relacionados em uma coluna e o link da marca com 44 px de alvo de toque. A
página passou de ~14 KB para ~21 KB e as fotos dos relacionados são `lazy`.

**Uma limitação do turno, para você saber:** de madrugada a janela do
navegador embutido parou de conseguir desenhar a página (a máquina ficou com
outra janela na frente), então a partir daqui eu conferi layout medindo o DOM
— largura, número de colunas, altura dos alvos de toque, overflow — em vez de
olhar print. É medida direta do que o navegador calculou, mas não substitui o
seu olho: vale você abrir uma página de produto e uma de marca no celular.

### 06:30 — tarefas 14, 13 e 12: o que o Google lê (commits `a5c72a0`, `11928da`)

Três tarefas de SEO técnico numa tacada, porque mexem no mesmo lugar.

**A ficha da empresa estava solta dentro do `index.html`.** Um bloco JSON-LD
escrito à mão, fora do gerador. Foi assim que "fundada em 1960" ficou meses no
ar sem ninguém ver. Agora sai do `tools/jsonld.js`, com os mesmos valores, e
ganhou um `@id`. Isso importa mais do que parece: sem `@id`, o vendedor das 426
páginas de produto, o prestador da página de serviços e a empresa da home eram
**três empresas diferentes** para o Google. Agora são a mesma.

Entrou também um nó `WebSite` com `SearchAction`, que é o que habilita a caixa
de busca do site dentro do resultado do Google. A busca aceita
`loja.html?q=<termo>` de verdade, então não é promessa vazia.

**Não coloquei horário de funcionamento.** É o item 5 das perguntas e continua
sem resposta. Horário é fato comercial e eu não invento.

**O sitemap jurava que tudo mudou hoje.** As 452 URLs saíam com a data do dia,
toda vez que o gerador rodasse, mesmo sem nada ter mudado. Sitemap assim o
Google aprende a ignorar, e aí a data perde a única função que tem. Agora vem
do git: a data do último commit que tocou cada arquivo. Hoje todas marcam
09/09 porque o turno mexeu em tudo, e isso está certo — daqui para frente elas
se separam sozinhas.

**A auditoria de meta encontrou outra coisa, não o que o briefing supunha.**
O briefing temia descrição repetida nas 434 URLs. Não é o caso: cada página tem
a sua. O problema real era tamanho. **94 dos 426 títulos de produto passavam de
62 caracteres**, o pior com 140 — o catálogo tem nomes como "NutsBITES Vegano -
Bombom de Castanhas, Amendoim, Nibs de Cacau e Canela com Cobertura de
Chocolate Meio Amargo". O Google corta e mostra reticências.

O detalhe que mudou a solução: **o corte não podia ser no fim da descrição.**
Quem lê o resultado da busca precisa chegar em "venda apenas para CNPJ", que é
a frase que evita a visita de consumidor final procurando comprar uma barrinha.
Então o que encurta é o nome do produto, e a descrição sempre termina na frase
do CNPJ. Conferi: as 426 terminam.

A home caiu de 175 para 154 caracteres. A loja dizia "centenas de produtos" —
agora diz 426, número que o build mantém em dia sozinho, e passou a citar
suplementos e cuidados pessoais, que são metade do catálogo e não apareciam. A
404 não tinha nenhuma tag Open Graph: link quebrado compartilhado no WhatsApp
aparecia como caixa vazia. Ganhou as tags, menos `canonical` e `og:url`, que
página de erro não deve declarar porque é servida em qualquer endereço.

**Uma coisa fica anotada e não resolvida:** as 9 páginas de raiz dividem a mesma
imagem de compartilhamento. Resolver pede foto real de cada contexto (o
armazém, a entrega, o catálogo), e isso depende de você.
