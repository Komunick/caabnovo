# Decisões institucionais pendentes

## Complemento P02 — bloqueio por falta em Agendamentos, 28/09/2026

Decisão registrada por CODEX, solicitante mafaltti (Danilo-Komunick), verificado nesta sessão: a
equipe registra a falta; os 30 dias corridos começam nesse registro e atingem somente a pessoa que
faltou, inclusive dependente, em todos os serviços de Agendamentos. Há sete dias corridos desde o
registro para justificar/contestar, com reservas preservadas nesse prazo e durante análise de pedido
tempestivo. Novas reservas ficam impedidas. Sem pedido no prazo, efetivar bloqueio e cancelar
reservas abrangidas, preservando histórico. Ações OK/Justificar falta/Contestar falta, acesso
posterior no app/site e e-mails no aviso, envio do pedido e decisão integram o requisito. Fonte
canônica: [BF-FR-01–06 e BF-D01–05](../008-scheduling-management/spec.md).

P02 de 10/09 abaixo descreve bloqueio cadastral/administrativo manual. A nova restrição por falta
tem causa e regras próprias; “Sem prazo automático de 30 dias” e propagação familiar não se aplicam
à nova política. Aceitação retira este impedimento. Cada falta tem período próprio de 30 dias e sete
dias para justificar/contestar separadamente, sem soma automática de prazos. Aceitação/expiração
retira somente a respectiva restrição. Ao completar os 30 dias encerrar esta restrição mesmo com
análise pendente, liberando novas reservas somente sem outros impedimentos vigentes; a decisão
posterior altera o histórico, sem prolongar esta restrição. Os detalhes restantes estão nas decisões
abertas da spec. Ainda não há aplicação automática da nova regra nem alteração de dados reais.

10/09/2026. Preservadas do inventário de pendências do projeto. Estes itens não impedem validar o
incremento administrativo com regras e dados sintéticos, mas não autorizam regras reais implícitas.

| ID  | Definição necessária                                                                                                                                                                                                           | Limite do incremento                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P01 | Parcialmente definida pelo usuário em 21/09/2026: vínculos, documentos e limite de até 25 anos para filhos/enteados confirmados na matriz abaixo. Só a pergunta 4, alterações que exigem nova análise, permanece sem resposta. | Planejar e implementar a matriz em POL02; POL01 mantém a definição de reanálise pendente. Preservar análise manual, validações, dados e permissões; nenhuma aplicação automática realizada nesta decisão.                                                                                                                                                                                                                                                                |
| P02 | Fontes e regras de elegibilidade por finalidade, vigência e recurso de bloqueios.                                                                                                                                              | Dimensões independentes com fonte e responsável explícitos, sem exigir motivo; cadastro/OAB não concedem créditos.                                                                                                                                                                                                                                                                                                                                                       |
| P03 | Emissor, campos, identidade visual, prazo, revogação e público de validação da credencial.                                                                                                                                     | Apenas situação e validade registradas; nenhum cartão ou QR autenticável emitido.                                                                                                                                                                                                                                                                                                                                                                                        |
| P04 | Validar configuração vigente e semântica da integração OAB-BA/Implanta localizada no legado; confirmar as regras de uso da fonte financeira institucional.                                                                     | Consulta integrada implementada; ativação local anterior é histórica. Localhost permanece desligado desde a decisão de 17/09/2026. Teste anterior não autorizado foi descartado; não conservar nem reutilizar seus dados. A tentativa autorizada de 16/09 em DEV retornou OAB_NOT_CONFIGURED, sem homologação positiva. Homologação com dados autorizados continua pendente (T028/LEG-001). Regularidade OAB, situação interna, finanças e créditos continuam separados. |
| D02 | Comprovação de identidade e vínculo entre conta externa, associado e dependente.                                                                                                                                               | Nenhuma lista pública, criação de login ou conta mobile nesta entrega.                                                                                                                                                                                                                                                                                                                                                                                                   |

Registrar cada resposta com responsável, data, evidência, versão/vigência e cenários de aceite
afetados antes de implementar a extensão dependente.

Acesso administrativo inicial foi resolvido pelo usuário em 10/09/2026: `members:read/write/review`
somente para o administrador existente. Outros perfis precisam de concessão explícita.

Parte administrativa de P02 confirmada pelo usuário em 10/09/2026: bloqueio com desbloqueio manual;
registrar impedimento de agendamentos do associado e dos dependentes para futura integração com
Agenda. Sem prazo automático de 30 dias. Cadastro/documentos permanecem disponíveis para
regularização. Regras financeiras e de outros benefícios permanecem pendentes.

## P01 — documentos e dependentes confirmados em 21/09/2026

Fonte: respostas explícitas do usuário às perguntas 1–3; pergunta 4 adiada. Substitui o adiamento
integral anterior de Q11 apenas nos pontos respondidos.

| Pessoa / vínculo                    | Documentos exigidos                                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Titular                             | Carteira da OAB.                                                                                                        |
| Cônjuge                             | Identidade e comprovante de casamento **ou** união estável.                                                             |
| Filho menor de idade                | Identidade.                                                                                                             |
| Filho maior de idade, até 25 anos   | Identidade e comprovante de matrícula em instituição de ensino superior.                                                |
| Enteado menor de idade              | Identidade e comprovante de casamento **ou** união estável.                                                             |
| Enteado maior de idade, até 25 anos | Identidade, comprovante de casamento **ou** união estável e comprovante de matrícula em instituição de ensino superior. |

**Limite de idade confirmado:** filhos e enteados podem ser dependentes até 25 anos. Os vínculos
confirmados são cônjuge (casamento ou união estável), filho e enteado. O limite não foi estendido ao
cônjuge. “Identidade” e “comprovante” mantêm o sentido informado pelo usuário; não foram
acrescentados tipos específicos, prazos de validade, periodicidade de renovação, autenticações ou
documentos adicionais.

**Ainda pendente:** quais alterações cadastrais/documentais exigem nova análise (pergunta 4, mantida
sem resposta). A definição de retenção Q10 e a identidade externa D02 continuam separadas. Análise
manual preservada; não presumir aprovação automática, exclusão de vínculos existentes, bloqueio
etário automático ou cancelamento de reservas. Esta decisão registra requisitos; não implementa sua
exigência no sistema.
