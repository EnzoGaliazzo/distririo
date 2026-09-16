# -*- coding: utf-8 -*-
"""Gera o WebP que o site realmente serve, ao lado de cada foto de produto.

O <picture> do site oferece o WebP primeiro, então é ELE que o visitante vê —
o JPEG só entra como reserva. Por isso o WebP precisa ter a mesma proporção e
a mesma resolução da foto original.

Antes esta ferramenta forçava 500x500 em tudo:

  - as fotos de catálogo (800x800) chegavam com 37% menos pixel do que o
    necessário. Num celular comum (2 pixels por ponto) o cartão do catálogo
    pede 682 px e a foto da página de produto pede 650 px: 500 px é ampliação,
    e ampliação é foto borrada;
  - foto que não fosse quadrada era cortada no centro até virar quadrada.
    Uma imagem de 900x382 perdia mais da metade da largura.

Agora: mantém a proporção, não passa de LADO_MAX e nunca amplia.
"""
import glob
import os
from PIL import Image

LADO_MAX = 800   # o mesmo lado das fotos de catálogo
QUALIDADE = 80

fontes = sorted(glob.glob('assets/produtos/**/*.jpg', recursive=True))
antes = depois = 0
feitos = 0
for f in fontes:
    destino = f[:-4] + '.webp'
    antes += os.path.getsize(f)
    if os.path.exists(destino) and os.path.getmtime(destino) >= os.path.getmtime(f):
        depois += os.path.getsize(destino)
        continue
    im = Image.open(f).convert('RGB')
    # thumbnail respeita a proporção e só reduz: foto menor que o teto passa
    # inteira, em vez de ser ampliada e perder nitidez.
    im.thumbnail((LADO_MAX, LADO_MAX), Image.LANCZOS)
    im.save(destino, quality=QUALIDADE, method=6)
    depois += os.path.getsize(destino)
    feitos += 1

print(f'{feitos} WebP gerados de {len(fontes)} fotos')
print(f'JPEG: {antes/1024/1024:.1f} MB  ->  WebP (ate {LADO_MAX}px, mesma proporcao): {depois/1024/1024:.1f} MB')
