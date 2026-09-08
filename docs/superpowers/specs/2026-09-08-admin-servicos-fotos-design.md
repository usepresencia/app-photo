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

`events.ts` mantém uma cópia manual de título/subtítulo/imagem de 3 dos 6
nichos, só para alimentar a seção "Eventos" da home (`Events.tsx`) — que
mostra praticamente o mesmo cartão que `Niches.tsx` já mostra para todos os 6.
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

**Admin** (repositório novo) — CRUD completo + upload, atrás de login.
Domínio `admin.denisegalvao.com.br`.

Por serem domínios diferentes, o admin não precisa de troca de sessão entre
apps (como o `iosana-oliv` tem entre login e produto) — o site público nunca
precisa saber que uma sessão de admin existe.

> Nome do repositório admin e o rename de `app-photo` ficam em aberto — não
> bloqueia o desenho, ajusta na hora de criar o repositório.

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

Firebase Auth no client do admin → ID token → route handler
(`app/api/auth/session`) cria cookie de sessão httpOnly via `firebase-admin`,
igual ao `iosana-oliv`. Middleware do admin redireciona pra `/login` sem
cookie válido.

## Fotos (Cloudinary)

**Upload:** direto do browser do admin com preset _unsigned_ — o arquivo vai
pro Cloudinary sem passar pelo servidor, como o `upload-cloudinary.mjs` do
`lp-jhuli-souza` já faz. Ao terminar, o client grava o `Photo` no Firestore
via Server Action (public_id, dimensões, `alt`, e o `blurDataURL` buscado de
uma transformação Cloudinary de 16px).

**Delete:** exclusão de asset exige a API secret, que não pode ir pro client
— passa por uma route handler assinada no admin, igual ao
`app/api/cloudinary-delete` do `Presencia`.

**Entrega:** `next-image-loader.ts` customizado, igual ao `lp-jhuli-souza`,
reescrevendo a URL do Cloudinary com `f_auto,q_auto,w_<width>` — resize e
formato ficam por conta do Cloudinary, não do Next.

## Revalidação

Nichos e fotos deixam de ser conhecidos em build time, então `/ensaios/[slug]`
sai de `generateStaticParams` puro para renderização com cache por tag. Cada
Server Action do admin que grava dado chama `revalidateTag` da entidade
afetada — o Next só regera a página quando algo muda, não a cada request.

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

## Deploy

Dois serviços novos no `docker-compose.yml` da VPS compartilhada, ao lado dos
que já existem (`Presencia`, etc.):

| serviço | domínio                     | repo           |
| ------- | --------------------------- | -------------- |
| `app`   | `denisegalvao.com.br`       | público (este) |
| `admin` | `admin.denisegalvao.com.br` | admin (novo)   |

Cada um com Dockerfile multi-stage (output `standalone` do Next, mesmo
formato do `Presencia`) e workflow de CD próprio: build → push pro GHCR → SSH
→ `docker compose pull/up --force-recreate <serviço>`, validado por
`curl` em `/v1/health` antes de considerar o deploy bem-sucedido.

Acesso à VPS: eu recebo as credenciais SSH e configuro os dois serviços no
compose existente.

## Testes

Mesmo padrão dos repos-irmãos: um `Mock<Entidade>Repository` por entidade,
injetado no lugar do `RepositoryImpl` quando não há Firebase disponível (dev
local, CI). `RepositoryFactory` decide qual usar por env var, como no
`Presencia`. Use cases testados via Vitest contra o mock, sem precisar de
Firebase real para rodar `npm run test`.

## Riscos / pontos de atenção

- **Cache do site público muda de modelo.** Hoje é 100% estático; passa a
  depender de `revalidateTag` disparado corretamente em toda escrita do
  admin. Um `revalidateTag` esquecido deixa a página pública desatualizada
  silenciosamente — vale um teste de integração cobrindo isso.
- **Placement é uma coleção nova, sem precedente direto nos repos-irmãos.**
  As entidades que vi lá (`coupon`, `tenant`, `user`) não tinham esse padrão
  de "referência genérica com surface + refId opcional". É a peça mais nova
  deste desenho — vale prototipar a query antes de construir o CRUD completo
  em cima dela.
- **`packages.ts` tem 12 pacotes hoje** (2 por nicho × 6 nichos, alguns com
  `items` já como texto livre da cliente). A migração precisa preservar esse
  texto exatamente — não é reescrita, é transcrição.

## Decisões já tomadas neste brainstorming

| decisão              | escolha                                                               |
| -------------------- | --------------------------------------------------------------------- |
| Infra de dados       | Firebase (Firestore) + Cloudinary                                     |
| Usuários admin       | Denise + interno, mesmo acesso, sem papéis                            |
| Escopo de nichos     | Admin cria/edita/remove nichos inteiros, não só pacotes               |
| Escopo de fotos      | Todas as fotos do site (não só galerias de nicho)                     |
| Migração do acervo   | Sim, com otimização via Cloudinary (padrão `lp-jhuli-souza`)          |
| Decomposição         | Um spec cobrindo os dois, implementável em fases                      |
| Evento vs Nicho      | Eliminar `EventFormat`, virar flag em `Niche`                         |
| Modelo de "Quem sou" | Documento único e específico (`Profile`), não abstração genérica      |
| Hospedagem           | Sai do Netlify, VPS compartilhada com os outros projetos              |
| Repos                | Dois — público (este) e admin (novo)                                  |
| Domínios             | `denisegalvao.com.br` (público) / `admin.denisegalvao.com.br` (admin) |
| Testes               | `Mock<Entidade>Repository` por entidade, padrão dos repos-irmãos      |
