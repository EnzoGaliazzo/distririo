# -*- coding: utf-8 -*-
"""A faixa final de CTA passa a ser clara, como o resto do site.

Ela era um bloco escuro com um brilho vermelho pulsando atrás do texto — a
"quebra de contraste" relatada. Agora acompanha a página: fundo claro, um
filete vermelho no topo para separar, e o vermelho concentrado no botão
principal, que é onde ele trabalha a favor.
"""
import io
import sys

crlf = lambda t: t.replace('\n', '\r\n')

TROCAS = [
    # ---------- fundo e brilho ----------
    (crlf("""".cta-band {
    position: relative;
    overflow: hidden;
    padding: 4.5rem 1.5rem;
    background: var(--dark);
    color: var(--white);
    text-align: center;
}

/* brilho vermelho que respira devagar atras do texto */
.cta-band::before {
    content: "";
    position: absolute;
    inset: -40% -10%;
    background: radial-gradient(circle at 50% 45%, rgba(224, 30, 36, 0.85), transparent 58%);
    animation: ctaGlow 9s var(--ease) infinite;
    pointer-events: none;
}

@keyframes ctaGlow {
    0%, 100% { transform: scale(1) translateY(0); opacity: 0.75; }
    50%      { transform: scale(1.18) translateY(-6%); opacity: 1; }
}""".strip('"')),
     crlf(""".cta-band {
    position: relative;
    overflow: hidden;
    padding: 4rem 1.5rem;
    background: var(--gray-100);
    color: var(--dark);
    text-align: center;
    border-top: 3px solid var(--red);
}""")),

    # ---------- kicker ----------
    (crlf("""    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 999px;
    font-size: 0.75rem;"""),
     crlf("""    border: 1px solid var(--red);
    border-radius: 999px;
    color: var(--red-text);
    background: var(--white);
    font-size: 0.75rem;""")),

    # ---------- titulo e texto ----------
    (crlf(""".cta-band h2 {
    color: var(--white);"""),
     crlf(""".cta-band h2 {
    color: var(--dark);""")),

    (crlf(""".cta-band p {
    color: rgba(255, 255, 255, 0.82);"""),
     crlf(""".cta-band p {
    color: var(--texto-suave);""")),

    # ---------- botao principal ----------
    (crlf(""".btn-light {
    background: var(--white);
    color: var(--dark);
}

.btn-light:hover {
    background: var(--gray-100);
    color: var(--dark);
}"""),
     crlf("""/* .btn-light nasceu para o fundo escuro da faixa. Com a faixa clara, o
   botao principal volta a ser o vermelho da marca. */
.btn-light {
    background: var(--red);
    color: #ffffff;
}

.btn-light:hover {
    background: var(--red-dark);
    color: #ffffff;
}""")),

    # ---------- o ghost da faixa volta a ser vermelho ----------
    (crlf(""".cta-band .btn-ghost,
.faixa-estrutura-texto .btn-ghost,
.hero-invertido .btn-ghost {"""),
     crlf(""".faixa-estrutura-texto .btn-ghost,
.hero-invertido .btn-ghost {""")),

    (crlf(""".cta-band .btn-ghost:hover,
.faixa-estrutura-texto .btn-ghost:hover,
.hero-invertido .btn-ghost:hover {"""),
     crlf(""".faixa-estrutura-texto .btn-ghost:hover,
.hero-invertido .btn-ghost:hover {""")),
]

NOTA_RODAPE = crlf("""
/* A nota do fim da faixa acompanha o fundo claro. */
.cta-band-note {
    color: var(--texto-fraco);
}
""")


def main():
    p = 'style.css'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()

    faltando = []
    for antes, depois in TROCAS:
        if antes not in s:
            faltando.append(antes.split('\r\n')[0][:60])
            continue
        s = s.replace(antes, depois, 1)

    s += NOTA_RODAPE

    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    print('faixa de CTA: %d de %d trechos ajustados' % (len(TROCAS) - len(faltando), len(TROCAS)))
    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)


if __name__ == '__main__':
    main()
