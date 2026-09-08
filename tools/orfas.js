'use strict';
// Lista (e opcionalmente apaga) imagens que nenhuma página referencia.
// Uso: node tools/orfas.js          -> só lista
//      node tools/orfas.js --apagar -> remove
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
process.chdir(root);

const referencias = [];
(function varrer(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) varrer(p);
        else if (/\.(html|css|js|json|webmanifest|xml)$/i.test(e.name)) referencias.push(fs.readFileSync(p, 'utf8'));
    }
})('.');
const texto = referencias.join('\n');

const imagens = [];
(function varrerImgs(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name).split(path.sep).join('/');
        if (e.isDirectory()) varrerImgs(p);
        else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(e.name)) imagens.push(p);
    }
})('assets');

// Um .webp/.avif é usado se o .jpg irmão for citado (o <picture> monta o nome).
function ehUsada(arquivo) {
    const base = arquivo.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    return texto.includes(arquivo) ||
        texto.includes(base + '.jpg') ||
        texto.includes(base + '.png') ||
        texto.includes(base + '.webp');
}

const orfas = imagens.filter(f => !ehUsada(f));
let bytes = 0;
orfas.forEach(f => { bytes += fs.statSync(f).size; });

console.log(`imagens: ${imagens.length} | órfãs: ${orfas.length} | ${(bytes / 1024).toFixed(0)} KB`);
orfas.forEach(f => console.log('  ', f, (fs.statSync(f).size / 1024).toFixed(0) + 'KB'));

if (process.argv.includes('--apagar')) {
    orfas.forEach(f => fs.unlinkSync(f));
    console.log(`\n${orfas.length} arquivos removidos.`);
} else if (orfas.length) {
    console.log('\n(rode com --apagar para remover)');
}
