# Rascunho/Publicar — admin-photo + app-photo

**Data:** 2026-09-09
**Status:** aprovado, aguardando plano de implementação

## Contexto

Hoje, toda ação de escrita do admin-photo (`createNiche`, `updatePackage`,
`deletePlacement`, `saveProfile` etc.) grava direto nas mesmas coleções
do Firestore que o app-photo lê pro site real, e chama
`callRevalidateWebhook(tag)` logo em seguida — ou seja, qualquer save
vira ar imediatamente. Isso vale tanto pras telas antigas de CRUD
(`/niches`, `/packages`, `/photos`, `/placements`, `/profile`) quanto
pro `/preview` (edição inline por clique, criação, exclusão — specs
anteriores).

O pedido agora: salvar no admin não deve mais publicar na hora. Precisa
existir um estado de **rascunho** (mudanças pendentes, só visíveis pro
admin) separado do estado **live** (o que o site real mostra), com uma
ação explícita de **Publicar**. Essa regra vale pra tudo que o admin já
salva hoje, não só pra uma feature nova — é uma mudança de fundação,
anterior a qualquer outra coisa que dependa dela (inclusive a edição
inline de texto discutida antes desta spec, que fica adiada pra depois
desta).

## Decisão de arquitetura

Cada uma das 5 entidades (niche, package, placement, photo, profile)
ganha uma coleção-espelho `_draft` no Firestore, mesmo schema da
coleção live:

```
niches       / niches_draft
packages     / packages_draft
placements   / placements_draft
photos       / photos_draft
profile      / profile_draft   (documento único, profile_draft/main)
```

O admin-photo (as 5 `*RepositoryImpl.ts` em
`src/api/infrastructure/repositories/`, hoje cada um com uma constante
`const COLLECTION = '...'`) passa a apontar **só** pras coleções
`_draft` — tanto o `/preview` quanto as telas antigas de CRUD operam
exclusivamente sobre rascunho. As telas antigas continuam existindo
(spec de removê-las é outra, ainda adiada) mas passam a editar
rascunho, não o live, sem precisar de nenhuma mudança de UI própria —
só a troca do nome da coleção por baixo.

O app-photo (as 5 `*RepositoryImpl.ts` equivalentes em
`src/api/infrastructure/repositories/`) ganha leitura **dual**: por
padrão lê a coleção live, cacheada com `unstable_cache` exatamente como
hoje; em "modo rascunho" (só ativado por uma sessão de preview do
admin, nunca por um visitante real) lê a coleção `_draft` direto do
Firestore, sem `unstable_cache` — tráfego de rascunho é baixo (só o
próprio admin navegando dentro do iframe do `/preview`), então
prioriza corretude sobre performance, evitando reencontrar o mesmo
problema de cache obsoleto já resolvido à força (`rm -rf .next`) nesta
sessão.

Nenhuma escrita do admin chama `callRevalidateWebhook` diretamente mais
— isso vira exclusividade de duas ações novas, **Publicar** e
**Sincronizar**, descritas abaixo.

## Modelo de dados

### Tombstone (exclusão em rascunho)

`delete()` num repositório de rascunho nunca remove o documento de
verdade — grava `_deleted: true` no doc de rascunho (tombstone). Todo
`findAll()`/leitura de lista dos repositórios de rascunho filtra
documentos tombstoned, então uma entidade "excluída" já some da UI do
admin normalmente, igual hoje. `profile` não tem conceito de exclusão
(documento único, sempre existe) — tombstone não se aplica a ele.

Motivo de tombstone em vez de apagar: **Publicar** precisa saber que
esse item deve ser removido do live também (não dá pra inferir isso só
de "o doc não existe mais em rascunho" sem guardar o que foi apagado
de propósito). **Sincronizar** desfaz um tombstone de graça — ele
sobrescreve o rascunho inteiro a partir do live, e o live nunca teve
esse `_deleted`.

### `meta/publishState`

Documento único novo, controla o estado do fluxo:

```ts
interface PublishState {
  hasPendingChanges: boolean;
  lastPublishedAt: string | null; // ISO 8601
  lastSyncedAt: string | null;
}
```

Toda escrita de rascunho (criar/atualizar/excluir, nas 5 entidades)
termina chamando um helper novo, `markDraftDirty()`
(`src/actions/_lib/markDraftDirty.ts` no admin-photo), que faz
`meta/publishState.hasPendingChanges = true` — substitui a chamada a
`callRevalidateWebhook(tag)` que essas ações faziam antes, no mesmo
ponto do código.

## O que muda no admin-photo

### Repositórios — troca de coleção

Mecânica, nos 5 arquivos (`NicheRepositoryImpl.ts`,
`PackageRepositoryImpl.ts`, `PlacementRepositoryImpl.ts`,
`PhotoRepositoryImpl.ts`, `ProfileRepositoryImpl.ts`): `const
COLLECTION = 'niches'` vira `const COLLECTION = 'niches_draft'` (e
equivalentes). `PlacementRepositoryImpl`/`PackageRepositoryImpl`/
`NicheRepositoryImpl`/`PhotoRepositoryImpl` ganham o filtro de
tombstone em `findAll()` — filtrado em JS depois do `.get()`
(`snapshot.docs.filter(d => !d.data()._deleted)`), não via
`.where('_deleted', ...)` no Firestore: um filtro de igualdade em
memória evita de propósito a combinação de inequality-filter +
`orderBy` em campo diferente (exigiria índice composto novo), e o
volume de documentos aqui (dezenas, não milhares) não justifica
empurrar esse filtro pro Firestore. `delete()` vira `.update({
_deleted: true })` em vez de `.delete()`. `ProfileRepositoryImpl` só
troca o nome da coleção — sem tombstone.

### Ações existentes — `callRevalidateWebhook` → `markDraftDirty`

Nos 5 arquivos de `src/actions/*.ts`, toda chamada a
`callRevalidateWebhook(tag)` (12 pontos ao todo: 3× niches, 3×
packages, 3× placements, 2× photos, 1× profile) vira
`markDraftDirty()`. `callRevalidateWebhook` continua existindo — só
passa a ser chamado exclusivamente por `publishDraft()`.

### `src/actions/publish.ts` (arquivo novo)

```ts
export async function getPublishState(): Promise<PublishState> { ... }

export async function publishDraft(): Promise<void> {
  await assertSession();
  // Para niches/packages/placements/photos:
  //   lê todos os docs de "<entidade>_draft";
  //   pra cada um: se _deleted, apaga o doc live correspondente
  //     (best-effort, ignora se já não existir) e apaga o doc de
  //     rascunho (tombstone cumpriu seu papel, unico lugar do fluxo
  //     que hard-deleta um doc de rascunho);
  //   senão, grava (.set()) o mesmo id/dados na coleção live,
  //     removendo o campo _deleted se presente (não deveria estar).
  // Para profile: lê profile_draft/main, grava direto em profile/main
  //   (sem tombstone, documento sempre existe).
  // Batch por coleção (getAdminDb().batch(), bem abaixo do limite de
  //   500 operações dado o volume atual de dados).
  // Depois de tudo: callRevalidateWebhook pras 4 tags existentes
  //   ("niches", "packages", "placements", "profile" — fotos
  //   compartilham a tag "placements", igual as ações de foto já
  //   fazem hoje).
  // Por fim: meta/publishState.hasPendingChanges = false,
  //   lastPublishedAt = now().
}

export async function syncDraftFromLive(): Promise<void> {
  await assertSession();
  // Para as 5 entidades: lê a coleção live inteira; apaga todos os
  //   docs existentes em "<entidade>_draft" (wipe completo, via
  //   batch); grava de novo cada doc lido do live dentro de
  //   "<entidade>_draft", sem nenhum _deleted (o live nunca teve essa
  //   marca). Pra profile: sobrescreve profile_draft/main a partir de
  //   profile/main.
  // Não chama callRevalidateWebhook — nada mudou pro lado do live/site
  //   real, só o rascunho do admin foi redefinido.
  // meta/publishState.hasPendingChanges = false,
  //   lastSyncedAt = now().
}
```

### `/preview` — abas Rascunho/Live + botões

`src/app/preview/page.tsx` passa a buscar `getPublishState()` também,
e `PreviewFrame` ganha duas abas:

- **Rascunho** (ativa por padrão): iframe aponta pra
  `${APP_PHOTO_URL}/api/preview/enter?token=${REVALIDATE_SECRET}` (ver
  seção do app-photo abaixo) — todo o fluxo de edição/criação/exclusão
  já existente continua funcionando aqui, sem mudança de comportamento
  visível pro admin além de "isso não é mais o site real, é o
  rascunho".
- **Live**: iframe aponta direto pra `${APP_PHOTO_URL}/` — sem cookie,
  sem token, mostra exatamente o que um visitante real vê agora.
  Read-only (os cliques de edição continuam disparando mensagens, mas
  não faz sentido editar o live diretamente — a forma mais simples de
  não abrir essa porta é o `PreviewOverlay` do app-photo simplesmente
  não ativar o modo preview quando não há cookie de rascunho, então
  `data-editable`/`data-addable` ficam inertes ali, exatamente como já
  ficam pra um visitante comum).

Botões **Publicar** e **Sincronizar** aparecem só na aba Rascunho,
habilitados apenas quando `publishState.hasPendingChanges` é `true`.
Cada um abre um `ConfirmationDialog` antes de chamar sua action —
Publicar em variante normal ("isso vai colocar todas as mudanças
pendentes no ar"), Sincronizar em variante `destructive` ("isso vai
descartar todas as mudanças pendentes, voltando ao que está publicado
agora") — mesmo padrão de confirmação já usado em toda exclusão desta
sessão.

## O que muda no app-photo

### Repositórios — leitura dual

Os 5 arquivos em `src/api/infrastructure/repositories/*.ts` ganham um
parâmetro (`isDraft: boolean`, decidido uma vez em
`RepositoryFactory.ts` a partir de um cookie — ver rota abaixo) que
escolhe entre:

- **live** (`isDraft` falso, comportamento de hoje, sem mudança): lê
  `COLLECTION`, resultado envolto em `unstable_cache` com a mesma tag
  de sempre.
- **rascunho** (`isDraft` verdadeiro): lê `${COLLECTION}_draft` direto
  do Firestore, sem `unstable_cache` — sempre fresco.

### `/api/preview/enter` (rota nova)

`src/app/api/preview/enter/route.ts` — `GET`, recebe `?token=` e
`?next=` (default `/`). Valida `token === env.REVALIDATE_SECRET`
(mesmo segredo já compartilhado com o webhook de revalidação); se
válido, seta um cookie `httpOnly` (`preview_draft=1`) e redireciona
pra `next`; se inválido, responde 401 sem setar cookie. A partir daí,
toda navegação dentro do iframe (mesma origem, o cookie já está
setado) é automaticamente modo rascunho — não precisa repetir o token
em cada link interno do site.

`RepositoryFactory.ts` lê `cookies().get('preview_draft')` (API de
Server Components do Next) pra decidir `isDraft` antes de instanciar
cada repositório.

### `PreviewFrame` — só faz handshake com a aba Rascunho

Hoje existe um único iframe/`iframeRef`, e `PreviewFrame` responde
`ACK` a qualquer `PING` recebido, sem checar a origem — com duas abas
(dois iframes montados, um por aba) isso precisa mudar: cada aba
mantém sua própria `ref`, e o handler de `message` só responde `ACK`
quando `event.source === rascunhoIframeRef.current?.contentWindow`.
Um `PING` vindo do iframe da aba Live é ignorado (sem `ACK`) — o
`PreviewOverlay` daquele lado nunca completa o handshake, então nunca
ativa `data-preview-active`, e os afordances de clique/hover/lixeira
continuam inertes, exatamente como pra um visitante comum. Nenhuma
mudança necessária em `PreviewOverlay`/app-photo pra isso — o
app-photo não sabe (nem precisa saber) que existem duas abas, só
reage a receber ou não um `ACK`.

## Migração / seed

As coleções `_draft` começam vazias — sem seed, o admin veria tudo em
branco na primeira vez (nenhum nicho, pacote, foto). Dois ajustes:

- **Dev local** (`admin-photo/scripts/seed-emulator.ts`): passa a
  gravar cada entidade nas duas coleções (live e `_draft`) com os
  mesmos dados do `MockXRepository` — o emulador já é efêmero
  (recriado a cada `npm run dev`), então "seed" já significa popular
  do zero; só precisa popular os dois lados.
- **Firestore real**: um script único
  (`admin-photo/scripts/seed-draft-from-live-tmp.ts`, mesmo padrão de
  script descartável desta sessão — roda uma vez, referenda), rodado
  antes de esse recurso entrar no ar de verdade, que copia cada
  coleção live inteira pra `_draft` (mesma lógica de
  `syncDraftFromLive()`, mas roda fora do runtime do Next, direto via
  Admin SDK, já que nesse momento não há ainda uma sessão de admin
  logada rodando a action).

## Fluxo de dados — Publicar

1. Admin clica "Publicar" na aba Rascunho → `ConfirmationDialog`.
2. Confirma → `publishDraft()`.
3. Pra cada entidade: lê `_draft`, resolve tombstones (apaga live +
   limpa o rascunho) e grava o resto no live via batch.
4. Chama `callRevalidateWebhook` pras 4 tags.
5. `meta/publishState` atualiza (`hasPendingChanges: false`,
   `lastPublishedAt`).
6. Toast de sucesso; botão Publicar volta a ficar desabilitado (sem
   mudanças pendentes); aba Live, se recarregada, já reflete o
   publicado.

## Fluxo de dados — Sincronizar

1. Admin clica "Sincronizar" na aba Rascunho → `ConfirmationDialog`
   (`variant="destructive"`).
2. Confirma → `syncDraftFromLive()`.
3. Pra cada entidade: lê live inteiro, apaga todo o rascunho atual,
   grava de novo a partir do live.
4. `meta/publishState` atualiza (`hasPendingChanges: false`,
   `lastSyncedAt`) — sem chamar o webhook (nada mudou pro lado
   público).
5. Toast de sucesso; iframe da aba Rascunho recarrega, mostrando
   exatamente o que está publicado agora.

## Erros e casos extremos

- **Publicar falha no meio do caminho** (ex.: uma das 4 coleções falha
  ao gravar): as coleções já processadas ficam publicadas, as
  seguintes não — estado inconsistente entre entidades é possível.
  Mitigação realista dado o volume de dados (não um sistema
  transacional distribuído): logar qual entidade falhou, toast de erro
  específico, `hasPendingChanges` continua `true` (nada foi
  zerado), admin tenta Publicar de novo — as entidades já publicadas
  seriam regravadas com o mesmo valor (idempotente), sem duplicar
  nada.
- **Token de `/api/preview/enter` incorreto/ausente**: 401, cookie não
  é setado, iframe da aba Rascunho carrega o site em modo live por
  engano (sem crash) — o `PreviewOverlay` simplesmente não ativa,
  então também não aparece nenhum afordance de edição, o que já
  sinaliza visualmente que algo está errado.
- **Sincronizar com o rascunho já igual ao live**: idempotente, não
  quebra nada — só reescreve os mesmos dados.
- **Excluir uma entidade no rascunho que nunca foi publicada** (criada
  e apagada sem publicar entre os dois): tombstone é gravado do mesmo
  jeito; no Publicar, a tentativa de apagar o doc live correspondente
  simplesmente não encontra nada pra apagar (best-effort, ignora) —
  sem erro.
- **Segredo do token no HTML da aba Rascunho**: `/preview` já é uma
  página autenticada (Firebase Auth); embutir `REVALIDATE_SECRET` no
  `src` do iframe renderizado server-side é visível a quem inspecionar
  a página, mas só pra um admin já autenticado — aceito como
  compatível com o nível de risco já existente no site (portfólio,
  sem dado sensível de terceiros), não um segredo novo pra rotacionar
  ou emitir por sessão.

## Testes

- Tombstone/filtro (`findAll` ignora `_deleted`) e a lógica pura de
  "resolver draft → live" (dado uma lista de docs de rascunho com
  tombstones misturados, decide quais apagar e quais gravar) —
  testados isoladamente como função pura, mesmo padrão de
  `EDIT_HANDLERS`/`getSuggestedPhotoIds` já usado nesta sessão, sem
  precisar de um Firestore de verdade.
- `RepositoryFactory` (app-photo) — já tem teste hoje
  (`RepositoryFactory.test.ts`); ganha casos novos pra confirmar que
  `isDraft` decide a coleção certa.
- `/api/preview/enter` — teste de rota: token certo seta cookie e
  redireciona, token errado retorna 401 sem cookie.
- Sem teste de integração fim-a-fim do Publicar/Sincronizar contra um
  Firestore real — smoke test manual (emulador local) documentado no
  plano de implementação, mesmo padrão já usado nesta sessão pra fluxos
  que tocam Firestore de verdade.

## Riscos / pontos de atenção

- **Maior mudança de fundação desta sessão** — toca os 5 repositórios
  dos dois repos, todas as 12 chamadas de `callRevalidateWebhook`
  existentes, e introduz 2 ações novas com lógica de
  reconciliação (draft↔live) que não existia antes. Candidato forte a
  virar mais de um plano de implementação (ex.: um plano só pra
  coleções `_draft` + `markDraftDirty` nas ações existentes, outro só
  pra Publicar/Sincronizar, outro só pro modo rascunho do app-photo +
  UI de abas) — decidir na hora de escrever o(s) plano(s).
- **Publicar não é atômico entre as 4 coleções** — ver "Erros e casos
  extremos"; aceito dado o volume de dados e o perfil de risco do
  site, não um sistema financeiro.
- **Esta spec bloqueia a spec de edição inline de texto** (discutida
  antes desta, ainda não escrita) — aquela spec precisa assumir que
  toda escrita vai pro rascunho, não pro live, e vai referenciar esta
  aqui como pré-requisito.

## Decisões já tomadas neste brainstorming

| decisão                                         | escolha                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Escopo do rascunho                              | Tudo que o admin já salva hoje (niche, package, placement, photo, profile) — não só a feature de edição inline de texto |
| Onde o rascunho fica guardado                   | Coleções `_draft` paralelas por entidade (não sub-campos no mesmo doc, não um log de mudanças)                          |
| Como o `/preview` continua mostrando o rascunho | App-photo ganha modo rascunho real (cookie + rota de entrada), organizado como duas abas no admin: Rascunho e Live      |
| O que a aba Live mostra                         | O site exatamente como está publicado agora, sem nenhum sinal de rascunho, read-only na prática                         |
| Botão de descartar mudanças pendentes           | Sim — "Sincronizar", sobrescreve o rascunho inteiro a partir do live, inverso do Publicar                               |
