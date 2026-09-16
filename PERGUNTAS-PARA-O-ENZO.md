# Perguntas para o Enzo

Tudo que depende de decisão sua ou de dado que não existe no repositório.
Responda em cima de cada linha; o turno da noite lê este arquivo antes de
escrever qualquer texto que dependa desses números.

**Regra que estou seguindo:** nada de inventar fato comercial. Onde falta dado,
fica um marcador `[FALTA: ...]` no site e a pergunta aqui. Distribuidora vive de
confiança — informação errada custa cliente.

---

## Esperando só uma escolha sua

**A. Quais produtos entram na "Ofertas da semana"?** A faixa da home está
pronta e desligada. Ligar é escrever os `id` em `data/ofertas.json` e rodar
`npm run build` — leva um minuto. O que preciso de você: quais produtos
destacar e até quando vale (o texto do "até" é livre: "até sexta, 26/09").
Não invento destaque, e a faixa não mostra preço.
→ Resposta (16/09): deixar como está por enquanto; você pediu para eu lembrar
   depois, para avaliarmos de novo. **Lembrete registrado aqui** — quando
   voltarmos ao site, esta é a primeira coisa a revisitar.

**B. Chegou algum "avise-me"?** Desde 16/09, quem busca no catálogo e não acha
nada pode deixar o WhatsApp. O pedido cai no seu e-mail pelo Web3Forms, com o
assunto "procuraram um produto que nao esta no catalogo" e o termo que a pessoa
digitou. Vale olhar de vez em quando: é o mercado dizendo o que falta no mix.
→ Resposta:

---

## Bloqueando conteúdo que já está escrito no site

Estas travam o FAQ, que é a tarefa P0 nº 3.

1. **Pedido mínimo.** Existe? É valor em reais, quantidade de caixas, ou varia
   por região/marca? Hoje o site diz "consulte" em três lugares.
   → Resposta:

2. **Prazo de entrega.** Quantos dias úteis para Duque de Caxias, para a
   Baixada e para o Rio capital? Tem dia fixo de rota por região?
   → Resposta (10/09): gira em torno de 48 horas. Pediu para o site **não
   afirmar** isso como promessa, só dar indício — então o texto usa
   "o normal é", "na maioria das rotas", "costuma", nunca "entregamos em
   48h". Continua faltando: o prazo muda entre Caxias, Baixada e capital?
   Tem dia fixo de rota?

3. **Formas de pagamento aceitas.** Boleto? Prazo (7/14/28)? PIX? Cartão?
   Primeira compra tem regra diferente?
   → Resposta:
   → **Status (15/09):** a pergunta saiu do FAQ da página de contato. Ela estava
   publicada com o marcador `[FALTA: ...]` aparecendo para o cliente. Volta ao ar
   assim que você responder: o bloco está comentado em `contato.html`, é só
   descomentar e trocar o texto.

4. **Pré-venda x pronta entrega.** Qual a diferença na prática para o
   comerciante, e quando ele cai em cada uma?
   → Resposta:
   → **Status (15/09):** mesma coisa da pergunta 3 — fora do ar até ter resposta,
   comentada em `contato.html`.

5. **Horário de funcionamento** do armazém e do atendimento comercial. Preciso
   disso para o schema `LocalBusiness` (tarefa P1 nº 9).
   → Resposta:

## Área de cobertura (tarefa P0 nº 5 e P1 nº 7)

6. **Quais cidades a Distri Rio realmente atende?** O site diz "todo o Rio de
   Janeiro", que é vago demais para página local. Confirmadas até agora só
   Duque de Caxias (sede). Marque as que valem:
   - [ ] Duque de Caxias (sede — já confirmado)
   - [ ] Nova Iguaçu
   - [ ] São João de Meriti
   - [ ] Belford Roxo
   - [ ] Nilópolis
   - [ ] Mesquita
   - [ ] Queimados / Japeri
   - [ ] Magé / Guapimirim
   - [ ] Rio capital — Zona Norte
   - [ ] Rio capital — Zona Oeste
   - [ ] Rio capital — Zona Sul / Centro
   - [ ] Niterói / São Gonçalo
   - [ ] Outras:

   **Só vou criar página local de cidade que você marcar.** Página de lugar
   que a empresa não atende gera ligação que não converte e derruba a
   confiança de quem chega.

7. **A lista de bairros do formulário** ("Quero ser cliente") foi montada por
   mim com 42 opções em 4 grupos. Ela precisa refletir sua área real. O que
   sobra e o que falta?
   → Resposta:

## Prova social (tarefa P0 nº 4)

8. **Depoimentos.** Preciso de 3, cada um com: texto, nome do comércio, bairro
   e autorização para publicar. Sem os três dados eu não publico — o site já
   teve depoimento inventado uma vez e foi removido por isso.
   → Resposta:

9. **Fotos.** Tenho no repositório só duas: `assets/sobre/warehouse.jpg` e
   `assets/sobre/frota.jpg`. Consegue mandar mais do armazém, da frota, da
   equipe? Quanto mais real, melhor.
   → Resposta:

10. **Números que dá para provar.** Quantos comércios atendidos? Quantas
    entregas por mês? Qualquer número que você possa sustentar se um cliente
    perguntar.
    → Resposta:

## Catálogo

11. **As fotos dos 125 produtos sem imagem.**
    → Resposta (14/09): pode pegar do site da própria marca, é distribuidor.
    Resolvido: 82 eram cadastro duplicado (nome da planilha x nome do catálogo
    da marca) e foram unificados, com a URL antiga redirecionando; 6 mais
    apareceram na conferência; 34 ganharam foto da loja oficial. Sobram 5, e
    nenhum por falta de procura:
    - ~~**Fitas de Clareamento Dental Roxa (5, 7 e 12 aplicações)**~~ — saíram do
      catálogo em 15/09, ver 11a. Sobram 2 produtos sem foto.
    - **Gooday Snack Barbecue** — saiu da loja da Mix Nutri e dos varejistas.
      Ainda vendem? Se saiu de linha, melhor tirar do catálogo.
    - **Whey Sachê Chocolate Belga Nutrilatina** — a Nutrilatina não publica
      mais esse display. Mesma pergunta.

11a. **Fitas de Clareamento Dental Roxa.** O nome é idêntico ao da Oi White
    nas farmácias, e a Resolução Anvisa 976/2026 (16/03/2026) mandou recolher
    e proibiu comercialização, distribuição e propaganda das fitas Oiwhite. Na
    planilha elas vieram sem marca e o site as colocou em Abelha Rainha. De
    qual fabricante são? Se forem Oi White, o recomendado é tirar do site.
    → **Resolvido em 15/09 (commit `c01aafd`):** você autorizou tirar. Os três
    cadastros saíram do catálogo (336 → 333 produtos) e os endereços antigos
    viraram redirecionamento para a loja, com `noindex`. **Se o fabricante for
    outro e o produto for regular, me avise que eu devolvo os três cadastros** —
    eles continuam no histórico do git.
    → Resposta (fabricante):

11b. **Fotos refeitas (15/09): o que vale confirmar.** Mondelez, Baly, Apisvida,
    Abelha Rainha e mais sete cards trocaram o recorte do PDF por foto de
    produto. No caminho apareceram quatro pontos que só vocês sabem:
    - **Dois cards unificados.** "Nanoprópolis Blend" tinha a mesma caixa da
      Nanoprópolis Vermelha ("própolis vermelha e própolis verde"), e "Propoflex
      Kids Spray (Mel, Malva e Romã)" era o spray tutti-frutti. Se na planilha
      forem códigos que vocês vendem separado, eu desfaço.
    - **Protetor Solar Facial Vitamina C Abelha Rainha.** O card é FPS 80 (como
      no catálogo), mas as lojas mostram a caixa FPS 40. Qual dos dois vocês
      vendem? Por isso a foto dele não foi trocada.
    - **Trio Original 60 g (4 sabores).** A foto é da embalagem antiga "Trio
      Original"; a marca hoje vende como "Trio Cereais". Ainda existe esse item?
    - **Bubbaloo Balas "Pote".** O nome veio da migração, mas a lâmina mostra
      pacote de 75 g e 82,5 g. Renomeei para o que a lâmina diz.
    → Resposta:

12. **Preço e pedido mínimo por produto.** As páginas de produto dizem "sob consulta".
    Quer publicar faixa de preço, quantidade por caixa, ou manter como está?
    → Resposta:

13. **Descrição dos produtos.** Para enriquecer as páginas (tarefa P1 nº 6) eu
    preciso de conteúdo verdadeiro. Existe algum catálogo do fornecedor em PDF
    ou planilha com descrição, peso e unidades por caixa?
    → Resposta:

14. **"426 produtos de 16 marcas parceiras".** O catálogo tem **22 marcas
    distintas**, não 16. "Parceira" quer dizer acordo comercial formal — e aí
    16 está certo e é outro número, que não é o de marcas do catálogo — ou
    quer dizer só "marcas que a gente distribui"? Se for a segunda, eu faço o
    `tools/gerar.js` preencher esse número junto com os outros contadores e
    ele para de envelhecer sozinho. Não mexi porque é fato comercial.
    → Resposta:

## Técnico

15. **`gh` não está instalado nesta máquina**, então não consigo abrir o Pull
    Request por linha de comando. Vou empurrar a branch e deixar o link de
    abrir o PR com um clique no `RELATORIO-NOITE.md`. Se preferir que eu
    instale o `gh`, me avise.
    → Resposta:

17. **Cabeçalhos de segurança que só o Cloudflare resolve.** O site agora tem
    Content-Security-Policy e Referrer-Policy por `<meta>`, escritas pelo build.
    Três coisas não cabem em `<meta>` e o GitHub Pages não deixa mandar
    cabeçalho HTTP: `frame-ancestors` (impede que alguém coloque o site dentro
    de um iframe e engane o visitante), `Strict-Transport-Security` e
    `X-Content-Type-Options`. O seu DNS já está no Cloudflare em modo
    "DNS only". Se você ligar o proxy (nuvem laranja), dá para adicionar os três
    com uma Transform Rule, de graça. **Não mexi em nada de Cloudflare nem de
    DNS** — você pediu para não mexer, e eu não mexi. Quer que eu escreva o
    passo a passo para você fazer?
    → Resposta:

16. **Anexo de currículo do Web3Forms.** Continua sem teste. O plano gratuito
    historicamente ignora arquivo; se for o caso, o candidato lê "enviado" e o
    currículo se perde.
    → Resposta:

## Depois da auditoria de 15/09

18. **O que só você pode fazer.** A auditoria completa está no laudo que te
    mandei; estes itens dependem de acesso ou de informação que não está no
    repositório. Em ordem de urgência:

    - **HTTPS obrigatório (S-01).** GitHub → repositório `distririo` → Settings →
      Pages → marcar **Enforce HTTPS**. Hoje `http://distririo.com.br` abre sem
      criptografia. Um clique.
    - **Publicar só o site (S-02) e proteger a `main` (P-02).** Deixei pronto o
      fluxo de publicação por GitHub Actions. Para ligar: Settings → Pages →
      Source → **GitHub Actions**. Depois, Settings → Branches → Add rule em
      `main` exigindo a verificação. Enquanto não ligar, `robots.txt` já pede ao
      Google para não indexar `/tools/`, `/data/` e os `.md`.
    - **E-mail difícil de falsificar (S-03).** No painel de DNS (Cloudflare):
      trocar o registro TXT do SPF de `?all` para `~all`
      (`v=spf1 include:spf.whservidor.com ~all`) e, depois de uma semana lendo os
      relatórios, mudar `_dmarc` de `p=none` para `p=quarantine`.
    - **Cabeçalhos de segurança (S-04).** Ligar o proxy da Cloudflare (nuvem
      laranja) nos registros do site e criar uma Transform Rule de resposta com
      `Strict-Transport-Security: max-age=31536000`, `X-Content-Type-Options: nosniff`,
      `X-Frame-Options: SAMEORIGIN` e `Permissions-Policy: geolocation=(), camera=(), microphone=()`.
      Não mexi em nada de DNS, como combinado.
    - **CNPJ e porte da empresa (L-03, L-04).** Preciso do número para publicar no
      rodapé e na política, e saber se é ME/EPP para dizer certo quem cuida dos
      dados.
    - **Teste do currículo (F-03).** Mande uma candidatura de teste com PDF em
      `trabalhe-conosco.html` e confirme se o anexo chega no e-mail. Pelo que
      encontrei, o plano gratuito do Web3Forms não manda anexo.
    - **Monitoramento e medição (R-01, N-01).** Criar conta no UptimeRobot (grátis)
      apontando para a home, a loja e o cadastro, e ligar o Cloudflare Web
      Analytics, que mede sem cookie e sem depender do aceite do banner.
    - **Conta do GitHub (R-02).** Ligar verificação em duas etapas e guardar os
      códigos de recuperação. Quem entra nessa conta publica no site em 60 s.
    - **Prova social (item 8) e cidades atendidas (item 6).** Continuam sendo o
      maior ganho de conversão que falta.
    → Resposta:

19. **Cópia do cadastro por e-mail.** "Quero ser cliente" passou a mandar uma
    cópia do cadastro (CNPJ, responsável, telefone, empresa, ramo e bairro) para
    o e-mail, além de abrir o WhatsApp — antes, quem desistia na tela do WhatsApp
    sumia sem deixar contato. A política de privacidade foi atualizada. Se você
    preferir que volte a ser só WhatsApp, é uma linha para desfazer.
    → Resposta:

---

## Correções ao briefing

Conferido contra o repositório em 09/09, 01:05. O briefing foi escrito a partir
de uma análise do site **antes do trabalho de ontem**, então parte dele já está
entregue.

**Já estava pronto — o turno não vai refazer:**

| Tarefa do briefing | Situação |
|---|---|
| 7. Mapa na contato ("não existe nenhum iframe") | Existe, feito ontem, com endereço, referências e botão de rota |
| 20. `catalogo.json` como fonte única | Feito ontem como `data/produtos.json` + `tools/gerar.js` |
| 21. Script de verificação | Feito ontem: `checar-links.js` e `orfas.js` |
| 27. Estado de "nenhum resultado" | Feito ontem, com CTA de WhatsApp |
| 404.html | Já existe, com busca e CTA |

**Números que não batiam:**

| Briefing | Realidade |
|---|---|
| `assets/style.css` | O CSS está em `style.css`, na raiz |
| 428 produtos e 428 páginas | **426** — a unificação de ontem reduziu |
| "Nenhum formulário tem honeypot" | `trabalhe-conosco.html` tem `botcheck`; os outros dois não |
| `loja.html` 505 KB, `app.js` 59 KB | 511 KB e 60 KB |

**Confirmado, e são bons achados:**

- **Contadores entregam `0` no HTML.** `<div data-count-to="426">0</div>` — o
  Google e os previews de link leem "0 Produtos no catálogo". É o melhor achado
  do briefing e subiu na fila.
- **`lastmod` igual nas 434 URLs** do sitemap.
- **`@media print` ausente.**
- **Nenhum `srcset` de largura.** Os 301 da loja são `<source>` de formato
  (WebP/AVIF), não de largura — a crítica de banda está certa.
