# Consulta OAB-BA no painel

Complementa [oab-legacy.md](oab-legacy.md). O contrato do consumidor antigo é a evidência
de partida; testes simulados não comprovam disponibilidade nem credenciais vigentes.

## Exportação

A Consulta OAB não oferece botão nem exportação própria de seu resultado, tanto na consulta avulsa quanto na consulta pelo cadastro. É uma exceção explícita ao padrão transversal, por decisão do usuário em 21/09/2026.

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
  "name": "Pessoa sintética",
  "cpf": null,
  "delinquent": null,
  "detail": null,
  "subsection": null,
  "commitmentDate": null
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

No ambiente do servidor web: `API_OAB_KEY` e `API_OAB_PASSWORD` não vazias.
Decisão final de 15/09/2026: a integração fica habilitada sempre que ambos os segredos
estão presentes. `OAB_API_ENABLED` foi retirada do controle de ativação: qualquer valor
legado, inclusive `false` ou vazio, é ignorado. Configuração é lida no servidor em execução.
Os dois segredos pertencem ao relatório **STATUS CAAB**, não ao relatório financeiro.
O endpoint HTTPS é fixo e os segredos vão em headers; redirecionamentos são recusados.
Não há variáveis públicas, edição de credenciais na conta do usuário ou scraping.

O exemplo versionado omite a flag e mantém segredos vazios (integração indisponível). Configurar somente
no ambiente escolhido, sem copiar segredos para Git, mensagens ou evidências. Validar as
credenciais históricas antes de adotá-las. Credenciais da hospedagem devem ser configuradas
no gerenciador de segredos/ambiente do serviço, não copiadas do localhost automaticamente.
Não existe controle de ativação/desativação nem tela de configuração, por decisão do usuário.
Não remover dados, auditoria ou avaliações para trocar essa configuração.

Conexão ativada somente no localhost. T028 permanece pendente: o teste real foi descartado após o usuário esclarecer a falta de autorização e não serve como homologação. Seus resultados foram removidos e não devem ser reutilizados em testes. Nenhuma avaliação, situação financeira,
elegibilidade ou crédito é alterado pela consulta, mesmo se a resposta for regular.

## Campos observados e seleção autorizada — 14/09/2026

Consulta individual autorizada, HTTP 200, um registro. Nenhum valor pessoal da resposta é reproduzido nesta documentação; nomes e tipos abaixo são o inventário completo observado.

| Campo do provedor | Tipo observado | Uso no resultado |
| --- | --- | --- |
| Nome | string | Nome em destaque |
| OAB | string | Conferência da inscrição solicitada; não repetir no resultado |
| CPF | string | Exibir CPF |
| SituacaoRegular | string | Situação regular, independente da inadimplência |
| Detalhe | string | Exibir detalhe textual |
| Inadimplente | string | Exibir se está inadimplente |
| PagoTotalExercicioAtual | string | Não projetar nem exibir |
| DataInadimplencia | null | Não projetar nem exibir; formato preenchido não verificado |
| SubSecao | string | Exibir subseção |
| DataCompromisso | string (DD/MM/AAAA) | Exibir data de compromisso |

A resposta privada acrescenta `cpf`, `detail`, `subsection` e `commitmentDate` (string ou null), e `delinquent` (boolean ou null). Campos opcionais ausentes/vazios viram null. SIM/NAO/NÃO são reconhecidos sem diferenciar caixa, espaços ou acentos; valor desconhecido não vira falso. `status` mantém o contrato anterior.

Não encontrado retorna nome e os novos campos nulos. A inscrição permanece no contrato para correlação, sem repetição visual. Texto da fonte é renderizado como texto, nunca HTML. Os campos novos não entram em auditoria, banco, logs ou atualizações do associado. A auditoria normal da funcionalidade permanece; a consulta real excepcional de validação foi feita fora da aplicação e sem banco, conforme autorização específica.
