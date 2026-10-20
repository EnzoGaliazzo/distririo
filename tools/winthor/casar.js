// Casa os produtos do site com o cadastro do WinThor.
//
//   node tools/winthor/casar.js [arquivo.csv]
//
// Entrada: o CSV exportado do WinThor (padrão: tools/winthor/export/estoque.csv).
// Aceita ; ou , como separador e cabeçalho em qualquer ordem; só precisa ter
// uma coluna de código e uma de descrição. Estoque é opcional.
//
// Saída: tools/winthor/export/de-para-sugerido.csv, com uma linha por produto
// do site, o candidato do WinThor e a confiança do palpite. Nada é alterado no
// catálogo: o arquivo é para conferência humana antes de virar o de-para.

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');
const ENTRADA = process.argv[2] || path.join(__dirname, 'export', 'estoque.csv');
const SAIDA = path.join(__dirname, 'export', 'de-para-sugerido.csv');

// "8462 GELATINES DENTES VAMP 12UNX80G" e "Trident 5S" não se parecem se a
// comparação for literal: o WinThor abrevia, põe o código do fabricante na
// frente e grava tudo em maiúscula sem acento.
function normalizar(texto) {
    return String(texto || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/\b\d{4,}\b/g, ' ')                 // código do fabricante colado no nome
        .replace(/\d+\s?UN\s?X\s?\d+\s?G?/g, ' ')    // 12UNX80G
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();
}

function palavras(texto) {
    return normalizar(texto).split(' ').filter(p => p.length > 2);
}

// Jaccard sobre as palavras: simples, e o bastante para separar o candidato
// óbvio do resto. O que ficar abaixo do corte vai para conferência de
// qualquer jeito, então não compensa algo mais elaborado aqui.
function semelhanca(a, b) {
    const A = new Set(palavras(a));
    const B = new Set(palavras(b));
    if (!A.size || !B.size) return 0;
    let comuns = 0;
    A.forEach(p => { if (B.has(p)) comuns++; });
    return comuns / (A.size + B.size - comuns);
}

function lerCsv(arquivo) {
    const bruto = fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, '');
    const linhas = bruto.split(/\r?\n/).filter(l => l.trim());
    if (!linhas.length) throw new Error('CSV vazio: ' + arquivo);

    const pontoEVirgula = (linhas[0].match(/;/g) || []).length;
    const virgula = (linhas[0].match(/,/g) || []).length;
    const sep = pontoEVirgula >= virgula ? ';' : ',';

    const cab = linhas[0].split(sep).map(normalizar);
    const achar = (...nomes) => cab.findIndex(c => nomes.some(n => c.includes(n)));
    const iCod = achar('CODIGO', 'CODPROD', 'COD PROD');
    const iDesc = achar('DESCRICAO', 'PRODUTO');
    const iEst = achar('EST ATUAL', 'ESTOQUE', 'DISPONIVEL', 'QTD');
    if (iCod < 0 || iDesc < 0) {
        throw new Error('O CSV precisa de uma coluna de código e uma de descrição. ' +
            'Cabeçalho lido: ' + cab.join(' | '));
    }

    return linhas.slice(1).map(function (linha) {
        const c = linha.split(sep);
        const est = iEst >= 0
            ? Number(String(c[iEst] || '').replace(/\./g, '').replace(',', '.'))
            : null;
        return {
            codigo: (c[iCod] || '').trim(),
            descricao: (c[iDesc] || '').trim(),
            estoque: iEst >= 0 ? (Number.isFinite(est) ? est : 0) : null,
        };
    }).filter(p => p.codigo && p.descricao);
}

function main() {
    if (!fs.existsSync(ENTRADA)) {
        console.error('Não achei o export do WinThor em:\n  ' + ENTRADA +
            '\nRode a rotina 1130 (ou a consulta de tools/winthor/consulta.sql) e salve o CSV aí.');
        process.exit(1);
    }

    const erp = lerCsv(ENTRADA);
    const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'produtos.json'), 'utf8'));
    const cats = {};
    dados.categorias.forEach(c => { cats[c.id] = c; });

    const cabecalho = ['id_site', 'nome_no_site', 'marca', 'codigo_winthor',
        'descricao_winthor', 'estoque', 'confianca'];
    const linhas = [cabecalho.join(';')];
    const contagem = { alta: 0, media: 0, baixa: 0 };

    dados.produtos.forEach(function (p) {
        const marca = p.marca || (cats[p.categoria] || {}).marca || '';
        const alvo = p.nome + ' ' + marca;
        let melhor = null;
        let nota = 0;
        erp.forEach(function (e) {
            const s = semelhanca(alvo, e.descricao);
            if (s > nota) { nota = s; melhor = e; }
        });

        const faixa = nota >= 0.6 ? 'alta' : nota >= 0.35 ? 'media' : 'baixa';
        contagem[faixa]++;

        // Abaixo do corte o candidato é ruído: mostrar "WHEY ... DISPLAY" na
        // linha da azeitona só convida a preencher errado na conferência.
        const sugerido = faixa === 'baixa' ? null : melhor;
        linhas.push([
            p.id,
            p.nome,
            marca,
            sugerido ? sugerido.codigo : '',
            sugerido ? sugerido.descricao : '',
            sugerido && sugerido.estoque !== null ? sugerido.estoque : '',
            faixa,
        ].map(v => String(v).replace(/;/g, ',')).join(';'));
    });

    fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
    fs.writeFileSync(SAIDA, '﻿' + linhas.join('\r\n'), 'utf8');

    console.log('WinThor: ' + erp.length + ' produtos lidos | site: ' + dados.produtos.length);
    console.log('casamento: ' + contagem.alta + ' alta, ' + contagem.media +
        ' média, ' + contagem.baixa + ' baixa');
    console.log('conferir em ' + path.relative(RAIZ, SAIDA));
}

main();
