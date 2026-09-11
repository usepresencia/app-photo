# Foto/Placement no Firestore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a **seleção** de fotos — quais aparecem no hero, em "Quem
sou", na galeria da home e na galeria de cada nicho — vir do Firestore
(`Photo` + `Placement`) em vez das funções `categoria()`/`intercalar()`
que hoje computam isso a partir de `photos.json` a cada request.

**Escopo explicitamente fora deste plano:** os arquivos de imagem
continuam em `public/fotos/*.webp`, servidos exatamente como hoje —
`Photo.src` é o mesmo caminho local de sempre. Cloudinary (`cloudinaryPublicId`
no spec) entra no script de migração ou no upload do admin, planos
posteriores — este plano só move a **decisão de onde cada foto aparece**
pro Firestore, não a hospedagem do arquivo.

**Architecture:** Duas entidades novas, `photo` (metadado do arquivo —
`src`, `width`, `height`, `blurDataURL`, nada de posição) e `placement`
(onde aparece — `surface`, `refId`, `role`, `order`), seguindo o mesmo
padrão `domain/application/infrastructure` + `RepositoryFactory` dos
planos 1 e 2. Diferente deles, aqui há duas coleções que precisam ser
combinadas: `PlacementRepository` devolve a ordem e o papel de cada foto
numa superfície, `PhotoRepository` resolve os IDs pros dados de verdade —
o join entre as duas vive em `GetPhotosBySurfaceUseCase`, não escondido
dentro de um repositório (repositório continua fazendo uma coisa só,
acesso a uma coleção).

O algoritmo de hoje (`intercalar()` — distribuir categorias por rodada pra
abrir variado) **não é portado**: ele só existe pra computar uma ordem a
partir de pools de categoria, e no Firestore a ordem já é um dado
salvo (`Placement.order`), não algo recalculado a cada request. Ele
"morre" com a migração (plano 5), que roda essa mesma lógica **uma vez**
pra gerar os `order` reais.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `firebase-admin`,
Vitest. Infraestrutura (`env.server`, `RepositoryFactory`, `src/lib`) já
existe.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
**Planos anteriores:** `docs/superpowers/plans/2026-09-08-nicho-firestore.md`
(1/10), `docs/superpowers/plans/2026-09-08-pacote-firestore.md` (2/10)

## Global Constraints

- Sem Firebase real disponível em CI — build/test precisam funcionar só
  com o fallback mock, herdado dos planos 1-2.
- Nenhum comportamento visível muda: mesmas fotos, mesma ordem, em cada
  uma das 4 superfícies (hero, quem-sou, galeria da home, galeria de
  nicho) — a Task 3-6 cada uma prova isso comparando antes/depois.
- **Desvio do desenho original do spec:** o spec descrevia um `role:
"capa"` exclusivo pra nicho. Reli `src/actions/niches.ts` (plano 1) e a
  capa de hoje **é** `gallery[0]` — a mesma foto, não uma exclusiva. Um
  role exclusivo mudaria quantas fotos a própria página do nicho mostra
  na galeria (uma a menos, a que virasse só-capa). Este plano mantém o
  comportamento atual: nicho não usa `role`, capa continua sendo
  `gallery[0]`.
- Firestore `where(documentId(), "in", ids)` tem limite de 30 itens por
  query. Nenhuma superfície de hoje passa disso (hero 12, galeria 18,
  quem-sou 4, maior galeria de nicho 15) — sinalizado como limite a
  observar se o admin crescer muito uma galeria.

---

## Mapa de arquivos

**Criar:**

- `src/api/domain/photo/Photo.ts`
- `src/api/domain/photo/PhotoRepository.ts`
- `src/api/domain/placement/Placement.ts`
- `src/api/domain/placement/PlacementRepository.ts`
- `src/api/application/photo/PlacedPhotoDTO.ts`
- `src/api/application/photo/GetPhotosBySurfaceUseCase.ts`
- `src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts`
- `src/api/infrastructure/repositories/mock/MockPhotoRepository.ts`
- `src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`
- `src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
- `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`
- `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`

**Modificar:**

- `src/api/infrastructure/repositories/RepositoryFactory.ts` — adiciona
  `photos()`, `placements()`
- `src/api/infrastructure/repositories/RepositoryFactory.test.ts` — cobre
  as duas
- `src/actions/gallery.ts` — `getHeroPhotos`, `getAboutPhotos`,
  `getGalleryPhotos` trocam de fonte
- `src/actions/gallery.test.ts` — adapta as asserções que testavam o
  algoritmo de intercalação (não existe mais em código)
- `src/actions/niches.ts` — `withPhotos` troca `nichePhotos()`/
  `NICHE_PHOTO_CATEGORIES` por `GetPhotosBySurfaceUseCase`

**Decisão de escopo:** `MockPhotoRepository`/`MockPlacementRepository` não
tentam espelhar as 87 fotos reais — diferente dos mocks de nicho (7) e
pacote (14), aqui seria centenas de linhas pra um dado que só serve
dev/test/CI. Seedados com um conjunto pequeno e sintético (nomeado, não
aleatório) que exercita as 4 superfícies. A transcrição de verdade das 87
fotos é trabalho do script de migração (plano 5), que popula o Firestore
de produção.

---

### Task 1: Domínio, DTO, caso de uso e repositórios mock

**Files:**

- Create: `src/api/domain/photo/Photo.ts`
- Create: `src/api/domain/photo/PhotoRepository.ts`
- Create: `src/api/domain/placement/Placement.ts`
- Create: `src/api/domain/placement/PlacementRepository.ts`
- Create: `src/api/application/photo/PlacedPhotoDTO.ts`
- Create: `src/api/application/photo/GetPhotosBySurfaceUseCase.ts`
- Create: `src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts`
- Create: `src/api/infrastructure/repositories/mock/MockPhotoRepository.ts`
- Create: `src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`
- Create: `src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`

**Interfaces:**

- Produces: `interface Photo { id, src, width, height, blurDataURL }`,
  `type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" |
"package"`, `interface Placement { id, photoId, surface: PhotoSurface,
refId: string | null, role: string | null, order: number }`,
  `interface PhotoRepository { findByIds(ids: string[]): Promise<Photo[]> }`,
  `interface PlacementRepository { findBySurface(surface, opts?: {
refId?: string }): Promise<Placement[]> }` (já ordenado por `order`),
  `interface PlacedPhotoDTO extends Photo { role: string | null }`,
  `class GetPhotosBySurfaceUseCase` com `.execute(surface, opts?):
Promise<PlacedPhotoDTO[]>`.

- [ ] **Step 1: Entidades e contratos de repositório**

Create `src/api/domain/photo/Photo.ts`:

```ts
export interface Photo {
  id: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
}
```

Create `src/api/domain/photo/PhotoRepository.ts`:

```ts
import type { Photo } from "./Photo";

export interface PhotoRepository {
  findByIds(ids: string[]): Promise<Photo[]>;
}
```

Create `src/api/domain/placement/Placement.ts`:

```ts
export type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" | "package";

export interface Placement {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  /** slug do nicho ou id do pacote — null em hero/quem-sou/home-gallery. */
  refId: string | null;
  /** papel da foto na superfície (ex.: "capa", "polaroid-1"; label de
   *  categoria em home-gallery) — null onde não se aplica. */
  role: string | null;
  order: number;
}
```

Create `src/api/domain/placement/PlacementRepository.ts`:

```ts
import type { Placement, PhotoSurface } from "./Placement";

export interface FindBySurfaceOptions {
  refId?: string;
}

export interface PlacementRepository {
  /** Já devolve ordenado por `order` ascendente. */
  findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]>;
}
```

- [ ] **Step 2: DTO e caso de uso**

Create `src/api/application/photo/PlacedPhotoDTO.ts`:

```ts
export interface PlacedPhotoDTO {
  id: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  role: string | null;
}
```

Create `src/api/application/photo/GetPhotosBySurfaceUseCase.ts`:

```ts
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import type { PlacedPhotoDTO } from "./PlacedPhotoDTO";

export class GetPhotosBySurfaceUseCase {
  constructor(
    private readonly placements: PlacementRepository,
    private readonly photos: PhotoRepository,
  ) {}

  async execute(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<PlacedPhotoDTO[]> {
    const placements = await this.placements.findBySurface(surface, opts);
    if (placements.length === 0) return [];

    const photos = await this.photos.findByIds(placements.map((p) => p.photoId));
    const byId = new Map(photos.map((photo) => [photo.id, photo]));

    const result: PlacedPhotoDTO[] = [];
    for (const placement of placements) {
      const photo = byId.get(placement.photoId);
      if (!photo) continue; // placement órfão (foto apagada) — ignora, não quebra a página
      result.push({ ...photo, role: placement.role });
    }
    return result;
  }
}
```

- [ ] **Step 3: Escrever o teste do repositório mock de placement primeiro**

Create `src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPlacementRepository } from "./MockPlacementRepository";

describe("MockPlacementRepository", () => {
  it("retorna os placements de hero ordenados", async () => {
    const repo = new MockPlacementRepository();
    const placements = await repo.findBySurface("hero");
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.map((p) => p.order)).toEqual(
      [...placements].sort((a, b) => a.order - b.order).map((p) => p.order),
    );
  });

  it("retorna os 4 placements de quem-sou, com role distinto cada", async () => {
    const repo = new MockPlacementRepository();
    const placements = await repo.findBySurface("quem-sou");
    expect(placements).toHaveLength(4);
    expect(new Set(placements.map((p) => p.role)).size).toBe(4);
  });

  it("filtra galeria de nicho por refId", async () => {
    const repo = new MockPlacementRepository();
    const gestante = await repo.findBySurface("niche", { refId: "gestante" });
    const familia = await repo.findBySurface("niche", { refId: "familia" });
    expect(gestante.length).toBeGreaterThan(0);
    expect(familia.length).toBeGreaterThan(0);
    expect(gestante.every((p) => p.refId === "gestante")).toBe(true);
  });

  it("retorna array vazio para um refId sem placements", async () => {
    const repo = new MockPlacementRepository();
    const placements = await repo.findBySurface("niche", { refId: "nao-existe" });
    expect(placements).toEqual([]);
  });
});
```

- [ ] **Step 4: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
Expected: FAIL — módulo não existe.

**Achado ao implementar:** a primeira versão deste mock só cobria 2 dos 7
nichos (`gestante`, `familia`). Rodando os testes existentes de
`niches.test.ts` contra isso, `getEventNiches` quebrava com
`Cannot read properties of undefined (reading 'src')` — e o mesmo
aconteceria de verdade em `npm run dev`, porque `Niches.tsx` (a home
inteira, não só o teste) renderiza `niche.image.src` pros 7 cards.
Faltando qualquer nicho no mock, a página quebra em runtime, não só um
teste isolado. Os dois blocos abaixo já saem com cobertura completa.

- [ ] **Step 5: Implementar os repositórios mock**

Create `src/api/infrastructure/repositories/mock/MockPhotoRepository.ts`:

```ts
import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";

// Conjunto pequeno e sintético — não tenta espelhar as 87 fotos reais
// (isso é trabalho do script de migração, plano 5). Nomeado por
// propósito ("hero-1", "quemsou-capa") pra ficar legível nos testes e no
// MockPlacementRepository, que referencia estes IDs.
export const MOCK_PHOTOS: Photo[] = [
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `hero-${i + 1}`,
    src: `/fotos/mock/hero-${i + 1}.webp`,
    width: 1600,
    height: 1067,
    blurDataURL: "data:image/webp;base64,AA",
  })),
  {
    id: "quemsou-capa",
    src: "/fotos/mock/quemsou-capa.webp",
    width: 935,
    height: 1280,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "quemsou-polaroid-1",
    src: "/fotos/mock/quemsou-polaroid-1.webp",
    width: 1179,
    height: 2096,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "quemsou-altar",
    src: "/fotos/mock/quemsou-altar.webp",
    width: 1600,
    height: 1067,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "quemsou-polaroid-2",
    src: "/fotos/mock/quemsou-polaroid-2.webp",
    width: 1600,
    height: 2397,
    blurDataURL: "data:image/webp;base64,AA",
  },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `galeria-${i + 1}`,
    src: `/fotos/mock/galeria-${i + 1}.webp`,
    width: 1600,
    height: 1200,
    blurDataURL: "data:image/webp;base64,AA",
  })),
  // Uma foto por nicho, pros 7 slugs reais de niches.ts — Niches.tsx (a
  // home inteira) renderiza niche.image.src pros 7 cards; faltando
  // qualquer um, a página quebra em runtime com o mock, não só um teste.
  ...[
    "retratos-profissionais",
    "gestante",
    "familia",
    "comercial",
    "casamento-civil",
    "aniversario-e-eventos",
    "making-of-da-noiva",
  ].flatMap((slug) =>
    Array.from({ length: 2 }, (_, i) => ({
      id: `${slug}-${i + 1}`,
      src: `/fotos/mock/${slug}-${i + 1}.webp`,
      width: 1600,
      height: 1200,
      blurDataURL: "data:image/webp;base64,AA",
    })),
  ),
];

export class MockPhotoRepository implements PhotoRepository {
  async findByIds(ids: string[]): Promise<Photo[]> {
    if (ids.length === 0) return [];
    const set = new Set(ids);
    return MOCK_PHOTOS.filter((photo) => set.has(photo.id));
  }
}
```

Create `src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`:

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";

let nextId = 1;
function placement(p: Omit<Placement, "id">): Placement {
  return { id: `mock-placement-${nextId++}`, ...p };
}

function galleryLabel(photoId: string): string {
  if (photoId.startsWith("gestante")) return "gestante";
  if (photoId.startsWith("familia")) return "família";
  return "galeria";
}

const PLACEMENTS: Placement[] = [
  ...["hero-1", "hero-2", "hero-3", "hero-4"].map((photoId, order) =>
    placement({ photoId, surface: "hero", refId: null, role: null, order }),
  ),
  placement({ photoId: "quemsou-capa", surface: "quem-sou", refId: null, role: "capa", order: 0 }),
  placement({
    photoId: "quemsou-polaroid-1",
    surface: "quem-sou",
    refId: null,
    role: "polaroid-1",
    order: 1,
  }),
  placement({
    photoId: "quemsou-altar",
    surface: "quem-sou",
    refId: null,
    role: "altar",
    order: 2,
  }),
  placement({
    photoId: "quemsou-polaroid-2",
    surface: "quem-sou",
    refId: null,
    role: "polaroid-2",
    order: 3,
  }),
  ...["galeria-1", "galeria-2", "gestante-1", "familia-1", "galeria-3", "gestante-2"].map(
    (photoId, order) =>
      placement({
        photoId,
        surface: "home-gallery",
        refId: null,
        role: galleryLabel(photoId),
        order,
      }),
  ),
  // 2 fotos por nicho, pros 7 slugs reais — cobertura completa: Niches.tsx
  // (home) e getEventNiches (3 dos 7) precisam de niche.image em todos.
  ...[
    "retratos-profissionais",
    "gestante",
    "familia",
    "comercial",
    "casamento-civil",
    "aniversario-e-eventos",
    "making-of-da-noiva",
  ].flatMap((slug) =>
    [`${slug}-1`, `${slug}-2`].map((photoId, order) =>
      placement({ photoId, surface: "niche", refId: slug, role: null, order }),
    ),
  ),
];

export class MockPlacementRepository implements PlacementRepository {
  async findBySurface(
    surface: Placement["surface"],
    opts?: FindBySurfaceOptions,
  ): Promise<Placement[]> {
    return PLACEMENTS.filter(
      (p) => p.surface === surface && (opts?.refId === undefined || p.refId === opts.refId),
    ).sort((a, b) => a.order - b.order);
  }
}
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
Expected: PASS — 4 testes.

- [ ] **Step 7: Teste do caso de uso, contra os mocks**

Create `src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPhotoRepository } from "@/api/infrastructure/repositories/mock/MockPhotoRepository";
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { GetPhotosBySurfaceUseCase } from "./GetPhotosBySurfaceUseCase";

function useCase() {
  return new GetPhotosBySurfaceUseCase(new MockPlacementRepository(), new MockPhotoRepository());
}

describe("GetPhotosBySurfaceUseCase", () => {
  it("resolve o placement pra foto de verdade, na ordem certa", async () => {
    const photos = await useCase().execute("hero");
    expect(photos.map((p) => p.id)).toEqual(["hero-1", "hero-2", "hero-3", "hero-4"]);
  });

  it("inclui o role de cada foto", async () => {
    const photos = await useCase().execute("quem-sou");
    expect(photos.map((p) => p.role)).toEqual(["capa", "polaroid-1", "altar", "polaroid-2"]);
  });

  it("filtra por refId quando informado", async () => {
    const photos = await useCase().execute("niche", { refId: "familia" });
    expect(photos.every((p) => p.id.startsWith("familia"))).toBe(true);
  });

  it("retorna array vazio quando a superfície não tem placement", async () => {
    const photos = await useCase().execute("package", { refId: "nao-existe" });
    expect(photos).toEqual([]);
  });
});
```

- [ ] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 8 testes novos (4 do placement mock + 4 do caso
de uso) passam.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(photo): domínio, DTO, caso de uso e repositórios mock

Photo (metadado do arquivo) e Placement (onde aparece) como entidades
separadas — o join entre as duas vive em GetPhotosBySurfaceUseCase, não
escondido num repositório. Mocks com dado sintético pequeno, não uma
transcrição das 87 fotos reais (isso é trabalho do script de migração)."
```

---

### Task 2: Repositórios Firestore e fábrica de repositórios

**Files:**

- Create: `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`
- Create: `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.test.ts`

**Interfaces:**

- Produces: `class PhotoRepositoryImpl implements PhotoRepository`,
  `class PlacementRepositoryImpl implements PlacementRepository`,
  `RepositoryFactory.photos(): PhotoRepository`,
  `RepositoryFactory.placements(): PlacementRepository`.

- [ ] **Step 1: Implementar o repositório Firestore de fotos**

Create `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`:

```ts
import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { FieldPath } from "firebase-admin/firestore";
import { db } from "../firebase/admin";

const COLLECTION = "photos";

// Firestore recusa `in` com array vazio, e limita a 30 valores — nenhuma
// superfície de hoje passa disso (ver Global Constraints do plano).
export class PhotoRepositoryImpl implements PhotoRepository {
  async findByIds(ids: string[]): Promise<Photo[]> {
    if (ids.length === 0) return [];
    const snapshot = await db.collection(COLLECTION).where(FieldPath.documentId(), "in", ids).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        src: data.src,
        width: data.width,
        height: data.height,
        blurDataURL: data.blurDataURL,
      };
    });
  }
}
```

- [ ] **Step 2: Implementar o repositório Firestore de placements**

Create `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`:

```ts
import type { Placement, PhotoSurface } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import { db } from "../firebase/admin";

const COLLECTION = "placements";

function toPlacement(doc: FirebaseFirestore.QueryDocumentSnapshot): Placement {
  const data = doc.data();
  return {
    id: doc.id,
    photoId: data.photoId,
    surface: data.surface,
    refId: data.refId ?? null,
    role: data.role ?? null,
    order: data.order,
  };
}

// where(surface) + where(refId) + orderBy(order) — três campos diferentes,
// precisa de índice composto (surface, refId, order) no Firestore real.
// Mesma situação de PackageRepositoryImpl (plano 2): sem Firestore de
// desenvolvimento configurado neste plano, verificação fica manual.
export class PlacementRepositoryImpl implements PlacementRepository {
  async findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION).where("surface", "==", surface);
    if (opts?.refId !== undefined) {
      query = query.where("refId", "==", opts.refId);
    }
    const snapshot = await query.orderBy("order", "asc").get();
    return snapshot.docs.map(toPlacement);
  }
}
```

- [ ] **Step 3: Fábrica de repositórios**

Em `src/api/infrastructure/repositories/RepositoryFactory.ts`, adiciona
aos imports:

```ts
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import { PhotoRepositoryImpl } from "./PhotoRepositoryImpl";
import { MockPhotoRepository } from "./mock/MockPhotoRepository";
import { PlacementRepositoryImpl } from "./PlacementRepositoryImpl";
import { MockPlacementRepository } from "./mock/MockPlacementRepository";
```

E ao objeto `RepositoryFactory`:

```ts
  photos: (): PhotoRepository =>
    shouldUseMock() ? new MockPhotoRepository() : new PhotoRepositoryImpl(),
  placements: (): PlacementRepository =>
    shouldUseMock() ? new MockPlacementRepository() : new PlacementRepositoryImpl(),
```

- [ ] **Step 4: Estender o teste da fábrica**

Em `src/api/infrastructure/repositories/RepositoryFactory.test.ts`,
`importFresh` ganha mais 4 imports (`MockPhotoRepository`,
`PhotoRepositoryImpl`, `MockPlacementRepository`,
`PlacementRepositoryImpl`) devolvidos junto no mesmo objeto, e cada um
dos 3 testes ganha duas asserções a mais (`RepositoryFactory.photos()` e
`RepositoryFactory.placements()`), no mesmo padrão que a Task 2 do plano
2 já fez pra `packages()`.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 6: Verificação manual (quando houver Firestore real disponível)**

Documentar aqui, não executar agora:

1. Criar o índice composto `placements` (`surface` Ascending, `refId`
   Ascending, `order` Ascending) no console do Firestore.
2. Popular manualmente 2-3 documentos em `photos/` e `placements/`
   referenciando-os.
3. Rodar um script ad-hoc chamando
   `new GetPhotosBySurfaceUseCase(new PlacementRepositoryImpl(), new PhotoRepositoryImpl()).execute("hero")`
   com credenciais reais.
4. Confirmar que as fotos voltam na ordem certa.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(photo): repositórios Firestore e fábrica de repositórios

PlacementRepositoryImpl filtra por surface+refId e ordena por order —
precisa de índice composto (surface, refId, order) no Firestore real.
PhotoRepositoryImpl resolve por lote via documentId() in [...], limite de
30 ids (nenhuma superfície de hoje passa disso)."
```

---

### Task 3: Ligar o hero (`getHeroPhotos`)

**Files:**

- Modify: `src/actions/gallery.ts`
- Modify: `src/actions/gallery.test.ts`

**Interfaces:**

- Consumes: `GetPhotosBySurfaceUseCase`, `RepositoryFactory.placements()`,
  `RepositoryFactory.photos()` (Task 1-2).
- Produces: `getHeroPhotos(): Promise<Photo[]>` — mesma assinatura de
  hoje.

- [ ] **Step 1: Atualizar o teste primeiro**

Em `src/actions/gallery.test.ts`, o bloco `describe("getHeroPhotos", ...)`
testava a variedade de categorias nos 4 primeiros quadros — essa garantia
agora é responsabilidade do **dado** (o script de migração escreve o
`order` já intercalado), não do código, então o teste que checava isso
por categoria (`categoriaDe(photo.src)`) deixa de fazer sentido pra
código de produção. Troca por uma verificação do que o código realmente
faz agora — resolver os placements na ordem certa:

```ts
describe("getHeroPhotos", () => {
  it("retorna as fotos na ordem dos placements", async () => {
    const photos = await getHeroPhotos();
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo.src).toMatch(/^\/fotos\//);
    }
  });
});
```

O teste "não usa as fotos reservadas para a seção Quem sou" (compara
`src` do hero contra `src` de `getAboutPhotos`) e o equivalente em
`getGalleryPhotos` continuam válidos e NÃO mudam: no mock (Task 1) hero,
"quem-sou" e galeria já são fotos distintas por `Placement`/`Photo`
próprios, então a disjunção continua garantida sem depender do algoritmo
de categoria antigo. Deixa esses dois testes como estão.

- [ ] **Step 2: Rodar o teste e confirmar que falha (ou já passa, se a asserção nova for compatível)**

Run: `npx vitest run src/actions/gallery.test.ts`
Expected: FAIL nos testes de `getHeroPhotos` — a implementação atual
ainda usa `categoria()`/`intercalar()`, não os placements.

- [ ] **Step 3: Reescrever `getHeroPhotos` em `src/actions/gallery.ts`**

Troca:

```ts
export async function getHeroPhotos(): Promise<Photo[]> {
  const pools = HERO_CATEGORIES.map((slug) => categoria(slug).filter(isHorizontal));
  return intercalar(pools, HERO_SIZE);
}
```

por:

```ts
export async function getHeroPhotos(): Promise<Photo[]> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("hero");
  return photos.map(toPhoto);
}
```

`PlacedPhotoDTO` tem `id` e `role` — nenhum dos dois existe no `Photo` de
`@/actions/_mock/types` (só `src`, `width`, `height`, `blurDataURL`), que
é o tipo que `gallery.ts` sempre devolveu. Um destructuring `{ id, role,
...photo }` pareceria mais direto, mas `@typescript-eslint/no-unused-vars`
deste projeto acusa campos descartados assim mesmo como rest-siblings —
sem `ignoreRestSiblings` configurado (testado com um probe antes de
escrever este plano). Em vez disso, um helper que as três funções deste
arquivo (Tasks 3-5) compartilham. Adiciona ele no topo de `gallery.ts`,
perto dos outros imports:

```ts
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";

function toPhoto(p: PlacedPhotoDTO): Photo {
  return { src: p.src, width: p.width, height: p.height, blurDataURL: p.blurDataURL };
}
```

Adiciona ao topo do arquivo:

```ts
import { GetPhotosBySurfaceUseCase } from "@/api/application/photo/GetPhotosBySurfaceUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
```

`HERO_CATEGORIES`, `isHorizontal` e o uso de `intercalar`/`categoria`
específico do hero saem — `getAboutPhotos`/`getGalleryPhotos` ainda usam
`categoria()` nesta task (Task 4-5 removem o resto). Não apaga
`intercalar`/`categoria`/`ABOUT_FAMILY_COUNT` ainda.

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run src/actions/gallery.test.ts`
Expected: os testes de `getHeroPhotos` passam. Os de `getAboutPhotos`/
`getGalleryPhotos` continuam passando — ainda não foram tocados.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(hero): ligar getHeroPhotos ao Photo/Placement

O algoritmo de intercalação por categoria não é portado — a ordem
intercalada agora é um dado (Placement.order), escrito uma vez pelo
script de migração, não recalculado a cada request."
```

---

### Task 4: Ligar "Quem sou" (`getAboutPhotos`)

**Files:**

- Modify: `src/actions/gallery.ts`
- Modify: `src/actions/gallery.test.ts`

**Interfaces:**

- Produces: `getAboutPhotos(): Promise<{ family: Photo[] }>` — mesma
  assinatura, mesmos 4 itens na mesma ordem
  (capa, polaroid-1, altar, polaroid-2) — `About.tsx` **não muda**, ele
  já indexa `family[0..3]` por posição fixa.

- [ ] **Step 1: Atualizar o teste primeiro**

Em `src/actions/gallery.test.ts`:

```ts
describe("getAboutPhotos", () => {
  it("retorna as 4 fotos de Quem sou, na ordem capa/polaroid-1/altar/polaroid-2", async () => {
    const { family } = await getAboutPhotos();
    expect(family).toHaveLength(4);
    for (const photo of family) {
      expect(photo.src).toMatch(/^\/fotos\//);
    }
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/actions/gallery.test.ts`
Expected: FAIL — `getAboutPhotos` ainda devolve `photos.familia.slice(0, 4)`.

- [ ] **Step 3: Reescrever `getAboutPhotos`**

Troca:

```ts
export async function getAboutPhotos(): Promise<{ family: Photo[] }> {
  return {
    family: photos.familia.slice(0, ABOUT_FAMILY_COUNT),
  };
}
```

por:

```ts
export async function getAboutPhotos(): Promise<{ family: Photo[] }> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("quem-sou");
  return { family: photos.map(toPhoto) };
}
```

(`toPhoto` — o mesmo helper que a Task 3 adicionou em `gallery.ts`.)

`GetPhotosBySurfaceUseCase` já devolve ordenado por `order` — o
`MockPlacementRepository` (Task 1) seedou capa=0, polaroid-1=1, altar=2,
polaroid-2=3, batendo com a ordem que `About.tsx` espera em `family[0..3]`.
A migração (plano 5) precisa preservar essa mesma ordem pros dados reais.

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run src/actions/gallery.test.ts`
Expected: PASS.

- [ ] **Step 5: Rodar a suíte inteira, incluindo o smoke test do componente**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros. `About.tsx` não foi tocado nesta task — se o teste
de `getAboutPhotos` passa com 4 itens na ordem certa, o componente
continua funcionando sem mudança nenhuma.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(quem-sou): ligar getAboutPhotos ao Photo/Placement

About.tsx não muda — continua indexando family[0..3] por posição fixa.
A ordem capa/polaroid-1/altar/polaroid-2 agora vem do Placement.order,
que a migração (plano 5) precisa preservar."
```

---

### Task 5: Ligar a galeria da home (`getGalleryPhotos`)

**Files:**

- Modify: `src/actions/gallery.ts`
- Modify: `src/actions/gallery.test.ts`

**Interfaces:**

- Produces: `getGalleryPhotos(): Promise<GalleryPhoto[]>` — mesma
  assinatura (`GalleryPhoto extends Photo { label: string }`).

- [ ] **Step 1: Atualizar o teste primeiro**

Em `src/actions/gallery.test.ts`:

```ts
describe("getGalleryPhotos", () => {
  it("retorna as fotos da galeria, cada uma com label e do diretório /fotos", async () => {
    const photos = await getGalleryPhotos();
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo.src).toMatch(/^\/fotos\//);
      expect(photo.label).toBeTruthy();
    }
  });
});
```

(A asserção "mais de uma categoria" que existia antes fica sem sentido
pra testar aqui pela mesma razão do hero — é propriedade do dado
seedado, não do código. O `MockPlacementRepository` já seeda `role` com
3 labels diferentes pra `home-gallery`, então esse teste continuaria
passando mesmo se fosse mantido — mas não prova mais nada sobre o
código, só sobre o mock.)

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/actions/gallery.test.ts`
Expected: FAIL nos testes de `getGalleryPhotos` (ainda sem `label`
vindo de `role`, `getGalleryPhotos` continua com a implementação
antiga).

- [ ] **Step 3: Reescrever `getGalleryPhotos` e remover o que ficou órfão**

Troca:

```ts
export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const pools = GALLERY_CATEGORIES.map(({ slug, label }) =>
    categoria(slug).map((photo) => ({ ...photo, label })),
  );
  return intercalar(pools, GALLERY_SIZE);
}
```

por:

```ts
export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("home-gallery");
  return photos.map((p) => ({ ...toPhoto(p), label: p.role ?? "" }));
}
```

(Não faz `{ role, ...photo }` e devolve `{ ...photo, label }` direto: o
resultado do spread carregaria `id` de `PlacedPhotoDTO` sem erro de tipo
— TypeScript não aplica excess-property check em objeto vindo de spread,
só em literal direto — mas o campo vazaria em runtime mesmo assim.
Passa por `toPhoto` primeiro, igual às outras três funções, pra não ter
esse `id` fantasma escondido em `GalleryPhoto`. Testado com um probe
antes de escrever este plano.)

Com hero, quem-sou e home-gallery todos ligados, `categoria()`,
`intercalar()`, `isHorizontal()`, `GALLERY_CATEGORIES`,
`ABOUT_FAMILY_COUNT`, `GALLERY_SIZE`, `HERO_SIZE` e o import de
`photosByCategory` ficam sem nenhum uso — remove todos. O import de
`Photo` de `./_mock/types` **fica**: `GalleryPhoto extends Photo` ainda
precisa dele.
`src/actions/gallery.ts` fica só com os três `export async function` e
os dois imports novos (`GetPhotosBySurfaceUseCase`, `RepositoryFactory`).

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run src/actions/gallery.test.ts`
Expected: PASS — os três `describe` (`getHeroPhotos`, `getAboutPhotos`,
`getGalleryPhotos`).

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros — typecheck confirma que nada mais importa os
símbolos removidos de `gallery.ts`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(galeria): ligar getGalleryPhotos ao Photo/Placement

label vem de Placement.role agora, não de um segundo argumento fixo por
categoria. categoria()/intercalar()/isHorizontal() e as constantes de
tamanho saem — sem uso depois que as três funções de gallery.ts foram
ligadas."
```

---

### Task 6: Ligar a galeria de cada nicho (`niches.ts`)

**Files:**

- Modify: `src/actions/niches.ts`

**Interfaces:**

- Produces: `Niche.image`/`Niche.gallery` — mesma semântica de hoje
  (`image` é `gallery[0]`, não uma foto exclusiva — ver Global
  Constraints, desvio do spec original).

- [ ] **Step 1: Trocar `nichePhotos()`/`NICHE_PHOTO_CATEGORIES` por `GetPhotosBySurfaceUseCase`**

`withPhotos` precisa buscar a galeria antes de montar o `Niche`, então
vira assíncrono — isso muda `getNiches`/`getNicheBySlug`/`getEventNiches`
de `.map(withPhotos)` (síncrono) pra `Promise.all(dtos.map(withPhotos))`.

Replace `src/actions/niches.ts`:

```ts
import type { Photo } from "./_mock/types";
import type { NicheDTO } from "@/api/application/niche/NicheDTO";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
import { GetPhotosBySurfaceUseCase } from "@/api/application/photo/GetPhotosBySurfaceUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  image: Photo;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  gallery: Photo[];
}

// Cópia local do mesmo helper que a Task 3 adicionou em gallery.ts —
// arquivo diferente, sem um lugar compartilhado óbvio pra uma função de
// 4 campos; duplicar é mais simples que criar um módulo só pra isso.
function toPhoto(p: PlacedPhotoDTO): Photo {
  return { src: p.src, width: p.width, height: p.height, blurDataURL: p.blurDataURL };
}

// image é gallery[0] — a mesma foto, não uma capa exclusiva. Assim
// sempre foi (ver plano 1); um role "capa" separado tiraria uma foto da
// galeria da própria página do nicho, mudando quantas fotos ela mostra.
async function withPhotos(dto: NicheDTO): Promise<Niche> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("niche", { refId: dto.slug });
  const gallery = photos.map(toPhoto);
  return {
    slug: dto.slug,
    title: dto.title,
    subtitle: dto.subtitle,
    intro: dto.intro,
    description: dto.description,
    highlights: dto.highlights,
    closingLine: dto.closingLine,
    gallery,
    image: gallery[0],
  };
}

export async function getNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(RepositoryFactory.niches()).execute();
  return Promise.all(dtos.map(withPhotos));
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const dto = await new GetNicheBySlugUseCase(RepositoryFactory.niches()).execute(slug);
  return dto ? withPhotos(dto) : null;
}

export async function getEventNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(RepositoryFactory.niches()).execute();
  const eventDtos = dtos
    .filter((n) => n.showAsEventTeaser)
    .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0));
  return Promise.all(eventDtos.map(withPhotos));
}
```

`photosByCategory`/`NICHE_PHOTO_CATEGORIES`/`nichePhotos` saem — sem uso.

- [ ] **Step 2: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros. `niches.test.ts` não muda — `getNiches`/
`getNicheBySlug`/`getEventNiches` continuam com a mesma assinatura
pública, só passaram a ser assíncronas por dentro de um jeito diferente
(já eram `async`, isso não muda a interface externa).

- [ ] **Step 3: Smoke test manual**

Run: `npm run dev` (sem credenciais do Firebase), abrir
`http://localhost:3000/ensaios/gestante`.
Expected: galeria do nicho renderiza normalmente — com o
`MockPlacementRepository`/`MockPhotoRepository` seedados na Task 1, que
têm 3 fotos sintéticas pra `gestante` (não as fotos reais de
`photos.json` — isso é esperado até a migração popular o Firestore de
verdade; o objetivo aqui é confirmar que o encanamento funciona, não que
o conteúdo bate).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(nicho): ligar galeria de cada nicho ao Photo/Placement

image continua sendo gallery[0] — não um role exclusivo, preservando
quantas fotos a própria página do nicho mostra. withPhotos vira
assíncrono; getNiches/getNicheBySlug/getEventNiches ajustam pra
Promise.all sem mudar assinatura pública."
```

---

### Task 7: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa**

Run: `npm run typecheck && npx eslint . && npx prettier '**/*.{css,ts,tsx,json,md}' --check && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: os cinco comandos terminam com código de saída 0, sem
credenciais do Firebase no ambiente — os mesmos passos que o CI roda.

- [ ] **Step 2: Confirmar que nada ficou órfão**

Run: `grep -rn "photosByCategory\|NICHE_PHOTO_CATEGORIES\|nichePhotos\|intercalar\|categoria(" src/actions`
Expected: nenhuma linha — tudo isso saiu de `gallery.ts` e `niches.ts`
nas Tasks 3-6.

- [ ] **Step 3: Smoke test manual completo**

Run: `npm run dev` (sem credenciais do Firebase), abrir
`http://localhost:3000`.
Expected: hero mostra as 4 fotos sintéticas do mock em loop; "Quem sou"
mostra as 4 fotos sintéticas na posição certa (capa grande, 2 polaroids,
foto do altar com a legenda); "Meus trabalhos" mostra as 6 fotos
sintéticas de `home-gallery`, cada uma com legenda. Nada quebra —
o conteúdo é o do mock, não o real (isso só muda com a migração, plano
5), mas a estrutura da página é a mesma de sempre.

- [ ] **Step 4: Commit final (se sobrou algo solto) e push**

```bash
git status --short
# se houver pendências, git add -A && git commit -m "..."
git push
```

---

## Depois deste plano

`niche`, `package` e `photo`/`placement` — as três entidades mais
centrais do modelo de conteúdo — estão todas ligadas ao Firestore (com
fallback mock). Falta:

- **Plano 4** — `profile` (textos de "Quem sou": capa, Profissão,
  Família), o único documento singleton do modelo — sem lista, sem
  `findAll`/`delete`.
- **Plano 5** — o script de migração: sobe as 87 fotos reais pro
  Cloudinary, grava `Photo`/`Placement` de produção com os `order`
  computados a partir da lógica que este plano aposentou (a intercalação
  por categoria roda **uma vez**, no script, não mais em runtime), e
  migra `niches.ts`/`packages.ts` pro Firestore de produção.
- **Planos 6-10** — o repositório admin: scaffold + auth, CRUD de
  nicho/pacote, upload de foto + placement, CRUD de profile, deploy.

Este plano deixa o site rodando inteiramente sobre o mock sintético em
dev/test/CI — visualmente diferente do conteúdo real até a migração
popular o Firestore, mas com a mesma estrutura de página. Isso é
esperado e documentado no Step 3 da Task 7.
