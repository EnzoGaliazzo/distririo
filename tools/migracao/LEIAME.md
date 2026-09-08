# Scripts de migração — já aplicados, não rodar de novo

Estes scripts fizeram a passagem única do site antigo para o formato atual,
em setembro de 2026. Ficam aqui só como registro de o que foi mudado e por quê.

Rodar qualquer um deles hoje não funciona (os trechos que eles procuram já não
existem) ou estraga o que está pronto — `extrair-catalogo.js`, em especial, lê
`loja.html` como se fosse fonte, e hoje esse arquivo é **gerado**.

| Script | O que fez |
|---|---|
| `extrair-catalogo.js` | Leu os 528 cartões de `loja.html` e o array `PRODUCTS` do `app.js` e cruzou os dois em `data/catalogo-bruto.json`. |
| `overlap.js` | Mediu quantos itens da categoria "Farma" eram repetição de produto já listado em outra seção (42 batendo exatamente, ~77 com marca própria). |
| `patch-index.py` | Inverteu a home: proposta de valor e CTA no topo, carrossel do fornecedor abaixo. |
| `patch-home.py` | Completou o seletor de marcas (mostrava 12 de 16) e inseriu a faixa com a foto do armazém. |
| `patch-css.py` | Ajustes cirúrgicos em regras existentes: hover no toque, altura medida do cabeçalho, `content-visibility`, menu sem `max-height` mágico. |
| `patch-cores.py` | Trocou 33 cinzas escritos à mão por `--texto-suave` / `--texto-fraco`, sem o que o modo escuro fica ilegível. |
| `patch-conteudo.py` | Travessão no lugar de hífen, número do catálogo, capitalização, linha do tempo e heros fora do padrão. |
