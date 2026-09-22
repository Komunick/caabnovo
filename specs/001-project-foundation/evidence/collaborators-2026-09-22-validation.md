# Validação de Colaboradores e motivos de exclusão — 22/09/2026

## Complemento da revisão e padronização — 22/09/2026

Escopo001 T130–T132,003 UI03 e010 UI03, no mesmo PR37 aberto. Códigoe9d05ed contém fuso
America/Bahia na lista, CEP ausente sem rótulo residual na ficha e exportação por CPF com/sem
máscara/parcial e Exclusão pendente. CPF malformado retorna422 antes do download. Integração
confirma datas inclusivas, limite do próximo dia e igualdade lista/exportação em janeiro de2018,
incluindo combinações e exportação por lotes.

Cabeçalho de quadro compartilhado em Colaboradores/Auditoria/Relatórios posiciona exportação acima
dos filtros, com botão secundário, Download e adaptação ao celular. Novo colaborador usa o mesmo
posicionamento/estilo primário de Parceiros/Associados. Os módulos sem botão de exportação ainda
dependem de implementação própria; suas pendências e as migrações de fluxo em Auditoria/Relatórios
continuam abertas.

[CI35736033889](https://github.com/Komunick/caabnovo/actions/runs/35736033889),027d1f6:
quality/browser/security aprovados;387 unitários,167 contratos,238 integração, 95 E2E sem
falhas/flaky e6 a11y, mais2 cenários prévios de Relatórios. Migrations, formatação, lint, tipos,
build e segurança passaram. Localmente:167 contratos, 19 unitários de exportação e3 de Relatórios,
lint/tipos web e formatação explícita dos documentos. T130–T132,003 UI03 e010 UI03 concluídas.
Fechamento posterior muda somente documentos; a aplicação validada permanece idêntica.

[CI35734203068](https://github.com/Komunick/caabnovo/actions/runs/35734203068) aprovou93ed931, antes
da padronização. A rodadae9d05ed também passou integralmente. Revisão detectou captura móvel durante
a animação do menu;027d1f6 ajustou somente o teste para capturar estado final, verificar a11y móvel
e ausência de transbordamento. Nova imagem revisada:
[exportação](https://github.com/Komunick/caabnovo/actions/runs/35736033889/artifacts/10697393514).
Ficha sem CEP conferida. Imagens da padronização revisadas em desktop/celular e claro/escuro:
[Colaboradores](https://github.com/Komunick/caabnovo/actions/runs/35734927572/artifacts/10697467462),
[Auditoria](https://github.com/Komunick/caabnovo/actions/runs/35734927572/artifacts/10697182161) e
[Relatórios](https://github.com/Komunick/caabnovo/actions/runs/35734927572/artifacts/10698136299).
Localhost/Docker permaneceram desligados e o banco local não recebeu migrations/seeds. PR37
atualizado na mesma branch, sem aprovação ou integração.

O restante deste relatório preserva as evidências do incremento anterior.

Escopo: 001 T124–T129 e 005 LC03. Documentação de dependentes incluída conforme autorização;
POL01/POL02 não implementadas. Localhost permanece desligado e o banco local não recebeu migrations
nem seeds. Preparação concluída para abertura autorizada de PR; sem aprovação ou integração.

## Resultado final

[CI35728053078](https://github.com/Komunick/caabnovo/actions/runs/35728053078), código3ca6410:
quality, browser e security aprovados. Foram387 unitários,161 contratos,237 integração, 94 E2E (sem
falhas ou retries reportados) e6 testes do gate separado de acessibilidade, além de2 cenários de
Relatórios executados antes da suíte completa. Migrations, formatação, lint, tipos, build e
varreduras de segurança aprovados. Fechamento posterior altera somente documentos.

Imagens finais de lista/cadastro/ações e exportação revisadas. No celular, só a tabela rola
horizontalmente; teste confirma ausência de transbordamento da página. Nova senha discreta fica
junto das funções e acima de desativar. Espaçamento do endereço compartilhado restaurado.
Lista/ações verificadas em1280/390 e claro/escuro; exportação inclui foco visível de teclado.
[Artefato de Colaboradores](https://github.com/Komunick/caabnovo/actions/runs/35728053078/artifacts/10694174428)
e [exportação](https://github.com/Komunick/caabnovo/actions/runs/35728053078/artifacts/10693894710).
Medição diagnóstica:30 aberturas do painel de exportação, p95 de554,1ms,100 registros sintéticos,
Node24.20.0 no runner do CI; não constitui benchmark de produção.

T124–T129 e005 LC03 concluídas. Usuário autorizou abrir PR após finalizar; sem aprovação/merge.

## Decisões e implementação

- Criação exige CPF, telefone e endereço estruturado; CEP e complemento opcionais. Migration0029
  aditiva preserva contas existentes, sem inventar dados. Legado aceita preenchimento gradual.
- ViaCEP reutilizado com alternativa manual, validação, cancelamento, timeout de cinco segundos e
  proteção contra resposta atrasada que substituiria uma edição manual.
- CPF permanece único inclusive após exclusão. Consulta autenticada por POST, sem CPF na URL,
  retorna dados mínimos e oferece restauração autorizada/versionada. Restauração não sobrescreve o
  perfil com a tentativa de inclusão e abre o registro existente.
- Exclusão de colaborador/associado exige motivo entre 1 e 1000 caracteres após trim. Auditoria
  preserva motivo, autor e data por ocorrência, inclusive após restauração. Histórico sem motivo não
  recebe justificativa inventada. Prazos anteriores de 24 horas/sete dias preservados.
- Nova senha usa botão neutro junto das funções, acima de desativar. Excluir colaborador aparece
  somente quando desativado, respeitando permissões. Revogação/senhas continuam versionadas.
- Lista oferece inclusão explícita, busca por nome/CPF/e-mail, situação, função/sem função,
  intervalo de cadastro e exclusão atual/pendente/efetiva/todas. Filtros combinam com paginação;
  aguardar transição impede sobrescrever nova busca com a resposta anterior. Tabela usa rolagem
  horizontal no celular, mantendo os controles e tokens compartilhados.
- Exportação mantém Excel, CSV e PDF, seleção/ordem de colunas e campos de contato opcionais.

## Evidências executadas

- Clarify: cinco decisões respondidas. Analyze restrito: nove grupos de requisitos, sete tarefas,
  cobertura100%, sem bloqueadores. Checklist de requisitos13/16 preservado por autorização; este
  relatório não converte critérios institucionais pendentes em implementação concluída.
- [CI35724853202](https://github.com/Komunick/caabnovo/actions/runs/35724853202), 55caeb7:
  segurança/formatação/lint/tipos aprovados;387 unitários e161 contratos passaram. Integração
  236/237, navegador89 passaram/quatro falharam/um intermitente. Detectou fixture sem data de
  desativação, navegação de teste ainda no formulário antigo, texto diferente do validador
  compartilhado e corrida entre limpar filtros e iniciar outra busca. Correções registradas
  em1aa1126, sem relaxar constraints, autorização ou validação de formulário.
- [CI35726464328](https://github.com/Komunick/caabnovo/actions/runs/35726464328), 1aa1126:
  quality/security aprovados:387 unitários,161 contratos,237 integração, migrations, lint, tipos,
  formatação e build de produção. Navegador:93 passaram e uma falha no teste novo, que usava GET
  inexistente em/users/:id. Corrigido para consultar a listagem autorizada existente com exclusões
  incluídas.
- [CI35726706723](https://github.com/Komunick/caabnovo/actions/runs/35726706723),8921766:
  quality/security aprovados;92 E2E passaram, uma falha pelo GET inexistente e um teste de navegação
  intermitente. Corrigida a espera de navegação antes de voltar pelo histórico.
- CI35727158415 e35727809845 foram cancelados após substituição pela rodada final. Não são tratados
  como validação completa. O gate integral foi executado na versão final acima.
- Revisão visual detectou tabela móvel alargando o grid da página;3ca6410 restringe o grid e
  acrescenta verificação de rolagem somente na tabela. Complemento de Associados confere motivos
  distintos, autoria/data, ausência após restauração e legado sem herdar motivo anterior.

## Cobertura e revisão

Contratos verificam obrigatoriedade/normalização, motivos vazios/espaços, origem, consulta mínima
sem cache e acesso negado. Integração verifica unicidade, idempotência, versão, rollback,
paginação/filtros, cadastro legado, concorrência na restauração e histórico por ocorrência. E2E
cobre criar/editar, rascunhos entre módulos, CEP simulado, CPF/reativação recusada e confirmada,
ações por situação, exclusão/restauração de ambos os módulos e formatos de exportação.

Revisão inicial das imagens sintéticas1280/390 identificou compressão das colunas no celular, borda
nativa nos filtros e falta de espaçamento entre campos de endereço. Ajustes preparados; aguardando
novas imagens e conclusão dos testes de navegador/acessibilidade.

## Limites

Testes usam dados sintéticos e banco descartável no CI. ViaCEP é simulado nos testes; não há
promessa de disponibilidade externa. Não houve homologação institucional, backfill de dados, mudança
de retenção, aplicação da matriz documental ou aprovação de PR. O teste automatizado de a11y não
substitui avaliação humana completa. Exportação em100 registros não comprova carga alta.
