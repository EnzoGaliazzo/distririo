# Relatório da noite — 09/09/2026

Branch: `melhorias/noite-2026-09-09`. Nada foi publicado: a `main` está intocada
e o site no ar é o mesmo de quando você foi dormir.

---

## Como o trabalho está organizado

O briefing foi escrito para uma sessão longa e contínua. Aqui ele roda como
**execuções separadas de hora em hora** (01:13 às 06:13), e cada execução começa
sem memória da anterior. Adaptei sem mudar o conteúdo:

- a ordem do backlog (P0 → P3) é a fila, em `tools/noturno/BACKLOG.md`;
- cada execução pega o primeiro item não concluído, faz **um item**, verifica,
  commita e marca no backlog;
- este relatório e o `PERGUNTAS-PARA-O-ENZO.md` são o estado compartilhado
  entre execuções — é por eles que cada turno sabe onde o anterior parou.

Seis execuções não fecham 19 tarefas. A fila está ordenada para que o que dá
dinheiro venha antes do que é bonito.

## Correções ao briefing

Conferi os números do briefing contra o repositório antes de começar. Quatro não
batiam, e estão registrados no fim do `PERGUNTAS-PARA-O-ENZO.md`. Os que mudam
o trabalho:

- o CSS está em `style.css`, na raiz, não em `assets/style.css`;
- são **426** produtos e 426 páginas, não 428;
- **`404.html` já existe**, com busca, links de categoria e CTA de WhatsApp —
  a tarefa 18 já estava feita antes da noite começar;
- `gh` não está instalado, então não consigo abrir o PR por linha de comando.
  Empurro a branch e deixo aqui o link de abrir o PR com um clique.

## Regra que estou seguindo em todo texto

Nada de fato comercial inventado: preço, pedido mínimo, prazo, forma de
pagamento, depoimento, número de clientes, unidades por caixa, EAN. Onde o texto
precisaria de um desses e o dado não existe no repositório, entra um marcador
`[FALTA: ...]` visível e a pergunta vai para o `PERGUNTAS-PARA-O-ENZO.md`.

Isso é o que mais vai travar tarefa esta noite — o FAQ (P0 nº 3), a prova social
(P0 nº 4), a área de cobertura (P0 nº 5) e as páginas locais (P1 nº 7) dependem
quase inteiramente de dado que só você tem. Vou montar a estrutura de todas e
deixar o conteúdo marcado.

---

## Trabalho feito

### Antes da noite começar — política de privacidade (commit `ae03ac6`)

Não estava no briefing, mas é falha de conformidade e entrou primeiro.

A validação de CNPJ do formulário "Quero ser cliente" envia o número digitado
para a BrasilAPI, que lê o cadastro público da Receita. Isso é compartilhamento
com operador externo e não estava declarado em lugar nenhum da política. A falha
entrou junto com a própria validação, no mesmo dia.

A seção 3 ganhou uma cláusula dizendo qual dado sai (só o CNPJ), para quem, com
que finalidade, que a resposta não é gravada e que a conferência não é
obrigatória. A lista de dados coletados também dizia "cidade" quando o
formulário passou a pedir bairro.

Verificado: links sem quebra, zero imagens órfãs, `app.js` sem erro de sintaxe,
build idempotente.

---

*(cada execução acrescenta a sua seção aqui abaixo)*
