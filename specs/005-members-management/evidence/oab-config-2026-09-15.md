# Configuração da integração OAB — 15/09/2026

## Escopo e causa reproduzível

Branch isolada codex/oab-deploy-config-20260915, base dev154cbed, solicitada pelo usuário
para preservar a instância de Agendamentos. O usuário solicitou alteração de código,
confiando no deploy posterior, e pesquisa de API mais recente equivalente.

Antes: API_OAB_KEY/API_OAB_PASSWORD presentes sem OAB_API_ENABLED lançavam
OAB_NOT_CONFIGURED. Agora: omissão da flag permite usar as duas credenciais; true
continua aceito e false mantém a desativação. Espaços/caixa da flag são normalizados;
flag vazia/desconhecida e segredos incompletos continuam bloqueando antes do HTTP.
Não foi inspecionada a configuração da VM; este é um caso confirmado no código,
não a atribuição de uma causa comprovada ao site remoto.

## Validação

- Adaptador e rota OAB: 64 testes sintéticos aprovados em dois arquivos.
- Casos novos: credenciais completas sem flag; true com caixa/espaços; desativação
  explícita; flag inválida/vazia; credenciais parciais/brancas; leitura do ambiente
  em execução; headers privados com credenciais normalizadas.
- Regressões existentes: autenticação/permissões, endpoint fixo, sem redirects/cache,
  mapeamento de campos, resposta inválida, timeout, ausência de resultado e número inválido.
- Lint dos arquivos alterados, formatação geral e git diff --check aprovados.
- Tipos locais e CI completo aprovados para o código 2906c67:
  https://github.com/Komunick/caabnovo/actions/runs/35011578859
- CI: 293 unitários, 105 contratos, 160 integrações (14 da OAB), 67 E2E e 6 de
  acessibilidade: 631 testes aprovados. Build, lint, tipos, formatação, regras de
  branches, auditoria de dependências e scan de segredos aprovados.
- Browser: 67 passed e 6 passed; sem falhas ou flakies nos resumos finais.
- Nenhuma interface alterada; validação visual já existente usa fixtures sintéticas.

O workflow CI passa a aceitar pushes codex/** para validar esta branch antes de congelá-la
em PR, com os mesmos jobs/gates já usados pelo repositório. Nenhum gate removido.

## Pesquisa e limites

Fontes e comparação em ../research.md, seção APIs oficiais e configuração OAB.
Não foi encontrada API oficial mais recente com equivalência comprovada ao STATUS CAAB.
CNA SOAP/WCF e ConfirmADV não foram adotados como substitutos automáticos.
Nenhuma consulta real, acesso à VM, alteração de credenciais, banco, avaliação ou deploy.
A aplicação ainda depende de credenciais privadas válidas fornecidas pelo ambiente;
false existente continua desativando-a. T028 continua separada dos testes sintéticos.
