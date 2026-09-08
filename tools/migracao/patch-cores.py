# -*- coding: utf-8 -*-
"""Troca os cinzas escritos à mão por dois tokens de texto.
Sem isso o modo escuro fica com parágrafos marrons sobre fundo preto."""
import io
import re
import sys

# Cinzas de texto corrido -> --texto-suave; cinzas de legenda -> --texto-fraco.
SUAVE = ['#55483a', '#555', '#5b5347', '#444']
FRACO = ['#6b6257', '#7a6f62', '#777', '#888', '#999', '#8a7a63', '#8a8076', '#666']

TOKENS_CLARO = """    --texto-suave: #55483a;
    --texto-fraco: #6b6257;
"""

# O bloco de cores do modo escuro fica menor: os tokens já resolvem o texto.
BLOCO_ESCURO_ANTIGO = """    .product-desc,
    .produto-nota,
    .category-count,
    .search-status,
    .migalhas,
    .cookie-banner p,
    .form-consent {
        color: #a79d92;
    }

    .product-marca-vazia {
        color: #8a8076;
    }

"""


def main():
    p = 'style.css'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()

    # 1. declara os tokens no :root claro
    alvo = '    --red-text: #b3151a;\r\n'
    if alvo not in s:
        print('NAO ENCONTRADO: --red-text no :root')
        sys.exit(1)
    s = s.replace(alvo, alvo + TOKENS_CLARO.replace('\n', '\r\n'), 1)

    # 2. troca os cinzas por tokens (só em "color:", nunca em background)
    trocas = 0
    for cor in SUAVE:
        alvo = 'color: %s;' % cor
        trocas += s.count(alvo)
        s = s.replace(alvo, 'color: var(--texto-suave);')
    for cor in FRACO:
        alvo = 'color: %s;' % cor
        trocas += s.count(alvo)
        s = s.replace(alvo, 'color: var(--texto-fraco);')

    # 3. redefine os tokens no escuro e enxuga o bloco
    s = s.replace(BLOCO_ESCURO_ANTIGO.replace('\n', '\r\n'), '', 1)
    alvo_escuro = '        --red-text: #ff9a9e;\r\n'
    if alvo_escuro not in s:
        print('NAO ENCONTRADO: --red-text no modo escuro')
        sys.exit(1)
    s = s.replace(alvo_escuro,
                  alvo_escuro + '        --texto-suave: #c9bfb3;\r\n        --texto-fraco: #a2988c;\r\n', 1)

    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)
    print('style.css: %d cores trocadas por token' % trocas)

    restantes = re.findall(r'color: #(?!fff\b|c7c7cf\b|e8e0d5\b)[0-9a-fA-F]{3,6};', s)
    if restantes:
        print('ainda em hexadecimal:', sorted(set(restantes)))


if __name__ == '__main__':
    main()
