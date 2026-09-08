const d = require('../data/catalogo-bruto.json');
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/^\d{3,5}\s+/, '')
    .replace(/\b(\d+(?:[,.]\d+)?)\s*(ml|l|g|kg|mg|un)\b/g, '')
    .replace(/\b\d+x\d+(mg|g|ml)\b/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

const fora = d.produtos.filter(p => p.categoria !== 'farma');
const farma = d.produtos.filter(p => p.categoria === 'farma');
const idx = new Map();
fora.forEach(p => { const k = norm(p.nome); if (!idx.has(k)) idx.set(k, []); idx.get(k).push(p); });

let exatos = 0;
const achados = [];
farma.forEach(p => {
    const k = norm(p.nome);
    if (idx.has(k)) { exatos++; achados.push([p.nome, idx.get(k)[0].categoria, idx.get(k)[0].nome]); }
});
console.log('Farma:', farma.length, '| batem exatamente com produto de outra seção:', exatos);
achados.forEach(a => console.log('  ', a[0].padEnd(44), '→', a[1].padEnd(16), a[2]));

// prefixos de marca dentro da Farma
const marcas = { Baly: /baly/i, Trio: /^trio /i, Choklers: /choklers/i, Supino: /supino/i, 'Barra Nuts': /^barra nuts|^nuts /i, Nutrilatina: /nutrilatina/i, Propoflex: /propoflex/i, 'Nanoprópolis': /nanopropolis|nanoprópolis/i, Halfresh: /halfresh/i, 'Banana Brasil': /banana (passa|brasil)/i };
console.log('\nmarcas reconhecíveis dentro da Farma:');
for (const [m, re] of Object.entries(marcas)) console.log('  ', m.padEnd(16), farma.filter(p => re.test(p.nome)).length);
