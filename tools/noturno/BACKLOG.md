# Fila do turno da noite

Um item por execução, de cima para baixo. Ao concluir, marque `[x]` e escreva
numa linha o que foi feito. Se descobrir algo novo durante o trabalho,
acrescente ao fim em vez de sair fazendo.

Legenda: `[ ]` pendente · `[x]` feito · `[!]` tentado e falhou (com o motivo)

---

## Privacidade e conformidade

- [x] **A política de privacidade não menciona a consulta de CNPJ.** FEITO em 09/09: cláusula nova na seção 3, dizendo que só o CNPJ é enviado, para quem, para quê, e que a resposta não é gravada.
  O campo de CNPJ em `quero-ser-cliente.html` envia o número digitado para
  `brasilapi.com.br` (ver `consultarCnpj` em `app.js`). Isso é compartilhamento
  com operador externo e precisa estar declarado na
  `politica-de-privacidade.html`: qual dado sai, para quem, com que finalidade
  e que a resposta não é armazenada pelo site. Acrescentar na seção de
  compartilhamento de dados, no mesmo tom das outras cláusulas.

- [x] **A política não menciona o campo Bairro nem a lista de bairros.** FEITO em 09/09: a lista de dados coletados dizia "cidade"; passou a dizer bairro ou município.
  O formulário passou a coletar bairro. Conferir se a enumeração de dados
  coletados na política cobre isso e o CNPJ; completar o que faltar.

- [ ] **Formulário de cadastro sem honeypot.**
  `trabalhe-conosco.html` tem campo `botcheck` contra robô; o `clientForm` e o
  `contactForm` não têm nada. Adicionar um campo escondido equivalente e
  descartar o envio quando vier preenchido.

- [ ] **`Referrer-Policy` não está declarada.**
  Acrescentar `<meta name="referrer" content="strict-origin-when-cross-origin">`
  no `<head>`, pelo partial/`tools/gerar.js` para valer nas 435 páginas. Conferir
  depois que o mapa do Google e a consulta de CNPJ continuam funcionando.

## Segurança

- [ ] **Sem Content-Security-Policy.**
  O GitHub Pages não envia cabeçalho, mas `<meta http-equiv="Content-Security-Policy">`
  funciona. Montar uma política que cubra o que o site realmente usa:
  Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), Analytics
  (`googletagmanager.com`, `google-analytics.com`), o iframe do Maps
  (`google.com/maps`), a consulta de CNPJ (`brasilapi.com.br`) e o envio do
  formulário de vagas (`api.web3forms.com`). Começar em `report-only` numa
  página só, conferir o console limpo, e só então valer para todas.

- [ ] **Conferir `rel="noopener"` em todo link externo.**
  Escrever a checagem em `tools/checar-links.js` (ou script novo) para acusar
  `target="_blank"` sem `rel` contendo `noopener`, e corrigir o que aparecer.

- [ ] **Auditar o que vai para o `localStorage` e `sessionStorage`.**
  Hoje: `dr-consentimento-medicao` e `dr-balao-zap`. Confirmar que nada de
  pessoal é gravado e que a política descreve isso.

## Acessibilidade

- [ ] **Varredura de contraste em toda a paleta nova.**
  A paleta mudou de bege para cinza neutro. Escrever um script que percorra os
  pares cor/fundo declarados no `style.css` e liste o que fica abaixo de 4,5:1
  (3:1 para texto grande). Corrigir o que reprovar.

- [ ] **Conferir a ordem de foco e o `:focus-visible` nos componentes novos.**
  Painel de filtros do catálogo, lista de bairros, checkboxes de regra do
  cadastro e botões do mapa. Navegar só pelo teclado e anotar o que não recebe
  foco visível ou recebe fora de ordem.

- [ ] **`aria-live` do resultado da busca com os filtros novos.**
  O contador anuncia a busca por texto. Confirmar que também anuncia mudança de
  marca, categoria e "só com foto", e que não fica tagarela demais.

## Desempenho

- [ ] **Medir a loja de novo depois de todas as mudanças de hoje.**
  Registrar peso transferido e número de requisições no primeiro acesso, e
  comparar com os 174 KB / 12 requisições medidos antes do painel de filtros.
  Anotar o número no relatório.

- [ ] **`loja.html` tem 481 KB não comprimidos.**
  São 426 cartões em HTML. Avaliar (sem implementar) se vale renderizar só as
  primeiras categorias no HTML e trazer o resto do `assets/data/produtos.json`
  sob demanda. Escrever a análise em `PROPOSTAS.md` com números.

## Higiene

- [ ] **Duplicatas no `style.css`.**
  `.form-consent`, `.category-bar`, `.category-chip`, `.hero`,
  `.hero-carousel-next` e `.whatsapp-float` estão definidos mais de uma vez.
  São complementares hoje, mas foi um par assim (`.btn-ghost`) que deixou um
  botão ilegível no ar. Juntar cada par num lugar só, sem mudar o resultado
  visual — conferindo antes e depois com os valores computados.

- [ ] **`tools/migracao/` acumulou 8 scripts de uma passagem só.**
  Conferir que o `LEIAME.md` de lá descreve todos, incluindo os adicionados
  depois (`patch-historia.py`, `patch-paleta.py`, `patch-formulario.py`,
  `patch-blocos.py`, `patch-faixa-clara.py`).

## Design e layout

O dono liberou a implementação. Carregue a skill `frontend-design` antes de
mexer em aparência, faça **um redesenho por commit** e registre no
`PROPOSTAS.md` o que decidiu e por quê. Não reabra as decisões fechadas
listadas no REGRAS.md.

- [ ] **Seção "Marcas que trabalhamos" na home.**
  O dono disse, com essas palavras, que "essa construção está uma merda".
  Hoje é uma coluna de 16 botões de texto ao lado de uma foto que troca ao
  clicar (`.brand-selector`, `.brand-selector-list`, `.brand-select-btn`).
  Problemas visíveis: a lista de 16 nomes empilhados domina o bloco, os nomes
  têm comprimentos muito diferentes, e a foto ao lado muda de proporção
  conforme a marca. Refazer o layout inteiro: grade, espaçamento e estado de
  hover. Considere se marca precisa mesmo de foto ou se um grid de nomes bem
  resolvido comunica melhor.

- [ ] **Barra de categorias do catálogo.**
  Primeira coisa de que o dono reclamou. É uma tira horizontal com 33 chips
  que rola para o lado, com barra de rolagem visível e chips cortados nas
  pontas. Já existe o painel de filtros acima dela, então a tira pode ter
  outro papel — ou deixar de existir. Decida e justifique.

- [ ] **Cartões de produto do catálogo.**
  Padronizar o enquadramento: as fotos têm assuntos de tamanhos muito
  diferentes dentro do mesmo quadrado de 1:1, então uns produtos aparecem
  grandes e outros minúsculos. Avaliar `object-fit`, área de respiro e fundo
  para o conjunto ficar regular. Não mexer nos arquivos de imagem.

- [ ] **Placeholder dos 125 produtos sem foto.**
  Hoje é a inicial do produto sobre hachura diagonal. Funciona, mas fica
  pobre ao lado de cartões com foto. Melhorar sem inventar imagem.

- [ ] **Revisar o conjunto depois das mudanças de ontem.**
  A paleta trocou de bege para cinza neutro, o modo escuro saiu, a faixa de
  CTA clareou e os heros perderam o gradiente. Passar pelas 9 páginas com
  olhar de conjunto e listar o que ficou órfão do estilo antigo.

---

## Encontrado durante o turno

(acrescente aqui o que descobrir, em vez de sair implementando)
