# OAB sem controle de ativação — 15/09/2026

## Pedido e alteração

O usuário determinou funcionamento sem controle de desativação, sem tela nova e sem
acesso à VM/painel. Nova branch codex/oab-always-on-20260915, derivada de2f26a37,
substitui a proposta do PR25 sem modificar sua branch congelada ou Agendamentos.

A aplicação agora verifica exclusivamente API_OAB_KEY e API_OAB_PASSWORD.
Qualquer OAB_API_ENABLED legado, inclusive false/vazio/inválido, é ignorado.
O exemplo de ambiente não exige essa flag. O endpoint e o contrato institucional,
campos, autenticação, permissões, limites e auditoria são preservados.

## Validação

- 64 testes sintéticos do adaptador/rota passaram em dois arquivos.
- Consulta bem-sucedida simulada com as mesmas credenciais para flag ausente, true,
  false, caixa/espaços, vazio, erro de digitação e valor numérico legado.
- Falta de chave/senha continua interrompendo antes do HTTP.
- Lint e formatação dos arquivos alterados aprovados; git diff --check aprovado.
- CI completo em acompanhamento antes do PR substituto.

## Limites

O código utiliza as credenciais privadas existentes no ambiente; não cria nem embute
segredos. Não houve consulta real ou inspeção das credenciais remotas. T028 continua
separada: testes sintéticos não comprovam autenticação no serviço hospedado.
Pesquisa oficial da entrega anterior mantida; nenhum provedor substituto adotado.
