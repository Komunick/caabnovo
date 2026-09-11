# Pesquisa — 09/09/2026

Pesquisa documental oficial, sem teste de interfaces comerciais nem acesso ao legado.

- [CiviCRM users/contacts](https://docs.civicrm.org/user/en/latest/initial-set-up/users-contacts/): contatos existem sem login. Decisão: member separado de user. Rejeitada ampliação da tabela de login com CPF/OAB.
- [CiviCRM memberships](https://docs.civicrm.org/user/en/latest/membership/defining-memberships/): vínculo e transação financeira são distintos. Decisão: situações independentes; não copiar transições financeiras desse produto como regra CAAB.
- [CiviCRM relationships](https://docs.civicrm.org/user/en/latest/organising-your-data/relationships/): relações tipadas entre registros individuais. Decisão: dependente próprio com relação histórica, sem campos repetidos no titular.
- [OAB CNA](https://consulta.oab.org.br/): fonte de consulta manual. A pesquisa inicial não havia localizado uma API documentada. Revisão de 10/09/2026: os registros anteriores apontaram o projeto `C:/Projetos/caab-caapp`, onde foram encontrados o guia OAB-BA/Implanta, o serviço `apiOab.js` e a tela `ConsultaOab.tsx`. A integração existe no legado; não confundir ausência de configuração no novo painel com inexistência de API. Evidências e limites em [contracts/oab-legacy.md](contracts/oab-legacy.md). Não é necessário automatizar o portal/CAPTCHA.

Inferências de desenho: arquivos privados reutilizados, correção como nova evidência, avaliação desconhecida não aprova benefício. Nenhuma lista obrigatória/limite de idade inventado; cada decisão registra base e motivo. Pergunta enviada ao responsável, cadastro independente dessa resposta.

Mobile tem dados privados. Não provisionar contas externas nesta entrega: autenticação futura exige distinção de audiência antes de permitir sessões do app. Caassh referencia member por UUID, sem duplicar dados pessoais ou inferir elegibilidade de crédito.

## Revalidação em 10/09/2026

Fontes oficiais de usuários/contatos e relacionamentos do CiviCRM acima consultadas novamente. Mantida a distinção entre pessoa e conta, e a relação entre cadastros independentes. Não copiamos regras institucionais desse produto. Guias locais da versão instalada do Next sobre Route Handlers e page.js conferidos; parâmetros assíncronos e respostas privadas preservados.

Decisão de acesso confirmada pelo usuário nesta sessão: permissões de consulta, edição e análise concedidas inicialmente ao administrador existente. Demais perfis exigem concessão explícita, sem novo papel automático. Credencial continua situação/validade; emissão verificável exige definições institucionais.
