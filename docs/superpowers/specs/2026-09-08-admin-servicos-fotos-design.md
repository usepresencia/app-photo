# Admin: serviços e fotos editáveis

**Data:** 2026-09-08
**Status:** aguardando revisão

## Problema

O site é hoje 100% estático: pacotes de serviço vivem em `packages.ts`, nichos em
`niches.ts`, e as 87 fotos do acervo vêm de um pipeline local (`data/` →
`optimize-photos.ts` → `photos.json`) que só roda na máquina de quem tem o
repositório. Qualquer atualização de preço, texto ou foto passa por um pull
request. A Denise (cliente) e o time interno precisam editar serviços e fotos
sem depender disso.

## Objetivo

Um admin onde a Denise e o time interno:

- Criam, editam e removem **nichos** (ensaios) e os **pacotes** de cada um
  (nome, preço, descrição, itens, foto, destaque).
- Fazem upload de fotos e controlam onde cada uma aparece no site — hero, "Quem
  sou", galeria da home, galeria de um nicho, foto de um pacote.
- Editam os textos fixos da seção "Quem sou" (capa, Profissão, Família).

## Fora de escopo (por agora)

- Depoimentos, dados de contato/WhatsApp e qualquer outro texto fixo da home
  não listado acima.
- Múltiplos papéis/permissões — um usuário autenticado tem acesso completo.
- Editor de layout/design — o admin edita conteúdo dentro da estrutura visual
  que já existe; não redesenha seções.

Este spec cobre os dois pedidos (serviços e fotos) juntos porque compartilham
a mesma base — auth, camadas, deploy. Nada impede implementar e entregar
serviços e fotos em fases separadas depois deste desenho.

## Achado que muda o modelo: "Evento" é dado duplicado de "Nicho"

`events.ts` mantém uma cópia manual de título/subtítulo/imagem de 3 dos 7
nichos, só para alimentar a seção "Eventos" da home (`Events.tsx`) — que
mostra praticamente o mesmo cartão que `Niches.tsx` já mostra para todos os 7.
As cópias já divergiram: o nicho `aniversario-e-eventos` chama-se "Aniversário
e Eventos" em `niches.ts` e "Aniversário infantil" em `events.ts`.

Este spec elimina `EventFormat` como entidade. A seção "Eventos" passa a ler
de `Niche`, filtrando os que têm `showAsEventTeaser: true`. Os dois
componentes (`Events.tsx`, `Niches.tsx`) continuam com layouts diferentes —
a diferença é só de apresentação, nunca foi de dado.

## Modelo de conteúdo

### `Photo` — metadado do arquivo, nada de posição

```ts
interface Photo {
  id: string;
  cloudinaryPublicId: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL: string; // gerado na hora do upload via transformação Cloudinary
  createdAt: string; // ISO 8601
}
```

### `Placement` — onde uma foto aparece

Durante o brainstorming eu tinha esboçado `placements` como um array dentro do
próprio documento `Photo`. Ajustei para coleção própria ao escrever este spec:
Firestore não indexa bem "dentro do array, o item com `surface: X` **e**
`refId: Y`" ao mesmo tempo — cada `Placement` como documento próprio permite
uma query direta (`where surface == X, where refId == Y, orderBy order`) sem
gambiarra de chave composta.

```ts
interface Placement {
  id: string;
  photoId: string;
  surface: "hero" | "quem-sou" | "home-gallery" | "niche" | "package";
  refId?: string; // slug do nicho, ou id do pacote, quando a surface aponta pra algo
  role?: string; // "capa" (niche) | "capa" | "polaroid" | "descricao" (quem-sou)
  order: number;
}
```

Uma foto pode ter vários placements (mesmo arquivo reaproveitado em duas
superfícies); remover uma foto de uma seção é apagar o placement, não a foto.

### `Niche`

```ts
interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  showAsEventTeaser: boolean; // substitui EventFormat
  order: number;
}
```

Capa e galeria vêm de `Placement` com `surface: "niche", refId: slug`: a capa
é o placement com `role: "capa"` (exatamente um por nicho); o resto, sem
`role`, ordenado por `order`, forma a galeria. Mesma convenção do `package`
abaixo — sempre explícito, nunca inferido pela posição.

### `Package` — filho de `Niche`

```ts
interface Package {
  id: string;
  nicheSlug: string;
  name: string;
  price: string;
  description: string; // novo
  items: string[];
  featured: boolean;
  order: number;
}
```

Foto do pacote vem de `Placement` com `surface: "package", refId: id`.

### `Profile` — documento único, seção "Quem sou"

```ts
interface Profile {
  capaCaption: string; // "Há vários anos marcando momentos"
  profissao: { titulo: string; eyebrow: string; paragrafos: string[] };
  familia: { titulo: string; paragrafos: string[]; legendaFoto: string };
}
```

Fotos (capa, as 2 de Profissão, a do altar) vêm de `Placement` com
`surface: "quem-sou"`, diferenciadas por `role`.

## Dois repositórios

**Público** (este repositório, `app-photo`) — Server Components lendo do
Firestore, sem autenticação. Continua no domínio raiz, `denisegalvao.com.br`.

**Admin** (`admin-photo`, repositório novo, `/Users/cesarpisa/Projects/lp-fotografia/admin-photo`)
— CRUD completo + upload, atrás de login. Domínio `admin.denisegalvao.com.br`.

Por serem domínios diferentes, o admin não precisa de troca de sessão entre
apps (como o `iosana-oliv` tem entre login e produto) — o site público nunca
precisa saber que uma sessão de admin existe.

Bootstrap do repositório: copiar a estrutura de `Presencia/web-admin-console`
(mesmo padrão de camadas, auth, Docker, CI já funcionando) e remover o que é
específico do Presencia (entidades, papéis/`platformRole`, troca de sessão
com app irmão) — não `create-next-app` do zero.

## Arquitetura (as duas camadas, mesmo padrão nos dois repos)

Confirmado nos três projetos que já usam isso (`Presencia/web-admin-console`,
`iosana-oliv`, `irizzi`):

```
src/api/domain/<entidade>/<Entidade>.ts             — entidade (interface)
src/api/domain/<entidade>/<Entidade>Repository.ts    — contrato
src/api/application/<entidade>/<Entidade>DTO.ts
src/api/application/<entidade>/<Verbo><Entidade>UseCase.ts  — um arquivo por caso de uso
src/api/presentation/<entidade>/<Entidade>ViewModel.ts      — toXViewModel(dto)
src/api/infrastructure/repositories/<Entidade>RepositoryImpl.ts   — Firestore
src/api/infrastructure/repositories/mock/Mock<Entidade>Repository.ts
src/api/infrastructure/repositories/RepositoryFactory.ts

src/actions/<entidade>.ts   — 'use server'; assertSession() → UseCase → ViewModel

src/lib/_components, _hooks, _utils   — compartilhado entre rotas
src/app/<rota>/_components            — exclusivo da rota
src/app/v1/health                     — healthcheck do deploy
```

No repo **público**, `src/actions/*` troca de implementação (arquivo estático
→ Firestore) mantendo a mesma assinatura — os componentes React (`Hero.tsx`,
`About.tsx`, `Niches.tsx` etc.) não mudam. `assertSession()` não existe aí:
leitura pública não passa por auth.

No repo **admin**, cada action chama `assertSession()` antes de qualquer
`UseCase` — um papel só, sem lista de roles.

Entidades: `niche`, `package`, `photo`, `placement`, `profile` (singleton —
sem `findAll`/`delete`, só `get`/`update`).

## Autenticação

**Decisão (revista depois de investigar os repos-irmãos):** nem o `Presencia`
nem o `iosana-oliv` têm uma página de login própria — os dois recebem o
token via handoff de um app público irmão que faz login "de verdade"
(fora do repo investigado). `admin-photo` não tem esse app irmão, então
precisa de login genuíno — e **sem SDK client do Firebase** (só
`firebase-admin`, igual o resto do projeto): o formulário (email/senha)
submete pra uma Server Action, que chama a API REST do Identity Toolkit
**do servidor**:

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<FIREBASE_WEB_API_KEY>
```

com `{ email, password, returnSecureToken: true }`, recebendo de volta um
`idToken`. Esse `idToken` nunca chega ao browser — a Server Action passa
ele direto pro `firebase-admin`:

```ts
const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS }); // 14 dias
cookieStore.set("session", sessionCookie, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
});
```

(`FIREBASE_WEB_API_KEY` já é um padrão estabelecido no `Presencia` — usado
lá só pra `accounts:sendOobCode`, redefinição de senha; aqui também serve
pro sign-in. É uma chave pública de identificação do projeto Firebase, não
uma credencial secreta — pode ir num `NEXT_PUBLIC_*` ou env de servidor,
tanto faz, mas não precisa do pacote `firebase` de jeito nenhum.)

Middleware do admin: checagem estrutural do cookie (3 segmentos JWT) na
edge, redireciona pra `/login` sem cookie — verificação criptográfica de
verdade (`auth.verifySessionCookie`) só no runtime Node, dentro de
`getSession()`/`assertSession()`, chamada por toda Server Action antes de
qualquer `UseCase`. **Sem papéis** (`platformRole` do Presencia não se
aplica — spec já decidiu "mesmo acesso, sem papéis"): `assertSession()`
só verifica "está autenticado", sem lista de roles permitidos.
`/v1/health` fica **fora do matcher do middleware** desde o início (o
`Presencia` parece ter um bug latente aqui — a rota de saúde não está na
lista de paths públicos, então o healthcheck do deploy provavelmente
recebe redirect em vez de 200; o `iosana-oliv` acerta isso excluindo a
rota do healthcheck do matcher).

Sem autocadastro: `scripts/seed-admin.ts` (baseado no do `Presencia`, sem
a parte de custom claims de papel) cria o primeiro usuário via
`auth.createUser()` e manda email de redefinição de senha via
`accounts:sendOobCode` (mesma API REST, mesmo `FIREBASE_WEB_API_KEY`).

## Invalidação de cache entre repositórios

**Achado durante o desenho do admin:** `revalidateTag`, chamado dentro de
uma Server Action do admin, só invalida o cache do **próprio processo
Next.js do admin** — não alcança o `app-photo`, que é outro repositório,
outro deploy, outro processo. Sem alguma ponte entre os dois, uma edição
no admin não aparece no site público até o cache expirar por conta
própria (ou nunca, se a página for 100% estática).

**Decisão:** webhook. `app-photo` ganha uma rota nova, protegida por
segredo compartilhado:

```
POST /api/revalidate
Authorization: Bearer <REVALIDATE_SECRET>
{ "tag": "niches" }              // ou "packages", "photos", "profile"
```

que chama `revalidateTag(tag)` do lado do `app-photo`. Toda Server Action
do admin que grava dado (`create`/`update`/`delete` de qualquer entidade)
chama essa rota via `fetch` depois de escrever no Firestore — best-effort:
se o webhook falhar (site público fora do ar, rede), a escrita no
Firestore já aconteceu; o cache do `app-photo` só fica desatualizado até
expirar, não há rollback nem retry (falha de invalidação de cache não é
motivo pra falhar a operação do admin).

Implica duas mudanças no **próprio `app-photo`**, fora do escopo do
repositório `admin-photo`: (1) a rota `/api/revalidate`; (2) as leituras
de `niche`/`package`/`photo`/`placement`/`profile` (via `RepositoryFactory`

- Server Components) precisam declarar as tags certas (`unstable_cache`
  ou `fetch` com `next: { tags: [...] }`, a decidir na implementação) pra
  `revalidateTag` ter o que invalidar.

## Fotos (Cloudinary)

**Upload:** direto do browser do admin com preset _unsigned_ — o arquivo vai
pro Cloudinary sem passar pelo servidor, como o `upload-cloudinary.mjs` do
`lp-jhuli-souza` já faz. Ao terminar, o client grava o `Photo` no Firestore
via Server Action — exatamente os campos de `photos/{id}` no "Contrato
Firestore de produção" (`cloudinaryPublicId`, `width`, `height`,
`blurDataURL`, esse buscado de uma transformação Cloudinary de 16px); sem
`alt` — os planos 3-5 do `app-photo` já decidiram que nada consome esse
campo hoje.

**Delete:** exclusão de asset exige a API secret, que não pode ir pro client
— passa por uma route handler assinada no admin, igual ao
`app/api/cloudinary-delete` do `Presencia`.

**Entrega:** `next-image-loader.ts` customizado, igual ao `lp-jhuli-souza`,
reescrevendo a URL do Cloudinary com `f_auto,q_auto,w_<width>` — resize e
formato ficam por conta do Cloudinary, não do Next.

## Revalidação

Nichos e fotos deixam de ser conhecidos em build time, então `/ensaios/[slug]`
sai de `generateStaticParams` puro para renderização com cache por tag.
Como o admin roda num processo/repositório separado, `revalidateTag` sozinho
não alcança esse cache — ver "Invalidação de cache entre repositórios" pro
mecanismo real (webhook).

## Migração do acervo atual

Script no mesmo espírito do `upload-cloudinary.mjs`, mas gravando Firestore em
vez de só um manifest:

1. Percorre as 87 fotos já processadas em `public/fotos/`.
2. Sobe cada uma pro Cloudinary (preset unsigned), gera o `blurDataURL`.
3. Grava o `Photo`.
4. Deriva os `Placement`s da lógica atual: `getHeroPhotos()` →
   `surface: "hero"`; `family.slice(0,4)` de `getAboutPhotos()` →
   `surface: "quem-sou"` com o `role` correspondente a cada posição;
   `getGalleryPhotos()` → `surface: "home-gallery"`; galeria de cada nicho em
   `niches.ts` → `surface: "niche", refId: slug`.
5. Migra `packages.ts` para documentos `Package` (sem foto própria ainda — a
   Denise associa depois pelo admin) e `niches.ts` para `Niche`, com
   `showAsEventTeaser: true` nos 3 slugs que hoje estão em `events.ts`.
6. Migra os textos hardcoded de `About.tsx` para o documento `Profile`.

Roda uma vez, contra o Firestore/Cloudinary de produção, antes do primeiro
deploy da versão dinâmica. O site fica visualmente idêntico no dia da troca.

## Contrato Firestore de produção

As interfaces em "Modelo de conteúdo" descrevem o domínio como o código lê
hoje — não necessariamente o que fica gravado no documento. Esta seção é a
referência definitiva de **o que grava no Firestore de verdade**, pros
planos 6-10 (admin) escreverem compatível sem precisar ler
`PhotoRepositoryImpl` pra descobrir. Sempre que os dois divergirem, esta
seção vale — os planos 1-4 já implementaram e testaram o formato abaixo.

### `niches/{slug}`

```ts
{
  title: string;
  subtitle: string;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  showAsEventTeaser: boolean;
  order: number;
  eventOrder: number | null;
}
```

`slug` é o próprio ID do documento, não um campo dentro dele.

### `packages/{id}`

```ts
{
  nicheSlug: string;
  name: string;
  price: string;
  description: string;
  items: string[];
  featured: boolean;
  order: number;
}
```

`id` é gerado (`"<nicheSlug>-<índice>"`, ex. `"gestante-0"`), não um slug
natural — é o próprio ID do documento.

### `photos/{id}`

```ts
{
  cloudinaryPublicId: string; // NÃO é a URL — só o public_id do Cloudinary
  width: number;
  height: number;
  blurDataURL: string;
}
```

`id` é o próprio ID do documento (a migração usa o `slug` de
`photos.json`, ex. `"profissional-01"`, também como `cloudinaryPublicId`).
`PhotoRepositoryImpl` (só ele) resolve `cloudinaryPublicId` pra uma URL de
entrega via `buildDeliveryUrl` — o domínio (`Photo.src`) nunca vê
`cloudinaryPublicId` diretamente. Gravar `src` aqui em vez de
`cloudinaryPublicId` quebra a resolução: `PhotoRepositoryImpl` não sabe ler
uma URL pronta.

### `placements/{id}`

```ts
{
  photoId: string; // referencia photos/{id}
  surface: "hero" | "quem-sou" | "home-gallery" | "niche" | "package";
  refId: string | null; // slug do nicho, ou id do pacote; null em hero/quem-sou/home-gallery
  role: string | null;
  order: number;
}
```

`id` é auto-gerado pelo Firestore — sem significado, não precisa ser
estável entre migrações.

### `profile/main`

```ts
{
  capaCaption: string;
  profissao: { titulo: string; eyebrow: string; paragrafos: string[] };
  familia: { titulo: string; paragrafos: string[]; legendaFoto: string };
}
```

Documento único, ID sempre `"main"` — não é uma coleção com múltiplos
documentos.

## Deploy

Dois serviços novos no `docker-compose.yml` da VPS compartilhada, ao lado dos
que já existem (`Presencia`, etc.):

| serviço | domínio                     | repo           |
| ------- | --------------------------- | -------------- |
| `app`   | `denisegalvao.com.br`       | público (este) |
| `admin` | `admin.denisegalvao.com.br` | admin (novo)   |

Cada um com Dockerfile multi-stage (output `standalone` do Next, mesmo
formato do `Presencia`) e workflow de CD próprio: build → push pro GHCR →
SSH → troca de tag num `.env.<serviço>` (na VPS, fora do repo) → `docker
compose pull/up --force-recreate <serviço>` → `curl -f /v1/health`; se
falhar, reverte a tag e sobe a versão anterior de novo (rollback
automático, confirmado no `CD.yml` do `Presencia`). `/v1/health` fica
fora do matcher do middleware (ver "Autenticação") — sem isso o
healthcheck recebe redirect em vez de 200 e o deploy nunca valida.

`firestore.indexes.json` fica versionado no repo mas **sem deploy
automatizado** — precisa rodar `firebase deploy --only firestore:indexes`
manualmente (com `firebase-tools`, autenticado, `.firebaserc` apontando
pro projeto certo) pelo menos uma vez, cedo, pro índice composto de
`Placement` (`surface`, `refId`, `order`) existir antes de qualquer
query real contra ele.

Acesso à VPS: eu recebo as credenciais SSH e configuro os dois serviços no
compose existente.

## Testes

Mesmo padrão dos repos-irmãos: um `Mock<Entidade>Repository` por entidade,
injetado no lugar do `RepositoryImpl` quando não há Firebase disponível (dev
local, CI). `RepositoryFactory` decide qual usar por env var, como no
`Presencia`. Use cases testados via Vitest contra o mock, sem precisar de
Firebase real para rodar `npm run test`.

## Riscos / pontos de atenção

- **Cache do site público muda de modelo, e agora depende de um webhook
  entre repositórios.** Hoje é 100% estático; passa a depender do admin
  chamar `POST /api/revalidate` (app-photo) corretamente em toda escrita.
  Uma chamada esquecida deixa a página pública desatualizada
  silenciosamente até o cache expirar por conta própria — vale um teste
  de integração cobrindo isso, e logar (não falhar a operação) quando o
  webhook não responder.
- **Placement é uma coleção nova, sem precedente direto nos repos-irmãos.**
  As entidades que vi lá (`coupon`, `tenant`, `user`) não tinham esse padrão
  de "referência genérica com surface + refId opcional". É a peça mais nova
  deste desenho — vale prototipar a query antes de construir o CRUD completo
  em cima dela.
- **`packages.ts` tem 14 pacotes hoje**, distribuídos de forma desigual entre
  6 dos 7 nichos (2 pacotes em quatro deles, 3 em `casamento-civil` e em
  `aniversario-e-eventos`; `making-of-da-noiva` está vazio, aguardando
  documento da cliente) — não é 2 por nicho uniformemente. `items` já é texto
  livre da cliente em todos. A migração precisa preservar esse texto
  exatamente — não é reescrita, é transcrição. `featured` é opcional no tipo
  atual (`featured?: boolean`); a migração grava `false` explícito quando
  ausente.

## Decisões já tomadas neste brainstorming

| decisão              | escolha                                                                                |
| -------------------- | -------------------------------------------------------------------------------------- |
| Infra de dados       | Firebase (Firestore) + Cloudinary                                                      |
| Usuários admin       | Denise + interno, mesmo acesso, sem papéis                                             |
| Escopo de nichos     | Admin cria/edita/remove nichos inteiros, não só pacotes                                |
| Escopo de fotos      | Todas as fotos do site (não só galerias de nicho)                                      |
| Migração do acervo   | Sim, com otimização via Cloudinary (padrão `lp-jhuli-souza`)                           |
| Decomposição         | Um spec cobrindo os dois, implementável em fases                                       |
| Evento vs Nicho      | Eliminar `EventFormat`, virar flag em `Niche`                                          |
| Modelo de "Quem sou" | Documento único e específico (`Profile`), não abstração genérica                       |
| Hospedagem           | Sai do Netlify, VPS compartilhada com os outros projetos                               |
| Repos                | Dois — público (este) e admin (novo)                                                   |
| Domínios             | `denisegalvao.com.br` (público) / `admin.denisegalvao.com.br` (admin)                  |
| Testes               | `Mock<Entidade>Repository` por entidade, padrão dos repos-irmãos                       |
| Nome do repo admin   | `admin-photo`, sibling de `app-photo`                                                  |
| Bootstrap do admin   | Copiar `Presencia/web-admin-console`, não `create-next-app`                            |
| SDK do Firebase      | Só `firebase-admin` — sign-in via REST (`accounts:signInWithPassword`), sem SDK client |
| Sessão               | `createSessionCookie` (14 dias), não o ID token cru                                    |
| Invalidação de cache | Webhook (`POST /api/revalidate` no app-photo), não revalidação por tempo               |
| Escopo do plano 6    | Scaffold + auth + deploy + webhook — sem nenhuma entidade de conteúdo ainda            |
