'use strict';
// Limpeza dos nomes vindos da exportação de ERP: tira o código de SKU, separa a
// embalagem, expande abreviação e devolve o acento que a exportação comeu.

// --- acentos que a exportação perdeu (palavra inteira, preserva a caixa) ---
const ACENTOS = {
    'abobora': 'abóbora', 'acai': 'açaí', 'açai': 'açaí', 'açucar': 'açúcar',
    'aplicaçoes': 'aplicações', 'avela': 'avelã', 'bastao': 'bastão',
    'cafeina': 'cafeína', 'calcio': 'cálcio', 'cisteina': 'cisteína',
    'colageno': 'colágeno', 'curcuma': 'cúrcuma', 'energetico': 'energético',
    'limao': 'limão', 'loçao': 'loção', 'luteina': 'luteína',
    'magnesio': 'magnésio', 'maracuja': 'maracujá', 'marata': 'maratá',
    'miura': 'miúra', 'monica': 'mônica', 'nanopropolis': 'nanoprópolis',
    'nectar': 'néctar', 'nobis': 'nóbis', 'oleo': 'óleo', 'omega': 'ômega',
    'organica': 'orgânica', 'organico': 'orgânico', 'pessego': 'pêssego',
    'primula': 'prímula', 'propolis': 'própolis', 'relampago': 'relâmpago',
    'sache': 'sachê', 'vitaminico': 'vitamínico', 'proteina': 'proteína',
    'côco': 'coco', 'roma': 'romã', 'pes': 'pés', 'guarana': 'guaraná',
};

// --- abreviações de ERP escritas por extenso ---
// Ordem importa: as com ponto primeiro, para não colidir com a versão sem ponto.
const ABREV = [
    [/\bSup\.\s*Alim\./gi, 'Suplemento Alimentar'],
    [/\bOrig\./gi, 'Original'],
    [/\bExt\./gi, 'Extrato'],
    [/\bPróp\./gi, 'Própolis'],
    [/\bAp60-ext\b/gi, 'AP60 Extrato'],
    [/\bMonohidra\b/gi, 'Monohidratada'],
    [/\bVitam\b(?!ina)/gi, 'Vitamina'],
    [/\bMagn\b(?!ésio)/gi, 'Magnésio'],
    [/\bEnerg\b(?!ético)/gi, 'Energético'],
    [/\bCorp\b(?!oral)/gi, 'Corporal'],
    [/\bAmend\b(?!oim)/gi, 'Amendoim'],
    [/\bClar\b(?!ead)/gi, 'Clareamento'],
    [/\b(\d+)\s+Comp\b/gi, '$1 comprimidos'],
    [/\b(\d+)\s+Caps\b/gi, '$1 cápsulas'],
    [/\bC\/\s*choc\.?/gi, 'com Chocolate'],
    [/\bC\/\s*Cho\b/gi, 'com Chocolate'],
    [/\bC\s+Cho\b/gi, 'com Chocolate'],
    [/\bC\s+Choco\b/gi, 'com Chocolate'],
    [/\bC\s+Chocolate\b/gi, 'com Chocolate'],
    [/\bChoco\b(?!late)/gi, 'Chocolate'],
    [/\bChoc\b(?!o)/gi, 'Chocolate'],
    [/\bPêss\b(?!ego)/gi, 'Pêssego'],
    [/\bMor\b(?!ango)/gi, 'Morango'],
    [/\bSab\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, 'Sabor '],
    [/\bNat\b(?!ural)/gi, 'Natural'],
    [/\bMed\b(?!io|ío)/gi, 'Médio'],
    [/\s+C\/\s*/g, ' com '],
    [/\s+S\/\s*/g, ' sem '],
    [/\s+c\/\s*/g, ' c/ '],
    [/\s+s\/\s*/g, ' s/ '],
    [/\bP\/\s*/gi, 'Para '],
    [/\bDisplay com (\d+)U?\b/gi, 'display com $1 unidades'],
];

// --- tamanho colado no fim do nome ---
const RE_TAM = /\s*[-–]?\s*(\d+(?:[,.]\d+)?)\s*(ML|L|G|KG|MG|LITROS?)\s*$/i;
const RE_TAM_NXV = /\s*(\d+)\s*(?:UN)?X\s*(\d+(?:[,.]\d+)?)\s*(ML|L|G|KG|MG)\s*$/i;
// Marca escrita no fim do nome, depois de hífen ("... 300G - Mix Nutri").
const MARCAS_SUFIXO = ['Mix Nutri', 'Pronabol', 'Nutrilatina', 'Apis Vida', 'Apisvida'];
const RE_TAM_COLADO = /([a-zçãõáéíóúâêô])(\d+(?:[,.]\d+)?)(g|ml|kg|mg)\b/gi;

const UNI = { ML: 'ml', L: 'L', G: 'g', KG: 'kg', MG: 'mg', LITRO: 'litro', LITROS: 'litros' };

function tituloDeCaixa(palavra) {
    if (!palavra) return palavra;
    return palavra[0].toUpperCase() + palavra.slice(1);
}

function corrigirAcentos(txt) {
    return txt.replace(/[A-Za-zÀ-ÿ]+/g, w => {
        const alvo = ACENTOS[w.toLowerCase()];
        if (!alvo) return w;
        // "AÇAI" -> "AÇAÍ", "Acai" -> "Açaí", "acai" -> "açaí"
        if (w === w.toUpperCase() && w.length > 1) return alvo.toUpperCase();
        if (w[0] === w[0].toUpperCase()) return tituloDeCaixa(alvo);
        return alvo;
    });
}

function limparNome(bruto) {
    let nome = bruto.trim();
    let sku = '';
    let embalagem = '';

    // 1. código de SKU no começo
    const mSku = nome.match(/^(\d{3,5})\s+/);
    if (mSku) { sku = mSku[1]; nome = nome.slice(mSku[0].length); }

    // 2. apóstrofo solto no fim ("900G'")
    nome = nome.replace(/['']\s*$/, '');

    // 3. unidade colada na palavra ("Damasco24g" -> "Damasco 24g")
    nome = nome.replace(RE_TAM_COLADO, (_, p, n, u) => `${p} ${n}${u}`);

    // 4. marca escrita no fim do nome sai para o próprio campo
    let marcaSufixo = '';
    for (const mk of MARCAS_SUFIXO) {
        const re = new RegExp('\\s*[-–]\\s*' + mk.replace(/ /g, '\\s+') + '\\s*$', 'i');
        if (re.test(nome)) { marcaSufixo = mk === 'Apis Vida' ? 'Apisvida' : mk; nome = nome.replace(re, ''); break; }
    }

    // 5. embalagem no formato "N x V unidade" no fim do nome
    let mn = nome.match(RE_TAM_NXV);
    if (mn) {
        const uni = UNI[mn[3].toUpperCase()] || mn[3].toLowerCase();
        const v = mn[2].replace('.', ',');
        embalagem = mn[3].toUpperCase() === 'MG'
            ? `${mn[1]} unidades de ${v} mg`
            : `Caixa com ${mn[1]} × ${v} ${uni}`;
        nome = nome.slice(0, mn.index).trim();
    }

    // 6. tamanho simples no fim vira embalagem
    let m;
    while (!mn && (m = nome.match(RE_TAM)) !== null) {
        const val = m[1].replace('.', ',');
        const uni = UNI[m[2].toUpperCase()] || m[2].toLowerCase();
        embalagem = `${val} ${uni}` + (embalagem ? ` · ${embalagem}` : '');
        nome = nome.slice(0, m.index).trim();
    }

    // 7. abreviações
    for (const [re, sub] of ABREV) nome = nome.replace(re, sub);

    // 8. acentos
    nome = corrigirAcentos(nome);

    // 8b. contagem de cápsulas/comprimidos no fim do nome é embalagem, não nome
    const mConta = nome.match(/\s+(\d+)\s+(cápsulas?|comprimidos?)\s*$/i);
    if (mConta) {
        const unidade = mConta[2].toLowerCase().replace(/s$/, '') + 's';
        embalagem = embalagem ? `${mConta[1]} ${unidade} · ${embalagem}` : `${mConta[1]} ${unidade}`;
        nome = nome.slice(0, mConta.index).trim();
    }

    // 9. unidade que sobrou no meio do nome ("10ML Display" -> "10 ml Display")
    nome = nome.replace(/\b(\d+(?:[,.]\d+)?)(ML|KG|MG|G|L)\b/gi, (t, n, u) => `${n} ${UNI[u.toUpperCase()] || u.toLowerCase()}`);

    // 10. sobras
    nome = nome.replace(/\s*[-–]\s*$/, '').replace(/\s{2,}/g, ' ').trim();
    nome = nome.replace(/\bvitamina a\b/gi, 'Vitamina A');
    nome = nome.replace(/\bMel Orgânica\b/g, 'Mel Orgânico');

    return { nome, sku, embalagem, marcaSufixo };
}

// --- código de embalagem do ERP ("20X24G") vira frase legível ---
function humanizarEmbalagem(cod) {
    if (!cod) return '';
    const c = cod.trim().toUpperCase().replace(/\s+/g, ' ');
    let m = c.match(/^(\d+)\s*(?:UN)?X\s*(\d+(?:[,.]\d+)?)\s*(MG|G|ML|KG|L)$/);
    if (m) {
        const n = m[1], v = m[2].replace('.', ','), u = UNI[m[3]] || m[3].toLowerCase();
        if (m[3] === 'MG') return `${n} unidades de ${v} mg`;
        return `Caixa com ${n} × ${v} ${u}`;
    }
    m = c.match(/^(\d+(?:[,.]\d+)?)\s*(MG|G|ML|KG|L|LITROS?)$/);
    if (m) {
        const v = m[1].replace('.', ',');
        const u = m[2].startsWith('LITRO') ? (v === '1' ? 'litro' : 'litros') : (UNI[m[2]] || m[2].toLowerCase());
        return `${v} ${u}`;
    }
    m = c.match(/^(\d+(?:[,.]\d+)?)\s*(MG|G|ML|KG|L)\s*\/\s*(\d+(?:[,.]\d+)?)\s*(MG|G|ML|KG|L)$/);
    if (m) return `${m[1].replace('.', ',')} ${UNI[m[2]]} / ${m[3].replace('.', ',')} ${UNI[m[4]]}`;
    return cod;
}

module.exports = { limparNome, humanizarEmbalagem, corrigirAcentos };
