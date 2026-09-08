'use strict';
// Lê data/catalogo-bruto.json, limpa os nomes, unifica as linhas duplicadas que
// vieram da exportação de ERP e grava data/produtos.json — a fonte única.
const fs = require('fs');
const path = require('path');
const { limparNome, humanizarEmbalagem } = require('./limpar-nome');

const root = path.join(__dirname, '..');
const bruto = require(path.join(root, 'data', 'catalogo-bruto.json'));

// ---------- marcas por seção ----------
const MARCA = {
    'mdz-trident': 'Mondelez', 'mdz-trident-xsenses': 'Mondelez', 'mdz-chiclets-adams': 'Mondelez',
    'mdz-trident-max': 'Mondelez', 'mdz-bubbaloo': 'Mondelez', 'mdz-halls': 'Mondelez',
    'mdz-tang': 'Mondelez', 'mdz-oreo': 'Mondelez', 'mdz-club-social': 'Mondelez',
    'mdz-lacta': 'Mondelez', 'mdz-bis': 'Mondelez', 'mdz-bis-xtra': 'Mondelez',
    'mdz-lacta-intense': 'Mondelez',
    'baly': 'Baly Brasil', 'dr-aqua-coco': 'Aqua Coco', 'dr-sumo': 'Sumo',
    'dr-marata': 'Maratá', 'dr-mara-tinho': 'Mara-tinho', 'dr-gota': 'Gota',
    'dr-rivoli': 'Rivoli', 'dr-trio': 'Trio', 'dr-kobber': 'Kobber',
    'dr-baldoni': 'Baldoni', 'dr-ace': 'Ace', 'dr-espumil': 'Espumil',
    'banana-brasil': 'Banana Brasil', 'lauton': 'Lauton',
    'abelha-rainha': 'Abelha Rainha', 'apisvida': 'Apisvida',
};

// ---------- apelidos para casar linha de ERP com produto curado ----------
const ALIAS = [
    [/^Energético Baly$/i, 'Baly Tradicional'],
    [/^Energético Baly Frutas Tropicais$/i, 'Baly Tropical'],
    [/^Energético Baly Champanhe.*$/i, 'Baly Celebre Champagne'],
    [/^Energético Baly Floripa Spritz.*$/i, 'Baly Celebre Floripa'],
    [/^Energético Cereja Baly (.*)$/i, 'Baly Cereja $1'],
    [/^Energético Baly 250 ml Lata$/i, 'Baly Tradicional'],
    [/^Energético Frutas Tropicais$/i, 'Baly Tropical'],
    [/^Energético (Maçã Verde|Cereja)$/i, 'Baly $1'],
    [/^Energético (Baly.*)$/i, '$1'],
    [/^Suplemento Alimentar (Baly.*)$/i, '$1'],
    [/^Mel T Mônica (.*)$/i, 'Mel Turma da Mônica $1'],
    [/\s+Pote(\s+\d+)?$/i, ''],
];

// "sem" fica de fora da lista: "sem açúcar" e "sem caroço" distinguem produtos.
const STOP = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'com', 'o', 'a', 'os', 'as',
    'em', 'ao', 'no', 'na', 'un', 'unidades', 'lata', 'display', 'barra', 'caixa', 'pote']);

const semAcento = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function chave(nome) {
    let n = nome;
    for (const [re, sub] of ALIAS) if (re.test(n)) { n = n.replace(re, sub); break; }
    const palavras = semAcento(n)
        .replace(/\bc\/\s*/g, 'com ')
        .replace(/\bs\/\s*/g, 'sem ')
        .replace(/\b\d+(?:[,.]\d+)?\s*(ml|l|g|kg|mg)\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter(w => w && !STOP.has(w));
    return palavras.sort().join(' ');
}

// ---------- passo 1: limpar todo mundo ----------
const limpos = bruto.produtos.map(p => {
    const r = limparNome(p.nome);
    const emb = r.embalagem || (p.categoria === 'farma' ? humanizarEmbalagem(p.descricao) : '');
    const ehFarma = p.categoria === 'farma';
    return {
        nomeOriginal: p.nome,
        nome: r.nome,
        sku: r.sku,
        embalagem: emb,
        categoria: p.categoria,
        marca: r.marcaSufixo || MARCA[p.categoria] || '',
        linha: (!ehFarma && p.descricao !== MARCA[p.categoria]) ? p.descricao : '',
        img: p.img,
        keywords: p.keywords,
        curado: !ehFarma,
        chave: chave(r.nome),
    };
});

// ---------- passo 2: agrupar por chave ----------
const grupos = new Map();
for (const p of limpos) {
    if (!grupos.has(p.chave)) grupos.set(p.chave, []);
    grupos.get(p.chave).push(p);
}

const produtos = [];
const relatorio = { fundidos: [], variantes: [], soFarma: [] };

// Dois produtos curados com o mesmo nome mas conteúdo diferente (sabores distintos)
// são produtos distintos, não variações de tamanho — esses não se fundem.
const subgrupos = [];
for (const [k, itens] of grupos) {
    const curados = itens.filter(i => i.curado);
    const linhas = [...new Set(curados.map(c => c.linha).filter(Boolean))];
    if (linhas.length > 1) {
        // separa por linha; as sobras de ERP vão para o primeiro
        const porLinha = new Map();
        curados.forEach(c => { const l = c.linha || linhas[0]; if (!porLinha.has(l)) porLinha.set(l, []); porLinha.get(l).push(c); });
        let primeiro = true;
        for (const [, lista] of porLinha) {
            subgrupos.push(primeiro ? lista.concat(itens.filter(i => !i.curado)) : lista);
            primeiro = false;
        }
    } else {
        subgrupos.push(itens);
    }
}

for (const itens of subgrupos) {
    const curados = itens.filter(i => i.curado);
    const doErp = itens.filter(i => !i.curado);
    const base = curados[0] || doErp[0];

    // limparNome pode devolver mais de uma medida junta ("30 cápsulas · 500 mg");
    // aqui cada uma vira um item da lista, para não duplicar informação depois.
    const embalagens = [...new Set(
        itens.flatMap(i => (i.embalagem || '').split(' · ')).map(e => e.trim()).filter(Boolean)
    )];
    const skus = [...new Set(itens.map(i => i.sku).filter(Boolean))];
    const kw = [...new Set(itens.map(i => i.keywords).join(' ').split(/\s+/).filter(Boolean))].join(' ');

    produtos.push({
        nome: base.nome,
        categoria: base.categoria,
        marca: base.marca,
        linha: curados.map(c => c.linha).find(Boolean) || '',
        embalagens,
        skus,
        img: itens.map(i => i.img).find(Boolean) || null,
        keywords: kw,
        _origem: { curados: curados.length, erp: doErp.length },
    });

    if (curados.length && doErp.length) relatorio.fundidos.push([base.nome, doErp.map(d => d.nomeOriginal)]);
    else if (!curados.length) relatorio.soFarma.push(base.nome);
    else if (curados.length > 1) relatorio.variantes.push([base.nome, curados.length]);
}

console.log('produtos antes:', bruto.produtos.length, '→ depois da unificação:', produtos.length);
console.log('grupos fundidos (curado + ERP):', relatorio.fundidos.length);
console.log('produtos que só existem na Farma:', relatorio.soFarma.length);
console.log('nomes curados repetidos entre si:', relatorio.variantes.length);
if (process.argv[2] === '--detalhe') {
    console.log('\n--- fundidos ---');
    relatorio.fundidos.forEach(([n, o]) => console.log('  ', n.padEnd(44), '←', o.join(' + ')));
    console.log('\n--- repetidos entre curados ---');
    relatorio.variantes.forEach(([n, c]) => console.log('  ', n, '×' + c));
}
module.exports = { produtos, relatorio };
