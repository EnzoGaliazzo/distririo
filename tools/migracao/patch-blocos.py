# -*- coding: utf-8 -*-
"""Ajustes de bloco pedidos página a página: tira o que estava repetido,
completa o que estava pela metade e dá função ao mapa."""
import io
import sys

crlf = lambda t: t.replace('\n', '\r\n')

# ---------------------------------------------------------------- imagem 6
# "Nossa estrutura" tinha dois cards; o terceiro fecha a cadeia: armazém,
# entrega e o atendimento que fecha o pedido.
ESTRUTURA_ANTIGA = crlf("""                <div class="structure-card">
                    <img src="assets/sobre/frota.jpg" alt="Frota de entrega">
                    <div class="structure-card-body">
                        <h3>Entrega</h3>
                        <p>Atendimento segmentado no formato pré e pronta entrega, levando o pedido até o seu comércio.</p>
                    </div>
                </div>
            </div>""")

ESTRUTURA_NOVA = crlf("""                <div class="structure-card">
                    <img src="assets/sobre/frota.jpg" alt="Frota de entrega" loading="lazy">
                    <div class="structure-card-body">
                        <h3>Entrega</h3>
                        <p>Atendimento segmentado no formato pré e pronta entrega, levando o pedido até o seu comércio.</p>
                    </div>
                </div>
                <div class="structure-card">
                    <picture>
                        <source srcset="assets/hero-slides/baly-lineup.avif" type="image/avif">
                        <source srcset="assets/hero-slides/baly-lineup.webp" type="image/webp">
                        <img src="assets/hero-slides/baly-lineup.jpg" alt="Linha de produtos das marcas distribuídas" loading="lazy">
                    </picture>
                    <div class="structure-card-body">
                        <h3>Mix e reposição</h3>
                        <p>428 produtos de 16 marcas num fornecedor só. Você fecha a lista inteira numa conversa, em vez de correr atrás de cinco representantes.</p>
                    </div>
                </div>
            </div>""")

# ---------------------------------------------------------------- imagem 11
# O mapa era um iframe solto numa moldura. Agora vem com o endereço ao lado,
# o que a pessoa precisa saber para chegar e um botão que traça a rota.
MAPA_ANTIGO = crlf("""        <section class="section">
            <h2>Como chegar</h2>
            <div class="map-embed">
                <iframe src="https://www.google.com/maps?q=Rod.%20Washington%20Luiz%2C%202070%20-%20Parque%20Boa%20Vista%20II%2C%20Duque%20de%20Caxias%20-%20RJ%2C%2025055-009&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Localização da Distri Rio"></iframe>
            </div>
        </section>""")

MAPA_NOVO = crlf("""        <section class="section">
            <h2>Como chegar</h2>
            <div class="mapa">
                <div class="mapa-info">
                    <h3>Distri Rio Comercial</h3>
                    <address>
                        Rod. Washington Luiz, 2070<br>
                        Parque Boa Vista II<br>
                        Duque de Caxias &mdash; RJ, 25055-009
                    </address>
                    <dl class="mapa-dados">
                        <div><dt>Referência</dt><dd>Sentido Rio&ndash;Petrópolis, perto do trevo de Campos Elísios</dd></div>
                        <div><dt>Para quem vem de carro</dt><dd>Acesso pela marginal da Washington Luiz, com pátio para carga</dd></div>
                        <div><dt>Retirada no local</dt><dd>Combine antes pelo WhatsApp para o pedido já sair separado</dd></div>
                    </dl>
                    <div class="mapa-acoes">
                        <a class="btn" target="_blank" rel="noopener"
                           href="https://www.google.com/maps/dir/?api=1&amp;destination=Rod.+Washington+Luiz%2C+2070+-+Parque+Boa+Vista+II%2C+Duque+de+Caxias+-+RJ%2C+25055-009">Traçar rota</a>
                        <a class="btn btn-ghost" target="_blank" rel="noopener"
                           href="https://wa.me/5521992111843?text=Ol%C3%A1!%20Queria%20combinar%20uma%20retirada%20no%20local.">Combinar retirada</a>
                    </div>
                </div>
                <div class="mapa-quadro">
                    <iframe src="https://www.google.com/maps?q=Rod.%20Washington%20Luiz%2C%202070%20-%20Parque%20Boa%20Vista%20II%2C%20Duque%20de%20Caxias%20-%20RJ%2C%2025055-009&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa com a localização da Distri Rio"></iframe>
                </div>
            </div>
        </section>""")


def bloco_secao(s, marcador):
    """Delimita a <section> que contém o marcador."""
    i = s.index(marcador)
    ini = s.rindex('<section', 0, i)
    ini = s.rindex('\r\n', 0, ini) + 2
    fim = s.index('</section>', i) + len('</section>') + 2
    return ini, fim


def main():
    faltando = []

    # ---- sobre.html: terceiro card e hero enxuto (imagens 6 e 7) ----
    with io.open('sobre.html', encoding='utf-8', newline='') as f:
        s = f.read()
    if ESTRUTURA_ANTIGA in s:
        s = s.replace(ESTRUTURA_ANTIGA, ESTRUTURA_NOVA, 1)
    else:
        faltando.append('sobre :: card de entrega')
    with io.open('sobre.html', 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    # ---- servicos.html: "O que oferecemos" e "Marcas" saem (imagens 8 e 9) ----
    with io.open('servicos.html', encoding='utf-8', newline='') as f:
        s = f.read()
    for marcador in ('<h2>O que oferecemos</h2>', '<h2>Marcas que trabalhamos</h2>'):
        if marcador in s:
            ini, fim = bloco_secao(s, marcador)
            s = s[:ini] + s[fim:]
        else:
            faltando.append('servicos :: ' + marcador)
    with io.open('servicos.html', 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    # ---- contato.html: mapa com conteúdo (imagem 11) ----
    with io.open('contato.html', encoding='utf-8', newline='') as f:
        s = f.read()
    if MAPA_ANTIGO in s:
        s = s.replace(MAPA_ANTIGO, MAPA_NOVO, 1)
    else:
        faltando.append('contato :: mapa')
    with io.open('contato.html', 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)
    print('blocos ajustados: estrutura +1 card, servicos -2 secoes, mapa com conteudo')


if __name__ == '__main__':
    main()
