# Turno da noite — regras de operação

Estas regras valem para toda execução automática no site Distri Rio.
Cada execução começa do zero, sem memória da conversa anterior. Leia este
arquivo inteiro antes de mexer em qualquer coisa.

## A regra que não se quebra

**Nunca commitar na `main`. Nunca dar `git push`.**

Todo trabalho vai para a branch `noturno/melhorias`. O dono revisa de manhã e
decide o que sobe. O site publica em ~20 segundos a partir da `main`: um erro
commitado lá de madrugada fica no ar até alguém acordar.

```bash
git rev-parse --abbrev-ref HEAD          # confira onde está
git checkout noturno/melhorias 2>/dev/null || git checkout -b noturno/melhorias
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

Mudança de aparência é gosto do dono, e ele já corrigiu escolhas feitas por
conta própria antes. Então:

- **Correção objetiva** (contraste que reprova em AA, elemento quebrado,
  sobreposição, texto ilegível, erro de console): pode corrigir.
- **Redesenho** (trocar layout de uma seção, mudar hierarquia, repaginar um
  componente): **não implemente**. Escreva a proposta em
  `tools/noturno/PROPOSTAS.md`, com o que está ruim, o que você faria e por quê.

## Se travar

Sem item claro no backlog, ou item que precisa de decisão do dono: escreva a
dúvida no `RELATORIO.md` e encerre a execução. Não invente escopo.
