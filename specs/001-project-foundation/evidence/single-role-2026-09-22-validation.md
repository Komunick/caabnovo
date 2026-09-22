# Validação de cargo único — 22/09/2026

Código e testes: `97633237689af2f583707498b24ff71e7564ed96`.
[CI 35743401759](https://github.com/Komunick/caabnovo/actions/runs/35743401759): quality, browser e
security aprovados. Documentação de fechamento não altera o código validado.

## Resultados

| Gate                            | Resultado                                                      |
| ------------------------------- | -------------------------------------------------------------- |
| Formatação, lint, tipos e build | Aprovados                                                      |
| Unitários                       | 387 aprovados                                                  |
| Contratos                       | 168 aprovados                                                  |
| Integração                      | 242 aprovados                                                  |
| E2E Chromium                    | 95 aprovados                                                   |
| Acessibilidade                  | 6 aprovados, além das verificações nos fluxos de Colaboradores |
| Segurança                       | Aprovada                                                       |

A migration foi aplicada em banco descartável com vínculos duplicados anteriores. Confirmados:
Administrador > Gestor > Colaborador entre os cargos vigentes, cargo expirado sem substituir o
atual, linhas e dados originais de concessão preservados, `user_access` integralmente inalterado,
permissões efetivas preservadas nos cenários cobertos e auditoria de revogação pelo sistema.
Intervalos consecutivos são aceitos; sobreposição é rejeitada pelo PostgreSQL. O runner pode ser
executado novamente sem reaplicar migrations. Duas concessões concorrentes produzem um sucesso e um
conflito; revogar e conceder outro mantém a trilha de auditoria. Guardas existentes, incluindo o
último Administrador, continuam cobertas.

`users.test.ts` rejeita criação com dois cargos. `user-administration.spec.ts` verifica seleção
única, descrição acessível, preservação do rascunho após navegar, criação com um cargo, ausência de
concessão adicional, conflito real da API, revogação e nova concessão. `settings-errors.spec.ts`
confere a mensagem de conflito. Cargos legados usam sua descrição cadastrada.

## Revisão visual

Artefato `initial-password-synthetic-evidence` na execução acima: `collaborator-fields-desktop.png`,
`collaborator-fields-mobile.png`, `collaborator-role-assigned.png` e
`collaborator-actions-dark-{1280,390}.png`. Revisados cadastro e detalhe, descrições abaixo dos
nomes, seleção única, quebra de texto no celular e contraste nos temas existentes. Os dados das
imagens são sintéticos. O artefato segue a retenção técnica configurada no CI.

## Ambiente e implantação

Local: lint dos arquivos alterados, formatação documental e tipos web aprovados. A suíte local teve
554 testes aprovados e uma falha do ambiente Windows (`uv_os_get_passwd ENOMEM`); repetição isolada
do worker fora da restrição: 14/14 aprovados. O CI completo passou em ambiente limpo. Localhost e
Docker não foram ligados; nenhum dado local foi regularizado durante o desenvolvimento.

Aplicar 0030 antes da aplicação. A migration bloqueia gravações em `user_role` durante a
regularização/constraint. Em rollback da aplicação, manter a coluna de origem, a constraint,
revogações auditadas e acessos individuais. Não apagar histórico nem restaurar vínculos simultâneos.
Revisão humana de permissões/migration continua necessária para integração; checks não são
aprovação.

## Complemento: Promover ao lado de Revogar — 22/09/2026

[CI35747105170](https://github.com/Komunick/caabnovo/actions/runs/35747105170), em1a4e0d0: quality e
security aprovados,387 unitários,169 contratos,247 integração, build/lint/tipos/formatação.
[CI35746642120](https://github.com/Komunick/caabnovo/actions/runs/35746642120), eme46e12a: browser
aprovado,95 E2E e6 a11y. Aplicação e E2E são idênticos; entre os commits mudou apenas a preparação
da conta desativada no teste de integração, acrescentando deactivated_at exigido pela constraint. A
falha inicial dessa fixture foi corrigida; o teste passou na execução seguinte.

Cobertura acrescentada: promoção sequencial Colaborador→Gestor→Administrador, recusa no topo e para
cargo legado sem hierarquia, sessão revogada, Gestor sem autoridade, conta inativa, cargo expirado e
sucessor indisponível. Duas requisições concorrentes não saltam dois níveis. Falha na segunda
auditoria reverte concessão, revogação e primeiro evento de segurança/auditoria. Acesso individual,
término da validade e histórico de vínculos são preservados.

Na interface, cancelar mantém o cargo; confirmar promove e atualiza a descrição. Cargo único
permanece, e Promover desaparece ao chegar a Administrador. Posição lado a lado e botão secundário
verificados automaticamente em1280/390px, além de a11y. Capturas `collaborator-promotion-1280.png` e
`collaborator-promotion-390.png`, no artefato `initial-password-synthetic-evidence` do
CI35746642120, revisadas visualmente: texto legível, mesma linha de ações e quebra adequada no
celular.

Sem migration adicional nem execução no banco local. PR39 reaberto após novo pedido explícito; não
houve aprovação ou merge. O fechamento após os testes altera somente documentação.
