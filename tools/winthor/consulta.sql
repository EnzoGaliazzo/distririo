-- Catálogo + estoque do WinThor para sincronizar com o site.
--
-- Rode dentro da sessão remota, no PL/SQL Developer, no SQL Developer ou no
-- Gerador de Relatórios do WinThor, e salve o resultado como CSV em
-- tools/winthor/export/estoque.csv (essa pasta não vai para o GitHub).
--
-- Nomes de tabela e coluna seguem o padrão do WinThor. Se a sua base tiver
-- customização, ajuste: o que importa é a saída ter código, descrição,
-- embalagem/EAN, marca/fornecedor e a quantidade disponível.
--
-- CODFILIAL: troque o 1 pela filial que atende o site. Se for mais de uma,
-- tire o filtro e some, agrupando por CODPROD.

SELECT
    p.CODPROD                                    AS codigo,
    p.DESCRICAO                                  AS descricao,
    p.CODAUXILIAR                                AS ean,
    f.FORNECEDOR                                 AS fornecedor,
    p.EMBALAGEM                                  AS embalagem,
    NVL(e.QTESTGER, 0)
      - NVL(e.QTRESERV, 0)
      - NVL(e.QTBLOQUEADA, 0)                    AS disponivel
FROM PCPRODUT p
         LEFT JOIN PCEST e ON e.CODPROD = p.CODPROD
    AND e.CODFILIAL = '1'
         LEFT JOIN PCFORNEC f ON f.CODFORNEC = p.CODFORNEC
WHERE p.DTEXCLUSAO IS NULL          -- fora os produtos excluídos do cadastro
ORDER BY f.FORNECEDOR, p.DESCRICAO;
