# Correções da revisão do PR43 — 05/10/2026

Autoria: CODEX; solicitante mafaltti (Danilo-Komunick), perfil autenticado GitHub consultado nesta
sessão. Revisão e decisões recebidas do usuário. Branch feature/scheduling-administrative-20261002,
base técnica 4e427ac. Trabalho anterior de delimitação preservado; esta evidência não reatribui sua
autoria.

## Escopo e decisões

- HIGH: primeiro reject confere status 403/mensagem da guarda de files:create; segunda guarda mantém
  código de Agendamentos. Ausência de arquivo persistido após negações e matriz posterior cobertas.
- MEDIUM: decisão explícita inicializa contador legado desconhecido em zero, sem inventar eventos;
  migration 0036 preserva valores conhecidos e incrementa versão dos alterados.
- MEDIUM: UPDATE sem mudança de ocupação não reaplica o bloqueio de recurso. Outras reservas
  confirmadas permanecem válidas por decisão do usuário; INSERT, destino/status/recurso alterados
  continuam validados. Aprovação de pendência continua negada em recurso bloqueado.
- LOW: indisponibilidade só futura/sem falta; novas provas somente com finalidade restrita;
  autoridade revalidada após locks da intenção e replay; auditoria mínima de revisão/grant; leitura
  de revisão sem lock global; três índices das consultas apontadas; savepoint por ocorrência com
  retry após commit dos sucessos; política legada explícita no contrato/rollout; rascunho por
  filtros de origem; diretório protegido no servidor/UI.
- Remediação de segurança necessária ao CI: dois arquivos de dependências de
  b71c3371e997d2f6e95cb7f821576dd46a1874cb (PR44), autoria Gabriel-Komunick/CLAUDE conforme
  histórico, incorporados sem modificar sua implementação. PR44 não foi integrado por esta
  instância.

## Validação

Validação local: 210 testes unitários pertinentes aprovados (20 arquivos), incluindo 101 testes de
HTTP/permissões/auditoria/rascunho/equipe executados também pelos subagentes. TypeScript web e db,
ESLint dos arquivos alterados, 169 testes de contratos e diff-check aprovados. Install com lockfile
congelado consistente; audit sem high/critical (uma baixa e duas moderadas permanecem). Os
subagentes realizaram revisão estática independente sem bloqueante concreto encontrado; isso não
substitui testes de banco.

Integração PostgreSQL, build e E2E serão executados no CI da nova ponta. Nenhum
serviço/WSL/localhost ou banco de uso iniciado. Não usar os runs verdes b676974/cac5cbb como prova
desta correção. Runs 37061317002/37061310305 falharam antes das asserções restantes de isolamento,
conforme revisão recebida.

Backup dos quatro documentos locais anteriores:
.cache/local-backups/scheduling-review-20261005-123015 na principal, conferido byte a byte.
Migrations anteriores não reescritas. Nova 0036 evita colisão com 0035 da entrega de cargo base; a
composição final deve listar ambas quando integradas.

## Revisão pelo guia e limites

Guia docs/caab-design.md consultado na principal: preservação de edição, consulta sem acesso e
exportação. Correção de rascunho mantém filtros/seleções por origem; diretório some quando acesso é
revogado. Sem mudança de layout, tokens ou semântica de downloads. Testes de componente e CI são
evidências técnicas; nenhuma homologação humana, dispositivo físico ou leitor de tela real
declarados.

INFO preservados: grant bearer por até 300 segundos; sem segregação obrigatória entre
registrar/apresentar/decidir; retenção institucional ainda sem política; Relatórios conserva os
cinco estados existentes no PR; não alteramos essas decisões nesta correção. Testes com rejects
genéricos serão precisados nos cenários tocados e a prova concorrente deve observar espera real.
Histórico de commits não será reescrito para remover mensagens repetidas. Volume documental decorre
do PR já aberto; corpo novo deve resumir o resultado e distinguir evidência histórica/atual.

Rollout e QA humano permanecem pendentes; nenhum merge autorizado.
