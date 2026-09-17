# Sistema visual da Distri Rio

Direção: **bloco de pedido**. O site é o estoque à vista, e a peça que ele
existe para produzir é a lista. Então a interface fala a língua impressa do
balcão — etiqueta de gôndola, código, nota — com a estrutura pesada de um
depósito.

Isso não é enfeite: é o que decide cada valor deste documento. Documento não
flutua, etiqueta tem canto vivo, vermelho é sinal e não texto corrido.

Tudo abaixo está implementado como variável CSS no topo do `style.css`. Nada de
valor solto no meio da folha: se precisar de um número novo, ele entra como
token antes de ser usado.

---

## Cor

Os neutros são de **papel quente**, não cinza de framework. Isso é escolha: o
cinza neutro é o que todo site gerado usa, e um papel levemente quente conversa
com papelão, etiqueta e nota fiscal.

| Token | Claro | O que é |
|---|---|---|
| `--papel` | `#fbfaf7` | fundo da página |
| `--papel-2` | `#f3f0e9` | superfície secundária (faixas, painéis) |
| `--papel-3` | `#e7e2d7` | superfície terciária |
| `--linha` | `#d9d3c6` | fio de separação |
| `--linha-forte` | `#b9b1a0` | fio em estado ativo |
| `--grafite` | `#5d5952` | texto de apoio |
| `--grafite-claro` | `#767166` | texto fraco — **4,70:1 sobre o papel** |
| `--carbono` | `#1b1d21` | tinta |
| `--sinal` | `#d81e24` | a marca. Cor de **sinal**: marca e alerta |
| `--sinal-forte` | `#a91116` | vermelho de texto e hover |
| `--carimbo` | `#1f4fa8` | dado, estado e foco |
| `--faixa` | `#e8a600` | marcador de seção (piso de armazém) |

**Dois pares que não podem ser confundidos** — misturá-los foi o que quebrou o
site quando ele teve modo escuro:

- `--superficie-escura` / `--sobre-escuro` — a barra escura (cabeçalho,
  marquee, rodapé, topo do painel) e o texto que anda nela. Antes, `--ink` era
  ao mesmo tempo tinta e fundo de barra, e qualquer mudança na tinta mexia junto
  no fundo do cabeçalho. Tinta é tinta, fundo de barra é fundo de barra.
- `--sinal` / `--red-text` — preenchimento e texto. Botão usa o vermelho da
  marca; texto vermelho pequeno usa o tom mais escuro, que passa em AA sobre o
  papel.

**O site é sempre claro.** Não existe modo escuro, por decisão do dono: em
08/09 ele pediu para tirar (no escuro, o site não parecia o da marca), e em
16/09, quando um redesign o religou seguindo um prompt genérico, a decisão foi
reconfirmada. O `:root` declara `color-scheme: light`, e o teste de contraste
reprova se o fundo escurecer com o sistema no tema escuro. Não religar sem
falar com o dono.

---

## Tipografia

Duas famílias, três papéis. A tríade anterior (Bricolage Grotesque + Instrument
Sans + Martian Mono) lia como página de jornal: display de manchete e mono em
todo dado davam ar de nota impressa, não de distribuidora moderna. A mono era a
maior responsável — preço, SKU e quantidade em Martian Mono transformavam cada
card em cupom fiscal.

| Papel | Família | Por quê |
|---|---|---|
| Display | **Plus Jakarta Sans** 700/800 | geométrica com terminais levemente humanistas: firme nos títulos sem o peso de manchete |
| Corpo | **Inter** 400/500/600 | desenhada para tela, ótima em corpo pequeno sob sol forte, que é a condição de quem lê atrás do balcão |
| Dado | **Inter** + `tabular-nums` | código, quantidade e preço continuam alinhados em coluna, mas na voz da interface, não na do documento |

O papel "dado" perdeu a família própria e ganhou os numerais tabulares da Inter:
é o que a mono de fato entregava de útil (dígito de largura fixa, coluna de
preço que não dança), sem o serifado técnico que puxava para o impresso. O
`--font-dado` continua existindo como variável, então maiúsculas, tracking e
tamanho de etiqueta seguem separados do texto corrido.

Cada família tem **face de reserva com métrica ajustada** (`size-adjust`,
`ascent-override`, `descent-override`), usando a fonte que já está no aparelho.
Sem isso, o texto muda de tamanho quando a fonte chega e a página anda — era
assim que o CLS ia a 0,16.

Só os pesos usados são baixados. Duas famílias em vez de três também significa
uma requisição a menos de fonte no caminho crítico.

### Escala

Modular, de degraus reais. Antes eram 29 tamanhos distintos, com campeões
quebrados como `14.08px` e `12.48px` — resultado de multiplicador solto, não de
escala.

`--t-50` 11px · `--t-100` 13px · `--t-200` 15px · `--t-300` 16px ·
`--t-400` 18px · `--t-500` 22px · `--t-600` 28px · `--t-700` 32–42px ·
`--t-800` 40–68px

---

## Espaço

Base 4, sem valor solto: `--e-1` 4px até `--e-9` 96px.

---

## Forma e elevação

**Raio.** `--r-1: 3px` é o padrão — canto de etiqueta. Os 16px em 445 elementos
e as 476 cápsulas de 999px eram o que mais dava cara de template. Cápsula
sobrou em cinco lugares onde a forma redonda quer dizer alguma coisa: contador,
bolha do WhatsApp, ponto do carrossel e o botão flutuante.

**Elevação.** Documento assenta, não paira.

- `--el-1` — assentamento de 1px. É o padrão
- `--el-2` — deslocamento duro de 2px, como impresso. Estado ativo
- `--el-3` — sombra de verdade. **Só no painel da lista**, que é a única coisa
  que está de fato por cima da página

---

## Movimento

Curva própria. Antes, quase todas as 18 combinações de transição usavam
`cubic-bezier(.4, 0, .2, 1)` — o easing padrão do Material/Tailwind.

| Token | Valor | Quando |
|---|---|---|
| `--ms-1` | 120ms | carimbo, pressão de botão |
| `--ms-2` | 200ms | mudança de estado (hover, foco, filtro) |
| `--ms-3` | 320ms | entrada de bloco |
| `--ease-firme` | `cubic-bezier(.2, .8, .2, 1)` | padrão: decidido, sem sobra |
| `--ease-saida` | `cubic-bezier(.4, 0, 1, 1)` | o que está saindo de cena |
| `--ease-carimbo` | `cubic-bezier(.34, 1.3, .64, 1)` | **só o carimbo** |

**O momento.** Quando um item entra na lista, a linha bate como carimbo em
papel (escala 1.055 → 1). É o único movimento com overshoot no site inteiro, de
propósito: a ousadia é gasta num lugar só. Espalhar é o que faz parecer feito
por IA.

**A rolagem rebobina.** Descendo, cada bloco carrega onde sempre carregou: sobe
24px com fade, os cards entram escalonados e a linha do "Como funciona" se
desenha. Subindo, o bloco que sai pela faixa de baixo da tela descarrega pelo
mesmo caminho ao contrário, em 65% do tempo, acelerando (`--ease-saida`) e na
ordem inversa: o último card a entrar é o primeiro a sair. Descer de novo
carrega de novo, quantas vezes for. É gatilho, não animação presa ao scroll:
a entrada continua cronometrada como antes e funciona em todo navegador.

| Parâmetro (`:root`) | Valor | O que faz |
|---|---|---|
| `--descarga-linha` | 80% | subindo, o bloco cujo topo passa desta altura da tela descarrega |
| `--descarga-folga` | 40px | quanto rolar no sentido novo para valer como virada; tremor não pisca |
| `--descarga-rapida` | 2,5 px/ms | acima disso a troca é sem animação (arremesso, barra, âncora) |
| `--descarga-fator` | 0,65 | duração da saída sobre a da entrada |
| `--descarga-passo` | 60ms | escalonamento da saída, do último card ao primeiro |
| `--descarga-traco` | 600ms | a linha do "Como funciona" recolhendo (ela desenha em 1,3s) |

Nunca descarrega: cabeçalho, marquee, abertura, botões flutuantes, o catálogo
da loja, o que aparece na primeira tela (voltar ao topo é voltar à página de
quando se chegou), bloco com foco de teclado dentro, e nada com movimento
reduzido. Os contadores não voltam a zero. Bloco descarregado some da vista mas
não do leitor de tela, não recebe toque, e focar algo dentro dele carrega na
hora.

Tudo respeita `prefers-reduced-motion`, que zera animação e transição.

---

## Composição

- **Cabeçalho de seção é placa de corredor**: barra estrutural em cima, rótulo
  à esquerda, naco de vermelho na ponta. Não é título centralizado com
  tracinho, que era o mesmo gesto em toda seção de toda página.
- **A home abre assimétrica**: texto na coluna larga, e na margem direita a
  coluna de razão — o estoque contado em mono. No celular a contagem vem
  primeiro: é a prova antes da promessa.
- **Cartão de produto é ficha**: assenta na grade, canto de etiqueta, nome em
  display, marca em mono maiúsculo, tarja de categoria crescendo da esquerda no
  hover.
- **O painel da lista é um bloco de pedido**: tarja escura no topo com rótulo
  em mono, pauta pontilhada entre itens, picote antes do rodapé. Enviar passa
  por três etapas na mesma gaveta — a lista, quem está pedindo (o cabeçalho da
  nota, com CNPJ e WhatsApp em mono) e o pedido pronto, com o código carimbado
  em azul. Quem já pediu no aparelho vê só o cartão "Pedido para" e envia.
- **O filtro da loja é um funil que lê como índice de catálogo impresso**:
  nome, pontilhado de sumário e quantidade em mono. Seção → tipo é dependência
  real, então o tipo pende da seção por uma faixa âmbar (`--faixa`, o único uso
  dela no painel); marca não depende de nada e não leva número. A opção
  escolhida fica carimbada (`--carimbo`) e tocar de novo desfaz. No celular as
  mesmas opções viram trilhos de etiquetas em linhas de altura fixa: abrir um
  link já filtrado não empurra a grade.

---

## Piso que não se negocia

Contraste AA medido por teste automático, inclusive com o sistema no tema
escuro (o site tem de continuar claro). Foco visível.
Navegação por teclado. Alvo de toque ≥ 44px. HTML semântico. `prefers-reduced-motion`.
CLS abaixo de 0,01 em todas as páginas medidas.

Nada disso é opcional e nada disso aparece na tela como enfeite — é o chão.
