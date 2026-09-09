# Relatório do turno da noite

Uma seção por execução, acrescentada ao fim. É o que o dono lê de manhã.

---

## 09/09/2026, 00:50 — turno 1 (rodado com o dono acompanhando)

**Item:** a política de privacidade não mencionava a consulta de CNPJ.

O campo de CNPJ em `quero-ser-cliente.html` envia o número digitado para a
BrasilAPI, que lê o cadastro público da Receita. Isso é compartilhamento com
operador externo e não estava declarado em lugar nenhum da política — a falha
foi introduzida junto com a validação, no mesmo dia.

Feito:
- Nova cláusula na seção 3 ("Como os dados trafegam") dizendo qual dado sai
  (só o CNPJ), para quem, com que finalidade, que a resposta não é gravada e
  que a conferência não é obrigatória.
- A lista de dados coletados dizia "cidade"; o formulário passou a coletar
  bairro. Corrigido.

Verificação: `checar-links` sem caminho quebrado, `orfas` em zero, `app.js`
sem erro de sintaxe e o build idempotente (rodar `gerar.js` duas vezes não
gera diferença).

Pendente da fila: os outros itens de privacidade, segurança e acessibilidade.
