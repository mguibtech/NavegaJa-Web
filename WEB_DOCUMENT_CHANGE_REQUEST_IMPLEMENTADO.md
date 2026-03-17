# Implementacao Web: Document Change Request

## Objetivo

Este documento registra exatamente o que foi implementado no painel web/admin neste repositório para o fluxo de alteracao de documentos do capitao, para comparacao com a implementacao do backend.

Escopo deste documento:

- somente o projeto web/admin
- sem backend
- sem app React Native

## Arquivos alterados

- `src/lib/api.ts`
- `src/app/dashboard/verifications/page.tsx`
- `src/components/layout/header.tsx`

## Resumo do que foi implementado

### 1. Camada de API do web

Implementado em `src/lib/api.ts`:

- tipo `CaptainDocumentType` com os valores:
  - `SELFIE`
  - `LICENCA_NAVEGACAO`
  - `CERTIFICADO_SEGURANCA`
- tipo `DocumentChangeRequestStatus`:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
- interface `DocumentChangeRequest`
- interface de `reviewer` no request
- interface `DocumentChangeRequestListResponse` como lista simples
- helper `normalizeDocumentChangeRequestsResponse()`

### 2. Endpoints integrados no web

Implementado em `src/lib/api.ts`:

- `GET /document-change-request`
- `PATCH /document-change-request/:id/approve`
- `PATCH /document-change-request/:id/reject`

Detalhes:

- `GET /document-change-request` aceita filtros opcionais:
  - `status`
  - `documentType`
  - `userId`
- o web passou a buscar requests pendentes com:
  - `GET /document-change-request?status=PENDING`
- o reject individual envia:

```json
{
  "rejectionReason": "..."
}
```

## Ajustes na tela de verificacoes

Implementado em `src/app/dashboard/verifications/page.tsx`.

### 1. Nova leitura da fila de requests

Foi adicionada query para:

- `GET /document-change-request?status=PENDING`

Esses requests sao exibidos em uma nova secao:

- `Solicitacoes de Alteracao de Documento`

Cada card mostra:

- capitao
- email
- tipo do documento
- indicacao se eh substituicao ou primeiro documento do tipo
- data de criacao

### 2. Overlay de revisao individual

Ao clicar no card da solicitacao, o web abre um overlay com:

- dados basicos do capitao
- tipo do documento
- data da solicitacao
- comparacao entre:
  - `Documento Atual`
  - `Novo Documento Enviado`

O overlay permite:

- aprovar via `PATCH /document-change-request/:id/approve`
- rejeitar via `PATCH /document-change-request/:id/reject`

### 3. Atualizacao local da UI apos aprovacao/rejeicao

Depois de aprovar ou rejeitar um request individual:

- a solicitacao eh removida do cache local de `document-change-requests`
- a UI sai da tela de detalhe
- o motivo de rejeicao eh limpo

Isso foi implementado para evitar depender de refresh manual da pagina.

### 4. Ajuste da semantica da fila de capitaes

O web foi adaptado ao novo contrato de:

- `GET /admin/boats/pending`

Agora o entendimento no painel eh:

- `pendingCaptains` representa capitaes com documentos pendentes
- nao apenas verificacao inicial de conta

Mudancas aplicadas:

- titulo da secao alterado para `Capitaes com Documentos Pendentes`
- subtitulo do overlay alterado para refletir solicitacoes pendentes
- card do capitao passou a considerar:
  - `selfieUrl`
  - `licensePhotoUrl`
  - `certificatePhotoUrl`
  - `documentChangeRequests`

### 5. Ajuste do preview/documentos exibidos no capitao

No detalhe do capitao, o web agora usa:

- `licensePhotoUrl` como preview da licenca
- `certificatePhotoUrl` como preview do certificado
- `selfieUrl` como preview da selfie

Os labels foram alinhados para:

- `Licenca de Navegacao`
- `Certificado de Seguranca`
- `Selfie`

O badge extra do overlay do capitao mostra a quantidade de solicitacoes pendentes quando existir `documentChangeRequests` com status `PENDING`.

## Ajustes no header/notificacoes

Implementado em `src/components/layout/header.tsx`.

### 1. Query de requests pendentes

Foi adicionada query para:

- `GET /document-change-request?status=PENDING`

### 2. Notificacoes novas

O sino do header agora inclui notificacoes para requests pendentes com o rótulo:

- `Alteracao de documento pendente`

Tambem foi ajustado o rótulo de capitao para:

- `Capitao com documentos pendentes`

## Contratos do backend assumidos pelo web

O web passou a assumir estes contratos:

### 1. `GET /document-change-request`

Retorno esperado:

```ts
type DocumentChangeRequestListResponse = DocumentChangeRequestResponse[];
```

### 2. `PATCH /document-change-request/:id/reject`

Body esperado:

```ts
{
  rejectionReason: string;
}
```

### 3. `GET /admin/boats/pending`

O web assume que `pendingCaptains` pode conter:

- `selfieUrl`
- `licensePhotoUrl`
- `certificatePhotoUrl`
- `documentChangeRequests`

E que os campos `licensePhotoUrl` e `certificatePhotoUrl` ja podem refletir o preview do documento pendente conforme o backend definiu.

## Compatibilidade mantida

O fluxo legado do painel para review em lote por capitao foi mantido:

- `PATCH /admin/users/:id/verify`

No web, esse fluxo continua sendo usado quando o ADM aprova/rejeita pelo card detalhado do capitao.

Interpretacao esperada no backend:

- `verified: true` aprova as requests pendentes do capitao em lote
- `verified: false` rejeita as requests pendentes do capitao em lote

## Nao foi implementado neste repositório

Itens fora do escopo deste workspace:

- criacao da tabela `document_change_requests`
- logica de negocio do backend
- validacoes de upload no servidor
- bloqueio de alteracao no app React Native
- criacao de request pelo app via `POST /document-change-request`
- onboarding via `POST /users/kyc/submit`
- tela de status KYC no app

## Validacao executada

Foi executado:

```bash
npx eslint src\lib\api.ts src\app\dashboard\verifications\page.tsx src\components\layout\header.tsx
```

Resultado:

- sem erros

## Checklist para comparar com o backend

Compare no backend se os itens abaixo batem com o que o web esta consumindo:

- `GET /document-change-request` retorna lista simples
- `PATCH /document-change-request/:id/reject` espera `rejectionReason`
- enum do certificado eh `CERTIFICADO_SEGURANCA`
- `pendingCaptains` inclui `documentChangeRequests`
- `pendingCaptains` inclui `selfieUrl`
- `licensePhotoUrl` e `certificatePhotoUrl` do pending ja servem como preview
- `PATCH /admin/users/:id/verify` continua funcional como aprovacao/rejeicao em lote

## Referencia rapida do comportamento atual do web

- Requests individuais pendentes aparecem em secao propria
- Requests individuais podem ser aprovados ou rejeitados
- Rejeicao individual usa `rejectionReason`
- Header mostra notificacoes de requests pendentes
- Fila de capitaes foi ajustada para documentos pendentes
- Review em lote por capitao foi preservado
