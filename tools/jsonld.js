'use strict';
// Lê as perguntas que já estão no HTML e escreve o JSON-LD correspondente,
// para o rich snippet nunca desencontrar do texto visível na página.
const SITE = 'https://distririo.com.br';

const texto = h => h
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/\s+/g, ' ').trim();

const ORG_ID = SITE + '/#organizacao';

// Ficha da empresa. Estava escrita à mão dentro do index.html, que é como
// "fundada em 1960" sobreviveu tanto tempo. Agora sai daqui.
function blocoOrganizacao() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Wholesaler',
        '@id': ORG_ID,
        name: 'Distri Rio Comercial Ltda.',
        alternateName: 'Distri Rio',
        url: SITE + '/',
        logo: SITE + '/assets/logo.png',
        image: SITE + '/assets/logo.png',
        description: 'Distribuidora de doces, bebidas, energéticos, suplementos e produtos de ' +
            'cuidados pessoais para comércios do Rio de Janeiro. Vendas exclusivamente para ' +
            'pessoa jurídica (CNPJ).',
        telephone: '+55-21-99211-1843',
        email: 'recrutamento@distririo.com.br',
        foundingDate: '2017',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Rod. Washington Luiz, 2070 - Parque Boa Vista II',
            addressLocality: 'Duque de Caxias',
            addressRegion: 'RJ',
            postalCode: '25055-009',
            addressCountry: 'BR',
        },
        areaServed: { '@type': 'State', name: 'Rio de Janeiro' },
        sameAs: [
            'https://www.instagram.com/distririo01/',
            'https://www.linkedin.com/company/distri-rio-comercial-ltda/',
        ],
    };
}

// A busca do site aceita loja.html?q=<termo> de verdade (o app.js lê o
// parâmetro), então o SearchAction não está prometendo o que não existe.
function blocoSite() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': SITE + '/#site',
        url: SITE + '/',
        name: 'Distri Rio',
        inLanguage: 'pt-BR',
        publisher: { '@id': ORG_ID },
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: SITE + '/loja.html?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

function extrairFaq(html) {
    const perguntas = [];
    const re = /<div class="faq-item">[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="faq-answer">([\s\S]*?)<\/div>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const p = texto(m[1]);
        const r = texto(m[2]);
        if (p && r) perguntas.push({ p, r });
    }
    return perguntas;
}

// Pergunta cuja resposta ainda depende de dado do dono não entra no schema.
// O rich snippet do Google mostraria "[FALTA: prazo em dias úteis...]" para
// quem buscasse — pior do que não ter snippet nenhum.
const respostaPendente = r => /\[FALTA:/i.test(r);

function blocoFaq(perguntas) {
    const prontas = perguntas.filter(q => !respostaPendente(q.r));
    if (!prontas.length) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: prontas.map(q => ({
            '@type': 'Question',
            name: q.p,
            acceptedAnswer: { '@type': 'Answer', text: q.r },
        })),
    };
}

function blocoServico(categorias) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        serviceType: 'Distribuição atacadista de doces, bebidas, energéticos e suplementos',
        provider: { '@id': ORG_ID },
        areaServed: { '@type': 'State', name: 'Rio de Janeiro' },
        audience: { '@type': 'BusinessAudience', name: 'Comércios com CNPJ ativo' },
        availableChannel: {
            '@type': 'ServiceChannel',
            serviceUrl: SITE + '/quero-ser-cliente.html',
            servicePhone: '+55-21-99211-1843',
        },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Catálogo Distri Rio',
            url: SITE + '/loja.html',
            itemListElement: categorias.slice(0, 20).map((c, i) => ({
                '@type': 'OfferCatalog',
                position: i + 1,
                name: c.titulo,
                url: SITE + '/loja.html#' + c.id,
            })),
        },
    };
}

function blocoMigalhas(nome, arquivo) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
            { '@type': 'ListItem', position: 2, name: nome, item: SITE + '/' + arquivo },
        ],
    };
}

module.exports = { ORG_ID, blocoOrganizacao, blocoSite, extrairFaq, blocoFaq, blocoServico, blocoMigalhas };
