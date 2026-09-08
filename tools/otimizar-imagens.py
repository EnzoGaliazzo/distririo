# -*- coding: utf-8 -*-
"""Reduz logo, favicon e banners do hero ao tamanho em que são realmente exibidos.
Roda sob demanda; os arquivos gerados ficam versionados no repositório."""
import os
from PIL import Image

def kb(p):
    return os.path.getsize(p) / 1024

def salvar(im, destino, **kw):
    im.save(destino, **kw)
    print(f'  {destino:52} {im.size[0]}x{im.size[1]}  {kb(destino):7.0f} KB')

def redim(origem, largura, destino=None, **kw):
    im = Image.open(origem)
    antes = kb(origem)
    h = round(im.height * largura / im.width)
    im = im.resize((largura, h), Image.LANCZOS)
    destino = destino or origem
    salvar(im, destino, **kw)
    return antes

print('=== logotipos ===')
# Cabeçalho: exibido a 40px de altura -> 2x = 80px de altura.
im = Image.open('assets/logo-mark.png')
a = kb('assets/logo-mark.png')
w = round(im.width * 80 / im.height)
salvar(im.resize((w, 80), Image.LANCZOS), 'assets/logo-mark.png', optimize=True)
print(f'   (antes: {a:.0f} KB)')

# Rodapé: exibido a 42px de altura -> 2x = 84px.
im = Image.open('assets/logo.png')
a = kb('assets/logo.png')
w = round(im.width * 84 / im.height)
salvar(im.convert('RGBA').resize((w, 84), Image.LANCZOS), 'assets/logo.png', optimize=True)
print(f'   (antes: {a:.0f} KB)')

print('=== ícones ===')
# Favicon quadrado: o original é 512x470, então recorta para o quadrado central.
im = Image.open('assets/favicon.png').convert('RGBA')
lado = min(im.size)
esq = (im.width - lado) // 2
topo = (im.height - lado) // 2
quad = im.crop((esq, topo, esq + lado, topo + lado))
a = kb('assets/favicon.png')
salvar(quad.resize((180, 180), Image.LANCZOS), 'assets/apple-touch-icon.png', optimize=True)
salvar(quad.resize((192, 192), Image.LANCZOS), 'assets/icon-192.png', optimize=True)
salvar(quad.resize((512, 512), Image.LANCZOS), 'assets/icon-512.png', optimize=True)
salvar(quad.resize((32, 32), Image.LANCZOS), 'assets/favicon.png', optimize=True)
print(f'   (favicon antes: {a:.0f} KB)')

print('=== banners do hero ===')
LARGURA = 1600
for nome in ('halls', 'trident', 'baly-lineup', 'baly-pro'):
    origem = None
    for ext in ('.png', '.webp', '.jpg'):
        if os.path.exists(f'assets/hero-slides/{nome}{ext}'):
            origem = f'assets/hero-slides/{nome}{ext}'
            break
    if not origem:
        print('  faltando:', nome)
        continue
    im = Image.open(origem)
    antes = kb(origem)
    larg = min(LARGURA, im.width)
    alt = round(im.height * larg / im.width)
    red = im.resize((larg, alt), Image.LANCZOS)
    fundo = Image.new('RGB', red.size, (255, 253, 248))
    if red.mode in ('RGBA', 'LA'):
        fundo.paste(red, mask=red.split()[-1])
    else:
        fundo.paste(red.convert('RGB'))
    print(f'  {nome} (antes {antes:.0f} KB):')
    salvar(fundo, f'assets/hero-slides/{nome}.avif', quality=58)
    salvar(fundo, f'assets/hero-slides/{nome}.webp', quality=76, method=6)
    salvar(fundo, f'assets/hero-slides/{nome}.jpg', quality=82, optimize=True, progressive=True)

print('=== fotos institucionais (Sobre) ===')
for nome in ('frota', 'warehouse'):
    origem = f'assets/sobre/{nome}.jpg'
    im = Image.open(origem).convert('RGB')
    antes = kb(origem)
    red = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
    print(f'  {nome} (antes {antes:.0f} KB):')
    salvar(red, f'assets/sobre/{nome}.avif', quality=58)
    salvar(red, f'assets/sobre/{nome}.webp', quality=76, method=6)
    salvar(red, origem, quality=80, optimize=True, progressive=True)
