# -*- coding: utf-8 -*-
"""Formulário "Quero ser cliente": bairro em lista, confirmação de CNPJ ativo
e o parágrafo gigante virando uma confirmação que a pessoa marca."""
import io
import sys

# Bairros de Duque de Caxias e o entorno atendido. A lista está agrupada para
# a pessoa achar o dela rápido; é para ser podada conforme a área real de
# entrega da Distri Rio.
BAIRROS = [
    ('Duque de Caxias', [
        'Centro', 'Jardim Primavera', 'Campos Elísios', 'Parque Boa Vista',
        'Vila São Luís', 'Jardim Gramacho', 'Gramacho', 'Parque Lafaiete',
        'Saracuruna', 'Imbariê', 'Parada Angélica', 'Parada Morabi',
        'Xerém', 'Santa Cruz da Serra', 'Pilar', 'Taquara',
        'Olavo Bilac', 'Chácaras Rio-Petrópolis', 'Vila Urussaí', 'Sarapuí',
    ]),
    ('Baixada Fluminense', [
        'Belford Roxo', 'Nova Iguaçu', 'São João de Meriti', 'Nilópolis',
        'Mesquita', 'Queimados', 'Japeri', 'Magé', 'Guapimirim',
    ]),
    ('Rio de Janeiro', [
        'Zona Norte', 'Zona Oeste', 'Zona Sul', 'Centro do Rio',
        'Ilha do Governador', 'Barra da Tijuca', 'Jacarepaguá',
    ]),
    ('Outros municípios', [
        'Niterói', 'São Gonçalo', 'Itaboraí', 'Maricá', 'Petrópolis',
        'Outro município',
    ]),
]


def montar_select():
    linhas = [
        '                        <div class="form-field">',
        '                            <label for="clientBairro">Bairro / cidade</label>',
        '                            <select id="clientBairro" name="bairro" required>',
        '                                <option value="" disabled selected>Selecione...</option>',
    ]
    for grupo, itens in BAIRROS:
        linhas.append('                                <optgroup label="%s">' % grupo)
        for b in itens:
            linhas.append('                                    <option>%s</option>' % b)
        linhas.append('                                </optgroup>')
    linhas += [
        '                            </select>',
        '                        </div>',
    ]
    return '\r\n'.join(linhas)


CIDADE_ANTIGA = '\r\n'.join([
    '                        <div class="form-field">',
    '                            <label for="clientCity">Cidade</label>',
    '                            <input type="text" id="clientCity" name="city" placeholder="Sua cidade">',
    '                        </div>',
])

HERO_ANTIGO = '\r\n'.join([
    '            <h1>Quero ser cliente</h1>',
    '            <p>As vendas da Distri Rio são feitas apenas para pessoa jurídica, ou seja, comércios com CNPJ ativo (mercadinhos, farmácias, conveniências, padarias, bares e afins). Preencha os dados abaixo e nossa equipe entra em contato pelo WhatsApp.</p>',
])

HERO_NOVO = '\r\n'.join([
    '            <h1>Quero ser cliente</h1>',
    '            <p>Preencha os dados abaixo e nossa equipe entra em contato pelo WhatsApp.</p>',
])

# O parágrafo gigante vira uma confirmação que a pessoa marca — assim ela lê
# a regra em vez de passar o olho, e fica registrado que concordou com ela.
CONSENT_ANTIGO = '                    <label class="form-consent">'
CONSENT_NOVO = '\r\n'.join([
    '                    <label class="form-consent">',
    '                        <input type="checkbox" name="pj" required>',
    '                        <span>Confirmo que represento uma <strong>pessoa jurídica com CNPJ ativo</strong> &mdash; mercadinho, farmácia, conveniência, padaria, bar ou comércio equivalente. A Distri Rio não vende para pessoa física.</span>',
    '                    </label>',
    '',
    '                    <label class="form-consent">',
])


def main():
    p = 'quero-ser-cliente.html'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()

    faltando = []

    if CIDADE_ANTIGA in s:
        s = s.replace(CIDADE_ANTIGA, montar_select(), 1)
    else:
        faltando.append('campo Cidade')

    if HERO_ANTIGO in s:
        s = s.replace(HERO_ANTIGO, HERO_NOVO, 1)
    else:
        faltando.append('hero')

    if CONSENT_ANTIGO in s:
        s = s.replace(CONSENT_ANTIGO, CONSENT_NOVO, 1)
    else:
        faltando.append('bloco de consentimento')

    # Campos que só aceitam número dizem isso ao teclado do celular.
    s = s.replace(
        '<input type="text" id="clientCnpj" name="cnpj" placeholder="00.000.000/0000-00" required>',
        '<input type="text" id="clientCnpj" name="cnpj" placeholder="00.000.000/0000-00"\r\n'
        '                                   inputmode="numeric" autocomplete="off" maxlength="18"\r\n'
        '                                   aria-describedby="cnpjRetorno" required>\r\n'
        '                            <p class="form-dica" id="cnpjRetorno" role="status" aria-live="polite"></p>')
    s = s.replace(
        '<input type="tel" id="clientPhone" name="phone" placeholder="(21) 99999-9999" required>',
        '<input type="tel" id="clientPhone" name="phone" placeholder="(21) 99999-9999"\r\n'
        '                                   inputmode="numeric" autocomplete="tel" maxlength="15" required>')

    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

    if faltando:
        print('NAO ENCONTRADO:')
        for f_ in faltando:
            print('  -', f_)
        sys.exit(1)
    print('formulario: bairro em lista, confirmacao de CNPJ ativo e campos numericos')


if __name__ == '__main__':
    main()
