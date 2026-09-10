# Perguntas para o Enzo

Tudo que depende de decisão sua ou de dado que não existe no repositório.
Responda em cima de cada linha; o turno da noite lê este arquivo antes de
escrever qualquer texto que dependa desses números.

**Regra que estou seguindo:** nada de inventar fato comercial. Onde falta dado,
fica um marcador `[FALTA: ...]` no site e a pergunta aqui. Distribuidora vive de
confiança — informação errada custa cliente.

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

4. **Pré-venda x pronta entrega.** Qual a diferença na prática para o
   comerciante, e quando ele cai em cada uma?
   → Resposta:

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

11. **As fotos dos 125 produtos sem imagem.** Segue travado. O CSV
    `produtos-sem-foto.csv` (na pasta acima do repositório) tem a lista por
    marca. Por qual caminho: pedir ao fornecedor, press kit oficial, você
    manda o que já tem, ou fotografa?
    → Resposta:

12. **Preço e pedido mínimo por produto.** As 426 páginas dizem "sob consulta".
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
