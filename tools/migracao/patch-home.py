# -*- coding: utf-8 -*-
"""Home: completa o seletor de marcas (mostrava 12 de 16) e usa a foto real do
armazém como faixa de credibilidade, em vez de deixá-la escondida no fim da
página Sobre."""
import io
import sys

NOVOS_BOTOES = '''                    <button type="button" class="brand-select-btn" data-brand="gota">Gota</button>
                    <button type="button" class="brand-select-btn" data-brand="lauton">Lauton</button>
                    <button type="button" class="brand-select-btn" data-brand="abelharainha">Abelha Rainha</button>
                    <button type="button" class="brand-select-btn" data-brand="apisvida">Apisvida</button>
'''

NOVAS_IMAGENS = '''                    <img src="assets/produtos/distririo/gota__molho-gota-pimenta.jpg" alt="Molhos Gota" class="brand-preview-img brand-preview-produto" data-brand="gota" loading="lazy" width="800" height="800">
                    <img src="assets/produtos/lauton/performance__creatina.jpg" alt="Suplementos Lauton" class="brand-preview-img brand-preview-produto" data-brand="lauton" loading="lazy" width="800" height="800">
                    <img src="assets/produtos/abelha-rainha/hidratantes__hidratante-corporal-para-pele-extrasseca.jpg" alt="Cuidados pessoais Abelha Rainha" class="brand-preview-img brand-preview-produto" data-brand="abelharainha" loading="lazy" width="800" height="800">
                    <img src="assets/produtos/apisvida/apisvida__mel-apisvida.jpg" alt="Mel e própolis Apisvida" class="brand-preview-img brand-preview-produto" data-brand="apisvida" loading="lazy" width="800" height="800">
'''

FAIXA_ARMAZEM = '''
        <section class="faixa-estrutura">
            <picture>
                <source srcset="assets/sobre/warehouse.avif" type="image/avif">
                <source srcset="assets/sobre/warehouse.webp" type="image/webp">
                <img src="assets/sobre/warehouse.jpg" alt="Armazém da Distri Rio em Duque de Caxias, com o estoque organizado em porta-paletes" width="1400" height="931" loading="lazy" decoding="async">
            </picture>
            <div class="faixa-estrutura-texto">
                <h2>O estoque está aqui, não na promessa</h2>
                <p>Armazém próprio em Duque de Caxias e frota que sai todo dia para o Rio e a Baixada. É o que permite fechar pedido no WhatsApp e entregar sem enrolação.</p>
                <a href="sobre.html" class="btn btn-ghost">Conheça a estrutura</a>
            </div>
        </section>
'''


def main():
    p = 'index.html'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()

    faltando = []

    # 1. quatro marcas que faltavam no seletor
    alvo = '                    <button type="button" class="brand-select-btn" data-brand="espumil">Espumil</button>\r\n'
    if alvo in s:
        s = s.replace(alvo, alvo + NOVOS_BOTOES.replace('\n', '\r\n'), 1)
    else:
        faltando.append('botao Espumil')

    alvo = '                    <img src="assets/produtos/espumil.jpg" alt="Produtos Espumil" class="brand-preview-img" data-brand="espumil">\r\n'
    if alvo in s:
        s = s.replace(alvo, alvo + NOVAS_IMAGENS.replace('\n', '\r\n'), 1)
    else:
        faltando.append('img Espumil')

    # 2. faixa do armazém entre "Como funciona" e a seção seguinte
    alvo = '        <section class="section">\r\n            <h2>Por que os comércios compram da gente</h2>'
    if alvo in s:
        s = s.replace(alvo, FAIXA_ARMAZEM.replace('\n', '\r\n').lstrip('\r\n') + '\r\n' + alvo, 1)
    else:
        faltando.append('secao "Por que os comercios compram"')

    # 3. as fotos de marca ganham dimensão declarada
    s = s.replace('class="brand-preview-img is-active" data-brand="mondelez">',
                  'class="brand-preview-img is-active" data-brand="mondelez" width="785" height="535" fetchpriority="low">')
    s = s.replace('class="brand-preview-img" data-brand=',
                  'class="brand-preview-img" loading="lazy" data-brand=')

    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)
    print('index.html: seletor de marcas completo e faixa do armazém inserida')


if __name__ == '__main__':
    main()
