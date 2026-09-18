# Interfaces v1

Contratos estritos em `packages/contracts/src/reports.ts`. Respostas `no-store`.

| Método/caminho | Entrada/resultado |
| --- | --- |
| GET `/api/v1/reports?q=<JSON codificado>` | `ReportQuery`: catálogo autorizado, resumo, uso e tabela em `view=details`. |
| GET `/api/v1/reports/queries` | Consultas pessoais. |
| POST `/api/v1/reports/queries` | `{name,query,notes?}` → consulta com id e versão. |
| PUT `/api/v1/reports/queries/:id` | Mesma configuração e `version`; conflito retorna 409. |
| DELETE `/api/v1/reports/queries/:id` | `{version}` → `{deleted:true}`. |
| POST `/api/v1/reports/exports` | `{query,format,notes?}` → 202 `{id}` de processamento. |
| GET `/api/v1/reports/exports?page=1` | Histórico privado, 20 itens + sentinela da página seguinte. |
| GET `/api/v1/reports/exports/:id/download` | Arquivo; revalida proprietário, conta e permissões originais. |

Mutações autenticadas exigem `Origin` da aplicação e `x-csrf-token` aleatório de
pelo menos 32 caracteres. Exportação exige `idempotency-key` de 16–128 caracteres.
Repetir chave com outro conteúdo retorna 409. Erros 401/403/404/409/413/422.
Corpo de configuração limitado a 16 KB. Período até 366 dias, página de 50 registros,
arquivo até 50 mil linhas; excedente falha explicitamente, sem truncamento.

```json
{"view":"details","dataset":"members","from":"2026-09-01","to":"2026-09-30","dateScope":"period","columns":["name","city"],"sort":"name","direction":"asc"}
```

`dateScope=all` consulta toda a base cadastral; acessos sempre respeitam o período.
Situação usa comparação textual exata sem diferenciar maiúsculas; pesquisa,
categoria e cidade buscam trecho literal. Colunas, agrupamentos e ordenação vêm
do catálogo. Resumo/executivo usam o período para movimentos e mostram base atual
separadamente. Canal/ambiente/fonte aplicam-se aos acessos. Filtros de registros
aplicam-se somente aos detalhes e ficam preservados entre abas.

## Coleta do painel

POST `/api/v1/reports/collect`: sessão autenticada e CSRF; conta derivada do servidor.
Corpo até 2 KB, retorno 204. Não exige permissão de consultar relatórios. Não aceita
`accountId`, instante informado pelo cliente ou conclusão de reserva. Confirmação
é registrada após sucesso da operação no servidor. Navegação SPA gera visualização
de módulos, sem URL completa, parâmetros ou IDs de cadastro. Sessão de uso expira
após 30 minutos sem atividade instrumentada; falhas não bloqueiam o painel.

## Integração de sites/app externos

POST `/api/v1/reports/ingest` é **server-to-server**:
`Authorization: Bearer <token>`. Nunca colocar token no navegador/binário do app.
O projeto externo envia eventos ao próprio backend, que valida origem, política
de coleta, limites e identidade antes de encaminhar. Sem CORS público.

Configuração somente no servidor web:

- `REPORTS_ENVIRONMENT`: `production`, `development` ou `test`. Definir explicitamente
  em DEV; o padrão segue `NODE_ENV`, portanto um build de produção usa `production`.
- `REPORTS_INGEST_SOURCES`: JSON até 30 objetos `{source,channel,token}`. Fonte estável
  até 80 caracteres `[a-z0-9.-]`, canal `site`/`app`, token aleatório de 32–200
  caracteres exclusivo por fonte. `panel` é reservado. Padrão `[]` desativa externos.
- `BETTER_AUTH_SECRET` existente: HMAC dos pseudônimos. Rotacionar a chave altera
  continuidade de visitantes/contas; registrar a mudança na interpretação histórica.

Payload sintético; gerar UUID por evento e preservar IDs de visitante/sessão:

```json
{
  "id":"1a9df109-22dc-4f2f-b887-d125f84f5277",
  "visitorId":"46e84d99-197b-4434-b514-5890c1b4e390",
  "sessionId":"70ad0895-8dda-46cb-aa38-798912fbf737",
  "event":"page_view",
  "screen":"home",
  "device":"mobile",
  "origin":"direct",
  "version":"1.0.0"
}
```

Opcionais: `accountId` UUID opaco derivado de autenticação no backend; `occurredAt`
ISO UTC/offset até 7 dias atrás e no máximo 1 minuto à frente; `device`, `origin`,
`version` (até 40 caracteres sem texto pessoal). Sem instante externo, usa servidor.
Retries reutilizam `id`; fonte + id deduplicam. Limite 120 eventos por visitante/
fonte/minuto; corpo excedido retorna 413. Renovar sessão externa após 30 minutos
sem atividade. Não reenviar conclusões de negócio antes de persistir a operação.

- Eventos: `page_view`, `schedule_open`, `service_selected`, `slot_selected`,
  `booking_confirmed`, `report_exported`.
- Telas: `home`, `news`, `members`, `partners`, `users`, `scheduling`, `messages`,
  `audit`, `reports`, `sessions`, `settings`, `other`.
- Dispositivo: `desktop`, `mobile`, `tablet`, `unknown`.
- Origem: `direct`, `search`, `social`, `referral`, `internal`, `unknown`.

Não enviar nomes, e-mails, CPF, IP bruto, cookies, senha, referer/URL completos,
conteúdo de formulário ou replay. IDs usam HMAC com escopo ambiente/fonte; não
significa anonimização nem pessoas únicas entre canais. Robôs conhecidos são
ignorados; backend da fonte deve filtrar agente original antes de encaminhar,
pois seu agente HTTP não identifica visitantes. Coleta nunca bloqueia uso principal.

Fontes aparecem após primeiro evento aceito. Sem eventos, UI informa ausência
de dados; não presume falha técnica, zero histórico ou instrumentação externa.
Retenção institucional depende da política do projeto (T089).
