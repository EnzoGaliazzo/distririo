# -*- coding: utf-8 -*-
"""Corrige a idade da empresa no site inteiro.

O site dizia que a Distri Rio foi fundada em 1960 e tinha 66 anos de mercado,
com 50 anos de exclusividade Mondelez. Está errado: a fundação é de 2017,
são 9 anos de casa e a parceria exclusiva vem desde a fundação. O dado veio
do próprio dono, que já havia corrigido a página Sobre à mão.

Isso não é ajuste de texto: número de anos em material de venda é afirmação
sobre a empresa, e estava sendo publicada uma que não se sustenta.
"""
import io
import sys

# (arquivo, antes, depois)
TROCAS = [
    # ---------- home: JSON-LD, hero e prova social ----------
    ('index.html', '"foundingDate": "1960",', '"foundingDate": "2017",'),
    ('index.html',
     '<p class="hero-kicker">Distribuidora no Rio de Janeiro desde 1960</p>',
     '<p class="hero-kicker">Distribuidora no Rio de Janeiro desde 2017</p>'),
    ('index.html', '<span class="proof-fact">Desde 1960</span>', '<span class="proof-fact">Desde 2017</span>'),
    ('index.html', '<h3>66 anos abastecendo o Rio</h3>', '<h3>9 anos abastecendo o Rio</h3>'),
    ('index.html',
     '<p>Distribuidora de bairro que virou uma das maiores do estado sem mudar de dono nem de endereço. Quem vende no Rio há tempo já comprou da gente.</p>',
     '<p>Nascemos em 2017 e em menos de dez anos viramos uma das distribuidoras de referência da Baixada. Mesmo dono, mesmo endereço, mesmo telefone desde o primeiro dia.</p>'),
    ('index.html', '<span class="proof-fact">50 anos de exclusividade</span>',
     '<span class="proof-fact">Exclusividade desde 2017</span>'),
    ('index.html',
     '<p>Trident, Halls, Oreo, Lacta, Bis e Club Social chegam sem atravessador no meio. É o que segura o preço e o abastecimento nas datas de pico.</p>',
     '<p>Trident, Halls, Oreo, Lacta, Bis e Club Social chegam sem atravessador no meio, em regime de exclusividade desde a fundação. É o que segura o preço e o abastecimento nas datas de pico.</p>'),
    ('index.html', '🤝 66 anos de casa', '🤝 9 anos de casa'),

    # ---------- serviços ----------
    ('servicos.html', '<div class="stat-number" data-count-to="66">0</div>',
     '<div class="stat-number" data-count-to="9">0</div>'),
    ('servicos.html', '<p>66 anos de mercado atendendo comércios em todo o Rio de Janeiro.</p>',
     '<p>9 anos de mercado atendendo comércios em todo o Rio de Janeiro.</p>'),

    # ---------- rodapé (fonte única) ----------
    ('tools/partials/rodape.html',
     'Atendemos comércios do Rio de Janeiro há mais de 60 anos.',
     'Atendemos comércios do Rio de Janeiro desde 2017.'),
]


def main():
    por_arquivo = {}
    for arquivo, antes, depois in TROCAS:
        por_arquivo.setdefault(arquivo, []).append((antes, depois))

    faltando = []
    total = 0
    for arquivo, pares in por_arquivo.items():
        with io.open(arquivo, encoding='utf-8', newline='') as f:
            s = f.read()
        for antes, depois in pares:
            if antes not in s:
                faltando.append('%s :: %s' % (arquivo, antes[:60]))
                continue
            total += s.count(antes)
            s = s.replace(antes, depois)
        with io.open(arquivo, 'w', encoding='utf-8', newline='') as f:
            f.write(s)

    print('historia: %d substituicoes' % total)
    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)


if __name__ == '__main__':
    main()
