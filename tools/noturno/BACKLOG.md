# Fila do turno da noite

Ordem do briefing do Enzo: P0 (conversão) → P1 (SEO) → P2 (desempenho) →
P3 (estrutura) → P4 (design). Não pule para o item bonito antes de fechar o que
dá dinheiro.

Um item por execução. Ao concluir, marque `[x]` com o hash do commit. Achou algo
novo: anote em "Encontrado durante o turno", não saia fazendo.

Legenda: `[ ]` pendente · `[x]` feito · `[!]` tentado e falhou (com o motivo)
· `[?]` travado esperando resposta no `PERGUNTAS-PARA-O-ENZO.md`

> **Antes de começar qualquer tarefa, leia a seção "Tarefas que o briefing pede
> mas já estão prontas", no fim deste arquivo.** Cinco tarefas do briefing foram
> feitas ontem. Não refaça.

---

## P0 — Conversão

- [x] **1. Lista de pedido no catálogo.** FEITO, commit `f439cf2`. Botão nos 426 cartões e nas 426 páginas de produto, contador flutuante, painel com quantidade e remoção, localStorage, e mensagem de WhatsApp cortada pelo tamanho da URL. **Falta:** medir com gente de verdade e avaliar se o painel deveria ter campo de observação por item.

<!-- original: **1. Lista de pedido no catálogo.** A maior lacuna: o site promete "você
  manda a lista e a gente confirma na conversa", e o catálogo não deixa montar
  lista nenhuma. Botão "+ Adicionar à lista" em cada card da `loja.html` e na
  página de produto; contador flutuante; painel com quantidade e remoção;
  persistência em `localStorage` seguindo `guardar`/`recuperar` do `app.js`;
  botão "Enviar lista no WhatsApp" montando mensagem em `wa.me` com produto,
  marca e quantidade. Limite ~2000 caracteres: passando disso, mandar as
  primeiras linhas e avisar que a lista completa segue na conversa. JS puro.
  **Item grande: faça uma parte inteira e funcionando por execução.** -->

- [x] **8. Contadores entregam "0" no HTML.** FEITO, commit `3f02f4b`. Os dez contadores das tres paginas passam a sair do `data/produtos.json` no build, com o numero real escrito no HTML. De quebra, o total em texto corrido tambem: dizia 428 em seis lugares e o catalogo tem 426.

<!-- original: -->
<!-- **8. Contadores entregam "0" no HTML.** *(subiu de prioridade — é bug de
  SEO com dano desproporcional e conserto de minutos.)* `index.html` e
  `sobre.html` escrevem `<div class="stat-number" data-count-to="426">0</div>`.
  O Google, os previews de link e quem tem JS bloqueado leem "0 Produtos no
  catálogo", "0 Anos de mercado", "0 Marcas parceiras". Colocar o número real no
  HTML e fazer o JS animar de 0 até o valor que já está lá. O JS está em
  `app.js`, seção "Contadores". -->

- [x] **2. Enxugar o formulário de cadastro.** FEITO, commit `9a4a793`. De 9 campos obrigatórios para 4. Etapa 1: CNPJ, nome, WhatsApp e consentimento. Etapa 2 opcional. As duas caixas de confirmação saíram — a de CNPJ ativo virou redundante com a consulta à Receita.

- [x] **3. Eventos no GA4.** FEITO, commit `54770bf`. whatsapp_click com origem, produto_clique, busca com termo e resultados, filtro_usado, formulario_enviado e os quatro da lista. Trava do consentimento testada nos dois sentidos.

- [?] **4. FAQ com schema FAQPage.** ESTRUTURA FEITA, commit `d83693f`. O contato.html ja tinha 5 perguntas; entraram as 3 que faltavam (prazo, pagamento, pre-venda x pronta entrega) com resposta marcada. O gerador de JSON-LD pula pergunta pendente, para nao vazar "[FALTA]" pro Google. **Travado nos itens 1 a 4 do PERGUNTAS.**

- [ ] **5. Prova social.** Estrutura para depoimentos, fotos reais e números
  verificáveis. **Só material que já existe no repositório**: hoje são duas
  fotos (`assets/sobre/warehouse.jpg` e `frota.jpg`). O site já teve depoimento
  inventado uma vez e foi removido por isso. Ver itens 8 a 10 do PERGUNTAS.

- [ ] **6. Área de cobertura explícita.** "Atendemos todo o Rio de Janeiro" é
  vago. Depende do item 6 do PERGUNTAS. Sem resposta, só Duque de Caxias é fato.

## P1 — SEO

- [x] **9. Páginas de produto estão rasas.** FEITO (commit `54d133c`):
  apresentação montada do catálogo, bloco de até 4 relacionados com link para a
  página da marca, e o rótulo "Sabores" corrigido para "Linha" onde o campo não
  traz sabores. Texto original: 426 páginas de ~14 KB com marca,
  categoria e sabores, quase idênticas — o Google trata como conteúdo raso e
  pode não indexar. Enriquecer `tools/partials/produto.html`: apresentação,
  produtos relacionados da mesma marca, link para a página da marca, CTA melhor.
  **Não inventar especificação** (peso, unidades por caixa, EAN, validade).

- [x] **10. Páginas de marca.** FEITO (commit `7dbf237`). 18 páginas em
  `/marca/<slug>.html`, uma por marca com 4+ produtos, geradas pelo
  `tools/gerar.js` a partir do `data/produtos.json`. Schema `Brand` +
  `BreadcrumbList`, resumo escrito só com o que dá para conferir no catálogo,
  grade completa da marca e navegação para as outras 17. Entradas: link "Marca"
  na ficha de 387 produtos, bloco "Marcas que distribuímos" no fim do catálogo,
  e as 18 URLs no `sitemap.xml` com priority 0.7. Aqua Coco, Ace, Hemovital e
  Pronabol ficaram de fora do corte (menos de 4 itens) — publicar página de duas
  linhas é conteúdo raso e beco sem saída.

- [x] **12. Auditar Open Graph e meta description página a página.** FEITO
  (commit `11928da`). Cada página já tinha meta própria — o medo do briefing
  não se confirmou. O que estava errado: 94 títulos de produto acima de 62
  caracteres (o pior com 140) e 94 descrições acima de 158 (a pior com 219),
  a home com 175, a loja dizendo "centenas de produtos" e a 404 sem nenhuma
  tag Open Graph. Tudo corrigido; `og:title` ficou com o nome inteiro.
  **Sobrou:** as 9 páginas de raiz dividem a mesma `og:image` — precisa de
  foto real de cada contexto, que depende do Enzo. Texto original: Conferir se
  cada página tem `og:title`, `og:description` e `<meta description>` próprios
  ou se repetem o texto da home. Descrição duplicada em 434 URLs é desperdício.

- [x] **13. `lastmod` real no sitemap.** FEITO (commit `a5c72a0`). A data vem
  do `git log` por arquivo; arquivo com alteração não commitada usa hoje,
  porque mudou agora; sem git, cai para hoje e o build não quebra. Texto
  original: Confirmado: **as 434 URLs têm a mesma
  data**. Gerar por arquivo a partir do histórico do git, no `tools/gerar.js`.

- [x] **14. Reforçar o structured data.** FEITO (commit `a5c72a0`). A ficha
  `Wholesaler` saiu do `index.html` escrita à mão e passou para o
  `tools/jsonld.js`, com `@id` — antes o `seller` dos produtos, o `provider`
  de serviços e a empresa da home eram três organizações diferentes para o
  Google. Entrou `WebSite` com `SearchAction` (a busca aceita
  `loja.html?q=` de verdade). **Sem `openingHours`:** depende do item 5 do
  PERGUNTAS. São 900 blocos JSON-LD no site, todos parseáveis. Texto
  original: `LocalBusiness` com horário (item 5 do
  PERGUNTAS), `Organization`, `WebSite` com `SearchAction`, e `BreadcrumbList`
  onde faltar. Validar antes de commitar.

- [ ] **11. Páginas locais.** Só de lugar que a empresa realmente atende.
  Enquanto o item 6 do PERGUNTAS não for respondido, **fazer apenas Duque de
  Caxias**, que é a sede e fato confirmado. Conteúdo próprio e útil, não doorway
  page recheada de keyword.

## P2 — Desempenho

- [ ] **15. Nenhuma imagem usa `srcset` com largura.** Confirmado: os 301
  `srcset` da `loja.html` são `<source>` de formato (WebP/AVIF), não de largura.
  As fotos de produto são **500×500 servidas em cards de ~245 px**, e as do hero
  são 1600 px entregues também no celular. Com 303 imagens, é o maior
  desperdício de banda do site. Gerar 2 ou 3 larguras e montar `srcset` + `sizes`
  corretos. Processar com script Node local (`tools/webp-produtos.py` já faz algo
  parecido) — sem dependência no deploy.

- [ ] **16. `loja.html` pesa 511 KB.** Já tem `content-visibility: auto` por
  seção com altura estimada. **Medir o que isso já entrega antes de trocar de
  abordagem**, e só então avaliar renderização progressiva ou "carregar mais".
  Registrar tamanho do HTML, nós no DOM e LCP, antes e depois. **Cuidado:** o
  `content-visibility` já causou problema de âncora e de rolagem; ler o
  comentário no `style.css`.

- [ ] **17. Hero da home.** Demora a pintar e fica um bloco escuro — é o LCP.
  Já tem `fetchpriority="high"` na primeira e dimensões explícitas. Falta
  `preload` da primeira e um fundo enquanto carrega. As imagens já caíram de
  4,8 MB para 203 KB; conferir se dá para mais.

- [ ] **18. As 10 imagens sem `loading="lazy"` na `loja.html`.** São as 8 acima
  da dobra (propositais, com `fetchpriority="high"`) mais 2. Conferir se as 2
  são intencionais e corrigir se não forem.

- [ ] **19. Refatorar `app.js` (60 KB).** Módulos ES nativos (`type="module"`),
  carregando só o que cada página precisa, sem bundler. **Depois** que a lista de
  pedido estiver funcionando. Testar página por página.

## P3 — Estrutura e manutenção

- [ ] **23. `README.md` de manutenção.** Existe `tools/LEIAME.md` cobrindo o
  fluxo do catálogo, mas não há README na raiz. Escrever: organização do
  repositório, como adicionar produto, como trocar a imagem do hero, como o
  deploy funciona (push na `main` → GitHub Pages), e o que **não** mexer (DNS,
  CNAME, chaves, ID do GA4). Daqui a três meses ninguém lembra.

- [x] **22. Antispam nos formulários.** FEITO (commit `3a755b4`), mas a
  premissa estava errada e vale registrar: `quero-ser-cliente` e `contato`
  **não enviam nada para servidor nenhum** — só montam uma mensagem de
  WhatsApp. Robô preenchendo ali não gera e-mail nem lead. O que ele gera é
  um `formulario_enviado` no GA4, que suja a conversão. O honeypot entrou por
  esse motivo. Só a `trabalhe-conosco` posta no Web3Forms, e essa já tinha.

## P4 — Design, mobile e acessibilidade

O Enzo liberou implementar redesenho. Carregue a skill `frontend-design` antes
de mexer em aparência, um redesenho por commit, registre o porquê em
`tools/noturno/PROPOSTAS.md`. Não reabra as decisões fechadas do `REGRAS.md`.
**Não redesenhe o site** — a identidade é do cliente e está boa.

- [ ] **24. Auditoria mobile.** Todas as páginas em 375 px e 414 px: overflow
  horizontal, texto pequeno, carrossel difícil no dedo, filtros ocupando meia
  tela, botão do WhatsApp cobrindo conteúdo, formulário chato com uma mão.

- [ ] **25. Alvos de toque.** Clicáveis com menos de 44 px de altura, no caminho
  crítico: navegação, filtros, cards, CTAs.

- [ ] **26. Acessibilidade.** O CSS já tem `focus-visible` e
  `prefers-reduced-motion`. Completar: contraste na paleta nova (mudou de bege
  para cinza neutro ontem), navegação por teclado, `aria-label` faltando, pausa
  real do carrossel e do ticker.

- [ ] **28. Folha de impressão.** O `style.css` não tem `@media print`
  (confirmado). Comerciante imprime lista de pedido e catálogo. Fazer para
  `loja.html`, páginas de produto e a lista de pedido. Entrega barata e
  genuinamente útil no balcão.

- [ ] **29. Revisar `servicos.html`.** Conferir se vende o serviço — diferença
  entre pré-venda e pronta entrega, logística, o que o comerciante ganha — ou se
  é texto genérico. Melhorar com o que já existe de verdade, sem inventar.
  Ontem a página perdeu duas seções repetidas e ficou curta.

- [ ] **30. Consistência visual.** Só depois de tudo acima. Espaçamentos,
  hierarquia tipográfica, uso da cor de destaque.

## Herdados da fila anterior

Fora do briefing, já levantados. Depois do P4.

- [x] **`Referrer-Policy`** FEITO (commit `3a755b4`):
  `strict-origin-when-cross-origin`, escrita pelo build em todas as páginas.
- [x] **Content-Security-Policy** FEITO (commit `3a755b4`). Duas correções ao
  plano original: **`report-only` não existe em `<meta>`** (só em cabeçalho
  HTTP, que o GitHub Pages não deixa mandar), então foi direto para a política
  valendo, verificada página por página no navegador antes de commitar; e em
  vez de `script-src 'unsafe-inline'` o build calcula o **hash SHA-256** do
  bloco inline de cada página. **`frame-ancestors` ficou de fora**: em `<meta>`
  o browser ignora. Virou item 17 do PERGUNTAS — só com Cloudflare na frente.
- [x] **`rel="noopener"`** FEITO (commit `3a755b4`): a checagem entrou no
  `tools/checar-links.js` e achou uma ocorrência na `trabalhe-conosco.html`.
- [ ] **Duplicatas no `style.css`** (`.form-consent`, `.category-bar`,
  `.category-chip`, `.hero`, `.hero-carousel-next`, `.whatsapp-float`). Foi um
  par assim (`.btn-ghost`) que deixou um botão ilegível no ar.

---

## Tarefas que o briefing pede mas já estão prontas

Conferido no repositório em 09/09, 01:05. **Não refazer.**

- [x] **7. Mapa na página de contato.** O briefing diz "não existe nenhum
  `<iframe>` no site". Existe: `contato.html` tem o mapa incorporado, com
  endereço ao lado, referências de como chegar, aviso de retirada no local e
  botões de traçar rota e combinar retirada. Feito ontem.

- [x] **20. `catalogo.json` como fonte única.** Feito ontem, com outro nome:
  `data/produtos.json` é a fonte, e `tools/gerar.js` regenera `loja.html`, as
  426 páginas de produto, o índice de busca, o `sitemap.xml`, `robots.txt`, o
  manifesto, a 404 e o cabeçalho/rodapé de todas as páginas. O build é
  idempotente e o deploy continua sendo commitar HTML. **O que falta desta
  tarefa:** os números de estatística ainda são escritos à mão no HTML — isso
  está coberto pela tarefa 8.

- [x] **21. Script de verificação.** Feito ontem, dividido em dois:
  `tools/checar-links.js` (links internos, imagens e âncoras nas 434 URLs) e
  `tools/orfas.js` (imagem sem referência). **O que falta:** checar `canonical`,
  `og:title`, `og:description`, um `<h1>` por página e placeholder esquecido —
  juntar isso na tarefa 12.

- [x] **27. Estado de "nenhum resultado" na busca.** Feito ontem: mensagem mais
  botão "Perguntar no WhatsApp se temos", já com o termo digitado na mensagem.

- [x] **Página 404.** Existe, com busca, links de categoria e CTA de WhatsApp.

---

## Encontrado durante o turno

(acrescente aqui o que descobrir, em vez de sair implementando)

- **"426 produtos de 16 marcas parceiras" está desencontrado do catálogo.** O
  `data/produtos.json` tem **22 marcas distintas**, não 16. Não mexi no texto
  porque "parceira" pode significar acordo comercial formal, e aí 16 estaria
  certo e o número não seria o de marcas do catálogo. Pergunta para o Enzo
  (item novo no `PERGUNTAS-PARA-O-ENZO.md`). Se for só "marcas que a gente
  distribui", o `tools/gerar.js` passa a preencher esse número junto com os
  outros contadores, e ele para de envelhecer sozinho.
