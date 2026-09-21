# Downloads legados: autorização atual — U1, 21/09/2026

Correção recomendada aprovada pelo usuário. Desenho para implementação, sem alteração de arquivos/dados ou validação funcional nesta etapa.

## Regra

Antes de gerar ou liberar qualquer arquivo antigo, verificar conta/sessão atuais, proprietário, `reports:read`, `exports:generate` e leitura atual de todas as fontes/campos contidos no arquivo. Papéis Administrador/Gestor usam a resolução atual de001; queda para Colaborador ou revogação passa a valer na próxima operação. Não confiar apenas na lista de permissões salva quando o arquivo foi gerado.

1. Normalizar exigências legadas audit:export/reports:export para exports:generate, mantendo as demais exigências registradas.
2. Complementá-las pelas dependências da configuração e da versão conhecida do gerador original. A configuração persisted do servidor, nunca dados fornecidos no download pelo cliente, identifica modo/dataset/fontes.
3. Detalhe de bookings exige scheduling:read, mesmo que a lista salva esteja vazia ou omita a chave. Resumo/apresentação legados do gerador do PR34 também exigem scheduling:read: aquele gerador consultava dados/cancelamentos da agenda sem capturar essa permissão. Preservar ainda as demais leituras exigidas por suas fontes; não concluir que um arquivo é seguro apenas porque seu dataset principal é outro.
4. Se versão/configuração/fontes não permitirem estabelecer com segurança o conteúdo autorizado, negar o download com mensagem segura e possibilidade de gerar um novo relatório com os acessos atuais. Não apagar nem reescrever bytes, auditoria ou registros antigos para corrigir a autorização.
5. Usar a mesma política nos downloads de Relatórios, caminhos genéricos/binários de arquivos e workers legados aplicáveis. Revalidar após espera/locks; não aceitar snapshots antigos como concessão atual. Validar antes de disponibilizar bytes ao cliente.

## Aceite com a massa de100 registros

- Criar fixture de arquivo antigo que contenha Agendamentos e cuja lista salva omita scheduling:read. Colaborador com reports:read+exports:generate, mas sem scheduling:read, não baixa por nenhum caminho.
- Com todas as leituras necessárias e propriedade válidas, o mesmo arquivo é baixado íntegro; remover scheduling:read impede o download seguinte e a execução pendente do worker.
- Cobrir detalhe, resumo e apresentação; outras fontes restritas, arquivo alheio, sessão/conta revogadas e metadados insuficientes também são negados.
- A negativa não modifica o arquivo, sua configuração nem a auditoria histórica; conferir hash e registros antes/depois. Novos eventos operacionais seguem minimização vigente.
- A correção protege novas entregas pelo servidor; não tenta recolher cópias já baixadas.

Execução:001 T104 e010 T025/T031/T035, com testes em packages/db/src/repositories/report-storage.ts, apps/web/tests/integration/reports.test.ts e caminhos de arquivo/worker afetados. IDs das tarefas existentes preservados.
