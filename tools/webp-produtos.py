# -*- coding: utf-8 -*-
"""Gera um WebP de 500x500 ao lado de cada foto de produto.
O JPEG de 800px continua no repositório como fonte e como fallback do <picture>."""
import glob, os
from PIL import Image

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
    lado = 500
    if im.width != im.height:
        lado_menor = min(im.size)
        e = (im.width - lado_menor) // 2
        t = (im.height - lado_menor) // 2
        im = im.crop((e, t, e + lado_menor, t + lado_menor))
    im = im.resize((lado, lado), Image.LANCZOS)
    im.save(destino, quality=78, method=6)
    depois += os.path.getsize(destino)
    feitos += 1

print(f'{feitos} WebP gerados de {len(fontes)} fotos')
print(f'JPEG 800px: {antes/1024/1024:.1f} MB  ->  WebP 500px: {depois/1024/1024:.1f} MB')
