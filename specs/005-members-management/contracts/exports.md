# Contrato do incremento — Associados: preservação manual, agenda e exportação

Estado: planejado em 21/09/2026, sem implementação.

Datasets members.people, members.links, members.assessments, members.documents-metadata e members.history com escopo de cadastro. Padrão da lista nome/OAB-UF/situação/análise; colunas pessoais adicionais somente quando já consultáveis. Datas/filtros nome/CPF/OAB/UF/análise/arquivo/situação respeitam máscaras e autorização; nenhum CPF em logs de exportação. A Consulta OAB não oferece botão nem exportação própria de seu resultado, tanto na consulta avulsa quanto na consulta pelo cadastro. É uma exceção explícita ao padrão transversal, por decisão do usuário em 21/09/2026.

member.id identifica cada pessoa individualmente; vínculo familiar não une agendas. export_operation referencia somente ator/dataset, não cria pessoa/login. Q11 mantém valores não verificados desconhecidos e decisões humanas com fonte/autor/data; motivos históricos preservados, sem campo obrigatório. Projeção de aviso em 008 não é novo campo persistido em member.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Exportar associados/dependentes sem acesso a Relatórios; negar documento/campo restrito; bloqueio mantém reservas e vaga, sinaliza vínculos vigentes e não afeta situação própria; manter análise manual sem novas exigências.
