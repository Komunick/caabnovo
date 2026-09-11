# Consulta OAB-BA no painel

Complementa [oab-legacy.md](oab-legacy.md). O contrato do consumidor antigo é a evidência
de partida; testes simulados não comprovam disponibilidade nem credenciais vigentes.

## HTTP privado

`POST /api/v1/members/oab-query`

Sessão ativa, `members:read`, origem confiável, `x-csrf-token` e `Content-Type: application/json`.
Somente servidor chama a instituição. JSON de entrada limitado a 64 KiB, sem campos adicionais.

Consulta avulsa: `{"number":"1234","state":"BA"}`. Número com 1–6 algarismos, maior que zero.
Limite de seis dígitos solicitado pelo usuário em 10/09/2026 e aplicado no campo e no servidor.
Consulta pelo cadastro: `{"memberId":"UUID"}`. O servidor lê número, UF, tipo e versão da
identificação; não aceita número alternativo junto de memberId. A consulta não exige cadastro
prévio no modo avulso. Tipo suportado: advogado, BA, número sem letras.

Sucesso HTTP 200:

```json
{
  "lookupId": "c9d3b3ee-7d64-435a-91eb-dce2b4582d90",
  "number": "1234",
  "state": "BA",
  "source": "OAB-BA / Implanta",
  "checkedAt": "2026-09-10T18:00:00.000Z",
  "status": "regular",
  "name": "Pessoa sintética"
}
```

`status`: regular, irregular, unknown ou not_found. Nome nulo em not_found. Apenas SIM
significa regular e NAO/NÃO significa irregular; valores desconhecidos não são inferidos.
A fonte deve devolver no máximo um registro e o número deve corresponder ao solicitado,
desconsiderando somente zeros à esquerda. Retorno ambíguo ou divergente é inválido.

| HTTP | Código | Significado |
| --- | --- | --- |
| 401/403 | AUTHENTICATION_REQUIRED / PERMISSION_DENIED | Sessão ou concessão inválida |
| 403 | ORIGIN_DENIED / CSRF_TOKEN_REQUIRED | Requisição sem origem/proteção válida |
| 404 | MEMBER_NOT_FOUND | Cadastro inexistente |
| 409 | OAB_MEMBER_CHANGED | Identificação alterada durante a consulta |
| 413/422 | BODY_TOO_LARGE / VALIDATION_FAILED | Entrada inválida |
| 422 | OAB_UNSUPPORTED_REGISTRATION | Inscrição do cadastro não coberta |
| 429 | OAB_RATE_LIMITED | Seis consultas iniciadas pelo operador no último minuto; Retry-After 60 |
| 502 | OAB_INVALID_RESPONSE | Formato, tamanho, codificação ou identificação do retorno inválidos |
| 503 | OAB_NOT_CONFIGURED | Integração desativada ou credenciais ausentes |
| 503 | OAB_CREDENTIALS_REJECTED | Serviço recusou autenticação |
| 503 | OAB_UNAVAILABLE | Serviço indisponível ou falha de transporte |
| 504 | OAB_TIMEOUT | Prazo de 95 segundos excedido |

Todas as respostas da consulta são `private, no-store` e `noindex, nofollow`.
O navegador limpa o resultado anterior ao iniciar outra consulta ou editar o número;
enquanto aguarda, impede submissão duplicada e anuncia o andamento. Nenhum erro é mostrado
como situação irregular, nem deixa um resultado anterior parecendo atualizado.

## Configuração e ativação

No ambiente do servidor web: `OAB_API_ENABLED=true`, `API_OAB_KEY` e `API_OAB_PASSWORD`.
Os dois segredos pertencem ao relatório **STATUS CAAB**, não ao relatório financeiro.
O endpoint HTTPS é fixo e os segredos vão em headers; redirecionamentos são recusados.
Não há variáveis públicas, edição de credenciais na conta do usuário ou scraping.

O exemplo versionado mantém `OAB_API_ENABLED=false` e segredos vazios. Configurar somente
no ambiente escolhido, sem copiar segredos para Git, mensagens ou evidências. Validar as
credenciais históricas antes de adotá-las. Credenciais da hospedagem devem ser configuradas
no gerenciador de segredos/ambiente do serviço, não copiadas do localhost automaticamente.
Para desativar, voltar a flag para false e reiniciar/recarregar o serviço conforme a hospedagem.
Não remover dados, auditoria ou avaliações para trocar essa configuração.

Conexão ativada somente no localhost. T028 permanece pendente: o teste real foi descartado após o usuário esclarecer a falta de autorização e não serve como homologação. Seus resultados foram removidos e não devem ser reutilizados em testes. Nenhuma avaliação, situação financeira,
elegibilidade ou crédito é alterado pela consulta, mesmo se a resposta for regular.
