# Sincronizar o catálogo do site com o WinThor

O objetivo é só manter o catálogo do site igual ao catálogo e ao estoque do
WinThor, sem mudar o que o cliente vê: nada de preço, nada de quantidade.
Produto que saiu de linha ou está zerado some do site; produto novo entra.

## O que falta para ligar

### 1. Uma saída do WinThor (o Enzo precisa pedir)

Qualquer uma das três resolve, em ordem de preferência:

- **Exportação automática em arquivo** — a mais fácil de liberar, porque não dá
  acesso ao banco. Quem cuida do WinThor agenda uma rotina que grava todo dia,
  de madrugada, um CSV com `codigo;descricao;estoque` numa pasta ou num e-mail.
- **Usuário Oracle só de leitura** — `SELECT` em `PCPRODUT` (cadastro) e `PCEST`
  (estoque por filial). Permite conferir tudo sem depender de ninguém.
- **API do WinThor** (WinThor Anywhere / TOTVS API), se a licença tiver.

### 2. O de-para dos produtos

O catálogo do site não tem o código do WinThor, então não há como casar os dois
automaticamente. O arquivo `de-para-winthor.csv` tem os 333 produtos do site
com a coluna `codigo_winthor` em branco. Alguém do escritório preenche uma vez,
olhando o cadastro do WinThor; depois disso a sincronização roda sozinha.

Abra no Excel (o arquivo já vem com separador `;` e acentuação certa), preencha
a última coluna e salve mantendo o formato CSV.

## Como vai funcionar depois de ligado

Uma rotina noturna lê a saída do WinThor, compara com `data/produtos.json`,
esconde o que zerou ou saiu de linha, lista o que é novo, roda
`node tools/build.js` e publica. Produto novo entra sem foto nem descrição, por
isso ele fica numa lista de pendências em vez de ir direto ao ar — foto e texto
continuam sendo decisão de quem cuida do site.

## A foto do produto novo

O WinThor traz código, descrição e estoque — nunca a imagem. Então a foto
continua sendo um passo à parte, com as regras que já valem para o site e estão
em `tools/fotos/LEIAME.md`: foto do site oficial da marca (o Enzo autorizou, por
ser distribuidor), ou do varejo que vende o mesmo SKU, conferindo embalagem e
gramatura. JPG quadrado de 800x800, fundo branco, 7% de margem, instalada por
`python tools/fotos/instalar.py <marca> <arquivo> <id>`.

O site aguenta produto sem foto: o cartão mostra a inicial do nome sobre o nome
da marca, sem quebrar a grade. Mas um catálogo cheio desses cartões fica ruim,
por isso a rotina noturna não publica produto novo sozinha — ela junta os novos
num aviso, com o comando da foto já montado, e quem cuida do site aprova.

Vale lembrar que 2 dos 333 produtos de hoje ainda estão sem foto, e que já
houve uma leva de 125 resolvida em setembro: foto é o gargalo conhecido do
catálogo, e ligar o WinThor vai aumentar o volume, não diminuir.
