# Princípios de Engenharia do CAAB

## Princípios centrais

**Aplicar KISS, DRY e YAGNI em toda alteração.**

- **KISS:** preferir soluções diretas, legíveis e fáceis de operar.
- **DRY:** extrair uma abstração somente após pelo menos três repetições reais e equivalentes.
- **YAGNI:** implementar o necessário para o requisito atual, sem opções especulativas.

## Produto e domínio

- Regras críticas pertencem ao servidor e ao domínio, não à interface.
- O banco é a fonte de verdade para agenda, associados, permissões e auditoria.
- Conteúdo, agenda e cadastro são módulos distintos, mesmo dentro da mesma aplicação.
- Dados do aplicativo e do site externo são expostos por contratos versionados.
- Estados importantes usam transições explícitas; não usar textos livres como máquina de estado.
- Uma integração externa nunca deve ser a única evidência de uma decisão interna crítica.

## Segurança e privacidade

- Negar por padrão e conceder o menor privilégio necessário.
- Autorizar cada requisição no servidor.
- Tratar arquivos, HTML, URLs e respostas externas como dados não confiáveis.
- Não registrar segredos ou dados pessoais desnecessários em logs.
- Minimizar dados conforme finalidade e política de retenção.
- Não automatizar serviços de terceiros por scraping quando não houver autorização formal.
- Dependência popular não substitui revisão, configuração segura e atualização contínua.

## Dados e auditoria

- Preservar histórico de alterações relevantes.
- Preferir exclusão lógica em registros auditáveis.
- Eventos de auditoria são append-only para a aplicação.
- Datas são armazenadas em UTC e exibidas no timezone do negócio.
- Operações concorrentes críticas usam transação e restrição no banco.
- Jobs devem ser idempotentes sempre que possível e registrar progresso e erro útil.

## Interface

- A interface deve ser rápida para o trabalho diário, não apenas visualmente atraente.
- Acessibilidade faz parte do aceite, não é melhoria posterior.
- Nunca comunicar estado somente por cor ou ícone.
- Usar Lucide React como conjunto padrão e evitar misturar estilos de ícones.
- Componentes compartilhados devem preservar semântica, teclado, foco e contraste.

## Quando abstrair

- Há pelo menos três ocorrências com lógica realmente equivalente.
- Existe responsabilidade única e nome claro.
- O benefício supera a indireção adicionada.
- Há uso atual ou reutilização confirmada no curto prazo.

## Quando não abstrair

- Existem apenas uma ou duas ocorrências.
- Os fluxos parecem similares, mas possuem regras diferentes.
- A motivação é apenas “talvez seja necessário”.
- A abstração dificulta leitura, teste ou remoção.

## Critérios para mudanças

- Produzir diffs pequenos e revisáveis.
- Explicar a regra de negócio atendida.
- Tornar trade-offs explícitos.
- Incluir teste proporcional ao risco.
- Atualizar documentação e matriz de permissões quando afetadas.
- Não misturar refatoração ampla com mudança funcional sem necessidade.
- Não duplicar fonte de verdade entre CAAB, CMS, calendário ou integrações.

