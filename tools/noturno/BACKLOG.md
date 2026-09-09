# Fila do turno da noite

Ordem do briefing do Enzo: P0 (conversão) antes de P1 (SEO), antes de P2
(desempenho), antes de P3 (design). Não pule para o item bonito antes de fechar
o que dá dinheiro.

Um item por execução. Ao concluir, marque `[x]` e escreva numa linha o que foi
feito, com o hash do commit. Achou algo novo: anote em "Encontrado durante o
turno", não saia fazendo.

Legenda: `[ ]` pendente · `[x]` feito · `[!]` tentado e falhou (com o motivo)
· `[?]` travado esperando resposta no `PERGUNTAS-PARA-O-ENZO.md`

---

## P0 — Conversão

- [ ] **1. Lista de pedido no catálogo.** A maior lacuna do site: ele promete
  "você manda a lista e a gente confirma na conversa", mas o catálogo não deixa
  montar lista nenhuma. Botão "+ Adicionar à lista" em cada card da `loja.html`
  e na página de produto; contador flutuante; painel com ajuste de quantidade e
  remoção; persistência em `localStorage` seguindo o padrão que já existe no
  `app.js` (`guardar`/`recuperar`); botão "Enviar lista no WhatsApp" montando
  mensagem em `wa.me` com nome, marca e quantidade. Limitar a ~2000 caracteres:
  passando disso, mandar as primeiras linhas e avisar que a lista completa segue
  na conversa. JS puro, sem dependência. **Item grande: quebre em partes e faça
  a primeira.**

- [ ] **2. Eventos no GA4.** O GA4 está instalado e não mede nada acionável.
  Eventos em: clique em botão de WhatsApp (com a página de origem), envio de
  cada formulário, clique em card de produto, uso da busca (com o termo), uso
  dos filtros, e cada passo da lista de pedido. Respeitar o consentimento: só
  dispara se `window.DR_GA_CARREGADO` for verdadeiro.

- [ ] **3. FAQ com schema FAQPage.** Perguntas que todo comerciante faz antes de
  chamar no WhatsApp: pedido mínimo, prazo, região, pagamento, exigência de
  CNPJ, pré-venda x pronta entrega. **As respostas dependem do Enzo** — montar a
  estrutura, escrever as perguntas, deixar cada resposta como `[FALTA: ...]` e
  conferir que a pergunta correspondente está no `PERGUNTAS-PARA-O-ENZO.md`
  (itens 1 a 4).

- [ ] **4. Prova social.** Estrutura para depoimentos, fotos reais e números
  verificáveis. **Só material que já existe no repositório** — hoje são duas
  fotos (`assets/sobre/warehouse.jpg` e `frota.jpg`). O resto já está pedido nos
  itens 8, 9 e 10 do PERGUNTAS. O site já teve depoimento inventado uma vez e
  foi removido por isso: não repetir.

- [ ] **5. Área de cobertura explícita.** "Atendemos todo o Rio de Janeiro" é
  vago. Depende da resposta ao item 6 do PERGUNTAS. Sem ela, só Duque de Caxias
  é fato confirmado. Montar a estrutura e marcar o resto.

## P1 — SEO

- [ ] **6. Páginas de produto estão rasas.** 426 páginas de ~14 KB com marca,
  categoria e sabores, quase idênticas entre si — o Google trata como conteúdo
  raso e pode não indexar. Enriquecer o template em
  `tools/partials/produto.html`: apresentação, produtos relacionados da mesma
  marca, link para a página da marca, CTA melhor. **Não inventar especificação**
  (peso, unidades por caixa, EAN, validade).

- [ ] **7. Páginas locais.** Só criar de lugar que a empresa realmente atende.
  Enquanto o item 6 do PERGUNTAS não for respondido, **fazer apenas Duque de
  Caxias**, que é a sede e fato confirmado. Conteúdo próprio e útil, não doorway
  page recheada de keyword.

- [ ] **8. Páginas de marca.** 16 marcas parceiras, nenhuma página própria.
  "Distribuidor Mondelez Rio de Janeiro" é busca de intenção alta. Uma página
  por marca agregando os produtos daquela marca, com schema `Brand`. Gerar pelo
  `tools/gerar.js`, a partir do `data/produtos.json`, como as de produto.

- [ ] **9. Reforçar o structured data.** `LocalBusiness` com horário (depende do
  item 5 do PERGUNTAS), `Organization`, `WebSite` com `SearchAction`, e
  `BreadcrumbList` onde ainda faltar. Validar antes de commitar.

- [ ] **10. Atualizar `sitemap.xml`** com as páginas novas, mantendo o formato
  atual. Já é gerado pelo `tools/gerar.js`.

## P2 — Desempenho

- [ ] **11. `loja.html` pesa 511 KB.** 426 cartões num arquivo só. Já tem
  `content-visibility: auto` por seção com altura estimada. Medir o que isso já
  entrega antes de trocar de abordagem, e só então avaliar renderização
  progressiva ou "carregar mais". Registrar tamanho do HTML, número de nós no
  DOM e LCP, antes e depois. **Cuidado:** o `content-visibility` já causou
  problema de âncora e de rolagem antes; ler o comentário no `style.css`.

- [ ] **12. Hero da home.** O carrossel demora a pintar e fica um bloco escuro —
  é o LCP do site. Já tem `fetchpriority="high"` na primeira imagem e dimensões
  explícitas. Falta `preload` da primeira e um fundo enquanto carrega. As
  imagens já foram comprimidas (4,8 MB para 203 KB); conferir se dá para mais.

- [ ] **13. Refatorar `app.js` (60 KB).** Separar por responsabilidade com
  módulos ES nativos (`type="module"`), sem bundler, carregando só o que cada
  página precisa. **Fazer depois que a lista de pedido estiver funcionando.**
  Testar página por página.

- [ ] **14. Otimizar imagens de produto.** Conferir WebP/AVIF, dimensões,
  `width`/`height` e `loading="lazy"`. As 10 sem lazy na loja são as 8 acima da
  dobra (propositais) mais 2 — conferir se as 2 são intencionais.

## P3 — Design, mobile e acessibilidade

O Enzo liberou implementar redesenho. Carregue a skill `frontend-design` antes
de mexer em aparência, um redesenho por commit, registre o porquê no
`tools/noturno/PROPOSTAS.md`. Não reabra as decisões fechadas do `REGRAS.md`.

- [ ] **15. Auditoria mobile.** Todas as páginas em 375 px e 414 px: overflow
  horizontal, texto pequeno, carrossel difícil no dedo, filtros ocupando meia
  tela, botão do WhatsApp cobrindo conteúdo, formulário chato de preencher.

- [ ] **16. Alvos de toque.** Elementos clicáveis com menos de 44 px de altura,
  nos caminhos críticos: navegação, filtros, cards, CTAs.

- [ ] **17. Acessibilidade.** Contraste em toda a paleta nova (mudou de bege
  para cinza neutro ontem), foco visível, navegação por teclado, `aria-label`
  faltando, e pausa real do carrossel e do ticker.

- [x] **18. Página 404.** JÁ EXISTE, criada antes da noite: `404.html` com
  busca, links de categoria e CTA de WhatsApp.

- [ ] **19. Consistência visual.** Só depois de tudo acima. Espaçamentos,
  hierarquia tipográfica e uso da cor de destaque. Não redesenhar o site — a
  identidade é do cliente.

## Segurança

- [ ] **20. Antispam nos formulários.** `trabalhe-conosco.html` tem honeypot
  (`botcheck`); `quero-ser-cliente.html` e `contato.html` não têm nada.
  Adicionar equivalente e descartar envio que vier com o campo preenchido. Sem
  chave nova, sem serviço novo, sem mexer na chave existente.

## Extras herdados da fila anterior

Não estão no briefing, mas já estavam levantados. Fazer só depois do P3.

- [x] **Política de privacidade não declarava a consulta de CNPJ.** FEITO,
  commit `ae03ac6`.
- [x] **Política não mencionava o campo Bairro.** FEITO, commit `ae03ac6`.
- [ ] **`Referrer-Policy`** não declarada. Meta no `<head>`, pelo build.
- [ ] **Content-Security-Policy** ausente. Meta `http-equiv`, começando em
  `report-only` numa página só. Cobrir Google Fonts, Analytics, Maps, BrasilAPI
  e Web3Forms.
- [ ] **`rel="noopener"`** — escrever a checagem no `tools/checar-links.js`.
- [ ] **Duplicatas no `style.css`** (`.form-consent`, `.category-bar`,
  `.category-chip`, `.hero`, `.hero-carousel-next`, `.whatsapp-float`). Foi um
  par assim (`.btn-ghost`) que deixou um botão ilegível no ar.

---

## Encontrado durante o turno

(acrescente aqui o que descobrir, em vez de sair implementando)
