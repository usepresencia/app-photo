# Legenda de fotos polaroide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** simplificar o fluxo de "nova foto" no preview (tirar o passo de posicionamento) e renomear `Placement.role` → `Placement.caption`, exibindo a legenda de verdade nas três superfícies com visual de polaroide (home-gallery, niche, quem-sou) — hoje só home-gallery funciona.

**Architecture:** rename mecânico ponta a ponta em dois repositórios com stacks Firestore independentes (admin-photo primeiro, depois app-photo), seguido por comportamento novo em cima do rename: modal de nova foto vira passo único com ordem automática, o campo Legenda só aparece pra superfícies polaroide nos dois modais do preview do admin, e o app-photo passa a exibir a legenda de verdade em `NicheGallery.tsx`/`About.tsx` (hoje sem legenda / com texto fixo no código).

**Tech Stack:** Next.js, TypeScript, Vitest, Firestore (admin SDK, emulador local).

**Spec:** `app-photo/docs/superpowers/specs/2026-09-10-legenda-fotos-polaroide-design.md`

## Global Constraints

- Sem migração de dados: não há Firestore de produção, confirmado com o usuário — rename direto, sem script de backfill.
- `role`/`caption` nunca é usado como lógica/comparação em nenhum dos repos (confirmado por varredura) — o rename é mecânico, sem risco de comportamento.
- admin-photo: working directory `/Users/cesarpisa/Projects/lp-fotografia/admin-photo`, branch `main`, sem remote. Sem git worktree.
- app-photo: working directory `/Users/cesarpisa/Projects/lp-fotografia/app-photo`, branch `feat/nicho-firestore`, PR #2 aberto. Sem git worktree.
- Cada task termina com `npm run typecheck && npm run lint && npm test && npm run build` no repo correspondente, e commit próprio.
- Rótulo na UI: "Legenda" (não "Papel", não "Descrição").

---

### Task 1: Rename `role` → `caption` em admin-photo

**Files:**

- Modify: `admin-photo/src/api/domain/placement/Placement.ts`
- Modify: `admin-photo/src/api/domain/placement/PlacementRepository.ts`
- Modify: `admin-photo/src/api/application/placement/PlacementDTO.ts`
- Modify: `admin-photo/src/api/application/placement/UpdatePlacementUseCase.ts`
- Modify: `admin-photo/src/api/application/placement/UpdatePlacementUseCase.test.ts`
- Modify: `admin-photo/src/api/application/placement/CreatePlacementUseCase.test.ts`
- Modify: `admin-photo/src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`
- Modify: `admin-photo/src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`
- Modify: `admin-photo/src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
- Modify: `admin-photo/src/actions/placements.ts`
- Modify: `admin-photo/src/app/placements/_components/PlacementsManager.tsx`
- Modify: `admin-photo/src/app/placements/_components/PlacementForm.tsx`
- Modify: `admin-photo/src/app/placements/_components/PlacementForm.test.ts`
- Modify: `admin-photo/src/app/placements/_components/EditPlacementModal.tsx`

**Interfaces:**

- Produces: `Placement.caption: string | null` (era `role`), `PlacementDTO.caption`, `PlacementViewModel.caption` (herdado via spread, nenhuma edição própria necessária) — consumido por todas as tasks seguintes.
- Não toca `AddPhotoModal.tsx` (será reescrito do zero na Task 5, já nascendo com `caption`) nem `PreviewFrame.tsx`.

Este rename é mecânico (confirmado: `role`/`caption` nunca é comparado/usado como lógica) — não é TDD, é um refactor apoiado pelos testes já existentes, que quebram e são corrigidos junto. Um passo por arquivo, verificação e commit no final.

- [ ] **Step 1: `Placement.ts`**

Arquivo completo:

```ts
export type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" | "package";

// Superfícies que não referenciam nada além de si mesmas — refId
// precisa ser null nelas. niche/package (fora desta lista) exigem
// refId não-null (slug do nicho, ou id do pacote). Única fonte da
// verdade: CreatePlacementUseCase e PlacementForm.tsx importam esta
// mesma lista em vez de duplicá-la.
export const NULL_REF_SURFACES: readonly PhotoSurface[] = ["hero", "quem-sou", "home-gallery"];

export interface Placement {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  caption: string | null;
  order: number;
}
```

- [ ] **Step 2: `PlacementRepository.ts`**

```ts
import type { Placement } from "./Placement";

export interface PlacementRepository {
  findAll(): Promise<Placement[]>;
  create(data: Omit<Placement, "id">): Promise<Placement>;
  update(id: string, data: Partial<Pick<Placement, "photoId" | "caption">>): Promise<Placement>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 3: `PlacementDTO.ts`**

```ts
import type { PhotoSurface } from "@/api/domain/placement/Placement";

export interface PlacementDTO {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  caption: string | null;
  order: number;
}
```

- [ ] **Step 4: `UpdatePlacementUseCase.ts`**

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import type { PlacementDTO } from "./PlacementDTO";

export class UpdatePlacementUseCase {
  constructor(private readonly repo: PlacementRepository) {}

  async execute(
    id: string,
    data: Partial<Pick<Placement, "photoId" | "caption">>,
  ): Promise<PlacementDTO> {
    const placement = await this.repo.update(id, data);
    return { ...placement };
  }
}
```

- [ ] **Step 5: `UpdatePlacementUseCase.test.ts`**

```ts
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { describe, expect, it } from "vitest";
import { UpdatePlacementUseCase } from "./UpdatePlacementUseCase";

describe("UpdatePlacementUseCase", () => {
  it("atualiza caption de um placement existente", async () => {
    const repo = new MockPlacementRepository();
    const all = await repo.findAll();
    const target = all[0];
    const updated = await new UpdatePlacementUseCase(repo).execute(target.id, {
      caption: "nova-legenda",
    });
    expect(updated.caption).toBe("nova-legenda");
  });
});
```

- [ ] **Step 6: `CreatePlacementUseCase.test.ts`**

```ts
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { describe, expect, it } from "vitest";
import { CreatePlacementUseCase } from "./CreatePlacementUseCase";

describe("CreatePlacementUseCase", () => {
  it("cria um placement em niche com refId", async () => {
    const placement = await new CreatePlacementUseCase(new MockPlacementRepository()).execute({
      photoId: "exemplo-retrato-01",
      surface: "niche",
      refId: "familia",
      caption: null,
      order: 5,
    });
    expect(placement.id).toBe("niche-familia-5");
  });

  it("rejeita refId não-null em hero", async () => {
    const useCase = new CreatePlacementUseCase(new MockPlacementRepository());
    await expect(
      useCase.execute({
        photoId: "exemplo-retrato-01",
        surface: "hero",
        refId: "algo",
        caption: null,
        order: 10,
      }),
    ).rejects.toThrow(/não usa refId/i);
  });

  it("rejeita refId null em niche", async () => {
    const useCase = new CreatePlacementUseCase(new MockPlacementRepository());
    await expect(
      useCase.execute({
        photoId: "exemplo-retrato-01",
        surface: "niche",
        refId: null,
        caption: null,
        order: 10,
      }),
    ).rejects.toThrow(/exige um refId/i);
  });
});
```

- [ ] **Step 7: `PlacementRepositoryImpl.ts`**

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import { getAdminDb } from "@/api/infrastructure/firebase/admin";

const COLLECTION = "placements_draft";

function toPlacement(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Placement {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    id: doc.id,
    photoId: data.photoId,
    surface: data.surface,
    refId: data.refId ?? null,
    caption: data.caption ?? null,
    order: data.order,
  };
}

function computeId(surface: Placement["surface"], refId: string | null, order: number): string {
  return `${surface}-${refId ?? "none"}-${order}`;
}

// Lê/escreve "placements_draft" — ver
// docs/superpowers/specs/2026-09-09-rascunho-publicar-design.md.
// ID determinístico: mesma checagem de slot duplicado de sempre —
// .doc(id).get() antes do .set() é o próprio "já existe um placement
// nesse slot?", porque o slot É o ID. delete() tombstoneia
// (_deleted:true) em vez de apagar; findAll() filtra tombstone em JS.
export class PlacementRepositoryImpl implements PlacementRepository {
  async findAll(): Promise<Placement[]> {
    const snapshot = await getAdminDb().collection(COLLECTION).get();
    return snapshot.docs.filter((doc) => !doc.data()._deleted).map(toPlacement);
  }

  async create(data: Omit<Placement, "id">): Promise<Placement> {
    const id = computeId(data.surface, data.refId, data.order);
    const existing = await getAdminDb().collection(COLLECTION).doc(id).get();
    if (existing.exists && !existing.data()?._deleted) {
      throw new Error(
        `Já existe um placement em "${data.surface}"/"${data.refId}"/ordem ${data.order}.`,
      );
    }
    await getAdminDb().collection(COLLECTION).doc(id).set(data);
    return { id, ...data };
  }

  async update(
    id: string,
    data: Partial<Pick<Placement, "photoId" | "caption">>,
  ): Promise<Placement> {
    await getAdminDb().collection(COLLECTION).doc(id).update(data);
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    if (!doc.exists) throw new Error(`Placement "${id}" não encontrado depois de atualizar.`);
    return toPlacement(doc);
  }

  async delete(id: string): Promise<void> {
    await getAdminDb().collection(COLLECTION).doc(id).update({ _deleted: true });
  }
}
```

- [ ] **Step 8: `MockPlacementRepository.ts`**

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";

// Mesmos 7 slugs de MockNicheRepository.ts — sem um arquivo compartilhado
// (nicheSlugs.ts existe só no app-photo), repetido aqui de propósito.
const NICHE_SLUGS = [
  "retratos-profissionais",
  "making-of-da-noiva",
  "aniversario-e-eventos",
  "casamento-civil",
  "comercial",
  "familia",
  "gestante",
];

function id(surface: Placement["surface"], refId: string | null, order: number): string {
  return `${surface}-${refId ?? "none"}-${order}`;
}

function placement(p: Omit<Placement, "id">): Placement {
  return { id: id(p.surface, p.refId, p.order), ...p };
}

// Dataset ampliado — o suficiente pra cada superfície do app-photo real
// renderizar sem quebrar quando ele lê deste mesmo Firestore (emulado),
// não só pra exercitar o CRUD do admin isoladamente: 4 fotos de hero
// (mesmo tanto de slots rotativos), 4 de quem-sou (About.tsx acessa
// family[0..3] posicionalmente — precisa das 4), 6 de home-gallery
// (spreadPoses tem exatamente 6 posições) e 2 por nicho (uma paisagem,
// uma retrato, pra NicheHero.tsx ter o que filtrar por orientação).
let PLACEMENTS: Placement[] = [
  ...["01", "02", "03", "04"].map((n, i) =>
    placement({
      photoId: `exemplo-hero-${n}`,
      surface: "hero",
      refId: null,
      caption: null,
      order: i,
    }),
  ),
  placement({
    photoId: "exemplo-quemsou-capa",
    surface: "quem-sou",
    refId: null,
    caption: "capa",
    order: 0,
  }),
  placement({
    photoId: "exemplo-quemsou-polaroid-1",
    surface: "quem-sou",
    refId: null,
    caption: "polaroid-1",
    order: 1,
  }),
  placement({
    photoId: "exemplo-quemsou-altar",
    surface: "quem-sou",
    refId: null,
    caption: "altar",
    order: 2,
  }),
  placement({
    photoId: "exemplo-quemsou-polaroid-2",
    surface: "quem-sou",
    refId: null,
    caption: "polaroid-2",
    order: 3,
  }),
  ...["01", "02", "03", "04", "05", "06"].map((n, i) =>
    placement({
      photoId: `exemplo-galeria-${n}`,
      surface: "home-gallery",
      refId: null,
      caption: "galeria",
      order: i,
    }),
  ),
  ...NICHE_SLUGS.flatMap((slug) => [
    placement({
      photoId: `exemplo-${slug}-01`,
      surface: "niche",
      refId: slug,
      caption: null,
      order: 0,
    }),
    placement({
      photoId: `exemplo-${slug}-02`,
      surface: "niche",
      refId: slug,
      caption: null,
      order: 1,
    }),
  ]),
];

export class MockPlacementRepository implements PlacementRepository {
  async findAll(): Promise<Placement[]> {
    return [...PLACEMENTS];
  }

  async create(data: Omit<Placement, "id">): Promise<Placement> {
    const newId = id(data.surface, data.refId, data.order);
    if (PLACEMENTS.some((p) => p.id === newId)) {
      throw new Error(
        `Já existe um placement em "${data.surface}"/"${data.refId}"/ordem ${data.order}.`,
      );
    }
    const created: Placement = { id: newId, ...data };
    PLACEMENTS = [...PLACEMENTS, created];
    return created;
  }

  async update(
    id: string,
    data: Partial<Pick<Placement, "photoId" | "caption">>,
  ): Promise<Placement> {
    const index = PLACEMENTS.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Placement "${id}" não encontrado.`);
    const updated = { ...PLACEMENTS[index], ...data };
    PLACEMENTS = [...PLACEMENTS.slice(0, index), updated, ...PLACEMENTS.slice(index + 1)];
    return updated;
  }

  async delete(id: string): Promise<void> {
    PLACEMENTS = PLACEMENTS.filter((p) => p.id !== id);
  }
}
```

- [ ] **Step 9: `MockPlacementRepository.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockPlacementRepository as MockPlacementRepositoryClass } from "./MockPlacementRepository";

let MockPlacementRepository: typeof MockPlacementRepositoryClass;

beforeEach(async () => {
  vi.resetModules();
  ({ MockPlacementRepository } = await import("./MockPlacementRepository"));
});

describe("MockPlacementRepository", () => {
  it("lista todos os placements sintéticos", async () => {
    const repo = new MockPlacementRepository();
    const all = await repo.findAll();
    expect(all.length).toBeGreaterThan(0);
  });

  it("cria um placement com ID determinístico surface-refId-order", async () => {
    const repo = new MockPlacementRepository();
    const created = await repo.create({
      photoId: "exemplo-retrato-01",
      surface: "niche",
      refId: "gestante",
      caption: null,
      order: 99,
    });
    expect(created.id).toBe("niche-gestante-99");
  });

  it('usa "none" no ID quando refId é null', async () => {
    const repo = new MockPlacementRepository();
    const created = await repo.create({
      photoId: "exemplo-retrato-01",
      surface: "hero",
      refId: null,
      caption: null,
      order: 99,
    });
    expect(created.id).toBe("hero-none-99");
  });

  it("rejeita criar um segundo placement no mesmo slot", async () => {
    const repo = new MockPlacementRepository();
    await repo.create({
      photoId: "exemplo-retrato-01",
      surface: "hero",
      refId: null,
      caption: null,
      order: 50,
    });
    await expect(
      repo.create({
        photoId: "exemplo-gestante-01",
        surface: "hero",
        refId: null,
        caption: null,
        order: 50,
      }),
    ).rejects.toThrow(/já existe/i);
  });

  it("atualiza photoId/caption sem afetar surface/refId/order", async () => {
    const repo = new MockPlacementRepository();
    const created = await repo.create({
      photoId: "exemplo-retrato-01",
      surface: "home-gallery",
      refId: null,
      caption: "galeria",
      order: 50,
    });
    const updated = await repo.update(created.id, {
      photoId: "exemplo-evento-01",
      caption: "destaque",
    });
    expect(updated.photoId).toBe("exemplo-evento-01");
    expect(updated.caption).toBe("destaque");
    expect(updated.surface).toBe("home-gallery");
    expect(updated.order).toBe(50);
  });

  it("remove por id", async () => {
    const repo = new MockPlacementRepository();
    const created = await repo.create({
      photoId: "exemplo-retrato-01",
      surface: "hero",
      refId: null,
      caption: null,
      order: 77,
    });
    await repo.delete(created.id);
    const all = await repo.findAll();
    expect(all.find((p) => p.id === created.id)).toBeUndefined();
  });
});
```

- [ ] **Step 10: `actions/placements.ts`**

Alterar só a assinatura de `updatePlacement` (resto do arquivo inalterado):

```ts
export async function updatePlacement(
  id: string,
  data: Partial<Pick<Placement, "photoId" | "caption">>,
): Promise<PlacementViewModel> {
  await assertSession();
  const placement = await new UpdatePlacementUseCase(RepositoryFactory.placements()).execute(
    id,
    data,
  );
  await markDraftDirty();
  return toPlacementViewModel(placement);
}
```

- [ ] **Step 11: `PlacementsManager.tsx`**

Trocar a coluna (linha ~45), resto do arquivo inalterado:

```tsx
        { key: 'caption', header: 'Legenda' },
```

(era `{ key: 'role', header: 'Papel' },`)

- [ ] **Step 12: `PlacementForm.tsx`**

Alterar `PlacementFormValues`, `EMPTY_PLACEMENT_FORM`, o campo de input, e `toCreatePayload`/`fromPlacement` — só o rename, a regra de visibilidade condicional é a Task 4. Trechos alterados:

```ts
export interface PlacementFormValues {
  photoId: string;
  surface: PhotoSurface;
  refId: string;
  caption: string;
  order: string;
}

export const EMPTY_PLACEMENT_FORM: PlacementFormValues = {
  photoId: "",
  surface: "hero",
  refId: "",
  caption: "",
  order: "0",
};
```

```tsx
{
  identityEditable && (
    <div>
      <Label htmlFor="caption">Legenda (opcional)</Label>
      <Input
        id="caption"
        value={values.caption}
        onChange={(e) => set("caption", e.target.value)}
        placeholder="ex.: capa, polaroid-1, destaque"
      />
    </div>
  );
}
```

```ts
export function toCreatePayload(values: PlacementFormValues) {
  return {
    photoId: values.photoId,
    surface: values.surface,
    refId: NULL_REF_SURFACES.includes(values.surface) ? null : values.refId,
    caption: values.caption.trim() ? values.caption.trim() : null,
    order: Number(values.order) || 0,
  };
}

export function fromPlacement(placement: {
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  caption: string | null;
  order: number;
}): PlacementFormValues {
  return {
    photoId: placement.photoId,
    surface: placement.surface,
    refId: placement.refId ?? "",
    caption: placement.caption ?? "",
    order: String(placement.order),
  };
}
```

- [ ] **Step 13: `PlacementForm.test.ts`**

Trocar `role: null,` por `caption: null,` na função `placement()` (linha 10), resto do arquivo inalterado.

- [ ] **Step 14: `EditPlacementModal.tsx`**

```tsx
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!placement || !values) return;
  const payload = toCreatePayload(values);
  startTransition(async () => {
    const result = await runMutation(
      () =>
        updatePlacement(placement.id, {
          photoId: payload.photoId,
          caption: payload.caption,
        }),
      {
        success: "Posicionamento atualizado.",
        fallbackError: "Falha ao atualizar posicionamento.",
      },
    );
    if (result.ok) {
      onUpdated(result.value);
      onOpenChange(false);
    }
  });
}
```

- [ ] **Step 15: Verificação completa**

Run: `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 16: Commit**

```bash
git add src/api/domain/placement/Placement.ts \
  src/api/domain/placement/PlacementRepository.ts \
  src/api/application/placement/PlacementDTO.ts \
  src/api/application/placement/UpdatePlacementUseCase.ts \
  src/api/application/placement/UpdatePlacementUseCase.test.ts \
  src/api/application/placement/CreatePlacementUseCase.test.ts \
  src/api/infrastructure/repositories/PlacementRepositoryImpl.ts \
  src/api/infrastructure/repositories/mock/MockPlacementRepository.ts \
  src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts \
  src/actions/placements.ts \
  src/app/placements/_components/PlacementsManager.tsx \
  src/app/placements/_components/PlacementForm.tsx \
  src/app/placements/_components/PlacementForm.test.ts \
  src/app/placements/_components/EditPlacementModal.tsx
git commit -m "$(cat <<'EOF'
refactor: rename Placement.role to Placement.caption

Mechanical rename across domain/application/infrastructure/UI —
the field is always opaque display text, never compared or used as
logic, so this is safe without a data migration (no production
Firestore yet).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Rename `role` → `caption` em app-photo

**Files:**

- Modify: `app-photo/src/api/domain/placement/Placement.ts`
- Modify: `app-photo/src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`
- Modify: `app-photo/src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`
- Modify: `app-photo/src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
- Modify: `app-photo/src/api/application/photo/PlacedPhotoDTO.ts`
- Modify: `app-photo/src/api/application/photo/GetPhotosBySurfaceUseCase.ts`
- Modify: `app-photo/src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts`
- Modify: `app-photo/scripts/migration/derivePhotosAndPlacements.ts`
- Modify: `app-photo/scripts/migration/derivePhotosAndPlacements.test.ts`

**Interfaces:**

- Produces: `Placement.caption`, `PlacedPhotoDTO.caption` — consumido pela Task 6 (`toLabeledPhoto`).
- `app-photo/scripts/migrate-to-firestore.ts` **não precisa edição** — grava o objeto `placement`/`DerivedPlacement` inteiro por spread, sem referenciar `role`/`caption` como literal.
- `app-photo/src/actions/_shared/getPhotosBySurface.ts` e `app-photo/src/actions/niches.ts` têm comentários que citam a palavra "role" — não são código funcional, ficam pra Task 6/8 que já editam esses arquivos por outro motivo.

Mesmo caráter da Task 1: rename mecânico, não é TDD, é refactor apoiado pelos testes existentes.

- [ ] **Step 1: `Placement.ts`**

```ts
export type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" | "package";

export interface Placement {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  /** slug do nicho ou id do pacote — null em hero/quem-sou/home-gallery. */
  refId: string | null;
  /** legenda da foto na superfície (ex.: "capa", "polaroid-1"; texto
   *  exibido em home-gallery/niche/quem-sou) — null onde não se aplica. */
  caption: string | null;
  order: number;
}
```

- [ ] **Step 2: `PlacementRepositoryImpl.ts`**

```ts
import type { Placement, PhotoSurface } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "placements";
const DRAFT_COLLECTION = "placements_draft";

function toPlacement(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Placement {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "placements" está vazio`);
  return {
    id: doc.id,
    photoId: data.photoId,
    surface: data.surface,
    refId: data.refId ?? null,
    caption: data.caption ?? null,
    order: data.order,
  };
}

const findPlacementsBySurface = unstable_cache(
  async (surface: PhotoSurface, refId?: string): Promise<Placement[]> => {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION).where("surface", "==", surface);
    if (refId !== undefined) {
      query = query.where("refId", "==", refId);
    }
    const snapshot = await query.orderBy("order", "asc").get();
    return snapshot.docs.map(toPlacement);
  },
  ["placements", "findBySurface"],
  { tags: ["placements"] },
);

// Modo rascunho: só os wheres de igualdade (sem orderBy combinado) —
// evita precisar de um índice composto novo pra "placements_draft".
// Ordena/filtra tombstone em JS.
async function findDraftPlacementsBySurface(
  surface: PhotoSurface,
  refId?: string,
): Promise<Placement[]> {
  let query: FirebaseFirestore.Query = db
    .collection(DRAFT_COLLECTION)
    .where("surface", "==", surface);
  if (refId !== undefined) {
    query = query.where("refId", "==", refId);
  }
  const snapshot = await query.get();
  return snapshot.docs
    .filter((doc) => !doc.data()._deleted)
    .map(toPlacement)
    .sort((a, b) => a.order - b.order);
}

export class PlacementRepositoryImpl implements PlacementRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]> {
    return this.isDraft
      ? findDraftPlacementsBySurface(surface, opts?.refId)
      : findPlacementsBySurface(surface, opts?.refId);
  }
}
```

(única mudança real: `caption: data.caption ?? null,` no lugar de `role: data.role ?? null,`)

- [ ] **Step 3: `MockPlacementRepository.ts`**

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import { MOCK_NICHE_SLUGS } from "./nicheSlugs";

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
    placement({ photoId, surface: "hero", refId: null, caption: null, order }),
  ),
  placement({
    photoId: "quemsou-capa",
    surface: "quem-sou",
    refId: null,
    caption: "capa",
    order: 0,
  }),
  placement({
    photoId: "quemsou-polaroid-1",
    surface: "quem-sou",
    refId: null,
    caption: "polaroid-1",
    order: 1,
  }),
  placement({
    photoId: "quemsou-altar",
    surface: "quem-sou",
    refId: null,
    caption: "altar",
    order: 2,
  }),
  placement({
    photoId: "quemsou-polaroid-2",
    surface: "quem-sou",
    refId: null,
    caption: "polaroid-2",
    order: 3,
  }),
  ...["galeria-1", "galeria-2", "gestante-1", "familia-1", "galeria-3", "gestante-2"].map(
    (photoId, order) =>
      placement({
        photoId,
        surface: "home-gallery",
        refId: null,
        caption: galleryLabel(photoId),
        order,
      }),
  ),
  // 2 fotos por nicho — ver nicheSlugs.ts pra por quê a cobertura dos 7
  // slugs reais precisa ser completa (getEventNiches usa 3 dos 7).
  ...MOCK_NICHE_SLUGS.flatMap((slug) =>
    [`${slug}-1`, `${slug}-2`].map((photoId, order) =>
      placement({ photoId, surface: "niche", refId: slug, caption: null, order }),
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

- [ ] **Step 4: `MockPlacementRepository.test.ts`**

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

  it("retorna os 4 placements de quem-sou, com caption distinto cada", async () => {
    const repo = new MockPlacementRepository();
    const placements = await repo.findBySurface("quem-sou");
    expect(placements).toHaveLength(4);
    expect(new Set(placements.map((p) => p.caption)).size).toBe(4);
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

- [ ] **Step 5: `PlacedPhotoDTO.ts`**

```ts
export interface PlacedPhotoDTO {
  id: string;
  placementId: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  caption: string | null;
}
```

- [ ] **Step 6: `GetPhotosBySurfaceUseCase.ts`**

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
      result.push({ ...photo, placementId: placement.id, caption: placement.caption });
    }
    return result;
  }
}
```

- [ ] **Step 7: `GetPhotosBySurfaceUseCase.test.ts`**

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

  it("inclui o caption de cada foto", async () => {
    const photos = await useCase().execute("quem-sou");
    expect(photos.map((p) => p.caption)).toEqual(["capa", "polaroid-1", "altar", "polaroid-2"]);
  });

  it("filtra por refId quando informado", async () => {
    const photos = await useCase().execute("niche", { refId: "familia" });
    expect(photos.every((p) => p.id.startsWith("familia"))).toBe(true);
  });

  it("retorna array vazio quando a superfície não tem placement", async () => {
    const photos = await useCase().execute("package", { refId: "nao-existe" });
    expect(photos).toEqual([]);
  });

  it("inclui o id do placement (não o da foto) em cada resultado", async () => {
    const photos = await useCase().execute("hero");
    for (const photo of photos) {
      expect(photo.placementId).toMatch(/^mock-placement-\d+$/);
    }
    // ids de placement são únicos por resultado, mesmo quando duas fotos
    // diferentes aparecem na mesma superfície.
    expect(new Set(photos.map((p) => p.placementId)).size).toBe(photos.length);
  });
});
```

- [ ] **Step 8: `scripts/migration/derivePhotosAndPlacements.ts`**

```ts
import type { PhotoSurface } from "@/api/domain/placement/Placement";

export interface RawPhoto {
  slug: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export interface DerivedFoto {
  id: string;
  localPath: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export interface DerivedPlacement {
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  caption: string | null;
  order: number;
}

// Reimplementação verbatim de gallery.ts/niches.ts de antes do plano 3
// remover ("categoria()"/"intercalar()"/"isHorizontal()" — commit
// 7eadcb8^; "NICHE_PHOTO_CATEGORIES"/"nichePhotos()" — commit 052d7f9^).
// Não é reinvenção: é a mesma lógica, rodando uma última vez, transformando
// photos.json real em Placement concretos — depois disso, o algoritmo não
// existe em nenhum lugar do código, só aqui, e só até este script rodar.
const ABOUT_FAMILY_COUNT = 4;
const GALLERY_SIZE = 18;
const HERO_SIZE = 12;

const GALLERY_CATEGORIES = [
  { slug: "familia", label: "família" },
  { slug: "gestante", label: "gestante" },
  { slug: "profissional", label: "profissional" },
  { slug: "evento-aniversario", label: "aniversário" },
  { slug: "casamento-civil", label: "casamento" },
];

const HERO_CATEGORIES = ["familia", "gestante", "evento-aniversario"];

const ABOUT_CAPTIONS = ["capa", "polaroid-1", "altar", "polaroid-2"];

const NICHE_PHOTO_CATEGORIES: Record<string, string[]> = {
  "retratos-profissionais": ["profissional", "corporativo", "pessoal"],
  "making-of-da-noiva": ["making-of-noiva"],
  "aniversario-e-eventos": ["evento-aniversario"],
  "casamento-civil": ["casamento-civil"],
  comercial: ["comercial"],
  familia: ["familia"],
  gestante: ["gestante"],
};

function categoria(photos: Record<string, RawPhoto[]>, slug: string): RawPhoto[] {
  const pool = photos[slug] ?? [];
  return slug === "familia" ? pool.slice(ABOUT_FAMILY_COUNT) : pool;
}

function intercalar<T>(pools: T[][], limite: number): T[] {
  const ordenado: T[] = [];
  for (let rodada = 0; ordenado.length < limite; rodada++) {
    const rodadaAtual = pools
      .map((pool) => pool[rodada])
      .filter((item): item is T => Boolean(item));
    if (rodadaAtual.length === 0) break;
    ordenado.push(...rodadaAtual);
  }
  return ordenado.slice(0, limite);
}

function isHorizontal(photo: RawPhoto): boolean {
  return photo.width > photo.height;
}

export function deriveFotos(photos: Record<string, RawPhoto[]>): DerivedFoto[] {
  return Object.values(photos)
    .flat()
    .map((photo) => ({
      id: photo.slug,
      localPath: photo.src,
      width: photo.width,
      height: photo.height,
      blurDataURL: photo.blurDataURL,
    }));
}

export function derivePlacements(photos: Record<string, RawPhoto[]>): DerivedPlacement[] {
  const placements: DerivedPlacement[] = [];

  const heroPools = HERO_CATEGORIES.map((slug) => categoria(photos, slug).filter(isHorizontal));
  intercalar(heroPools, HERO_SIZE).forEach((photo, order) => {
    placements.push({ photoId: photo.slug, surface: "hero", refId: null, caption: null, order });
  });

  (photos.familia ?? []).slice(0, ABOUT_FAMILY_COUNT).forEach((photo, order) => {
    placements.push({
      photoId: photo.slug,
      surface: "quem-sou",
      refId: null,
      caption: ABOUT_CAPTIONS[order],
      order,
    });
  });

  const galleryPools = GALLERY_CATEGORIES.map(({ slug, label }) =>
    categoria(photos, slug).map((photo) => ({ ...photo, label })),
  );
  intercalar(galleryPools, GALLERY_SIZE).forEach((photo, order) => {
    placements.push({
      photoId: photo.slug,
      surface: "home-gallery",
      refId: null,
      caption: photo.label,
      order,
    });
  });

  for (const [nicheSlug, categorias] of Object.entries(NICHE_PHOTO_CATEGORIES)) {
    const galeria = categorias.flatMap((c) => photos[c] ?? []);
    galeria.forEach((photo, order) => {
      placements.push({
        photoId: photo.slug,
        surface: "niche",
        refId: nicheSlug,
        caption: null,
        order,
      });
    });
  }

  return placements;
}
```

- [ ] **Step 9: `scripts/migration/derivePhotosAndPlacements.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import photosByCategory from "@/actions/_mock/photos.json";
import { deriveFotos, derivePlacements, type RawPhoto } from "./derivePhotosAndPlacements";

const photos = photosByCategory as Record<string, RawPhoto[]>;

const NICHE_SLUGS = [
  "retratos-profissionais",
  "making-of-da-noiva",
  "aniversario-e-eventos",
  "casamento-civil",
  "comercial",
  "familia",
  "gestante",
];

describe("deriveFotos", () => {
  it("deriva as 87 fotos reais, uma por slug, sem duplicar", () => {
    const fotos = deriveFotos(photos);
    expect(fotos).toHaveLength(87);
    expect(new Set(fotos.map((f) => f.id)).size).toBe(87);
  });
});

describe("derivePlacements", () => {
  it("hero: só fotos horizontais, no máximo 12", () => {
    const placements = derivePlacements(photos).filter((p) => p.surface === "hero");
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.length).toBeLessThanOrEqual(12);
  });

  it("quem-sou: exatamente 4 placements, captions capa/polaroid-1/altar/polaroid-2 em ordem", () => {
    const placements = derivePlacements(photos)
      .filter((p) => p.surface === "quem-sou")
      .sort((a, b) => a.order - b.order);
    expect(placements.map((p) => p.caption)).toEqual(["capa", "polaroid-1", "altar", "polaroid-2"]);
  });

  it("home-gallery: no máximo 18, cada um com caption preenchido", () => {
    const placements = derivePlacements(photos).filter((p) => p.surface === "home-gallery");
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.length).toBeLessThanOrEqual(18);
    for (const p of placements) expect(p.caption).toBeTruthy();
  });

  it("nicho: cada um dos 7 slugs reais tem pelo menos 1 placement", () => {
    const placements = derivePlacements(photos).filter((p) => p.surface === "niche");
    for (const slug of NICHE_SLUGS) {
      expect(placements.filter((p) => p.refId === slug).length).toBeGreaterThan(0);
    }
  });

  it("retratos-profissionais tem 20 fotos na galeria (profissional+corporativo+pessoal)", () => {
    const placements = derivePlacements(photos).filter((p) => p.refId === "retratos-profissionais");
    expect(placements).toHaveLength(20);
  });

  it("nenhum placement referencia uma foto que deriveFotos não produziu", () => {
    const fotoIds = new Set(deriveFotos(photos).map((f) => f.id));
    for (const placement of derivePlacements(photos)) {
      expect(fotoIds.has(placement.photoId)).toBe(true);
    }
  });
});
```

- [ ] **Step 10: Verificação completa**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 11: Commit**

```bash
git add src/api/domain/placement/Placement.ts \
  src/api/infrastructure/repositories/PlacementRepositoryImpl.ts \
  src/api/infrastructure/repositories/mock/MockPlacementRepository.ts \
  src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts \
  src/api/application/photo/PlacedPhotoDTO.ts \
  src/api/application/photo/GetPhotosBySurfaceUseCase.ts \
  src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts \
  scripts/migration/derivePhotosAndPlacements.ts \
  scripts/migration/derivePhotosAndPlacements.test.ts
git commit -m "$(cat <<'EOF'
refactor: rename Placement.role to Placement.caption

Same rename as admin-photo (independent Firestore stack, same field).
migrate-to-firestore.ts needs no changes — it writes the whole object
by spread, never references role/caption as a literal.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `POLAROID_SURFACES` + `nextOrderFor` (admin-photo)

**Files:**

- Modify: `admin-photo/src/api/domain/placement/Placement.ts`
- Create: `admin-photo/src/app/preview/_components/nextOrderFor.ts`
- Test: `admin-photo/src/app/preview/_components/nextOrderFor.test.ts`

**Interfaces:**

- Consumes: `PhotoSurface`, `NULL_REF_SURFACES` de `Placement.ts` (Task 1).
- Produces: `POLAROID_SURFACES: readonly PhotoSurface[]` — consumido pela Task 4 e Task 5. `nextOrderFor(surface, refId, placements): number` — consumido pela Task 5.

- [ ] **Step 1: Adicionar `POLAROID_SURFACES` em `Placement.ts`**

```ts
export type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" | "package";

// Superfícies que não referenciam nada além de si mesmas — refId
// precisa ser null nelas. niche/package (fora desta lista) exigem
// refId não-null (slug do nicho, ou id do pacote). Única fonte da
// verdade: CreatePlacementUseCase e PlacementForm.tsx importam esta
// mesma lista em vez de duplicá-la.
export const NULL_REF_SURFACES: readonly PhotoSurface[] = ["hero", "quem-sou", "home-gallery"];

// Superfícies com visual de polaroide no site — a legenda só aparece
// pro usuário editar nessas, nas demais (hero/package) o campo fica
// oculto porque a legenda não é exibida em lugar nenhum do site.
export const POLAROID_SURFACES: readonly PhotoSurface[] = ["home-gallery", "niche", "quem-sou"];

export interface Placement {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  caption: string | null;
  order: number;
}
```

- [ ] **Step 2: Escrever o teste que falha**

```ts
import { describe, expect, it } from "vitest";
import { nextOrderFor } from "./nextOrderFor";

describe("nextOrderFor", () => {
  it("retorna 0 quando não há nenhum placement nessa superfície/refId", () => {
    expect(nextOrderFor("niche", "familia", [])).toBe(0);
  });

  it("retorna maior order existente + 1", () => {
    const placements = [
      { surface: "niche" as const, refId: "familia", order: 0 },
      { surface: "niche" as const, refId: "familia", order: 2 },
      { surface: "niche" as const, refId: "familia", order: 1 },
    ];
    expect(nextOrderFor("niche", "familia", placements)).toBe(3);
  });

  it("ignora placements de outra superfície ou outro refId", () => {
    const placements = [
      { surface: "niche" as const, refId: "gestante", order: 5 },
      { surface: "package" as const, refId: "pacote-1", order: 9 },
    ];
    expect(nextOrderFor("niche", "familia", placements)).toBe(0);
  });

  it("trata refId como null pra superfícies NULL_REF_SURFACES (hero/quem-sou/home-gallery)", () => {
    const placements = [
      { surface: "home-gallery" as const, refId: null, order: 0 },
      { surface: "home-gallery" as const, refId: null, order: 1 },
    ];
    expect(nextOrderFor("home-gallery", null, placements)).toBe(2);
  });
});
```

Salvar como `admin-photo/src/app/preview/_components/nextOrderFor.test.ts`.

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `cd admin-photo && npx vitest run src/app/preview/_components/nextOrderFor.test.ts`
Expected: FAIL — `Cannot find module './nextOrderFor'`

- [ ] **Step 4: Implementar `nextOrderFor.ts`**

```ts
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import { NULL_REF_SURFACES } from "@/api/domain/placement/Placement";

export function nextOrderFor(
  surface: PhotoSurface,
  refId: string | null,
  placements: { surface: PhotoSurface; refId: string | null; order: number }[],
): number {
  const normalizedRefId = NULL_REF_SURFACES.includes(surface) ? null : refId;
  const matching = placements.filter(
    (p) =>
      p.surface === surface &&
      (NULL_REF_SURFACES.includes(p.surface) ? null : p.refId) === normalizedRefId,
  );
  return matching.length === 0 ? 0 : Math.max(...matching.map((p) => p.order)) + 1;
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `cd admin-photo && npx vitest run src/app/preview/_components/nextOrderFor.test.ts`
Expected: PASS (4 testes)

- [ ] **Step 6: Verificação completa**

Run: `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add src/api/domain/placement/Placement.ts \
  src/app/preview/_components/nextOrderFor.ts \
  src/app/preview/_components/nextOrderFor.test.ts
git commit -m "$(cat <<'EOF'
feat: add POLAROID_SURFACES and nextOrderFor

nextOrderFor computes the next order value for a surface+refId slot
automatically, so the preview's "new photo" flow never has to ask
the user for it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `PlacementForm.tsx` — Legenda condicional no fluxo de editar via preview (admin-photo)

**Files:**

- Modify: `admin-photo/src/app/placements/_components/PlacementForm.tsx`

**Interfaces:**

- Consumes: `POLAROID_SURFACES` (Task 3).

Hoje, com `identityEditable={false}` (usado só por `EditPlacementModal`, o modal que abre ao clicar numa foto existente no preview), nenhum campo de texto aparece — só o seletor de foto. Isso passa a depender também de `POLAROID_SURFACES`.

- [ ] **Step 1: Importar `POLAROID_SURFACES`**

```ts
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import { NULL_REF_SURFACES, POLAROID_SURFACES } from "@/api/domain/placement/Placement";
```

(era `import { NULL_REF_SURFACES } from '@/api/domain/placement/Placement';`)

- [ ] **Step 2: Trocar a condição de visibilidade do campo Legenda**

```tsx
{
  (identityEditable || POLAROID_SURFACES.includes(values.surface)) && (
    <div>
      <Label htmlFor="caption">Legenda (opcional)</Label>
      <Input
        id="caption"
        value={values.caption}
        onChange={(e) => set("caption", e.target.value)}
        placeholder="ex.: capa, polaroid-1, destaque"
      />
    </div>
  );
}
```

(era `{identityEditable && (...)}`)

O campo Ordem (bloco seguinte) continua `{identityEditable && (...)}`, sem mudança — Ordem nunca aparece no fluxo de editar via preview, só na página `/placements`.

- [ ] **Step 3: Verificação completa**

Run: `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 4: Smoke test manual**

Rodar os dois dev servers, abrir `/preview` na aba Rascunho. Clicar numa foto de `home-gallery` (ex.: uma das polaroides do portfólio) — confirmar que agora aparece o campo "Legenda (opcional)", carregado com o valor atual. Clicar numa foto de `hero` — confirmar que nenhum campo de texto aparece (só o seletor de foto), como já era antes.

- [ ] **Step 5: Commit**

```bash
git add src/app/placements/_components/PlacementForm.tsx
git commit -m "$(cat <<'EOF'
feat: show Legenda field when editing a polaroid-surface photo

Previously the preview's edit-photo modal (identityEditable=false)
never showed any text field. Now it shows Legenda (loaded from the
database) when the placement's surface is home-gallery/niche/quem-sou
— surfaces that already render a caption on the site.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `AddPhotoModal.tsx` — passo único, sem posicionamento (admin-photo)

**Files:**

- Modify: `admin-photo/src/app/preview/_components/AddPhotoModal.tsx` (reescrito)
- Modify: `admin-photo/src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `POLAROID_SURFACES` (Task 3), `nextOrderFor` (Task 3), `createPlacement`/`Placement.caption` (Task 1).
- Produces: `AddPhotoModal` agora recebe uma prop nova `placements: PlacementViewModel[]`.

- [ ] **Step 1: Reescrever `AddPhotoModal.tsx` por completo**

```tsx
"use client";

import { createPhoto } from "@/actions/photos";
import { createPlacement } from "@/actions/placements";
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import { POLAROID_SURFACES } from "@/api/domain/placement/Placement";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { uploadToCloudinary } from "@/app/photos/_lib/uploadToCloudinary";
import { clientEnv } from "@/config/env.client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { Input } from "@/lib/_components/ui/input";
import { Label } from "@/lib/_components/ui/label";
import { runMutation } from "@/lib/_utils/runMutation";
import { showToast } from "@/lib/_utils/toast";
import { useState } from "react";
import { nextOrderFor } from "./nextOrderFor";

export function AddPhotoModal({
  open,
  onOpenChange,
  surface,
  refId,
  placements,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surface: PhotoSurface;
  refId: string | null;
  placements: PlacementViewModel[];
  onCreated: (placement: PlacementViewModel) => void;
}) {
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function reset() {
    setCaption("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const cloudName = clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = clientEnv.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      showToast({
        message: "Cloudinary não configurado (cloud name/preset ausentes).",
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    const result = await runMutation(
      async () => {
        const uploaded = await uploadToCloudinary(file, cloudName, preset);
        const photo = await createPhoto({
          cloudinaryPublicId: uploaded.publicId,
          width: uploaded.width,
          height: uploaded.height,
        });
        // Se createPlacement falhar daqui pra frente, a foto já
        // existe (createPhoto teve sucesso) mas fica sem
        // posicionamento — aparece no painel de fotos órfãs, não
        // é um estado quebrado (ver spec).
        return createPlacement({
          photoId: photo.id,
          surface,
          refId,
          caption: caption.trim() ? caption.trim() : null,
          order: nextOrderFor(surface, refId, placements),
        });
      },
      { success: "Foto adicionada.", fallbackError: "Falha ao criar o posicionamento." },
    );
    setIsUploading(false);
    if (result.ok) {
      onCreated(result.value);
      reset();
      onOpenChange(false);
    }
  }

  const showCaption = POLAROID_SURFACES.includes(surface);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova foto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {showCaption && (
            <div>
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="ex.: capa, polaroid-1, destaque"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileChange}
            className="text-sm"
          />
          {isUploading && <p className="text-muted-foreground text-sm">Enviando…</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Passar `placements` pro `AddPhotoModal` em `PreviewFrame.tsx`**

```tsx
{
  activeAdd?.kind === "placement" && (
    <AddPhotoModal
      open
      onOpenChange={(open) => !open && closeAdd()}
      surface={activeAdd.surface}
      refId={activeAdd.refId}
      placements={placements}
      onCreated={(created) => {
        setPlacements((prev) => [...prev, created]);
        closeAdd();
        reloadIframe();
      }}
    />
  );
}
```

(era o mesmo bloco sem a linha `placements={placements}`)

- [ ] **Step 3: Verificação completa**

Run: `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 4: Smoke test manual**

Rodar os dois dev servers, abrir `/preview` na aba Rascunho. Clicar no "+" de um slot de `home-gallery` (portfólio) — confirmar que aparece o campo Legenda ANTES do input de arquivo, digitar uma legenda, escolher um arquivo — confirmar que a foto some direto (sem tela de posicionamento) e aparece no portfólio com a legenda digitada. Repetir num slot de `hero` — confirmar que não aparece campo de Legenda, só o input de arquivo, e o fluxo cria a foto igual. Conferir no Firestore emulator que o novo placement tem `order` incrementado corretamente (não `0` colidindo com os existentes) quando adicionado numa galeria que já tem fotos.

- [ ] **Step 5: Commit**

```bash
git add src/app/preview/_components/AddPhotoModal.tsx \
  src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: simplify AddPhotoModal to a single step

Removes the "posicionamento" gate — order is computed automatically
via nextOrderFor, and the Legenda field only appears for polaroid
surfaces (home-gallery/niche/quem-sou). Uploading a file now creates
the photo and its placement in one shot, no confirmation click.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `LabeledPhoto`/`toLabeledPhoto` (app-photo)

**Files:**

- Modify: `app-photo/src/actions/_shared/getPhotosBySurface.ts`
- Test: `app-photo/src/actions/_shared/getPhotosBySurface.test.ts`

**Interfaces:**

- Consumes: `PlacedPhotoDTO.caption` (Task 2).
- Produces: `LabeledPhoto` (= `Photo & { label: string }`), `toLabeledPhoto(p: PlacedPhotoDTO): LabeledPhoto` — consumido pelas Tasks 7-9.

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from "vitest";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import { toLabeledPhoto } from "./getPhotosBySurface";

function dto(overrides: Partial<PlacedPhotoDTO> = {}): PlacedPhotoDTO {
  return {
    id: "foto-1",
    placementId: "placement-1",
    src: "/fotos/foto-1.webp",
    width: 1200,
    height: 1600,
    blurDataURL: "data:image/webp;base64,AA",
    caption: null,
    ...overrides,
  };
}

describe("toLabeledPhoto", () => {
  it("usa caption como label quando presente", () => {
    const photo = toLabeledPhoto(dto({ caption: "Minha base, minha família" }));
    expect(photo.label).toBe("Minha base, minha família");
  });

  it("usa string vazia como label quando caption é null", () => {
    const photo = toLabeledPhoto(dto({ caption: null }));
    expect(photo.label).toBe("");
  });

  it("preserva os campos de Photo (src/width/height/blurDataURL/placementId)", () => {
    const photo = toLabeledPhoto(
      dto({ src: "/x.webp", width: 10, height: 20, blurDataURL: "b", placementId: "p-1" }),
    );
    expect(photo).toMatchObject({
      src: "/x.webp",
      width: 10,
      height: 20,
      blurDataURL: "b",
      placementId: "p-1",
    });
  });
});
```

Salvar como `app-photo/src/actions/_shared/getPhotosBySurface.test.ts`.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd app-photo && npx vitest run src/actions/_shared/getPhotosBySurface.test.ts`
Expected: FAIL — `toLabeledPhoto` não é exportado ainda.

- [ ] **Step 3: Implementar `LabeledPhoto`/`toLabeledPhoto`**

```ts
import type { Photo } from "../_mock/types";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import type { FindBySurfaceOptions } from "@/api/domain/placement/PlacementRepository";
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import { GetPhotosBySurfaceUseCase } from "@/api/application/photo/GetPhotosBySurfaceUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

// Wiring do caso de uso repetido em gallery.ts (hero/quem-sou/home-gallery)
// e niches.ts (niche) — centralizado aqui pra mudar num lugar só se o
// construtor ganhar mais uma dependência.
export async function getPhotosBySurface(
  surface: PhotoSurface,
  opts?: FindBySurfaceOptions,
): Promise<PlacedPhotoDTO[]> {
  return new GetPhotosBySurfaceUseCase(
    await RepositoryFactory.placements(),
    await RepositoryFactory.photos(),
  ).execute(surface, opts);
}

// PlacedPhotoDTO tem id e caption — nenhum dos dois existe no Photo
// público (só src, width, height, blurDataURL). Um destructuring
// `{ id, caption, ...photo }` pareceria mais direto, mas
// @typescript-eslint/no-unused-vars deste projeto acusa campos
// descartados assim mesmo como rest-siblings — sem ignoreRestSiblings
// configurado.
export function toPhoto(p: PlacedPhotoDTO): Photo {
  return {
    src: p.src,
    width: p.width,
    height: p.height,
    blurDataURL: p.blurDataURL,
    placementId: p.placementId,
  };
}

// Generaliza o que já era GalleryPhoto (antes só em gallery.ts, só pra
// home-gallery) — home-gallery, niche e quem-sou são as três superfícies
// com visual de polaroide, todas precisam da legenda vinda de caption.
export interface LabeledPhoto extends Photo {
  label: string;
}

export function toLabeledPhoto(p: PlacedPhotoDTO): LabeledPhoto {
  return { ...toPhoto(p), label: p.caption ?? "" };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd app-photo && npx vitest run src/actions/_shared/getPhotosBySurface.test.ts`
Expected: PASS (3 testes)

- [ ] **Step 5: Verificação completa**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/actions/_shared/getPhotosBySurface.ts \
  src/actions/_shared/getPhotosBySurface.test.ts
git commit -m "$(cat <<'EOF'
feat: add LabeledPhoto/toLabeledPhoto

Generalizes what used to be home-gallery-only (GalleryPhoto) so
niche and quem-sou can also carry a real caption.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `gallery.ts` + `Gallery.tsx` usam `toLabeledPhoto`/`LabeledPhoto` (app-photo)

**Files:**

- Modify: `app-photo/src/actions/gallery.ts`
- Modify: `app-photo/src/app/_components/Gallery.tsx`
- Modify: `app-photo/src/app/_components/Gallery.test.tsx`

**Interfaces:**

- Consumes: `LabeledPhoto`/`toLabeledPhoto` (Task 6).
- Produces: `getGalleryPhotos(): Promise<LabeledPhoto[]>`, `getAboutPhotos(): Promise<{ family: LabeledPhoto[] }>` — consumido pela Task 10.

Este é um rename de tipo cosmético — comportamento de `getGalleryPhotos()` fica idêntico (já usava `role`/agora `caption` como label), só `getAboutPhotos()` ganha `label` de verdade pela primeira vez (consumido só na Task 10).

- [ ] **Step 1: `gallery.ts`**

```ts
import type { Photo } from "./_mock/types";
import {
  getPhotosBySurface,
  toLabeledPhoto,
  toPhoto,
  type LabeledPhoto,
} from "./_shared/getPhotosBySurface";

export async function getGalleryPhotos(): Promise<LabeledPhoto[]> {
  const photos = await getPhotosBySurface("home-gallery");
  return photos.map(toLabeledPhoto);
}

export async function getAboutPhotos(): Promise<{ family: LabeledPhoto[] }> {
  const photos = await getPhotosBySurface("quem-sou");
  return { family: photos.map(toLabeledPhoto) };
}

export async function getHeroPhotos(): Promise<Photo[]> {
  const photos = await getPhotosBySurface("hero");
  return photos.map(toPhoto);
}
```

- [ ] **Step 2: `Gallery.tsx`**

Trocar só o import (linha 8) e as duas ocorrências do tipo de prop `photos`:

```tsx
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
```

(era `import type { GalleryPhoto } from "@/actions/gallery";`)

```tsx
function GalleryAlbum({ photos }: { photos: LabeledPhoto[] }) {
```

(era `{ photos: GalleryPhoto[] }`)

```tsx
export function Gallery({ photos }: { photos: LabeledPhoto[] }) {
```

(era `{ photos: GalleryPhoto[] }`)

Resto do arquivo (renderização, `photo.label` já usado em `<span>{photo.label}</span>`) inalterado.

- [ ] **Step 3: `Gallery.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Gallery } from "./Gallery";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const photos: LabeledPhoto[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/fotos/teste/galeria-${i}.webp`,
  width: 1200,
  height: 1600,
  blurDataURL: "data:image/webp;base64,AA",
  placementId: `placement-galeria-${i}`,
  label: "galeria",
}));

describe("Gallery", () => {
  it("marca cada foto da página atual do álbum como editável", () => {
    const { container } = render(<Gallery photos={photos} />);
    const editables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(editables).toHaveLength(6);
    expect(editables[0].getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
  });

  it("marca a última página do álbum com um Addable de tipo placement (home-gallery)", () => {
    const { container } = render(<Gallery photos={photos} />);
    const addable = container.querySelector('[data-addable^="placement:"]');
    expect(addable?.getAttribute("data-addable")).toBe('placement:{"surface":"home-gallery"}');
  });
});
```

- [ ] **Step 4: Verificação completa**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/actions/gallery.ts \
  src/app/_components/Gallery.tsx \
  src/app/_components/Gallery.test.tsx
git commit -m "$(cat <<'EOF'
refactor: gallery.ts and Gallery.tsx use LabeledPhoto/toLabeledPhoto

Mechanical follow-up to the new shared type — no behavior change for
home-gallery (already worked), getAboutPhotos now also returns label.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `niches.ts` — galeria do nicho usa `toLabeledPhoto` (app-photo)

**Files:**

- Modify: `app-photo/src/actions/niches.ts`

**Interfaces:**

- Consumes: `LabeledPhoto`/`toLabeledPhoto` (Task 6).
- Produces: `Niche.gallery: LabeledPhoto[]` (era `Photo[]`) — consumido pelas Tasks 9 (via `PackagePicker`/`NicheGallery`) e indiretamente por `page.tsx`/`NicheHero` (que continuam aceitando `Photo[]`, compatível por herança estrutural, sem edição necessária).

- [ ] **Step 1: Editar `niches.ts`**

```ts
import type { Photo } from "./_mock/types";
import type { NicheDTO } from "@/api/application/niche/NicheDTO";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import {
  getPhotosBySurface,
  toLabeledPhoto,
  type LabeledPhoto,
} from "./_shared/getPhotosBySurface";

export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  image: Photo;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  gallery: LabeledPhoto[];
}

// image é gallery[0] — a mesma foto, não uma capa exclusiva. Assim
// sempre foi (ver plano 1); um caption "capa" separado tiraria uma foto
// da galeria da própria página do nicho, mudando quantas fotos ela mostra.
async function withPhotos(dto: NicheDTO): Promise<Niche> {
  const photos = await getPhotosBySurface("niche", { refId: dto.slug });
  const gallery = photos.map(toLabeledPhoto);
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
  const dtos = await new GetNichesUseCase(await RepositoryFactory.niches()).execute();
  return Promise.all(dtos.map(withPhotos));
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const dto = await new GetNicheBySlugUseCase(await RepositoryFactory.niches()).execute(slug);
  return dto ? withPhotos(dto) : null;
}

export async function getEventNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(await RepositoryFactory.niches()).execute();
  const eventDtos = dtos
    .filter((n) => n.showAsEventTeaser)
    .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0));
  return Promise.all(eventDtos.map(withPhotos));
}
```

Nota: `image: Photo` continua `Photo` (não `LabeledPhoto`) de propósito — é só a capa (`gallery[0]`), usada em `Events.tsx`/teasers sem legenda; `LabeledPhoto` é estruturalmente compatível (`gallery[0]` já é `LabeledPhoto`, atribuível a `Photo` por ter todos os campos e mais).

- [ ] **Step 2: Verificação completa**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS — `niches.test.ts` não faz nenhuma asserção sobre a forma de `gallery`, deve passar sem alteração.

- [ ] **Step 3: Commit**

```bash
git add src/actions/niches.ts
git commit -m "$(cat <<'EOF'
feat: niche.gallery carries caption as label

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `NicheGallery.tsx` + `PackagePicker.tsx` — legenda condicional na galeria do nicho (app-photo)

**Files:**

- Modify: `app-photo/src/app/ensaios/[slug]/_components/NicheGallery.tsx`
- Modify: `app-photo/src/app/ensaios/[slug]/_components/NicheGallery.test.tsx`
- Modify: `app-photo/src/app/ensaios/[slug]/_components/PackagePicker.tsx`

**Interfaces:**

- Consumes: `Niche.gallery: LabeledPhoto[]` (Task 8), passado via `PackagePicker`'s prop `nicheGallery`.

`PackagePicker.tsx` repassa `niche.gallery` pra `NicheGallery` através da prop `nicheGallery: Photo[]` — esse tipo precisa virar `LabeledPhoto[]` também, senão o TypeScript rejeita a chamada `<NicheGallery photos={nicheGallery} />` (um `Photo[]` não satisfaz `LabeledPhoto[]`, falta o campo `label`). Isso não estava no inventário original do spec — é uma consequência direta de mudar o tipo de `Niche.gallery`.

- [ ] **Step 1: Escrever o teste que falha (nova asserção de legenda)**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NicheGallery } from "./NicheGallery";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

function photo(i: number, label = ""): LabeledPhoto {
  return {
    src: `/fotos/teste/nicho-${i}.webp`,
    width: 1200,
    height: 1600,
    blurDataURL: "data:image/webp;base64,AA",
    placementId: `placement-nicho-${i}`,
    label,
  };
}

describe("NicheGallery", () => {
  it("marca cada foto da galeria do nicho como editável", () => {
    const photos = [photo(0), photo(1), photo(2), photo(3)];
    const { container } = render(
      <NicheGallery photos={photos} nicheTitle="Família" nicheSlug="familia" />,
    );
    const editables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(editables).toHaveLength(4);
    expect(editables[0].getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
  });

  it("marca o fim da galeria com um Addable de tipo placement (surface niche + refId)", () => {
    const photos = [photo(0), photo(1), photo(2), photo(3)];
    const { container } = render(
      <NicheGallery photos={photos} nicheTitle="Família" nicheSlug="familia" />,
    );
    const addable = container.querySelector('[data-addable^="placement:"]');
    expect(addable?.getAttribute("data-addable")).toBe(
      'placement:{"surface":"niche","refId":"familia"}',
    );
  });

  it("mostra a legenda só quando a foto tem label", () => {
    const photos = [photo(0, "Ensaio de família"), photo(1)];
    const { container } = render(
      <NicheGallery photos={photos} nicheTitle="Família" nicheSlug="familia" />,
    );
    const captions = container.querySelectorAll("figcaption");
    expect(captions).toHaveLength(1);
    expect(captions[0].textContent).toBe("Ensaio de família");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que a nova asserção falha**

Run: `cd app-photo && npx vitest run src/app/ensaios/\[slug\]/_components/NicheGallery.test.tsx`
Expected: FAIL na terceira asserção — `NicheGallery` ainda não renderiza `<figcaption>`.

- [ ] **Step 3: Editar `NicheGallery.tsx`**

```tsx
import Image from "next/image";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
import { Addable } from "@/app/_components/Addable";
import { Editable } from "@/app/_components/Editable";

export function NicheGallery({
  photos,
  nicheTitle,
  nicheSlug,
}: {
  photos: LabeledPhoto[];
  nicheTitle: string;
  nicheSlug: string;
}) {
  return (
    <div>
      <h4 className="font-condensed text-[0.68rem] uppercase tracking-[0.4em] text-gold">
        Galeria do ensaio
      </h4>
      <div className="mt-4 columns-2 gap-2">
        {photos.map((photo, i) => (
          <Editable key={photo.placementId} type="placement" id={photo.placementId}>
            <figure
              className={`group polaroid relative mb-2 break-inside-avoid transition-all duration-500 hover:z-60 hover:scale-105 active:z-60 active:scale-105 ${i % 2 ? "tape-corner" : "tape"} ${
                i % 3 === 0 ? "aspect-3/4" : "aspect-square"
              }`}
              style={{ ["--tape-rot" as string]: `${i % 2 ? 5 : -6}deg` }}
            >
              <div className="relative h-[calc(100%-1.1rem)] w-full overflow-hidden bg-background">
                <Image
                  src={photo.src}
                  alt={`Foto de ensaio de ${nicheTitle}`}
                  fill
                  sizes="(min-width: 640px) 350px, 50vw"
                  placeholder="blur"
                  blurDataURL={photo.blurDataURL}
                  className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-active:grayscale-0"
                />
              </div>
              {photo.label && (
                <figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
                  {photo.label}
                </figcaption>
              )}
            </figure>
          </Editable>
        ))}
        <Addable
          type="placement"
          context={{ surface: "niche", refId: nicheSlug }}
          className="mb-2 flex aspect-square items-center justify-center break-inside-avoid text-4xl font-light"
        >
          +
        </Addable>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Editar `PackagePicker.tsx`**

Trocar o import (linha 6) e o tipo da prop `nicheGallery` (linha 21):

```tsx
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
```

(era `import type { Photo } from "@/actions/_mock/types";`)

```tsx
  nicheGallery: LabeledPhoto[];
```

(era `nicheGallery: Photo[];`)

Resto do arquivo (uso de `nicheGallery` só repassado pra `<NicheGallery photos={nicheGallery} .../>` e pra `<NicheHero>`/galeria de detalhe) inalterado.

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `cd app-photo && npx vitest run src/app/ensaios/\[slug\]/_components/NicheGallery.test.tsx`
Expected: PASS (3 testes)

- [ ] **Step 6: Verificação completa**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add "src/app/ensaios/[slug]/_components/NicheGallery.tsx" \
  "src/app/ensaios/[slug]/_components/NicheGallery.test.tsx" \
  "src/app/ensaios/[slug]/_components/PackagePicker.tsx"
git commit -m "$(cat <<'EOF'
feat: show caption-driven legend in NicheGallery

Previously the niche gallery had no caption at all. Also updates
PackagePicker's nicheGallery prop type — it passes niche.gallery
through to NicheGallery, which now requires LabeledPhoto.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `About.tsx` — `Row` usa legenda do banco em vez de texto fixo (app-photo)

**Files:**

- Modify: `app-photo/src/app/_components/About.tsx`
- Modify: `app-photo/src/app/_components/About.test.tsx`

**Interfaces:**

- Consumes: `getAboutPhotos(): Promise<{ family: LabeledPhoto[] }>` (Task 7).

- [ ] **Step 1: Editar `About.tsx`**

Trocar o import de `Photo` por `LabeledPhoto`:

```tsx
import Image from "next/image";
import { Section } from "@/lib/_components/Section";
import { Polaroid } from "@/lib/_components/Polaroid";
import { getAboutPhotos } from "@/actions/gallery";
import { getProfile } from "@/actions/profile";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
import { Editable } from "./Editable";
import { EditableText } from "./EditableText";
```

(era `import type { Photo } from "@/actions/_mock/types";`)

`Row` perde a prop `notes` e passa a usar `photo.label`:

```tsx
function Row({ photos }: { photos: LabeledPhoto[] }) {
  return (
    <div className="grid grid-cols-12 items-start gap-x-0 pt-4">
      {photos.map((photo, i) => {
        const pose = poses[i % poses.length];
        return (
          <Editable
            key={photo.placementId}
            type="placement"
            id={photo.placementId}
            className={`transition-transform duration-500 hover:z-40 hover:rotate-0 hover:scale-[1.03] active:z-40 active:rotate-0 active:scale-[1.03] ${pose.grid}`}
          >
            <Polaroid
              photo={photo}
              alt="Registro do portfólio de Denise Galvão"
              caption={photo.label}
              aspect={pose.aspect}
              tape={i % 2 === 0 ? "top" : "corner"}
              tapeRotationDeg={i % 2 ? 6 : -7}
              className="w-full"
            />
          </Editable>
        );
      })}
    </div>
  );
}
```

(era `{ photos, notes = [] }: { photos: Photo[]; notes?: string[] }` e `caption={notes[i]}`)

O call site troca de:

```tsx
<Row
  photos={[family[1], family[3]]}
  notes={["Minha base, minha família", "Amo esportes radicais e amo adrenalina"]}
/>
```

para:

```tsx
<Row photos={[family[1], family[3]]} />
```

Resto do arquivo (capa, blocos de profissão/família com `EditableText`, foto do altar) inalterado — `family[0]`/`family[2]` continuam usados fora do `Row`, agora tipados `LabeledPhoto` (compatível, `LabeledPhoto` tem todos os campos que `Photo` tinha).

- [ ] **Step 2: Editar `About.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { About } from "./About";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("About", () => {
  it("marca a capa, os dois polaroids e a foto do altar como editáveis (tipo placement)", async () => {
    const { container } = render(await About());
    const placementEditables = container.querySelectorAll('[data-editable^="placement:"]');
    // capa + 2 polaroids (Row) + altar = 4 fotos editáveis
    expect(placementEditables).toHaveLength(4);
  });

  it("marca os campos de perfil como editáveis individualmente (tipo profile, id main)", async () => {
    const { container } = render(await About());
    const values = Array.from(
      container.querySelectorAll('[data-editable-text^="profile:main:"]'),
    ).map((el) => el.getAttribute("data-editable-text"));
    expect(values).toContain("profile:main:capaCaption");
    expect(values).toContain("profile:main:profissao.titulo");
    expect(values).toContain("profile:main:profissao.eyebrow");
    expect(values.some((v) => v?.startsWith("profile:main:profissao.paragrafos."))).toBe(true);
    expect(values).toContain("profile:main:familia.titulo");
    expect(values.some((v) => v?.startsWith("profile:main:familia.paragrafos."))).toBe(true);
    expect(values).toContain("profile:main:familia.legendaFoto");
  });

  it("usa a legenda do banco nos dois polaroids do Row, não texto fixo", async () => {
    const { container } = render(await About());
    const captions = Array.from(container.querySelectorAll("figcaption")).map(
      (el) => el.textContent,
    );
    expect(captions).toContain("polaroid-1");
    expect(captions).toContain("polaroid-2");
    expect(captions).not.toContain("Minha base, minha família");
    expect(captions).not.toContain("Amo esportes radicais e amo adrenalina");
  });
});
```

(a terceira asserção depende do dataset mock de `quem-sou` — `MockPlacementRepository.ts`, Task 2 — onde `family[1]`/`family[3]` têm `caption: "polaroid-1"`/`"polaroid-2"`)

- [ ] **Step 3: Verificação completa**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 4: Smoke test manual**

Abrir a home no preview, Rascunho tab, seção "Quem sou". Confirmar que os dois polaroids do meio mostram "polaroid-1"/"polaroid-2" como legenda (dataset do emulador) em vez do texto fixo antigo. No admin, editar a Legenda de um desses dois placements (via clique na foto no preview, `EditPlacementModal`) e confirmar que o texto na página muda de acordo.

- [ ] **Step 5: Commit**

```bash
git add src/app/_components/About.tsx src/app/_components/About.test.tsx
git commit -m "$(cat <<'EOF'
feat: Row's polaroid captions come from the database

Replaces two hardcoded strings with the placement's caption (via
LabeledPhoto.label) — makes them editable from the admin for the
first time.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification (both repos)

- [ ] Run `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
- [ ] Run `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
- [ ] Smoke test end-to-end na aba Rascunho: (1) adicionar uma foto nova num slot polaroide (home-gallery/niche/quem-sou) com legenda — confirmar passo único, sem tela de posicionamento; (2) adicionar uma foto nova num slot não-polaroide (hero/package) — confirmar que não aparece campo de legenda; (3) editar a legenda de uma foto existente numa superfície polaroide via clique no preview; (4) confirmar que uma foto em hero/package clicada não mostra campo de legenda pra editar; (5) confirmar no Firestore emulator que os documentos de `placements_draft` têm o campo `caption` (não mais `role`); (6) confirmar que nada disso aparece na aba Live até clicar Publicar.
