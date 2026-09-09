# Direção de produto CAAB / CAApp — análise do laudo

Data da análise e pesquisa: **09/09/2026**.

**Atualização posterior do responsável em 09/09/2026:** incluir todos os módulos no escopo
integrado, comparar com a fundação para evitar duplicatas e fundir Operações com Auditoria. A
recomendação sequencial e os adiamentos abaixo ficam preservados como histórico da análise,
substituídos pelo [mapa vigente](MODULES.md) e pelo
[plano integrado](../specs/002-integrated-modules/plan.md).

Fonte funcional:
`C:/Projetos/New-CAAB/analise/laudo-painel-administrativo-contexto-codex-2026-09-09.md`. Estado:
proposta para orientar as próximas funcionalidades; não é aprovação de regras institucionais.
Contexto do projeto novo: documentação em `docs/PRD.md`, `docs/STACK.md` e tarefas da fundação, com
`dev` integrada até `284f867`. Nenhum código, painel, imagem ou vídeo do sistema antigo foi
consultado.

## 1. Diagnóstico e instruções que passam a orientar o trabalho

O laudo é um inventário de problemas possíveis, não um contrato de paridade. A presença de uma
função no histórico não prova que ela funcionava, que ainda é necessária ou que pertence ao MVP.

Para cada módulo, a especificação deve distinguir função histórica, necessidade atual, proposta de
solução e decisão institucional pendente. A pesquisa fundamenta escolhas de experiência e
engenharia; não define quem tem direito a atendimento, benefícios ou créditos.

Não consultar o código nem a experiência visual do legado, incluindo refações anteriores. Não
extrair contratos de integrações dessas fontes. Usar contratos novos ou documentação vigente
formalmente fornecida. A fundação deste repositório é contexto de execução atual, não um modelo
obrigatório para as jornadas futuras. Não há motivo demonstrado nesta análise para substituí-la.

A liberdade para desenhar o ecossistema inclui considerar o aplicativo e a operação dos parceiros.
Isso não autoriza alterar aplicativos em produção, contratar fornecedores, migrar dados ou
implementar todas as possibilidades do inventário.

### Conflitos encontrados na documentação atual

| Documento / trecho      | Problema                                                                                                              | Direção para a próxima revisão                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| PRD §19, entrada 1      | Pede código e arquitetura do sistema antigo como pré-requisito da fundação.                                           | Remover essa dependência; a nova orientação proíbe consultá-los.                                                                          |
| PRD §20, linguagem      | Condiciona TypeScript à compatibilidade com o legado.                                                                 | Usar decisões atuais do projeto novo, sem obrigação de compatibilidade extraída do legado.                                                |
| PRD §1, §5 e STACK §1   | Limitam a primeira implementação ao administrativo e notícias para app/site.                                          | Manter como limite da implementação inicial; ampliar o desenho do ecossistema como proposta, sem presumir autorização para refazer o app. |
| PRD §7–§10 e §16        | Dependentes, fila documental, credencial e elegibilidade estão pouco detalhados; Caassh e portal têm lacunas maiores. | Reclassificar o escopo por necessidades, dependências e regras confirmadas.                                                               |
| PRD §8.1, NOT-009 e §17 | Revisão editorial aparece no fluxo e no aceite, mas aprovação é marcada pós-MVP.                                      | Distinguir revisão de conteúdo de aprovação obrigatória por outra pessoa; fechar essa política antes do módulo.                           |
| PRD §8.2                | Impõe unidade → serviço → profissional como sequência única.                                                          | Propor busca por serviço e próxima vaga, com unidade/profissional opcionais quando a operação permitir.                                   |
| PRD §18–§19, contratos  | “Inventariar contratos” pode ser entendido como investigação no sistema antigo.                                       | Pedir documentação formal vigente ou desenhar contrato novo; não investigar o legado.                                                     |
| PRD §10.4               | Exclusão lógica geral não resolve o descarte de dados pessoais.                                                       | Separar arquivamento operacional de retenção e descarte aprovados na T089.                                                                |

Esta análise registra os ajustes; não reescreve silenciosamente o PRD inteiro nem transforma
hipóteses em requisitos aprovados. Documentação, implementação e testes entrarão juntos no PR da
funcionalidade correspondente. Não abrir PR preliminar ou separado apenas para esta análise.

## 2. Pesquisa atual: referências, aprendizados e limites

Pesquisa documental em páginas oficiais públicas. Não houve login, teste de tarefas, medição de
cliques ou avaliação por usuários nos produtos citados. Portanto, usabilidade real, acessibilidade,
comportamento responsivo e desempenho dessas soluções não estão homologados aqui. Recursos
documentados não são prova de eficiência. Custos não foram cotados; dependências de plano
explicitamente documentadas são registradas quando relevantes. Não há recomendação de contratação.

| Problema / referência oficial                                                                                                                                                                                  | Evidência encontrada e limite                                                                                                                                                                                                                                                                                                                                                            | Aplicação proposta à CAAB e esforço                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associados — [WildApricot](https://www.wildapricot.com/features/membership-management-software)                                                                                                                | A página comercial indexada anuncia gestão de membros e políticas de renovação. A abertura direta falhou; não foi possível confirmar a jornada nem tratá-la como experiência observada.                                                                                                                                                                                                  | Usar apenas como referência secundária de ciclo de vínculo. A CAAB exige regras próprias de dependência e elegibilidade; não importar um modelo de assinatura.                                                                                           |
| CRM — [HubSpot: acesso a registros](https://knowledge.hubspot.com/records/assign-access-to-records)                                                                                                            | Documenta acesso por registro próprio, equipe ou conjunto completo. Há recursos condicionados a planos, incluindo escopo de equipe. Não houve teste de interface.                                                                                                                                                                                                                        | Apresentar responsável, próxima ação e histórico no registro; combinar ação permitida com escopo de unidade/organização quando necessário. Exige autorização no servidor e testes, não só filtros visuais.                                               |
| Agenda — [Odoo 19: Appointments](https://www.odoo.com/documentation/19.0/applications/productivity/appointments.html)                                                                                          | Resultado oficial indexado descreve agendamento de consultas/serviços; abertura integral expirou. A documentação oficial [18.0](https://www.odoo.com/documentation/18.0/applications/productivity/appointments.html?msockid=12a1cf126c9268842ab1d9426dde69fe) detalha disponibilidade de pessoas ou recursos e capacidade. Não presumir equivalência de todos os detalhes entre versões. | Separar serviço, profissional, sala/equipamento e capacidade. Só adicionar reserva conjunta de recursos se a operação precisar; concorrência transacional continua requisito do domínio próprio.                                                         |
| Agenda — [Cal.com](https://cal.com/?lang=en)                                                                                                                                                                   | Página pública mostra limites de agenda, antecedência e intervalos antes/depois. É apresentação do fornecedor, não ensaio da operação CAAB.                                                                                                                                                                                                                                              | Mostrar por que um horário não está disponível e oferecer próximas alternativas. Não converter buffers, antecedência ou limites em regras institucionais sem definição.                                                                                  |
| Conteúdo — [Contentful: agendamento](https://www.contentful.com/help/scheduled-publishing/)                                                                                                                    | Documenta publicar/despublicar em data definida e acompanhar ações futuras. Há limites de agendamento declarados pelo produto.                                                                                                                                                                                                                                                           | Calendário editorial e linha do tempo da publicação; distinguir notícia publicada de distribuição confirmada. Adotar o aprendizado sem introduzir dependência SaaS por conveniência.                                                                     |
| Conteúdo — [Payload: drafts](https://payloadcms.com/docs/versions/drafts)                                                                                                                                      | Documenta rascunhos, autosave, conteúdo publicado com alterações não publicadas e publicação/despublicação agendada.                                                                                                                                                                                                                                                                     | É candidato já previsto no projeto. Preservar a versão pública enquanto se edita a próxima. A integração ainda precisa demonstrar autorização, auditoria, arquivos e compatibilidade com a aplicação atual; não instalar apenas por estar citado no PRD. |
| Comunicação — [Brevo: segmentos](https://help.brevo.com/hc/en-us/articles/360021703959-About-segments) e [campanhas](https://help.brevo.com/hc/en-us/articles/4413566705298-Create-and-send-an-email-campaign) | Documenta segmentos atualizados por condições, prévia/teste e agendamento. Não prova leitura de mensagem nem precisão de uma base cadastral.                                                                                                                                                                                                                                             | Prévia do público com critérios legíveis e exclusões. Definir se o público será congelado ou recalculado; revalidar preferências antes do envio. Fornecedor e custos dependem de volume e canal.                                                         |
| Entrega — [OneSignal: confirmação de recebimento](https://documentation.onesignal.com/docs/en/confirmed-delivery)                                                                                              | Distingue aceitação pelo serviço push de recebimento no dispositivo. Confirmação exige SDK e plano pago, com limitações por plataforma.                                                                                                                                                                                                                                                  | Exibir “aceita pelo provedor”, “recebida” e “aberta” apenas quando houver evidência correspondente; ausência de confirmação deve aparecer como desconhecida. Exige trabalho no app se escolhido.                                                         |
| Parceiros — [PartnerStack: visão do portal](https://support.partnerstack.com/hc/en-us/articles/360016866594-Comprehensive-overview-of-the-partner-dashboard)                                                   | Documenta programas, recursos atribuídos, mensagens e relatórios. O foco inclui indicações e comissões, diferente de um catálogo institucional de benefícios.                                                                                                                                                                                                                            | Aproveitar pendências, documentos e visibilidade por organização. Não importar comissionamento, pagamentos ou métricas comerciais que não atendem à CAAB.                                                                                                |
| Acesso — [Auth0: usuários e RBAC](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/rbac-users)                                                                                           | Documenta atribuição, consulta e remoção de papéis/permissões. Isso não comprova isolamento institucional específico da CAAB.                                                                                                                                                                                                                                                            | Mostrar permissões efetivas em linguagem compreensível e origem da concessão. Não substituir a autenticação existente sem necessidade demonstrada.                                                                                                       |

As propostas da coluna final são inferências de produto, não funcionalidades comprovadas da CAAB.
Antes de selecionar um serviço externo: estimar volume de usuários/contatos/envios, custo de
operação, limites de plano, localização e exportação dos dados, suporte e esforço de saída. Antes de
adotar uma biblioteca: verificar compatibilidade e impacto nos controles já implementados. Esta
comparação não fecha compras nem escolhe fornecedores de mensageria ou pagamentos.

## 3. Matriz funcional e de decisões propostas

Relevância é uma avaliação qualitativa, não uma medição de frequência. Não foram fornecidos volumes
de uso nem entrevistas com operadores. “Alta” significa relação direta com uma necessidade central.

| Função histórica             | Necessidade atual / relevância                                                                      | Decisão proposta e justificativa                                                                                                                         | Impacto e dependências                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso e sessão              | Entrada segura e recuperação de acesso; alta.                                                       | Manter e melhorar: acesso compreensível, recuperação e sessões conforme lacunas reais da fundação.                                                       | Definir perfis sensíveis, canal de recuperação e necessidade de acesso externo. Não presumir que todos esses fluxos já existem.        |
| Notícias, slides e destaques | Comunicação editorial consistente; alta.                                                            | Unificar em Conteúdo: notícia, mídia e posição de destaque com vigência. Propor descontinuação de um cadastro separado de slides sem finalidade própria. | Definir responsáveis, aprovação, canais e mídias; preservar autonomia entre rascunho e versão pública.                                 |
| Agendamentos                 | Encontrar vaga e acompanhar atendimento; alta.                                                      | Melhorar: fila do dia e busca por serviço/próxima vaga, com calendário como visão complementar.                                                          | Depende de beneficiário identificado, regras de atendimento e disponibilidade confiável.                                               |
| Estrutura de atendimento     | Explicar e configurar a oferta real; alta.                                                          | Unificar cadastros na configuração da oferta: serviço, unidade, profissionais/recursos e exceções.                                                       | Mostrar impacto de mudanças sobre reservas; capacidade, duração e vínculos são decisões da operação.                                   |
| Avaliações de atendimento    | Acompanhar qualidade e responder problemas; média, frequência desconhecida.                         | Integrar ao atendimento com fila de acompanhamento; manter opinião original.                                                                             | Definir quem lê, responde e modera, critérios de exposição e retenção.                                                                 |
| Associados e dependentes     | Identidade confiável, vínculo e resolução documental; alta.                                         | Melhorar: cadastro mínimo, vínculos explícitos e fila de análise com pedidos pontuais de correção.                                                       | Confirmar vínculos aceitos, campos, documentos, duplicidade e consequências de alterações.                                             |
| Credencial e elegibilidade   | Explicar o que permite ou impede um serviço; alta.                                                  | Substituir um status geral por dimensões separadas: cadastro, vínculo, regularidade, situação financeira, validade e restrições por finalidade.          | Matriz institucional de consequências; resultado desconhecido não pode virar irregularidade automaticamente.                           |
| Colaboradores e grupos       | Organização do trabalho e concessão de acesso; alta para acesso, escopo administrativo a confirmar. | Unificar a navegação de equipe e acesso, preservando colaborador e conta como conceitos distintos.                                                       | Confirmar unidades, setores, escopos e campos; não ampliar para RH completo.                                                           |
| Caassh / créditos            | Finalidade e continuidade não confirmadas.                                                          | Adiar implementação; se confirmado, redesenhar extrato, concessão em lote e correção rastreável.                                                         | Definir natureza da unidade, responsáveis, limites, validade e regras de correção. Saldo não deve ser um campo editável sem histórico. |
| Parceiros e benefícios       | Catálogo confiável e condições claras; alta.                                                        | Melhorar: separar organização, unidades, contrato e oferta, com pendências de vigência.                                                                  | Definir aprovação, público elegível, exposição, prioridade e comprovação. Ocultar não equivale a excluir.                              |
| Comunicação                  | Mensagens relevantes e acompanháveis; alta, canais a confirmar.                                     | Unificar editor e acompanhamento; separar comunicação institucional de eventos transacionais.                                                            | Base de destinatários, preferências, políticas de envio, fornecedores e contratos.                                                     |
| Logs e auditoria             | Explicar alterações e investigar ocorrências; alta.                                                 | Manter auditoria central e acrescentar histórico contextual nos módulos.                                                                                 | Eventos de domínio, redação legível e minimização dos dados; histórico não editável.                                                   |
| Área de parceiros / QR       | Autoatendimento e solicitações; necessidade atual desconhecida.                                     | Adiar portal até confirmar tarefas; tratar eventual cobrança como solicitação, separada de liquidação.                                                   | Isolamento por organização e definição de quem opera. QR não autoriza nem comprova Pix/pagamento.                                      |
| Relatórios / impressão       | Apoiar decisão ou rotina comprovada; variável.                                                      | Unificar exportações filtradas; PDF somente para documentos com finalidade definida. Propor descontinuação da impressão indiscriminada de toda listagem. | Definir público, campos, período, formato, autorização e retenção.                                                                     |

Nenhuma recomendação de descontinuação autoriza apagar dados ou desligar operações existentes.

## 4. Proposta de organização e jornadas

Menu proposto, revelado conforme permissões e funcionalidades efetivamente disponíveis:

- **Meu trabalho:** pendências atribuídas, próximos atendimentos e falhas que exigem ação.
- **Pessoas:** associados, dependentes, análise cadastral e situações de elegibilidade.
- **Atendimentos:** operação diária, agenda, disponibilidade e configuração de serviços.
- **Benefícios:** parceiros, unidades de parceiros, ofertas e contratos.
- **Comunicação:** conteúdo editorial, destaques, campanhas e mensagens automáticas.
- **Administração:** equipe, contas, permissões, auditoria e processamentos.

Caassh e portal não ganham espaço na navegação antes da confirmação de sua necessidade. Relatórios
começam contextualizados nas áreas que os produzem; uma central analítica só se justifica com uso
real. Unidades próprias e unidades de parceiros podem compartilhar padrões de endereço, sem
compartilhar automaticamente identidade ou regras de negócio.

### Jornadas essenciais e cenários de aceite propostos

| Cenário do novo produto               | Experiência proposta                                                                                        | Evidência de aceite                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Operador resolve pendência documental | Abrir fila → ver o que falta e pedidos anteriores → solicitar apenas o necessário ou registrar decisão.     | Uma correção preserva documentos válidos; a decisão tem responsável e motivo; outro operador vê o estado atualizado.                  |
| Associado entende sua situação        | Exibir cada dimensão com fonte, atualização e ação possível para regularização.                             | Caso sintético com cadastro aprovado e outra dimensão pendente não aparece como bloqueio geral; impacto só segue política confirmada. |
| Atendente procura vaga                | Buscar serviço → comparar opções permitidas por data/unidade → confirmar com resumo.                        | Disputa simultânea pela mesma capacidade não gera reserva excedente; quem perde a vaga recebe explicação e alternativas.              |
| Coordenação altera disponibilidade    | Editar regra ou exceção → conferir reservas atingidas → escolher procedimento permitido.                    | Nenhuma reserva existente é cancelada silenciosamente; conflitos ficam identificados para resolução.                                  |
| Comunicação prepara notícia           | Criar rascunho → conferir prévia → revisar conforme política → publicar/agendar → acompanhar estado.        | Alterar rascunho não muda a versão pública; execução repetida não duplica publicação; só conteúdo autorizado chega ao canal.          |
| Pessoa consulta benefício             | Ler condição, vigência, abrangência, unidade e forma de utilização.                                         | Oferta expirada não é apresentada como vigente; condição ausente impede publicação quando obrigatória.                                |
| Comunicação envia ao público certo    | Montar público → revisar critérios, quantidade e conteúdo → programar → acompanhar resultado.               | Exclusões são respeitadas; reexecução não duplica envio; sistema não chama aceitação do provedor de leitura.                          |
| Parceiro acessa sua operação          | Ver apenas registros e tarefas atribuídos à sua organização.                                                | Tentativa direta de acessar registro de outro parceiro é negada no servidor, inclusive em arquivos e exportações.                     |
| Gestor investiga alteração            | Abrir histórico do registro → ler ação, autor, momento e motivo → consultar evento detalhado se autorizado. | Evento preservado, campos sensíveis protegidos e relação rastreável com a operação.                                                   |

Estes são critérios para futuras implementações, não resultados de testes executados nesta análise.
A validação visual partirá dessas jornadas e de protótipos próprios, sem comparar com telas antigas.
Não foi criado protótipo nesta etapa porque as decisões de domínio devem orientar o primeiro fluxo.

Indicadores úteis: tempo para resolver uma pendência, quantidade de reenvios documentais por caso,
tempo para encontrar vaga, falhas de publicação por canal e pendências de ofertas vencidas.
Registrar uma linha de base com operadores antes de fixar metas numéricas. Comparar tarefas
equivalentes, sem inventar percentuais de melhoria. Cada nova interface deve ser verificada com
teclado, leitor de tela, contraste e largura reduzida; alegações dos fornecedores não substituem
essa verificação.

## 5. Mapa de integrações proposto

| Relação                            | Finalidade e dados mínimos                                                                        | Responsabilidade e alternativa                                                                                                   | Decisão pendente                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| App/site ↔ novo produto            | Conteúdo autorizado; futuramente solicitações, agenda, credencial e benefícios conforme escopo.   | Backend decide estados e autorização; canal apresenta. Contratos novos e consumidor sintético até integração formal.             | Responsável pelos consumidores, escopo da evolução móvel e contratos vigentes fornecidos.                 |
| OAB/CAAB ↔ cadastro                | Identificação, vínculo e situações estritamente necessárias, com fonte e data.                    | Adaptador institucional; sem fonte disponível, registrar informação como não verificada ou fazer consulta manual autorizada.     | Documentação oficial, autoridade de cada campo, frequência de atualização e regra para indisponibilidade. |
| Mensageria ↔ worker/app            | Destinatário autorizado, conteúdo, agendamento e eventos de entrega suportados.                   | Adaptador por canal, fila e histórico de tentativas; falha explícita se fornecedor indisponível.                                 | Canais, volumes, custos, preferências e política de contingência.                                         |
| Arquivos ↔ módulos                 | Mídia, documentação cadastral e contratos classificados.                                          | Storage e processamento da fundação; módulo decide quem pode ler e para quê. Arquivo indisponível não vira público por fallback. | Tipos, limites, justificativa da coleta e retenção T089.                                                  |
| Endereços/mapas ↔ unidades         | Endereço e coordenadas quando necessários à descoberta.                                           | Cadastro manual deve funcionar sem geolocalização; busca por cidade/unidade como alternativa.                                    | Cobertura, provedor, custo, precisão e necessidade real de proximidade.                                   |
| Portal ↔ parceiros                 | Contas, organização e solicitações autorizadas.                                                   | Backend impõe isolamento; equipe interna pode operar sem portal na primeira fase.                                                | Tarefas delegáveis e autoridade de cada parceiro.                                                         |
| Automações ↔ módulos               | Publicações, vencimentos e lembretes, com referência ao registro e versão.                        | Worker executa regras do módulo, com idempotência e recuperação; revisão humana nos casos previstos.                             | Gatilhos, destinatários, horários e escalonamento.                                                        |
| Indicadores/exportações ↔ operação | Dados filtrados, período, definição do indicador e público autorizado.                            | Consultas do novo domínio; exportação assíncrona quando necessário. Não consultar banco antigo.                                  | Relatórios efetivamente usados e retenção do arquivo exportado.                                           |
| Créditos/pagamentos ↔ programa     | Somente após finalidade confirmada; lançamentos e identificadores de transação quando aplicáveis. | Programa mantém sua regra; provedor financeiro, se contratado, informa eventos verificáveis. Nenhuma integração presumida.       | Existência do programa, regras de crédito e eventual necessidade financeira separada.                     |

O backend próprio continua fonte das decisões do novo domínio. Sistemas institucionais podem ser
fontes autoritativas de determinados fatos; isso precisa ser definido campo a campo. Integração não
deve transformar dados desconhecidos ou desatualizados em decisões automáticas de impedimento.

## 6. Plano de evolução recomendado

Prioridade por valor provável, dependências e complexidade. Frequência é hipótese até haver dados da
operação. Não há cronograma prometido nem pacote fechado de todos os itens históricos.

| Ordem       | Entrega coesa                                               | Razão e dependências                                                                                                                            | Pronta quando                                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preparação  | Alinhar a especificação do primeiro módulo com este laudo.  | Elimina dependência do legado e fecha as poucas decisões que realmente bloqueiam a entrega.                                                     | Escopo, estados, regras e aceite claros; documentação entra junto com a implementação.                                                                                                                          |
| 1           | Notícias e publicação editorial.                            | Prevista no PRD, valor provável recorrente e menor dependência de elegibilidade institucional. Aproveita arquivos, auditoria e jobs existentes. | Jornada completa de autoria, prévia, versão pública, agendamento, permissões, falhas e consumo contratual validada. Integração real com app/site só é declarada pronta após teste dos consumidores autorizados. |
| 2           | Cadastro e análise de associados/dependentes.               | Base para atendimento e comunicação segmentada; regras documentais e de vínculo precisam ser definidas.                                         | Cadastro mínimo, análise, correções, vínculos e histórico funcionam com regras confirmadas.                                                                                                                     |
| 3           | Oferta de serviços e disponibilidade.                       | Prepara a agenda sem depender de uma interface de calendário para explicar a operação.                                                          | Operador configura oferta, exceções e visualiza disponibilidade correta; impactos são explícitos.                                                                                                               |
| 4           | Operação de atendimentos.                                   | Depende das etapas 2 e 3 e da matriz de elegibilidade aplicável. Complexidade maior por concorrência e mudanças de estado.                      | Reservar, remarcar, cancelar e registrar desfecho preserva integridade e histórico.                                                                                                                             |
| 5           | Parceiros e benefícios.                                     | Pode anteceder agenda se os gestores confirmarem maior urgência; depende de condições comerciais/institucionais claras.                         | Catálogo, oferta, vigência, visibilidade e documentos funcionam em uma jornada completa.                                                                                                                        |
| 6           | Comunicação segmentada e lembretes.                         | Depende de destinatários confiáveis, eventos de domínio, canais e preferências.                                                                 | Público e conteúdo revisáveis; envio rastreável sem duplicidade; estados apresentados com precisão.                                                                                                             |
| Condicional | Caassh, portal, novos canais, biometria e consulta offline. | Finalidade ou esforço ainda insuficientemente justificados.                                                                                     | Necessidade e regra confirmadas antes de especificação e implementação.                                                                                                                                         |

Equipe/permissões, histórico contextual, qualidade de atendimento e relatórios evoluem junto com os
módulos que exigirem essas capacidades. Não criar uma fase genérica de telas vazias ou um PR por
artefato. Um PR corresponde a uma funcionalidade utilizável com documentação e testes.

T089 (retenção/privacidade) e T095 (proteção/provas de promoção) continuam pendentes de produção.
Não bloqueiam desenhar módulos em DEV com dados sintéticos, mas a coleta e o uso de dados reais
precisam respeitar as decisões de privacidade aplicáveis ao módulo. `main` permanece fora do escopo.

## 7. Decisões institucionais a obter no momento certo

Para começar Notícias: quem pode publicar; se precisa de aprovação de outra pessoa; quais canais
recebem o conteúdo; formatos e limites de mídia; responsável por fornecer/aceitar contratos dos
consumidores. Não pedir todas as regras dos outros módulos para iniciar essa entrega.

Antes de Associados: quem pode ser associado/dependente, vínculo aceito, documentos mínimos, quem
decide a análise e quais alterações exigem nova verificação. Aprovação cadastral e validade do
vínculo não devem ser confundidas com as demais dimensões.

Antes de Atendimentos: serviços/unidades, duração/capacidade, horários, regras de conflito,
cancelamento/remarcação/falta e consequências de cada condição de elegibilidade.

Antes de Benefícios e Caassh: condições de utilização, público elegível, vigências, continuidade do
programa de créditos e responsabilidades de concessão/correção. Antes do portal: tarefas que o
parceiro realmente precisa executar sozinho.

Recomendação imediata: especificar **Notícias e publicação editorial** com base neste diagnóstico,
apresentando a jornada concreta e perguntando somente as decisões editoriais/institucionais que
faltarem. Esta análise não inicia automaticamente sua implementação.
