# Transição de permissões — 21/09/2026

1. Implantar leitura compatível das chaves legadas e nova chave sem ampliar módulos.
2. Executar0025 em transação: cadastrar exports:generate, transformar arrays explícitos
   e role_permission, deduplicar, versionar arrays alterados. Preservar herança, vigência,
   revogação, override vazio e grants de módulo. Verificar efetivo antes/depois, inclusive
   roles inativas/expiradas; não criar permissão se não houver antiga efetiva.
3. Executar0026 separadamente: aplicar [cargos](roles.md), criar Gestor/Colaborador
   e scheduling:read/write/access:manage; Administrador vigente resolve todo o catálogo,
   inclusive novidades, sem redução por override individual. Gestor gerencia concessões
   de qualquer módulo para terceiros sem alterar a si/cargos; sua base inclui consulta
   global, exportação geral e Relatórios completos. Colaborador não concede.
   Remover baseline news geral, preservar override dos não administradores e último
   Administrador. Não atribuir cargos novos a contas por inferência.
4. Novas solicitações usam somente chave geral. Autorizações de snapshots/arquivos antigos
   traduzem a exigência antiga na nova e mantêm todas as demais. U1 exige também
   dependências de conteúdo/gerador não salvas originalmente, segundo
   [downloads legados](../../010-reports-analytics/contracts/legacy-downloads.md).
   Não editar auditorias nem interpretar chave ausente como dispensa de autorização.
5. Guardas e telas passam a usar fonte atual. Não confiar em actor.permissions capturado
   antes de espera por lock. Fixtures de testes que usavam acesso implícito devem mudar.

Reexecução controlada não duplica grants nem incrementa versões sem alteração. A primeira
migração não altera acesso de módulos; a segunda implementa a retirada explícita Q8.
Rollback de aplicação só para versão compatível com as duas chaves; sem reintroduzir
baseline ou apagar dados por conveniência. Caso diagnóstico encontre anomalia, falhar
e registrar relatório seguro antes de mutação parcial. Não auditar nomes/emails reais.

I1 substitui a proibição de novas concessões ao Administrador: seu acesso total decorre do cargo vigente e não de backfill individual. Q4 permanece inalterada para os demais. Revogar/trocar cargo deve remover a autoridade herdada na próxima ação.

Complemento I1: Administrador e Gestor resolvem suas bases por cargo antes das permissões individuais; Q4 continua sendo conversão separada. Gestor possui consulta global/exportação/Relatórios completos; preservar somente concessões individuais adicionais ao trocar/revogar o cargo, sem copiar a base privilegiada.
