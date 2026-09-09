# Site da Distri Rio

Site institucional e catálogo da **Distri Rio Comercial Ltda.**, distribuidora
de doces, bebidas, energéticos, suplementos e cuidados pessoais no Rio de
Janeiro e na Baixada Fluminense. Venda somente para pessoa jurídica com CNPJ.

Publicado em <https://distririo.com.br>.

---

## O essencial em cinco linhas

- É **HTML, CSS e JavaScript puros**. Sem framework, sem bundler, sem passo de
  build obrigatório para publicar.
- **Publicar é dar `push` na `main`.** O GitHub Pages serve o repositório como
  está. Não existe outro deploy.
- O catálogo **não se edita no HTML**. Ele vive em `data/produtos.json`, e o
  `node tools/gerar.js` reescreve o site a partir dele.
- Os scripts em `tools/` são ferramenta de quem edita o site. Eles rodam na sua
  máquina, nunca no servidor.
- Se você não vai mexer no catálogo, pode editar o HTML direto — **menos** as
  regiões marcadas como geradas (veja mais abaixo).

---

## Organização do repositório

| Caminho | O que é |
|---|---|
| `index.html`, `loja.html`, `sobre.html`, … | As 9 páginas de raiz. Editáveis à mão, fora das regiões geradas. |
| `produto/*.html` | 426 páginas de produto. **Geradas.** Não editar. |
| `marca/*.html` | 18 páginas de marca. **Geradas.** Não editar. |
| `404.html` | Página de erro. **Gerada** a partir de `tools/partials/404.html`. |
| `style.css` | Toda a folha de estilo, num arquivo só. Editável à mão. |
| `app.js` | Todo o JavaScript, num arquivo só. Editável à mão. |
| `data/produtos.json` | **Fonte única do catálogo.** É daqui que sai tudo. |
| `data/catalogo-bruto.json` | Exportação crua do ERP. Só serve para reconstruir o anterior. |
| `assets/produtos/<marca>/` | Fotos de produto: um `.jpg` e um `.webp` por foto. |
| `assets/hero-slides/` | Banners do carrossel da home. |
| `tools/` | Scripts de manutenção. Veja `tools/LEIAME.md`. |
| `tools/partials/` | Cabeçalho, rodapé e moldes de produto, marca e 404. |
| `sitemap.xml`, `robots.txt`, `site.webmanifest` | **Gerados.** |
| `.github/workflows/verificacao.yml` | O CI que reprova build fora de sincronia, imagem órfã e link quebrado. |

---

## Como fazer as coisas

### Adicionar ou alterar um produto

1. Edite `data/produtos.json`. Cada produto tem:

   ```json
   {
     "id": "trident-5s",
     "nome": "Trident 5S",
     "categoria": "mdz-trident",
     "marca": "Mondelez",
     "linha": "Menta, Hortelã, Tutti-Frutti",
     "embalagens": ["473 ml"],
     "img": "assets/produtos/mondelez-novo/mondelez__trident-5s.jpg",
     "keywords": "trident 5s menta hortela mondelez"
   }
   ```

   - `id` vira o endereço da página (`produto/trident-5s.html`). **Mudar o `id`
     quebra o link antigo**, que pode já estar indexado no Google.
   - `linha` com vírgula é tratado como lista de sabores; sem vírgula, como nome
     de linha. A ficha e o texto da página mudam de acordo.
   - `img` aponta para o **JPG**. O site serve o WebP e monta o caminho sozinho.

2. Rode o build e a verificação:

   ```bash
   npm run build
   npm run checar
   ```

3. Comite o `data/produtos.json` **e** todo o HTML que o build mexeu.

### Adicionar a foto de um produto

1. Coloque o JPG em `assets/produtos/<marca>/`, **quadrado, 800 × 800**.
2. Gere o WebP que o site realmente serve:

   ```bash
   npm run imagens
   ```

3. Aponte o campo `img` do produto para o JPG e rode o build.

### Trocar um banner do carrossel da home

Os banners ficam em `assets/hero-slides/`, em três formatos (`.avif`, `.webp`,
`.jpg`), na proporção **1600 × 467**. O `<picture>` de cada slide está escrito à
mão no `index.html`, dentro de `<section class="hero-carousel">`. Troque o
arquivo mantendo o nome, ou edite os três `srcset` do slide.

O primeiro slide leva `fetchpriority="high"` porque é o maior elemento visível
na abertura da home. Se trocar a ordem, mova esse atributo junto.

### Criar uma página de marca

Não se cria à mão. Toda marca com **4 ou mais produtos** no catálogo ganha
`marca/<slug>.html` automaticamente no build. Abaixo de 4 a página não sai, para
não publicar página de duas linhas.

---

## Como o deploy funciona

```
push na main  →  GitHub Pages publica a raiz do repositório  →  distririo.com.br
```

Não há servidor, container nem processo de build no meio. O que está commitado é
o que está no ar, com um atraso de 20 a 60 segundos.

Três arquivos sustentam isso e **não podem sumir**:

- `CNAME` — diz ao GitHub Pages qual domínio servir.
- `.nojekyll` — desliga o Jekyll. Sem ele o Pages tenta processar
  `tools/partials/*.html` como template Liquid, falha, e **o deploy inteiro para
  de sair sem dar erro visível**. Já aconteceu.
- `.gitignore` — mantém fora do repositório as pastas de ferramenta iniciadas
  por ponto. Com `.nojekyll` ligado, o Pages serve arquivos com ponto na frente.

### Cache

O GitHub Pages manda `cache-control: max-age=600` em tudo e não deixa mudar.
Por isso o build carimba `?v=<hash>` nos links do `style.css` e do `app.js`:
arquivo novo vira endereço novo, e o navegador não tem como servir a cópia
velha. Se você editar o CSS à mão e não rodar o build, quem já visitou o site
pega, por até dez minutos, o HTML novo com o CSS velho.

---

## O que **não** mexer

| Item | Por quê |
|---|---|
| `CNAME` | É o domínio. Alterar tira o site do ar. |
| `.nojekyll` | Sem ele o deploy para de sair, em silêncio. |
| DNS e Cloudflare | Fora do repositório. Alteração errada tira o site do ar e demora a voltar. |
| Chave do Web3Forms (`access_key` no `trabalhe-conosco.html`) | É o que faz o currículo chegar no e-mail. |
| Número de WhatsApp (`5521992111843`) | Aparece em dezenas de lugares; troque pelo build, não à mão. |
| ID do GA4 (`G-8MYVJZMB64`, em `tools/gerar.js`) | Trocar zera o histórico de medição. |
| O bloco de Consent Mode no `<head>` | É o que impede cookie de medição antes do aceite. É exigência da LGPD, e o hash dele está na política de segurança da página. |
| `<!-- catalogo:inicio -->` … `<!-- catalogo:fim -->` | Região gerada dentro do `loja.html`. O que você escrever ali some no próximo build. |
| `<!-- jsonld:inicio -->` … `<!-- jsonld:fim -->` | Idem, para os dados estruturados. |
| `<header>` e `<footer>` | Substituídos inteiros a cada build pelos arquivos de `tools/partials/`. Edite o partial. |

---

## Regras que valem para qualquer alteração

1. **Não invente fato comercial.** Preço, pedido mínimo, prazo de entrega,
   condição de pagamento, número de clientes, depoimento, nome de cliente,
   certificação, unidades por caixa, código EAN, peso, validade. Se o dado não
   está no `data/produtos.json` nem foi confirmado pelo Enzo, não vai para o
   site — nem no texto, nem no `alt`, nem no dado estruturado.
2. **É B2B, só CNPJ.** Nada de carrinho com checkout, preço público, pagamento
   online ou linguagem de varejo. A lista de pedido monta uma mensagem de
   WhatsApp; ela não é um carrinho.
3. **Nenhum passo de build obrigatório.** Publicar continua sendo commitar HTML.
4. **Rode o build antes de commitar** se tocou no catálogo, nos partials ou no
   `style.css`. O CI reprova o que estiver fora de sincronia.

---

## Comandos

```bash
npm run build      # regenera o site a partir de data/produtos.json
npm run checar     # confere links internos, âncoras e imagens órfãs
npm run imagens    # gera o WebP de cada foto de produto (precisa de Python + Pillow)
npm run catalogo   # reconstrói data/produtos.json a partir do ERP e regenera
```

Para ver o site localmente:

```bash
python -m http.server 4173
```

E abra <http://localhost:4173>. Abrir o HTML com duplo clique (`file://`) não
funciona: o `fetch` do índice de busca e a política de segurança da página
exigem um servidor.

---

## Onde está o resto da documentação

- `tools/LEIAME.md` — o fluxo do catálogo em detalhe e o papel de cada script.
- `PERGUNTAS-PARA-O-ENZO.md` — o que está travado esperando informação que só o
  dono tem (fotos, preços, horário, área de cobertura).
- `RELATORIO-NOITE.md` — o diário do que foi mudado, por quê, e o que foi
  medido antes e depois.
- `tools/noturno/BACKLOG.md` — a fila de melhorias, com o que já saiu marcado.
