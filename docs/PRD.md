# CAAB — Sistema Interno de Gestão

## 1. Controle do documento

**Produto:** CAAB — Sistema Interno de Gestão  
**Tipo:** Product Requirements Document (PRD)  
**Versão:** 0.1  
**Status:** Rascunho para validação  
**Data:** 04/09/2026  
**Escopo desta versão:** sistema administrativo interno  

O aplicativo e o site externo não serão alterados nesta fase. Eles serão tratados somente como canais consumidores das notícias publicadas pelo sistema interno.

## 2. Resumo executivo

A CAAB precisa modernizar seu sistema interno e consolidar, em uma única plataforma segura, a gestão de notícias, agendamentos, associados, serviços parceiros, colaboradores e logs de alterações.

O sistema deve reduzir cadastros duplicados, operações manuais, conflitos de agenda e alterações sem rastreabilidade. A experiência deve ser moderna, rápida, acessível e adequada ao trabalho administrativo diário.

A solução será construída como um monólito modular: uma aplicação única, com módulos de domínio claramente separados. Notícias poderão ser distribuídas ao aplicativo, ao site externo ou a ambos por contratos de API versionados.

## 3. Problemas a resolver

- Publicação de notícias sem fluxo claro de rascunho, revisão, agendamento e histórico.
- Conteúdo multimídia sem tratamento uniforme para imagens, vídeos e anexos.
- Agendamentos dependentes de dados espalhados entre unidades, serviços e profissionais.
- Risco de horários duplicados ou oferta de profissional indisponível.
- Cadastro de associados sem um fluxo rastreável de bloqueio e verificação da OAB.
- Gestão desconectada de parceiros e colaboradores.
- Ausência ou insuficiência de trilha de auditoria para ações críticas.
- Experiência administrativa inconsistente ou pouco eficiente.

## 4. Objetivos

### 4.1 Objetivos de negócio

- Criar uma fonte única de verdade para a operação interna.
- Reduzir o tempo de publicação e atualização de notícias.
- Impedir conflitos de agendamento.
- Melhorar a confiabilidade do cadastro de associados.
- Centralizar parceiros, colaboradores e unidades.
- Permitir apuração de quem alterou cada informação crítica.
- Preparar integrações seguras com o aplicativo e o site externo.

### 4.2 Objetivos do produto

- Disponibilizar um painel administrativo moderno e responsivo.
- Implementar permissões por função e por ação.
- Oferecer conteúdo rico com imagens, vídeos, links e anexos.
- Relacionar agendas a unidades, serviços, profissões e profissionais.
- Registrar verificações de OAB sem depender de automação não autorizada.
- Manter logs imutáveis das ações críticas.
- Expor APIs documentadas e versionadas para consumidores externos.

## 5. Não objetivos da primeira versão

- Refazer o aplicativo móvel.
- Refazer o site institucional externo.
- Implantar prontuário médico ou sistema clínico completo.
- Substituir folha de pagamento ou sistema de recursos humanos.
- Automatizar consulta à OAB por scraping ou contornar CAPTCHA.
- Criar uma plataforma genérica de reservas para terceiros.
- Criar microserviços para cada módulo.
- Adicionar integrações sem contrato, documentação ou autorização formal.

## 6. Usuários e funções

### 6.1 Administrador

Gerencia usuários, permissões, configurações, cadastros e auditoria. Pode executar ações sensíveis mediante confirmação e justificativa.

### 6.2 Comunicação

Cria, edita, revisa, agenda e publica notícias. Gerencia categorias, mídias e canais de distribuição.

### 6.3 Atendimento

Consulta associados, unidades, serviços e agendas. Cria, remarca e cancela agendamentos conforme permissão.

### 6.4 Coordenação de serviços

Gerencia unidades, serviços, profissões, profissionais, disponibilidade e bloqueios de agenda.

### 6.5 Cadastro de associados

Cria e atualiza associados, registra verificações da OAB e solicita bloqueios ou desbloqueios.

### 6.6 Gestão de parceiros

Mantém serviços parceiros, vigências, documentos, unidades atendidas e situação contratual.

### 6.7 Recursos humanos

Mantém os dados administrativos dos colaboradores. Acesso a dados sensíveis deve ser mínimo e explicitamente autorizado.

### 6.8 Auditor

Possui acesso somente leitura aos logs, históricos, versões e relatórios autorizados.

As funções podem ser acumuladas. O sistema deve conceder permissões concretas, e não acesso amplo apenas pelo nome do cargo.

## 7. Escopo funcional

### 7.1 MVP

- Autenticação e autorização.
- Dashboard por função.
- Gestão de notícias e mídia.
- Publicação imediata ou agendada por canal.
- Cadastros de unidades, serviços, profissões e profissionais.
- Disponibilidade e bloqueios de agenda.
- Criação, remarcação e cancelamento de agendamentos.
- Gestão de associados e registro de verificação da OAB.
- Bloqueio e desbloqueio de associados com justificativa.
- Gestão de parceiros e serviços parceiros.
- Gestão administrativa de colaboradores.
- Logs de alterações e histórico dos registros críticos.
- Pesquisa, filtros, paginação e exportação autorizada.

### 7.2 Pós-MVP

- Sincronização de agendas externas.
- Lembretes por e-mail, SMS ou WhatsApp.
- Integração oficial automatizada com a OAB, se disponibilizada ou contratada.
- Fluxos de aprovação com múltiplos níveis.
- Relatórios analíticos avançados.
- Alterações no aplicativo e no site externo.
- Integração com sistemas de RH, ERP ou atendimento.

## 8. Fluxos principais

### 8.1 Publicação de notícia

1. Usuário autorizado cria um rascunho.
2. Informa título, resumo, conteúdo, categoria, capa e canais.
3. Adiciona imagens, vídeo, links ou anexos permitidos.
4. Visualiza a prévia para cada canal.
5. Salva para revisão ou publica, conforme sua permissão.
6. Na publicação imediata, o conteúdo passa a ser retornado pelas APIs públicas autorizadas.
7. Na publicação agendada, um job durável publica na data definida.
8. Alterações posteriores geram nova versão e registro de auditoria.

### 8.2 Agendamento

1. Usuário seleciona uma unidade ativa.
2. Sistema apresenta somente os serviços oferecidos nessa unidade.
3. Usuário seleciona o serviço.
4. Sistema identifica as profissões e os profissionais habilitados.
5. Sistema considera jornada, intervalos, bloqueios, afastamentos, duração do serviço e compromissos existentes.
6. Usuário escolhe um horário disponível.
7. Servidor revalida a disponibilidade dentro de uma transação.
8. Agendamento é confirmado e registrado no histórico.

### 8.3 Remarcação e cancelamento

1. Usuário abre o agendamento.
2. Informa a ação e o motivo.
3. Para remarcação, o novo horário passa por todas as validações de disponibilidade.
4. O registro anterior é preservado no histórico.
5. O sistema registra responsável, horário e origem da alteração.

### 8.4 Cadastro e verificação de associado

1. Usuário cadastra os dados mínimos necessários.
2. Informa número da OAB e seccional.
3. Sistema procura uma integração oficial configurada.
4. Sem integração oficial, o usuário realiza consulta manual no Cadastro Nacional da OAB.
5. Registra fonte, data, responsável, situação encontrada e observação.
6. O associado recebe situação cadastral interna independente do resultado da verificação.

### 8.5 Bloqueio de associado

1. Usuário autorizado solicita o bloqueio.
2. Sistema exige motivo e, quando aplicável, data de término.
3. Ação é confirmada no servidor.
4. Bloqueio passa a impedir apenas as ações definidas pela política da CAAB.
5. O registro permanece pesquisável e o evento entra na auditoria.

## 9. Requisitos funcionais

### 9.1 Notícias

| ID | Requisito | Prioridade |
|---|---|---|
| NOT-001 | Criar, editar, duplicar e arquivar notícias. | MVP |
| NOT-002 | Manter rascunhos e histórico de versões. | MVP |
| NOT-003 | Suportar texto rico, imagens, vídeos, links e anexos permitidos. | MVP |
| NOT-004 | Definir capa, resumo, categoria, tags, autor e revisor. | MVP |
| NOT-005 | Publicar no aplicativo, site externo ou ambos. | MVP |
| NOT-006 | Agendar publicação e despublicação. | MVP |
| NOT-007 | Exibir prévia antes da publicação. | MVP |
| NOT-008 | Registrar falhas de distribuição e permitir nova tentativa idempotente. | MVP |
| NOT-009 | Permitir aprovação editorial antes da publicação. | Pós-MVP |

### 9.2 Unidades, serviços e profissionais

| ID | Requisito | Prioridade |
|---|---|---|
| CAD-001 | Criar e manter unidades com endereço, contatos e status. | MVP |
| CAD-002 | Criar e manter serviços, duração e regras de atendimento. | MVP |
| CAD-003 | Relacionar serviços às unidades em que são oferecidos. | MVP |
| CAD-004 | Criar e manter profissões. | MVP |
| CAD-005 | Criar e manter profissionais e suas profissões. | MVP |
| CAD-006 | Relacionar profissional a unidades e serviços habilitados. | MVP |
| CAD-007 | Impedir novos agendamentos com registros inativos. | MVP |

### 9.3 Agenda e disponibilidade

| ID | Requisito | Prioridade |
|---|---|---|
| AGE-001 | Configurar jornada recorrente por profissional e unidade. | MVP |
| AGE-002 | Configurar intervalos, bloqueios e indisponibilidades. | MVP |
| AGE-003 | Calcular horários usando a duração do serviço. | MVP |
| AGE-004 | Impedir sobreposição de agendamentos confirmados. | MVP |
| AGE-005 | Criar, confirmar, concluir, cancelar e remarcar agendamentos. | MVP |
| AGE-006 | Registrar motivo de cancelamento e remarcação. | MVP |
| AGE-007 | Visualizar agenda por dia, semana, mês, unidade e profissional. | MVP |
| AGE-008 | Manter histórico das transições. | MVP |
| AGE-009 | Integrar calendários externos. | Pós-MVP |

Status padrão: `Pendente`, `Confirmado`, `Em atendimento`, `Concluído`, `Não compareceu` e `Cancelado`.

Transições não previstas devem ser recusadas pelo servidor. Um agendamento cancelado ou concluído é terminal; correções administrativas exigem permissão especial e justificativa.

### 9.4 Associados

| ID | Requisito | Prioridade |
|---|---|---|
| ASS-001 | Criar, visualizar e atualizar associados. | MVP |
| ASS-002 | Pesquisar por nome, documento autorizado, OAB e seccional. | MVP |
| ASS-003 | Ativar, bloquear e desbloquear com justificativa. | MVP |
| ASS-004 | Registrar situação, fonte e data da verificação da OAB. | MVP |
| ASS-005 | Manter histórico cadastral e de bloqueios. | MVP |
| ASS-006 | Evitar duplicidade por identificadores definidos. | MVP |
| ASS-007 | Automatizar consulta somente por integração oficial autorizada. | Pós-MVP |

### 9.5 Parceiros

| ID | Requisito | Prioridade |
|---|---|---|
| PAR-001 | Cadastrar parceiro, contatos, categoria e status. | MVP |
| PAR-002 | Cadastrar serviços, benefícios e condições oferecidas. | MVP |
| PAR-003 | Relacionar parceiro a unidades e regiões atendidas. | MVP |
| PAR-004 | Controlar vigência e documentos administrativos. | MVP |
| PAR-005 | Publicar dados selecionados para os canais externos. | Pós-MVP |

### 9.6 Colaboradores

| ID | Requisito | Prioridade |
|---|---|---|
| COL-001 | Cadastrar colaborador e situação funcional administrativa. | MVP |
| COL-002 | Relacionar colaborador a unidade, setor e função. | MVP |
| COL-003 | Separar colaborador de conta de acesso ao sistema. | MVP |
| COL-004 | Restringir campos sensíveis por permissão. | MVP |
| COL-005 | Integrar com sistema oficial de RH. | Pós-MVP |

### 9.7 Usuários e permissões

| ID | Requisito | Prioridade |
|---|---|---|
| SEG-001 | Autenticar usuários e permitir desativação imediata. | MVP |
| SEG-002 | Aplicar autorização no servidor em todas as ações. | MVP |
| SEG-003 | Permitir múltiplas funções por usuário. | MVP |
| SEG-004 | Exigir MFA de administradores. | MVP |
| SEG-005 | Testar automaticamente a matriz de permissões. | MVP |
| SEG-006 | Solicitar confirmação para ações destrutivas ou sensíveis. | MVP |

### 9.8 Auditoria

| ID | Requisito | Prioridade |
|---|---|---|
| AUD-001 | Registrar ator, ação, entidade, registro e horário. | MVP |
| AUD-002 | Registrar valores anteriores e posteriores quando permitido. | MVP |
| AUD-003 | Registrar origem e identificador da requisição. | MVP |
| AUD-004 | Impedir edição de eventos de auditoria pela aplicação. | MVP |
| AUD-005 | Permitir busca por período, usuário, ação e entidade. | MVP |
| AUD-006 | Proteger segredos e dados excessivos contra gravação em logs. | MVP |
| AUD-007 | Exportar logs somente para usuários autorizados. | MVP |

## 10. Modelo conceitual de dados

### 10.1 Conteúdo

- **Notícia:** título, slug, resumo, conteúdo estruturado, capa, categoria, tags, autor, revisor, status, canais, publicação e expiração.
- **Mídia:** tipo, localização, nome original, nome seguro, MIME detectado, tamanho, dimensões, checksum, estado de verificação e texto alternativo.
- **Versão da notícia:** notícia, conteúdo completo, autor da mudança, data e estado editorial.
- **Distribuição:** notícia, canal, versão, status, tentativas, última resposta e data.

### 10.2 Agenda

- **Unidade:** identificação, endereço, contatos, timezone e status.
- **Serviço:** nome, descrição, duração, antecedência, tolerância e status.
- **Profissão:** nome, registro profissional aplicável e status.
- **Profissional:** identificação, profissão, situação e dados administrativos permitidos.
- **Oferta de serviço:** unidade, serviço, profissão e regras específicas.
- **Vínculo profissional:** profissional, unidade, serviços habilitados e vigência.
- **Disponibilidade:** profissional, unidade, regra semanal e validade.
- **Bloqueio de agenda:** profissional/unidade, início, fim, motivo e origem.
- **Agendamento:** associado, unidade, serviço, profissional, início, fim, status e observações.
- **Evento do agendamento:** status anterior, novo status, ator, data e motivo.

### 10.3 Cadastros

- **Associado:** identificadores, contatos mínimos, OAB, seccional e situação interna.
- **Verificação OAB:** associado, fonte, método, situação retornada, responsável e data.
- **Bloqueio do associado:** tipo, motivo, início, fim, responsável e situação.
- **Parceiro:** dados institucionais, categoria, contatos, vigência e status.
- **Serviço parceiro:** parceiro, descrição, condições, abrangência e status.
- **Colaborador:** dados administrativos, unidade, setor, função e status.
- **Usuário:** identidade de autenticação, colaborador opcional, funções e status.
- **Evento de auditoria:** registro imutável da ação e seu contexto.

### 10.4 Convenções

- Identificadores UUID.
- Datas persistidas em UTC e exibidas em `America/Bahia`.
- Exclusão lógica para entidades auditáveis.
- Valores sensíveis criptografados quando necessário.
- Arquivos no object storage; apenas metadados no PostgreSQL.
- Estados controlados por enums ou máquinas de estado explícitas.

## 11. Telas necessárias

### 11.1 Autenticação

- Login.
- Recuperação de acesso.
- Segundo fator para funções exigidas.
- Sessões ativas e encerramento remoto para administradores.

### 11.2 Dashboard

- Notícias em rascunho, agendadas e com falha.
- Agendamentos do dia, cancelamentos e não comparecimentos.
- Profissionais indisponíveis.
- Associados aguardando verificação.
- Pendências de parceiros.
- Atividades recentes autorizadas.

### 11.3 Notícias

- Lista com busca, filtros e status.
- Editor rico.
- Biblioteca de mídia.
- Prévia por canal.
- Agendamento de publicação.
- Histórico de versões e distribuição.

### 11.4 Agenda

- Calendário diário, semanal e mensal.
- Filtros por unidade, serviço e profissional.
- Criação rápida.
- Detalhe, histórico, remarcação e cancelamento.
- Configuração de disponibilidade e bloqueios.

### 11.5 Associados

- Lista e detalhe.
- Cadastro e edição.
- Verificação OAB.
- Bloqueio e desbloqueio.
- Histórico.

### 11.6 Parceiros e colaboradores

- Listas pesquisáveis.
- Formulários por permissão.
- Vigências, status e histórico.

### 11.7 Auditoria

- Filtros avançados.
- Visualização do antes e depois.
- Identificação de ação, ator e origem.
- Exportação controlada.

## 12. Requisitos de experiência

- Interface pt-BR.
- Design desktop-first, responsivo para tablets.
- Navegação lateral recolhível e busca global.
- Ações frequentes disponíveis com poucos cliques.
- Tabelas densas, legíveis e com filtros persistentes.
- Feedback explícito de carregamento, sucesso e erro.
- Contraste, foco e navegação por teclado compatíveis com WCAG 2.2 AA.
- Ícones Lucide React com rótulo textual ou nome acessível.
- Nunca depender apenas de cor ou ícone para comunicar estado.
- Design tokens próprios da CAAB; evitar aparência de template genérico.

## 13. Segurança e privacidade

- OWASP ASVS nível 2 como baseline verificável.
- Autorização server-side e menor privilégio.
- MFA para administradores e funções sensíveis definidas pela CAAB.
- Proteção contra CSRF, XSS, injeção, IDOR e força bruta.
- Sanitização do conteúdo rico no armazenamento e/ou renderização.
- Lista permitida de provedores e formatos para embeds.
- Upload validado por extensão, MIME real, assinatura, tamanho e antivírus.
- Nomes de arquivo gerados pelo sistema.
- URLs assinadas para arquivos privados.
- Segredos fora do código e rotação documentada.
- Criptografia em trânsito e proteção adequada em repouso.
- Política de retenção, anonimização e descarte compatível com LGPD.
- Logs sem senhas, tokens, documentos completos ou dados pessoais desnecessários.

## 14. Requisitos não funcionais

### 14.1 Desempenho

- Telas comuns devem responder em até 2 segundos no percentil 95, descontadas integrações externas.
- Buscas e filtros devem usar paginação server-side.
- Operações demoradas devem ir para filas e informar progresso.

### 14.2 Disponibilidade e recuperação

- Backups diários do banco e política para arquivos.
- Backups fora do servidor principal.
- Teste periódico de restauração.
- Health checks para aplicação, banco, storage e worker.

### 14.3 Observabilidade

- Logs estruturados com identificador de requisição.
- Métricas de erros, latência, filas e falhas de integração.
- Alertas para indisponibilidade, falha de backup e jobs esgotados.

### 14.4 Compatibilidade

- Suporte às duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari.
- APIs externas versionadas e compatíveis durante migrações planejadas.

## 15. Indicadores de sucesso

- Tempo médio para publicar uma notícia.
- Percentual de publicações distribuídas sem erro.
- Taxa de conflitos de agenda impedidos.
- Percentual de agendamentos concluídos, cancelados e não comparecidos.
- Tempo médio para registrar/verificar associado.
- Percentual de ações críticas com auditoria completa.
- Erros de autorização detectados em produção.
- Adoção diária do sistema por função.

## 16. Plano de entrega

### Fase 1 — Fundação

- Autenticação, usuários, funções e permissões.
- Design system e layout administrativo.
- Banco, auditoria, storage, worker e observabilidade.

### Fase 2 — Notícias

- CMS, editor, mídia, versões, prévia e agendamento.
- Contratos de distribuição para app e site sem alterá-los.

### Fase 3 — Cadastros e agenda

- Unidades, serviços, profissões e profissionais.
- Disponibilidade, bloqueios e agendamentos.

### Fase 4 — Associados

- Cadastro, consulta, verificação registrada, bloqueio e histórico.

### Fase 5 — Parceiros, colaboradores e hardening

- Módulos restantes, relatórios, testes de segurança e homologação.

## 17. Critérios de aceite do MVP

- Usuários acessam apenas módulos e ações autorizados.
- Uma notícia pode ser criada, revisada, agendada, publicada e restaurada.
- Imagens, vídeos e anexos passam pelas validações de segurança.
- App e site conseguem consumir somente notícias publicadas destinadas a eles.
- O sistema mostra apenas horários realmente disponíveis.
- Dois usuários concorrentes não conseguem reservar o mesmo profissional e horário.
- Agendamentos mantêm histórico de remarcações e cancelamentos.
- Associados podem ser cadastrados, verificados, bloqueados e desbloqueados com histórico.
- Parceiros e colaboradores podem ser administrados por usuários autorizados.
- Toda ação crítica aparece na auditoria.
- Lint, typecheck, testes e build passam no CI.

## 18. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| API atual do app/site desconhecida | Inventariar contratos antes de alterar publicação. |
| Integração oficial da OAB indisponível | Fluxo manual rastreável; não usar scraping. |
| Regras de agenda incompletas | Workshops com atendimento e coordenação antes da Fase 3. |
| Dados pessoais excessivos | Inventário LGPD e minimização por campo. |
| Upload malicioso | Validação em camadas, storage isolado e antivírus. |
| Permissões se tornarem inconsistentes | Matriz central e testes automatizados de autorização. |
| Dependência excessiva do CMS | Limitar Payload ao conteúdo e cadastros adequados; regras críticas ficam no domínio. |
| Cal.com duplicar a fonte de verdade | Não adotá-lo como núcleo nesta fase; avaliar integração posterior. |

## 19. Entradas necessárias antes da construção

| # | Informação | Fonte | Bloqueia |
|---|---|---|---|
| 1 | Código e arquitetura do sistema interno atual | Tecnologia | Fundação |
| 2 | Contratos/API atuais usados pelo app e site | Tecnologia | Notícias |
| 3 | Perfis reais e matriz de permissões | Gestores | Fundação |
| 4 | Fluxo editorial e responsáveis por aprovação | Comunicação | Notícias |
| 5 | Formatos, limites e provedores de vídeo permitidos | Comunicação/TI | Notícias |
| 6 | Lista de unidades, serviços, durações e regras | Operação | Agenda |
| 7 | Jornada, bloqueios e vínculo dos profissionais | Operação | Agenda |
| 8 | Políticas de cancelamento, atraso e não comparecimento | Operação | Agenda |
| 9 | Campos mínimos e regras de bloqueio de associados | Cadastro/Jurídico | Associados |
| 10 | Canal oficial para integração com CNA/OAB | OAB/TI/Jurídico | Automação OAB |
| 11 | Política de retenção e classificação de dados | Jurídico/DPO | Produção |
| 12 | Infraestrutura e requisitos de disponibilidade | TI | Produção |

## 20. Decisões iniciais

- O trabalho inicial limita-se ao sistema interno.
- TypeScript será a linguagem principal, condicionado à compatibilidade com o legado.
- Lucide React será a biblioteca padrão de ícones.
- Payload CMS e Lexical são a escolha inicial para notícias.
- PostgreSQL será a fonte de verdade dos domínios operacionais.
- Agendamentos serão domínio próprio; Cal.com permanece como opção de integração futura.
- Consulta à OAB será manual até existir integração oficial autorizada.
- O sistema será um monólito modular com worker, não um conjunto prematuro de microserviços.

