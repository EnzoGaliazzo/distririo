// Confere o catálogo do site contra os produtos que tiveram movimento no
// WinThor (rotina 123, ABC de venda por produto).
//
//   node tools/winthor/analisar-giro.js [giro.csv]
//
// Responde três coisas:
//   - quais produtos do site ainda giram (ficam no site);
//   - quais não aparecem no movimento do período (candidatos a sair);
//   - quais itens do ERP giram e não têm nada parecido no site (candidatos a
//     entrar, cada um ainda dependendo de foto e texto).
//
// Nada é alterado no catálogo. A saída é para o Enzo decidir.
//
// A relação não é de um para um: no site "Trident 5S" é um produto, e no
// WinThor são vários códigos, um por sabor. Por isso a pergunta certa não é
// "qual código é esse produto", e sim "existe algum código do ERP que seja
// desse produto".

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');
const ENTRADA = process.argv[2] || path.join(__dirname, 'export', 'giro.csv');
const SAIDA = path.join(__dirname, 'export', 'conferencia-catalogo.csv');

function normalizar(texto) {
    return String(texto || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/\b\d{4,}\b/g, ' ')                       // código do fabricante no nome
        .replace(/C\/\s?\d+\s?[XU]/g, ' ')                 // c/21x8g, c/12u
        .replace(/\d+\s?UN\s?X\s?[\d,.]+\s?G?/g, ' ')      // 12UNX80G
        .replace(/[\d,.]+\s?(KG|ML|LT|L|G)\b/g, ' ')       // 1KG, 473ML
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();
}

// Tokens de duas letras contam: "5S", "14S" e "BAG" é que distinguem um
// Trident do outro. Só o que tem uma letra vira ruído.
function palavras(texto) {
    return normalizar(texto).split(' ').filter(p => p.length >= 2);
}

function mesmaPalavra(a, b) {
    if (a === b) return true;
    const curta = a.length < b.length ? a : b;
    const longa = a.length < b.length ? b : a;
    return curta.length >= 4 && longa.startsWith(curta);
}

// O produto do site "está no" item do ERP quando todas as palavras do nome do
// site aparecem na descrição do ERP. Sobra do lado do ERP é esperado: é o
// sabor e a embalagem.
function contem(itemErp, produtoSite) {
    return produtoSite.every(p => itemErp.some(q => mesmaPalavra(p, q)));
}

function lerCsv(arquivo) {
    const bruto = fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, '');
    const linhas = bruto.split(/\r?\n/).filter(l => l.trim());
    const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ',';
    const cab = linhas[0].split(sep).map(normalizar);
    const achar = (...nomes) => cab.findIndex(c => nomes.some(n => c === n || c.includes(n)));
    const iCod = achar('CODIGO', 'CODPROD');
    const iDesc = achar('DESCRICAO', 'PRODUTO');
    if (iCod < 0 || iDesc < 0) throw new Error('CSV precisa de código e descrição. Lido: ' + cab.join(' | '));
    return linhas.slice(1).map(function (l) {
        const c = l.split(sep);
        return { codigo: (c[iCod] || '').trim(), descricao: (c[iDesc] || '').trim() };
    }).filter(p => p.codigo && p.descricao);
}

function main() {
    const erp = lerCsv(ENTRADA).map(p => Object.assign({ tokens: palavras(p.descricao) }, p));
    const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'produtos.json'), 'utf8'));
    const cats = {};
    dados.categorias.forEach(c => { cats[c.id] = c; });

    const linhas = [['situacao', 'id_site', 'nome_no_site', 'marca', 'codigos_winthor', 'descricoes_winthor'].join(';')];
    const usados = new Set();
    let ficam = 0;
    let saem = 0;

    dados.produtos.forEach(function (p) {
        const marca = p.marca || (cats[p.categoria] || {}).marca || '';
        const tokens = palavras(p.nome);
        const achados = erp.filter(e => contem(e.tokens, tokens));
        achados.forEach(e => usados.add(e.codigo));
        if (achados.length) ficam++; else saem++;
        linhas.push([
            achados.length ? 'gira' : 'sem movimento',
            p.id, p.nome, marca,
            achados.map(e => e.codigo).join(' '),
            achados.map(e => e.descricao).join(' | '),
        ].map(v => String(v).replace(/;/g, ',')).join(';'));
    });

    const novos = erp.filter(e => !usados.has(e.codigo));
    novos.forEach(function (e) {
        linhas.push(['fora do site', '', '', '', e.codigo, e.descricao]
            .map(v => String(v).replace(/;/g, ',')).join(';'));
    });

    fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
    fs.writeFileSync(SAIDA, '﻿' + linhas.join('\r\n'), 'utf8');

    console.log('ERP com movimento: ' + erp.length + ' | site: ' + dados.produtos.length);
    console.log('do site, giram: ' + ficam + ' | sem movimento no periodo: ' + saem);
    console.log('itens do ERP que giram e nao tem par no site: ' + novos.length);
    console.log('conferir em ' + path.relative(RAIZ, SAIDA));
}

main();
