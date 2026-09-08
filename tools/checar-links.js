'use strict';
// Confere que todo caminho local citado no HTML existe de verdade.
// Pega imagem sumida, página de produto que não foi gerada e âncora quebrada.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
process.chdir(root);

const paginas = [];
(function varrer(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.git', 'tools', '.github'].includes(e.name)) continue;
        const p = path.join(dir, e.name).split(path.sep).join('/');
        if (e.isDirectory()) varrer(p);
        else if (e.name.endsWith('.html')) paginas.push(p.replace(/^\.\//, ''));
    }
})('.');

// Só href/src/srcset: "content" traz texto de metatag, não caminho.
const RE_REF = /(href|src|srcset)="([^"]+)"/g;
const problemas = [];
let conferidos = 0;

// Âncoras válidas por página, para checar os #links internos.
const ancoras = new Map();
for (const pagina of paginas) {
    const html = fs.readFileSync(pagina, 'utf8');
    const ids = new Set();
    let m;
    const reId = /\sid="([^"]+)"/g;
    while ((m = reId.exec(html)) !== null) ids.add(m[1]);
    ancoras.set(pagina, ids);
}

for (const pagina of paginas) {
    const html = fs.readFileSync(pagina, 'utf8');
    const dir = path.dirname(pagina);
    let m;
    RE_REF.lastIndex = 0;
    while ((m = RE_REF.exec(html)) !== null) {
        // srcset é uma lista separada por vírgula; href e src são um valor só.
        const partes = m[1] === 'srcset' ? m[2].split(',') : [m[2]];
        for (const bruto of partes) {
            const ref = bruto.trim().split(' ')[0];
            if (!ref) continue;
            if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(ref)) {
                // âncora na própria página
                if (ref.startsWith('#') && ref.length > 1) {
                    conferidos++;
                    if (!ancoras.get(pagina).has(decodeURIComponent(ref.slice(1)))) {
                        problemas.push(`${pagina}: âncora inexistente ${ref}`);
                    }
                }
                continue;
            }
            const [caminho, hash] = ref.split('#');
            if (!caminho) continue;
            const alvo = caminho.startsWith('/')
                ? path.join(root, caminho.slice(1))
                : path.join(root, dir, caminho);
            conferidos++;
            if (!fs.existsSync(alvo)) {
                problemas.push(`${pagina}: não existe -> ${ref}`);
                continue;
            }
            if (hash && alvo.endsWith('.html')) {
                const rel = path.relative(root, alvo).split(path.sep).join('/');
                const ids = ancoras.get(rel);
                if (ids && !ids.has(decodeURIComponent(hash))) {
                    problemas.push(`${pagina}: âncora inexistente em ${rel} -> #${hash}`);
                }
            }
        }
    }
}

console.log(`${paginas.length} páginas · ${conferidos} referências conferidas`);
if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):`);
    problemas.slice(0, 60).forEach(p => console.error('  ', p));
    if (problemas.length > 60) console.error(`   ... e mais ${problemas.length - 60}`);
    process.exit(1);
}
console.log('nenhum caminho quebrado.');
