# Incremento de Colaboradores — 22/09/2026

Complementa OpenAPI e contratos TypeScript nesta entrega. Todas as rotas exigem sessão atual,
autorização no servidor e origem/CSRF nas mutações e consulta de CPF por POST.

- Criação mantém CPF, nome, e-mail, telefone e rua/número/bairro/cidade/UF obrigatórios. CEP e
  complemento opcionais. Máscaras normalizadas. CPF único inclusive excluídos.
- PATCH de endereço aceita campos parciais, preservando os omitidos. Legado pode ser completado
  gradualmente; valores fornecidos são validados e campos obrigatórios já preenchidos não podem ser
  apagados. Versão obrigatória; conta com exclusão deve ser restaurada explicitamente.
- POST `/api/v1/users/lookup-cpf`: corpo `{cpf}`, exige `users:create` e `users:read` atuais.
  Respostas: `{status: available}`, `{status: existing}` ou
  `{status: deleted, id, version, reason, canRestore}`. Não retornar nome, e-mail, endereço ou
  senha; `reason: null` exibe “Motivo não registrado”. Sem cache e CPF fora da URL.
- POST `/api/v1/users/:id/lifecycle`: `{action: delete, version, reason}` exige motivo após trim
  entre 1 e 1000 caracteres, `users:read` e `users:delete`. Bloqueio imediato e vigência após24h.
  `{action: restore, version}` exige `users:update`; não aceita perfil da tentativa de criação.
  Revalida autorização, versão e estado sob lock, sem restaurar sessões antigas.
- Motivo/autoria/data por ocorrência ficam na auditoria append-only, inclusive após restauração.
  Motivo apresentado corresponde à data efetiva da solicitação atual (precisão de milissegundos da
  serialização); evento ausente não herda motivo de outra exclusão.
- GET `/api/v1/users`: `q`, `status`, `deleted=excluded|pending|only|all`, `roleId=UUID|none`,
  `createdFrom`/`createdTo` em YYYY-MM-DD, cursor/limite técnico de página. Datas inclusivas em
  America/Sao_Paulo, função vigente e consulta parametrizada. Limite de página não limita
  exportação.

UI: motivo exigido somente ao excluir; botão de exclusão visível apenas em conta desativada. Senha
usa botão neutro cinza junto das funções, acima de desativar. Reativação por CPF exige confirmação e
abre o registro existente sem aplicar os dados recém-digitados. CEP usa ViaCEP com tolerância à
falha/timeout e proteção de edição manual contra respostas atrasadas.
