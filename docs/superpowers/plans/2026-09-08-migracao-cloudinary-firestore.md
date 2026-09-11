# Migração para Cloudinary + Firestore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir toda a infraestrutura do Cloudinary (entrega de imagem
otimizada) e escrever o script de migração completo — sobe as 87 fotos reais,
deriva os `Placement`s da lógica hoje aposentada, e migra `niche`/`package`/
`profile` pro Firestore de produção — **sem executá-lo** contra credenciais
reais neste plano. O script fica pronto, testado e verificado em modo
`--dry-run`; rodar de verdade é uma decisão separada, de quando a Denise
tiver o projeto Cloudinary configurado.

**Architecture:** Cloudinary vira detalhe de **infraestrutura**, não de
domínio: `Photo` (domínio, DTO, mocks — planos 1-4) continua exatamente como
está, com `src: string`. Só `PhotoRepositoryImpl` (a implementação real,
Firestore) muda — ela lê `cloudinaryPublicId` do documento e resolve pra uma
URL de entrega via um helper novo (`buildDeliveryUrl`), o único lugar do
código que sabe que Cloudinary existe. O script de migração é o segundo (e
último) lugar: escreve `cloudinaryPublicId` no Firestore, nunca `src`.
Consequência directa: nenhum arquivo de `gallery.ts`, `niches.ts`,
`About.tsx`, nem os testes desses planos, precisa mudar.

O script reimplementa, uma última vez, o algoritmo que os planos 1-3 já
"aposentaram" do código de produção (`categoria()`/`intercalar()`/
`isHorizontal()`/`NICHE_PHOTO_CATEGORIES`) — reconstruído aqui a partir do
histórico do git (commits `7eadcb8^` e `052d7f9^`), porque essas funções não
existem mais em `gallery.ts`/`niches.ts`. Não é reinvenção: é a mesma lógica,
uma última vez, transformando `photos.json` (a fonte real) em `Placement`s
concretos.

**Tech Stack:** Next.js 16, TypeScript, `firebase-admin` (já usado),
`fetch`/`FormData`/`crypto` nativos do Node (sem SDK novo — mesmo espírito do
`upload-cloudinary.mjs` do `lp-jhuli-souza`, que também não usa a SDK oficial
do Cloudinary), `tsx` (já devDependency, roda `scripts/optimize-photos.ts`).

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
(ganha uma seção nova, "Contrato Firestore de produção" — Task 1)
**Planos anteriores:** nicho (1/10), pacote (2/10), foto/placement (3/10),
profile (4/10)

## Global Constraints

- Sem Firebase/Cloudinary reais disponíveis em CI — `npm run build` e
  `npm run test` continuam funcionando só com mock, como nos planos 1-4.
- **O script de migração NÃO roda contra credenciais reais neste plano** —
  só `--dry-run` (nenhuma chamada de rede) e os testes unitários das funções
  puras que ele usa. Rodar de verdade é decisão do usuário, fora deste plano.
- `Photo` (domínio) não ganha `cloudinaryPublicId`, `alt` nem `createdAt` do
  esboço original do spec — nada consome esses campos hoje; permanecem fora
  de escopo, igual o plano 3 já decidiu para `alt`.
- O loader customizado do Next desliga o otimizador embutido pra **qualquer**
  imagem, local ou Cloudinary — fotos locais/mock passam a servir no tamanho
  já processado por `optimize-photos.ts` (1600px), sem redimensionar por
  breakpoint. Aceitável: isso só afeta dev/mock/CI; produção real vai estar
  no Cloudinary, que redimensiona na entrega via `next-image-loader.ts`.
- **Tamanho real das galerias de nicho** (recalculado dos dados reais de
  `photos.json`, substituindo a estimativa "15" do plano 3): retratos-
  profissionais tem 20 fotos (13 profissional + 2 corporativo + 5 pessoal) —
  a maior de todas, ainda bem abaixo do limite de 30 do Firestore
  `where(documentId(), "in", ids)`.
- `vitest.config.ts` só descobre testes em `src/**` hoje — este plano
  introduz lógica testável fora dessa árvore (`scripts/`, raiz do projeto) e
  precisa alargar o `include` (Task 1 e Task 3), ou esses testes nunca rodam.

---

## Mapa de arquivos

**Criar:**

- `next-image-loader.ts` (raiz do projeto)
- `next-image-loader.test.ts` (raiz do projeto)
- `src/api/infrastructure/cloudinary/buildDeliveryUrl.ts`
- `src/api/infrastructure/cloudinary/buildDeliveryUrl.test.ts`
- `scripts/migration/cloudinaryUpload.ts`
- `scripts/migration/cloudinaryUpload.test.ts`
- `scripts/migration/derivePhotosAndPlacements.ts`
- `scripts/migration/derivePhotosAndPlacements.test.ts`
- `scripts/migration/migrateContent.ts`
- `scripts/migrate-to-firestore.ts`

**Modificar:**

- `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md` —
  seção nova "Contrato Firestore de produção"
- `vitest.config.ts` — alarga `include` pra cobrir `scripts/` e a raiz
- `next.config.ts` — `images.loader`/`loaderFile`/`remotePatterns`
- `src/lib/config/env.server.ts` — adiciona `CLOUDINARY_CLOUD_NAME`
- `.env.example` — documenta as 3 variáveis do Cloudinary
- `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts` — resolve
  `cloudinaryPublicId` → `src` via `buildDeliveryUrl`

**Decisão de escopo:** upload direto do browser do admin (preset unsigned) e
a rota de delete assinada (spec, seção "Fotos (Cloudinary)") ficam fora —
isso é trabalho do repositório admin (planos 6-10), que ainda não existe.
Este plano cobre só o lado de entrega (este repo) e a migração única do
acervo (rodada uma vez, por este repo, contra o mesmo projeto Cloudinary/
Firestore que o admin vai usar depois).

---

### Task 1: Contrato Firestore + infraestrutura de entrega do Cloudinary

**Files:**

- Modify: `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
- Modify: `vitest.config.ts`
- Create: `next-image-loader.ts`
- Create: `next-image-loader.test.ts`
- Modify: `next.config.ts`
- Modify: `src/lib/config/env.server.ts`
- Modify: `src/lib/config/env.server.test.ts`
- Modify: `.env.example`

**Interfaces:**

- Consumes: nada de novo.
- Produces: `cloudinaryLoader({src, width, quality}): string` (padrão de
  `next/image` custom loader), `env.CLOUDINARY_CLOUD_NAME: string |
undefined`.

- [ ] **Step 1: Documentar o contrato Firestore no spec**

Em `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`, logo
depois da seção `## Migração do acervo atual` (antes de `## Deploy`), insere:

````md
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
````

(Cerca de 4 crases na moldura externa de propósito: as seções `ts` dentro
dela usam cerca de 3 — CommonMark exige que a cerca externa seja mais longa
que qualquer cerca aninhada, senão o primeiro ` ``` ` interno fecha a
externa cedo demais. Verificado rodando `prettier --write` de verdade sobre
este arquivo antes de escrever este plano — com 3+3 ele reordena o
conteúdo; com 4+3, fica estável.)

- [ ] **Step 2: Alargar a descoberta de testes do vitest**

Em `vitest.config.ts`, troca:

```ts
    include: ["src/**/*.test.{ts,tsx}"],
```

por:

```ts
    // scripts/ e a raiz entram na Task 1/3 deste plano de migração — o
    // script de migração e o loader do Cloudinary vivem fora de src/ de
    // propósito (não fazem parte do app Next em si), mas precisam de teste
    // real igual qualquer outra lógica pura do projeto.
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}", "*.test.{ts,tsx}"],
```

- [ ] **Step 3: Escrever o teste do loader primeiro**

Create `next-image-loader.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import cloudinaryLoader from "./next-image-loader";

describe("cloudinaryLoader", () => {
  it("injeta f_auto,q_auto,w_<width> em URLs do Cloudinary", () => {
    const src = "https://res.cloudinary.com/minha-conta/image/upload/v1/foto.webp";
    const result = cloudinaryLoader({ src, width: 600 });
    expect(result).toBe(
      "https://res.cloudinary.com/minha-conta/image/upload/f_auto,q_auto,w_600/v1/foto.webp",
    );
  });

  it("usa a quality explícita quando informada", () => {
    const src = "https://res.cloudinary.com/minha-conta/image/upload/v1/foto.webp";
    const result = cloudinaryLoader({ src, width: 600, quality: 80 });
    expect(result).toContain("f_auto,q_80,w_600");
  });

  it("devolve paths locais sem alteração — mock/dev não passam pelo Cloudinary", () => {
    const src = "/fotos/mock/hero-1.webp";
    expect(cloudinaryLoader({ src, width: 600 })).toBe(src);
  });

  it("devolve URLs que não são do Cloudinary sem alteração", () => {
    const src = "https://outro-dominio.com/imagem.jpg";
    expect(cloudinaryLoader({ src, width: 600 })).toBe(src);
  });
});
```

- [ ] **Step 4: Rodar o teste e confirmar que falha**

Run: `npx vitest run next-image-loader.test.ts`
Expected: FAIL — `next-image-loader.ts` não existe.

- [ ] **Step 5: Implementar o loader**

Create `next-image-loader.ts`:

```ts
/**
 * Loader custom do next/image (ver next.config.ts, images.loaderFile).
 * Pra URLs do Cloudinary, injeta a transformação de entrega
 * (f_auto,q_<q>,w_<width>) logo após /upload/, delegando resize e
 * negociação de formato ao Cloudinary em vez do otimizador embutido do
 * Next. Qualquer outra URL (paths locais do mock/dev) passa sem alteração —
 * mesmo padrão do lp-jhuli-souza.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src;
  }
  const transform = `f_auto,q_${quality ?? "auto"},w_${width}`;
  return src.replace("/upload/", `/upload/${transform}/`);
}
```

- [ ] **Step 6: Rodar o teste de novo**

Run: `npx vitest run next-image-loader.test.ts`
Expected: PASS — 4 testes.

- [ ] **Step 7: Ligar o loader no `next.config.ts`**

Em `next.config.ts`, adiciona ao objeto `nextConfig` (junto de
`allowedDevOrigins`/`redirects`):

```ts
  images: {
    // Cloudinary faz resize/format na entrega; ver next-image-loader.ts.
    // O otimizador embutido do Next fica desligado pra qualquer imagem
    // (loaderFile custom vale pra todo next/image, local ou remoto) — ver
    // Global Constraints deste plano.
    loader: "custom",
    loaderFile: "./next-image-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
```

- [ ] **Step 8: `CLOUDINARY_CLOUD_NAME` no schema de env**

Em `src/lib/config/env.server.ts`, adiciona ao `schema`:

```ts
  // Cloud name do Cloudinary — usado só por PhotoRepositoryImpl (Task 2)
  // pra resolver cloudinaryPublicId em URL de entrega. Opcional aqui pela
  // mesma razão do Firebase: ausente, o app roda em modo mock (nenhuma foto
  // real do Firestore pra resolver ainda). CLOUDINARY_API_KEY/API_SECRET
  // não entram aqui — só o script de migração (scripts/migrate-to-firestore.ts)
  // usa, e ele lê .env.local diretamente, sem passar pela validação do app.
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
```

- [ ] **Step 9: Teste de aceitação da nova variável**

Em `src/lib/config/env.server.test.ts`, adiciona ao `describe("env.server")`:

```ts
it("aceita CLOUDINARY_CLOUD_NAME ausente ou presente", async () => {
  delete process.env.CLOUDINARY_CLOUD_NAME;
  const semVar = await import("./env.server");
  expect(semVar.env.CLOUDINARY_CLOUD_NAME).toBeUndefined();

  vi.resetModules();
  process.env.CLOUDINARY_CLOUD_NAME = "minha-conta";
  const comVar = await import("./env.server");
  expect(comVar.env.CLOUDINARY_CLOUD_NAME).toBe("minha-conta");
});
```

- [ ] **Step 10: Documentar as 3 variáveis no `.env.example`**

Em `.env.example`, adiciona ao final:

```
# Cloudinary. CLOUD_NAME é lido pelo app (PhotoRepositoryImpl resolve fotos
# reais do Firestore em URL de entrega — ver src/api/infrastructure/cloudinary).
# API_KEY/API_SECRET só são usados pelo script de migração
# (scripts/migrate-to-firestore.ts, upload assinado) — nunca pelo app Next,
# nunca chegam ao client.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- [ ] **Step 11: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros. O build confirma que `images.loader: "custom"` não
quebra a geração estática das páginas existentes (nenhuma foto real ainda —
só mock/local, que o loader passa direto).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(cloudinary): infra de entrega + contrato Firestore de produção

next-image-loader.ts injeta f_auto,q_auto,w_<width> só em URLs do
Cloudinary; paths locais (mock/dev) passam sem alteração. Contrato
Firestore documentado no spec — referência pros planos 6-10 (admin)
escreverem compatível sem precisar ler PhotoRepositoryImpl."
```

---

### Task 2: `PhotoRepositoryImpl` resolve `cloudinaryPublicId`

**Files:**

- Create: `src/api/infrastructure/cloudinary/buildDeliveryUrl.ts`
- Create: `src/api/infrastructure/cloudinary/buildDeliveryUrl.test.ts`
- Modify: `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`

**Interfaces:**

- Consumes: `env.CLOUDINARY_CLOUD_NAME` (Task 1).
- Produces: `buildDeliveryUrl(publicId: string, cloudName: string):
string`.

- [ ] **Step 1: Escrever o teste do helper primeiro**

Create `src/api/infrastructure/cloudinary/buildDeliveryUrl.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildDeliveryUrl } from "./buildDeliveryUrl";

describe("buildDeliveryUrl", () => {
  it("monta a URL base de entrega a partir do public_id", () => {
    expect(buildDeliveryUrl("profissional-01", "minha-conta")).toBe(
      "https://res.cloudinary.com/minha-conta/image/upload/profissional-01",
    );
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/cloudinary/buildDeliveryUrl.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar o helper**

Create `src/api/infrastructure/cloudinary/buildDeliveryUrl.ts`:

```ts
// URL base, sem transformação — next-image-loader.ts injeta
// f_auto,q_auto,w_<width> por request. Sem version (v123/) nem extensão
// explícita: o Cloudinary aceita a URL "nua" com f_auto e resolve o
// formato mais recente do asset sozinho.
export function buildDeliveryUrl(publicId: string, cloudName: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}
```

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run src/api/infrastructure/cloudinary/buildDeliveryUrl.test.ts`
Expected: PASS.

- [ ] **Step 5: Ligar `PhotoRepositoryImpl` ao helper**

Em `src/api/infrastructure/repositories/PhotoRepositoryImpl.ts`, troca:

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

por:

```ts
import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { FieldPath } from "firebase-admin/firestore";
import { env } from "@/lib/config/env.server";
import { buildDeliveryUrl } from "../cloudinary/buildDeliveryUrl";
import { db } from "../firebase/admin";

const COLLECTION = "photos";

// Firestore recusa `in` com array vazio, e limita a 30 valores — nenhuma
// superfície de hoje passa disso (ver Global Constraints do plano).
export class PhotoRepositoryImpl implements PhotoRepository {
  async findByIds(ids: string[]): Promise<Photo[]> {
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
  }
}
```

(O `throw` só executa quando `ids.length > 0` — ou seja, quando existe
pelo menos um `Placement` real apontando pra uma foto, e o Firestore real
está em uso. Falhar alto aqui é melhor do que devolver imagens quebradas
silenciosamente por falta de configuração.)

- [ ] **Step 6: Verificação manual (quando houver Firestore/Cloudinary reais disponíveis)**

Documentar aqui, não executar agora:

1. Popular manualmente um documento em `photos/` com `cloudinaryPublicId`
   apontando pra um asset real já existente no Cloudinary.
2. Rodar um script ad-hoc chamando `new PhotoRepositoryImpl().findByIds([id])`
   com `CLOUDINARY_CLOUD_NAME` e credenciais do Firebase reais no ambiente.
3. Confirmar que o `src` devolvido é uma URL válida do Cloudinary e que a
   imagem abre no navegador.

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(cloudinary): PhotoRepositoryImpl resolve cloudinaryPublicId

buildDeliveryUrl é o único ponto do domínio que sabe montar uma URL do
Cloudinary — Photo.src continua abstrato pros planos 1-4. Sem
CLOUDINARY_CLOUD_NAME configurado, findByIds falha alto em vez de
devolver imagem quebrada silenciosamente."
```

---

### Task 3: Script de migração — upload Cloudinary + derivação de Photo/Placement

**Files:**

- Create: `scripts/migration/cloudinaryUpload.ts`
- Create: `scripts/migration/cloudinaryUpload.test.ts`
- Create: `scripts/migration/derivePhotosAndPlacements.ts`
- Create: `scripts/migration/derivePhotosAndPlacements.test.ts`

**Interfaces:**

- Consumes: `photos.json` (`src/actions/_mock/photos.json`, `Record<string,
{slug, src, width, height, blurDataURL}[]>` — 87 fotos reais, 9 categorias).
- Produces: `signParams(params, apiSecret): string`, `uploadImage(filePath,
publicId, credentials): Promise<{publicId, width, height}>`,
  `deriveFotos(photos): DerivedFoto[]`, `derivePlacements(photos):
DerivedPlacement[]` (`DerivedFoto = {id, localPath, width, height,
blurDataURL}`, `DerivedPlacement = {photoId, surface, refId, role,
order}`).

- [ ] **Step 1: Escrever o teste da assinatura primeiro**

Create `scripts/migration/cloudinaryUpload.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { signParams } from "./cloudinaryUpload";

describe("signParams", () => {
  it("gera a assinatura sha1 esperada pra um conjunto conhecido de parâmetros", () => {
    const signature = signParams({ public_id: "teste", timestamp: 1700000000 }, "segredo");
    expect(signature).toBe("af92d24964b692ffb516c87002d1de5036ffcd30");
  });

  it("ordena as chaves antes de assinar, independente da ordem de entrada", () => {
    const a = signParams({ timestamp: 1700000000, public_id: "teste" }, "segredo");
    const b = signParams({ public_id: "teste", timestamp: 1700000000 }, "segredo");
    expect(a).toBe(b);
  });
});
```

(A assinatura esperada foi calculada de forma independente — sha1 de
`"public_id=teste&timestamp=1700000000segredo"` — não é a função testando
a si mesma.)

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run scripts/migration/cloudinaryUpload.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar o upload assinado**

Create `scripts/migration/cloudinaryUpload.ts`:

```ts
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface UploadResult {
  publicId: string;
  width: number;
  height: number;
}

/**
 * Assinatura sha1 dos parâmetros (ordenados, key=value&…) + api_secret —
 * algoritmo exigido pelo Cloudinary pra upload assinado (docs:
 * "Generating authentication signatures").
 */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(base + apiSecret)
    .digest("hex");
}

/**
 * Sobe um arquivo local pro Cloudinary via upload assinado — sem preset
 * unsigned, porque este script roda local com acesso à API secret
 * (diferente do upload direto do browser que o admin vai fazer, planos
 * 6-10, que precisa de preset unsigned por não ter a secret disponível).
 */
export async function uploadImage(
  filePath: string,
  publicId: string,
  credentials: CloudinaryCredentials,
): Promise<UploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp }, credentials.apiSecret);

  const form = new FormData();
  form.append("file", new Blob([await readFile(filePath)]));
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", credentials.apiKey);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Upload falhou (HTTP ${res.status}) para ${publicId}`);
  }
  return { publicId: json.public_id, width: json.width, height: json.height };
}
```

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run scripts/migration/cloudinaryUpload.test.ts`
Expected: PASS — 2 testes.

- [ ] **Step 5: Escrever o teste da derivação primeiro**

Create `scripts/migration/derivePhotosAndPlacements.test.ts`:

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

  it("quem-sou: exatamente 4 placements, roles capa/polaroid-1/altar/polaroid-2 em ordem", () => {
    const placements = derivePlacements(photos)
      .filter((p) => p.surface === "quem-sou")
      .sort((a, b) => a.order - b.order);
    expect(placements.map((p) => p.role)).toEqual(["capa", "polaroid-1", "altar", "polaroid-2"]);
  });

  it("home-gallery: no máximo 18, cada um com role preenchido", () => {
    const placements = derivePlacements(photos).filter((p) => p.surface === "home-gallery");
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.length).toBeLessThanOrEqual(18);
    for (const p of placements) expect(p.role).toBeTruthy();
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

- [ ] **Step 6: Rodar o teste e confirmar que falha**

Run: `npx vitest run scripts/migration/derivePhotosAndPlacements.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 7: Implementar a derivação**

Create `scripts/migration/derivePhotosAndPlacements.ts`:

```ts
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

export type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" | "package";

export interface DerivedPlacement {
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  role: string | null;
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

const ABOUT_ROLES = ["capa", "polaroid-1", "altar", "polaroid-2"];

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
    placements.push({ photoId: photo.slug, surface: "hero", refId: null, role: null, order });
  });

  (photos.familia ?? []).slice(0, ABOUT_FAMILY_COUNT).forEach((photo, order) => {
    placements.push({
      photoId: photo.slug,
      surface: "quem-sou",
      refId: null,
      role: ABOUT_ROLES[order],
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
      role: photo.label,
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
        role: null,
        order,
      });
    });
  }

  return placements;
}
```

- [ ] **Step 8: Rodar o teste de novo**

Run: `npx vitest run scripts/migration/derivePhotosAndPlacements.test.ts`
Expected: PASS — 6 testes.

- [ ] **Step 9: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 8 testes novos desta task passam (2 de
`cloudinaryUpload` + 6 de `derivePhotosAndPlacements`).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(migração): upload assinado do Cloudinary + derivação de Photo/Placement

derivePlacements reimplementa, uma última vez, o algoritmo de intercalação
que os planos 1-3 aposentaram do código de produção — verificado contra os
87 dados reais de photos.json, não um mock sintético."
```

---

### Task 4: Script de migração — Niche/Package/Profile + CLI orquestrador

**Files:**

- Create: `scripts/migration/migrateContent.ts`
- Create: `scripts/migrate-to-firestore.ts`

**Interfaces:**

- Consumes: `MockNicheRepository`/`MockPackageRepository`/
  `MockProfileRepository` (planos 1, 2, 4), `deriveFotos`/`derivePlacements`/
  `uploadImage` (Task 3), `db` (`src/api/infrastructure/firebase/admin.ts`).
- Produces: `collectNiches()`, `collectPackages(niches)`, `collectProfile()`
  — CLI `tsx scripts/migrate-to-firestore.ts [--dry-run]`.

- [ ] **Step 1: Coleta de niche/package/profile a partir dos mocks**

Create `scripts/migration/migrateContent.ts`:

```ts
import type { Niche } from "@/api/domain/niche/Niche";
import type { Package } from "@/api/domain/package/Package";
import type { Profile } from "@/api/domain/profile/Profile";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { MockProfileRepository } from "@/api/infrastructure/repositories/mock/MockProfileRepository";

// MockNicheRepository/MockPackageRepository/MockProfileRepository já são
// transcrição fiel do conteúdo real (planos 1, 2 e 4 documentam isso nos
// próprios arquivos) — não existe um segundo lugar "mais real" pra buscar
// esse texto. Migrar é copiar do mock pro Firestore de produção.
export async function collectNiches(): Promise<Niche[]> {
  return new MockNicheRepository().findAll();
}

export async function collectPackages(niches: Niche[]): Promise<Package[]> {
  const repo = new MockPackageRepository();
  const listas = await Promise.all(niches.map((n) => repo.findByNicheSlug(n.slug)));
  return listas.flat();
}

export async function collectProfile(): Promise<Profile> {
  const profile = await new MockProfileRepository().get();
  if (!profile)
    throw new Error("MockProfileRepository não devolveu profile — não deveria acontecer.");
  return profile;
}
```

- [ ] **Step 2: CLI orquestrador**

Create `scripts/migrate-to-firestore.ts`:

```ts
/**
 * Migra o acervo local (87 fotos + niche/package/profile hoje só em
 * mock) pro Cloudinary + Firestore de produção. Roda uma vez.
 *
 * Uso:
 *   tsx scripts/migrate-to-firestore.ts --dry-run   # não escreve nada, só mostra o que faria
 *   tsx scripts/migrate-to-firestore.ts             # escreve de verdade (precisa de .env.local)
 */
import { join } from "node:path";
import photosByCategory from "../src/actions/_mock/photos.json";
import { uploadImage, type CloudinaryCredentials } from "./migration/cloudinaryUpload";
import {
  deriveFotos,
  derivePlacements,
  type RawPhoto,
} from "./migration/derivePhotosAndPlacements";
import { collectNiches, collectPackages, collectProfile } from "./migration/migrateContent";

const DRY_RUN = process.argv.includes("--dry-run");

// process.loadEnvFile lê .env.local ANTES de qualquer import dinâmico mais
// abaixo (env.server.ts, importado só dentro de main() via import()
// dinâmico) avaliar process.env — imports estáticos deste arquivo (acima)
// não leem env em nenhum momento, então a ordem aqui é segura mesmo com
// imports de ES modules sendo hoisted.
try {
  process.loadEnvFile(".env.local");
} catch {
  if (!DRY_RUN) {
    console.error(
      "Não encontrei .env.local com as credenciais do Cloudinary/Firebase. Rode com --dry-run pra testar sem credenciais.",
    );
    process.exit(1);
  }
}

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!DRY_RUN && !(cloudName && apiKey && apiSecret)) {
    console.error("Faltam CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET no .env.local.");
    process.exit(1);
  }
  const credentials: CloudinaryCredentials | undefined = DRY_RUN
    ? undefined
    : { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! };

  // import() dinâmico de propósito: firebase/admin.ts importa env.server.ts,
  // que lê process.env no top level do módulo. Em --dry-run, nunca
  // inicializa o Firebase Admin SDK — não precisa de credencial nenhuma.
  const db = DRY_RUN ? undefined : (await import("../src/api/infrastructure/firebase/admin")).db;

  const photos = photosByCategory as Record<string, RawPhoto[]>;
  const fotos = deriveFotos(photos);
  const placements = derivePlacements(photos);
  console.log(`${fotos.length} fotos, ${placements.length} placements derivados.\n`);

  console.log("--- Fotos (Cloudinary + photos/{id}) ---");
  for (const foto of fotos) {
    if (DRY_RUN) {
      console.log(`[dry-run] upload ${foto.id} <- public${foto.localPath}`);
      continue;
    }
    await uploadImage(join(process.cwd(), "public", foto.localPath), foto.id, credentials!);
    await db!.collection("photos").doc(foto.id).set({
      cloudinaryPublicId: foto.id,
      width: foto.width,
      height: foto.height,
      blurDataURL: foto.blurDataURL,
    });
    console.log(`  ${foto.id} ok`);
  }

  console.log("\n--- Placements ---");
  for (const placement of placements) {
    if (DRY_RUN) {
      console.log(
        `[dry-run] placement ${placement.surface}/${placement.refId ?? "-"} order=${placement.order} <- ${placement.photoId}`,
      );
      continue;
    }
    await db!.collection("placements").add(placement);
  }

  console.log("\n--- Niches ---");
  const niches = await collectNiches();
  for (const niche of niches) {
    if (DRY_RUN) {
      console.log(`[dry-run] niches/${niche.slug}`);
      continue;
    }
    await db!.collection("niches").doc(niche.slug).set({
      title: niche.title,
      subtitle: niche.subtitle,
      intro: niche.intro,
      description: niche.description,
      highlights: niche.highlights,
      closingLine: niche.closingLine,
      showAsEventTeaser: niche.showAsEventTeaser,
      order: niche.order,
      eventOrder: niche.eventOrder,
    });
  }

  console.log("\n--- Packages ---");
  const packages = await collectPackages(niches);
  for (const pkg of packages) {
    if (DRY_RUN) {
      console.log(`[dry-run] packages/${pkg.id}`);
      continue;
    }
    await db!.collection("packages").doc(pkg.id).set({
      nicheSlug: pkg.nicheSlug,
      name: pkg.name,
      price: pkg.price,
      description: pkg.description,
      items: pkg.items,
      featured: pkg.featured,
      order: pkg.order,
    });
  }

  console.log("\n--- Profile ---");
  const profile = await collectProfile();
  if (DRY_RUN) {
    console.log("[dry-run] profile/main");
  } else {
    await db!.collection("profile").doc("main").set(profile);
  }

  console.log(DRY_RUN ? "\nDry-run concluído — nada foi escrito." : "\nMigração concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

(Nem `niche.slug`/`pkg.id` nem qualquer outro campo é destructurado e
descartado com `const { x, ...resto } = obj` — este projeto não tem
`ignoreRestSiblings` configurado no `@typescript-eslint/no-unused-vars`
(verificado nos planos 1-3), então cada `.set(...)` lista os campos
explicitamente.)

- [ ] **Step 3: Rodar em modo dry-run e conferir a saída**

Run: `npx tsx scripts/migrate-to-firestore.ts --dry-run`
Expected: roda até o fim sem exigir nenhuma credencial (nem Cloudinary,
nem Firebase), imprime 87 linhas de foto, a lista de placements, 7 nichos,
14 pacotes e o profile — tudo prefixado com `[dry-run]`, termina em
"Dry-run concluído — nada foi escrito."

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(migração): niche/package/profile + CLI orquestrador

tsx scripts/migrate-to-firestore.ts --dry-run roda hoje sem nenhuma
credencial — só imprime o que seria escrito. A migração de verdade fica
pra quando o Cloudinary estiver configurado; não roda neste plano."
```

---

### Task 5: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa**

Run: `npm run typecheck && npx eslint . && npx prettier '**/*.{css,ts,tsx,json,md}' --check && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: os cinco comandos terminam com código de saída 0, sem
credenciais do Firebase/Cloudinary no ambiente — os mesmos passos que o
CI roda.

- [ ] **Step 2: Confirmar que o script não precisa de credenciais reais em dry-run**

Run: `env -u CLOUDINARY_CLOUD_NAME -u CLOUDINARY_API_KEY -u CLOUDINARY_API_SECRET -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npx tsx scripts/migrate-to-firestore.ts --dry-run`
Expected: termina com sucesso — nenhuma das seis variáveis é lida em modo
dry-run (o `db` real e as credenciais do Cloudinary só entram no branch
`!DRY_RUN`).

- [ ] **Step 3: Confirmar que o modo real falha alto sem credenciais (sem tentar rodar de verdade)**

Run: `env -u CLOUDINARY_CLOUD_NAME -u CLOUDINARY_API_KEY -u CLOUDINARY_API_SECRET npx tsx scripts/migrate-to-firestore.ts`
Expected: sai com código 1 e a mensagem "Faltam CLOUDINARY_CLOUD_NAME/
API_KEY/API_SECRET..." (ou a de `.env.local` ausente, se for o caso) —
**não** chega a fazer nenhuma chamada de rede nem tentar escrever no
Firestore.

- [ ] **Step 4: Smoke test manual do site (nada deve mudar)**

Run: `npm run dev` (sem credenciais reais), abrir `http://localhost:3000`.
Expected: site idêntico ao final do plano 4 — hero, "Quem sou", galeria e
nichos com o mock sintético de sempre. Este plano não migrou nada de
verdade; só construiu a infraestrutura e o script, prontos pra quando a
migração real acontecer.

- [ ] **Step 5: Commit final (se sobrou algo solto) e push**

```bash
git status --short
# se houver pendências, git add -A && git commit -m "..."
git push
```

---

## Depois deste plano

A infraestrutura do Cloudinary está pronta e testada; o script de migração
está escrito, testado e verificado em `--dry-run` — mas **não rodou** contra
o Cloudinary/Firestore de produção. Falta:

- **Rodar a migração de verdade** — quando a Denise tiver o projeto
  Cloudinary criado (cloud name + API key/secret em `.env.local`) e o
  Firestore de produção pronto para receber os dados reais. Não é parte
  deste plano; é uma decisão separada, sem código novo — só executar
  `tsx scripts/migrate-to-firestore.ts` sem `--dry-run`.
- **Planos 6-10** — o repositório admin: scaffold + auth, CRUD de
  nicho/pacote, upload de foto (preset unsigned, direto do browser) +
  placement, CRUD de profile, deploy. O "Contrato Firestore de produção"
  (Task 1 deste plano, no spec) é a referência que esses planos devem
  seguir pra escrever compatível com o que o site público já lê.
