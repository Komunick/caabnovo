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

Primeira ponta corrigida: eeb5e42eed39591d0ea914f9b071e0cc56e8be5d. Nos runs
[PR 37335528991](https://github.com/Komunick/caabnovo/actions/runs/37335528991) e
[push 37335523374](https://github.com/Komunick/caabnovo/actions/runs/37335523374), quality e
security passaram. Quality do PR: 577 unitários, 169 contratos, 357 integrações aprovadas, um teste
opcional de volume de Relatórios ignorado e build aprovado. scheduling-absence.test.ts executou
31/31; scheduling-absence-query.test.ts, 13/13. O teste de isolamento completo que parava na linha
880 passou. Merge sintético 17bc35afd66c3b59661e7ff7308f4e4631ec95a9 contra dev 748539d.

Browser dessa primeira ponta: 100 aprovados e uma falha em scheduling-absence.spec.ts:252, nas três
tentativas. A fixture criava owner_type=member para uma nova submissão; a regra corrigida recusou
com SCHEDULING_ABSENCE_EVIDENCE_INVALID. Corrigir a fixture para a finalidade restrita, preservando
a matriz do revisor sem escrita e sem afrouxar produção. Fluxo real de upload/submissão/aceite
passou, assim como acesso, exportação, workflow e agenda. Acessibilidade posterior ficou skipped
nessa rodada; não usar como gate aprovado.

Ponta técnica corrigida: e923e9d34a18c7b85bc342b69fdedd4ad63512d3. Nos runs
[PR 37337887070](https://github.com/Komunick/caabnovo/actions/runs/37337887070) e
[push 37337878171](https://github.com/Komunick/caabnovo/actions/runs/37337878171), quality, browser
e security aprovados. Quality repete 577 unitários, 169 contratos e 357 integrações aprovadas, um
teste opcional ignorado e build aprovado; faltas 31/31 e consultas 13/13. Browser: 101 E2Es, três
testes dedicados de Relatórios e seis de acessibilidade aprovados. A jornada do revisor sem escrita
em scheduling-absence.spec.ts:252 passou com a finalidade restrita, mantendo as negações aos
leitores comuns. Merge sintético do PR bc6ec95 contra dev 748539d. T111 e T112–T116 concluídas
tecnicamente nesta revisão; T110 mantém os gates externos. A publicação documental posterior não
altera o código dessa ponta; seus checks e SHA são registrados no corpo do PR43, sem atribuir
resultado anterior a uma nova versão.

Nenhum serviço/WSL/localhost ou banco de uso iniciado. Não usar os runs verdes b676974/cac5cbb como
prova desta correção. Runs 37061317002/37061310305 falharam antes das asserções restantes de
isolamento, conforme revisão recebida.

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

Subagente CODEX/tests_ui_http revisou cinco capturas do run 37337887070. Artefato GitHub
11358265324, scheduling-synthetic-evidence, 9.825.202 bytes, SHA-256 informado pelo GitHub
54e38b118baa978982af8c67355585fbecab5278b814e2c6d43c7543b7d61965. Amostra legível, sem cortes ou
sobreposições visíveis; comprovante e decisões contidos nos painéis em desktop e celular.

| Captura                           | Dimensões   | SHA-256                                                          |
| --------------------------------- | ----------- | ---------------------------------------------------------------- |
| absence-review-1280-light.png     | 1280 × 1789 | 736b23fdf5ac6424953ff1ce010d182fea0b0820a9cb608e786c0955d54026fb |
| absence-review-1280-dark.png      | 1280 × 1789 | 414a0830afb582412aa8f420619d92ccf3f0948a81074bef0052ef539bae0162 |
| absence-review-390-dark.png       | 390 × 2546  | 003b27b50a76ca525e21ac8a513c918e66c72659609e2a35f800b17988224293 |
| absence-review-320-light.png      | 320 × 2830  | 425317a6219471906f1a5ce94087402a287a406978cebc2f65b17a52a554ff79 |
| scheduling-hours-mobile-light.png | 390 × 2287  | c6e104c7f0ebd02d40947fef3b74756d9eb143b56c7bd89d2338ba14bd69295b |

Manifesto detalhado local: .cache/ci-review-37337887070/visual-review.json na principal. A amostra
de horários não mostra o diretório; seu gate é comprovado por testes, não por essa captura. As
imagens de análise mostram o estado após upload; a jornada real passou no E2E, sem captura de cada
estado intermediário. Limite observado: a ação de indisponibilidade ainda aparece em reserva passada
junto ao aviso de que não permite alterações; o servidor nega o comando. Nenhuma execução dessa ação
é atribuída à inspeção estática. Não houve alteração de layout nesta correção.

INFO preservados: grant bearer por até 300 segundos; sem segregação obrigatória entre
registrar/apresentar/decidir; retenção institucional ainda sem política; Relatórios conserva os
cinco estados existentes no PR; não alteramos essas decisões nesta correção. Testes com rejects
genéricos foram precisados nos cenários tocados e a prova concorrente observou espera real no CI.
Histórico de commits não será reescrito para remover mensagens repetidas. Volume documental decorre
do PR já aberto; corpo novo deve resumir o resultado e distinguir evidência histórica/atual.

Rollout e QA humano permanecem pendentes; nenhum merge autorizado.
