'use strict';
// Gera tudo o que deriva de data/produtos.json e dos partials:
//   - o catálogo dentro de loja.html
//   - as páginas de produto em produto/
//   - o índice de busca em assets/data/produtos.json
//   - sitemap.xml
//   - cabeçalho e rodapé de todas as páginas
// Uso: node tools/build.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SITE = 'https://distririo.com.br';
const ZAP = '5521992111843';
const EOL = '\r\n';

const ler = p => fs.readFileSync(path.join(root, p), 'utf8');
const gravar = (p, txt) => {
    const destino = path.join(root, p);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, txt.replace(/\r?\n/g, EOL), 'utf8');
};

const dados = JSON.parse(ler('data/produtos.json'));
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semAcento = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// =====================================================================
// 1. cabeçalho e rodapé compartilhados
// =====================================================================
const PAGINAS = {
    'index.html': 'index',
    'loja.html': 'loja',
    'sobre.html': 'sobre',
    'servicos.html': 'servicos',
    'contato.html': 'contato',
    'trabalhe-conosco.html': 'trabalhe-conosco',
    'quero-ser-cliente.html': 'quero-ser-cliente',
    'politica-de-privacidade.html': 'politica',
};

const tplCabecalho = ler('tools/partials/cabecalho.html').replace(/\r?\n/g, '\n').trimEnd();
const tplRodape = ler('tools/partials/rodape.html').replace(/\r?\n/g, '\n').trimEnd();

function montarCabecalho(base, ativo) {
    let h = tplCabecalho.replace(/\{\{BASE\}\}/g, base);
    h = h.replace(/\{\{ATIVO:([a-z-]+)\}\}/g, (_, k) =>
        k === ativo ? ' class="is-active" aria-current="page"' : '');
    h = h.replace(/\{\{CTA\}\}/g, ativo === 'quero-ser-cliente' ? ' is-active" aria-current="page' : '');
    return h;
}

const montarRodape = base => tplRodape.replace(/\{\{BASE\}\}/g, base);

const indentar = (txt, espacos) =>
    txt.split('\n').map(l => (l.trim() ? ' '.repeat(espacos) + l : l)).join('\n');

const RE_CABECALHO = /(?:[ \t]*<a class="skip-link"[\s\S]*?<\/a>\r?\n)?[ \t]*<header class="site-header">[\s\S]*?<\/header>/;
const RE_RODAPE = /[ \t]*<footer class="footer">[\s\S]*?<\/footer>/;

function aplicarPartials(html, base, ativo) {
    if (!RE_CABECALHO.test(html)) throw new Error('cabeçalho não encontrado');
    if (!RE_RODAPE.test(html)) throw new Error('rodapé não encontrado');
    return html
        .replace(RE_CABECALHO, () => montarCabecalho(base, ativo))
        .replace(RE_RODAPE, () => indentar(montarRodape(base), 4));
}

// =====================================================================
// 2. catálogo
// =====================================================================
const porCategoria = new Map();
dados.categorias.forEach(c => porCategoria.set(c.id, []));
dados.produtos.forEach(p => {
    const lista = porCategoria.get(p.categoria);
    if (lista) lista.push(p);
});

function textoBusca(p) {
    const partes = [p.nome, p.marca, p.linha, (p.embalagens || []).join(' '), p.keywords];
    const palavras = semAcento(partes.filter(Boolean).join(' '))
        .replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(Boolean);
    return [...new Set(palavras)].join(' ');
}

function inicial(nome) {
    const m = String(nome).match(/[A-Za-zÀ-ÿ0-9]/);
    return (m ? m[0] : '?').toUpperCase();
}

function midiaCartao(p, eager, base) {
    const alt = esc(p.nome + (p.marca ? ' — ' + p.marca : ''));
    if (!p.img) {
        return [
            '<div class="product-thumb-vazio" role="img" aria-label="' + alt + ' — foto ainda não disponível">',
            '    <span class="product-inicial" aria-hidden="true">' + esc(inicial(p.nome)) + '</span>',
            '    <span class="product-marca-vazia" aria-hidden="true">' + esc(p.marca || 'Distri Rio') + '</span>',
            '</div>',
        ].join('\n');
    }
    const webp = p.img.replace(/\.jpe?g$/i, '.webp');
    const carga = eager ? ' fetchpriority="high"' : ' loading="lazy"';
    return [
        '<picture>',
        '    <source srcset="' + base + webp + '" type="image/webp">',
        '    <img src="' + base + p.img + '" alt="' + alt + '" width="800" height="800"' + carga + ' decoding="async">',
        '</picture>',
    ].join('\n');
}

function cartao(p, indice, base) {
    const detalhe = [p.linha, (p.embalagens || []).join(' · ')].filter(Boolean);
    const linhas = [
        '<article class="product-card" data-name="' + esc(p.nome) + '" data-desc="' + esc(textoBusca(p)) + '"' +
            ' data-marca="' + esc(p.marca || '') + '" data-cat="' + esc(p.categoria) + '"' +
            ' data-foto="' + (p.img ? 'sim' : 'nao') + '"' +
            (p.skus && p.skus.length ? ' data-sku="' + esc(p.skus.join(' ')) + '"' : '') + '>',
        '    <a class="product-card-link" href="' + base + 'produto/' + p.id + '.html">',
        '        <div class="product-thumb">',
        indentar(midiaCartao(p, indice < 8, base), 12),
        '        </div>',
        '        <div class="product-info">',
        '            <h3>' + esc(p.nome) + '</h3>',
    ];
    detalhe.forEach((d, i) => {
        linhas.push('            <p class="' + (i === 0 ? 'product-desc' : 'product-pack') + '">' + esc(d) + '</p>');
    });
    // O botão fica FORA do <a>: botão dentro de link é HTML inválido e o
    // clique vira navegação em vez de adicionar à lista.
    linhas.push(
        '        </div>',
        '    </a>',
        '    <button type="button" class="btn-lista" data-add="' + p.id + '"' +
            ' data-nome="' + esc(p.nome) + '" data-marca="' + esc(p.marca || '') + '">' +
            '<span class="btn-lista-mais" aria-hidden="true">+</span> <span class="btn-lista-rotulo">Adicionar à lista</span></button>',
        '</article>');
    return indentar(linhas.join('\n'), 20);
}

// Painel de filtros: marca, categoria e "só com foto", montados a partir do
// próprio catálogo para nunca desencontrar dele.
function montarFiltros() {
    const marcas = [...new Set(dados.produtos.map(p => p.marca).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt'));

    const opcoesMarca = marcas
        .map(m => '                    <option value="' + esc(m) + '">' + esc(m) + '</option>')
        .join('\n');

    const opcoesCategoria = dados.categorias
        .map(c => '                    <option value="' + c.id + '">' + esc(c.titulo) +
            ' (' + (porCategoria.get(c.id) || []).length + ')</option>')
        .join('\n');

    return [
        '        <section class="filtros" aria-label="Filtrar o catálogo">',
        '            <div class="filtros-campos">',
        '                <label class="filtro">',
        '                    <span>Marca</span>',
        '                    <select id="filtroMarca">',
        '                        <option value="">Todas as marcas</option>',
        opcoesMarca.replace(/^ {20}/gm, '                        '),
        '                    </select>',
        '                </label>',
        '                <label class="filtro">',
        '                    <span>Categoria</span>',
        '                    <select id="filtroCategoria">',
        '                        <option value="">Todas as categorias</option>',
        opcoesCategoria.replace(/^ {20}/gm, '                        '),
        '                    </select>',
        '                </label>',
        '                <label class="filtro filtro-marcavel">',
        '                    <input type="checkbox" id="filtroComFoto">',
        '                    <span>Só produtos com foto</span>',
        '                </label>',
        '                <button type="button" class="filtro-limpar" id="limparFiltros" hidden>Limpar filtros</button>',
        '            </div>',
        '            <p class="search-status" id="searchStatus" role="status" aria-live="polite"></p>',
        '        </section>',
    ].join('\n');
}

function montarCatalogo() {
    const chips = dados.categorias
        .map(c => '            <a href="#' + c.id + '" class="category-chip">' + esc(c.titulo) + '</a>')
        .join('\n');

    let n = 0;
    const secoes = dados.categorias.map(c => {
        const itens = porCategoria.get(c.id) || [];
        const cartoes = itens.map(p => cartao(p, n++, '')).join('\n');
        // Altura estimada da seção, para o content-visibility não chutar 900px
        // em toda seção e desalinhar as âncoras da barra de categorias.
        const linhas = Math.ceil(itens.length / 4);
        const alturaEstimada = linhas * 330 + 200;
        return [
            '            <div class="category-section" id="' + c.id + '" style="contain-intrinsic-size: auto ' + alturaEstimada + 'px">',
            '                <h2>' + esc(c.titulo) + '</h2>',
            '                <p class="category-count">' + itens.length +
                (itens.length === 1 ? ' produto' : ' produtos') + '</p>',
            '                <div class="product-grid">',
            cartoes,
            '                </div>',
            '            </div>',
        ].join('\n');
    }).join('\n\n');

    return { chips, secoes };
}

// =====================================================================
// 3. páginas de produto
// =====================================================================
// Até quatro produtos de verdade para seguir a partir daqui: primeiro os
// irmãos da mesma categoria, depois o resto da marca. Ordem estável (o sort do
// V8 é estável), então a build continua idempotente.
function relacionados(p, limite) {
    const comFotoPrimeiro = lista => lista.slice().sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0));
    const mesmaCategoria = dados.produtos.filter(x => x.id !== p.id && x.categoria === p.categoria);
    const mesmaMarca = p.marca
        ? dados.produtos.filter(x => x.id !== p.id && x.marca === p.marca && x.categoria !== p.categoria)
        : [];
    const escolhidos = [];
    for (const lista of [comFotoPrimeiro(mesmaCategoria), comFotoPrimeiro(mesmaMarca)]) {
        for (const x of lista) {
            if (escolhidos.length >= limite) return escolhidos;
            escolhidos.push(x);
        }
    }
    return escolhidos;
}

function blocoRelacionados(p, cat) {
    const lista = relacionados(p, 4);
    if (!lista.length) return '';

    const todosDaCategoria = lista.every(x => x.categoria === p.categoria);
    let titulo;
    if (todosDaCategoria && cat) titulo = 'Outros itens de ' + cat.titulo;
    else if (p.marca) titulo = 'Mais de ' + p.marca;
    else titulo = 'Outros itens do catálogo';

    const slug = p.marca ? paginasDeMarca.get(p.marca) : null;
    const totalMarca = slug ? dados.produtos.filter(x => x.marca === p.marca).length : 0;

    const linhas = [
        '',
        '        <section class="section section-relacionados">',
        '            <h2>' + esc(titulo) + '</h2>',
        '            <div class="product-grid">',
        // índice 100: nunca eager, essas fotos não são o LCP da página
        ...lista.map(x => cartao(x, 100, '../')),
        '            </div>',
    ];
    if (slug) {
        linhas.push('            <p class="relacionados-mais"><a href="../marca/' + slug + '.html">' +
            'Ver os ' + totalMarca + ' produtos ' + esc(p.marca) + ' &rsaquo;</a></p>');
    }
    linhas.push('        </section>');
    return linhas.join('\n');
}

// Parágrafo de abertura montado só com campo que existe no catálogo. Sem peso,
// unidades por caixa, EAN nem validade: nada disso está no dado.
function apresentacao(p, cat) {
    const frases = [];
    // Categoria com marca no dado é linha de produto (Trident, Baly); sem marca
    // é categoria de catálogo (Suplementos, Barras e snacks).
    const daLinha = cat && cat.titulo !== p.nome && cat.titulo !== p.marca
        ? (cat.marca ? 'da linha ' : 'da categoria ') + cat.titulo
        : '';
    const daMarca = p.marca ? 'da ' + p.marca : '';
    const origem = [daLinha, daMarca].filter(Boolean).join(', ');
    // Sem artigo antes do nome: "O Geleia Baldoni Morango" sairia errado.
    const abre = origem
        ? p.nome + ' é um item ' + origem + ', que a Distri Rio distribui no atacado para '
        : 'A Distri Rio distribui ' + p.nome + ' no atacado para ';
    frases.push(abre + 'mercadinhos, farmácias, conveniências, padarias e bares do Rio de ' +
        'Janeiro e da Baixada Fluminense.');

    const pacotes = p.embalagens || [];
    if (pacotes.length === 1) {
        frases.push('A embalagem é de ' + pacotes[0] + '.');
    } else if (pacotes.length > 1) {
        frases.push('Trabalhamos nas embalagens de ' + pacotes.slice(0, -1).join(', ') +
            ' e ' + pacotes[pacotes.length - 1] + '.');
    }

    // "linha" com vírgula é lista de sabores; sem vírgula é nome de linha, e aí
    // a ficha já mostra sem precisar repetir aqui.
    if (p.linha && /,/.test(p.linha)) frases.push('Os sabores disponíveis são ' + p.linha + '.');

    frases.push('Preço e quantidade mínima saem pelo WhatsApp; a venda é só para pessoa ' +
        'jurídica com CNPJ ativo.');
    return frases.join(' ');
}

function paginaProduto(p, tpl) {
    const cat = dados.categorias.find(c => c.id === p.categoria);
    const embal = (p.embalagens || []).join(' · ');
    const titulo = p.nome + (p.marca ? ' — ' + p.marca : '') + ' | Distri Rio';
    const descricao = [
        p.nome,
        p.marca ? 'da ' + p.marca : '',
        'no atacado para comércios do Rio de Janeiro.',
        embal ? 'Disponível em ' + embal + '.' : '',
        'Pedido pelo WhatsApp, venda apenas para CNPJ.',
    ].filter(Boolean).join(' ');

    const msg = encodeURIComponent(
        'Olá! Tenho interesse em ' + p.nome + (embal ? ' (' + embal + ')' : '') + '. Podem me passar as condições?');
    const imgAbs = p.img ? SITE + '/' + p.img : SITE + '/assets/og-distririo.jpg';

    let midia;
    if (p.img) {
        midia = [
            '<picture>',
            '    <source srcset="../' + p.img.replace(/\.jpe?g$/i, '.webp') + '" type="image/webp">',
            '    <img src="../' + p.img + '" alt="' + esc(p.nome) + '" width="800" height="800" fetchpriority="high" decoding="async">',
            '</picture>',
        ].join('\n');
    } else {
        midia = [
            '<div class="produto-foto-vazia" role="img" aria-label="' + esc(p.nome) + ' — foto ainda não disponível">',
            '    <span aria-hidden="true">' + esc(inicial(p.nome)) + '</span>',
            '</div>',
        ].join('\n');
    }

    const tituloCat = cat && cat.titulo !== p.marca ? cat.titulo : '';
    // Marca com página própria vira link: é o caminho do produto para o
    // resto da linha, e o que faz a página de marca ser rastreada.
    const linkMarca = p.marca && paginasDeMarca.has(p.marca)
        ? '<a href="../marca/' + paginasDeMarca.get(p.marca) + '.html">' + esc(p.marca) + '</a>'
        : null;
    const ficha = [
        ['Marca', p.marca, linkMarca],
        ['Categoria', tituloCat],
        ['Embalagem', embal],
        // "linha" às vezes é lista de sabores ("Menta, Hortelã...") e às vezes
        // nome de linha ("Proteção Solar"). Rotular tudo como Sabores estava
        // errado na metade dos casos.
        [/,/.test(p.linha || '') ? 'Sabores' : 'Linha', p.linha],
        ['Código interno', (p.skus || []).join(', ')],
    ].filter(par => par[1])
        .map(par => '                    <div class="ficha-linha"><dt>' + par[0] + '</dt><dd>' + (par[2] || esc(par[1])) + '</dd></div>')
        .join('\n');

    const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.nome,
        image: imgAbs,
        description: descricao,
        category: cat ? cat.titulo : undefined,
        offers: {
            '@type': 'Offer',
            url: SITE + '/produto/' + p.id + '.html',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'BRL',
            priceSpecification: {
                '@type': 'PriceSpecification',
                valueAddedTaxIncluded: false,
                description: 'Preço sob consulta. Venda somente para pessoa jurídica (CNPJ).',
            },
            seller: { '@type': 'Organization', name: 'Distri Rio Comercial Ltda' },
        },
    };
    if (p.marca) jsonld.brand = { '@type': 'Brand', name: p.marca };
    if (p.skus && p.skus.length) jsonld.sku = p.skus[0];

    const trilha = [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Catálogo', item: SITE + '/loja.html' },
    ];
    if (cat) trilha.push({ '@type': 'ListItem', position: 3, name: cat.titulo, item: SITE + '/loja.html#' + cat.id });
    trilha.push({ '@type': 'ListItem', position: trilha.length + 1, name: p.nome, item: SITE + '/produto/' + p.id + '.html' });
    const migalhas = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trilha };

    return tpl
        .replace(/\{\{TITULO\}\}/g, esc(titulo))
        .replace(/\{\{DESCRICAO\}\}/g, esc(descricao))
        .replace(/\{\{URL\}\}/g, SITE + '/produto/' + p.id + '.html')
        .replace(/\{\{IMG_ABS\}\}/g, imgAbs)
        .replace(/\{\{NOME\}\}/g, esc(p.nome))
        .replace(/\{\{ID\}\}/g, p.id)
        .replace(/\{\{MARCA\}\}/g, esc(p.marca || ''))
        .replace(/\{\{MIDIA\}\}/g, indentar(midia, 16).trimStart())
        .replace(/\{\{FICHA\}\}/g, ficha)
        .replace(/\{\{CAT_ID\}\}/g, cat ? cat.id : '')
        .replace(/\{\{CAT_TITULO\}\}/g, cat ? esc(cat.titulo) : 'Catálogo')
        .replace(/\{\{ZAP\}\}/g, 'https://wa.me/' + ZAP + '?text=' + msg)
        .replace(/\{\{JSONLD\}\}/g, JSON.stringify(jsonld))
        .replace(/\{\{MIGALHAS\}\}/g, JSON.stringify(migalhas))
        .replace(/\{\{CABECALHO\}\}/g, montarCabecalho('../', 'loja'))
        .replace(/\{\{RODAPE\}\}/g, indentar(montarRodape('../'), 4))
        // função no lugar de string: nome de produto com $ viraria $& na saída
        .replace(/\{\{APRESENTACAO\}\}/g, () => esc(apresentacao(p, cat)))
        .replace(/\{\{RELACIONADOS\}\}/g, () => blocoRelacionados(p, cat));
}

module.exports = {
    root, SITE, ZAP, dados, ler, gravar, esc, semAcento, indentar,
    PAGINAS, montarCabecalho, montarRodape, aplicarPartials,
    montarCatalogo, montarFiltros, paginaProduto, textoBusca, porCategoria,
};

// =====================================================================
// 5. páginas de marca
// "distribuidor Mondelez Rio de Janeiro" é busca de intenção altíssima e o
// site não tinha nenhuma página para responder. Uma página por marca, gerada
// do mesmo data/produtos.json que gera o resto.
// =====================================================================

// Abaixo disso a página seria só um título e dois cards — conteúdo raso, que
// o Google trata como ruído e o visitante trata como beco sem saída.
const MIN_PRODUTOS_MARCA = 4;

const slugMarca = m => semAcento(m).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function marcasComProduto() {
    const mapa = new Map();
    dados.produtos.forEach(p => {
        if (!p.marca) return;
        if (!mapa.has(p.marca)) mapa.set(p.marca, []);
        mapa.get(p.marca).push(p);
    });
    return [...mapa.entries()]
        .map(([nome, produtos]) => ({
            nome,
            slug: slugMarca(nome),
            produtos,
            categorias: [...new Set(produtos.map(p => p.categoria))],
        }))
        .filter(m => m.produtos.length >= MIN_PRODUTOS_MARCA)
        .sort((a, b) => b.produtos.length - a.produtos.length);
}

// Nome da marca -> slug, só para as que têm página. Usado pela ficha do
// produto para linkar "Marca: Baly Brasil" na página da marca.
const paginasDeMarca = new Map(marcasComProduto().map(m => [m.nome, m.slug]));

function paginaMarca(marca, todas, tpl) {
    const n = marca.produtos.length;
    const nCat = marca.categorias.length;
    const capa = marca.produtos.find(p => p.img);

    const titulo = 'Distribuidor ' + marca.nome + ' no Rio de Janeiro | Distri Rio';
    const descricao = 'Distribuímos ' + marca.nome + ' no atacado para comércios do Rio de Janeiro e da ' +
        'Baixada Fluminense: ' + n + ' produtos no catálogo, pedido pelo WhatsApp. Venda apenas para CNPJ.';

    // O texto só afirma o que dá para conferir no próprio catálogo.
    const nomesCategorias = marca.categorias
        .map(id => (dados.categorias.find(c => c.id === id) || {}).titulo)
        .filter(Boolean);
    // Categoria com o mesmo nome da marca não acrescenta nada à frase
    // ("São 4 itens da marca em Gota") — sai da lista.
    const outrasCats = nomesCategorias.filter(t => t.toLowerCase() !== marca.nome.toLowerCase());
    let ondeEstao;
    if (!outrasCats.length) {
        ondeEstao = 'São ' + n + ' itens da marca no catálogo.';
    } else if (outrasCats.length === 1) {
        ondeEstao = 'São ' + n + ' itens da marca em ' + outrasCats[0] + '.';
    } else {
        ondeEstao = 'São ' + n + ' itens da marca em ' + outrasCats.length + ' categorias: ' +
            outrasCats.slice(0, 4).join(', ') + (outrasCats.length > 4 ? ' e outras' : '') + '.';
    }
    const resumo = 'A Distri Rio distribui ' + marca.nome + ' para mercadinhos, farmácias, conveniências, ' +
        'padarias e bares do Rio de Janeiro e da Baixada Fluminense, com entrega no endereço do seu ' +
        'comércio a partir do nosso centro de distribuição em Duque de Caxias. ' + ondeEstao;

    const msg = encodeURIComponent('Olá! Queria saber as condições dos produtos ' + marca.nome + '.');

    let i = 0;
    const cartoes = marca.produtos.map(p => cartao(p, i++, '../')).join('\n');

    const outras = todas.filter(m => m.slug !== marca.slug)
        .map(m => '                <a href="' + m.slug + '.html">' + esc(m.nome) +
            ' <span aria-hidden="true">' + m.produtos.length + '</span></a>')
        .join('\n');

    const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name: marca.nome,
        description: descricao,
        url: SITE + '/marca/' + marca.slug + '.html',
    };
    if (capa) jsonld.image = SITE + '/' + capa.img;

    const migalhas = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
            { '@type': 'ListItem', position: 2, name: 'Catálogo', item: SITE + '/loja.html' },
            { '@type': 'ListItem', position: 3, name: marca.nome, item: SITE + '/marca/' + marca.slug + '.html' },
        ],
    };

    return tpl
        .replace(/\{\{TITULO\}\}/g, esc(titulo))
        .replace(/\{\{DESCRICAO\}\}/g, esc(descricao))
        .replace(/\{\{URL\}\}/g, SITE + '/marca/' + marca.slug + '.html')
        .replace(/\{\{IMG_ABS\}\}/g, capa ? SITE + '/' + capa.img : SITE + '/assets/og-distririo.jpg')
        .replace(/\{\{RESUMO\}\}/g, esc(resumo))
        .replace(/\{\{TOTAL\}\}/g, String(n))
        .replace(/\{\{CATEGORIAS\}\}/g, String(nCat))
        .replace(/\{\{ROTULO_CATEGORIAS\}\}/g, nCat === 1 ? 'categoria' : 'categorias')
        .replace(/\{\{PRODUTOS\}\}/g, cartoes)
        .replace(/\{\{OUTRAS\}\}/g, outras)
        .replace(/\{\{ZAP\}\}/g, 'https://wa.me/' + ZAP + '?text=' + msg)
        .replace(/\{\{JSONLD\}\}/g, JSON.stringify(jsonld))
        .replace(/\{\{MIGALHAS\}\}/g, JSON.stringify(migalhas))
        .replace(/\{\{CABECALHO\}\}/g, montarCabecalho('../', 'loja'))
        .replace(/\{\{RODAPE\}\}/g, indentar(montarRodape('../'), 4))
        // por último: {{MARCA}} aparece dentro dos textos acima e não pode
        // ser substituído antes deles.
        .replace(/\{\{MARCA\}\}/g, esc(marca.nome));
}

module.exports.MIN_PRODUTOS_MARCA = MIN_PRODUTOS_MARCA;
module.exports.slugMarca = slugMarca;
module.exports.marcasComProduto = marcasComProduto;
module.exports.paginasDeMarca = paginasDeMarca;
module.exports.paginaMarca = paginaMarca;

// Bloco de links no fim do catálogo. Sem ele as páginas de marca só seriam
// alcançáveis pela ficha do produto, e o filtro de marca da loja é um <select>
// que robô nenhum segue.
function montarNavMarcas() {
    const lista = marcasComProduto().slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    return [
        '        <section class="section section-marcas">',
        '            <h2>Marcas que distribuímos</h2>',
        '            <p class="section-lead">Cada marca tem uma página com a linha completa dela.</p>',
        '            <nav class="marca-lista" aria-label="Marcas">',
        ...lista.map(m => '                <a href="marca/' + m.slug + '.html">' + esc(m.nome) +
            ' <span aria-hidden="true">' + m.produtos.length + '</span></a>'),
        '            </nav>',
        '        </section>',
    ].join('\n');
}

module.exports.montarNavMarcas = montarNavMarcas;
