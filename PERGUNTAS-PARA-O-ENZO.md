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
   → Resposta:

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

## Técnico

14. **`gh` não está instalado nesta máquina**, então não consigo abrir o Pull
    Request por linha de comando. Vou empurrar a branch e deixar o link de
    abrir o PR com um clique no `RELATORIO-NOITE.md`. Se preferir que eu
    instale o `gh`, me avise.
    → Resposta:

15. **Anexo de currículo do Web3Forms.** Continua sem teste. O plano gratuito
    historicamente ignora arquivo; se for o caso, o candidato lê "enviado" e o
    currículo se perde.
    → Resposta:

---

## Correções ao briefing (só para registro)

Confer o que o briefing afirmava contra o repositório, em 09/09 00:55:

| Briefing dizia | Realidade |
|---|---|
| `assets/style.css` | O CSS está em `style.css`, na raiz |
| 428 produtos e 428 páginas | **426** produtos e 426 páginas |
| `loja.html` ~505 KB | 511 KB |
| `app.js` ~59 KB | 60 KB |
| "Verifique se existe `404.html`" | **Já existe**, com busca e CTA — tarefa 18 já está feita |
| sitemap com 434 URLs | Confere |
| 10 imagens sem `lazy` na loja | Confere — são as 8 acima da dobra, propositais, mais 2 |
| honeypot nos formulários | Só `trabalhe-conosco.html` tem; cliente e contato não têm |
