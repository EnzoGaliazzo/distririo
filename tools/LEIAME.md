# Como mexer no site

O catálogo **não** se edita no HTML. Ele vive em `data/produtos.json`, e o HTML
da loja, as páginas de produto, o índice de busca e o sitemap são gerados a
partir dele. Editar `loja.html` na mão faz o próximo build desfazer a mudança —
e o GitHub Action reprova o push.

## Fluxo normal

```bash
# 1. edite data/produtos.json (nome, marca, embalagens, foto, categoria)
# 2. regenere tudo
npm run build
# 3. confira que nada quebrou
npm run checar
```

## Quando adicionar uma foto de produto

1. Coloque o JPG em `assets/produtos/<marca>/`, quadrado, 800×800.
2. Gere o WebP de 500px que o site realmente serve:
   ```bash
   npm run imagens
   ```
3. Aponte o campo `img` do produto em `data/produtos.json` para o **JPG**.
   O `<picture>` monta o caminho do WebP sozinho.

## O que cada script faz

| Arquivo | Papel |
|---|---|
| `tools/gerar.js` | Runner do build: cabeçalho, rodapé, `<head>`, catálogo, páginas de produto, sitemap, robots, manifesto, 404. |
| `tools/build.js` | Motor: monta os partials e o HTML dos cartões e das páginas de produto. |
| `tools/partials/` | Fonte única do cabeçalho, do rodapé e dos moldes de produto e 404. |
| `tools/gerar-produtos-json.js` | Reconstrói `data/produtos.json` a partir de `data/catalogo-bruto.json`. Só é necessário se a exportação do ERP for refeita. |
| `tools/normalizar-catalogo.js` | Unifica linhas duplicadas do ERP com os produtos curados. |
| `tools/limpar-nome.js` | Tira código de SKU, separa embalagem, expande abreviação e devolve acento. |
| `tools/rotas.js` | Decide em qual seção cada produto do ERP entra. |
| `tools/jsonld.js` | Monta FAQPage, Service e BreadcrumbList a partir do texto visível. |
| `tools/checar-links.js` | Confere que todo `href`/`src` local existe e que as âncoras batem. |
| `tools/checar-css.js` | Lista seletor declarado duas vezes no `style.css` e mostra qual propriedade a de baixo tira da de cima. Não reprova: é relatório. |
| `tools/orfas.js` | Lista (ou apaga, com `--apagar`) imagens que ninguém referencia. |
| `tools/webp-produtos.py` | Gera o WebP de 500px ao lado de cada foto de produto. |
| `tools/otimizar-imagens.py` | Reduz logotipos, ícones e banners do hero. Roda sob demanda. |

## Marcadores no HTML

- `<!-- catalogo:inicio -->` … `<!-- catalogo:fim -->` em `loja.html`: região gerada.
- `<!-- jsonld:inicio -->` … `<!-- jsonld:fim -->`: blocos de dados estruturados.
- O `<header>` e o `<footer>` inteiros são substituídos a cada build pelos partials.

Qualquer coisa dentro dessas regiões é perdida no próximo `npm run build`.
