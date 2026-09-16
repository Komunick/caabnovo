# Mensagens — preparação e acompanhamento

**Data:** 16/09/2026. **Estado:** preparação implementada e validada; meios de envio adiados. Responsável funcional: US7 do plano integrado.

## Escopo e decisão do usuário

Qualquer pessoa autenticada no painel com `messages:access` pode consultar, preparar, editar e solicitar envio. Não há aprovação editorial nem permissão adicional de envio. Os meios, fornecedores e políticas específicas de cada canal serão definidos depois. Nenhuma operação desta entrega transmite mensagens.

## Histórias e aceite

1. Criar, editar, duplicar, arquivar e restaurar campanhas. Guardar nome interno, assunto, texto, público e versão; rascunhos aceitam conteúdo incompleto. Conflitos de edição não sobrescrevem trabalho.
2. Criar e reutilizar modelos de conteúdo e públicos dinâmicos, com filtros de estado OAB e presença de contato. Público de associados não arquivados, exclusões explícitas e bloqueio geral de comunicação. Não presumir consentimento: público elegível para preparação não significa autorizado para um futuro canal.
3. Prévia com personalização limitada a nome e primeiro nome, validação de variáveis, contagens de incluídos/excluídos e amostra mínima de nomes. Sem HTML executável, CPF, documentos ou contatos completos na seleção.
4. Solicitar envio imediato ou programado com confirmação concreta de conteúdo e público. Sem canal: execução termina bloqueada com motivo; nunca aceita/enviada/entregue. Programações reavaliam público, bloqueios e acesso do solicitante; cancelamento interrompe programação. Não reativar automaticamente tentativas antigas quando canais forem adicionados.
5. Histórico imutável de execuções, versão/conteúdo/público capturados, contagens e motivo. Repetições da mesma solicitação não criam execuções duplicadas. Duplicar campanha cria novo rascunho.
6. Campanhas, modelos, públicos e preferências acessíveis por navegação do módulo, botões de adição, filtros e paginação. UI usa os componentes e padrões atuais, acessível em teclado e celular, temas claro/escuro. Edição preservada ao sair e voltar entre módulos; cancelar descarta explicitamente.

## Limites

Sem anexos, importação de contatos externos, eventos (módulo inexistente), links públicos de descadastro, cobrança, métricas de provedor, credenciais ou disparos reais. Integrações futuras deverão definir consentimento/finalidade por canal, supressão, limites, assinatura de callbacks, idempotência destinatário/canal e evidência de entrega. Não exibir essas integrações como existentes.
