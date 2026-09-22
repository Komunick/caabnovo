# Validação de Colaboradores e motivos de exclusão — 22/09/2026

Escopo: 001 T124–T129 e 005 LC03. Documentação de dependentes incluída conforme autorização;
POL01/POL02 não implementadas. Localhost permanece desligado e o banco local não recebeu migrations
nem seeds. Nenhum PR aberto, aprovado ou integrado.

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
- [CI35726706723](https://github.com/Komunick/caabnovo/actions/runs/35726706723), 8921766: inclui
  tabela responsiva, alinhamento dos filtros, timeout ViaCEP e imagens claro/escuro. Em andamento
  neste checkpoint; não representa validação concluída.

- CI35727158415 (57a16d2): espaçamento compartilhado do endereço restaurado; navegador ainda contém
  a mesma consulta incorreta do teste de reativação. Nova rodada necessária.
- Complemento dos testes de Associados: motivos distintos em duas solicitações, ausência de motivo
  atual após restauração, autoria/data preservadas e legado sem herdar a ocorrência anterior.

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
