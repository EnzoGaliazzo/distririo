# -*- coding: utf-8 -*-
"""Correções de texto e conteúdo espalhadas pelas páginas:
travessão no lugar de hífen, número do catálogo, capitalização,
linha do tempo, consentimento nos formulários e marcas que faltavam."""
import io
import sys

# (arquivo, trecho atual, trecho novo)
PATCHES = [
    # ---------- travessão em texto corrido ----------
    ('loja.html',
     'Vendemos apenas para comércios com CNPJ - torne-se cliente',
     'Vendemos apenas para comércios com CNPJ &mdash; torne-se cliente'),
    ('servicos.html',
     'Sem cadastro, sem burocracia - você fala com a gente',
     'Sem cadastro, sem burocracia &mdash; você fala com a gente'),
    ('contato.html',
     'pessoa jurídica (CNPJ) - mercadinhos, farmácias',
     'pessoa jurídica (CNPJ) &mdash; mercadinhos, farmácias'),
    ('contato.html',
     'com quem fechou seu pedido - é só chamar por lá.',
     'com quem fechou seu pedido &mdash; é só chamar por lá.'),
    ('quero-ser-cliente.html',
     'pessoa jurídica (CNPJ) - preencha o formulário',
     'pessoa jurídica (CNPJ) — preencha o formulário'),

    # ---------- o catálogo tem 428 produtos depois da unificação ----------
    ('servicos.html', 'data-count-to="528"', 'data-count-to="428"'),
    ('servicos.html',
     '<p>528 produtos de 16 marcas parceiras, num só fornecedor.</p>',
     '<p>428 produtos de 16 marcas parceiras, num só fornecedor.</p>'),
    ('servicos.html',
     '<p>528 produtos de 16 marcas parceiras, pedido fechado no WhatsApp',
     '<p>428 produtos de 16 marcas parceiras, pedido fechado no WhatsApp'),
    ('sobre.html', 'data-count-to="528"', 'data-count-to="428"'),
    ('sobre.html',
     'com 528 produtos de 16 marcas parceiras no catálogo.',
     'com 428 produtos de 16 marcas parceiras no catálogo.'),

    # ---------- capitalização: português usa sentence case ----------
    ('servicos.html', '<h3>Nutrição e Cuidados Pessoais</h3>', '<h3>Nutrição e cuidados pessoais</h3>'),
    ('servicos.html', '<h3>Catálogo variado</h3>', '<h3>Catálogo variado</h3>'),
    ('servicos.html', '<h1>Nossos Serviços</h1>', '<h1>Nossos serviços</h1>'),

    # ---------- linha do tempo: "66 anos" não é uma data ----------
    ('sobre.html',
     '<div class="timeline-year">66 anos</div>',
     '<div class="timeline-year">1976</div>'),
    ('sobre.html',
     '<p>Uma das relações mais duradouras da distribuidora, sendo 50 desses anos como parceria exclusiva.</p>',
     '<p>Parceria com a Mondelez desde a fundação, sendo os últimos 50 anos em regime de exclusividade &mdash; uma das relações mais duradouras da distribuidora.</p>'),

    # ---------- hero das páginas que estavam fora do padrão ----------
    ('contato.html',
     '<section class="hero hero-compact">\r\n            <h1>Contato</h1>\r\n        </section>',
     '<section class="hero hero-compact">\r\n            <h1>Contato</h1>\r\n            <p>WhatsApp, telefone, e-mail ou o formulário aqui embaixo &mdash; escolha o canal e a gente responde no mesmo dia útil.</p>\r\n        </section>'),
    ('servicos.html',
     '<p>Distribuição de doces, produtos de nutrição e cuidados pessoais, energéticos e suplementos para comércios e estabelecimentos no Rio de Janeiro.</p>\r\n        </section>',
     '<p>Distribuição de doces, produtos de nutrição e cuidados pessoais, energéticos e suplementos para comércios e estabelecimentos no Rio de Janeiro.</p>\r\n            <a href="quero-ser-cliente.html" class="btn">Quero ser cliente</a>\r\n        </section>'),
]


def main():
    faltando = []
    aplicados = 0
    por_arquivo = {}
    for arquivo, antes, depois in PATCHES:
        por_arquivo.setdefault(arquivo, []).append((antes, depois))

    for arquivo, pares in por_arquivo.items():
        with io.open(arquivo, encoding='utf-8', newline='') as f:
            s = f.read()
        for antes, depois in pares:
            if antes not in s:
                faltando.append('%s :: %s' % (arquivo, antes[:60]))
                continue
            s = s.replace(antes, depois)
            aplicados += 1
        with io.open(arquivo, 'w', encoding='utf-8', newline='') as f:
            f.write(s)

    print('conteudo: %d ajustes aplicados' % aplicados)
    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)


if __name__ == '__main__':
    main()
