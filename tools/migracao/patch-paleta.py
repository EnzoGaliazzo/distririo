# -*- coding: utf-8 -*-
"""Troca a base bege por um neutro limpo, mantendo o vermelho da marca.

O site nasceu com fundo creme (#f2e8d5), bordas amareladas e texto marrom.
Somado ao vermelho forte, o conjunto puxava para um bege datado. Aqui os
neutros passam a ser cinzas frios de verdade e o vermelho fica reservado para
marca, botões e destaques — que é onde ele trabalha a favor.
"""
import io
import sys

TROCAS = [
    # ---------- neutros ----------
    ('    --gray-100: #f2e8d5;', '    --gray-100: #f3f4f6;'),   # fundo da página
    ('    --gray-300: #e4d7bc;', '    --gray-300: #e3e6ea;'),   # bordas e divisórias
    ('    --white: #fffdf8;', '    --white: #ffffff;'),          # cartões
    ('    --dark: #1c140d;', '    --dark: #16181d;'),            # títulos
    ('    --gray-800: #2a2a2a;', '    --gray-800: #23262b;'),

    # ---------- texto ----------
    ('    --texto-suave: #55483a;', '    --texto-suave: #4a5059;'),
    ('    --texto-fraco: #6b6257;', '    --texto-fraco: #656d78;'),

    # ---------- sombras sem o marrom ----------
    ('    --shadow: 0 4px 16px rgba(28, 20, 13, 0.1);',
     '    --shadow: 0 1px 2px rgba(16, 19, 24, 0.06), 0 4px 16px rgba(16, 19, 24, 0.07);'),
    ('    --shadow-lg: 0 14px 32px rgba(28, 20, 13, 0.16);',
     '    --shadow-lg: 0 2px 4px rgba(16, 19, 24, 0.06), 0 14px 32px rgba(16, 19, 24, 0.13);'),

    # ---------- hachura dos placeholders ----------
    ('rgba(28, 20, 13, 0.035) 14px, rgba(28, 20, 13, 0.035) 28px',
     'rgba(22, 24, 29, 0.04) 14px, rgba(22, 24, 29, 0.04) 28px'),
    ('rgba(28, 20, 13, 0.035) 16px, rgba(28, 20, 13, 0.035) 32px',
     'rgba(22, 24, 29, 0.04) 16px, rgba(22, 24, 29, 0.04) 32px'),

    # ---------- branco quente solto na faixa do armazém ----------
    ('    color: #fffdf8;', '    color: #ffffff;'),
    ('    border-color: #fffdf8;', '    border-color: #ffffff;'),
    ('    background: #fffdf8;', '    background: #ffffff;'),
    ('rgba(255, 253, 248, 0.86)', 'rgba(255, 255, 255, 0.88)'),

    # ---------- comentário do token ----------
    ('/* --red-text: vermelho aprovado em AA para texto pequeno sobre creme e branco. */',
     '/* --red-text: vermelho aprovado em AA para texto pequeno sobre os neutros claros. */'),

    # ---------- modo escuro: os mesmos neutros, sem o marrom ----------
    ('        --gray-100: #1a1713;', '        --gray-100: #191b1f;'),
    ('        --gray-300: #322c25;', '        --gray-300: #2e323a;'),
    ('        --white: #201c18;', '        --white: #1e2126;'),
    ('        --dark: #f0e9df;', '        --dark: #eef0f3;'),
    ('        --gray-800: #d8d0c4;', '        --gray-800: #cfd4db;'),
    ('        --texto-suave: #c9bfb3;', '        --texto-suave: #c2c8d0;'),
    ('        --texto-fraco: #a2988c;', '        --texto-fraco: #99a1ac;'),
    ('        background: #14110e;', '        background: #131519;'),
    ('        color: #e8e0d5;', '        color: #e6e9ed;'),
]


def main():
    p = 'style.css'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()

    faltando = []
    aplicadas = 0
    for antes, depois in TROCAS:
        alvo = antes.replace('\n', '\r\n')
        if alvo not in s:
            faltando.append(antes.strip()[:60])
            continue
        n = s.count(alvo)
        s = s.replace(alvo, depois.replace('\n', '\r\n'))
        aplicadas += n

    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    print('paleta: %d substituicoes' % aplicadas)
    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)


if __name__ == '__main__':
    main()
