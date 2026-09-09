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
        provider: {
            '@type': 'Organization',
            name: 'Distri Rio Comercial Ltda',
            url: SITE + '/',
            telephone: '+55-21-99211-1843',
        },
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

module.exports = { extrairFaq, blocoFaq, blocoServico, blocoMigalhas };
