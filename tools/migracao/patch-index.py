# -*- coding: utf-8 -*-
"""Reordena a home: a proposta de valor e o CTA sobem para o topo, o carrossel
de campanha do fornecedor desce e vira faixa de marcas."""
import io
import sys

HERO_ANTIGO = '''        <section class="hero-carousel" id="heroCarousel">
            <img src="assets/hero-slides/trident.png" alt="Trident X Gamers" class="is-active">
            <img src="assets/hero-slides/baly-pro.webp" alt="Baly Pro">
            <img src="assets/hero-slides/halls.png" alt="Halls Blueberry">
            <img src="assets/hero-slides/baly-lineup.png" alt="Baly Energy Drink">
            <button type="button" class="hero-carousel-prev" aria-label="Banner anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button type="button" class="hero-carousel-next" aria-label="Próximo banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        </section>
'''


def slide(nome, alt, ativo=False):
    return '''            <picture>
                <source srcset="assets/hero-slides/%(n)s.avif" type="image/avif">
                <source srcset="assets/hero-slides/%(n)s.webp" type="image/webp">
                <img src="assets/hero-slides/%(n)s.jpg" alt="%(a)s" width="1600" height="467"%(c)s%(l)s decoding="async">
            </picture>
''' % {
        'n': nome,
        'a': alt,
        'c': ' class="is-active"' if ativo else '',
        'l': ' fetchpriority="high"' if ativo else ' loading="lazy"',
    }


HERO_NOVO = '''        <section class="hero-principal">
            <p class="hero-kicker">Distribuidora no Rio de Janeiro desde 1960</p>
            <h1>O estoque do seu comércio, <span class="sem-quebra">resolvido no WhatsApp.</span></h1>
            <p class="hero-sub">Doces, bebidas, energéticos e suplementos das marcas que mais giram, entregues no seu comércio. Sem portal, sem cadastro longo: você manda a lista e a gente confirma na conversa.</p>
            <div class="hero-acoes">
                <a href="quero-ser-cliente.html" class="btn">Quero ser cliente</a>
                <a href="loja.html" class="btn btn-ghost">Ver o catálogo</a>
            </div>
            <p class="hero-nota">Vendas exclusivamente para pessoa jurídica com CNPJ ativo.</p>
        </section>

        <section class="hero-carousel" id="heroCarousel" aria-label="Campanhas das marcas parceiras" aria-roledescription="carrossel">
''' + slide('trident', 'Campanha Trident X Gamers', True) \
    + slide('baly-pro', 'Campanha Baly Pro') \
    + slide('halls', 'Campanha Halls Blueberry') \
    + slide('baly-lineup', 'Linha de energéticos Baly') + '''            <button type="button" class="hero-carousel-prev" aria-label="Banner anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button type="button" class="hero-carousel-next" aria-label="Próximo banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        </section>
'''

DECLARACAO_ANTIGA = '''        <section class="hero-statement">
            <h1>O estoque do seu comércio,<br>resolvido no WhatsApp.</h1>
            <p>Doces, bebidas e produtos de nutrição das marcas que mais vendem, entregues em todo o Rio de Janeiro.</p>
        </section>

'''

MARQUEE_ANTIGO = '''        <div class="marquee" aria-hidden="true">
            <div class="marquee-track">
                <span class="marquee-item">📍 Atendemos todo o Rio de Janeiro</span>
                <span class="marquee-item">💬 Pedido fechado direto no WhatsApp</span>
                <span class="marquee-item">🍫 528 produtos no catálogo</span>
                <span class="marquee-item">🚚 Consulte prazo de entrega</span>
                <span class="marquee-item">📦 Consulte pedido mínimo</span>
                <span class="marquee-item">📍 Atendemos todo o Rio de Janeiro</span>
                <span class="marquee-item">💬 Pedido fechado direto no WhatsApp</span>
                <span class="marquee-item">🍫 528 produtos no catálogo</span>
                <span class="marquee-item">🚚 Consulte prazo de entrega</span>
                <span class="marquee-item">📦 Consulte pedido mínimo</span>
            </div>
        </div>
'''

MARQUEE_NOVO = '''        <div class="marquee" aria-hidden="true">
            <div class="marquee-track">
                <span class="marquee-item">📍 Atendemos todo o Rio de Janeiro</span>
                <span class="marquee-item">💬 Pedido fechado direto no WhatsApp</span>
                <span class="marquee-item">🍫 428 produtos no catálogo</span>
                <span class="marquee-item">🤝 66 anos de casa</span>
                <span class="marquee-item">🚚 Pré e pronta entrega</span>
                <span class="marquee-item marquee-copia">📍 Atendemos todo o Rio de Janeiro</span>
                <span class="marquee-item marquee-copia">💬 Pedido fechado direto no WhatsApp</span>
                <span class="marquee-item marquee-copia">🍫 428 produtos no catálogo</span>
                <span class="marquee-item marquee-copia">🤝 66 anos de casa</span>
                <span class="marquee-item marquee-copia">🚚 Pré e pronta entrega</span>
            </div>
        </div>
'''

PATCHES = [
    (HERO_ANTIGO, HERO_NOVO),
    (DECLARACAO_ANTIGA, ''),
    (MARQUEE_ANTIGO, MARQUEE_NOVO),
    # D9: o JS já sabia ler data-suffix, mas nenhum elemento usava.
    ('<div class="stat-number" data-count-to="528">0</div>\r\n                    <div class="stat-label">Produtos no catálogo</div>',
     '<div class="stat-number" data-count-to="428" data-suffix="">0</div>\r\n                    <div class="stat-label">Produtos no catálogo</div>'),
    ('<div class="stat-number" data-count-to="30">0</div>\r\n                    <div class="stat-label">Categorias diferentes</div>',
     '<div class="stat-number" data-count-to="33">0</div>\r\n                    <div class="stat-label">Categorias diferentes</div>'),
]


def main():
    p = 'index.html'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()

    faltando = []
    for antes, depois in PATCHES:
        alvo = antes.replace('\r\n', '\n').replace('\n', '\r\n')
        novo = depois.replace('\r\n', '\n').replace('\n', '\r\n')
        if alvo not in s:
            faltando.append(antes.strip().split('\n')[0][:70])
            continue
        s = s.replace(alvo, novo, 1)

    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)
    print('index.html: %d ajustes aplicados' % len(PATCHES))


if __name__ == '__main__':
    main()
