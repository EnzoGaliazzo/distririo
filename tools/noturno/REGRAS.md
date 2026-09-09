# Turno da noite — regras de operação

Estas regras valem para toda execução automática no site Distri Rio.
Cada execução começa do zero, sem memória da conversa anterior. Leia este
arquivo inteiro antes de mexer em qualquer coisa.

## A regra que não se quebra

**Nunca commitar na `main`. Nunca dar push na `main`.**

Empurrar a branch de trabalho e seguro e esperado: o GitHub Pages publica da
`main`, entao `git push -u origin melhorias/noite-AAAA-MM-DD` nao coloca nada
no ar. O que nao pode e a `main`.

Todo trabalho vai para a branch `melhorias/noite-2026-09-09`. O dono revisa de manhã e
decide o que sobe. O site publica em ~20 segundos a partir da `main`: um erro
commitado lá de madrugada fica no ar até alguém acordar.

```bash
git rev-parse --abbrev-ref HEAD          # confira onde está
git checkout melhorias/noite-2026-09-09
```

Se a branch não existir, crie a partir da `main`. Se houver alteração não
commitada na `main` ao começar, **pare e não faça nada** — pode ser trabalho do
dono em andamento.

## O que não se toca

Decisões já tomadas pelo dono. Não reabra nenhuma delas, mesmo que pareçam
erradas ou que algum documento de auditoria diga o contrário:

- **`recrutamento@distririo.com.br`** é o e-mail público único. Não trocar.
- **O site é claro.** Não reintroduzir modo escuro nem `prefers-color-scheme`.
- **A empresa é de 2017 e tem 9 anos.** Não voltar para 1960 / 66 anos.
- **O carrossel de banners fica no topo da home**, o texto vem abaixo.
- **A faixa de CTA é clara**, como o resto da página.
- **Nada de gráfico de marketing montado à mão** (colagem, composição). Use
  os arquivos reais como estão, recortados de forma limpa quando precisar.
- **Não baixar foto de produto da internet.** São imagens com dono e o risco
  cai no CNPJ da Distri Rio.
- Não mexer no conteúdo de `data/produtos.json` sem instrução explícita.

## Como trabalhar

1. Abra `tools/noturno/BACKLOG.md` e pegue **o primeiro item não concluído**.
2. Faça **um item por execução**. Item grande demais para uma execução: quebre
   em partes, faça a primeira e anote o resto no backlog.
3. Rode o build e as verificações **antes de commitar**:
   ```bash
   node tools/gerar.js
   node tools/checar-links.js     # tem de terminar em "nenhum caminho quebrado"
   node tools/orfas.js            # tem de dizer "órfãs: 0"
   node --check app.js
   git status --porcelain         # rodar gerar.js de novo não pode gerar diff
   ```
   Qualquer uma falhando: desfaça o que você fez (`git checkout -- .`) e anote
   no backlog o que deu errado. Não commite trabalho quebrado.
4. Commite com mensagem que explique **o que mudou e por quê**, no mesmo estilo
   do histórico do repositório (português, sem emoji, corpo em linhas curtas).
5. Marque o item como concluído no `BACKLOG.md`, com uma linha do que foi feito,
   e commite o backlog junto.
6. Escreva o que fez em `tools/noturno/RELATORIO.md`, acrescentando ao fim —
   é o que o dono lê de manhã. Uma seção por execução, com horário.

## Verificação

Nunca dê um item por resolvido só porque a propriedade que você mudou está no
arquivo. Confira o elemento renderizado: suba o preview e leia as cores e
medidas computadas do elemento em questão.

A captura de tela do painel do navegador falha com frequência (volta em
branco). Quando isso acontecer, **diga no relatório que não conseguiu ver
renderizado**, em vez de afirmar que conferiu.

## Design e layout

O dono liberou o turno para **implementar** redesenho, não só propor. Vale para
layout, hierarquia, espaçamento e repaginação de componentes.

Antes de mexer em aparência, carregue a skill `frontend-design` (está em
`.agents/skills/frontend-design`) e siga o que ela orienta. Ela existe
justamente para o resultado não sair com cara de template genérico.

O que continua valendo:

- **Um redesenho por commit**, com a seção afetada no título da mensagem. De
  manhã o dono precisa poder aceitar um e descartar outro sem desfazer tudo.
- **Nada de gráfico montado à mão** — sem colagem, sem composição, sem texto
  sobreposto a foto para simular peça de campanha. Use os arquivos reais.
- **Não reabra as decisões da lista acima.** Site claro, banner no topo, faixa
  de CTA clara e o resto continuam fechados; liberdade de design é sobre
  *como* cada seção se organiza, não sobre desfazer o que já foi decidido.
- **Registre no `PROPOSTAS.md` o que você decidiu e por quê**, mesmo tendo
  implementado. Uma seção por mudança, curta: o que estava ruim, o que você
  fez, o que considerou e descartou. É o que permite o dono discordar de forma
  específica em vez de mandar refazer tudo.
- **Antes e depois medidos.** Para cada redesenho, registre as medidas que
  mudaram (contraste, tamanho de fonte, espaçamento, largura de coluna) e
  confirme que nada reprova em AA.

## Se travar

O dono autorizou decidir sozinho: "se você ficar em dúvida em algo, só faça o
que você acha o recomendado". Então **decida e siga** em toda escolha técnica ou
de design — qual abordagem usar, como organizar uma seção, que nome dar a uma
classe. Registre a decisão e o porquê no relatório, para ele discordar de forma
específica de manhã.

**Isso não vale para fato comercial.** Preço, pedido mínimo, prazo de entrega,
forma de pagamento, depoimento, nome de cliente, número de comércios atendidos,
unidades por caixa, EAN, peso, validade, cidade atendida. Aqui a ação
recomendada **é** deixar `[FALTA: ...]` e registrar a pergunta — não é fugir da
decisão, é a decisão certa. O próprio dono escreveu a regra duas vezes:
distribuidora vive de confiança e informação errada custa cliente. O site já
teve depoimento inventado uma vez e foi removido por isso.

Item que dependa inteiramente de dado que não existe: monte a estrutura, marque
o que falta, e siga para o próximo.

## Duas execuções ao mesmo tempo

Antes de começar, confira se a branch de trabalho tem alteração não commitada:

```bash
git status --porcelain
```

Se tiver, outra execução pode estar no meio de uma tarefa. Espere a próxima
rodada: anote no relatório que pulou por isso e encerre. Dois turnos editando os
mesmos arquivos se atropelam.
