# Pesquisa — 09/09/2026

Pesquisa documental oficial, sem teste de interfaces comerciais nem acesso ao legado.

## Foto de perfil — pesquisa de 11/09/2026

- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html):
  restringir tipos e tamanho, verificar conteúdo, autorizar acesso e verificar segurança.
  Reutilizar o fluxo privado; vincular somente JPEG/PNG liberado de até 5 MB.
- [MDN input file](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file):
  os tipos sugeridos pelo seletor não substituem validação no servidor. Adotar seletor nativo
  rotulado e prévia local, sem câmera ou biblioteca de recorte.

Pesquisa documental, sem dados pessoais ou reconhecimento facial. Os 5 MB são limite técnico
inicial, não regra institucional; foto não determina identidade, situações ou benefícios.

- [CiviCRM users/contacts](https://docs.civicrm.org/user/en/latest/initial-set-up/users-contacts/): contatos existem sem login. Decisão: member separado de user. Rejeitada ampliação da tabela de login com CPF/OAB.
- [CiviCRM memberships](https://docs.civicrm.org/user/en/latest/membership/defining-memberships/): vínculo e transação financeira são distintos. Decisão: situações independentes; não copiar transições financeiras desse produto como regra CAAB.
- [CiviCRM relationships](https://docs.civicrm.org/user/en/latest/organising-your-data/relationships/): relações tipadas entre registros individuais. Decisão: dependente próprio com relação histórica, sem campos repetidos no titular.
- [OAB CNA](https://consulta.oab.org.br/): fonte de consulta manual. A pesquisa inicial não havia localizado uma API documentada. Revisão de 10/09/2026: os registros anteriores apontaram o projeto `C:/Projetos/caab-caapp`, onde foram encontrados o guia OAB-BA/Implanta, o serviço `apiOab.js` e a tela `ConsultaOab.tsx`. A integração existe no legado; não confundir ausência de configuração no novo painel com inexistência de API. Evidências e limites em [contracts/oab-legacy.md](contracts/oab-legacy.md). Não é necessário automatizar o portal/CAPTCHA.

Inferências de desenho: arquivos privados reutilizados, correção como nova evidência, avaliação desconhecida não aprova benefício. Nenhuma lista obrigatória/limite de idade inventado; cada decisão registra base e motivo. Pergunta enviada ao responsável, cadastro independente dessa resposta.

Mobile tem dados privados. Não provisionar contas externas nesta entrega: autenticação futura exige distinção de audiência antes de permitir sessões do app. Caassh referencia member por UUID, sem duplicar dados pessoais ou inferir elegibilidade de crédito.

## Revalidação em 10/09/2026

Fontes oficiais de usuários/contatos e relacionamentos do CiviCRM acima consultadas novamente. Mantida a distinção entre pessoa e conta, e a relação entre cadastros independentes. Não copiamos regras institucionais desse produto. Guias locais da versão instalada do Next sobre Route Handlers e page.js conferidos; parâmetros assíncronos e respostas privadas preservados.

Decisão de acesso confirmada pelo usuário nesta sessão: permissões de consulta, edição e análise concedidas inicialmente ao administrador existente. Demais perfis exigem concessão explícita, sem novo papel automático. Credencial continua situação/validade; emissão verificável exige definições institucionais.

## Pesquisa: justificativas e auditoria — 14/09/2026

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
  Preservar quando/onde/quem/o quê e minimizar dados sensíveis. Auditoria da criação
  independe de texto de justificativa do operador.
- OWASP Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
  Validar no servidor antes da mutação, incluindo texto vazio após trim.
- W3C Forms: https://www.w3.org/WAI/tutorials/forms/ — instruções e nomes acessíveis
  associados aos campos necessários à ação atual.

A obrigação de motivo nas alterações é decisão do usuário, não imposição dessas fontes.
Não alterar permissões, inventar motivo humano nem registrar senhas/tokens em auditoria.

## Pesquisa: resultado OAB — 14/09/2026

- [W3C, Content Structure](https://www.w3.org/WAI/tutorials/page-structure/content/): listas de descrições associam rótulos e valores semanticamente. Decisão de interface: usar dl/dt/dd, texto explícito para situações e colunas adaptáveis.
- [OWASP, Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): minimizar dados pessoais nos registros. Decisão: novos campos ficam somente na resposta privada e na memória da tela; auditoria continua com os metadados já existentes.
- Contrato institucional observado em uma consulta autorizada, diretamente no endpoint já configurado, sem acesso ao banco do projeto. Inventário sem dados pessoais em [contracts/oab-query.md](contracts/oab-query.md). A amostra confirma nomes/tipos observados, não todas as variantes possíveis.

Os sete campos são escolha expressa do usuário. Não inferir elegibilidade nem situação financeira interna a partir deles. A consulta de validação foi única e seus valores não são fixtures, documentação nem dados de cadastro.

- [GitHub upload-artifact](https://github.com/actions/upload-artifact): guardar somente screenshots OAB de fixtures sintéticas como artefato por sete dias, antes de a segunda execução Playwright limpar a pasta. Permite inspeção visual sem iniciar localhost; nenhum trace, ambiente ou resposta real é enviado.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Fonte de negócio: instrução expressa do usuário nesta data para remover motivos de todas as abas. A [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), consultada em 14/09/2026, orienta registrar contexto da ação e identidade. Decisão do projeto: rastreabilidade é automática e não depende de justificativa escrita. O inventário encontrou validações em UI, contratos, serviços e CHECKs SQL; retirar todas as camadas da obrigatoriedade, preservando histórico e permissões. Não presumir que o usuário forneceu um motivo automático.

## Alvos de documentos sem motivo — 15/09/2026

O CI identificou alvo de 19 px adjacente ao histórico após retirar o parágrafo do motivo.
Referência oficial consultada em 15/09/2026: [WCAG 2.2, 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
Decisão: dar área mínima de 44 px ao link de abertura e ao resumo do histórico, preservando
semântica, foco e quebra de texto. Validar com Axe em desktop e celular, histórico aberto
por teclado e capturas sintéticas. A validação automática não substitui homologação humana.
