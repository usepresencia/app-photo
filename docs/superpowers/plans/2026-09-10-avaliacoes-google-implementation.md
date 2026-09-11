# Avaliações reais do Google Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os 3 depoimentos fixos no código da seção "O que
dizem por aí" por avaliações reais do Google (Places API),
sincronizadas via admin-photo e passando pelo fluxo de rascunho/
publicação já existente.

**Architecture:** Novo domínio `Testimonial`, com stacks de domínio/
aplicação/infraestrutura independentes em admin-photo e app-photo
(mesma coleção do Firestore, `testimonials`/`testimonials_draft`).
Só admin-photo fala com a Places API. O gatilho de sincronização vive
dentro do próprio app-photo embutido no iframe do `/preview` (pill
`Addable`, mesmo padrão de "Adicionar nova foto"); ocultar uma
avaliação reaproveita o ícone de lixeira genérico já existente; mostrar
de novo precisa de uma lista à parte no `/preview` do admin (fora do
iframe), porque uma avaliação oculta não renderiza no site.

**Tech Stack:** Next.js App Router, TypeScript, Firestore (Admin SDK),
Google Places API (Legacy, `place/details/json`, API key só).

**Spec:** `docs/superpowers/specs/2026-09-10-avaliacoes-google-design.md`

## Global Constraints

- Nenhuma credencial do Google chega ao app-photo — só admin-photo
  fala com a Places API.
- `GOOGLE_PLACES_API_KEY`/`GOOGLE_PLACE_ID` opcionais em
  `env.server.ts` do admin-photo — ausentes, modo mock.
- Segue a arquitetura de rascunho/publicação já existente — sem
  escrita direta ao live.
- `Testimonial` ganha stacks independentes em admin-photo e app-photo,
  sem compartilhar código entre os repos.
- `PreviewOverlay.tsx` (app-photo) **não muda** — o mecanismo de
  postMessage já é genérico por `entityType` (confirmado lendo o
  código atual); só os _unions_ TypeScript de `Editable`/`Addable`
  ganham os novos valores.
- Cada task termina com `npm run typecheck && npm run lint && npm test
&& npm run build` limpos no repo correspondente, e commit próprio
  (nunca em lote).
- Os dois dev servers (admin-photo `:3001`, wrapping
  `firebase emulators:exec`; app-photo `:3000`, mesmo emulador
  Firestore local via `FIRESTORE_EMULATOR_HOST=localhost:8090`)
  provavelmente já estão rodando desta sessão — checar com `lsof`
  antes de subir de novo. `next build` e `next dev` compartilham o
  `.next` do mesmo repo — rodar build com o dev server daquele repo
  vivo corrompe o que ele está servindo até um restart limpo
  (`rm -rf .next` + reiniciar + esperar `curl` voltar 200).

---

## Task 1: Domínio Testimonial em admin-photo (Mock + interface)

**Files:**

- Create: `admin-photo/src/api/domain/testimonial/Testimonial.ts`
- Create: `admin-photo/src/api/domain/testimonial/TestimonialRepository.ts`
- Create: `admin-photo/src/api/infrastructure/repositories/mock/MockTestimonialRepository.ts`
- Create: `admin-photo/src/api/infrastructure/repositories/mock/MockTestimonialRepository.test.ts`
- Modify: `admin-photo/src/api/infrastructure/repositories/RepositoryFactory.ts`

**Interfaces:**

- Consumes: nada (primeira task).
- Produces: `Testimonial` (id, authorName, text, rating, relativeTime,
  order, visible), `TestimonialRepository` (findAll, upsertMany,
  tombstoneMany, setVisibility), `RepositoryFactory.testimonials():
TestimonialRepository`. Tasks 2 e 5 dependem desses tipos/dessa
  factory.

- [ ] **Step 1: Criar `Testimonial.ts`**

```ts
export interface Testimonial {
  id: string;
  authorName: string;
  text: string;
  rating: number;
  relativeTime: string;
  order: number;
  visible: boolean;
}
```

- [ ] **Step 2: Criar `TestimonialRepository.ts`**

```ts
import type { Testimonial } from "./Testimonial";

export interface TestimonialRepository {
  findAll(): Promise<Testimonial[]>;
  upsertMany(testimonials: Testimonial[]): Promise<void>;
  tombstoneMany(ids: string[]): Promise<void>;
  setVisibility(id: string, visible: boolean): Promise<Testimonial>;
}
```

- [ ] **Step 3: Criar `MockTestimonialRepository.ts`**

Seed com os 3 depoimentos hoje hardcoded em
`app-photo/src/actions/testimonials.ts` (mesmo texto, agora com os
campos novos do domínio):

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";

// Transcrição fiel dos 3 depoimentos que hoje vivem hardcoded em
// app-photo/src/actions/testimonials.ts — mesmo texto, com os campos
// novos do domínio Testimonial (rating/relativeTime/order/visible).
let TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-1",
    authorName: "Marina R.",
    text: "A Denise deixou todo mundo à vontade. As fotos da família ficaram naturais, sem pose forçada.",
    rating: 5,
    relativeTime: "há 3 meses",
    order: 0,
    visible: true,
  },
  {
    id: "seed-2",
    authorName: "Carlos e Bia",
    text: "Fotografou nosso casamento civil e o pré-wedding. Entregou antes do prazo e cada foto conta uma história.",
    rating: 5,
    relativeTime: "há 6 meses",
    order: 1,
    visible: true,
  },
  {
    id: "seed-3",
    authorName: "Luiza M.",
    text: "Precisava de retratos profissionais para o LinkedIn e saí com um material que uso até hoje.",
    rating: 5,
    relativeTime: "há 1 ano",
    order: 2,
    visible: true,
  },
];

export class MockTestimonialRepository implements TestimonialRepository {
  async findAll(): Promise<Testimonial[]> {
    return [...TESTIMONIALS].sort((a, b) => a.order - b.order);
  }

  async upsertMany(testimonials: Testimonial[]): Promise<void> {
    for (const t of testimonials) {
      const index = TESTIMONIALS.findIndex((existing) => existing.id === t.id);
      if (index === -1) {
        TESTIMONIALS = [...TESTIMONIALS, t];
      } else {
        TESTIMONIALS = [...TESTIMONIALS.slice(0, index), t, ...TESTIMONIALS.slice(index + 1)];
      }
    }
  }

  async tombstoneMany(ids: string[]): Promise<void> {
    TESTIMONIALS = TESTIMONIALS.filter((t) => !ids.includes(t.id));
  }

  async setVisibility(id: string, visible: boolean): Promise<Testimonial> {
    const index = TESTIMONIALS.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Depoimento "${id}" não encontrado.`);
    const updated = { ...TESTIMONIALS[index], visible };
    TESTIMONIALS = [...TESTIMONIALS.slice(0, index), updated, ...TESTIMONIALS.slice(index + 1)];
    return updated;
  }
}
```

- [ ] **Step 4: Criar `MockTestimonialRepository.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { MockTestimonialRepository } from "./MockTestimonialRepository";

describe("MockTestimonialRepository", () => {
  it("findAll retorna os 3 seeds, ordenados por order", async () => {
    const repo = new MockTestimonialRepository();
    const all = await repo.findAll();
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.authorName)).toEqual(["Marina R.", "Carlos e Bia", "Luiza M."]);
  });

  it("upsertMany insere novo e atualiza existente", async () => {
    const repo = new MockTestimonialRepository();
    await repo.upsertMany([
      {
        id: "novo-1",
        authorName: "Novo Cliente",
        text: "Texto novo",
        rating: 4,
        relativeTime: "há 1 semana",
        order: 3,
        visible: true,
      },
    ]);
    const all = await repo.findAll();
    expect(all).toHaveLength(4);
    expect(all[3].authorName).toBe("Novo Cliente");
  });

  it("tombstoneMany remove pelos ids", async () => {
    const repo = new MockTestimonialRepository();
    await repo.tombstoneMany(["seed-2"]);
    const all = await repo.findAll();
    expect(all.map((t) => t.id)).toEqual(["seed-1", "seed-3"]);
  });

  it("setVisibility troca o campo visible e retorna o depoimento atualizado", async () => {
    const repo = new MockTestimonialRepository();
    const updated = await repo.setVisibility("seed-1", false);
    expect(updated.visible).toBe(false);
    const all = await repo.findAll();
    expect(all.find((t) => t.id === "seed-1")?.visible).toBe(false);
  });

  it("setVisibility lança quando o id não existe", async () => {
    const repo = new MockTestimonialRepository();
    await expect(repo.setVisibility("nao-existe", false)).rejects.toThrow("não encontrado");
  });
});
```

- [ ] **Step 5: Rodar os testes**

```bash
cd admin-photo && npx vitest run src/api/infrastructure/repositories/mock/MockTestimonialRepository.test.ts
```

Esperado: 5 testes passando.

- [ ] **Step 6: Adicionar `testimonials()` ao `RepositoryFactory.ts`**

Em `admin-photo/src/api/infrastructure/repositories/RepositoryFactory.ts`,
adicionar aos imports:

```ts
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import { MockTestimonialRepository } from "./mock/MockTestimonialRepository";
```

(`TestimonialRepositoryImpl` só é importado na Task 2 — por enquanto,
o factory usa só o mock direto, sem branch de `shouldUseMock()`, pra
esta task compilar sozinha.)

No objeto `RepositoryFactory`, adicionar:

```ts
    testimonials: (): TestimonialRepository => new MockTestimonialRepository(),
```

- [ ] **Step 7: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 8: Reiniciar o dev server se estava de pé**

```bash
lsof -iTCP:3001 -sTCP:LISTEN -n -P
```

Se havia processo na porta 3001 antes do `npm run build`: matar a
árvore de processos (`firebase emulators:exec` + `next dev`),
`rm -rf .next`, `npm run dev` de novo em background, esperar
`curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login`
voltar `200`.

- [ ] **Step 9: Commit**

```bash
cd admin-photo
git add src/api/domain/testimonial/Testimonial.ts \
        src/api/domain/testimonial/TestimonialRepository.ts \
        src/api/infrastructure/repositories/mock/MockTestimonialRepository.ts \
        src/api/infrastructure/repositories/mock/MockTestimonialRepository.test.ts \
        src/api/infrastructure/repositories/RepositoryFactory.ts
git commit -m "$(cat <<'EOF'
feat: add Testimonial domain and mock repository (admin-photo)

Novo domínio Testimonial (id, authorName, text, rating, relativeTime,
order, visible) — base pra puxar avaliações reais do Google. Mock
repository semeado com os 3 depoimentos hoje hardcoded no app-photo,
pra ter conteúdo em dev/test/CI sem credenciais do Google.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: TestimonialRepositoryImpl (Firestore, admin-photo)

**Files:**

- Create: `admin-photo/src/api/infrastructure/repositories/TestimonialRepositoryImpl.ts`
- Modify: `admin-photo/src/api/infrastructure/repositories/RepositoryFactory.ts`

**Interfaces:**

- Consumes: `Testimonial`, `TestimonialRepository` (Task 1).
- Produces: `TestimonialRepositoryImpl` — `RepositoryFactory.testimonials()`
  passa a alternar entre mock e real conforme `shouldUseMock()`, igual
  os outros domínios.

- [ ] **Step 1: Criar `TestimonialRepositoryImpl.ts`**

Mesmo padrão de `NicheRepositoryImpl.ts` — coleção `testimonials_draft`
(todo save de admin vira rascunho), tombstone via `_deleted:true` em
vez de apagar de verdade, `id` é o próprio ID do documento.

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import { getAdminDb } from "@/api/infrastructure/firebase/admin";

const COLLECTION = "testimonials_draft";

function toTestimonial(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Testimonial {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    id: doc.id,
    authorName: data.authorName,
    text: data.text,
    rating: data.rating,
    relativeTime: data.relativeTime,
    order: data.order,
    visible: data.visible,
  };
}

// Lê/escreve "testimonials_draft", não "testimonials" — mesmo padrão
// de NicheRepositoryImpl.ts (todo save do admin vira rascunho até
// publishDraft() copiar pro live). upsertMany/tombstoneMany usam
// batch — refreshTestimonialsFromGoogle() pode escrever até 5 docs de
// uma vez.
export class TestimonialRepositoryImpl implements TestimonialRepository {
  async findAll(): Promise<Testimonial[]> {
    const snapshot = await getAdminDb().collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.filter((doc) => !doc.data()._deleted).map(toTestimonial);
  }

  async upsertMany(testimonials: Testimonial[]): Promise<void> {
    if (testimonials.length === 0) return;
    const db = getAdminDb();
    const batch = db.batch();
    for (const t of testimonials) {
      const { id, ...fields } = t;
      batch.set(db.collection(COLLECTION).doc(id), fields);
    }
    await batch.commit();
  }

  async tombstoneMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = getAdminDb();
    const batch = db.batch();
    for (const id of ids) {
      batch.update(db.collection(COLLECTION).doc(id), { _deleted: true });
    }
    await batch.commit();
  }

  async setVisibility(id: string, visible: boolean): Promise<Testimonial> {
    const db = getAdminDb();
    await db.collection(COLLECTION).doc(id).update({ visible });
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) throw new Error(`Depoimento "${id}" não encontrado depois de atualizar.`);
    return toTestimonial(doc);
  }
}
```

- [ ] **Step 2: Atualizar `RepositoryFactory.ts`**

Trocar o import/registro do Step 6 da Task 1:

```ts
import { TestimonialRepositoryImpl } from "./TestimonialRepositoryImpl";
```

E o método `testimonials` passa a ser:

```ts
    testimonials: (): TestimonialRepository =>
        shouldUseMock() ? new MockTestimonialRepository() : new TestimonialRepositoryImpl(),
```

- [ ] **Step 3: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

(`TestimonialRepositoryImpl` não ganha teste de integração próprio —
mesmo padrão dos outros `*RepositoryImpl.ts` deste projeto, que também
não têm.)

- [ ] **Step 4: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 1, Step 8)**

- [ ] **Step 5: Commit**

```bash
cd admin-photo
git add src/api/infrastructure/repositories/TestimonialRepositoryImpl.ts \
        src/api/infrastructure/repositories/RepositoryFactory.ts
git commit -m "$(cat <<'EOF'
feat: add TestimonialRepositoryImpl (Firestore, admin-photo)

Mesmo padrão de NicheRepositoryImpl.ts — coleção testimonials_draft,
tombstone via _deleted:true em vez de apagar de verdade.
RepositoryFactory.testimonials() alterna mock/real conforme
credenciais do Firebase, igual os outros domínios.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Cliente da Places API (TDD, admin-photo)

**Files:**

- Create: `admin-photo/src/api/infrastructure/google/fetchGoogleReviews.ts`
- Create: `admin-photo/src/api/infrastructure/google/fetchGoogleReviews.test.ts`

**Interfaces:**

- Consumes: nada de tasks anteriores (função isolada, só depende de
  `fetch` global).
- Produces: `GoogleReview` (id, authorName, text, rating, relativeTime,
  order), `fetchGoogleReviews(apiKey: string, placeId: string):
Promise<GoogleReview[]>`. Task 4 (`planTestimonialsSync`) e Task 5
  (`refreshTestimonialsFromGoogle`) consomem esses dois.

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGoogleReviews } from "./fetchGoogleReviews";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockFetchOnce(body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

describe("fetchGoogleReviews", () => {
  it("mapeia a resposta da Places API pro formato GoogleReview[]", async () => {
    mockFetchOnce({
      status: "OK",
      result: {
        reviews: [
          {
            author_name: "Marina R.",
            rating: 5,
            relative_time_description: "há 2 meses",
            text: "Ótimo trabalho!",
            time: 1690000000,
          },
          {
            author_name: "Carlos B.",
            rating: 4,
            relative_time_description: "há 6 meses",
            text: "Recomendo.",
            time: 1680000000,
          },
        ],
      },
    });

    const reviews = await fetchGoogleReviews("fake-api-key", "ChIJfake");

    expect(reviews).toEqual([
      {
        id: "1690000000",
        authorName: "Marina R.",
        text: "Ótimo trabalho!",
        rating: 5,
        relativeTime: "há 2 meses",
        order: 0,
      },
      {
        id: "1680000000",
        authorName: "Carlos B.",
        text: "Recomendo.",
        rating: 4,
        relativeTime: "há 6 meses",
        order: 1,
      },
    ]);
  });

  it('retorna array vazio quando "reviews" não vem na resposta', async () => {
    mockFetchOnce({ status: "OK", result: {} });
    const reviews = await fetchGoogleReviews("fake-api-key", "ChIJfake");
    expect(reviews).toEqual([]);
  });

  it("lança um erro com a mensagem da Places API quando status não é OK", async () => {
    mockFetchOnce({ status: "REQUEST_DENIED", error_message: "API key inválida" });
    await expect(fetchGoogleReviews("fake-api-key", "ChIJfake")).rejects.toThrow(
      'Places API retornou "REQUEST_DENIED": API key inválida',
    );
  });
});
```

- [ ] **Step 2: Rodar o teste, confirmar que falha**

```bash
cd admin-photo && npx vitest run src/api/infrastructure/google/fetchGoogleReviews.test.ts
```

Esperado: FAIL — `fetchGoogleReviews.ts` não existe ainda.

- [ ] **Step 3: Implementar `fetchGoogleReviews.ts`**

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

// Endpoint legado (Place Details) — só precisa de API key, sem OAuth,
// sem exigir posse verificada do Google Meu Negócio. "fields"
// restrito ao necessário (reviews) pra manter o custo da chamada
// baixo.
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

- [ ] **Step 4: Rodar o teste, confirmar que passa**

```bash
cd admin-photo && npx vitest run src/api/infrastructure/google/fetchGoogleReviews.test.ts
```

Esperado: 3 testes passando.

- [ ] **Step 5: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 6: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 1, Step 8)**

- [ ] **Step 7: Commit**

```bash
cd admin-photo
git add src/api/infrastructure/google/fetchGoogleReviews.ts \
        src/api/infrastructure/google/fetchGoogleReviews.test.ts
git commit -m "$(cat <<'EOF'
feat: add Google Places API client (fetchGoogleReviews)

Chama o endpoint legado Place Details (só API key, sem OAuth) e mapeia
a resposta pro formato GoogleReview[] usado pelo resto da integração.
Função isolada, testada com fetch mockado — sem tocar Firestore.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Função de sincronização (TDD, admin-photo)

**Files:**

- Create: `admin-photo/src/actions/_lib/planTestimonialsSync.ts`
- Create: `admin-photo/src/actions/_lib/planTestimonialsSync.test.ts`

**Interfaces:**

- Consumes: `Testimonial` (Task 1), `GoogleReview` (Task 3).
- Produces: `TestimonialsSyncPlan` (toUpsert, idsToTombstone),
  `planTestimonialsSync(existing: Testimonial[], fresh: GoogleReview[]):
TestimonialsSyncPlan`. Task 5 (`refreshTestimonialsFromGoogle`)
  consome essa função.

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from "vitest";
import { planTestimonialsSync } from "./planTestimonialsSync";
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { GoogleReview } from "@/api/infrastructure/google/fetchGoogleReviews";

function testimonial(overrides: Partial<Testimonial> & { id: string }): Testimonial {
  return {
    authorName: "Nome",
    text: "Texto",
    rating: 5,
    relativeTime: "há 1 mês",
    order: 0,
    visible: true,
    ...overrides,
  };
}

function review(overrides: Partial<GoogleReview> & { id: string }): GoogleReview {
  return {
    authorName: "Nome",
    text: "Texto",
    rating: 5,
    relativeTime: "há 1 mês",
    order: 0,
    ...overrides,
  };
}

describe("planTestimonialsSync", () => {
  it("depoimento novo (sem correspondente no rascunho) entra visible:true", () => {
    const plan = planTestimonialsSync([], [review({ id: "novo" })]);
    expect(plan.toUpsert).toEqual([{ ...review({ id: "novo" }), visible: true }]);
    expect(plan.idsToTombstone).toEqual([]);
  });

  it("preserva visible:false de um depoimento já existente que o Google ainda retorna", () => {
    const existing = [testimonial({ id: "ja-existe", visible: false })];
    const fresh = [review({ id: "ja-existe" })];
    const plan = planTestimonialsSync(existing, fresh);
    expect(plan.toUpsert).toEqual([{ ...review({ id: "ja-existe" }), visible: false }]);
    expect(plan.idsToTombstone).toEqual([]);
  });

  it("marca pra tombstone quem existia no rascunho mas não veio mais do Google", () => {
    const existing = [testimonial({ id: "sumiu" })];
    const plan = planTestimonialsSync(existing, []);
    expect(plan.toUpsert).toEqual([]);
    expect(plan.idsToTombstone).toEqual(["sumiu"]);
  });

  it("combina os três casos numa única chamada", () => {
    const existing = [
      testimonial({ id: "continua", visible: false }),
      testimonial({ id: "sumiu" }),
    ];
    const fresh = [review({ id: "continua" }), review({ id: "novo" })];
    const plan = planTestimonialsSync(existing, fresh);
    expect(plan.toUpsert.map((t) => t.id)).toEqual(["continua", "novo"]);
    expect(plan.toUpsert.find((t) => t.id === "continua")?.visible).toBe(false);
    expect(plan.toUpsert.find((t) => t.id === "novo")?.visible).toBe(true);
    expect(plan.idsToTombstone).toEqual(["sumiu"]);
  });
});
```

- [ ] **Step 2: Rodar o teste, confirmar que falha**

```bash
cd admin-photo && npx vitest run src/actions/_lib/planTestimonialsSync.test.ts
```

Esperado: FAIL — `planTestimonialsSync.ts` não existe ainda.

- [ ] **Step 3: Implementar `planTestimonialsSync.ts`**

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { GoogleReview } from "@/api/infrastructure/google/fetchGoogleReviews";

export interface TestimonialsSyncPlan {
  toUpsert: Testimonial[];
  idsToTombstone: string[];
}

// Preserva o "visible" de quem já existia (ocultar não pode ressuscitar
// só porque o Google ainda retorna aquela avaliação); quem é novo entra
// visível por padrão. Quem não veio mais na resposta do Google vira
// tombstone (_deleted:true no rascunho, resolvido de verdade só no
// Publicar) — mesmo espírito de planPublish.ts: função pura, sem
// tocar Firestore, testável isolada.
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

- [ ] **Step 4: Rodar o teste, confirmar que passa**

```bash
cd admin-photo && npx vitest run src/actions/_lib/planTestimonialsSync.test.ts
```

Esperado: 4 testes passando.

- [ ] **Step 5: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 6: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 1, Step 8)**

- [ ] **Step 7: Commit**

```bash
cd admin-photo
git add src/actions/_lib/planTestimonialsSync.ts \
        src/actions/_lib/planTestimonialsSync.test.ts
git commit -m "$(cat <<'EOF'
feat: add planTestimonialsSync (pure sync planning function)

Mesmo espírito de planPublish.ts — dado o estado atual do rascunho +
a resposta fresca da Places API, decide o que fazer: preserva o
visible de quem já existia (ocultar não pode ressuscitar num refresh
futuro), marca tombstone quem sumiu da resposta do Google. Função
pura, sem tocar Firestore.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Actions, env vars e wiring de publish/sync (admin-photo)

**Files:**

- Create: `admin-photo/src/actions/testimonials.ts`
- Modify: `admin-photo/src/config/env.server.ts`
- Modify: `admin-photo/.env.example`
- Modify: `admin-photo/src/actions/publish.ts`

**Interfaces:**

- Consumes: `RepositoryFactory.testimonials()` (Tasks 1-2),
  `fetchGoogleReviews` (Task 3), `planTestimonialsSync` (Task 4),
  `markDraftDirty` (já existe).
- Produces: `getTestimonials(): Promise<Testimonial[]>`,
  `refreshTestimonialsFromGoogle(): Promise<Testimonial[]>`,
  `setTestimonialVisibility(id: string, visible: boolean):
Promise<Testimonial>`. Tasks 9-11 (UI do `/preview`) consomem essas
  três funções.

- [ ] **Step 1: Adicionar as duas variáveis opcionais em `env.server.ts`**

Em `admin-photo/src/config/env.server.ts`, dentro do `z.object({...})`,
adicionar (depois de `CLOUDINARY_API_SECRET`):

```ts
    // API key da Places API do Google (Legacy) — só leitura de
    // avaliações públicas de um place, sem OAuth, sem precisar ser
    // dono do Google Meu Negócio. Opcional: ausente,
    // refreshTestimonialsFromGoogle() lança um erro tratado (toast),
    // resto do app funciona normal.
    GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
    // Place ID do Google Maps do negócio (formato ChIJ..., achado via
    // "Place ID Finder" do Google) — diferente do CID já usado no
    // link "Avaliar" existente no site (0x...:0x...), não dá pra
    // reaproveitar direto.
    GOOGLE_PLACE_ID: z.string().min(1).optional(),
```

- [ ] **Step 2: Adicionar as duas linhas em `.env.example`**

No fim de `admin-photo/.env.example`:

```
# API key da Places API do Google (Legacy) e Place ID do negócio (o
# link "Avaliar" no site usa um CID, formato diferente — o Place ID
# certo se acha na ferramenta "Place ID Finder" do Google). Sem elas,
# "Atualizar avaliações" no /preview mostra um erro em vez de buscar.
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACE_ID=
```

- [ ] **Step 3: Criar `src/actions/testimonials.ts`**

```ts
"use server";

import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import { fetchGoogleReviews } from "@/api/infrastructure/google/fetchGoogleReviews";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import { env } from "@/config/env.server";
import { assertSession } from "@/lib/auth/session";
import { markDraftDirty } from "./_lib/markDraftDirty";
import { planTestimonialsSync } from "./_lib/planTestimonialsSync";

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

- [ ] **Step 4: Adicionar `testimonials` a `ENTITIES` e `REVALIDATE_TAGS` em `publish.ts`**

Em `admin-photo/src/actions/publish.ts`, trocar:

```ts
const ENTITIES = ["niches", "packages", "placements", "photos"] as const;
```

por:

```ts
const ENTITIES = ["niches", "packages", "placements", "photos", "testimonials"] as const;
```

E trocar:

```ts
const REVALIDATE_TAGS = ["niches", "packages", "placements", "profile"] as const;
```

por:

```ts
const REVALIDATE_TAGS = ["niches", "packages", "placements", "profile", "testimonials"] as const;
```

(Isso é suficiente — `publishEntity`/`syncEntity` já são genéricos por
nome de entidade, sem código novo nelas. `testimonials` reaproveita o
mesmo tombstone-aware `planPublish` usado por niches/packages/etc.)

- [ ] **Step 5: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 6: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 1, Step 8)**

- [ ] **Step 7: Commit**

```bash
cd admin-photo
git add src/actions/testimonials.ts \
        src/config/env.server.ts \
        .env.example \
        src/actions/publish.ts
git commit -m "$(cat <<'EOF'
feat: add testimonials actions, env vars, and publish/sync wiring

getTestimonials/refreshTestimonialsFromGoogle/setTestimonialVisibility
— a segunda chama a Places API (GOOGLE_PLACES_API_KEY/GOOGLE_PLACE_ID,
opcionais, ausentes = erro tratado em vez de mock silencioso, já que
não tem "modo mock" sensato pra uma chamada de API externa) e
sincroniza via planTestimonialsSync. publish.ts ganha "testimonials"
em ENTITIES/REVALIDATE_TAGS — reaproveita o publishEntity/syncEntity
genéricos já tombstone-aware, sem código novo neles.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Domínio Testimonial em app-photo (leitura)

**Files:**

- Create: `app-photo/src/api/domain/testimonial/Testimonial.ts`
- Create: `app-photo/src/api/domain/testimonial/TestimonialRepository.ts`
- Create: `app-photo/src/api/infrastructure/repositories/TestimonialRepositoryImpl.ts`
- Create: `app-photo/src/api/infrastructure/repositories/mock/MockTestimonialRepository.ts`
- Create: `app-photo/src/api/infrastructure/repositories/mock/MockTestimonialRepository.test.ts`
- Modify: `app-photo/src/api/infrastructure/repositories/RepositoryFactory.ts`

**Interfaces:**

- Consumes: nada de admin-photo (stack independente, mesma forma de
  dado).
- Produces: `Testimonial`, `TestimonialRepository` (só leitura:
  `findAll`), `RepositoryFactory.testimonials():
Promise<TestimonialRepository>`. Task 7 consome isso.

- [ ] **Step 1: Criar `Testimonial.ts`**

Mesmo formato do domínio em admin-photo — os dois repos não
compartilham código, mas a forma do dado é a mesma (mesma coleção do
Firestore).

```ts
export interface Testimonial {
  id: string;
  authorName: string;
  text: string;
  rating: number;
  relativeTime: string;
  order: number;
  visible: boolean;
}
```

- [ ] **Step 2: Criar `TestimonialRepository.ts`**

App-photo só lê — sem upsert/tombstone/setVisibility (isso é só do
admin).

```ts
import type { Testimonial } from "./Testimonial";

export interface TestimonialRepository {
  findAll(): Promise<Testimonial[]>;
}
```

- [ ] **Step 3: Criar `TestimonialRepositoryImpl.ts`**

Mesmo padrão de `NicheRepositoryImpl.ts` deste repo — lê
`testimonials`/`testimonials_draft` conforme `isDraft`, `unstable_cache`
com tag `"testimonials"` só na leitura live (draft sempre direto,
prioriza corretude).

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "testimonials";
const DRAFT_COLLECTION = "testimonials_draft";

function toTestimonial(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Testimonial {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    id: doc.id,
    authorName: data.authorName,
    text: data.text,
    rating: data.rating,
    relativeTime: data.relativeTime,
    order: data.order,
    visible: data.visible,
  };
}

const findAllTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.map(toTestimonial);
  },
  ["testimonials", "findAll"],
  { tags: ["testimonials"] },
);

async function findAllDraftTestimonials(): Promise<Testimonial[]> {
  const snapshot = await db.collection(DRAFT_COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.filter((doc) => !doc.data()._deleted).map(toTestimonial);
}

export class TestimonialRepositoryImpl implements TestimonialRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findAll(): Promise<Testimonial[]> {
    return this.isDraft ? findAllDraftTestimonials() : findAllTestimonials();
  }
}
```

- [ ] **Step 4: Criar `MockTestimonialRepository.ts`**

Mesmo seed do mock em admin-photo (Task 1) — mantém os dois repos
consistentes em dev.

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";

// Transcrição fiel do array TESTIMONIALS que hoje vive em
// src/actions/testimonials.ts — mesmo texto, com os campos novos do
// domínio Testimonial. Mesmo seed do MockTestimonialRepository do
// admin-photo, pra manter os dois repos consistentes em dev.
const TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-1",
    authorName: "Marina R.",
    text: "A Denise deixou todo mundo à vontade. As fotos da família ficaram naturais, sem pose forçada.",
    rating: 5,
    relativeTime: "há 3 meses",
    order: 0,
    visible: true,
  },
  {
    id: "seed-2",
    authorName: "Carlos e Bia",
    text: "Fotografou nosso casamento civil e o pré-wedding. Entregou antes do prazo e cada foto conta uma história.",
    rating: 5,
    relativeTime: "há 6 meses",
    order: 1,
    visible: true,
  },
  {
    id: "seed-3",
    authorName: "Luiza M.",
    text: "Precisava de retratos profissionais para o LinkedIn e saí com um material que uso até hoje.",
    rating: 5,
    relativeTime: "há 1 ano",
    order: 2,
    visible: true,
  },
];

export class MockTestimonialRepository implements TestimonialRepository {
  async findAll(): Promise<Testimonial[]> {
    return [...TESTIMONIALS].sort((a, b) => a.order - b.order);
  }
}
```

- [ ] **Step 5: Criar `MockTestimonialRepository.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { MockTestimonialRepository } from "./MockTestimonialRepository";

describe("MockTestimonialRepository", () => {
  it("findAll retorna os 3 seeds, ordenados por order", async () => {
    const repo = new MockTestimonialRepository();
    const all = await repo.findAll();
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.authorName)).toEqual(["Marina R.", "Carlos e Bia", "Luiza M."]);
  });

  it("todos os seeds vêm com visible:true", async () => {
    const repo = new MockTestimonialRepository();
    const all = await repo.findAll();
    expect(all.every((t) => t.visible)).toBe(true);
  });
});
```

- [ ] **Step 6: Rodar os testes**

```bash
cd app-photo && npx vitest run src/api/infrastructure/repositories/mock/MockTestimonialRepository.test.ts
```

Esperado: 2 testes passando.

- [ ] **Step 7: Adicionar `testimonials()` ao `RepositoryFactory.ts`**

Em `app-photo/src/api/infrastructure/repositories/RepositoryFactory.ts`,
adicionar aos imports:

```ts
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import { TestimonialRepositoryImpl } from "./TestimonialRepositoryImpl";
import { MockTestimonialRepository } from "./mock/MockTestimonialRepository";
```

E no objeto `RepositoryFactory`:

```ts
  testimonials: async (): Promise<TestimonialRepository> => {
    if (shouldUseMock()) return new MockTestimonialRepository();
    return new TestimonialRepositoryImpl(await resolveIsDraft());
  },
```

- [ ] **Step 8: Rodar a verificação completa**

```bash
cd app-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 9: Reiniciar o dev server se estava de pé**

```bash
lsof -iTCP:3000 -sTCP:LISTEN -n -P
```

Se havia processo na porta 3000 antes do `npm run build`: matar,
`rm -rf .next`, `npm run dev` de novo em background, esperar
`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
voltar `200`.

- [ ] **Step 10: Commit**

```bash
cd app-photo
git add src/api/domain/testimonial/Testimonial.ts \
        src/api/domain/testimonial/TestimonialRepository.ts \
        src/api/infrastructure/repositories/TestimonialRepositoryImpl.ts \
        src/api/infrastructure/repositories/mock/MockTestimonialRepository.ts \
        src/api/infrastructure/repositories/mock/MockTestimonialRepository.test.ts \
        src/api/infrastructure/repositories/RepositoryFactory.ts
git commit -m "$(cat <<'EOF'
feat: add Testimonial domain (read-only) in app-photo

Stack independente da de admin-photo, mesma forma de dado — só leitura
(findAll), lendo testimonials/testimonials_draft conforme o cookie de
rascunho, mesmo padrão de NicheRepositoryImpl.ts deste repo. Mock
semeado com os mesmos 3 depoimentos do mock do admin-photo.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Reescrever `actions/testimonials.ts` em app-photo

**Files:**

- Modify: `app-photo/src/actions/testimonials.ts`
- Modify: `app-photo/src/actions/testimonials.test.ts`

**Interfaces:**

- Consumes: `RepositoryFactory.testimonials()` (Task 6).
- Produces: `Testimonial` (name, text, rating — forma "de exibição",
  diferente do domínio interno), `getTestimonials():
Promise<Testimonial[]>` (só os `visible: true`, ordenados). Task 8
  (`Testimonials.tsx`) consome isso.

- [ ] **Step 1: Reescrever `src/actions/testimonials.ts`**

```ts
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const repo = await RepositoryFactory.testimonials();
  const all = await repo.findAll();
  return all
    .filter((t) => t.visible)
    .map((t) => ({ id: t.id, name: t.authorName, text: t.text, rating: t.rating }));
}
```

(`id` entra na forma de exibição — a Task 8 precisa dele como `key`
do React e pro `data-editable`/`data-addable`.)

- [ ] **Step 2: Atualizar `src/actions/testimonials.test.ts`**

O teste atual (`toHaveLength(3)` + nome/texto preenchidos) já passa
sem mudança nenhuma contra o novo mock (mesmos 3 seeds, mesma forma
`name`/`text` na saída) — só adicionar uma asserção pro campo `rating`
novo, pra cobrir o que mudou de verdade:

```ts
import { describe, expect, it } from "vitest";
import { getTestimonials } from "./testimonials";

describe("getTestimonials", () => {
  it("retorna 3 depoimentos, cada um com nome, texto e nota preenchidos", async () => {
    const testimonials = await getTestimonials();
    expect(testimonials).toHaveLength(3);
    for (const t of testimonials) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.text.length).toBeGreaterThan(0);
      expect(t.rating).toBeGreaterThanOrEqual(1);
      expect(t.rating).toBeLessThanOrEqual(5);
    }
  });
});
```

- [ ] **Step 3: Rodar o teste**

```bash
cd app-photo && npx vitest run src/actions/testimonials.test.ts
```

Esperado: 1 teste passando.

- [ ] **Step 4: Rodar a verificação completa**

```bash
cd app-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 5: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 6, Step 9)**

- [ ] **Step 6: Commit**

```bash
cd app-photo
git add src/actions/testimonials.ts src/actions/testimonials.test.ts
git commit -m "$(cat <<'EOF'
feat: read testimonials from Firestore instead of a hardcoded array

getTestimonials() troca o array TESTIMONIALS fixo por
RepositoryFactory.testimonials().findAll(), filtrando só os
visible:true. Mesmo padrão de getNiches()/getPackages() deste repo.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Reescrever `Testimonials.tsx` (estrelas, Addable, Editable)

**Files:**

- Modify: `app-photo/src/app/_components/Addable.tsx`
- Modify: `app-photo/src/app/_components/Editable.tsx`
- Modify: `app-photo/src/app/_components/Testimonials.tsx`

**Interfaces:**

- Consumes: `getTestimonials()` (Task 7) — agora retorna
  `{id, name, text, rating}`.
- Produces: `Addable`'s `type` union ganha `"testimonials"`,
  `Editable`'s `type` union ganha `"testimonial"` — Task 9-10 (admin-
  photo) consomem esses `entityType` strings via postMessage (não há
  acoplamento de tipos entre os repos, só a string em si precisa
  bater).

- [ ] **Step 1: Estender o union de `Addable.tsx`**

Em `app-photo/src/app/_components/Addable.tsx`, trocar:

```tsx
type: "niche" | "package" | "placement";
```

por:

```tsx
type: "niche" | "package" | "placement" | "testimonials";
```

- [ ] **Step 2: Estender o union de `Editable.tsx`**

Em `app-photo/src/app/_components/Editable.tsx`, trocar:

```tsx
type: "niche" | "package" | "placement" | "profile";
```

por:

```tsx
type: "niche" | "package" | "placement" | "profile" | "testimonial";
```

- [ ] **Step 3: Reescrever `Testimonials.tsx`**

```tsx
import { FaStar } from "react-icons/fa";
import { Section } from "@/lib/_components/Section";
import { getTestimonials } from "@/actions/testimonials";
import { ADD_PILL_CLASSNAME, Addable } from "./Addable";
import { Editable } from "./Editable";

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-hidden="true" className="relative z-10 mb-2 flex gap-0.5 text-rose">
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} className={i < rating ? "opacity-100" : "opacity-20"} />
      ))}
    </div>
  );
}

export async function Testimonials() {
  const testimonials = await getTestimonials();
  return (
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
      <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 pb-12 pt-4">
        {testimonials.map((t) => (
          <Editable key={t.id} type="testimonial" id={t.id}>
            <blockquote
              className="relative flex w-72 shrink-0 flex-col overflow-hidden border border-rose/20 p-6"
              style={{ boxShadow: "var(--shadow-rose)" }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--rose) 12%, transparent) 0 14px, transparent 15px), radial-gradient(circle at 62% 34%, color-mix(in oklab, var(--rose) 8%, transparent) 0 20px, transparent 21px), radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--rose) 10%, transparent) 0 18px, transparent 19px), radial-gradient(circle at 78% 88%, color-mix(in oklab, var(--rose) 8%, transparent) 0 16px, transparent 17px)",
                  backgroundSize: "190px 190px",
                }}
              />
              <Stars rating={t.rating} />
              <span
                aria-hidden="true"
                className="font-display relative z-10 block text-4xl leading-none text-rose"
              >
                &ldquo;
              </span>
              <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground">
                {t.text}
              </p>
              <footer className="font-condensed relative z-10 mt-auto pt-4 text-[0.65rem] uppercase tracking-[0.3em] text-rose">
                {t.name}
              </footer>
            </blockquote>
          </Editable>
        ))}
      </div>
      <a
        href="https://www.google.com/search?q=denise+galvao+fotografia&sourceid=chrome&source=chrome.ob&ie=UTF-8#lrd=0x94f395332f295643:0xf7bfc7c474976814,3,,,,"
        target="_blank"
        rel="noreferrer"
        className="relative mx-auto mt-6 block w-fit overflow-hidden px-6 py-3 text-center"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-rose/10 backdrop-blur-sm"
          style={{
            boxShadow: "var(--shadow-rose)",
            maskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
        <span className="font-condensed relative text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
          Avaliar
        </span>
      </a>
    </Section>
  );
}
```

(Único conteúdo trocado de verdade em relação ao arquivo atual: o
`action` do `Section`, o `<Editable>` ao redor de cada `<blockquote>`,
e o `<Stars>` novo. O resto — link "Avaliar", gradiente de fundo,
aspas decorativas — é idêntico ao que já existe hoje.)

- [ ] **Step 4: Rodar a verificação completa**

```bash
cd app-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 5: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 6, Step 9)**

- [ ] **Step 6: Smoke test estrutural**

```bash
curl -s http://localhost:3000/ -o /tmp/home.html -w "%{http_code}\n"
grep -o "Marina R\.\|Atualizar avaliações\|data-editable=\"testimonial:" /tmp/home.html
```

Esperado: `200`, e as três ocorrências presentes no HTML.

- [ ] **Step 7: Commit**

```bash
cd app-photo
git add src/app/_components/Addable.tsx \
        src/app/_components/Editable.tsx \
        src/app/_components/Testimonials.tsx
git commit -m "$(cat <<'EOF'
feat: show star ratings and wire up Addable/Editable on testimonials

Cada cartão de depoimento ganha as estrelinhas da nota (FaStar,
preenchida conforme t.rating) e vira um <Editable type="testimonial">
(ativa o ícone de lixeira genérico no hover, pra ocultar pelo admin).
O título da seção ganha a pill "Atualizar avaliações" (Addable, mesmo
componente/estilo de "Adicionar nova foto"). PreviewOverlay.tsx não
muda — o mecanismo de postMessage já é genérico por entityType.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Wiring de testimonials + gatilho de sincronização no /preview

**Files:**

- Modify: `admin-photo/src/app/preview/page.tsx`
- Modify: `admin-photo/src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `getTestimonials`, `refreshTestimonialsFromGoogle` (Task
  5), `Testimonial` (Task 1).
- Produces: `PreviewFrame` ganha um novo state `testimonials`/
  `setTestimonials`, disponível pras Tasks 10-11.

- [ ] **Step 1: Passar `testimonials` pro `PreviewFrame` em `preview/page.tsx`**

Em `admin-photo/src/app/preview/page.tsx`, adicionar ao import:

```ts
import { getTestimonials } from "@/actions/testimonials";
```

Trocar:

```ts
const [niches, packages, photos, placements, profile, publishState] = await Promise.all([
  getNiches(),
  getPackages(),
  getPhotos(),
  getPlacements(),
  getProfile(),
  getPublishState(),
]);
```

por:

```ts
const [niches, packages, photos, placements, profile, publishState, testimonials] =
  await Promise.all([
    getNiches(),
    getPackages(),
    getPhotos(),
    getPlacements(),
    getProfile(),
    getPublishState(),
    getTestimonials(),
  ]);
```

Trocar a chamada de `<PreviewFrame ... />` (o `return` da função) de:

```tsx
<main className="p-8">
  <PreviewFrame
    saudacao={saudacao}
    displayName={displayName}
    niches={niches}
    packages={packages}
    photos={photos}
    placements={placements}
    profile={profile}
    publishState={publishState}
    draftToken={env.REVALIDATE_SECRET ?? null}
  />
</main>
```

por:

```tsx
<main className="p-8">
  <PreviewFrame
    saudacao={saudacao}
    displayName={displayName}
    niches={niches}
    packages={packages}
    photos={photos}
    placements={placements}
    profile={profile}
    testimonials={testimonials}
    publishState={publishState}
    draftToken={env.REVALIDATE_SECRET ?? null}
  />
</main>
```

- [ ] **Step 2: Aceitar a prop em `PreviewFrame.tsx`**

Adicionar ao import de tipos:

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import { refreshTestimonialsFromGoogle } from "@/actions/testimonials";
```

Na assinatura da função, adicionar `testimonials` aos parâmetros
desestruturados e ao tipo das props (junto com os outros
`initialX`/`X`):

```ts
export function PreviewFrame({
    saudacao,
    displayName,
    niches: initialNiches,
    packages: initialPackages,
    photos: initialPhotos,
    placements: initialPlacements,
    profile: initialProfile,
    testimonials: initialTestimonials,
    publishState,
    draftToken,
}: {
    saudacao: string;
    displayName: string;
    niches: NicheViewModel[];
    packages: PackageViewModel[];
    photos: PhotoViewModel[];
    placements: PlacementViewModel[];
    profile: ProfileDTO | null;
    testimonials: Testimonial[];
    publishState: PublishState;
    draftToken: string | null;
}) {
```

E logo abaixo dos outros `useState`:

```ts
const [testimonials, setTestimonials] = useState(initialTestimonials);
```

- [ ] **Step 3: Desviar o `ADD` handler pra `testimonials` antes de `resolveAddHandler`**

Trocar (dentro do `handleMessage`):

```ts
if (event.data?.type === ADD) {
  const target = resolveAddHandler(event.data.entityType, event.data.context);
  if (!target) {
    showToast({ message: "Não foi possível abrir a criação.", variant: "error" });
    return;
  }
  setActiveAdd(target);
  return;
}
```

por:

```ts
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
  if (!target) {
    showToast({ message: "Não foi possível abrir a criação.", variant: "error" });
    return;
  }
  setActiveAdd(target);
  return;
}
```

- [ ] **Step 4: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 5: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 1, Step 8)**

- [ ] **Step 6: Commit**

```bash
cd admin-photo
git add src/app/preview/page.tsx src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: wire testimonials into /preview, sync trigger on the ADD message

preview/page.tsx busca getTestimonials() junto com o resto do
Promise.all e passa pro PreviewFrame. O handler do ADD ganha um
desvio: entityType "testimonials" (a pill "Atualizar avaliações" no
app-photo) não abre modal nenhum — chama refreshTestimonialsFromGoogle
direto, com loading/toast via runMutation, igual qualquer outra
mutação.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Ocultar avaliação (lixeira no hover)

**Files:**

- Create: `admin-photo/src/app/preview/_components/deleteHandlers.test.ts` (modify — arquivo já existe)
- Modify: `admin-photo/src/app/preview/_components/deleteHandlers.ts`
- Modify: `admin-photo/src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `Testimonial` (Task 1/9's state), `setTestimonialVisibility`
  (Task 5).
- Produces: `DeleteTarget` ganha o caso `{kind: 'testimonial';
testimonial: Testimonial}` — Task 11 (`TestimonialsPanel`) não
  depende disso diretamente, mas mexe no mesmo `testimonials` state.

- [ ] **Step 1: Estender `DeleteTarget` e `DELETE_HANDLERS` em `deleteHandlers.ts`**

Trocar:

```ts
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";

export type DeleteTarget =
  | { kind: "niche"; niche: NicheViewModel }
  | { kind: "package"; pkg: PackageViewModel }
  | { kind: "placement"; placement: PlacementViewModel };

interface Lists {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  placements: PlacementViewModel[];
}
```

por:

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";

export type DeleteTarget =
  | { kind: "niche"; niche: NicheViewModel }
  | { kind: "package"; pkg: PackageViewModel }
  | { kind: "placement"; placement: PlacementViewModel }
  | { kind: "testimonial"; testimonial: Testimonial };

interface Lists {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  placements: PlacementViewModel[];
  testimonials: Testimonial[];
}
```

E dentro de `DELETE_HANDLERS`, adicionar (depois de `placement`):

```ts
    testimonial: (id, lists) => {
        const testimonial = lists.testimonials.find(t => t.id === id);
        return testimonial ? { kind: 'testimonial', testimonial } : null;
    },
```

- [ ] **Step 2: Atualizar `deleteHandlers.test.ts`**

Adicionar `testimonials` ao objeto `lists` já existente no topo do
arquivo e um teste novo, mantendo os testes atuais intactos:

```ts
import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { describe, expect, it } from "vitest";
import { resolveDeleteHandler } from "./deleteHandlers";

const niche = { slug: "familia", title: "Família" } as NicheViewModel;
const pkg = { id: "pacote-1", name: "Essencial" } as PackageViewModel;
const placement = { id: "mock-placement-1", photoId: "foto-1" } as PlacementViewModel;
const testimonial = { id: "seed-1", authorName: "Marina R." } as Testimonial;

const lists = {
  niches: [niche],
  packages: [pkg],
  placements: [placement],
  testimonials: [testimonial],
};

describe("resolveDeleteHandler", () => {
  it("resolve um nicho pelo slug", () => {
    expect(resolveDeleteHandler("niche", "familia", lists)).toEqual({ kind: "niche", niche });
  });

  it("resolve um pacote pelo id", () => {
    expect(resolveDeleteHandler("package", "pacote-1", lists)).toEqual({
      kind: "package",
      pkg,
    });
  });

  it("resolve um placement pelo id", () => {
    expect(resolveDeleteHandler("placement", "mock-placement-1", lists)).toEqual({
      kind: "placement",
      placement,
    });
  });

  it("resolve um depoimento pelo id", () => {
    expect(resolveDeleteHandler("testimonial", "seed-1", lists)).toEqual({
      kind: "testimonial",
      testimonial,
    });
  });

  it("retorna null pra um tipo desconhecido (ex.: profile — não é deletável)", () => {
    expect(resolveDeleteHandler("profile", "main", lists)).toBeNull();
  });

  it("retorna null quando o id não está na lista carregada", () => {
    expect(resolveDeleteHandler("niche", "nao-existe", lists)).toBeNull();
  });
});
```

- [ ] **Step 3: Rodar o teste**

```bash
cd admin-photo && npx vitest run src/app/preview/_components/deleteHandlers.test.ts
```

Esperado: 6 testes passando.

- [ ] **Step 4: Atualizar `PreviewFrame.tsx` — `deleteLabel`, `handleDelete`, e a chamada de `resolveDeleteHandler` no `handleMessage`**

Trocar a assinatura de `deleteLabel` (adicionar o caso `testimonial`):

```ts
function deleteLabel(target: DeleteTarget): { title: string; description: string } {
  switch (target.kind) {
    case "niche":
      return {
        title: "Remover nicho",
        description: `Remover "${target.niche.title}"? Esta ação não pode ser desfeita.`,
      };
    case "package":
      return {
        title: "Remover pacote",
        description: `Remover "${target.pkg.name}"? Esta ação não pode ser desfeita.`,
      };
    case "placement":
      return {
        title: "Remover posicionamento",
        description:
          "Remover este posicionamento? A foto em si não é apagada, só desvinculada desta superfície.",
      };
    case "testimonial":
      return {
        title: "Ocultar avaliação",
        description:
          "Esta avaliação some do site. Você pode trazer de volta na lista de avaliações, ao lado do Publicar.",
      };
  }
}
```

No `handleMessage`, o bloco do `DELETE` passa a incluir `testimonials`
nas `lists`:

```ts
            if (event.data?.type === DELETE) {
                const target = resolveDeleteHandler(event.data.entityType, event.data.id, {
                    niches,
                    packages,
                    placements,
                    testimonials,
                });
```

(resto do bloco `DELETE` inalterado.)

E em `handleDelete`, adicionar o caso `testimonial` ao switch (chama
`setTestimonialVisibility`, não uma action de delete de verdade) e, no
bloco de sucesso, atualizar o item em vez de filtrá-lo (uma avaliação
oculta continua existindo, só com `visible:false` — precisa continuar
na lista pra `TestimonialsPanel`, Task 11, poder trazê-la de volta):

O caso `testimonial` vira um `return` antecipado, **fora** do switch
compartilhado dos outros três — se ficasse dentro, o `result` do
switch teria um tipo união (`MutationResult<NicheViewModel |
PackageViewModel | void | Testimonial>`) e o TypeScript não consegue
correlacionar `deleting.kind` com qual branch do `result` foi tomada,
então `result.value.id` no branch de testimonial não tipa como
`Testimonial` de forma segura. Isolar a chamada resolve isso — o tipo
de `result` ali fica só `MutationResult<Testimonial>`, sem união.

```ts
async function handleDelete() {
  if (!deleting) return;

  if (deleting.kind === "testimonial") {
    const result = await runMutation(
      () => setTestimonialVisibility(deleting.testimonial.id, false),
      { success: "Avaliação ocultada.", fallbackError: "Falha ao ocultar a avaliação." },
    );
    if (result.ok) {
      setTestimonials((prev) => prev.map((t) => (t.id === result.value.id ? result.value : t)));
      reloadIframe();
    }
    return;
  }

  const result = await (async () => {
    switch (deleting.kind) {
      case "niche":
        return runMutation(() => deleteNiche(deleting.niche.slug), {
          success: "Nicho removido.",
          fallbackError: "Falha ao remover nicho.",
        });
      case "package":
        return runMutation(() => deletePackage(deleting.pkg.id), {
          success: "Pacote removido.",
          fallbackError: "Falha ao remover pacote.",
        });
      case "placement":
        return runMutation(() => deletePlacement(deleting.placement.id), {
          success: "Posicionamento removido.",
          fallbackError: "Falha ao remover posicionamento.",
        });
    }
  })();
  if (result.ok) {
    if (deleting.kind === "niche") {
      setNiches((prev) => prev.filter((n) => n.slug !== deleting.niche.slug));
    } else if (deleting.kind === "package") {
      setPackages((prev) => prev.filter((p) => p.id !== deleting.pkg.id));
    } else {
      setPlacements((prev) => prev.filter((p) => p.id !== deleting.placement.id));
    }
    reloadIframe();
  }
}
```

Adicionar `setTestimonialVisibility` ao import de
`@/actions/testimonials` (já existe `refreshTestimonialsFromGoogle`
importado de lá desde a Task 9):

```ts
import { refreshTestimonialsFromGoogle, setTestimonialVisibility } from "@/actions/testimonials";
```

E adicionar `testimonials` (e `placements`, se ainda não estiver) ao
array de dependências do `useEffect` que contém `handleMessage`:

```ts
    }, [appPhotoOrigin, niches, packages, placements, profile, testimonials]);
```

- [ ] **Step 5: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 6: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 1, Step 8)**

- [ ] **Step 7: Commit**

```bash
cd admin-photo
git add src/app/preview/_components/deleteHandlers.ts \
        src/app/preview/_components/deleteHandlers.test.ts \
        src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: hide testimonials via the generic hover-delete icon

DeleteTarget ganha o caso "testimonial" — o ícone de lixeira genérico
(hover em qualquer data-editable) chama setTestimonialVisibility(id,
false) em vez de apagar de verdade. Diferente dos outros casos, o
depoimento oculto continua no estado local (visible:false), não é
filtrado da lista — precisa continuar visível pro painel de moderação
(próxima commit) poder trazê-lo de volta.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Painel de moderação (mostrar avaliação oculta de novo)

**Files:**

- Create: `admin-photo/src/app/preview/_components/TestimonialsPanel.tsx`
- Modify: `admin-photo/src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `Testimonial`, `setTestimonialVisibility` (Task 5),
  `testimonials`/`setTestimonials` (Task 9).
- Produces: nada consumido por tasks futuras — última task do plano.

- [ ] **Step 1: Criar `TestimonialsPanel.tsx`**

Mesmo espírito visual do antigo `OrphanPhotosPanel.tsx` (painel
colapsável, fora do iframe) — lista **todas** as avaliações
sincronizadas, visíveis e ocultas juntas; uma oculta continua na
lista, só com opacidade reduzida + rótulo "Oculta", com um botão pra
reverter.

```tsx
"use client";

import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import { setTestimonialVisibility } from "@/actions/testimonials";
import { Button } from "@/lib/_components/ui/button";
import { runMutation } from "@/lib/_utils/runMutation";
import { useState } from "react";

export function TestimonialsPanel({
  testimonials,
  onVisibilityChanged,
}: {
  testimonials: Testimonial[];
  onVisibilityChanged: (updated: Testimonial) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleToggle(t: Testimonial) {
    const result = await runMutation(() => setTestimonialVisibility(t.id, !t.visible), {
      success: t.visible ? "Avaliação ocultada." : "Avaliação visível de novo.",
      fallbackError: "Falha ao atualizar a avaliação.",
    });
    if (result.ok) onVisibilityChanged(result.value);
  }

  if (testimonials.length === 0) return null;

  return (
    <div className="mt-4 rounded border">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between p-3 text-sm font-medium"
      >
        Avaliações ({testimonials.length})<span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-2 border-t p-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between gap-3 rounded p-2 text-sm ${
                t.visible ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {t.authorName}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({t.rating}★){!t.visible && " — Oculta"}
                  </span>
                </p>
                <p className="text-muted-foreground truncate">{t.text}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => handleToggle(t)}>
                {t.visible ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Renderizar o painel em `PreviewFrame.tsx`**

Adicionar ao import:

```ts
import { TestimonialsPanel } from "./TestimonialsPanel";
```

Trocar (o `</div>` que fecha a linha da saudação, seguido do
comentário/card do iframe — os dois já existem hoje, um logo depois
do outro):

```tsx
                )}
            </div>

            {/* Card flutuante, mesmo tratamento do card do /login —
```

por (insere o painel entre os dois, só na aba rascunho, mesmo
critério de `PublishControls`):

```tsx
                )}
            </div>

            {activeTab === 'rascunho' && (
                <TestimonialsPanel
                    testimonials={testimonials}
                    onVisibilityChanged={updated =>
                        setTestimonials(prev =>
                            prev.map(t => (t.id === updated.id ? updated : t)),
                        )
                    }
                />
            )}

            {/* Card flutuante, mesmo tratamento do card do /login —
```

- [ ] **Step 3: Rodar a verificação completa**

```bash
cd admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

- [ ] **Step 4: Reiniciar o dev server se estava de pé (mesmo procedimento da Task 1, Step 8)**

- [ ] **Step 5: Commit**

```bash
cd admin-photo
git add src/app/preview/_components/TestimonialsPanel.tsx \
        src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: add testimonials moderation panel to /preview

Painel colapsável fora do iframe (mesmo espírito do antigo
OrphanPhotosPanel) listando todas as avaliações sincronizadas,
visíveis e ocultas juntas — uma oculta nunca some da lista, só ganha
opacidade reduzida + "Oculta", com um botão pra reverter. Único lugar
de onde dá pra mostrar de novo uma avaliação ocultada, já que ela não
renderiza no site.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

Sem automação de navegador neste ambiente — esta verificação confirma
o caminho de código em modo mock (sem `GOOGLE_PLACES_API_KEY`/
`GOOGLE_PLACE_ID` reais ainda, por decisão do spec). Clicar de
verdade na pill "Atualizar avaliações" dentro do iframe, os toggles de
ocultar/mostrar, e a chamada real à Places API (que exige criar as
credenciais no Google Cloud Console — fora do escopo deste plano)
precisam de conferência manual do usuário, em navegador de verdade,
depois.

- [ ] **Step 1: Garantir os dois dev servers de pé e limpos**

```bash
lsof -iTCP:3001 -sTCP:LISTEN -n -P
lsof -iTCP:3000 -sTCP:LISTEN -n -P
```

Se algum não estiver: `rm -rf .next && npm run dev` no repo
correspondente (em background), esperando `curl` voltar `200` em
`/login` (admin-photo) ou `/` (app-photo) antes de continuar.

- [ ] **Step 2: app-photo — confirmar a home com os depoimentos mockados**

```bash
curl -s http://localhost:3000/ -o /tmp/home_final.html -w "%{http_code}\n"
grep -o "Marina R\.\|Carlos e Bia\|Luiza M\.\|Atualizar avaliações" /tmp/home_final.html
```

Esperado: `200` e as 4 ocorrências presentes.

- [ ] **Step 3: admin-photo — minerar uma sessão autenticada real**

```bash
cd /tmp
curl -s http://localhost:3001/login -o login_final.html
ACTION_ID=$(grep -o '{&quot;id&quot;:&quot;[a-f0-9]*&quot;' login_final.html | sed -E 's/.*&quot;([a-f0-9]+)&quot;$/\1/')
ACTION_KEY=$(grep -o '\$ACTION_KEY" value="[^"]*"' login_final.html | sed -E 's/.*value="([^"]*)"/\1/')
curl -s -c cookies_final.txt -o /dev/null -w "login POST: %{http_code}\n" \
  -X POST "http://localhost:3001/login" \
  -F "\$ACTION_REF_1=" \
  -F "\$ACTION_1:0={\"id\":\"$ACTION_ID\",\"bound\":\"\$@1\"}" \
  -F '$ACTION_1:1=[null]' \
  -F "\$ACTION_KEY=$ACTION_KEY" \
  -F "email=dev@admin-photo.local" \
  -F "password=devpass123"
```

Esperado: `login POST: 303`.

- [ ] **Step 4: admin-photo — confirmar `/preview` com os depoimentos e o painel de moderação**

```bash
curl -s -b /tmp/cookies_final.txt -o /tmp/preview_final.html -w "%{http_code}\n" http://localhost:3001/preview
grep -o "Marina R\.\|Avaliações (3)" /tmp/preview_final.html
```

Esperado: `200` e as duas ocorrências presentes (a segunda confirma
que `TestimonialsPanel` renderizou com os 3 seeds).

- [ ] **Step 5: Reportar ao usuário**

Resumir os resultados dos Steps 2-4 e deixar claro que falta, pro
fluxo real do Google funcionar: (a) criar a API key da Places API +
achar o Place ID de verdade no Google Cloud Console (já documentado no
spec), preencher `GOOGLE_PLACES_API_KEY`/`GOOGLE_PLACE_ID` no
`.env.local` do admin-photo; (b) clicar de verdade na pill "Atualizar
avaliações" dentro do iframe do `/preview` e nos toggles de ocultar/
mostrar, em navegador — nenhum dos dois é verificável por curl.
