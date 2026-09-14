# Justificativas e resultado OAB — evidências de 14/09/2026

Código validado: `8d1e68e`, branch `feature/admin-updates-20260914`.
[CI aprovado](https://github.com/Komunick/caabnovo/actions/runs/34878079341): quality, browser e security concluídos com sucesso.

| Verificação | Resultado |
| --- | --- |
| Formatação, lint e tipos | Aprovados |
| Unitários | 248 aprovados |
| Contratos | 83 aprovados |
| Integração em PostgreSQL descartável | 143 aprovados |
| Chromium | 60 aprovados, sem falhas ou flakies |
| Acessibilidade dedicada | 6 aprovados |
| Build web/worker/pacotes e segurança | Aprovados |

Cadastros de colaboradores/associados, vínculos e documentos iniciais dispensam motivo. Alterações exigem motivo no servidor e conservam auditoria. Testes verificam rejeição sem mutação, foto inicial versus substituição/remoção, criação/edição de notícia, ações editoriais e configurações da conta. Parceiros já atendia à regra e participou da regressão.

A integração revelou dois fixtures editoriais sem o novo motivo e uma diferença entre os relógios da aplicação/transação que omitia acessos recém-concedidos da resposta inicial de criação do colaborador. Os fixtures foram atualizados e a validade dos acessos iniciais passou a usar o instante de criação do banco. A segunda execução completa aprovou esses cenários, preservando permissões e auditoria.

O resultado OAB exibe os sete campos escolhidos pelo usuário, sem repetir a inscrição. Testes com provedor simulado cobrem regularidade/inadimplência independentes, campos ausentes/desconhecidos, ausência de registro, erros, texto HTML tratado como texto, limpeza de resultado anterior, rótulos acessíveis/controles nativos, ausência de overflow em 390 px e Axe em desktop claro/mobile escuro. A integração verifica que os novos dados pessoais não entram na auditoria nem alteram perfil ou avaliações.

O inventário completo dos dez campos observados está em [oab-query.md](../../005-members-management/contracts/oab-query.md), sem valores pessoais. A consulta real autorizada foi única e direta ao serviço, sem banco/auditoria do projeto; seus valores não foram copiados para código, testes ou documentos.

As capturas sintéticas são geradas pelo Chromium. A coleta de artefatos foi ajustada para a pasta `apps/web/test-results`, determinada pela configuração do Playwright instalado. Somente PNGs da tela OAB são conservados por sete dias; respostas reais, ambientes e traces não são publicados. A revisão visual manual das capturas será registrada no mapa local após a coleta.

Não houve servidor local, migration, alteração de dados reais, PR ou merge nesta validação. A pasta principal permanece em dev. A branch ativa reúne as alterações autorizadas até a abertura de PR, quando será congelada.
