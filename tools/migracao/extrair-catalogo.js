// Extração única: lê o catálogo de onde ele vive hoje (loja.html + app.js)
// e grava data/produtos.json, que passa a ser a fonte de verdade.
// Rodado uma vez; fica no repositório como registro de como o JSON nasceu.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const loja = fs.readFileSync(path.join(root, 'loja.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// ---- 1. PRODUCTS do app.js (traz keywords de busca) ----
const ini = app.indexOf('var PRODUCTS = [');
const fim = app.indexOf('\n];', ini);
const arr = app.slice(app.indexOf('[', ini), fim + 2);
const PRODUCTS = new Function('return ' + arr)();

// ---- 2. Seções e cards do loja.html ----
const secoes = [];
const reSecao = /<div class="category-section" id="([^"]+)">\s*<h2>([^<]*)<\/h2>([\s\S]*?)\n            <\/div>/g;
let m;
while ((m = reSecao.exec(loja)) !== null) {
    const [, id, titulo, corpo] = m;
    const cards = [];
    const reCard = /<div class="product-card" data-name="([^"]*)" data-desc="([^"]*)">\s*(?:<img src="([^"]*)" alt="[^"]*">\s*)?<div class="product-info">\s*<h3>([^<]*)<\/h3>\s*<p>([^<]*)<\/p>/g;
    let c;
    while ((c = reCard.exec(corpo)) !== null) {
        cards.push({ dataName: c[1], dataDesc: c[2], img: c[3] || null, nome: c[4], descricao: c[5] });
    }
    secoes.push({ id, titulo, cards });
}

const totalCards = secoes.reduce((n, s) => n + s.cards.length, 0);
console.log(`seções: ${secoes.length}  cards: ${totalCards}  PRODUCTS: ${PRODUCTS.length}`);
if (totalCards !== PRODUCTS.length) {
    console.error('AVISO: contagens divergem — conferir regex antes de gravar.');
}

// ---- 3. Casar os dois pelo nome + img ----
const porChave = new Map();
PRODUCTS.forEach((p, i) => {
    const k = p.name + '|' + (p.img || '');
    if (!porChave.has(k)) porChave.set(k, []);
    porChave.get(k).push({ ...p, _i: i });
});

const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/gi, "'").replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ');

const produtos = [];
let semPar = 0;
for (const sec of secoes) {
    for (const card of sec.cards) {
        const nome = decode(card.nome);
        const k = nome + '|' + (card.img || '');
        const fila = porChave.get(k);
        const par = fila && fila.length ? fila.shift() : null;
        if (!par) semPar++;
        produtos.push({
            nome,
            categoria: sec.id,
            categoriaTitulo: sec.titulo,
            descricao: decode(card.descricao),
            img: card.img,
            keywords: par ? par.keywords : '',
            categoriaApp: par ? par.category : ''
        });
    }
}
console.log('sem par no app.js:', semPar);

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'catalogo-bruto.json'),
    JSON.stringify({ secoes: secoes.map(s => ({ id: s.id, titulo: s.titulo, n: s.cards.length })), produtos }, null, 2), 'utf8');
console.log('gravado data/catalogo-bruto.json com', produtos.length, 'produtos');
