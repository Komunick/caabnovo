# Avaliação dos pareceres de fechamento — 02/10/2026

Autoria: CODEX; solicitante não verificado nesta sessão (consulta GitHub HTTP401). Pedido: analisar
as instâncias que concluíram. Foram encontrados três pareceres completos, com versões, achados,
limites e repasses no agentcache. A coordenação conferiu suas conclusões centrais no Git imutável,
observou os deltas concorrentes e consultou PRs/Jira; não alterou a implementação ou executou
testes, serviços, reviews externos ou merge.

## Decisão de integração atualizada

**PR43 deve aguardar correção e validação de S01/S02 antes de merge.** O HEAD publicado continua
b676974a3514f87fcdfbdc943d74e9a013e5dbac; CI aprovado dessa versão não cobre os cenários novos. A
instância dona já está editando código e preparando regressões reais localmente. Alterações sem
commit não são correção publicada/aprovada. Não interferir na worktree que ela está editando.

**PR42 permanece independente e pode seguir para análise/merge humano documental.** Continua aberto
em4b4a79b46dd5e274cc1730e04e3138c08216291a, sem mudança funcional. A ordem recomendada continua42
antes de43; concluir42 libera a conciliação de Acessos e da documentação de Agendamentos.

## Resultados por parecer

| Parecer                    | Conclusão conferida                                                                                                                              | Consequência                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentação/rollout       | Nenhum defeito bloqueante identificado nas migrations lidas; runner confirma cada arquivo, não o lote inteiro; diagnóstico0031 recusa conflitos. | Preparar diagnóstico, versões, backup/recuperação e controle de escritores no destino. Se merge implantar DEV automaticamente, resolver esses gates antes desse merge. Não foi verificada a configuração do ambiente remoto. |
| Acessos/segurança          | S01 e S02 consistentes com o código de b676974; conferência estática, sem reprodução nova.                                                       | Bloqueiam a recomendação de merge de43 até correção, regressões reais e revisão da nova ponta.                                                                                                                               |
| Relatórios/compatibilidade | Não identificada regressão bloqueante do PR43 no recorte lido. Preservar registry, hooks, bookings e helpers na futura combinação.               | Não bloquear43 pelo futuro PR de Relatórios; c8a2614 continua exigindo T041/T042 na base combinada, além dos demais gates próprios.                                                                                          |

### S01 — fronteira dos comprovantes

No SHA publicado, absence-evidence-upload.tsx registra ownerType member. memberFiles lista todos os
arquivos desse associado, memberFileStatus retorna metadados e memberDownload emite link com
members:read + files:read. A rota genérica encaminha ao mesmo serviço, sem exigir
scheduling:review_absences ou distinguir finalidade restrita. Confirma a fronteira alternativa
descrita no parecer. Não foi constatado incidente ou acesso indevido real nesta análise.

Aceite mínimo da correção: isolamento desde upload, antes do protocolo; negação de descoberta,
status e download alternativos ao leitor sem revisão; manutenção do revisor dedicado, do autor
autorizado e dos documentos comuns. Conferir também arquivos já vinculados pelo caminho anterior.

### S02 — segunda espera depois da autorização

schedulingAccess revalida sessão/permissões após o advisory lock. O callback de emissão depois
aguarda FOR SHARE OF f e assina o download sem outra verificação. Expiração natural pode ocorrer
nesse intervalo. O caminho de submissão também espera arquivos depois da verificação de prazo.
Confirmado pela ordem das operações; o teste PostgreSQL do cenário ainda precisa passar.

Aceite mínimo: revalidar autoridade após a espera do arquivo e antes do efeito protegido, além do
prazo de submissão quando pertinente; duas conexões reais para expiração de sessão/concessão,
negação esperada sem grant/escrita indevida e preservação do caminho válido.

### Limites separados

L01–L03 são lacunas de cobertura, não outros defeitos demonstrados. D01 descreve URL bearer válida
por300 segundos e ausência de reautorização de conteúdo para arquivos de membro: distinguir a
política de links já emitidos de nova emissão após expiração e registrar o contrato vigente antes de
alegar revogação imediata. Não inventar decisão de produto nesta análise. D02 pede precisão da
exceção PUT/versão no texto de idempotência. R07 e a nota de compatibilidade pedem atualizar trechos
documentais superados; não reabrir testes aprovados por causa de narrativa histórica.

## Execução observada e Jira

A worktree de Agendamentos já contém alterações locais em arquivos, Associados, serviços de
faltas/acesso/upload, contrato de arquivos e testes de integração. A direção observada inclui
owner_type específico, proteção dos caminhos gerais e rechecagem após lock. A implementação está em
andamento e não recebeu aprovação desta coordenação. As outras três worktrees permanecem limpas nos
SHAs relatados; Acessos e Relatórios preservam seus commits locais não publicados.

A instância dona já acrescentou comentários10121/10122 e moveu Separar consulta e alteração em
Agendamentos (CAAB-28) e Tratar faltas, justificativas e contestações (CAAB-41) para Em
Desenvolvimento. Estados e comentários relidos pela coordenação. Os defeitos têm cobertura nos
tickets funcionais existentes; nenhuma duplicata foi criada. Agendamentos (CAAB-37) continua em
Desenvolvimento. Na releitura final, a dona já atualizou seu bloco no agentcache: correções locais,
regressões preparadas ainda não executadas e próximo passo de publicação/CI explicitados.

## Próximo passo

1. Dona de Agendamentos conclui S01/S02 e consolida os três pareceres na spec008, com autoria/SHA.
2. Publica nova ponta do mesmo PR43 e executa regressões pertinentes e gates da versão alterada.
3. Instância de Acessos revisa o delta de segurança e as provas dos cenários, preservando distinção
   entre correção técnica e QA humano. Registrar limites/D01 sem dar aceite irrestrito.
4. Após42, conferir composição documental/checks; revisar rollout antes da implantação. Só então
   retomar recomendação de merge de43 e homologação humana em DEV no SHA implantado.
5. Relatórios retoma a própria combinação depois de43; seu aceite não é pré-requisito invertido.

## Fontes conferidas

Pareceres na principal: .cache/coordination/scheduling-closeout-20261002/. Autoria original
preservada nos arquivos e caderno. SHA-256 dos bytes observados:

- rollout-documentacao.md:447ffa6e0d29b4691feab0e59a5f15fe01c8f6b0b11beaa7c95bc61d7d6b64aa.
- acessos-seguranca.md:22ce649b5b3cd3cc963a23e81a8997e127f90a1d61a2a4cf2a3b570e3162c651.
- relatorios-compatibilidade.md:4e7d2a38c050ef5f4914018e393378ef1d20fb864a15a4cd03bc6e1e47739801.

Os pareceres são válidos para os SHAs indicados. Nova ponta exige conferência do delta afetado;
nenhuma conclusão deste snapshot congela o trabalho concorrente da instância dona.
