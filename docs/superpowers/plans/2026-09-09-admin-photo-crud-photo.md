# admin-photo — CRUD de Photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Terceira entidade de conteúdo do admin — upload de foto direto do
browser pro Cloudinary (preset unsigned), gravação do `Photo` no Firestore,
listagem com preview e remoção (que também apaga o asset no Cloudinary,
via chamada assinada). **Sem anexar fotos a superfícies do site ainda** —
isso é `Placement`, escopo do plano 10 (decisão explícita: dividir em dois
planos, dado que a spec já sinaliza `Placement` como a peça mais nova e
sem precedente direto nos repos-irmãos).

**Architecture:** Diferente de `Niche`/`Package`, o upload do arquivo em
si **não passa pelo servidor do admin** — o browser sobe direto pro
Cloudinary com um preset unsigned (`fetch` cliente para
`api.cloudinary.com`), e só depois chama uma Server Action
(`createPhoto`) com o resultado (`public_id`, `width`, `height`) pra
gravar o documento `Photo` no Firestore. A geração do `blurDataURL`
(transformação Cloudinary de 16px, base64) acontece dentro dessa Server
Action, no servidor — nunca no browser. Remoção coordena dois sistemas:
apaga o documento do Firestore primeiro, depois tenta apagar o asset no
Cloudinary (best-effort, como o webhook de revalidação — a exclusão já
"aconteceu" do ponto de vista do usuário assim que o Firestore reflete
isso; falha em limpar o Cloudinary vira um asset órfão, não uma foto
quebrada no site).

**Tech Stack:** Mesmo dos planos 6-8. Sem novas dependências — upload
usa `fetch`/`FormData` nativos do browser, assinatura usa
`node:crypto` (já usado em `firebase-admin`, nenhuma lib nova).

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
(seções "Modelo de conteúdo" — `Photo`, "Fotos (Cloudinary)", "Contrato
Firestore de produção" — `photos/{id}`)
**Plano anterior:** `2026-09-09-admin-photo-crud-package.md` (8/10).
**Precedentes investigados:**
`app-photo/src/api/domain/photo/Photo.ts`,
`PhotoRepositoryImpl.ts`, `cloudinary/buildDeliveryUrl.ts`,
`next-image-loader.ts` (convenção de transformação
`f_auto,q_<q>,w_<width>`); `scripts/migration/cloudinaryUpload.ts`
(algoritmo de assinatura sha1 do Cloudinary, usado aqui só como
referência de algoritmo — sem código compartilhado entre os repos).

## Global Constraints

- **Desvio deliberado da spec: delete do Cloudinary vai por Server
  Action, não por route handler.** A seção "Fotos (Cloudinary)" da spec
  descreve o delete como "uma route handler assinada, igual ao
  `app/api/cloudinary-delete` do Presencia" — mas esse arquivo foi
  removido do `admin-photo` durante o bootstrap (plano 6, órfão sem
  nenhuma entidade de foto ainda) e seu conteúdo real não está acessível
  neste ambiente pra copiar fielmente. Toda escrita em `Niche`/`Package`
  já usa Server Actions com `assertSession()` (não route handlers) — a
  API secret do Cloudinary fica igualmente protegida (nunca chega ao
  client) em qualquer uma das duas formas, então este plano segue o
  padrão já estabelecido no repo em vez de introduzir uma segunda forma
  de proteger uma escrita. Ver Task 3.
- **`Photo` não tem `update`** — só `findAll`, `create`, `delete`. Não
  existe campo de texto pra editar (nome, descrição); a única forma de
  "trocar" uma foto é remover e subir outra. Adicionar um método sem
  consumidor real violaria YAGNI.
- **`id` do documento é o próprio `cloudinaryPublicId`** — igual o
  `slug` de `Niche` (chave natural, não gerada). O Cloudinary já garante
  unicidade do `public_id` na resposta do upload.
- **Contrato Firestore de `photos/{id}`** (fonte: spec, seção "Contrato
  Firestore de produção"): `{ cloudinaryPublicId, width, height,
blurDataURL }` — sem `alt` nem `createdAt` (a seção "Modelo de
  conteúdo" da spec lista esses dois campos, mas a seção "Contrato
  Firestore de produção" é explicitamente a autoritativa quando as duas
  divergem, e os planos 3-5 do `app-photo` já confirmaram que nada
  consome `alt` hoje).
- **Delete apaga Firestore primeiro, Cloudinary depois (best-effort)** —
  ordem deliberada: se o delete do Cloudinary falhar depois do Firestore
  já ter sido limpo, sobra um asset órfão no Cloudinary (vazamento de
  armazenamento, inofensivo). Se fosse ao contrário — Cloudinary
  primeiro — uma falha no delete do Firestore deixaria um documento
  apontando pra um asset que não existe mais, quebrando qualquer preview
  que ainda o referencie.
- **Credenciais do Cloudinary são independentes das do Firebase** —
  `RepositoryFactory.photos()` continua decidindo mock vs. real só pelas
  credenciais do Firebase (mesmo `shouldUseMock()` de sempre); a chamada
  de delete do Cloudinary dentro do `PhotoRepositoryImpl` real checa
  suas _próprias_ credenciais (`CLOUDINARY_API_KEY`/`_API_SECRET`)
  separadamente e vira best-effort (loga aviso, não lança) se ausentes —
  mesmo padrão do `callRevalidateWebhook`.
- **Nenhuma mudança no `app-photo` neste plano** — `Photo` sozinho não é
  visível em nenhuma superfície do site sem um `Placement` apontando pra
  ele (plano 10). `PhotoRepositoryImpl.findByIds` do `app-photo` ganha
  `unstable_cache` só no plano 10, junto com a tag que o webhook de
  `Placement` de fato invalida — ver "Depois deste plano".
- **Pré-requisito externo, fora do alcance deste plano:** o preset
  unsigned do Cloudinary (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`) precisa
  existir de verdade no painel do Cloudinary antes do upload funcionar
  em produção — isso é configuração externa (conta do Cloudinary), não
  algo que este plano cria.

---

## Mapa de arquivos

**Criar (em `admin-photo`):**

- `src/api/domain/photo/Photo.ts`, `PhotoRepository.ts`
- `src/api/application/photo/PhotoDTO.ts`, `GetPhotosUseCase.ts`,
  `CreatePhotoUseCase.ts`, `DeletePhotoUseCase.ts` (+ `.test.ts` de
  cada)
- `src/api/presentation/photo/PhotoViewModel.ts`
- `src/api/infrastructure/cloudinary/signParams.ts`,
  `deleteCloudinaryAsset.ts`, `fetchBlurDataURL.ts`,
  `buildThumbnailUrl.ts` (+ `.test.ts` dos três primeiros)
- `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`
- `src/api/infrastructure/repositories/mock/MockPhotoRepository.ts` (+
  `.test.ts`)
- `src/actions/photos.ts`
- `src/app/photos/page.tsx`
- `src/app/photos/_components/PhotosManager.tsx`,
  `UploadPhotoModal.tsx`
- `src/app/photos/_lib/uploadToCloudinary.ts`

**Modificar (em `admin-photo`):**

- `src/config/env.client.ts` — ganha `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `src/config/env.server.ts` — ganha `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`
- `src/api/infrastructure/repositories/RepositoryFactory.ts` — ganha
  `photos()`
- `.env.example`

**`app-photo`: nenhuma mudança neste plano.**

---

### Task 1: Domínio, DTO, casos de uso e repositório mock de Photo

**Files:**

- Create: `src/api/domain/photo/Photo.ts`, `PhotoRepository.ts`
- Create: `src/api/application/photo/PhotoDTO.ts`
- Create: `src/api/application/photo/GetPhotosUseCase.ts`,
  `CreatePhotoUseCase.ts`, `DeletePhotoUseCase.ts` (+ `.test.ts` de
  cada)
- Create: `src/api/infrastructure/repositories/mock/MockPhotoRepository.ts`
  (+ `.test.ts`)

**Interfaces:**

- Produces: `interface Photo { id, cloudinaryPublicId, width, height,
blurDataURL }`, `interface PhotoRepository { findAll(): Promise<Photo[]>;
create(data: Omit<Photo, "id">): Promise<Photo>; delete(id):
Promise<void> }`, `PhotoDTO` (idêntica a `Photo`), `class
Get/Create/DeletePhotoUseCase`.

- [ ] **Step 1: Entidade e contrato de repositório**

Create `src/api/domain/photo/Photo.ts`:

```ts
export interface Photo {
  id: string;
  cloudinaryPublicId: string;
  width: number;
  height: number;
  blurDataURL: string;
}
```

Create `src/api/domain/photo/PhotoRepository.ts`:

```ts
import type { Photo } from "./Photo";

export interface PhotoRepository {
  findAll(): Promise<Photo[]>;
  create(data: Omit<Photo, "id">): Promise<Photo>;
  delete(id: string): Promise<void>;
}
```

(`create` recebe `Omit<Photo, "id">` — o `id` do documento é sempre o
próprio `cloudinaryPublicId`, calculado dentro da implementação a partir
de `data.cloudinaryPublicId`, igual `Niche` usa `data.slug`. Sem
`findById`/`update`: nada na UI precisa — a lista completa alimenta a
tabela, e não existe formulário de edição pra essa entidade.)

- [ ] **Step 2: DTO e caso de uso de leitura**

Create `src/api/application/photo/PhotoDTO.ts`:

```ts
export interface PhotoDTO {
  id: string;
  cloudinaryPublicId: string;
  width: number;
  height: number;
  blurDataURL: string;
}
```

Create `src/api/application/photo/GetPhotosUseCase.ts`:

```ts
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type { PhotoDTO } from "./PhotoDTO";

export class GetPhotosUseCase {
  constructor(private readonly repo: PhotoRepository) {}

  async execute(): Promise<PhotoDTO[]> {
    const photos = await this.repo.findAll();
    return photos.map((p) => ({ ...p }));
  }
}
```

- [ ] **Step 3: Casos de uso de escrita**

Create `src/api/application/photo/CreatePhotoUseCase.ts`:

```ts
import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type { PhotoDTO } from "./PhotoDTO";

export class CreatePhotoUseCase {
  constructor(private readonly repo: PhotoRepository) {}

  async execute(data: Omit<Photo, "id">): Promise<PhotoDTO> {
    const photo = await this.repo.create(data);
    return { ...photo };
  }
}
```

Create `src/api/application/photo/DeletePhotoUseCase.ts`:

```ts
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";

export class DeletePhotoUseCase {
  constructor(private readonly repo: PhotoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
```

- [ ] **Step 4: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockPhotoRepository.test.ts`
— `beforeEach`/`vi.resetModules()` desde já, mesmo fix aplicado ao
`MockPackageRepository` no plano 8 (evita vazamento de estado entre
testes de um array mutável a nível de módulo):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockPhotoRepository as MockPhotoRepositoryClass } from "./MockPhotoRepository";

let MockPhotoRepository: typeof MockPhotoRepositoryClass;

beforeEach(async () => {
  vi.resetModules();
  ({ MockPhotoRepository } = await import("./MockPhotoRepository"));
});

describe("MockPhotoRepository", () => {
  it("lista todas as fotos sintéticas", async () => {
    const repo = new MockPhotoRepository();
    const all = await repo.findAll();
    expect(all.length).toBeGreaterThan(0);
  });

  it("lista ordenada por id", async () => {
    const repo = new MockPhotoRepository();
    const all = await repo.findAll();
    const ids = all.map((p) => p.id);
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
  });

  it("cria uma foto usando cloudinaryPublicId como id", async () => {
    const repo = new MockPhotoRepository();
    const created = await repo.create({
      cloudinaryPublicId: "teste-123",
      width: 800,
      height: 600,
      blurDataURL: "data:image/webp;base64,AA",
    });
    expect(created.id).toBe("teste-123");
    const all = await repo.findAll();
    expect(all.find((p) => p.id === "teste-123")).toBeDefined();
  });

  it("remove por id", async () => {
    const repo = new MockPhotoRepository();
    const all = await repo.findAll();
    const targetId = all[0].id;
    await repo.delete(targetId);
    const after = await repo.findAll();
    expect(after.find((p) => p.id === targetId)).toBeUndefined();
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPhotoRepository.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 6: Implementar o repositório mock**

Create `src/api/infrastructure/repositories/mock/MockPhotoRepository.ts`
— conjunto pequeno e sintético (não tenta espelhar fotos reais, mesmo
espírito do `MockPhotoRepository` do `app-photo`, plano 1):

```ts
import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";

// Conjunto pequeno e sintético — sem tentar espelhar fotos reais
// (mesmo espírito do MockPhotoRepository do app-photo, plano 1).
let PHOTOS: Photo[] = [
  {
    id: "exemplo-retrato-01",
    cloudinaryPublicId: "exemplo-retrato-01",
    width: 1600,
    height: 1067,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "exemplo-gestante-01",
    cloudinaryPublicId: "exemplo-gestante-01",
    width: 1200,
    height: 1600,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "exemplo-evento-01",
    cloudinaryPublicId: "exemplo-evento-01",
    width: 1600,
    height: 1200,
    blurDataURL: "data:image/webp;base64,AA",
  },
];

export class MockPhotoRepository implements PhotoRepository {
  async findAll(): Promise<Photo[]> {
    return [...PHOTOS].sort((a, b) => a.id.localeCompare(b.id));
  }

  async create(data: Omit<Photo, "id">): Promise<Photo> {
    const photo: Photo = { id: data.cloudinaryPublicId, ...data };
    PHOTOS = [...PHOTOS, photo];
    return photo;
  }

  async delete(id: string): Promise<void> {
    PHOTOS = PHOTOS.filter((p) => p.id !== id);
  }
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPhotoRepository.test.ts`
Expected: PASS — 4 testes.

- [ ] **Step 8: Testes dos casos de uso, contra o mock**

Create `src/api/application/photo/GetPhotosUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPhotoRepository } from "@/api/infrastructure/repositories/mock/MockPhotoRepository";
import { GetPhotosUseCase } from "./GetPhotosUseCase";

describe("GetPhotosUseCase", () => {
  it("retorna as fotos do repositório", async () => {
    const photos = await new GetPhotosUseCase(new MockPhotoRepository()).execute();
    expect(photos.length).toBeGreaterThan(0);
  });
});
```

Create `src/api/application/photo/CreatePhotoUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPhotoRepository } from "@/api/infrastructure/repositories/mock/MockPhotoRepository";
import { CreatePhotoUseCase } from "./CreatePhotoUseCase";

describe("CreatePhotoUseCase", () => {
  it("cria uma foto", async () => {
    const photo = await new CreatePhotoUseCase(new MockPhotoRepository()).execute({
      cloudinaryPublicId: "nova-foto",
      width: 800,
      height: 600,
      blurDataURL: "data:image/webp;base64,AA",
    });
    expect(photo.id).toBe("nova-foto");
  });
});
```

Create `src/api/application/photo/DeletePhotoUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPhotoRepository } from "@/api/infrastructure/repositories/mock/MockPhotoRepository";
import { GetPhotosUseCase } from "./GetPhotosUseCase";
import { DeletePhotoUseCase } from "./DeletePhotoUseCase";

describe("DeletePhotoUseCase", () => {
  it("remove a foto", async () => {
    const repo = new MockPhotoRepository();
    const before = await new GetPhotosUseCase(repo).execute();
    await new DeletePhotoUseCase(repo).execute(before[0].id);
    const after = await new GetPhotosUseCase(repo).execute();
    expect(after.find((p) => p.id === before[0].id)).toBeUndefined();
  });
});
```

- [ ] **Step 9: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros — `RepositoryFactory.ts` ainda não referencia
`PhotoRepositoryImpl` (Task 3), nada quebra por enquanto; os 7 testes
novos desta task passam (4 do mock + 1 de getPhotos + 1 de create + 1
de delete).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(photo): domínio, DTO, casos de uso e repositório mock

Photo não tem update — só findAll/create/delete (a única forma de
trocar uma foto é remover e subir outra). id do documento é o próprio
cloudinaryPublicId, igual o slug de Niche."
```

---

### Task 2: Infra do Cloudinary — assinatura, delete e blurDataURL

**Files:**

- Create: `src/api/infrastructure/cloudinary/signParams.ts` (+ `.test.ts`)
- Create: `src/api/infrastructure/cloudinary/deleteCloudinaryAsset.ts`
  (+ `.test.ts`)
- Create: `src/api/infrastructure/cloudinary/fetchBlurDataURL.ts` (+
  `.test.ts`)
- Create: `src/api/infrastructure/cloudinary/buildThumbnailUrl.ts`
- Modify: `src/config/env.server.ts`, `.env.example`

**Interfaces:**

- Produces: `signParams(params: Record<string, string | number>,
apiSecret: string): string`, `deleteCloudinaryAsset(publicId: string,
credentials: {cloudName, apiKey, apiSecret}): Promise<void>`,
  `fetchBlurDataURL(publicId: string, cloudName: string):
Promise<string>`, `buildThumbnailUrl(publicId: string, cloudName:
string): string`.

- [ ] **Step 1: `CLOUDINARY_API_KEY`/`_API_SECRET` no schema de env**

Em `src/config/env.server.ts`, adiciona:

```ts
// Credenciais de API do Cloudinary — só usadas por
// deleteCloudinaryAsset (o upload em si é unsigned, direto do browser,
// não passa por aqui). Opcionais: ausentes, o delete do asset no
// Cloudinary vira best-effort (loga aviso), o delete do Firestore
// continua funcionando normalmente. Independentes das credenciais do
// Firebase — RepositoryFactory.photos() não olha pra elas.
CLOUDINARY_API_KEY: z.string().min(1).optional(),
CLOUDINARY_API_SECRET: z.string().min(1).optional(),
```

Em `.env.example`, adiciona:

```
# API key/secret do Cloudinary — só pro delete assinado de assets
# (deleteCloudinaryAsset). Sem elas, apagar uma foto no admin remove o
# documento do Firestore normalmente, mas não limpa o asset no
# Cloudinary (loga um aviso).
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- [ ] **Step 2: Escrever o teste de `signParams` primeiro**

Create `src/api/infrastructure/cloudinary/signParams.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { signParams } from "./signParams";

describe("signParams", () => {
  it("gera a assinatura sha1 esperada pra um conjunto conhecido de parâmetros", () => {
    const signature = signParams({ public_id: "foo-bar", timestamp: 1700000000 }, "segredo");
    expect(signature).toBe("20e17db137ea26da30fa00dc3514f986dbff645a");
  });

  it("parâmetros em ordens diferentes de inserção geram a mesma assinatura", () => {
    const a = signParams({ timestamp: 1700000000, public_id: "foo-bar" }, "segredo");
    const b = signParams({ public_id: "foo-bar", timestamp: 1700000000 }, "segredo");
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/cloudinary/signParams.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 4: Implementar `signParams`**

Create `src/api/infrastructure/cloudinary/signParams.ts`:

```ts
import { createHash } from "node:crypto";

// Assinatura sha1 dos parâmetros (ordenados, key=value&…) + api_secret —
// algoritmo exigido pelo Cloudinary pra upload/delete assinado (docs:
// "Generating authentication signatures"). Mesmo algoritmo do
// signParams em app-photo/scripts/migration/cloudinaryUpload.ts — sem
// código compartilhado entre os repos, reimplementado aqui.
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(base + apiSecret)
    .digest("hex");
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/cloudinary/signParams.test.ts`
Expected: PASS — 2 testes.

- [ ] **Step 6: Escrever o teste de `deleteCloudinaryAsset` primeiro**

Create `src/api/infrastructure/cloudinary/deleteCloudinaryAsset.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteCloudinaryAsset } from "./deleteCloudinaryAsset";

const CREDENTIALS = { cloudName: "demo", apiKey: "chave", apiSecret: "segredo" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("deleteCloudinaryAsset", () => {
  it("faz POST assinado pro endpoint de destroy do Cloudinary", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: "ok" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await deleteCloudinaryAsset("foo-bar", CREDENTIALS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/destroy");
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("public_id")).toBe("foo-bar");
    expect(body.get("api_key")).toBe("chave");
    expect(body.get("signature")).toBeTruthy();
  });

  it('trata "not found" como sucesso — asset já não existia', async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: "not found" }) }),
    );
    await expect(deleteCloudinaryAsset("foo-bar", CREDENTIALS)).resolves.toBeUndefined();
  });

  it("lança quando o Cloudinary responde com erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }),
    );
    await expect(deleteCloudinaryAsset("foo-bar", CREDENTIALS)).rejects.toThrow();
  });
});
```

- [ ] **Step 7: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/cloudinary/deleteCloudinaryAsset.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 8: Implementar `deleteCloudinaryAsset`**

Create `src/api/infrastructure/cloudinary/deleteCloudinaryAsset.ts`:

```ts
import { signParams } from "./signParams";

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Destroy do Cloudinary precisa de assinatura (a api_secret nunca pode
// ir pro browser) — diferente do upload, que usa preset unsigned direto
// do client. "not found" conta como sucesso: o objetivo é "garantir que
// o asset não existe mais", e ele já não existe.
export async function deleteCloudinaryAsset(
  publicId: string,
  credentials: CloudinaryCredentials,
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp }, credentials.apiSecret);

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", credentials.apiKey);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`,
    {
      method: "POST",
      body: form,
    },
  );
  if (!res.ok) {
    throw new Error(`Cloudinary destroy falhou (HTTP ${res.status}) para "${publicId}"`);
  }
  const json = (await res.json()) as { result?: string };
  if (json.result !== "ok" && json.result !== "not found") {
    throw new Error(`Cloudinary destroy retornou resultado inesperado: "${json.result}"`);
  }
}
```

- [ ] **Step 9: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/cloudinary/deleteCloudinaryAsset.test.ts`
Expected: PASS — 3 testes.

- [ ] **Step 10: Escrever o teste de `fetchBlurDataURL` primeiro**

Create `src/api/infrastructure/cloudinary/fetchBlurDataURL.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBlurDataURL } from "./fetchBlurDataURL";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchBlurDataURL", () => {
  it("busca a transformação de 16px e retorna um data URI base64 em webp", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes.buffer,
    });
    vi.stubGlobal("fetch", fetchMock);

    const dataUri = await fetchBlurDataURL("foo-bar", "demo");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://res.cloudinary.com/demo/image/upload/w_16,e_blur:1000,q_1,f_webp/foo-bar",
    );
    expect(dataUri).toBe("data:image/webp;base64,AQID");
  });

  it("lança quando o Cloudinary não retorna a transformação", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(fetchBlurDataURL("foo-bar", "demo")).rejects.toThrow();
  });
});
```

- [ ] **Step 11: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/cloudinary/fetchBlurDataURL.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 12: Implementar `fetchBlurDataURL` e `buildThumbnailUrl`**

Create `src/api/infrastructure/cloudinary/fetchBlurDataURL.ts`:

```ts
// f_webp fixo (não f_auto): esta chamada é servidor-a-servidor, sem
// header Accept de browser pra negociar formato — precisa de um formato
// determinístico pra decodificar certo o data URI. w_16,e_blur:1000,q_1
// é a mesma receita de "transformação de 16px" que a spec descreve.
export async function fetchBlurDataURL(publicId: string, cloudName: string): Promise<string> {
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/w_16,e_blur:1000,q_1,f_webp/${publicId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao buscar blurDataURL pra "${publicId}" (HTTP ${res.status})`);
  }
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:image/webp;base64,${base64}`;
}
```

Create `src/api/infrastructure/cloudinary/buildThumbnailUrl.ts`:

```ts
// Preview pequeno pra tabela de administração — mesma convenção de
// transformação do next-image-loader.ts (f_auto,q_<q>,w_<width>) do
// app-photo, aqui fixo em 120px porque é só uma miniatura de lista.
export function buildThumbnailUrl(publicId: string, cloudName: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_120/${publicId}`;
}
```

- [ ] **Step 13: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/cloudinary/fetchBlurDataURL.test.ts`
Expected: PASS — 2 testes.

- [ ] **Step 14: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat(photo): infra do Cloudinary — assinatura, delete e blurDataURL

signParams reimplementa o algoritmo sha1 de assinatura do Cloudinary
(mesmo do script de migração do app-photo, sem código compartilhado
entre os repos). deleteCloudinaryAsset trata \"not found\" como sucesso.
fetchBlurDataURL busca a transformação de 16px em f_webp fixo (chamada
servidor-a-servidor, sem negociação de formato via header Accept)."
```

---

### Task 3: `PhotoRepositoryImpl` (Firestore + coordenação com Cloudinary) + `RepositoryFactory`

**Files:**

- Create: `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`
- Modify: `src/config/env.client.ts`, `.env.example`

**Interfaces:**

- Consumes: `deleteCloudinaryAsset` (Task 2).
- Produces: `class PhotoRepositoryImpl implements PhotoRepository`,
  `RepositoryFactory.photos(): PhotoRepository`,
  `clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
  `clientEnv.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (o segundo só é
  consumido a partir da Task 5, mas os dois entram juntos no mesmo
  schema aqui — `PhotoRepositoryImpl`, abaixo, já precisa do primeiro).

- [ ] **Step 1: `NEXT_PUBLIC_CLOUDINARY_*` no schema de env do client**

Em `src/config/env.client.ts`, adiciona:

```ts
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
  // Cloud name e preset unsigned do Cloudinary — usados pelo widget de
  // upload (browser → Cloudinary direto, Task 5) e por
  // PhotoRepositoryImpl/fetchBlurDataURL no servidor. Opcionais: sem
  // eles, o botão de upload mostra um erro claro em vez de quebrar a
  // página inteira. O preset precisa existir de verdade no painel do
  // Cloudinary — ver Global Constraints do plano.
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
});

export const clientEnv = schema.parse({
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
});
```

Em `.env.example`, adiciona:

```
# Cloud name e preset unsigned do Cloudinary — o preset precisa ser
# criado no painel do Cloudinary antes do upload funcionar (Settings →
# Upload → Upload presets → Signing Mode: Unsigned). Sem eles, o botão
# de upload mostra um erro em vez de tentar subir o arquivo.
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

- [ ] **Step 2: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`:

```ts
import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { getAdminDb } from "@/api/infrastructure/firebase/admin";
import { env } from "@/config/env.server";
import { clientEnv } from "@/config/env.client";
import { deleteCloudinaryAsset } from "../cloudinary/deleteCloudinaryAsset";

const COLLECTION = "photos";

function toPhoto(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Photo {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    id: doc.id,
    cloudinaryPublicId: data.cloudinaryPublicId,
    width: data.width,
    height: data.height,
    blurDataURL: data.blurDataURL,
  };
}

// Delete apaga o Firestore primeiro, Cloudinary depois — ver Global
// Constraints do plano (falha no Cloudinary vira asset órfão, mais
// seguro que uma foto quebrada no site).
export class PhotoRepositoryImpl implements PhotoRepository {
  async findAll(): Promise<Photo[]> {
    const snapshot = await getAdminDb().collection(COLLECTION).get();
    return snapshot.docs.map(toPhoto).sort((a, b) => a.id.localeCompare(b.id));
  }

  async create(data: Omit<Photo, "id">): Promise<Photo> {
    const id = data.cloudinaryPublicId;
    await getAdminDb().collection(COLLECTION).doc(id).set(data);
    return { id, ...data };
  }

  async delete(id: string): Promise<void> {
    await getAdminDb().collection(COLLECTION).doc(id).delete();

    if (
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET ||
      !clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ) {
      console.warn(
        `[photo] CLOUDINARY_API_KEY/_API_SECRET/cloud name ausentes — asset "${id}" não foi removido do Cloudinary.`,
      );
      return;
    }
    try {
      await deleteCloudinaryAsset(id, {
        cloudName: clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
      });
    } catch (err) {
      console.warn(`[photo] falha ao remover o asset "${id}" do Cloudinary:`, err);
    }
  }
}
```

- [ ] **Step 3: `RepositoryFactory` ganha `photos()`**

Modify `src/api/infrastructure/repositories/RepositoryFactory.ts` — adiciona
os imports de `PhotoRepository`/`PhotoRepositoryImpl`/`MockPhotoRepository`
e a entrada `photos` no objeto final, no mesmo padrão de `niches`/`packages`:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { env } from "@/config/env.server";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { PackageRepositoryImpl } from "./PackageRepositoryImpl";
import { PhotoRepositoryImpl } from "./PhotoRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";
import { MockPackageRepository } from "./mock/MockPackageRepository";
import { MockPhotoRepository } from "./mock/MockPhotoRepository";

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
};
```

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(photo): repositório Firestore + RepositoryFactory.photos()

delete() apaga o Firestore primeiro; a remoção do asset no Cloudinary é
best-effort — credenciais ausentes ou falha na chamada só logam aviso,
nunca impedem a operação de completar do ponto de vista do admin."
```

---

### Task 4: ViewModel e actions

**Files:**

- Create: `src/api/presentation/photo/PhotoViewModel.ts`
- Create: `src/actions/photos.ts`

**Interfaces:**

- Consumes: `assertSession` (`src/lib/auth/session.ts`, plano 6),
  `fetchBlurDataURL` (Task 2), `clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  (Task 3).
- Produces: `getPhotos(): Promise<PhotoViewModel[]>`,
  `createPhoto(data: {cloudinaryPublicId, width, height}):
Promise<PhotoViewModel>`, `deletePhoto(id): Promise<void>` — todas
  exigem sessão.

- [ ] **Step 1: ViewModel**

Create `src/api/presentation/photo/PhotoViewModel.ts`:

```ts
import type { PhotoDTO } from "@/api/application/photo/PhotoDTO";
import { buildThumbnailUrl } from "@/api/infrastructure/cloudinary/buildThumbnailUrl";
import { clientEnv } from "@/config/env.client";

export interface PhotoViewModel extends PhotoDTO {
  dimensions: string;
  thumbnailUrl: string;
  // Campo sintético, sem valor de negócio — mesma técnica do
  // NicheViewModel/PackageViewModel: dá à DataTable uma key própria
  // pra coluna de ações.
  actions: null;
}

export function toPhotoViewModel(dto: PhotoDTO): PhotoViewModel {
  const cloudName = clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return {
    ...dto,
    dimensions: `${dto.width} × ${dto.height}`,
    thumbnailUrl: cloudName ? buildThumbnailUrl(dto.cloudinaryPublicId, cloudName) : "",
    actions: null,
  };
}
```

- [ ] **Step 2: Actions**

Create `src/actions/photos.ts`:

```ts
"use server";

import { GetPhotosUseCase } from "@/api/application/photo/GetPhotosUseCase";
import { CreatePhotoUseCase } from "@/api/application/photo/CreatePhotoUseCase";
import { DeletePhotoUseCase } from "@/api/application/photo/DeletePhotoUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import { fetchBlurDataURL } from "@/api/infrastructure/cloudinary/fetchBlurDataURL";
import { toPhotoViewModel, type PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import { clientEnv } from "@/config/env.client";
import { assertSession } from "@/lib/auth/session";

export async function getPhotos(): Promise<PhotoViewModel[]> {
  await assertSession();
  const photos = await new GetPhotosUseCase(RepositoryFactory.photos()).execute();
  return photos.map(toPhotoViewModel);
}

export interface UploadedPhotoInput {
  cloudinaryPublicId: string;
  width: number;
  height: number;
}

export async function createPhoto(data: UploadedPhotoInput): Promise<PhotoViewModel> {
  await assertSession();
  if (!clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME não configurado.");
  }
  const blurDataURL = await fetchBlurDataURL(
    data.cloudinaryPublicId,
    clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );
  const photo = await new CreatePhotoUseCase(RepositoryFactory.photos()).execute({
    ...data,
    blurDataURL,
  });
  return toPhotoViewModel(photo);
}

export async function deletePhoto(id: string): Promise<void> {
  await assertSession();
  await new DeletePhotoUseCase(RepositoryFactory.photos()).execute(id);
}
```

(Sem `callRevalidateWebhook` aqui — `Photo` sozinho não é lido em
nenhuma superfície do site público sem um `Placement`; a invalidação de
cache relevante entra no plano 10, junto com o CRUD de `Placement`.)

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(photo): ViewModel e actions com sessão

createPhoto busca o blurDataURL no servidor (fetchBlurDataURL) antes de
persistir — o browser só manda cloudinaryPublicId/width/height, nunca
gera o blur sozinho. Sem webhook de revalidação aqui: Photo sozinho não
aparece em nenhuma superfície pública sem um Placement (plano 10)."
```

---

### Task 5: UI — upload, lista com preview e remoção

**Files:**

- Create: `src/app/photos/page.tsx`
- Create: `src/app/photos/_components/PhotosManager.tsx`,
  `UploadPhotoModal.tsx`
- Create: `src/app/photos/_lib/uploadToCloudinary.ts`

**Interfaces:**

- Consumes: `getPhotos`, `createPhoto`, `deletePhoto` (Task 4),
  `DataTable`/`ConfirmationDialog`/`Dialog`/`Button` (copiados do
  Presencia, plano 6), `showToast`, `clientEnv` (Task 4, pro cloud
  name/preset do widget de upload).

- [ ] **Step 1: Helper de upload direto pro Cloudinary (client-only)**

Create `src/app/photos/_lib/uploadToCloudinary.ts`:

```ts
export interface CloudinaryUploadResult {
  publicId: string;
  width: number;
  height: number;
}

// Roda no browser — vai direto pro Cloudinary com um preset unsigned,
// nunca passa pelo servidor do admin (arquivo pode ser grande, e o
// preset unsigned dispensa expor a api_secret aqui). Ver Global
// Constraints do plano: o preset precisa existir de verdade no painel
// do Cloudinary.
export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string,
): Promise<CloudinaryUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Upload falhou (HTTP ${res.status}).`);
  }
  return { publicId: json.public_id, width: json.width, height: json.height };
}
```

- [ ] **Step 2: Página (Server Component)**

Create `src/app/photos/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { getPhotos } from "@/actions/photos";
import { PhotosManager } from "./_components/PhotosManager";

export default async function PhotosPage() {
  const photos = await getPhotos();
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Fotos</h1>
      <PhotosManager initialPhotos={photos} />
    </main>
  );
}
```

- [ ] **Step 3: Modal de upload**

Create `src/app/photos/_components/UploadPhotoModal.tsx`:

```tsx
"use client";

import { createPhoto } from "@/actions/photos";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import { Button } from "@/lib/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { clientEnv } from "@/config/env.client";
import { showToast } from "@/lib/_utils/toast";
import { useState } from "react";
import { uploadToCloudinary } from "../_lib/uploadToCloudinary";

export function UploadPhotoModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (photo: PhotoViewModel) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

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
    try {
      const uploaded = await uploadToCloudinary(file, cloudName, preset);
      const photo = await createPhoto(uploaded);
      showToast({ message: "Foto enviada.", variant: "success" });
      onCreated(photo);
      onOpenChange(false);
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Falha ao enviar a foto.",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova foto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileChange}
            className="text-sm"
          />
          {isUploading && <p className="text-muted-foreground text-sm">Enviando…</p>}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

(Sem `useTransition`/`startTransition` aqui, diferente dos modais de
`Niche`/`Package`: o upload não é uma única chamada de Server Action, é
uma sequência de duas chamadas assíncronas — `fetch` direto pro
Cloudinary, depois `createPhoto` — então um `useState<boolean>` manual
descreve melhor o estado "em andamento" do que `startTransition`, que
assume uma única transição disparada por uma action.)

- [ ] **Step 4: Gerenciador (lista + orquestra o modal)**

Create `src/app/photos/_components/PhotosManager.tsx`:

```tsx
"use client";

import { deletePhoto } from "@/actions/photos";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import { Button } from "@/lib/_components/ui/button";
import { ConfirmationDialog } from "@/lib/_components/ui/confirmation-dialog";
import { DataTable, type DataTableColumn } from "@/lib/_components/ui/data-table";
import { showToast } from "@/lib/_utils/toast";
import { useState } from "react";
import { UploadPhotoModal } from "./UploadPhotoModal";

export function PhotosManager({ initialPhotos }: { initialPhotos: PhotoViewModel[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<PhotoViewModel | null>(null);

  const columns: DataTableColumn<PhotoViewModel>[] = [
    {
      key: "thumbnailUrl",
      header: "",
      // eslint-disable-next-line @next/next/no-img-element -- miniatura vinda do Cloudinary, next/image exigiria configurar remotePatterns só pra 120px de preview
      render: (value) =>
        value ? (
          <img src={String(value)} alt="" className="h-12 w-12 rounded object-cover" />
        ) : null,
    },
    { key: "cloudinaryPublicId", header: "Public ID", sortable: true, filterable: true },
    { key: "dimensions", header: "Dimensões" },
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
    await deletePhoto(deleting.id);
    setPhotos((current) => current.filter((p) => p.id !== deleting.id));
    showToast({ message: "Foto removida.", variant: "success" });
  }

  return (
    <>
      <DataTable
        data={photos}
        columns={columns}
        headerAction={<Button onClick={() => setIsUploadOpen(true)}>Nova foto</Button>}
      />

      <UploadPhotoModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onCreated={(photo) => setPhotos((current) => [...current, photo])}
      />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover foto"
        description={`Remover "${deleting?.cloudinaryPublicId}"? Esta ação não pode ser desfeita.`}
        variant="destructive"
        confirmLabel="Remover"
        onConfirm={handleDelete}
      />
    </>
  );
}
```

(Sem `onRowClick` — diferente de `Niche`/`Package`, não há edição pra
abrir ao clicar na linha; a única ação de linha é remover, já coberta
pela coluna `actions`.)

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: sem erros — o `eslint-disable` inline da miniatura é esperado
(`@next/next/no-img-element` é `'warn'` neste projeto, não bloqueia o
build; o disable só documenta a decisão consciente de não usar
`next/image` pra uma miniatura de 120px vinda de domínio externo).

- [ ] **Step 6: Smoke test manual (precisa de credenciais reais do Cloudinary/Firebase)**

Documentar aqui, não executar sem credenciais: logar, abrir `/photos`,
subir uma foto de teste (confirma que `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`/
`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` estão configurados e o preset é
unsigned de verdade no painel do Cloudinary), confirmar que ela aparece
na lista com miniatura e dimensões corretas, removê-la e confirmar que
some da lista — depois checar manualmente no painel do Cloudinary que o
asset também sumiu de lá.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(photo): UI de upload, lista com preview e remoção

Upload sem useTransition (sequência de duas chamadas assíncronas —
Cloudinary direto, depois createPhoto — não uma única action). Sem
edição nem onRowClick: a única ação de linha é remover."
```

---

### Task 6: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa em `admin-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY FIREBASE_WEB_API_KEY=dummy-key npm run build`
Expected: sem erros.

- [ ] **Step 2: Confirmar que `app-photo` não foi tocado**

Run: `git -C /Users/cesarpisa/Projects/lp-fotografia/app-photo status --short`
Expected: nenhuma mudança relacionada a este plano (só, no máximo, os
arquivos de agosto já pré-existentes e não relacionados, se ainda
estiverem lá) — este plano não modifica `app-photo`.

- [ ] **Step 3: Smoke test manual completo (precisa de credenciais reais)**

Documentar aqui, não executar sem credenciais: com Firebase e Cloudinary
reais configurados (incluindo o preset unsigned criado no painel do
Cloudinary), repetir o smoke test da Task 5 do início ao fim — upload,
listagem, remoção — e confirmar no painel do Cloudinary que o asset
realmente some após o delete.

- [ ] **Step 4: Commit final (se sobrou algo solto)**

```bash
git -C /Users/cesarpisa/Projects/lp-fotografia/admin-photo status --short
# se houver pendências, git add -A && git commit -m "..."
# admin-photo continua só local — push fica a critério do usuário.
```

---

## Depois deste plano

`Photo` tem CRUD completo (sem update) no admin. Falta anexá-lo a
superfícies do site — isso é o **plano 10 (Placement)**:

- CRUD de `Placement` (`surface` + `refId` opcional + `role` opcional +
  `order`), com UI que troca os campos disponíveis conforme a `surface`
  escolhida (hero/quem-sou/home-gallery não usam `refId`; niche usa
  `refId` = slug do nicho; package usa `refId` = id do pacote).
- Índice composto novo em `app-photo/firestore.indexes.json`:
  `(surface, refId, order)` — já apontado como necessário no comentário
  de `PlacementRepositoryImpl.ts` desde o plano 3, nunca materializado
  (mesmo tipo de gap que este plano não corrigiu, porque pertence à
  Task de `app-photo` do plano 10, não deste).
- `app-photo`'s `PhotoRepositoryImpl.findByIds` e
  `PlacementRepositoryImpl.findBySurface` ganham `unstable_cache` com
  tag `"placements"` — só faz sentido junto com o webhook do plano 10,
  que é o que de fato torna essa tag invalidável (`Photo` sozinho, deste
  plano, não tem nenhuma leitura pública cacheável ainda).
- Webhook `callRevalidateWebhook("placements")` chamado pelas actions de
  `Placement` (não pelas de `Photo`, que já existem e não mudam).
