# Contrato do incremento — Conta: conciliação e regressão dos controles existentes

Estado: planejado em 21/09/2026, sem implementação.

Preservar endpoints de account-settings.md e a propriedade da conta. A ausência de permissão de módulo não remove Conta/Sessões/Sair; esses controles não dão acesso a cadastros administrativos. Nenhum novo endpoint de exportação da conta pessoal nesta rodada.

Conta/credencial/sessão/pedido de troca permanecem existentes; não exportar materiais de autenticação e não criar campos de MFA. Eventos antigos e dados históricos permanecem. Alterações do catálogo pertencem à spec001.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Usuário comum acessa sua conta, não altera outra nem ganha permissão; gestor concede sem MFA/justificativa, recusas permanecem específicas e último administrador protegido.
