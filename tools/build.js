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
    const ficha = [
        ['Marca', p.marca],
        ['Categoria', tituloCat],
        ['Embalagem', embal],
        ['Sabores', p.linha],
        ['Código interno', (p.skus || []).join(', ')],
    ].filter(par => par[1])
        .map(par => '                    <div class="ficha-linha"><dt>' + par[0] + '</dt><dd>' + esc(par[1]) + '</dd></div>')
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
        .replace(/\{\{RODAPE\}\}/g, indentar(montarRodape('../'), 4));
}

module.exports = {
    root, SITE, ZAP, dados, ler, gravar, esc, semAcento, indentar,
    PAGINAS, montarCabecalho, montarRodape, aplicarPartials,
    montarCatalogo, montarFiltros, paginaProduto, textoBusca, porCategoria,
};
