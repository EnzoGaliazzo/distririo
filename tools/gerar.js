'use strict';
// Runner do build. Roda com: node tools/gerar.js
const fs = require('fs');
const path = require('path');
const B = require('./build.js');

const { root, SITE, dados, ler, gravar, esc, indentar,
    PAGINAS, aplicarPartials, montarCatalogo, montarFiltros, paginaProduto, textoBusca } = B;

const GA_ID = 'G-8MYVJZMB64';

// =====================================================================
// <head>: charset primeiro, consentimento antes do Analytics, canonical sem www
// =====================================================================
const STUB_CONSENTIMENTO = `    <script>
      // Consent Mode v2: nada de cookie de medição antes do aceite.
      // O gtag.js só é carregado por app.js depois que o visitante decide.
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
        analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted'
      });
      gtag('js', new Date());
      window.DR_GA_ID = '${GA_ID}';
    </script>`;

const RE_GA_ANTIGO = /[ \t]*<!-- Google tag \(gtag\.js\) -->\r?\n[ \t]*<script async src="https:\/\/www\.googletagmanager\.com[^"]*"><\/script>\r?\n[ \t]*<script>[\s\S]*?<\/script>\r?\n/;
const RE_STUB = /[ \t]*<script>\r?\n[ \t]*\/\/ Consent Mode v2[\s\S]*?<\/script>\r?\n/;

function arrumarHead(html, arquivo) {
    let h = html;

    // 1. tira o bloco do Analytics (ou o stub, se já for uma segunda passada)
    h = h.replace(RE_GA_ANTIGO, '').replace(RE_STUB, '');

    // 2. tira charset e viewport de onde estiverem
    const charset = '    <meta charset="UTF-8">';
    const viewport = '    <meta name="viewport" content="width=device-width, initial-scale=1.0">';
    h = h.replace(/[ \t]*<meta charset="[^"]*">\r?\n/i, '')
        .replace(/[ \t]*<meta name="viewport"[^>]*>\r?\n/i, '');

    // 3. recoloca no topo absoluto do head, com o stub de consentimento logo abaixo
    h = h.replace(/<head>\r?\n/, m => m + [charset, viewport, STUB_CONSENTIMENTO].join('\n') + '\n');

    // 4. canonical e og:url no domínio que o CNAME realmente serve
    h = h.replace(/https:\/\/www\.distririo\.com\.br/g, SITE);

    // 5. og:title segue a mesma convenção do <title>
    const t = h.match(/<title>([^<]*)<\/title>/);
    if (t) {
        h = h.replace(/<meta property="og:title" content="[^"]*">/,
            `<meta property="og:title" content="${esc(t[1])}">`);
    }

    // 6. og:image dedicado, no formato que o card grande pede.
    // Limpa antes de escrever: sem isso cada execução do build empilha mais
    // uma tripla de width/height/alt no <head>.
    h = h.replace(/[ \t]*<meta property="og:image:(width|height|alt)"[^>]*>\r?\n/g, '');
    h = h.replace(/<meta property="og:image" content="[^"]*">/,
        `<meta property="og:image" content="${SITE}/assets/og-distririo.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Armazém da Distri Rio em Duque de Caxias">`);

    // 7. ícones, cor de tema e manifesto
    h = h.replace(/[ \t]*<link rel="apple-touch-icon"[^>]*>\r?\n/, '')
        .replace(/[ \t]*<link rel="manifest"[^>]*>\r?\n/, '')
        .replace(/[ \t]*<meta name="theme-color"[^>]*>\r?\n/, '');
    h = h.replace(/([ \t]*<link rel="icon" type="image\/png"[^>]*>\r?\n)/,
        '$1    <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">\n' +
        '    <link rel="manifest" href="site.webmanifest">\n');
    h = h.replace(/([ \t]*<link rel="canonical"[^>]*>\r?\n)/,
        '$1    <meta name="theme-color" content="#12131a">\n');

    return h;
}

// =====================================================================
// catálogo dentro de loja.html
// =====================================================================
const MARCA_INI = '        <!-- catalogo:inicio (gerado por tools/gerar.js — não editar à mão) -->';
const MARCA_FIM = '        <!-- catalogo:fim -->';

function trocarCatalogo(html) {
    const { chips, secoes } = montarCatalogo();
    const bloco = [
        MARCA_INI,
        montarFiltros(),
        '',
        '        <nav class="category-bar" aria-label="Ir para uma categoria">',
        chips,
        '        </nav>',
        '',
        '        <section class="section section-catalog">',
        '            <p class="no-results" id="noResults" hidden>Nenhum produto encontrado para essa busca.</p>',
        '',
        secoes,
        '        </section>',
        '',
        B.montarNavMarcas(),
        MARCA_FIM,
    ].join('\n');

    const jaTemMarcas = html.includes('<!-- catalogo:inicio');
    if (jaTemMarcas) {
        return html.replace(/[ \t]*<!-- catalogo:inicio[\s\S]*?<!-- catalogo:fim -->/, bloco);
    }
    const re = /[ \t]*<nav class="category-bar"[\s\S]*?<\/section>/;
    if (!re.test(html)) throw new Error('bloco do catálogo não encontrado em loja.html');
    return html.replace(re, bloco);
}

// =====================================================================
// execução
// =====================================================================
const relatorio = [];

// ---------------------------------------------------------------------
// JSON-LD por página, montado a partir do texto que está no próprio HTML
// ---------------------------------------------------------------------
const { blocoOrganizacao, blocoSite, extrairFaq, blocoFaq, blocoServico, blocoMigalhas } = require('./jsonld.js');

const NOME_PAGINA = {
    'loja.html': 'Catálogo',
    'sobre.html': 'Sobre nós',
    'servicos.html': 'Serviços',
    'contato.html': 'Contato',
    'trabalhe-conosco.html': 'Trabalhe conosco',
    'quero-ser-cliente.html': 'Quero ser cliente',
    'politica-de-privacidade.html': 'Política de privacidade',
};

const RE_JSONLD_GERADO = /[ \t]*<!-- jsonld:inicio -->[\s\S]*?<!-- jsonld:fim -->\r?\n/;

function aplicarJsonLd(html, arquivo) {
    html = html.replace(RE_JSONLD_GERADO, '');

    const blocos = [];
    const faq = extrairFaq(html);
    if (faq.length) {
        var bf = blocoFaq(faq);
        if (bf) blocos.push(bf);
    }
    if (arquivo === 'index.html') {
        blocos.push(blocoOrganizacao());
        blocos.push(blocoSite());
    }
    if (arquivo === 'servicos.html') blocos.push(blocoServico(dados.categorias));
    if (NOME_PAGINA[arquivo]) blocos.push(blocoMigalhas(NOME_PAGINA[arquivo], arquivo));
    if (!blocos.length) return html;

    const bloco = [
        '    <!-- jsonld:inicio -->',
        ...blocos.map(b => '    <script type="application/ld+json">' + JSON.stringify(b) + '<\/script>'),
        '    <!-- jsonld:fim -->',
        '',
    ].join('\n');

    return html.replace(/([ \t]*<link rel="stylesheet" href="style.css">\r?\n)/, '$1' + bloco);
}

// ---------------------------------------------------------------------
// Versão nos links do CSS e do JS
// O GitHub Pages manda cache-control: max-age=600 em tudo e não deixa
// mudar. Sem versão no endereço, quem já visitou o site pega, por até dez
// minutos depois de um deploy, o HTML novo com o CSS velho — e a página
// aparece sem estilo. Com ?v=<hash do conteúdo>, arquivo novo é endereço
// novo, e o navegador não tem como servir a cópia antiga.
// ---------------------------------------------------------------------
const crypto = require('crypto');

const versaoDe = arquivo =>
    crypto.createHash('sha1').update(fs.readFileSync(path.join(root, arquivo))).digest('hex').slice(0, 8);

const VERSOES = { 'style.css': versaoDe('style.css'), 'app.js': versaoDe('app.js') };

// Tira a versão antiga na leitura, para o build continuar idempotente.
const limparVersao = html =>
    html.replace(/(href|src)="((?:\.\.\/|\/)?(?:style\.css|app\.js))\?v=[0-9a-f]+"/g, '$1="$2"');

const versionar = html =>
    html.replace(/(href|src)="((?:\.\.\/|\/)?(style\.css|app\.js))"/g,
        (_, attr, caminho, base) => `${attr}="${caminho}?v=${VERSOES[base]}"`);

// ---------------------------------------------------------------------
// Contadores de estatística
// Dois problemas de uma vez. O HTML entregava `<div data-count-to="428">0</div>`,
// então o Google, os previews de link e quem tem JS bloqueado liam "0 Produtos
// no catálogo". E o 428 já estava velho: o catálogo tem 426 desde a unificação.
// Agora o número sai do próprio catálogo, no build, e vai escrito no HTML.
//
// "marcas" e "anos" continuam à mão de propósito: 16 é o número de marcas
// parceiras do seletor da home, não as 22 marcas distintas do JSON (que inclui
// submarcas como Choklers e Mix Nutri), e 9 é a idade da empresa.
// ---------------------------------------------------------------------
const NUMEROS = {
    produtos: dados.total,
    categorias: dados.categorias.length,
};

// O total também aparece escrito em texto corrido ("428 produtos de 16 marcas
// parceiras"). Escrito à mão, desatualiza no primeiro produto novo — foi o que
// aconteceu: dizia 428 depois que o catálogo caiu para 426.
function arrumarTotalNoTexto(html) {
    return html.replace(/\b\d{3}(?= produtos\b)/g, String(dados.total));
}

function arrumarContadores(html) {
    return html.replace(
        /<div class="stat-number" data-stat="([a-z]+)"([^>]*)>([^<]*)<\/div>/g,
        (inteiro, chave, resto, textoAtual) => {
            // o valor vem do catálogo quando dá; senão mantém o que já estava
            const doCatalogo = NUMEROS[chave];
            const atual = (resto.match(/data-count-to="(\d+)"/) || [])[1];
            const valor = doCatalogo != null ? String(doCatalogo) : (atual || textoAtual.trim() || '0');
            const attrs = resto.replace(/\s*data-count-to="\d+"/, '');
            return `<div class="stat-number" data-stat="${chave}" data-count-to="${valor}"${attrs}>${valor}</div>`;
        });
}

// 1. páginas normais
for (const [arquivo, chave] of Object.entries(PAGINAS)) {
    let html = limparVersao(ler(arquivo));
    html = arrumarHead(html, arquivo);
    html = arrumarContadores(html);
    html = arrumarTotalNoTexto(html);
    html = aplicarJsonLd(html, arquivo);
    html = aplicarPartials(html, '', chave);
    if (!/id="conteudo"/.test(html)) {
        html = html.replace(/<main(\s|>)/, '<main id="conteudo"$1');
    }
    if (arquivo === 'loja.html') html = trocarCatalogo(html);
    gravar(arquivo, versionar(html));
    relatorio.push(`  ${arquivo}`);
}

// 1b. página de erro (o GitHub Pages serve /404.html em qualquer profundidade,
// então ela usa caminhos absolutos)
gravar('404.html', versionar(ler('tools/partials/404.html')
    .replace(/\r?\n/g, '\n')
    .replace('{{CABECALHO}}', B.montarCabecalho('/', ''))
    .replace('{{RODAPE}}', indentar(B.montarRodape('/'), 4))));
relatorio.push('  404.html');

// 2. páginas de produto
const tplProduto = ler('tools/partials/produto.html').replace(/\r?\n/g, '\n');
const dirProduto = path.join(root, 'produto');
if (fs.existsSync(dirProduto)) {
    for (const f of fs.readdirSync(dirProduto)) {
        if (f.endsWith('.html')) fs.unlinkSync(path.join(dirProduto, f));
    }
}
dados.produtos.forEach(p => gravar(`produto/${p.id}.html`, versionar(paginaProduto(p, tplProduto))));

// 2b. páginas de marca (18 marcas com 4+ produtos)
const tplMarca = ler('tools/partials/marca.html').replace(/\r?\n/g, '\n');
const marcas = B.marcasComProduto();
const dirMarca = path.join(root, 'marca');
if (fs.existsSync(dirMarca)) {
    for (const f of fs.readdirSync(dirMarca)) {
        if (f.endsWith('.html')) fs.unlinkSync(path.join(dirMarca, f));
    }
}
marcas.forEach(m => gravar(`marca/${m.slug}.html`, versionar(B.paginaMarca(m, marcas, tplMarca))));
relatorio.push(`  marca/*.html (${marcas.length} marcas)`);

// 3. índice de busca (baixado sob demanda, não embutido no app.js)
const indice = dados.produtos.map(p => ({
    i: p.id,
    n: p.nome,
    c: p.categoria,
    m: p.marca || undefined,
    g: p.img || undefined,
    b: textoBusca(p),
}));
gravar('assets/data/produtos.json', JSON.stringify({
    atualizado: dados.atualizado,
    categorias: dados.categorias.map(c => ({ id: c.id, titulo: c.titulo })),
    produtos: indice,
}));

// 4. sitemap
const hoje = new Date().toISOString().slice(0, 10);
// ---------------------------------------------------------------------
// lastmod de verdade: data do último commit que tocou cada arquivo.
// Arquivo com mudança ainda não commitada usa hoje, porque mudou agora.
// ---------------------------------------------------------------------
const { execFileSync } = require('child_process');

function datasDoGit() {
    const mapa = new Map();
    try {
        const historico = execFileSync('git',
            ['log', '--date=short', '--format=%x01%cd', '--name-only'],
            { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
        for (const entrada of historico.split('\u0001')) {
            const linhas = entrada.split('\n').filter(Boolean);
            if (!linhas.length) continue;
            const data = linhas[0].trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
            // o histórico vem do mais novo para o mais velho: o primeiro que
            // aparecer para um caminho é a data mais recente dele.
            for (const caminho of linhas.slice(1)) {
                if (!mapa.has(caminho)) mapa.set(caminho, data);
            }
        }
        const sujos = execFileSync('git', ['status', '--porcelain'],
            { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
        for (const linha of sujos.split('\n')) {
            const caminho = linha.slice(3).trim();
            if (caminho) mapa.set(caminho.replace(/^"|"$/g, ''), hoje);
        }
    } catch (e) {
        console.warn('  (sem git: lastmod do sitemap sai com a data de hoje)');
    }
    return mapa;
}

const DATAS = datasDoGit();
const lastmod = url => DATAS.get(url === '/' ? 'index.html' : url.replace(/^\//, '')) || hoje;

const urls = [
    ['/', '1.0', 'weekly'],
    ['/loja.html', '0.9', 'weekly'],
    ['/quero-ser-cliente.html', '0.8', 'monthly'],
    ['/servicos.html', '0.7', 'monthly'],
    ['/sobre.html', '0.6', 'monthly'],
    ['/contato.html', '0.6', 'monthly'],
    ['/trabalhe-conosco.html', '0.5', 'monthly'],
    ['/politica-de-privacidade.html', '0.2', 'yearly'],
    ...marcas.map(m => [`/marca/${m.slug}.html`, '0.7', 'monthly']),
    ...dados.produtos.map(p => [`/produto/${p.id}.html`, '0.6', 'monthly']),
];
gravar('sitemap.xml', [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(([u, p, f]) =>
        `  <url><loc>${SITE}${u}</loc><lastmod>${lastmod(u)}</lastmod><changefreq>${f}</changefreq><priority>${p}</priority></url>`),
    '</urlset>',
].join('\n'));

// 5. robots.txt
gravar('robots.txt', [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
].join('\n'));

// 6. manifesto
gravar('site.webmanifest', JSON.stringify({
    name: 'Distri Rio',
    short_name: 'Distri Rio',
    description: 'Distribuidora de doces, bebidas, energéticos e cuidados pessoais no Rio de Janeiro.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2e8d5',
    theme_color: '#12131a',
    lang: 'pt-BR',
    icons: [
        { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/assets/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
}, null, 2));

console.log('páginas regeneradas:');
relatorio.forEach(l => console.log(l));
console.log(`páginas de produto: ${dados.produtos.length}`);
console.log(`índice de busca: assets/data/produtos.json (${(fs.statSync(path.join(root, 'assets/data/produtos.json')).size / 1024).toFixed(0)} KB)`);
console.log('sitemap.xml, robots.txt e site.webmanifest atualizados');
