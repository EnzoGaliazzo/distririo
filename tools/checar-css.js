'use strict';
// Lista seletores declarados mais de uma vez no style.css e mostra qual
// propriedade a declaração de baixo tira da de cima.
//
// Existe por causa de um bug real: `.btn-ghost` estava escrito duas vezes com
// valores opostos — contorno branco para fundo escuro e contorno vermelho para
// fundo claro. A última do arquivo ganhava, e o botão "Falar no WhatsApp" saía
// vermelho em cima do brilho vermelho da faixa, ilegível, no ar.
//
// Não reprova nada: duplicata não é erro por si só, e várias das que existem
// hoje produzem o resultado certo. É um relatório para você olhar antes de
// mexer numa regra que aparece aqui — porque mexer na de cima pode não ter
// efeito nenhum.
//
//   node tools/checar-css.js            só as que sobrescrevem valor
//   node tools/checar-css.js --todas    inclui as que não conflitam

const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, '..', 'style.css');
const bruto = fs.readFileSync(arquivo, 'utf8').replace(/\r\n/g, '\n');
// tira comentários para o parser não tropeçar em chave dentro de comentário
const css = bruto.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));

const regras = [];
const contexto = [];
let buffer = '';
let linha = 1;
let i = 0;

while (i < css.length) {
    const c = css[i];
    if (c === '\n') linha++;

    if (c === '{') {
        const cabecalho = buffer.trim();
        buffer = '';
        if (cabecalho.startsWith('@')) {
            contexto.push(cabecalho);
            i++;
            continue;
        }
        // acha a chave que fecha esta regra
        let j = i + 1;
        let nivel = 1;
        while (j < css.length && nivel) {
            if (css[j] === '{') nivel++;
            else if (css[j] === '}') nivel--;
            j++;
        }
        const corpo = css.slice(i + 1, j - 1);
        const props = new Map();
        for (const decl of corpo.split(';')) {
            const k = decl.indexOf(':');
            if (k > 0) props.set(decl.slice(0, k).trim(), decl.slice(k + 1).trim());
        }
        for (const sel of cabecalho.split(',')) {
            const s = sel.trim();
            if (s) regras.push({ sel: s, props, linha, ctx: contexto.join(' > ') });
        }
        linha += (css.slice(i, j).match(/\n/g) || []).length;
        i = j;
        continue;
    }

    if (c === '}') {
        contexto.pop();
        buffer = '';
        i++;
        continue;
    }

    buffer += c;
    i++;
}

const grupos = new Map();
for (const r of regras) {
    const chave = r.ctx + '||' + r.sel;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(r);
}

const conflitos = [];
const inofensivas = [];
for (const [, ocorrencias] of grupos) {
    if (ocorrencias.length < 2) continue;
    const sobrescritas = [];
    for (let d = 1; d < ocorrencias.length; d++) {
        for (let a = 0; a < d; a++) {
            for (const [k, v] of ocorrencias[d].props) {
                const antigo = ocorrencias[a].props.get(k);
                if (antigo !== undefined && antigo !== v) {
                    sobrescritas.push({ prop: k, deLinha: ocorrencias[a].linha, de: antigo, paraLinha: ocorrencias[d].linha, para: v });
                }
            }
        }
    }
    (sobrescritas.length ? conflitos : inofensivas).push({ r: ocorrencias[0], linhas: ocorrencias.map(o => o.linha), sobrescritas });
}

const corta = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const rotulo = r => r.sel + (r.ctx ? `   [dentro de ${r.ctx}]` : '');

console.log(`style.css: ${regras.length} regras, ${grupos.size} seletores distintos`);
console.log(`duplicatas que sobrescrevem valor: ${conflitos.length} | duplicatas sem conflito: ${inofensivas.length}\n`);

conflitos.sort((a, b) => b.sobrescritas.length - a.sobrescritas.length);
for (const c of conflitos) {
    console.log(`${rotulo(c.r)}   linhas ${c.linhas.join(', ')}`);
    const vistas = new Set();
    for (const s of c.sobrescritas) {
        if (vistas.has(s.prop)) continue;
        vistas.add(s.prop);
        console.log(`    ${s.prop.padEnd(20)} L${String(s.deLinha).padEnd(5)} ${corta(s.de, 32).padEnd(33)} -> L${String(s.paraLinha).padEnd(5)} ${corta(s.para, 40)}`);
    }
    console.log('');
}

if (process.argv.includes('--todas')) {
    console.log('=== duplicatas sem conflito de valor ===');
    for (const c of inofensivas) console.log(`${rotulo(c.r)}   linhas ${c.linhas.join(', ')}`);
    console.log('');
}

console.log('Nenhuma dessas é erro por si só — a de baixo ganhar pode ser exatamente o');
console.log('que se quer. Serve para você conferir antes de editar: mexer na declaração');
console.log('de cima de um seletor que aparece aqui pode não ter efeito nenhum.');
