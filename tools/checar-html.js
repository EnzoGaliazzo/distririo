'use strict';
// Confere se as tags das páginas fecham na ordem em que abriram.
//
// O navegador não reclama de <div> sem fechar: ele reaninha em silêncio. Foi
// assim que o cadastro em duas etapas ficou uma semana quebrado — faltavam
// quatro </div>, a etapa 2 foi parar dentro da etapa 1, e o "Continuar", que
// esconde a primeira, escondia as duas.
//
// Tags de fechamento opcional pela especificação (p, li, option...) podem ficar
// abertas sem acusar; <div>, <form>, <section> e o resto, não.
// Uso: node tools/checar-html.js [arquivo...]   (sem argumento, o site inteiro;
//      sai com 1 se achar problema)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const VAZIAS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const FECHO_OPCIONAL = new Set(['p', 'li', 'dt', 'dd', 'option', 'optgroup', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
    'colgroup', 'caption', 'rp', 'rt', 'html', 'head', 'body']);

function paginas() {
    const lista = [];
    const ler = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((e) => {
        const rel = path.posix.join(dir, e.name);
        if (e.isDirectory()) {
            if (['produto', 'marca', 'tools'].includes(rel) || rel === 'tools/partials') ler(rel);
        } else if (e.name.endsWith('.html') && (!rel.startsWith('tools/') || rel.startsWith('tools/partials/'))) {
            lista.push(rel);
        }
    });
    ler('.');
    return lista.map((p) => p.replace(/^\.\//, ''));
}

// Troca por espaços o que não é marcação (comentário, script, style), mantendo
// as quebras de linha para o número da linha continuar certo.
function semConteudoCru(html) {
    const apagar = (trecho) => trecho.replace(/[^\n]/g, ' ');
    return html
        .replace(/<!--[\s\S]*?-->/g, apagar)
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, apagar);
}

function conferir(arquivo) {
    const html = semConteudoCru(fs.readFileSync(path.resolve(root, arquivo), 'utf8'));
    const problemas = [];
    const pilha = [];
    const linhaDe = (pos) => html.slice(0, pos).split('\n').length;
    const nome = (a) => a.tag + (a.id ? '#' + a.id : a.classe ? '.' + a.classe.split(/\s+/)[0] : '');
    const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
    let m;
    while ((m = re.exec(html))) {
        const fecha = m[1] === '/';
        const tag = m[2].toLowerCase();
        const attrs = m[3];
        if (VAZIAS.has(tag)) continue;
        if (!fecha) {
            if (/\/\s*$/.test(attrs)) continue; // <path ... /> do SVG
            const id = (attrs.match(/\bid="([^"]*)"/) || [])[1] || '';
            const classe = (attrs.match(/\bclass="([^"]*)"/) || [])[1] || '';
            pilha.push({ tag, id, classe, linha: linhaDe(m.index) });
            continue;
        }
        let i = pilha.length - 1;
        while (i >= 0 && pilha[i].tag !== tag) i--;
        if (i < 0) {
            problemas.push(`${arquivo}:${linhaDe(m.index)}: </${tag}> sem abertura`);
            continue;
        }
        const abertas = pilha.slice(i + 1).filter((a) => !FECHO_OPCIONAL.has(a.tag));
        if (abertas.length) {
            problemas.push(`${arquivo}:${linhaDe(m.index)}: </${tag}> fecha <${nome(pilha[i])}> (linha ${pilha[i].linha}) ` +
                'com tag aberta dentro: ' + abertas.map((a) => `<${nome(a)}> linha ${a.linha}`).join(', '));
        }
        pilha.length = i;
    }
    pilha.filter((a) => !FECHO_OPCIONAL.has(a.tag)).forEach((a) => {
        problemas.push(`${arquivo}:${a.linha}: <${nome(a)}> nunca fecha`);
    });
    return problemas;
}

const lista = process.argv.length > 2 ? process.argv.slice(2) : paginas();
const todos = lista.flatMap(conferir);
if (todos.length) {
    todos.forEach((p) => {
        console.log(p);
        if (process.env.GITHUB_ACTIONS) console.log(`::error title=HTML mal aninhado::${p}`);
    });
    console.log(`\n${todos.length} problema(s) de aninhamento em ${lista.length} páginas.`);
    process.exit(1);
}
console.log(`${lista.length} páginas: todas as tags fecham na ordem.`);
