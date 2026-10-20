"""Converte o xlsx que a rotina 1130 do WinThor gera num CSV simples.

    python tools/winthor/xlsx-para-csv.py <arquivo.xlsx> <saida.csv>

O arquivo sai do QuickReport com atributos fora do padrão (por exemplo
`WindowWidth` em BookView), e o openpyxl recusa de cara. Como a planilha é só
texto numa aba, ler o XML direto é mais simples e mais robusto do que tentar
consertar o arquivo.
"""

import csv
import io
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def texto_da_celula(no):
    """Junta todos os <t> de dentro de uma célula (pode vir partido em runs)."""
    return ''.join(t.text or '' for t in no.iter(NS + 't'))


def coluna(ref):
    """'BC12' -> 54. A ordem das células vem certa, mas pode faltar célula
    vazia no meio; sem isso as colunas saem deslocadas."""
    letras = re.match(r'([A-Z]+)', ref or 'A').group(1)
    n = 0
    for c in letras:
        n = n * 26 + (ord(c) - 64)
    return n - 1


def converter(entrada, saida):
    z = zipfile.ZipFile(entrada)

    compartilhadas = []
    if 'xl/sharedStrings.xml' in z.namelist():
        raiz = ET.fromstring(z.read('xl/sharedStrings.xml'))
        compartilhadas = [texto_da_celula(si) for si in raiz.findall(NS + 'si')]

    raiz = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    linhas = []
    for linha in raiz.iter(NS + 'row'):
        celulas = {}
        for c in linha.findall(NS + 'c'):
            tipo = c.get('t')
            if tipo == 's':
                v = c.find(NS + 'v')
                valor = compartilhadas[int(v.text)] if v is not None else ''
            elif tipo == 'inlineStr':
                valor = texto_da_celula(c)
            else:
                v = c.find(NS + 'v')
                valor = v.text if v is not None else ''
            celulas[coluna(c.get('r'))] = (valor or '').strip()
        if not celulas:
            continue
        largura = max(celulas) + 1
        linhas.append([celulas.get(i, '') for i in range(largura)])

    with io.open(saida, 'w', encoding='utf-8-sig', newline='') as f:
        csv.writer(f, delimiter=';').writerows(linhas)
    print('%d linhas -> %s' % (len(linhas), saida))


if __name__ == '__main__':
    converter(sys.argv[1], sys.argv[2])
