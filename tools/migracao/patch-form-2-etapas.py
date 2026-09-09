# -*- coding: utf-8 -*-
"""Formulário "Quero ser cliente" em duas etapas.

Eram 9 campos obrigatórios para um lead B2B que quase sempre chega do celular,
no balcão da loja, com uma mão. Agora a primeira etapa pede 4 — CNPJ, nome,
WhatsApp e o consentimento LGPD — e a segunda é opcional.

Duas coisas saem de vez:
- a caixa "Tenho CNPJ ativo" virou redundante quando o campo passou a consultar
  a Receita. Pedir que a pessoa confirme o que o site já verificou é atrito sem
  contrapartida;
- a caixa "meu negócio é mercadinho, farmácia..." virou o campo "Ramo de
  atividade" da segunda etapa, que já capturava a mesma informação com mais
  precisão.

O consentimento LGPD continua obrigatório e na primeira etapa: é a base legal
para tratar o dado, não pode ser opcional.
"""
import io
import re
import sys

ETAPA1_ABRE = """                    <div class="form-etapa" data-etapa="1">
                        <p class="form-passo">Etapa 1 de 2 &middot; leva menos de um minuto</p>
"""

ETAPA1_FECHA = """
                        <div class="form-acoes">
                            <button type="button" class="btn job-submit" id="clientProximo">Continuar</button>
                        </div>
                    </div>
"""

ETAPA2_ABRE = """                    <div class="form-etapa" data-etapa="2" hidden>
                        <p class="form-passo">Etapa 2 de 2 &middot; opcional, ajuda a gente a chegar preparado</p>
"""

ETAPA2_FECHA = """
                        <div class="form-acoes">
                            <button type="submit" class="btn job-submit">Enviar pelo WhatsApp</button>
                            <button type="button" class="link-botao" id="clientVoltar">&lsaquo; Voltar</button>
                        </div>
                    </div>
"""


def main():
    p = 'quero-ser-cliente.html'
    with io.open(p, encoding='utf-8', newline='') as f:
        s = f.read()

    ini = s.index('<form id="clientForm" class="job-form">')
    fim = s.index('</form>', ini)
    cabeca, corpo, cauda = s[:ini], s[ini:fim], s[fim:]

    def bloco(marcador, ate):
        """Recorta um trecho do corpo original pelo marcador."""
        i = corpo.index(marcador)
        j = corpo.index(ate, i)
        return corpo[i:j]

    # peças recortadas do formulário atual
    cnpj = bloco('<div class="form-field">\r\n                            <label for="clientCnpj">',
                 '                        </div>\r\n                        <div class="form-field">\r\n                            <label for="clientSegment">')
    nome = bloco('<div class="form-field">\r\n                        <label for="clientName">', '\r\n\r\n                    <div class="form-row">')
    telefone = bloco('<div class="form-field">\r\n                            <label for="clientPhone">',
                     '                        </div>\r\n                        <div class="form-field">\r\n                            <label for="clientBairro">')
    segmento = bloco('<div class="form-field">\r\n                            <label for="clientSegment">',
                     '                        </div>\r\n                    </div>')
    bairro = bloco('<div class="form-field">\r\n                            <label for="clientBairro">',
                   '                        </div>\r\n                    </div>')
    empresa = bloco('<div class="form-field">\r\n                        <label for="clientCompany">', '\r\n\r\n                    <div class="form-row">')
    mensagem = bloco('<div class="form-field">\r\n                        <label for="clientMessage">', '\r\n\r\n                    <fieldset')
    consent = bloco('<label class="form-consent">\r\n                        <input type="checkbox" name="consent"', '</label>') + '</label>'

    def reindent(t, de, para):
        return re.sub(r'^' + ' ' * de, ' ' * para, t, flags=re.M)

    # a razão social vem preenchida pela consulta de CNPJ; deixa de ser obrigatória
    empresa = empresa.replace(' required>', '>')
    empresa = empresa.replace('>Razão social / Nome da empresa<', '>Razão social <span class="form-opcional">(preenchida pelo CNPJ)</span><')

    novo = (
        '<form id="clientForm" class="job-form">\r\n'
        + ETAPA1_ABRE.replace('\n', '\r\n')
        + '                        ' + cnpj.strip() + '\r\n\r\n'
        + '                        ' + nome.strip() + '\r\n\r\n'
        + '                        ' + telefone.strip() + '\r\n\r\n'
        + '                        ' + consent.strip() + '\r\n'
        + ETAPA1_FECHA.replace('\n', '\r\n')
        + '\r\n'
        + ETAPA2_ABRE.replace('\n', '\r\n')
        + '                        ' + empresa.strip() + '\r\n\r\n'
        + '                        ' + segmento.strip() + '\r\n\r\n'
        + '                        ' + bairro.strip() + '\r\n\r\n'
        + '                        ' + mensagem.strip() + '\r\n'
        + ETAPA2_FECHA.replace('\n', '\r\n')
    )

    # o ramo deixa de ser obrigatório: quem parar na etapa 1 não passa por ele
    novo = novo.replace('<select id="clientSegment" name="segmento" required>', '<select id="clientSegment" name="segmento">')
    novo = novo.replace('<select id="clientBairro" name="bairro" required>', '<select id="clientBairro" name="bairro">')

    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(cabeca + novo + cauda)

    obrigatorios = novo.count('required')
    print('formulario em 2 etapas; campos obrigatorios agora: %d' % obrigatorios)
    if obrigatorios > 5:
        print('AVISO: mais obrigatorios do que o esperado')
        sys.exit(1)


if __name__ == '__main__':
    main()
