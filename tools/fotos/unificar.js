'use strict';
// Unifica cadastros que são o mesmo produto.
//
//     node tools/fotos/unificar.js <id-que-fica> <id-que-some> [mais ids...]
//
// Exemplo:
//     node tools/fotos/unificar.js nanopropolis-extrato-de-propolis-vermelho \
//          nanopropolis-propolis-blend-em-gotas
//
// O ERP exportou o mesmo item com dois nomes (o da planilha e o do catálogo da
// marca) dezenas de vezes. Quem some sai de data/produtos.json e entra em
// data/redirecionamentos.json, para o endereço antigo continuar respondendo:
// ele pode estar no Google ou num WhatsApp já enviado. O build transforma isso
// numa página com noindex e canonical para o cadastro que ficou.
//
// Depois: npm run build && npm run checar.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..', '..');
const arqProdutos = path.join(raiz, 'data', 'produtos.json');
const arqRedir = path.join(raiz, 'data', 'redirecionamentos.json');

const [fica, ...absorvidos] = process.argv.slice(2);
if (!fica || !absorvidos.length) {
    console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 17).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(1);
}

const dados = JSON.parse(fs.readFileSync(arqProdutos, 'utf8'));
const redirecionamentos = fs.existsSync(arqRedir) ? JSON.parse(fs.readFileSync(arqRedir, 'utf8')) : {};

const porId = new Map(dados.produtos.map(p => [p.id, p]));
if (!porId.has(fica)) {
    console.error(`O id que fica não existe: ${fica}`);
    process.exit(1);
}
const ausentes = absorvidos.filter(id => !porId.has(id));
if (ausentes.length) {
    console.error(`Id que não existe no catálogo: ${ausentes.join(', ')}`);
    process.exit(1);
}

const destino = porId.get(fica);
for (const id of absorvidos) {
    const some = porId.get(id);
    // embalagem que só existia no cadastro absorvido não pode se perder
    if (some.embalagens && some.embalagens.length) {
        destino.embalagens = Array.from(new Set([...(destino.embalagens || []), ...some.embalagens]));
    }
    if (some.skus && some.skus.length) {
        destino.skus = Array.from(new Set([...(destino.skus || []), ...some.skus]));
    }
    if (!destino.img && some.img) destino.img = some.img;
    redirecionamentos[id] = fica;
    console.log(`${id}  ->  ${fica}`);
}

dados.produtos = dados.produtos.filter(p => !absorvidos.includes(p.id));
dados.total = dados.produtos.length;

fs.writeFileSync(arqProdutos, JSON.stringify(dados, null, 2) + '\n');
fs.writeFileSync(arqRedir, JSON.stringify(redirecionamentos, null, 2) + '\n');
console.log(`\ncatálogo: ${dados.total} produtos · redirecionamentos: ${Object.keys(redirecionamentos).length}`);
console.log('Agora rode: npm run build && npm run checar');
