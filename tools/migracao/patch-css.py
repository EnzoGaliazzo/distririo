# -*- coding: utf-8 -*-
"""Ajustes cirúrgicos em regras que já existem no style.css.
Cada par é (trecho atual, trecho novo). Falha alto se algum não bater."""
import io
import sys

PATCHES = [
    # --- A8: vermelho pequeno sobre creme reprovava AA (3,94:1). ---
    ("""    --red: #e01e24;
    --red-dark: #b3151a;""",
     """    --red: #e01e24;
    --red-dark: #b3151a;
    /* --red-text: vermelho aprovado em AA para texto pequeno sobre creme e branco. */
    --red-text: #b3151a;
    --focus: #12131a;
    --focus-claro: #ffd166;"""),

    # --- M3: a altura real do cabeçalho passa a ser medida, não chutada. ---
    ("""    --header-h: 76px;
    --info-h: 40px;""",
     """    --header-h: 76px;
    --info-h: 40px;
    /* --header-total: escrito por app.js a partir da altura real do cabeçalho. */
    --header-total: calc(var(--header-h) + var(--info-h));"""),

    ("""    min-height: 100vh;
    padding-top: calc(var(--header-h) + var(--info-h));
}""",
     """    min-height: 100vh;
    padding-top: var(--header-total);
}"""),

    # --- M8: hover que grudava no toque. ---
    (""".product-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
}

.product-card img {""",
     """@media (hover: hover) and (pointer: fine) {
    .product-card:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow-lg);
    }
}

.product-card img {"""),

    (""".product-card:hover img {
    transform: scale(1.06);
}""",
     """@media (hover: hover) and (pointer: fine) {
    .product-card:hover img {
        transform: scale(1.06);
    }
}"""),

    (""".proof-card {
    background: var(--white);""",
     """.proof-card {
    background: var(--white);"""),

    # --- P7: 30 seções não precisam ser pintadas de uma vez. ---
    (""".category-section {
    padding: 2.5rem 0;
    border-top: 1px solid var(--gray-300);
}""",
     """.category-section {
    padding: 2.5rem 0;
    border-top: 1px solid var(--gray-300);
    /* Só calcula layout da seção quando ela chega perto da tela. */
    content-visibility: auto;
    contain-intrinsic-size: auto 900px;
    scroll-margin-top: calc(var(--header-total) + 64px);
}"""),

    # --- M1: o carrossel deixa de ser tarja de 114px no celular. ---
    (""".hero-carousel {
    position: relative;
    width: 100%;
    aspect-ratio: 1920 / 560;
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--gray-800);
}""",
     """.hero-carousel {
    position: relative;
    width: 100%;
    aspect-ratio: 1920 / 560;
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--gray-800);
}

/* Abaixo de 720px a peça inteira aparece, sem corte e sem virar uma tarja:
   o banner é publicidade do fornecedor, não o argumento de venda do site. */
@media (max-width: 720px) {
    .hero-carousel {
        aspect-ratio: 1400 / 480;
        background: var(--gray-100);
    }

    .hero-carousel img {
        object-fit: contain;
        transform: none;
    }
}"""),

    # --- B10: max-height mágico no menu mobile. ---
    ("""    .header-nav {
        order: 5;
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.25s ease;
    }

    .header-nav.is-open {
        max-height: 20rem;
        margin-top: 0.5rem;
    }

    .header-nav a {
        padding: 0.7rem 0.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }""",
     """    /* grid-template-rows 0fr -> 1fr anima sem depender de uma altura chutada:
       cabe um sétimo link amanhã sem cortar o último item. */
    .header-nav {
        order: 5;
        width: 100%;
        display: grid;
        grid-template-rows: 0fr;
        overflow: hidden;
        transition: grid-template-rows 0.25s var(--ease);
    }

    .header-nav > * {
        min-height: 0;
    }

    .header-nav.is-open {
        grid-template-rows: 1fr;
        margin-top: 0.5rem;
    }

    .header-nav a {
        display: block;
        padding: 0.7rem 0.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }"""),

    # --- M3: números mágicos de padding no mobile. ---
    ("""@media (max-width: 900px) {
    html {
        scroll-padding-top: 285px;
    }

    .page {
        padding-top: 215px;
    }

    .header-bar {""",
     """@media (max-width: 900px) {
    .header-bar {"""),

    # --- M7: a barra de categorias não dizia que rolava. ---
    ("""    .category-bar {
        justify-content: flex-start;
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 0.75rem;
    }""",
     """    .category-bar {
        justify-content: flex-start;
        padding-bottom: 0.75rem;
    }"""),
]


def main():
    p = 'style.css'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()
    faltando = []
    for antes, depois in PATCHES:
        alvo = antes.replace('\n', '\r\n')
        novo = depois.replace('\n', '\r\n')
        if alvo not in s:
            faltando.append(antes.split('\n')[0][:70])
            continue
        s = s.replace(alvo, novo, 1)
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)
    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)
    print('style.css: %d ajustes aplicados' % len(PATCHES))


if __name__ == '__main__':
    main()
