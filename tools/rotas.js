'use strict';
// Para onde vai cada produto que hoje está jogado na categoria "Farma".
// Primeiro tenta a marca que já tem seção própria; o que sobra recebe uma das
// subcategorias novas, que substituem o balaio "Farma".

const PARA_SECAO = [
    [/^(Barra )?Supino|^Supino |^Barra Nuts|^Barra Protein|^Barra de Frutas Kids|^Barra Mini Pouch|^Barra Pé de Moleque|^Barra Pe de Moleque|^B\. Proteica|^Protein\+/i, 'banana-brasil'],
    [/\bBaly\b/i, 'baly'],
    [/^Geleia Baldoni|^Mel Turma da Mônica|^Mel T Mônica/i, 'dr-baldoni'],
    [/^Propoflex|^Nanoprópolis|^Balas Diet Halfresh|Manteiga de Cacau com Própolis|^Spray Própolis|^Extrato de Própolis|^Mel Puro Bisnaga|^Mel Orgânico|^Relâmpago Energético/i, 'apisvida'],
    [/^Hidratante Corporal|^Fitas de Clareamento|^Creme Facial|^Creme para|^Creme Ultra|^Loção|^Vitamina C 20%|^Bastão Acne|^Sabonete Acne|^Kit Acne|^Kit Scudo|^Protetor Sol|^Hidra Facial|^Gel Esfoliante|^Esfoliante|^Óleo de Rosa Mosqueta/i, 'abelha-rainha'],
    [/^Azeitona/i, 'dr-rivoli'],
    [/^Néctar Maratá/i, 'dr-marata'],
    [/^Suco /i, 'dr-sumo'],
    [/^Trio /i, 'dr-trio'],
    [/^Granola/i, 'dr-kobber'],
];

// Subcategorias que substituem a "Farma". Ordem = precedência.
const SUBCATEGORIAS = [
    ['farma-barras', 'Barras e snacks',
        /^Barra |^Choklers|^Mix Nutri Snack|^Banana Passa|Snack/i],
    ['farma-vitaminas', 'Vitaminas e minerais',
        /^Vitamina|^Multi Vitamínico|^Complexo B|^Cálcio|^Ferro |^Zinco|^Cobre|^Cromo|^Magnésio|^Cloreto de Magnésio|^Treonato|^Quadrimag|^Biotina|^Metil Folax|^Luteína|^Licopeno|^Colecalciferol/i],
    ['farma-fitoterapicos', 'Fitoterápicos e naturais',
        /^Própolis|^Óleo de|^Cúrcuma|^Amora|^Laranja Moro|^Ora Pro|^Trimaca|^Procran|^Cranberry|^Nanoprópolis|^Extrato|^Beta Glucana/i],
    ['farma-suplementos', 'Suplementos',
        /^Creatina|Whey|^Diet Shake|^L - Arginina|^Colágeno|^Coenzima|^Cafeína|^Fiberliv|^MSM|^NAC|^Resveratrol|^Melatonina|^Ômega|^Total Efa|^Triptoflex|^Moviflex|^Glutamina|^Proteína/i],
];
const SUB_PADRAO = ['farma-suplementos', 'Suplementos'];

// Marca escrita no próprio nome, para os que não têm seção de marca.
const MARCA_NO_NOME = [
    [/^Choklers/i, 'Choklers'],
    [/^Mix Nutri/i, 'Mix Nutri'],
    [/Nutrilatina/i, 'Nutrilatina'],
    [/Pronabol/i, 'Pronabol'],
    [/Hemovital/i, 'Hemovital'],
];

function rotear(nome) {
    for (const [re, cat] of PARA_SECAO) if (re.test(nome)) return { categoria: cat, novaSecao: null };
    for (const [id, titulo, re] of SUBCATEGORIAS) if (re.test(nome)) return { categoria: id, novaSecao: [id, titulo] };
    return { categoria: SUB_PADRAO[0], novaSecao: SUB_PADRAO };
}

function marcaDoNome(nome) {
    for (const [re, m] of MARCA_NO_NOME) if (re.test(nome)) return m;
    return '';
}

module.exports = { rotear, marcaDoNome, SUBCATEGORIAS, SUB_PADRAO };
