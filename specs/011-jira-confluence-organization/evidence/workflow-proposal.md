# Fluxo e evidência

Nenhum histórico antigo é reaberto automaticamente por falta de QA. Code Review corresponde a
revisão/testes IA; QA identifica humano, versão, data e resultado. Não foi encontrada validação
humana identificada suficiente para encerrar novos recortes somente a partir dos comentários/PRs
consultados. Isso é ausência de prova nesta consulta, não afirmação de que ninguém testou.

| Ticket/conjunto         | Atual          | Proposto           | Motivo                                                                         |
| ----------------------- | -------------- | ------------------ | ------------------------------------------------------------------------------ |
| CAAB-24                 | Em Teste / QA  | Em Desenvolvimento | PR40/comentário do autor declaram escopo restante; pai mantém escopo completo. |
| NEW-DETAIL              | Inexistente    | Em Teste / QA      | Preserva acompanhamento do recorte integrado, sem presumir QA concluído.       |
| NEW-REPORTS             | Inexistente    | Backlog            | Restante sem implementação/assunção comprovada.                                |
| NEW-ADMIN / NEW-ABSENCE | Inexistente    | Em Desenvolvimento | Entrega local registrada, sem integração/homologação.                          |
| NEW-EMAIL               | Inexistente    | Backlog            | Transporte real pendente.                                                      |
| Demais existentes       | Snapshot atual | Preservar          | Não avançar ou reabrir por inferência.                                         |

Backlog 18/19/20/22 possuem implementação descrita em PRs; registrar essa evidência sem chamá-los de
não implementados nem alterar prontidão sem aceite reconciliado. CAAB-28 possui base integrada e
complemento local. CAAB-30 permanece adiado. CAAB-2 registra caixa de entrada como próxima função,
com perguntas sobre canais, público e ações; não definir regras por inferência. Itens 31/32/33
permanecem em definição/homologação no Backlog.

Perguntas de escopo ficam no corpo do item. Para registros históricos fechados, não inventar novos
critérios retroativos. Consolidado/transferido/histórico mantém o status; retirada ocorre apenas na
visão ativa.
