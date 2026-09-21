# Correção de segurança — escopo reduzido em 17/09/2026

Por pedido do usuário, retiradas mudanças com possível incompatibilidade com a VM.
Nenhuma implantação ou alteração de conta, banco, segredo ou serviço real realizada.

## Mantido

- Cadastro público bloqueado na lista de rotas e por disableSignUp do Better Auth.
  Login, recuperação e criação administrativa preservados. Fixtures SQL substituem
  signup nos testes, sem flag de runtime para reabrir cadastro público.
- Payload e seus pacotes de 3.88.0 para 3.89.0; transitivas DOMPurify 3.4.15,
  YAML 2.9.1 e esbuild 0.28.2. Audit registrado sem alertas conhecidos.

## Retirado antes da implantação

- Migration 0024, função legada e alteração das permissões editoriais implícitas.
- CSP/nonce, cabeçalhos adicionais, políticas de cache e renderização dinâmica.
- Rejeição adicional de credenciais de exemplo em ambiente público.
- Restrições de execução dos seeds e portas do Compose ao loopback.
- Testes exclusivos dessas mudanças; regressões originais da dev restauradas.

Arquivos correspondentes restaurados da dev 8f12db4. Nenhuma migration anterior
editada. Permanece o acesso editorial implícito de contas sem seleção individual.
Os achados retirados seguem pendentes. GitHub settings/workflows fora do escopo.

## Validação e limites

O conjunto anterior em a58b88e passou em todos os jobs do
[CI 35266679311](https://github.com/Komunick/caabnovo/actions/runs/35266679311).
O conjunto reduzido em `5850d56` também passou no [CI 35268301281](https://github.com/Komunick/caabnovo/actions/runs/35268301281). Esses resultados são históricos; a composição com a dev e documentação de 21/09 aguarda seu próprio CI.
Não equivale a teste na VM nem garante ausência absoluta de incompatibilidades.
A entrega reduzida não exige migration, troca de variável ou recriação de container.

Pesquisa mantida: [Payload 3.89.0](https://github.com/payloadcms/payload/releases/tag/v3.89.0),
[DOMPurify](https://github.com/cure53/DOMPurify/releases) e
[esbuild](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).
Payload mudou defaults de jobs; o projeto usa pg-boss e não configura tasks/autoRun
Payload. Audit sem alertas não garante ausência de falhas desconhecidas.
