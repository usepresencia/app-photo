# admin-photo — CRUD de Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quarta e última entidade de conteúdo do admin — CRUD de
`Placement`, que anexa uma `Photo` a uma superfície do site público
(`hero`, `quem-sou`, `home-gallery`, `niche`, `package`). É este plano
que finalmente torna as fotos do plano 9 visíveis no `app-photo` — sem
`Placement`, `Photo` sozinha não aparece em lugar nenhum.

**Architecture:** Mesmo padrão de camadas dos planos 7-9. A diferença
central: `Placement` não tem chave de negócio natural nem um índice
gerado sequencialmente como `Package` — o ID do documento é
determinístico a partir dos três campos que definem "o slot" onde a
foto entra: `` `${surface}-${refId ?? "none"}-${order}` ``, o mesmo
formato que o script de migração do `app-photo` já usa (achado de uma
revisão de código anterior). Isso torna a detecção de slot duplicado
gratuita: dois placements querendo ocupar o mesmo `surface`+`refId`+
`order` colidem no mesmo ID, e o `create()` rejeita a colisão em vez de
sobrescrever silenciosamente. `surface`/`refId`/`order` ficam imutáveis
depois de criados (mudar qualquer um muda a identidade do slot); só
`photoId`/`role` são editáveis.

**Tech Stack:** Mesmo dos planos 6-9. Sem novas dependências.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
(seções "Modelo de conteúdo" — `Placement`, "Contrato Firestore de
produção" — `placements/{id}`, "Riscos" — Placement como peça mais nova)
**Plano anterior:** `2026-09-09-admin-photo-crud-photo.md` (9/10) — CRUD
de `Photo` completo, sem anexar a superfícies ainda.
**Precedentes investigados:**
`app-photo/src/api/domain/placement/Placement.ts`,
`PlacementRepository.ts`, `PlacementRepositoryImpl.ts` (comentário já
aponta a necessidade do índice composto, nunca materializado),
`mock/MockPlacementRepository.ts` (dados reais: 4 hero + 4 quem-sou + 6
home-gallery + 14 niche, zero package — pacotes ainda não têm foto
associada); `admin-photo/src/api/**/package/*` e `src/app/packages/**`
(template direto de CRUD com campo pai imutável e ID derivado).

## Global Constraints

- **ID do documento é determinístico:** `` `${surface}-${refId ??
"none"}-${order}` `` — mesmo formato do script de migração do
  `app-photo` (achado de uma revisão de código anterior a este plano).
  Isso faz da checagem de slot duplicado uma checagem de existência do
  próprio ID: `create()` rejeita se o documento computado já existir,
  nunca sobrescreve.
- **`refId` é `null` pra `hero`/`quem-sou`/`home-gallery`, obrigatório
  (não-null) pra `niche`/`package`** — invariante estrutural, validada
  em `CreatePlacementUseCase`. A lista das três superfícies "sem refId"
  vive uma única vez em `src/api/domain/placement/Placement.ts`
  (`NULL_REF_SURFACES`), importada tanto pelo caso de uso quanto pelo
  formulário da UI — evita duas listas divergindo.
- **`surface`/`refId`/`order` são imutáveis depois de criados** — mudar
  qualquer um muda a identidade do slot (o próprio ID). `update()` só
  aceita `photoId`/`role`. Mesma decisão de `nicheSlug` em `Package`
  (plano 8).
- **Sem validação referencial cruzada contra `Photo`/`Niche`/`Package`**
  — decisão deliberada, não descuido: um placement órfão (`photoId` de
  uma foto já removida, ou `refId` de um nicho já removido) já é um
  estado tolerado em outros pontos do sistema — `Niche.delete()` (plano 7) não faz cascade em placements, e `GetPhotosBySurfaceUseCase` do
  `app-photo` já ignora placements órfãos silenciosamente (`continue` no
  loop, sem quebrar a página). Adicionar validação estrita só na criação
  seria inconsistente com essa tolerância já aceita no resto do sistema.
- **Toda Server Action que grava dado chama `assertSession()` antes do
  caso de uso e `callRevalidateWebhook("placements")` depois** — mesmo
  padrão dos planos 7-8. Tag única `"placements"` cobre as duas leituras
  cacheadas do `app-photo` (`findBySurface` e `findByIds` — ver Task 5),
  invalidadas juntas.
- **Miniatura do placement na lista reaproveita `buildThumbnailUrl`
  direto do `photoId`** — sem buscar o documento `Photo`: `Photo.id` é
  o próprio `cloudinaryPublicId` (decisão do plano 9), então
  `buildThumbnailUrl(placement.photoId, cloudName)` já resolve a URL
  certa.
- **`app-photo` precisa de DOIS índices compostos novos**, não um só:
  as chamadas reais a `findBySurface` (`src/actions/gallery.ts`,
  `niches.ts`) usam tanto a forma com `refId` (`niche`) quanto sem
  (`hero`/`home-gallery`/`quem-sou`) — um único índice de 3 campos
  `(surface, refId, order)` não cobre sozinho uma query que filtra só
  por `surface` e ordena por `order`, sem tocar em `refId`. Ver Task 5.

---

## Mapa de arquivos

**Criar (em `admin-photo`):**

- `src/api/domain/placement/Placement.ts`, `PlacementRepository.ts`
- `src/api/application/placement/PlacementDTO.ts`,
  `GetPlacementsUseCase.ts`, `CreatePlacementUseCase.ts`,
  `UpdatePlacementUseCase.ts`, `DeletePlacementUseCase.ts` (+
  `.test.ts` de cada)
- `src/api/presentation/placement/PlacementViewModel.ts`
- `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`
- `src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`
  (+ `.test.ts`)
- `src/actions/placements.ts`
- `src/app/placements/page.tsx`
- `src/app/placements/_components/PlacementsManager.tsx`,
  `PlacementForm.tsx`, `NewPlacementModal.tsx`, `EditPlacementModal.tsx`

**Modificar (em `admin-photo`):**

- `src/api/infrastructure/repositories/RepositoryFactory.ts` — ganha
  `placements()`

**Modificar (em `app-photo`):**

- `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts` —
  ganha `unstable_cache` com tag `"placements"`
- `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts` — ganha
  `unstable_cache` com a mesma tag `"placements"`
- `firestore.indexes.json` — dois índices compostos novos pra
  `placements` (soma-se ao de `packages`, plano 8)

---

### Task 1: Domínio, DTO, casos de uso e repositório mock de Placement

**Files:**

- Create: `src/api/domain/placement/Placement.ts`,
  `PlacementRepository.ts`
- Create: `src/api/application/placement/PlacementDTO.ts`
- Create: `src/api/application/placement/GetPlacementsUseCase.ts`,
  `CreatePlacementUseCase.ts`, `UpdatePlacementUseCase.ts`,
  `DeletePlacementUseCase.ts` (+ `.test.ts` de cada)
- Create: `src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`
  (+ `.test.ts`)

**Interfaces:**

- Produces: `type PhotoSurface = "hero" | "quem-sou" | "home-gallery" |
"niche" | "package"`, `NULL_REF_SURFACES: readonly PhotoSurface[]`,
  `interface Placement { id, photoId, surface: PhotoSurface, refId:
string | null, role: string | null, order: number }`, `interface
PlacementRepository { findAll(): Promise<Placement[]>; create(data:
Omit<Placement, "id">): Promise<Placement>; update(id, data:
Partial<Pick<Placement, "photoId" | "role">>): Promise<Placement>;
delete(id): Promise<void> }`, `PlacementDTO` (idêntica a `Placement`),
  `class Get/Create/Update/DeletePlacementUseCase`.

- [ ] **Step 1: Entidade, tipo de superfície e contrato de repositório**

Create `src/api/domain/placement/Placement.ts`:

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
  role: string | null;
  order: number;
}
```

Create `src/api/domain/placement/PlacementRepository.ts`:

```ts
import type { Placement } from "./Placement";

export interface PlacementRepository {
  findAll(): Promise<Placement[]>;
  create(data: Omit<Placement, "id">): Promise<Placement>;
  update(id: string, data: Partial<Pick<Placement, "photoId" | "role">>): Promise<Placement>;
  delete(id: string): Promise<void>;
}
```

(`update` só aceita `photoId`/`role` — `surface`/`refId`/`order` são
imutáveis, ver Global Constraints. Sem `findBySurface`: a UI do admin
trabalha com a lista completa + coluna filtrável, mesmo padrão de
`Package`, plano 8, em vez de réplicar a query específica que só o
`app-photo` precisa.)

- [ ] **Step 2: DTO e caso de uso de leitura**

Create `src/api/application/placement/PlacementDTO.ts`:

```ts
import type { PhotoSurface } from "@/api/domain/placement/Placement";

export interface PlacementDTO {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  role: string | null;
  order: number;
}
```

Create `src/api/application/placement/GetPlacementsUseCase.ts`:

```ts
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import type { PlacementDTO } from "./PlacementDTO";

export class GetPlacementsUseCase {
  constructor(private readonly repo: PlacementRepository) {}

  async execute(): Promise<PlacementDTO[]> {
    const placements = await this.repo.findAll();
    return placements.map((p) => ({ ...p }));
  }
}
```

- [ ] **Step 3: Casos de uso de escrita**

Create `src/api/application/placement/CreatePlacementUseCase.ts`:

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import { NULL_REF_SURFACES } from "@/api/domain/placement/Placement";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import type { PlacementDTO } from "./PlacementDTO";

export class CreatePlacementUseCase {
  constructor(private readonly repo: PlacementRepository) {}

  async execute(data: Omit<Placement, "id">): Promise<PlacementDTO> {
    const surfaceUsesNullRef = NULL_REF_SURFACES.includes(data.surface);
    if (surfaceUsesNullRef && data.refId !== null) {
      throw new Error(`Superfície "${data.surface}" não usa refId — deveria ser null.`);
    }
    if (!surfaceUsesNullRef && data.refId === null) {
      throw new Error(`Superfície "${data.surface}" exige um refId.`);
    }
    const placement = await this.repo.create(data);
    return { ...placement };
  }
}
```

Create `src/api/application/placement/UpdatePlacementUseCase.ts`:

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import type { PlacementDTO } from "./PlacementDTO";

export class UpdatePlacementUseCase {
  constructor(private readonly repo: PlacementRepository) {}

  async execute(
    id: string,
    data: Partial<Pick<Placement, "photoId" | "role">>,
  ): Promise<PlacementDTO> {
    const placement = await this.repo.update(id, data);
    return { ...placement };
  }
}
```

Create `src/api/application/placement/DeletePlacementUseCase.ts`:

```ts
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";

export class DeletePlacementUseCase {
  constructor(private readonly repo: PlacementRepository) {}

  async execute(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
```

- [ ] **Step 4: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
— `beforeEach`/`vi.resetModules()` desde já (mesmo fix aplicado ao
`MockPackageRepository` no plano 8, pro array mutável a nível de módulo
não vazar estado entre testes):

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
      role: null,
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
      role: null,
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
      role: null,
      order: 50,
    });
    await expect(
      repo.create({
        photoId: "exemplo-gestante-01",
        surface: "hero",
        refId: null,
        role: null,
        order: 50,
      }),
    ).rejects.toThrow(/já existe/i);
  });

  it("atualiza photoId/role sem afetar surface/refId/order", async () => {
    const repo = new MockPlacementRepository();
    const created = await repo.create({
      photoId: "exemplo-retrato-01",
      surface: "home-gallery",
      refId: null,
      role: "galeria",
      order: 50,
    });
    const updated = await repo.update(created.id, {
      photoId: "exemplo-evento-01",
      role: "destaque",
    });
    expect(updated.photoId).toBe("exemplo-evento-01");
    expect(updated.role).toBe("destaque");
    expect(updated.surface).toBe("home-gallery");
    expect(updated.order).toBe(50);
  });

  it("remove por id", async () => {
    const repo = new MockPlacementRepository();
    const created = await repo.create({
      photoId: "exemplo-retrato-01",
      surface: "hero",
      refId: null,
      role: null,
      order: 77,
    });
    await repo.delete(created.id);
    const all = await repo.findAll();
    expect(all.find((p) => p.id === created.id)).toBeUndefined();
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 6: Implementar o repositório mock**

Create `src/api/infrastructure/repositories/mock/MockPlacementRepository.ts`
— conjunto sintético pequeno cobrindo as superfícies mais comuns, sem
tentar espelhar os placements reais (mesmo espírito de
`MockPhotoRepository`, plano 9):

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";

function id(surface: Placement["surface"], refId: string | null, order: number): string {
  return `${surface}-${refId ?? "none"}-${order}`;
}

function placement(p: Omit<Placement, "id">): Placement {
  return { id: id(p.surface, p.refId, p.order), ...p };
}

// Conjunto pequeno e sintético — sem tentar espelhar os placements
// reais (mesmo espírito do MockPhotoRepository, plano 9).
let PLACEMENTS: Placement[] = [
  placement({
    photoId: "exemplo-retrato-01",
    surface: "hero",
    refId: null,
    role: null,
    order: 0,
  }),
  placement({
    photoId: "exemplo-evento-01",
    surface: "quem-sou",
    refId: null,
    role: "capa",
    order: 0,
  }),
  placement({
    photoId: "exemplo-gestante-01",
    surface: "home-gallery",
    refId: null,
    role: "galeria",
    order: 0,
  }),
  placement({
    photoId: "exemplo-retrato-01",
    surface: "niche",
    refId: "gestante",
    role: null,
    order: 0,
  }),
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

  async update(id: string, data: Partial<Pick<Placement, "photoId" | "role">>): Promise<Placement> {
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

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPlacementRepository.test.ts`
Expected: PASS — 6 testes.

- [ ] **Step 8: Testes dos casos de uso, contra o mock**

Create `src/api/application/placement/GetPlacementsUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { GetPlacementsUseCase } from "./GetPlacementsUseCase";

describe("GetPlacementsUseCase", () => {
  it("retorna os placements do repositório", async () => {
    const placements = await new GetPlacementsUseCase(new MockPlacementRepository()).execute();
    expect(placements.length).toBeGreaterThan(0);
  });
});
```

Create `src/api/application/placement/CreatePlacementUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { CreatePlacementUseCase } from "./CreatePlacementUseCase";

describe("CreatePlacementUseCase", () => {
  it("cria um placement em niche com refId", async () => {
    const placement = await new CreatePlacementUseCase(new MockPlacementRepository()).execute({
      photoId: "exemplo-retrato-01",
      surface: "niche",
      refId: "familia",
      role: null,
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
        role: null,
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
        role: null,
        order: 10,
      }),
    ).rejects.toThrow(/exige um refId/i);
  });
});
```

Create `src/api/application/placement/UpdatePlacementUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { UpdatePlacementUseCase } from "./UpdatePlacementUseCase";

describe("UpdatePlacementUseCase", () => {
  it("atualiza role de um placement existente", async () => {
    const repo = new MockPlacementRepository();
    const all = await repo.findAll();
    const target = all[0];
    const updated = await new UpdatePlacementUseCase(repo).execute(target.id, {
      role: "novo-role",
    });
    expect(updated.role).toBe("novo-role");
  });
});
```

Create `src/api/application/placement/DeletePlacementUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { GetPlacementsUseCase } from "./GetPlacementsUseCase";
import { DeletePlacementUseCase } from "./DeletePlacementUseCase";

describe("DeletePlacementUseCase", () => {
  it("remove o placement", async () => {
    const repo = new MockPlacementRepository();
    const before = await new GetPlacementsUseCase(repo).execute();
    await new DeletePlacementUseCase(repo).execute(before[0].id);
    const after = await new GetPlacementsUseCase(repo).execute();
    expect(after.find((p) => p.id === before[0].id)).toBeUndefined();
  });
});
```

- [ ] **Step 9: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros — `RepositoryFactory.ts` ainda não referencia
`PlacementRepositoryImpl` (Task 2), nada quebra por enquanto; os 13
testes novos desta task passam (6 do mock + 1 de getPlacements + 3 de
create + 1 de update + 1 de delete, mais o teste de refId inválido em
hero).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(placement): domínio, DTO, casos de uso e repositório mock

ID do documento é determinístico: \`\${surface}-\${refId ?? \"none\"}-\${order}\`
— mesmo formato do script de migração do app-photo. create() rejeita
slot duplicado (mesmo ID) em vez de sobrescrever. NULL_REF_SURFACES
vive uma única vez em Placement.ts, importada pelo caso de uso e
(Task 4) pelo formulário da UI."
```

---

### Task 2: `PlacementRepositoryImpl` (Firestore) + `RepositoryFactory`

**Files:**

- Create: `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`

**Interfaces:**

- Produces: `class PlacementRepositoryImpl implements PlacementRepository`,
  `RepositoryFactory.placements(): PlacementRepository`.

- [ ] **Step 1: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`:

```ts
import type { Placement } from "@/api/domain/placement/Placement";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import { getAdminDb } from "@/api/infrastructure/firebase/admin";

const COLLECTION = "placements";

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
    role: data.role ?? null,
    order: data.order,
  };
}

function computeId(surface: Placement["surface"], refId: string | null, order: number): string {
  return `${surface}-${refId ?? "none"}-${order}`;
}

// ID determinístico: mesma checagem de slot duplicado do mock (Task 1)
// — .doc(id).get() antes do .set() é o próprio "já existe um placement
// nesse slot?", porque o slot É o ID.
export class PlacementRepositoryImpl implements PlacementRepository {
  async findAll(): Promise<Placement[]> {
    const snapshot = await getAdminDb().collection(COLLECTION).get();
    return snapshot.docs.map(toPlacement);
  }

  async create(data: Omit<Placement, "id">): Promise<Placement> {
    const id = computeId(data.surface, data.refId, data.order);
    const existing = await getAdminDb().collection(COLLECTION).doc(id).get();
    if (existing.exists) {
      throw new Error(
        `Já existe um placement em "${data.surface}"/"${data.refId}"/ordem ${data.order}.`,
      );
    }
    await getAdminDb().collection(COLLECTION).doc(id).set(data);
    return { id, ...data };
  }

  async update(id: string, data: Partial<Pick<Placement, "photoId" | "role">>): Promise<Placement> {
    await getAdminDb().collection(COLLECTION).doc(id).update(data);
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    if (!doc.exists) throw new Error(`Placement "${id}" não encontrado depois de atualizar.`);
    return toPlacement(doc);
  }

  async delete(id: string): Promise<void> {
    await getAdminDb().collection(COLLECTION).doc(id).delete();
  }
}
```

- [ ] **Step 2: `RepositoryFactory` ganha `placements()`**

Modify `src/api/infrastructure/repositories/RepositoryFactory.ts` —
adiciona os imports de `PlacementRepository`/`PlacementRepositoryImpl`/
`MockPlacementRepository` e a entrada `placements` no objeto final:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import { env } from "@/config/env.server";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { PackageRepositoryImpl } from "./PackageRepositoryImpl";
import { PhotoRepositoryImpl } from "./PhotoRepositoryImpl";
import { PlacementRepositoryImpl } from "./PlacementRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";
import { MockPackageRepository } from "./mock/MockPackageRepository";
import { MockPhotoRepository } from "./mock/MockPhotoRepository";
import { MockPlacementRepository } from "./mock/MockPlacementRepository";

function hasFirebaseCredentials(): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

function isProductionRuntime(): boolean {
  return env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD;
}

function shouldUseMock(): boolean {
  if (isProductionRuntime()) return false;
  return !hasFirebaseCredentials();
}

export const RepositoryFactory = {
  niches: (): NicheRepository =>
    shouldUseMock() ? new MockNicheRepository() : new NicheRepositoryImpl(),
  packages: (): PackageRepository =>
    shouldUseMock() ? new MockPackageRepository() : new PackageRepositoryImpl(),
  photos: (): PhotoRepository =>
    shouldUseMock() ? new MockPhotoRepository() : new PhotoRepositoryImpl(),
  placements: (): PlacementRepository =>
    shouldUseMock() ? new MockPlacementRepository() : new PlacementRepositoryImpl(),
};
```

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(placement): repositório Firestore + RepositoryFactory.placements()

create() checa .doc(id).get() antes do .set() — o ID determinístico já
É a checagem de slot duplicado, mesma lógica do mock."
```

---

### Task 3: ViewModel e actions

**Files:**

- Create: `src/api/presentation/placement/PlacementViewModel.ts`
- Create: `src/actions/placements.ts`

**Interfaces:**

- Consumes: `assertSession` (plano 6), `callRevalidateWebhook` (plano
  7), `buildThumbnailUrl` (plano 9), `clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  (plano 9).
- Produces: `getPlacements(): Promise<PlacementViewModel[]>`,
  `createPlacement(data): Promise<PlacementViewModel>`,
  `updatePlacement(id, data): Promise<PlacementViewModel>`,
  `deletePlacement(id): Promise<void>` — todas exigem sessão.

- [ ] **Step 1: ViewModel**

Create `src/api/presentation/placement/PlacementViewModel.ts`:

```ts
import type { PlacementDTO } from "@/api/application/placement/PlacementDTO";
import { buildThumbnailUrl } from "@/api/infrastructure/cloudinary/buildThumbnailUrl";
import { clientEnv } from "@/config/env.client";

export interface PlacementViewModel extends PlacementDTO {
  thumbnailUrl: string;
  refIdLabel: string;
  // Campo sintético, sem valor de negócio — mesma técnica das demais
  // entidades: dá à DataTable uma key própria pra coluna de ações.
  actions: null;
}

export function toPlacementViewModel(dto: PlacementDTO): PlacementViewModel {
  const cloudName = clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return {
    ...dto,
    // photoId É o cloudinaryPublicId (Photo.id, plano 9) — sem
    // precisar buscar o documento Photo pra montar a miniatura.
    thumbnailUrl: cloudName ? buildThumbnailUrl(dto.photoId, cloudName) : "",
    refIdLabel: dto.refId ?? "—",
    actions: null,
  };
}
```

- [ ] **Step 2: Actions**

Create `src/actions/placements.ts`:

```ts
"use server";

import type { Placement } from "@/api/domain/placement/Placement";
import { GetPlacementsUseCase } from "@/api/application/placement/GetPlacementsUseCase";
import { CreatePlacementUseCase } from "@/api/application/placement/CreatePlacementUseCase";
import { UpdatePlacementUseCase } from "@/api/application/placement/UpdatePlacementUseCase";
import { DeletePlacementUseCase } from "@/api/application/placement/DeletePlacementUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import {
  toPlacementViewModel,
  type PlacementViewModel,
} from "@/api/presentation/placement/PlacementViewModel";
import { assertSession } from "@/lib/auth/session";
import { callRevalidateWebhook } from "./_lib/callRevalidateWebhook";

export async function getPlacements(): Promise<PlacementViewModel[]> {
  await assertSession();
  const placements = await new GetPlacementsUseCase(RepositoryFactory.placements()).execute();
  return placements.map(toPlacementViewModel);
}

export async function createPlacement(data: Omit<Placement, "id">): Promise<PlacementViewModel> {
  await assertSession();
  const placement = await new CreatePlacementUseCase(RepositoryFactory.placements()).execute(data);
  await callRevalidateWebhook("placements");
  return toPlacementViewModel(placement);
}

export async function updatePlacement(
  id: string,
  data: Partial<Pick<Placement, "photoId" | "role">>,
): Promise<PlacementViewModel> {
  await assertSession();
  const placement = await new UpdatePlacementUseCase(RepositoryFactory.placements()).execute(
    id,
    data,
  );
  await callRevalidateWebhook("placements");
  return toPlacementViewModel(placement);
}

export async function deletePlacement(id: string): Promise<void> {
  await assertSession();
  await new DeletePlacementUseCase(RepositoryFactory.placements()).execute(id);
  await callRevalidateWebhook("placements");
}
```

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(placement): ViewModel e actions com sessão + webhook

Mesmo padrão dos planos 7-8: assertSession() antes de cada caso de uso,
callRevalidateWebhook(\"placements\") depois de toda escrita. Miniatura
do ViewModel usa photoId direto (== cloudinaryPublicId), sem buscar o
documento Photo."
```

---

### Task 4: UI — lista, formulário condicional por superfície, criar/editar/remover

**Files:**

- Create: `src/app/placements/page.tsx`
- Create: `src/app/placements/_components/PlacementsManager.tsx`,
  `PlacementForm.tsx`, `NewPlacementModal.tsx`, `EditPlacementModal.tsx`

**Interfaces:**

- Consumes: `getPlacements`, `createPlacement`, `updatePlacement`,
  `deletePlacement` (Task 3), `getPhotos` (plano 9), `getNiches` (plano
  7), `getPackages` (plano 8), `NULL_REF_SURFACES` (Task 1),
  `DataTable`/`ConfirmationDialog`/`Dialog`/`Button`/`Input`/`Label`
  (copiados do Presencia, plano 6), `showToast`.

- [ ] **Step 1: Página (Server Component)**

Create `src/app/placements/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { getPlacements } from "@/actions/placements";
import { getPhotos } from "@/actions/photos";
import { getNiches } from "@/actions/niches";
import { getPackages } from "@/actions/packages";
import { PlacementsManager } from "./_components/PlacementsManager";

export default async function PlacementsPage() {
  const [placements, photos, niches, packages] = await Promise.all([
    getPlacements(),
    getPhotos(),
    getNiches(),
    getPackages(),
  ]);
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Posicionamentos</h1>
      <PlacementsManager
        initialPlacements={placements}
        photos={photos}
        niches={niches}
        packages={packages}
      />
    </main>
  );
}
```

- [ ] **Step 2: Formulário compartilhado — refId condicional por superfície**

Create `src/app/placements/_components/PlacementForm.tsx`:

```tsx
"use client";

import type { PhotoSurface } from "@/api/domain/placement/Placement";
import { NULL_REF_SURFACES } from "@/api/domain/placement/Placement";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import { Input } from "@/lib/_components/ui/input";
import { Label } from "@/lib/_components/ui/label";

const SURFACES: PhotoSurface[] = ["hero", "quem-sou", "home-gallery", "niche", "package"];

export interface PlacementFormValues {
  photoId: string;
  surface: PhotoSurface;
  refId: string;
  role: string;
  order: string;
}

export const EMPTY_PLACEMENT_FORM: PlacementFormValues = {
  photoId: "",
  surface: "hero",
  refId: "",
  role: "",
  order: "0",
};

export function PlacementForm({
  values,
  onChange,
  photos,
  niches,
  packages,
  identityEditable = true,
}: {
  values: PlacementFormValues;
  onChange: (values: PlacementFormValues) => void;
  photos: PhotoViewModel[];
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  identityEditable?: boolean;
}) {
  function set<K extends keyof PlacementFormValues>(key: K, value: PlacementFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const usesNullRef = NULL_REF_SURFACES.includes(values.surface);

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="photoId">Foto</Label>
        <select
          id="photoId"
          value={values.photoId}
          onChange={(e) => set("photoId", e.target.value)}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Selecione uma foto
          </option>
          {photos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.cloudinaryPublicId} ({p.dimensions})
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="surface">Superfície</Label>
        {identityEditable ? (
          <select
            id="surface"
            value={values.surface}
            onChange={(e) => {
              const surface = e.target.value as PhotoSurface;
              onChange({
                ...values,
                surface,
                refId: NULL_REF_SURFACES.includes(surface) ? "" : values.refId,
              });
            }}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          >
            {SURFACES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <Input id="surface" value={values.surface} disabled />
        )}
      </div>
      {!usesNullRef && (
        <div>
          <Label htmlFor="refId">{values.surface === "niche" ? "Nicho" : "Pacote"}</Label>
          {identityEditable ? (
            <select
              id="refId"
              value={values.refId}
              onChange={(e) => set("refId", e.target.value)}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="" disabled>
                {values.surface === "niche" ? "Selecione um nicho" : "Selecione um pacote"}
              </option>
              {values.surface === "niche"
                ? niches.map((n) => (
                    <option key={n.slug} value={n.slug}>
                      {n.title}
                    </option>
                  ))
                : packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
            </select>
          ) : (
            <Input id="refId" value={values.refId} disabled />
          )}
        </div>
      )}
      <div>
        <Label htmlFor="role">Papel (opcional)</Label>
        <Input
          id="role"
          value={values.role}
          onChange={(e) => set("role", e.target.value)}
          placeholder="ex.: capa, polaroid-1, destaque"
        />
      </div>
      <div>
        <Label htmlFor="order">Ordem</Label>
        {identityEditable ? (
          <Input
            id="order"
            type="number"
            value={values.order}
            onChange={(e) => set("order", e.target.value)}
          />
        ) : (
          <Input id="order" value={values.order} disabled />
        )}
      </div>
    </div>
  );
}

export function toCreatePayload(values: PlacementFormValues) {
  return {
    photoId: values.photoId,
    surface: values.surface,
    refId: NULL_REF_SURFACES.includes(values.surface) ? null : values.refId,
    role: values.role.trim() ? values.role.trim() : null,
    order: Number(values.order) || 0,
  };
}

export function fromPlacement(placement: {
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  role: string | null;
  order: number;
}): PlacementFormValues {
  return {
    photoId: placement.photoId,
    surface: placement.surface,
    refId: placement.refId ?? "",
    role: placement.role ?? "",
    order: String(placement.order),
  };
}
```

(`identityEditable` desliga `surface`/`refId`/`order` no formulário de
edição — mesma técnica de `slugEditable`/`nicheSlugEditable` dos planos
7-8, aqui cobrindo três campos de identidade em vez de um só.)

- [ ] **Step 3: Modal de criar**

Create `src/app/placements/_components/NewPlacementModal.tsx`:

```tsx
"use client";

import { createPlacement } from "@/actions/placements";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { Button } from "@/lib/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { showToast } from "@/lib/_utils/toast";
import { useState, useTransition } from "react";
import {
  EMPTY_PLACEMENT_FORM,
  PlacementForm,
  toCreatePayload,
  type PlacementFormValues,
} from "./PlacementForm";

export function NewPlacementModal({
  open,
  onOpenChange,
  photos,
  niches,
  packages,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: PhotoViewModel[];
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  onCreated: (placement: PlacementViewModel) => void;
}) {
  const [values, setValues] = useState<PlacementFormValues>(EMPTY_PLACEMENT_FORM);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const placement = await createPlacement(toCreatePayload(values));
        showToast({ message: "Posicionamento criado.", variant: "success" });
        onCreated(placement);
        setValues(EMPTY_PLACEMENT_FORM);
        onOpenChange(false);
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Falha ao criar posicionamento.",
          variant: "error",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo posicionamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlacementForm
            values={values}
            onChange={setValues}
            photos={photos}
            niches={niches}
            packages={packages}
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Criando…" : "Criar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Modal de editar**

Create `src/app/placements/_components/EditPlacementModal.tsx` — mesma
forma do `NewPlacementModal`, com `identityEditable={false}` e
chamando `updatePlacement(id, {photoId, role})`:

```tsx
"use client";

import { updatePlacement } from "@/actions/placements";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { Button } from "@/lib/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { showToast } from "@/lib/_utils/toast";
import { useEffect, useState, useTransition } from "react";
import {
  fromPlacement,
  PlacementForm,
  toCreatePayload,
  type PlacementFormValues,
} from "./PlacementForm";

export function EditPlacementModal({
  placement,
  open,
  onOpenChange,
  photos,
  niches,
  packages,
  onUpdated,
}: {
  placement: PlacementViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: PhotoViewModel[];
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  onUpdated: (placement: PlacementViewModel) => void;
}) {
  const [values, setValues] = useState<PlacementFormValues | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (placement) setValues(fromPlacement(placement));
  }, [placement]);

  if (!placement || !values) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!placement || !values) return;
    const payload = toCreatePayload(values);
    startTransition(async () => {
      try {
        const updated = await updatePlacement(placement.id, {
          photoId: payload.photoId,
          role: payload.role,
        });
        showToast({ message: "Posicionamento atualizado.", variant: "success" });
        onUpdated(updated);
        onOpenChange(false);
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Falha ao atualizar posicionamento.",
          variant: "error",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar posicionamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlacementForm
            values={values}
            onChange={setValues}
            photos={photos}
            niches={niches}
            packages={packages}
            identityEditable={false}
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Gerenciador (lista + orquestra os modais)**

Create `src/app/placements/_components/PlacementsManager.tsx`:

```tsx
"use client";

import { deletePlacement } from "@/actions/placements";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { Button } from "@/lib/_components/ui/button";
import { ConfirmationDialog } from "@/lib/_components/ui/confirmation-dialog";
import { DataTable, type DataTableColumn } from "@/lib/_components/ui/data-table";
import { showToast } from "@/lib/_utils/toast";
import { useState } from "react";
import { EditPlacementModal } from "./EditPlacementModal";
import { NewPlacementModal } from "./NewPlacementModal";

export function PlacementsManager({
  initialPlacements,
  photos,
  niches,
  packages,
}: {
  initialPlacements: PlacementViewModel[];
  photos: PhotoViewModel[];
  niches: NicheViewModel[];
  packages: PackageViewModel[];
}) {
  const [placements, setPlacements] = useState(initialPlacements);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editing, setEditing] = useState<PlacementViewModel | null>(null);
  const [deleting, setDeleting] = useState<PlacementViewModel | null>(null);

  const columns: DataTableColumn<PlacementViewModel>[] = [
    {
      key: "thumbnailUrl",
      header: "",
      render: (value) =>
        value ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura vinda do Cloudinary, next/image exigiria configurar remotePatterns só pra 120px de preview
          <img src={String(value)} alt="" className="h-12 w-12 rounded object-cover" />
        ) : null,
    },
    { key: "surface", header: "Superfície", sortable: true, filterable: true },
    { key: "refIdLabel", header: "Ref." },
    { key: "role", header: "Papel" },
    { key: "order", header: "Ordem", sortable: true },
    {
      key: "actions",
      header: "",
      render: (_value, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDeleting(row);
          }}
          className="text-destructive text-sm hover:underline"
        >
          Remover
        </button>
      ),
    },
  ];

  async function handleDelete() {
    if (!deleting) return;
    await deletePlacement(deleting.id);
    setPlacements((current) => current.filter((p) => p.id !== deleting.id));
    showToast({ message: "Posicionamento removido.", variant: "success" });
  }

  return (
    <>
      <DataTable
        data={placements}
        columns={columns}
        headerAction={<Button onClick={() => setIsNewOpen(true)}>Novo posicionamento</Button>}
        onRowClick={(row) => setEditing(row)}
      />

      <NewPlacementModal
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        photos={photos}
        niches={niches}
        packages={packages}
        onCreated={(placement) => setPlacements((current) => [...current, placement])}
      />

      <EditPlacementModal
        placement={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        photos={photos}
        niches={niches}
        packages={packages}
        onUpdated={(updated) =>
          setPlacements((current) => current.map((p) => (p.id === updated.id ? updated : p)))
        }
      />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover posicionamento"
        description={`Remover a foto de "${deleting?.surface}"? Esta ação não pode ser desfeita.`}
        variant="destructive"
        confirmLabel="Remover"
        onConfirm={handleDelete}
      />
    </>
  );
}
```

- [ ] **Step 6: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: sem erros.

- [ ] **Step 7: Smoke test manual (precisa de credenciais reais do Firebase/Cloudinary)**

Documentar aqui, não executar sem credenciais: logar, abrir
`/placements`, criar um posicionamento em `niche` (confirma que o
seletor de nicho aparece e o de superfícies "sem refId" não força um),
criar um em `hero` (confirma que nenhum seletor de refId aparece),
tentar criar dois no mesmo slot (mesma superfície/refId/ordem — confirma
que a segunda tentativa falha com a mensagem "já existe"), editar
photoId/role de um existente (confirma que superfície/refId/ordem
aparecem travados), remover um — depois abrir o `app-photo` (plano 5)
e confirmar que a foto aparece na superfície certa.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(placement): UI de lista, criação, edição e remoção

Formulário troca o seletor de refId conforme a superfície escolhida
(nicho, pacote, ou nenhum) — mesma lista NULL_REF_SURFACES do domínio,
sem duplicar a regra na UI. identityEditable desliga
surface/refId/order na edição (só photoId/role mudam)."
```

---

### Task 5: `app-photo` — leitura pública ganha a tag `"placements"` + índices compostos

**Files:**

- Modify: `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`
  (`app-photo`)
- Modify: `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`
  (`app-photo`)
- Modify: `firestore.indexes.json` (`app-photo`)

**Interfaces:**

- Consumes: `unstable_cache` (`next/cache`).
- Produces: mesma interface pública de sempre — `findBySurface`/
  `findByIds` — agora cacheadas com tag `"placements"`.

- [ ] **Step 1: Envolver `PlacementRepositoryImpl.findBySurface` em `unstable_cache`**

Replace `src/api/infrastructure/repositories/PlacementRepositoryImpl.ts`:

```ts
import type { Placement, PhotoSurface } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import { unstable_cache } from "next/cache";
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

// where(surface) [+ where(refId)] + orderBy(order) — duas formas de
// query diferentes (com e sem refId), cada uma com seu próprio índice
// composto em firestore.indexes.json (Task 5, Step 3). unstable_cache
// dá tag pra ambas via uma única função — a chave inclui o valor de
// refId, então "com" e "sem" refId nunca colidem no cache.
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

export class PlacementRepositoryImpl implements PlacementRepository {
  findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]> {
    return findPlacementsBySurface(surface, opts?.refId);
  }
}
```

- [ ] **Step 2: Envolver `PhotoRepositoryImpl.findByIds` em `unstable_cache`**

Replace `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`:

```ts
import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { FieldPath } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/config/env.server";
import { buildDeliveryUrl } from "../cloudinary/buildDeliveryUrl";
import { db } from "../firebase/admin";

const COLLECTION = "photos";

// Firestore recusa `in` com array vazio, e limita a 30 valores — a maior
// galeria real de nicho tem 20 fotos (retratos-profissionais), nenhuma
// superfície passa do limite (ver spec, "Contrato Firestore de
// produção"). Mesma tag "placements" do PlacementRepositoryImpl — Photo
// não muda depois de criada (plano 9, sem update), então cachear aqui é
// só performance; a tag compartilhada existe pra invalidar as duas
// leituras juntas com um webhook só, não por necessidade de
// correção (uma lista de IDs nova já é uma chave de cache nova sozinha).
const findPhotosByIds = unstable_cache(
  async (ids: string[]): Promise<Photo[]> => {
    if (ids.length === 0) return [];
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new Error(
        "CLOUDINARY_CLOUD_NAME não configurado — necessário pra resolver fotos reais do Firestore.",
      );
    }
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const snapshot = await db.collection(COLLECTION).where(FieldPath.documentId(), "in", ids).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        src: buildDeliveryUrl(data.cloudinaryPublicId, cloudName),
        width: data.width,
        height: data.height,
        blurDataURL: data.blurDataURL,
      };
    });
  },
  ["photos", "findByIds"],
  { tags: ["placements"] },
);

export class PhotoRepositoryImpl implements PhotoRepository {
  findByIds(ids: string[]): Promise<Photo[]> {
    return findPhotosByIds(ids);
  }
}
```

- [ ] **Step 3: Dois índices compostos novos em `firestore.indexes.json`**

Modify `firestore.indexes.json` — soma-se ao índice de `packages` já
existente (plano 8):

```json
{
  "indexes": [
    {
      "collectionGroup": "packages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "nicheSlug", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "placements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "surface", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "placements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "surface", "order": "ASCENDING" },
        { "fieldPath": "refId", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

(O primeiro índice novo cobre `getGalleryPhotos()`/`getHeroPhotos()`/
`getAboutPhotos()` — `where(surface) + orderBy(order)`, sem `refId`. O
segundo cobre `niches.ts` — `where(surface) + where(refId) +
orderBy(order)`. Firestore não deixa uma query de 2 campos ser servida
por um índice de 3 campos quando o campo do meio, `refId`, fica de fora
do filtro — por isso os dois índices, não um só.)

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros — `MockPlacementRepository`/`MockPhotoRepository` e
seus testes (planos 1, 3) continuam passando sem alteração (mocks não
mudam, só as implementações reais ganham a camada de cache por cima).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(placement): leitura pública ganha cache com tag \"placements\"

unstable_cache envolve findBySurface (PlacementRepositoryImpl) e
findByIds (PhotoRepositoryImpl) com a mesma tag — invalidados juntos
pelo webhook do admin. Dois índices compostos novos em
firestore.indexes.json: (surface, order) pra queries sem refId, e
(surface, refId, order) pra queries com refId — um índice de 3 campos
não cobre sozinho uma query de 2 campos que pula o campo do meio."
```

---

### Task 6: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa em `admin-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY FIREBASE_WEB_API_KEY=dummy-key npm run build`
Expected: sem erros.

- [ ] **Step 2: Suíte completa em `app-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros.

- [ ] **Step 3: Smoke test manual completo (precisa de credenciais reais)**

Documentar aqui, não executar sem credenciais: com Firebase e
Cloudinary reais configurados, e os dois índices compostos de
`placements` publicados (`firebase deploy --only firestore:indexes`),
repetir o fluxo completo — subir uma foto no admin (plano 9), criar um
placement pra ela numa superfície real (ex.: `niche`/`gestante`),
confirmar que ela aparece na página do nicho no `app-photo` sem
reiniciar o servidor, depois editá-la (trocar o `role`) e removê-la,
confirmando que o site público reflete cada mudança.

- [ ] **Step 4: Commit final (se sobrou algo solto) em cada repo**

```bash
git -C /Users/cesarpisa/Projects/lp-fotografia/admin-photo status --short
git -C /Users/cesarpisa/Projects/lp-fotografia/app-photo status --short
# se houver pendências em qualquer um, git add -A && git commit -m "..."
# app-photo: push fica a critério do usuário (branch feat/nicho-firestore
# já tem PR #2 aberta); admin-photo continua só local.
```

---

## Depois deste plano

`niche`, `package`, `photo` e `placement` têm CRUD completo no admin —
o site público consegue ser inteiramente reconfigurado por ele agora.
Falta:

- **Plano 11** — CRUD de `profile` (singleton, só `get`/`update`, sem
  lista nem delete — primeira tela do admin sem `DataTable` nenhuma) +
  deploy real (rodar os dois serviços na VPS pela primeira vez,
  publicar os índices do Firestore criados nos planos 8 e 10 via
  `firebase deploy --only firestore:indexes`, apontar `.firebaserc` pro
  projeto Firebase real em vez do placeholder do plano 6).
