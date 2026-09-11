# Avaliações reais do Google na seção "O que dizem por aí" — Design

**Goal:** A seção "O que dizem por aí" do app-photo hoje mostra 3
depoimentos fixos no código (`TESTIMONIALS` hardcoded em
`src/actions/testimonials.ts`). Passa a mostrar avaliações reais,
puxadas do Google (Places API), sincronizadas via um botão no
admin-photo e passando pelo fluxo de rascunho/publicação já existente.

**Architecture:** Cross-repo, como o resto do conteúdo do site — novo
domínio `Testimonial`, com stacks de domínio/aplicação/infraestrutura
independentes em admin-photo e app-photo, lendo a mesma coleção do
Firestore (`testimonials_draft`/`testimonials`), seguindo exatamente o
padrão já usado por nicho/pacote/perfil (ver
`docs/superpowers/specs/2026-09-09-rascunho-publicar-design.md`). Só
admin-photo fala com a Places API (credenciais nunca chegam ao
app-photo, que só lê Firestore como sempre fez). O gatilho de
sincronização vive dentro do próprio site embutido no `/preview`
(pill "Atualizar avaliações", mesmo padrão do `Addable` já usado por
"Adicionar novo ensaio"/"Adicionar nova foto"), não numa tela separada.

**Tech Stack:** Next.js App Router, TypeScript, Firestore (Admin SDK),
Google Places API (Legacy — endpoint `place/details/json`, autenticado
só com API key, sem OAuth).

**Spec:** Autocontido — nasceu de conversa direta com o usuário nesta
sessão (ver seção "Contexto/decisões" abaixo). Depende do fluxo de
rascunho/publicação já especificado em
`docs/superpowers/specs/2026-09-09-rascunho-publicar-design.md`, que
este spec reaproveita sem alterar.

## Contexto/decisões

Perguntas respondidas diretamente pelo usuário nesta sessão:

1. **Places API, não Business Profile API.** A conta do Google Cloud
   que gera a chave **não precisa ser proprietária** do Google Meu
   Negócio — a Places API só lê dados públicos (nome, nota,
   avaliações) de qualquer lugar listado no Google Maps, dado o Place
   ID. A Business Profile API (que exigiria OAuth + posse verificada
   do anúncio) não é usada aqui — é para o dono gerenciar/responder
   avaliações, não para exibição pública em outro site.
2. **Chave ainda não existe.** A parte de código vem primeiro; a
   criação da chave (Google Cloud Console) e a localização do Place ID
   de verdade (a "Avaliar" já existente no site usa um **CID**,
   `0x94f395332f295643:0xf7bfc7c474976814` — formato diferente do
   Place ID que a Places API pede, `ChIJ...`; precisa ser localizado à
   parte via a ferramenta "Place ID Finder" do Google) ficam para
   depois, fora do escopo deste spec. `GOOGLE_PLACES_API_KEY`/
   `GOOGLE_PLACE_ID` ausentes = modo mock, mesmo padrão de
   Cloudinary/Firebase em `env.server.ts`.
3. **Sincronização passa pelo admin-photo, gravando no Firestore** —
   não busca direto da Places API a cada visita do site (API paga por
   chamada). O site sempre lê do Firestore, como todo o resto do
   conteúdo.
4. **Mostrar a nota (1–5 estrelas)** em cada cartão de depoimento,
   além do nome e do texto — a Places API já devolve isso.
5. **Moderação: precisa dar pra ocultar uma avaliação específica.** A
   Places API só devolve até 5 avaliações ("mais relevantes" segundo o
   algoritmo do Google, sem controle nosso sobre quais) — uma delas
   pode ser indesejada (nota baixa, texto ruim) e precisa dar pra
   tirar do site sem esperar o Google parar de retorná-la.
6. **Passa pelo fluxo de rascunho/publicação**, como todo o resto —
   tanto "Atualizar avaliações" quanto ocultar/mostrar uma avaliação
   gravam no rascunho; só o "Publicar" leva ao site real.
7. **Botão "Atualizar avaliações" no mesmo lugar/estilo do "Adicionar
   nova foto"** — a pill `Addable` ao lado do título da seção, dentro
   do próprio site embutido no iframe do `/preview`, não uma tela/
   painel separado do admin.

**Uma lacuna real que meu design anterior (aprovado em chat) não
cobria, resolvida aqui:** propus originalmente que clicar no cartão de
uma avaliação (`Editable`) abriria um diálogo de ocultar/mostrar. Mas
uma avaliação **oculta não é renderizada** no site — não sobra nenhum
elemento na página pra clicar e trazê-la de volta. Por isso, o design
abaixo separa as duas interações: **ocultar** acontece pelo mecanismo
genérico que já existe (ícone de lixeira no hover de qualquer
`data-editable`, que hoje já dispara `DELETE` — reaproveitado aqui
como "ocultar", não apagar de verdade); **mostrar de novo** precisa de
uma lista à parte no próprio `/preview` do admin (fora do iframe, já
que uma avaliação oculta não existe mais dentro dele), listando todas
as avaliações sincronizadas com um toggle cada.

## Global Constraints

- Nenhuma credencial do Google chega ao app-photo — só admin-photo
  fala com a Places API.
- `GOOGLE_PLACES_API_KEY`/`GOOGLE_PLACE_ID` opcionais em
  `env.server.ts` do admin-photo — ausentes, modo mock (mesmo padrão
  de `CLOUDINARY_API_KEY`/`FIREBASE_*`).
- Segue exatamente a arquitetura de rascunho/publicação já existente
  (`docs/superpowers/specs/2026-09-09-rascunho-publicar-design.md`) —
  sem inventar um caminho de escrita direta ao live.
- `Testimonial` ganha stacks de domínio/aplicação/infraestrutura
  independentes em admin-photo e app-photo, mesmo padrão de nicho/
  pacote/perfil — sem compartilhar código entre os repos.
- O botão de sincronizar usa o `Addable` já existente (sem mudança em
  `PreviewOverlay.tsx` — o mecanismo de postMessage já é genérico por
  `entityType`, confirmado lendo o código atual).
- Ocultar reaproveita o mecanismo genérico de `DELETE` (ícone de
  lixeira no hover de `data-editable`) já existente — sem mudança em
  `PreviewOverlay.tsx` também.

---

## Modelo de dados

```ts
// Testimonial.ts (domain, replicado em admin-photo e app-photo)
export interface Testimonial {
  id: string; // string(review.time) do Google — timestamp unix, único entre as ≤5 avaliações de um place
  authorName: string;
  text: string;
  rating: number; // 1-5
  relativeTime: string; // "há 2 meses" — já vem pronto da Places API
  order: number; // posição na resposta da Places API (ordem de relevância do Google)
  visible: boolean;
}
```

Firestore: coleção `testimonials_draft` (admin-photo lê/escreve
sempre) e `testimonials` (live, só admin-photo escreve via
`publishDraft()`; app-photo lê uma ou outra conforme o cookie de
rascunho, igual nicho/pacote/etc.). Cada doc usa `id` como ID do
documento (determinístico, igual `slug` em niches).

## admin-photo

### Integração com a Places API

`src/api/infrastructure/google/fetchGoogleReviews.ts` (novo):

```ts
export interface GoogleReview {
  id: string;
  authorName: string;
  text: string;
  rating: number;
  relativeTime: string;
  order: number;
}

interface PlaceDetailsResponse {
  status: string;
  error_message?: string;
  result?: {
    reviews?: {
      author_name: string;
      rating: number;
      relative_time_description: string;
      text: string;
      time: number;
    }[];
  };
}

// Endpoint legado (Place Details) — só precisa de API key, sem OAuth.
// fields restrito ao necessário pra manter o custo da chamada baixo.
export async function fetchGoogleReviews(apiKey: string, placeId: string): Promise<GoogleReview[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "pt-BR");

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as PlaceDetailsResponse;
  if (data.status !== "OK") {
    throw new Error(
      `Places API retornou "${data.status}"${data.error_message ? `: ${data.error_message}` : ""}`,
    );
  }
  const reviews = data.result?.reviews ?? [];
  return reviews.map((r, order) => ({
    id: String(r.time),
    authorName: r.author_name,
    text: r.text,
    rating: r.rating,
    relativeTime: r.relative_time_description,
    order,
  }));
}
```

### Função pura de sincronização (TDD)

`src/actions/_lib/planTestimonialsSync.ts` (novo) — mesmo espírito de
`planPublish.ts`: pura, sem tocar Firestore, decide o que fazer dado o
estado atual do rascunho + a resposta fresca do Google.

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { GoogleReview } from "@/api/infrastructure/google/fetchGoogleReviews";

export interface TestimonialsSyncPlan {
  toUpsert: Testimonial[];
  idsToTombstone: string[]; // existiam no rascunho, não vieram mais do Google
}

// Preserva o "visible" de quem já existia (ocultar não pode ressuscitar
// só porque o Google ainda retorna aquela avaliação); quem é novo entra
// visível por padrão. Quem não veio mais na resposta do Google vira
// tombstone (_deleted:true no rascunho), igual o delete de qualquer
// outra entidade — resolvido de verdade só no Publicar.
export function planTestimonialsSync(
  existing: Testimonial[],
  fresh: GoogleReview[],
): TestimonialsSyncPlan {
  const existingById = new Map(existing.map((t) => [t.id, t]));
  const freshIds = new Set(fresh.map((r) => r.id));

  const toUpsert: Testimonial[] = fresh.map((r) => ({
    ...r,
    visible: existingById.get(r.id)?.visible ?? true,
  }));
  const idsToTombstone = existing.filter((t) => !freshIds.has(t.id)).map((t) => t.id);

  return { toUpsert, idsToTombstone };
}
```

### Repositório

`src/api/domain/testimonial/Testimonial.ts` — a interface acima.

`src/api/domain/testimonial/TestimonialRepository.ts`:

```ts
import type { Testimonial } from "./Testimonial";

export interface TestimonialRepository {
  findAll(): Promise<Testimonial[]>;
  upsertMany(testimonials: Testimonial[]): Promise<void>;
  tombstoneMany(ids: string[]): Promise<void>;
  setVisibility(id: string, visible: boolean): Promise<Testimonial>;
}
```

`src/api/infrastructure/repositories/TestimonialRepositoryImpl.ts` —
mesmo padrão de `NicheRepositoryImpl.ts` (coleção `testimonials_draft`,
tombstone via `_deleted:true`, filtra tombstones em JS no `findAll`,
ordena por `order` asc).

`src/api/infrastructure/repositories/mock/MockTestimonialRepository.ts`
— array em memória com os 3 depoimentos atuais como seed (mesmo texto
de hoje), pra manter a seção com conteúdo em dev/test/CI sem
credenciais do Google.

`RepositoryFactory.testimonials()` — mesmo padrão dos outros
(`shouldUseMock() ? new MockTestimonialRepository() :
new TestimonialRepositoryImpl()`).

### Actions

`src/actions/testimonials.ts` (admin-photo, novo — não confundir com o
`src/actions/testimonials.ts` do app-photo, que é outro arquivo, outro
repo):

```ts
"use server";

import { fetchGoogleReviews } from "@/api/infrastructure/google/fetchGoogleReviews";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import { assertSession } from "@/lib/auth/session";
import { env } from "@/config/env.server";
import { markDraftDirty } from "./_lib/markDraftDirty";
import { planTestimonialsSync } from "./_lib/planTestimonialsSync";
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";

export async function getTestimonials(): Promise<Testimonial[]> {
  await assertSession();
  return RepositoryFactory.testimonials().findAll();
}

export async function refreshTestimonialsFromGoogle(): Promise<Testimonial[]> {
  await assertSession();
  if (!env.GOOGLE_PLACES_API_KEY || !env.GOOGLE_PLACE_ID) {
    throw new Error("GOOGLE_PLACES_API_KEY/GOOGLE_PLACE_ID não configurados.");
  }
  const repo = RepositoryFactory.testimonials();
  const [existing, fresh] = await Promise.all([
    repo.findAll(),
    fetchGoogleReviews(env.GOOGLE_PLACES_API_KEY, env.GOOGLE_PLACE_ID),
  ]);
  const plan = planTestimonialsSync(existing, fresh);
  await repo.upsertMany(plan.toUpsert);
  if (plan.idsToTombstone.length > 0) await repo.tombstoneMany(plan.idsToTombstone);
  await markDraftDirty();
  return repo.findAll();
}

export async function setTestimonialVisibility(id: string, visible: boolean): Promise<Testimonial> {
  await assertSession();
  const testimonial = await RepositoryFactory.testimonials().setVisibility(id, visible);
  await markDraftDirty();
  return testimonial;
}
```

### Publish/Sync

Em `src/actions/publish.ts`:

- `ENTITIES` ganha `'testimonials'` — reaproveita `publishEntity`/
  `syncEntity` genéricos (já tombstone-aware via `planPublish`), sem
  código novo nessas duas funções.
- `REVALIDATE_TAGS` ganha `'testimonials'` — app-photo precisa de uma
  tag nova de revalidação (ver seção app-photo abaixo).

### UI no /preview

**Gatilho de sincronização** — dentro do iframe, não no chrome do
admin. Em `app-photo/src/app/_components/Testimonials.tsx`:

```tsx
<Section
    id="feedbacks"
    index="05"
    eyebrow="Feedbacks de clientes"
    title="O que dizem por aí"
    action={
        <Addable type="testimonials" className={ADD_PILL_CLASSNAME}>
            Atualizar avaliações
        </Addable>
    }
>
```

`Addable`'s `type` union (em `Addable.tsx`) ganha `"testimonials"`.

Em `admin-photo/src/app/preview/_components/PreviewFrame.tsx`, o
handler do `ADD` ganha um desvio antes de `resolveAddHandler` — esse
`entityType` não abre modal, dispara a ação direto:

```tsx
if (event.data?.type === ADD) {
  if (event.data.entityType === "testimonials") {
    void runMutation(() => refreshTestimonialsFromGoogle(), {
      success: "Avaliações atualizadas a partir do Google.",
      fallbackError: "Falha ao buscar avaliações do Google.",
    }).then((result) => {
      if (result.ok) setTestimonials(result.value);
    });
    return;
  }
  const target = resolveAddHandler(event.data.entityType, event.data.context);
  // ...resto como já é hoje
}
```

(`testimonials`/`setTestimonials` viram mais um par de `useState` em
`PreviewFrame.tsx`, igual `niches`/`packages`/etc., inicializado a
partir de uma nova prop `testimonials: Testimonial[]` vinda de
`preview/page.tsx`, que passa a chamar `getTestimonials()` no
`Promise.all` junto com o resto.)

**Ocultar (lixeira no hover)** — cada cartão em `Testimonials.tsx`
ganha `<Editable type="testimonial" id={t.id}>` ao redor do
`<blockquote>`. `Editable`'s `type` union ganha `"testimonial"`.
`deleteHandlers.ts` (admin-photo) ganha um caso: resolve pro
testimonial correspondente; `PreviewFrame.tsx` mostra o
`ConfirmationDialog` já existente, com texto ajustado ("Ocultar
avaliação" / "Esta avaliação some do site — pode trazer de volta na
lista abaixo do Publicar."), chamando `setTestimonialVisibility(id,
false)` em vez de um delete de verdade.

**Mostrar de novo (lista fora do iframe)** — como uma avaliação
oculta não renderiza no site, não tem elemento pra clicar e reverter.
Painel novo `TestimonialsPanel.tsx` em `preview/_components/`,
renderizado no `/preview` do admin (fora do iframe, ao lado de onde já
fica `PublishControls`) — lista **todas** as avaliações sincronizadas,
visíveis e ocultas juntas (nome, nota, início do texto). Uma
avaliação oculta continua na lista, só com tratamento visual de
inativa (ex.: opacidade reduzida/texto "Oculta"), com um toggle ao
lado pra reverter — nunca some da lista, só do site. Único lugar de
onde dá pra reverter um ocultar.

## app-photo

`src/actions/testimonials.ts` (app-photo, arquivo já existente) —
troca o array fixo por leitura do Firestore, mesmo padrão de
`getNiches()`/`getPackages()`:

```ts
export interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const repo = await RepositoryFactory.testimonials();
  const all = await repo.findAll();
  return all
    .filter((t) => t.visible)
    .map((t) => ({ name: t.authorName, text: t.text, rating: t.rating }));
}
```

Precisa do mesmo conjunto de arquivos que os outros domínios já têm
aqui: `Testimonial.ts`/`TestimonialRepository.ts` (domain),
`TestimonialRepositoryImpl.ts` (lê `testimonials`/`testimonials_draft`
conforme `isDraft`, mesmo padrão de `NicheRepositoryImpl.ts` deste
repo) + `MockTestimonialRepository.ts` (mesmo seed de 3 depoimentos do
mock do admin-photo, pra manter os dois repos consistentes em dev),
registrados em `RepositoryFactory.ts` como `testimonials: async () =>
...`.

`Testimonials.tsx` — troca `{t.text}`/`{t.name}` por também renderizar
`t.rating` como estrelas (ex.: `Array.from({length: 5}, (_, i) => ...)`
com um ícone preenchido/vazio conforme `i < rating`, mesma família de
ícones `react-icons/fa` já usada no resto do componente — `FaStar`).

`src/app/api/revalidate/route.ts` — já é genérico por tag
(`revalidateTag(body.tag, "max")`, qualquer string), confirmado lendo
o arquivo: nenhuma mudança necessária aqui pra aceitar `testimonials`.
Vale notar (não é regressão introduzida por este spec, é o estado
atual de todo o app): nenhuma leitura declara `cacheTag`/`"use cache"`
ainda (comentário no próprio arquivo, "Nenhuma leitura declara tag/
perfil ainda"), então `revalidateTag('testimonials')` por enquanto não
tem efeito prático até esse trabalho futuro (fora do escopo deste
spec) — mesma situação em que `niches`/`packages`/etc. já estão hoje.

## Variáveis de ambiente (admin-photo)

`src/config/env.server.ts`:

```ts
// API key da Places API do Google (Legacy) — só leitura de avaliações
// públicas de um place, sem OAuth, sem precisar ser dono do Google Meu
// Negócio. Opcional: ausente, refreshTestimonialsFromGoogle() lança
// erro tratado (toast), resto do app funciona normal.
GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
// Place ID do Google Maps do negócio (formato ChIJ..., achado via
// "Place ID Finder" do Google) — diferente do CID já usado no link
// "Avaliar" existente no site (0x...:0x...), não dá pra reaproveitar
// direto.
GOOGLE_PLACE_ID: z.string().min(1).optional(),
```

`.env.example` ganha as duas linhas, com o mesmo estilo de comentário
das seções existentes.

## Testes

- `fetchGoogleReviews.test.ts` — mocka `fetch` global, testa
  mapeamento da resposta da Places API pro `GoogleReview[]`, e o
  caminho de erro (`status !== 'OK'`).
- `planTestimonialsSync.test.ts` — TDD, função pura: preserva
  `visible:false` de quem já existia, `visible:true` padrão pra quem é
  novo, tombstone de quem não veio mais.
- `MockTestimonialRepository.test.ts` — mesmo padrão dos outros mocks
  (findAll retorna os 3 seeds).
- `TestimonialRepositoryImpl` não ganha teste de integração direto
  (mesmo padrão dos outros `*RepositoryImpl.ts` deste projeto — não
  têm teste próprio, só os UseCases/mocks têm).

## Riscos e mitigação

- **Place ID errado ou API não habilitada:** `fetchGoogleReviews`
  lança com a mensagem de erro da própria Places API
  (`error_message`), que vira toast — diagnosticável sem precisar
  abrir o Firestore/logs do servidor.
- **Custo da Places API:** só chamada sob clique explícito em
  "Atualizar avaliações" (nunca automático/agendado) — sem risco de
  chamada em loop ou por tráfego do site público.
- **Uma avaliação ocultada reaparecendo num refresh futuro:**
  coberto por `planTestimonialsSync` preservando `visible` de quem já
  existia — testado.
