# -*- coding: utf-8 -*-
"""Instala foto de produto no padrão do catálogo.

    python tools/fotos/instalar.py <marca> <arquivo> <id-do-produto> [mais pares...]

Exemplo:
    python tools/fotos/instalar.py mondelez ~/baixados/bis-10.png bis-10

O que ele faz com cada arquivo:
  - achata transparência sobre branco (PNG de loja costuma vir sem fundo);
  - recorta a sobra branca em volta (limiar 22, o que ignora sombra suave);
  - encaixa em 800 x 800 com 7% de margem, que é o padrão do catálogo;
  - salva JPEG progressivo com qualidade 88, baixando até caber em 200 KB;
  - aponta o campo "img" do produto em data/produtos.json para o arquivo novo.

Depois: `npm run imagens` gera o WebP de 500 px que o site realmente serve, e
`npm run build` regenera as páginas.

De onde a foto pode vir: site oficial da marca que a Distri Rio distribui
(o Enzo é distribuidor e autorizou em 14/09) e, quando a marca não publica,
o varejo que vende o mesmo SKU — sempre conferindo embalagem e gramatura na
imagem. Foto de banco de imagens ou de site sem relação com o fabricante, não.
"""
import json
import os
import sys

from PIL import Image, ImageChops

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LADO = 800
MARGEM = 0.07
LIMIAR = 22
LIMITE_KB = 200


def abrir(caminho):
    im = Image.open(caminho)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        fundo = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(fundo, im)
    return im.convert("RGB")


def quadrado(im):
    base = Image.new("RGB", im.size, (255, 255, 255))
    caixa = ImageChops.difference(im, base).convert("L").point(lambda v: 255 if v > LIMIAR else 0).getbbox()
    if caixa:
        im = im.crop(caixa)
    largura, altura = im.size
    util = LADO * (1 - 2 * MARGEM)
    escala = min(util / largura, util / altura)
    im = im.resize((max(1, round(largura * escala)), max(1, round(altura * escala))), Image.LANCZOS)
    tela = Image.new("RGB", (LADO, LADO), (255, 255, 255))
    tela.paste(im, ((LADO - im.width) // 2, (LADO - im.height) // 2))
    return tela


def main(argv):
    if len(argv) < 3 or len(argv) % 2 == 0:
        print(__doc__)
        return 1
    marca = argv[0]
    pares = list(zip(argv[1::2], argv[2::2]))

    arquivo_catalogo = os.path.join(RAIZ, "data", "produtos.json")
    with open(arquivo_catalogo, encoding="utf-8") as f:
        dados = json.load(f)
    por_id = {p["id"]: p for p in dados["produtos"]}

    faltando = [pid for _, pid in pares if pid not in por_id]
    if faltando:
        print("id que não existe no catálogo: " + ", ".join(faltando))
        return 1

    for origem, pid in pares:
        if not os.path.exists(origem):
            print("arquivo não encontrado: " + origem)
            return 1
        imagem = quadrado(abrir(origem))
        rel = "assets/produtos/%s/%s.jpg" % (marca, pid)
        destino = os.path.join(RAIZ, rel.replace("/", os.sep))
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        qualidade = 88
        imagem.save(destino, "JPEG", quality=qualidade, optimize=True, progressive=True)
        while os.path.getsize(destino) > LIMITE_KB * 1024 and qualidade > 64:
            qualidade -= 6
            imagem.save(destino, "JPEG", quality=qualidade, optimize=True, progressive=True)
        por_id[pid]["img"] = rel
        print("%-46s %3d KB  q%d" % (rel, os.path.getsize(destino) // 1024, qualidade))

    with open(arquivo_catalogo, "w", encoding="utf-8", newline="\n") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("\ndata/produtos.json atualizado. Agora rode:\n  npm run imagens\n  npm run build\n  npm run checar")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
