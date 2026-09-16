# Fotos de produto e cadastros duplicados

O que estava fora do repositório e voltou para cá: as duas ferramentas que
sustentam o padrão das fotos e a unificação de cadastro. Sem elas, repetir o
trabalho de setembro dependia de reconstruir tudo do zero.

## De onde a foto pode vir

O Enzo autorizou em 14/09 usar a foto de produto do **site oficial da marca**
que a Distri Rio distribui — ele é distribuidor e tem essa permissão. Quando a
marca não publica a linha, vale o **varejo que vende o mesmo SKU**, conferindo
embalagem e gramatura na imagem antes de instalar.

Não vale: banco de imagens, site de concorrente, foto de marketplace sem
relação com o fabricante, montagem feita à mão.

**Nunca use a mesma foto em dois produtos.** Se duas fichas mostram a mesma
embalagem, provavelmente são o mesmo produto cadastrado duas vezes — o caso do
`unificar.js` abaixo.

## O padrão

JPG quadrado de **800 × 800**, fundo branco, **7% de margem**, embalagem
centralizada, sem sombra dura nem texto de anúncio em volta. O site serve o
WebP de 500 px gerado por `npm run imagens`; o JPG fica como reserva.

## Instalar uma foto

```bash
python tools/fotos/instalar.py mondelez ~/baixados/bis-10.png bis-10
npm run imagens
npm run build && npm run checar
```

O script achata a transparência sobre branco, recorta a sobra em volta, encaixa
no quadrado com a margem certa, salva com qualidade 88 (baixando até caber em
200 KB) e já aponta o campo `img` do produto.

Aceita vários pares de uma vez:

```bash
python tools/fotos/instalar.py baly foto1.png baly-tradicional foto2.png baly-melancia
```

## Unificar cadastro duplicado

```bash
node tools/fotos/unificar.js <id-que-fica> <id-que-some> [mais ids...]
npm run build && npm run checar
```

O id que some vira redirecionamento em `data/redirecionamentos.json`, e o build
gera a página antiga com `noindex` e `canonical` para a que ficou — o endereço
velho pode estar no Google ou num WhatsApp já enviado. Embalagens e SKUs do
cadastro absorvido são mantidos no que fica.

## Conferir antes de commitar

Olhe as fotos novas lado a lado (qualquer visualizador serve) e pergunte:
a embalagem está inteira? é o sabor certo? a gramatura bate com o cadastro?
Foto errada em catálogo de distribuidora gera pedido errado.
