'use strict';
// Grava data/produtos.json — a fonte única do catálogo.
const fs = require('fs');
const path = require('path');
const { produtos } = require('./normalizar-catalogo.js');
const { rotear, marcaDoNome, SUBCATEGORIAS, SUB_PADRAO } = require('./rotas.js');

const root = path.join(__dirname, '..');

// ---------- seções curadas, na ordem em que aparecem hoje na loja ----------
const bruto = require(path.join(root, 'data', 'catalogo-bruto.json'));
const ordem = bruto.secoes.map(s => s.id).filter(id => id !== 'farma');
const titulos = Object.fromEntries(bruto.secoes.map(s => [s.id, s.titulo]));

const MARCA_SECAO = {
    'mdz-trident': 'Mondelez', 'mdz-trident-xsenses': 'Mondelez', 'mdz-chiclets-adams': 'Mondelez',
    'mdz-trident-max': 'Mondelez', 'mdz-bubbaloo': 'Mondelez', 'mdz-halls': 'Mondelez',
    'mdz-tang': 'Mondelez', 'mdz-oreo': 'Mondelez', 'mdz-club-social': 'Mondelez',
    'mdz-lacta': 'Mondelez', 'mdz-bis': 'Mondelez', 'mdz-bis-xtra': 'Mondelez',
    'mdz-lacta-intense': 'Mondelez', 'baly': 'Baly Brasil', 'dr-aqua-coco': 'Aqua Coco',
    'dr-sumo': 'Sumo', 'dr-marata': 'Maratá', 'dr-mara-tinho': 'Mara-tinho', 'dr-gota': 'Gota',
    'dr-rivoli': 'Rivoli', 'dr-trio': 'Trio', 'dr-kobber': 'Kobber', 'dr-baldoni': 'Baldoni',
    'dr-ace': 'Ace', 'dr-espumil': 'Espumil', 'banana-brasil': 'Banana Brasil',
    'lauton': 'Lauton', 'abelha-rainha': 'Abelha Rainha', 'apisvida': 'Apisvida',
};

// ---------- foto escolhida à mão, quando a automática não é a melhor ----------
// Depois de unificar tamanhos, cada produto fica com uma foto só. Estas foram
// conferidas uma a uma: em todas, o arquivo abaixo mostra a embalagem maior da
// lista (ou é simplesmente a foto mais nítida do mesmo item).
const FOTOS_PREFERIDAS = {
    'Néctar Maratá Laranja': 'assets/produtos/distririo/marata__nectar-marata-laranja.jpg',
    'Néctar Maratá Uva': 'assets/produtos/distririo/marata__nectar-marata-uva.jpg',
    'Lava Roupas Líquido Espumil': 'assets/produtos/distririo/espumil__lava-roupas-liquido-espumil.jpg',
    'Azeitona Verde Sachê Fatiada': 'assets/produtos/distririo/rivoli__azeitona-verde-sache-fatiada.jpg',
    'Azeitona Verde Sachê c/ Caroço': 'assets/produtos/distririo/rivoli__azeitona-verde-sache-c-caroco.jpg',
    'Azeitona Verde Sachê s/ Caroço': 'assets/produtos/distririo/rivoli__azeitona-verde-sache-s-caroco.jpg',
    'Água de Coco': 'assets/produtos/distririo/aqua-coco__agua-de-coco.jpg',
};

// ---------- desambiguação dos três nomes repetidos ----------
const DESAMBIGUAR = {
    'Trident Max|Cool Raspberry': 'Trident Max Cool Raspberry',
    'Bis|Bis 10 ao Leite, Bis 10 Laka': 'Bis 10',
    'Bubbaloo Balas|Bubbaloo Bala Tutti-Frutti 75G, Bubbaloo Bala Morango Azedinha 82.5G, Bubbaloo Bala Mix Azedinha 82.5G, Bubbaloo Bala Morango 75G, Bubbaloo Bala Citric Blueberry 82.5G, Bubbaloo Bala Mix 75G': 'Bubbaloo Balas Pote',
};

// ---------- roteia o que veio da Farma ----------
const secoesNovas = new Map();
const finais = produtos.map(p => {
    let categoria = p.categoria;
    let marca = p.marca;
    if (categoria === 'farma') {
        const r = rotear(p.nome);
        categoria = r.categoria;
        if (r.novaSecao) secoesNovas.set(r.novaSecao[0], r.novaSecao[1]);
        if (!marca) marca = marcaDoNome(p.nome) || MARCA_SECAO[categoria] || '';
    }
    const chaveDesamb = p.nome + '|' + (p.linha || '');
    const nome = DESAMBIGUAR[chaveDesamb] || p.nome;
    const img = FOTOS_PREFERIDAS[nome] || p.img;
    return { ...p, nome, img, categoria, marca: marca || MARCA_SECAO[categoria] || '' };
});

// ---------- embalagens: junta o que é a mesma informação em duas linhas ----------
// "30 cápsulas" + "30 unidades de 500 mg" descrevem o mesmo frasco.
function arrumarEmbalagens(lista) {
    const forma = lista.find(e => /^\d+\s+(cápsulas|comprimidos)$/i.test(e));
    const dose = lista.find(e => /^\d+\s+unidades de\s+/i.test(e));
    if (forma && dose) {
        const n = forma.match(/^(\d+)/)[1];
        const nDose = dose.match(/^(\d+)/)[1];
        if (n === nDose) {
            const unidade = forma.replace(/^\d+\s+/, '');
            const medida = dose.replace(/^\d+\s+unidades de\s+/i, '');
            const juntas = `${n} ${unidade} de ${medida}`;
            return [juntas].concat(lista.filter(e => e !== forma && e !== dose));
        }
    }
    return lista;
}
finais.forEach(p => { p.embalagens = arrumarEmbalagens(p.embalagens); });

// ---------- ids únicos ----------
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const usados = new Map();
finais.forEach(p => {
    let base = slug(p.nome) || 'produto';
    const n = (usados.get(base) || 0) + 1;
    usados.set(base, n);
    p.id = n === 1 ? base : `${base}-${n}`;
});

// ---------- ordem final das seções ----------
const ordemFinal = [...ordem];
for (const [id] of [...SUBCATEGORIAS.map(s => [s[0], s[1]]), SUB_PADRAO].filter(([id]) => secoesNovas.has(id))) {
    if (!ordemFinal.includes(id)) ordemFinal.push(id);
}
const categorias = ordemFinal
    .filter(id => finais.some(p => p.categoria === id))
    .map(id => ({
        id,
        titulo: titulos[id] || secoesNovas.get(id) || id,
        marca: MARCA_SECAO[id] || '',
        total: finais.filter(p => p.categoria === id).length,
    }));

// ---------- ordena produtos pela ordem das seções ----------
const pos = Object.fromEntries(categorias.map((c, i) => [c.id, i]));
finais.sort((a, b) => (pos[a.categoria] - pos[b.categoria]) || 0);

const saida = {
    _leiame: 'Fonte única do catálogo. Editar aqui e rodar "node tools/build.js" para regenerar loja.html, as páginas de produto, o índice de busca e o sitemap. Não editar o catálogo direto no HTML.',
    atualizado: new Date().toISOString().slice(0, 10),
    total: finais.length,
    categorias,
    produtos: finais.map(p => ({
        id: p.id,
        nome: p.nome,
        categoria: p.categoria,
        marca: p.marca,
        linha: p.linha || undefined,
        embalagens: p.embalagens.length ? p.embalagens : undefined,
        skus: p.skus.length ? p.skus : undefined,
        img: p.img || undefined,
        keywords: p.keywords,
    })),
};

fs.writeFileSync(path.join(root, 'data', 'produtos.json'), JSON.stringify(saida, null, 2).replace(/\n/g, '\r\n'), 'utf8');
console.log('data/produtos.json:', saida.total, 'produtos em', categorias.length, 'categorias');
console.log('sem foto:', finais.filter(p => !p.img).length);
console.log();
categorias.forEach(c => console.log('  ', c.id.padEnd(22), String(c.total).padStart(3), c.titulo, c.marca ? '· ' + c.marca : ''));
