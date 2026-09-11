# admin-photo — CRUD de Profile + Prontidão de Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quinta e última entidade de conteúdo do admin — `Profile`
(textos da seção "Quem sou" do site, documento único) — mais o fechamento
de prontidão pra deploy real: corrigir um gap real no pipeline de build
do Cloudinary (nunca atualizado desde o plano 9) e documentar
explicitamente tudo que falta pra rodar em produção, sem fingir executar
o que este ambiente não tem acesso pra fazer de verdade.

**Architecture:** `Profile` é radicalmente mais simples que as quatro
entidades anteriores: documento único e fixo (`profile/main`, mesmo ID
sempre), sem lista, sem `DataTable`, sem modal — uma página só com um
formulário, no espírito de uma tela de configurações. O repositório não
tem `create`/`update` separados, só `get()` + `save()` (upsert completo
via `.set()`, nunca `.update()` parcial — o formulário sempre reenvia o
documento inteiro). Sem `ViewModel`: nada transforma o `ProfileDTO` pra
exibição (sem rótulo sintético, sem miniatura, sem coluna de ações — a
primeira entidade deste projeto sem motivo real pra essa camada).

A segunda metade do plano lida com o que falta pra ir ao ar: o
`Dockerfile`/`CD.yml` do `admin-photo` ainda carregam um comentário do
plano 6 dizendo que nenhuma variável `NEXT_PUBLIC_*` existe — mas o
plano 9 criou duas (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`/
`_UPLOAD_PRESET`) e nunca atualizou o pipeline de build pra propagá-las.
Isso é um bug real: um build de produção hoje embutiria essas variáveis
como `undefined` no bundle do client, quebrando o widget de upload
silenciosamente. Esse plano corrige isso. O resto — repositório remoto
no GitHub, segredos de CI, projeto Firebase real, preset do Cloudinary,
`docker-compose.yml` da VPS, DNS — exige acesso (GitHub, SSH da VPS,
painel do Cloudinary, DNS) que este ambiente não tem; fica documentado
como checklist manual, não fingido como executado.

**Tech Stack:** Mesmo dos planos 6-10. Sem novas dependências.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
(seções "Modelo de conteúdo" — `Profile`, "Contrato Firestore de
produção" — `profile/main`, "Deploy")
**Plano anterior:** `2026-09-09-admin-photo-crud-placement.md` (10/10 —
CRUD completo de conteúdo, faltava só `Profile`).
**Precedentes investigados:** `app-photo/src/api/domain/profile/*`,
`application/profile/*`, `infrastructure/repositories/ProfileRepositoryImpl.ts`,
`mock/MockProfileRepository.ts` (texto real completo da seção "Quem sou",
transcrito de `src/app/_components/About.tsx`), `src/actions/profile.ts`,
`RepositoryFactory.ts` (confirma o nome `profile` — singular — já usado
lá, este plano espelha o mesmo nome no `admin-photo`). `admin-photo`'s
`Dockerfile`/`.github/workflows/CD.yml` (comentários datados do plano 6,
nunca atualizados após o plano 9 introduzir variáveis `NEXT_PUBLIC_*`
reais).

## Global Constraints

- **`Profile` é documento único** — sempre `profile/main`, nunca outro
  ID. Sem `findAll`/`delete`: não existe "lista de profiles" nem "apagar
  o profile" com sentido de negócio.
- **`save()` é upsert completo via `.set()`, não `.update()` parcial** —
  o formulário da UI sempre reenvia o objeto inteiro (mesmo padrão de
  "documento de configuração única"); não há conceito de "editar só um
  campo" aqui como em `Niche`/`Package`.
- **`get()` retorna `null` quando o documento ainda não existe** (nunca
  lança, diferente do `GetProfileUseCase` do `app-photo`, que lança
  porque lá é uma falha real de produção sem fallback de UI) — o admin
  precisa renderizar um formulário vazio pronto pra preencher quando o
  Firestore ainda não tem o documento (ex.: antes da migração do plano
  5 rodar, ou num ambiente de desenvolvimento novo).
- **Sem camada de `ViewModel`/apresentação pra `Profile`** — desvio
  deliberado do padrão das quatro entidades anteriores: nada no
  formulário precisa de um campo sintético, rótulo calculado ou URL de
  miniatura. Adicionar uma camada que não transforma nada violaria
  YAGNI. `ProfileDTO` vai direto pro componente.
- **Sem webhook pra `getProfile()` — só pra `saveProfile()`** — mesmo
  padrão das outras entidades: leitura nunca invalida cache, só escrita
  (`callRevalidateWebhook("profile")`).
- **Correção real de pipeline, não invenção:** `Dockerfile`/`CD.yml`
  ganham as duas variáveis `NEXT_PUBLIC_CLOUDINARY_*` como `ARG` do
  Docker + `build-args` na Action — gap real, confirmado lendo os dois
  arquivos: o comentário que diz "nenhuma existe ainda" é do plano 6 e
  ficou desatualizado assim que o plano 9 criou essas variáveis.
- **Nenhum passo deste plano executa deploy de verdade** — `admin-photo`
  não tem remote no GitHub (confirmado em todos os planos anteriores,
  "Manter como está"), o daemon do Docker não está acessível neste
  ambiente (`docker info` retorna "failed to connect"), e não há
  credenciais reais de VPS/Firebase/Cloudinary aqui. A Task 7 documenta
  o checklist manual completo; nenhuma delas é executada por este plano.

---

## Mapa de arquivos

**Criar (em `admin-photo`):**

- `src/api/domain/profile/Profile.ts`, `ProfileRepository.ts`
- `src/api/application/profile/ProfileDTO.ts`, `GetProfileUseCase.ts`,
  `SaveProfileUseCase.ts` (+ `.test.ts` de cada)
- `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`
- `src/api/infrastructure/repositories/mock/MockProfileRepository.ts`
  (+ `.test.ts`)
- `src/actions/profile.ts`
- `src/app/profile/page.tsx`
- `src/app/profile/_components/ProfileForm.tsx`
- `DEPLOY.md` (raiz do repositório)

**Modificar (em `admin-photo`):**

- `src/api/infrastructure/repositories/RepositoryFactory.ts` — ganha
  `profile()`
- `Dockerfile` — `ARG`/`ENV` das duas variáveis Cloudinary
- `.github/workflows/CD.yml` — `build-args` no passo de build

**Modificar (em `app-photo`):**

- `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts` —
  ganha `unstable_cache` com tag `"profile"`

**Nenhum arquivo novo em `app-photo`** — `Profile` já é lido lá desde o
plano 1; este plano só acrescenta cache à leitura existente.

---

### Task 1: Domínio, DTO, casos de uso e repositório mock de Profile

**Files:**

- Create: `src/api/domain/profile/Profile.ts`, `ProfileRepository.ts`
- Create: `src/api/application/profile/ProfileDTO.ts`
- Create: `src/api/application/profile/GetProfileUseCase.ts`,
  `SaveProfileUseCase.ts` (+ `.test.ts` de cada)
- Create: `src/api/infrastructure/repositories/mock/MockProfileRepository.ts`
  (+ `.test.ts`)

**Interfaces:**

- Produces: `interface Profile { capaCaption: string; profissao: {
titulo: string; eyebrow: string; paragrafos: string[] }; familia: {
titulo: string; paragrafos: string[]; legendaFoto: string } }`,
  `interface ProfileRepository { get(): Promise<Profile | null>;
save(data: Profile): Promise<Profile> }`, `ProfileDTO` (idêntica a
  `Profile`), `class GetProfileUseCase`, `class SaveProfileUseCase`.

- [ ] **Step 1: Entidade e contrato de repositório**

Create `src/api/domain/profile/Profile.ts`:

```ts
export interface Profile {
  capaCaption: string;
  profissao: {
    titulo: string;
    eyebrow: string;
    paragrafos: string[];
  };
  familia: {
    titulo: string;
    paragrafos: string[];
    legendaFoto: string;
  };
}
```

Create `src/api/domain/profile/ProfileRepository.ts`:

```ts
import type { Profile } from "./Profile";

// Documento único (profile/main) — sem findAll/delete, sem update
// parcial. save() é sempre upsert completo: o formulário reenvia o
// objeto inteiro, nunca um Partial.
export interface ProfileRepository {
  get(): Promise<Profile | null>;
  save(data: Profile): Promise<Profile>;
}
```

- [ ] **Step 2: DTO e casos de uso**

Create `src/api/application/profile/ProfileDTO.ts`:

```ts
export interface ProfileDTO {
  capaCaption: string;
  profissao: {
    titulo: string;
    eyebrow: string;
    paragrafos: string[];
  };
  familia: {
    titulo: string;
    paragrafos: string[];
    legendaFoto: string;
  };
}
```

Create `src/api/application/profile/GetProfileUseCase.ts`:

```ts
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import type { ProfileDTO } from "./ProfileDTO";

// Retorna null quando o documento ainda não existe — diferente do
// GetProfileUseCase do app-photo, que lança (lá é uma falha real de
// produção sem fallback de UI). Aqui o admin precisa desse null pra
// renderizar um formulário vazio.
export class GetProfileUseCase {
  constructor(private readonly repo: ProfileRepository) {}

  async execute(): Promise<ProfileDTO | null> {
    const profile = await this.repo.get();
    return profile ? { ...profile } : null;
  }
}
```

Create `src/api/application/profile/SaveProfileUseCase.ts`:

```ts
import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import type { ProfileDTO } from "./ProfileDTO";

export class SaveProfileUseCase {
  constructor(private readonly repo: ProfileRepository) {}

  async execute(data: Profile): Promise<ProfileDTO> {
    const profile = await this.repo.save(data);
    return { ...profile };
  }
}
```

- [ ] **Step 3: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`
— `beforeEach`/`vi.resetModules()` desde já (mesmo padrão das outras
entidades, pro estado mutável a nível de módulo não vazar entre
testes):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockProfileRepository as MockProfileRepositoryClass } from "./MockProfileRepository";

let MockProfileRepository: typeof MockProfileRepositoryClass;

beforeEach(async () => {
  vi.resetModules();
  ({ MockProfileRepository } = await import("./MockProfileRepository"));
});

describe("MockProfileRepository", () => {
  it("retorna o profile sintético por padrão", async () => {
    const repo = new MockProfileRepository();
    const profile = await repo.get();
    expect(profile?.capaCaption).toBeTruthy();
    expect(profile?.profissao.paragrafos.length).toBeGreaterThan(0);
    expect(profile?.familia.paragrafos.length).toBeGreaterThan(0);
  });

  it("save substitui o documento inteiro", async () => {
    const repo = new MockProfileRepository();
    const novo = {
      capaCaption: "Novo texto de capa",
      profissao: { titulo: "T", eyebrow: "E", paragrafos: ["p1"] },
      familia: { titulo: "T2", paragrafos: ["p2"], legendaFoto: "legenda" },
    };
    const saved = await repo.save(novo);
    expect(saved).toEqual(novo);
    const fetched = await repo.get();
    expect(fetched).toEqual(novo);
  });
});
```

- [ ] **Step 4: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 5: Implementar o repositório mock**

Create `src/api/infrastructure/repositories/mock/MockProfileRepository.ts`
— transcrição fiel do texto real, **copiada verbatim** do
`MockProfileRepository.ts` do `app-photo` (plano 1), sobre uma variável
mutável em vez de uma constante:

```ts
import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";

// Transcrição fiel do texto real — mesmo texto do MockProfileRepository
// do app-photo (plano 1), fonte original: src/app/_components/About.tsx.
let PROFILE: Profile = {
  capaCaption: "Há vários anos marcando momentos",
  profissao: {
    titulo: "Profissão",
    eyebrow: "Formação e trajetória",
    paragrafos: [
      "Formada em Design Gráfico com pós-graduação em Marketing Digital, trago uma bagagem de mais de 10 anos em comunicação visual e edição.",
      "Minha prática na fotografia une técnica em estúdio, domínio de iluminação e direção de retratos a um propósito claro: capturar histórias com intenção e sensibilidade.",
      "Seja para fortalecer sua presença profissional ou registrar marcos da sua vida pessoal, meu compromisso é criar imagens que preservem exatamente a verdade e a essência daquilo que você viveu.",
    ],
  },
  familia: {
    titulo: "Família",
    paragrafos: [
      "Aprendi o verdadeiro valor da fotografia quando percebi como a saudade busca, nos detalhes, os momentos que não puderam ser registrados.",
      "Foi assim que entendi que fotografar vai muito além de uma imagem bonita: é criar pontes para o passado, preservando histórias, pessoas e a essência de quem amamos.",
      "Porque o tempo passa rápido, mas uma fotografia tem o poder de nos levar de volta exatamente para onde fomos felizes.",
    ],
    legendaFoto:
      "Quando estive no altar, ao lado de quem amo e com a nossa filha nos braços, percebi de vez: essas são as imagens que contam quem nós somos. Viver esse momento do outro lado da câmera me fez valorizar ainda mais cada segundo que registro. Ter esse dia guardado me traz de volta o abraço, o olhar e a certeza de que a família é o nosso bem mais precioso.",
  },
};

export class MockProfileRepository implements ProfileRepository {
  async get(): Promise<Profile | null> {
    return PROFILE;
  }

  async save(data: Profile): Promise<Profile> {
    PROFILE = data;
    return PROFILE;
  }
}
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`
Expected: PASS — 2 testes.

- [ ] **Step 7: Testes dos casos de uso, contra o mock**

Create `src/api/application/profile/GetProfileUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockProfileRepository } from "@/api/infrastructure/repositories/mock/MockProfileRepository";
import { GetProfileUseCase } from "./GetProfileUseCase";

describe("GetProfileUseCase", () => {
  it("retorna o profile do repositório", async () => {
    const profile = await new GetProfileUseCase(new MockProfileRepository()).execute();
    expect(profile?.capaCaption).toBeTruthy();
  });
});
```

Create `src/api/application/profile/SaveProfileUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockProfileRepository } from "@/api/infrastructure/repositories/mock/MockProfileRepository";
import { GetProfileUseCase } from "./GetProfileUseCase";
import { SaveProfileUseCase } from "./SaveProfileUseCase";

describe("SaveProfileUseCase", () => {
  it("salva e reflete na leitura seguinte", async () => {
    const repo = new MockProfileRepository();
    const novo = {
      capaCaption: "Capa atualizada",
      profissao: { titulo: "T", eyebrow: "E", paragrafos: ["p1"] },
      familia: { titulo: "T2", paragrafos: ["p2"], legendaFoto: "legenda" },
    };
    await new SaveProfileUseCase(repo).execute(novo);
    const fetched = await new GetProfileUseCase(repo).execute();
    expect(fetched?.capaCaption).toBe("Capa atualizada");
  });
});
```

- [ ] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros — `RepositoryFactory.ts` ainda não referencia
`ProfileRepositoryImpl` (Task 2), nada quebra por enquanto; os 4 testes
novos desta task passam (2 do mock + 1 de getProfile + 1 de save).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(profile): domínio, DTO, casos de uso e repositório mock

Profile é documento único (profile/main) — sem findAll/delete, save()
é upsert completo via .set(), nunca update() parcial. GetProfileUseCase
retorna null (não lança) quando o documento ainda não existe, diferente
do app-photo: o admin precisa desse null pra renderizar um formulário
vazio em vez de quebrar a página."
```

---

### Task 2: `ProfileRepositoryImpl` (Firestore) + `RepositoryFactory`

**Files:**

- Create: `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`

**Interfaces:**

- Produces: `class ProfileRepositoryImpl implements ProfileRepository`,
  `RepositoryFactory.profile(): ProfileRepository` (nome singular —
  mesma convenção já usada no `app-photo`).

- [ ] **Step 1: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`:

```ts
import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { getAdminDb } from "@/api/infrastructure/firebase/admin";

const COLLECTION = "profile";
const DOCUMENT_ID = "main";

// Documento único e fixo — igual o app-photo já lê (plano 1): sempre
// profile/main, nunca outro ID. save() é .set() completo (substitui o
// documento inteiro), nunca .update() parcial.
export class ProfileRepositoryImpl implements ProfileRepository {
  async get(): Promise<Profile | null> {
    const doc = await getAdminDb().collection(COLLECTION).doc(DOCUMENT_ID).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return {
      capaCaption: data.capaCaption,
      profissao: data.profissao,
      familia: data.familia,
    };
  }

  async save(data: Profile): Promise<Profile> {
    await getAdminDb().collection(COLLECTION).doc(DOCUMENT_ID).set(data);
    return data;
  }
}
```

- [ ] **Step 2: `RepositoryFactory` ganha `profile()`**

Modify `src/api/infrastructure/repositories/RepositoryFactory.ts` —
adiciona os imports de `ProfileRepository`/`ProfileRepositoryImpl`/
`MockProfileRepository` e a entrada `profile` (singular) no objeto
final:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { env } from "@/config/env.server";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { PackageRepositoryImpl } from "./PackageRepositoryImpl";
import { PhotoRepositoryImpl } from "./PhotoRepositoryImpl";
import { PlacementRepositoryImpl } from "./PlacementRepositoryImpl";
import { ProfileRepositoryImpl } from "./ProfileRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";
import { MockPackageRepository } from "./mock/MockPackageRepository";
import { MockPhotoRepository } from "./mock/MockPhotoRepository";
import { MockPlacementRepository } from "./mock/MockPlacementRepository";
import { MockProfileRepository } from "./mock/MockProfileRepository";

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
  profile: (): ProfileRepository =>
    shouldUseMock() ? new MockProfileRepository() : new ProfileRepositoryImpl(),
};
```

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(profile): repositório Firestore + RepositoryFactory.profile()

Nome singular (profile, não profiles) — mesma convenção já usada no
RepositoryFactory do app-photo pra este documento único."
```

---

### Task 3: Actions (sem ViewModel)

**Files:**

- Create: `src/actions/profile.ts`

**Interfaces:**

- Consumes: `assertSession` (plano 6), `callRevalidateWebhook` (plano
  7).
- Produces: `getProfile(): Promise<ProfileDTO | null>`,
  `saveProfile(data: Profile): Promise<ProfileDTO>` — ambas exigem
  sessão.

- [ ] **Step 1: Actions**

Create `src/actions/profile.ts`:

```ts
"use server";

import type { Profile } from "@/api/domain/profile/Profile";
import { GetProfileUseCase } from "@/api/application/profile/GetProfileUseCase";
import { SaveProfileUseCase } from "@/api/application/profile/SaveProfileUseCase";
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import { assertSession } from "@/lib/auth/session";
import { callRevalidateWebhook } from "./_lib/callRevalidateWebhook";

export async function getProfile(): Promise<ProfileDTO | null> {
  await assertSession();
  return new GetProfileUseCase(RepositoryFactory.profile()).execute();
}

export async function saveProfile(data: Profile): Promise<ProfileDTO> {
  await assertSession();
  const profile = await new SaveProfileUseCase(RepositoryFactory.profile()).execute(data);
  await callRevalidateWebhook("profile");
  return profile;
}
```

(Sem `toProfileViewModel`/arquivo de apresentação — `ProfileDTO` vai
direto pro componente, ver Global Constraints.)

- [ ] **Step 2: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(profile): actions com sessão + webhook de revalidação

getProfile() nunca invalida cache (leitura); saveProfile() chama
callRevalidateWebhook(\"profile\") depois de escrever. Sem ViewModel —
ProfileDTO vai direto pro formulário."
```

---

### Task 4: UI — formulário único (sem lista, sem modal)

**Files:**

- Create: `src/app/profile/page.tsx`
- Create: `src/app/profile/_components/ProfileForm.tsx`

**Interfaces:**

- Consumes: `getProfile`, `saveProfile` (Task 3), `Button`/`Input`/
  `Label` (copiados do Presencia, plano 6), `showToast`.

- [ ] **Step 1: Página (Server Component)**

Create `src/app/profile/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { getProfile } from "@/actions/profile";
import { ProfileForm } from "./_components/ProfileForm";

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Perfil (Quem sou)</h1>
      <ProfileForm initialProfile={profile} />
    </main>
  );
}
```

- [ ] **Step 2: Formulário — campos aninhados achatados em valores planos**

Create `src/app/profile/_components/ProfileForm.tsx` — mesma técnica de
`description`/`highlights` do `NicheForm` (plano 7) pros arrays de
parágrafos (`<textarea>`, uma linha por parágrafo), aqui achatando
também os grupos aninhados (`profissao`/`familia`) em campos de nível
único:

```tsx
"use client";

import { saveProfile } from "@/actions/profile";
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";
import { Button } from "@/lib/_components/ui/button";
import { Input } from "@/lib/_components/ui/input";
import { Label } from "@/lib/_components/ui/label";
import { showToast } from "@/lib/_utils/toast";
import { useState, useTransition } from "react";

interface ProfileFormValues {
  capaCaption: string;
  profissaoTitulo: string;
  profissaoEyebrow: string;
  profissaoParagrafos: string;
  familiaTitulo: string;
  familiaParagrafos: string;
  familiaLegendaFoto: string;
}

const EMPTY_FORM: ProfileFormValues = {
  capaCaption: "",
  profissaoTitulo: "",
  profissaoEyebrow: "",
  profissaoParagrafos: "",
  familiaTitulo: "",
  familiaParagrafos: "",
  familiaLegendaFoto: "",
};

function fromProfile(profile: ProfileDTO): ProfileFormValues {
  return {
    capaCaption: profile.capaCaption,
    profissaoTitulo: profile.profissao.titulo,
    profissaoEyebrow: profile.profissao.eyebrow,
    profissaoParagrafos: profile.profissao.paragrafos.join("\n"),
    familiaTitulo: profile.familia.titulo,
    familiaParagrafos: profile.familia.paragrafos.join("\n"),
    familiaLegendaFoto: profile.familia.legendaFoto,
  };
}

function toPayload(values: ProfileFormValues) {
  return {
    capaCaption: values.capaCaption.trim(),
    profissao: {
      titulo: values.profissaoTitulo.trim(),
      eyebrow: values.profissaoEyebrow.trim(),
      paragrafos: values.profissaoParagrafos
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    },
    familia: {
      titulo: values.familiaTitulo.trim(),
      paragrafos: values.familiaParagrafos
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      legendaFoto: values.familiaLegendaFoto.trim(),
    },
  };
}

export function ProfileForm({ initialProfile }: { initialProfile: ProfileDTO | null }) {
  const [values, setValues] = useState<ProfileFormValues>(
    initialProfile ? fromProfile(initialProfile) : EMPTY_FORM,
  );
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const saved = await saveProfile(toPayload(values));
        setValues(fromProfile(saved));
        showToast({ message: "Perfil salvo.", variant: "success" });
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Falha ao salvar o perfil.",
          variant: "error",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-6">
      <div>
        <Label htmlFor="capaCaption">Legenda da capa</Label>
        <Input
          id="capaCaption"
          value={values.capaCaption}
          onChange={(e) => set("capaCaption", e.target.value)}
        />
      </div>

      <fieldset className="grid gap-4 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Profissão</legend>
        <div>
          <Label htmlFor="profissaoTitulo">Título</Label>
          <Input
            id="profissaoTitulo"
            value={values.profissaoTitulo}
            onChange={(e) => set("profissaoTitulo", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="profissaoEyebrow">Eyebrow</Label>
          <Input
            id="profissaoEyebrow"
            value={values.profissaoEyebrow}
            onChange={(e) => set("profissaoEyebrow", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="profissaoParagrafos">Parágrafos (um por linha)</Label>
          <textarea
            id="profissaoParagrafos"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            rows={5}
            value={values.profissaoParagrafos}
            onChange={(e) => set("profissaoParagrafos", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Família</legend>
        <div>
          <Label htmlFor="familiaTitulo">Título</Label>
          <Input
            id="familiaTitulo"
            value={values.familiaTitulo}
            onChange={(e) => set("familiaTitulo", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="familiaParagrafos">Parágrafos (um por linha)</Label>
          <textarea
            id="familiaParagrafos"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            rows={5}
            value={values.familiaParagrafos}
            onChange={(e) => set("familiaParagrafos", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="familiaLegendaFoto">Legenda da foto</Label>
          <textarea
            id="familiaLegendaFoto"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            rows={4}
            value={values.familiaLegendaFoto}
            onChange={(e) => set("familiaLegendaFoto", e.target.value)}
          />
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: sem erros.

- [ ] **Step 4: Smoke test manual (precisa de credenciais reais do Firebase)**

Documentar aqui, não executar sem credenciais: logar, abrir `/profile`,
confirmar que o formulário vem pré-preenchido (ou vazio, se o
documento ainda não existir), editar um campo, salvar, recarregar a
página e confirmar que a mudança persistiu.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(profile): UI de formulário único, sem lista nem modal

Campos aninhados (profissao/familia) achatados em ProfileFormValues —
mesma técnica de textarea multi-linha do NicheForm pros arrays de
parágrafos. Sem DataTable: é a primeira tela do admin sem lista
nenhuma."
```

---

### Task 5: `app-photo` — leitura pública ganha a tag `"profile"`

**Files:**

- Modify: `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`
  (`app-photo`)

**Interfaces:**

- Consumes: `unstable_cache` (`next/cache`).
- Produces: mesma interface pública de sempre — `get()` — agora
  cacheada com tag `"profile"`.

- [ ] **Step 1: Envolver a leitura em `unstable_cache`**

Replace `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`:

```ts
import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "profile";
const DOCUMENT_ID = "main";

// Documento único e fixo — diferente de niches (slug como ID) e de
// packages/placements (query com where/orderBy), aqui não há nenhuma
// variação possível de "qual documento": é sempre profile/main. Sem
// índice composto, sem paginação. unstable_cache dá tag pra essa
// leitura — admin-photo chama POST /api/revalidate →
// revalidateTag("profile", "max") quando escreve.
const getProfileDocument = unstable_cache(
  async (): Promise<Profile | null> => {
    const doc = await db.collection(COLLECTION).doc(DOCUMENT_ID).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return {
      capaCaption: data.capaCaption,
      profissao: data.profissao,
      familia: data.familia,
    };
  },
  ["profile", "get"],
  { tags: ["profile"] },
);

export class ProfileRepositoryImpl implements ProfileRepository {
  get(): Promise<Profile | null> {
    return getProfileDocument();
  }
}
```

- [ ] **Step 2: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros — `MockProfileRepository`/testes existentes (plano

1. continuam passando sem alteração.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(profile): leitura pública ganha cache com tag \"profile\"

unstable_cache envolve get() — mesmo padrão de niches/packages/
placements (planos 7-10). admin-photo chama POST /api/revalidate →
revalidateTag(\"profile\", \"max\") quando escreve."
```

---

### Task 6: Corrigir o pipeline de build — variáveis Cloudinary nunca propagadas

**Files:**

- Modify: `Dockerfile` (`admin-photo`)
- Modify: `.github/workflows/CD.yml` (`admin-photo`)

**Interfaces:** nenhuma nova — corrige a propagação de
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`/`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
(já existem em `src/config/env.client.ts` desde o plano 9) através do
build de produção.

- [ ] **Step 1: Confirmar o gap antes de corrigir**

Run: `grep -n "NEXT_PUBLIC_CLOUDINARY" Dockerfile .github/workflows/CD.yml`
Expected: nenhum resultado — as duas variáveis não aparecem em nenhum
dos dois arquivos, confirmando que nunca foram propagadas pro build de
produção desde que o plano 9 as criou em `env.client.ts`. Variáveis
`NEXT_PUBLIC_*` são embutidas no bundle do client **no momento do
build**, não em runtime — sem isso, o widget de upload em produção
tentaria subir fotos com `cloudName`/`uploadPreset` como `undefined`.

- [ ] **Step 2: `Dockerfile` ganha os `ARG`/`ENV` do Cloudinary**

Modify `Dockerfile` — no stage "builder", substitui o comentário
desatualizado do plano 6 por `ARG`/`ENV` reais:

```dockerfile
# Stage 2 – builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars são embutidas no bundle do client no build — as duas
# do Cloudinary existem desde o plano 9 (upload direto do browser).
# NEXT_PUBLIC_APP_VERSION é injetada do package.json por next.config.ts
# — não precisa de ARG.
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN SKIP_ENV_VALIDATION=1 npm run build
```

(O restante do `Dockerfile` — stages "deps" e "runner" — não muda.)

- [ ] **Step 3: `CD.yml` passa os `build-args`**

Modify `.github/workflows/CD.yml` — no passo "Build and Push Docker
Image", adiciona `build-args`. Cloud name e preset não são segredos
(são valores públicos, embutidos no bundle do client de qualquer
forma) — usa o contexto `vars` do GitHub Actions (Settings → Secrets
and variables → Actions → Variables), não `secrets`:

```yaml
- name: Build and Push Docker Image
  uses: docker/build-push-action@v6
  with:
    context: .
    file: ./Dockerfile
    push: true
    build-args: |
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${{ vars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=${{ vars.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET }}
    tags: |
      ghcr.io/${{ github.repository }}:latest
      ghcr.io/${{ github.repository }}:${{ github.event.workflow_run.head_sha }}
```

- [ ] **Step 4: Confirmar que as variáveis aparecem agora**

Run: `grep -n "NEXT_PUBLIC_CLOUDINARY" Dockerfile .github/workflows/CD.yml`
Expected: 4 ocorrências — `ARG`/`ENV` × 2 no `Dockerfile`, 2 linhas em
`build-args` no `CD.yml`.

- [ ] **Step 5: Verificação de sintaxe (sem daemon do Docker disponível neste ambiente)**

Run: `docker info 2>&1 | tail -3`
Expected: `failed to connect to the docker API` — confirma que não há
daemon acessível aqui, então `docker build` de verdade não roda neste
ambiente. A verificação possível é ler o `Dockerfile` de novo e
confirmar visualmente que a sintaxe `ARG`/`ENV` está correta (mesma
forma usada em qualquer Dockerfile multi-stage padrão) — build real
fica pro CI, que tem o daemon.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix(deploy): propagar variáveis NEXT_PUBLIC_CLOUDINARY_* pro build

Dockerfile e CD.yml ainda carregavam um comentário do plano 6 dizendo
que nenhuma NEXT_PUBLIC_* existia — mas o plano 9 criou duas
(CLOUD_NAME/UPLOAD_PRESET) e nunca atualizou o pipeline de build.
NEXT_PUBLIC_* é embutida no bundle do client NO MOMENTO DO BUILD, não
em runtime — sem essa correção, um build de produção hoje embutiria
undefined nessas duas variáveis, quebrando o widget de upload
silenciosamente."
```

---

### Task 7: Checklist de deploy real (documentação — nada aqui é executado)

**Files:**

- Create: `DEPLOY.md` (`admin-photo`, raiz do repositório)

Um arquivo de verdade no repositório do `admin-photo` — não só um
parágrafo dentro deste plano — porque é lá que quem for fazer o deploy
vai procurar, não nos planos do `app-photo`. Nenhum destes passos é
executado por este plano — todos exigem acesso que este ambiente não
tem (conta do GitHub, SSH da VPS compartilhada, painel do Cloudinary,
provedor de DNS).

- [ ] **Step 1: Escrever o checklist em `DEPLOY.md`**

Create `admin-photo/DEPLOY.md`:

```markdown
# Deploy do admin-photo

Checklist pro primeiro deploy real — nenhum destes passos foi
executado ainda (planos 6-11 só prepararam o código; execução exige
acesso ao GitHub, SSH da VPS compartilhada, painel do Cloudinary e o
provedor de DNS, nenhum disponível durante a implementação).

1. **Criar o repositório `admin-photo` no GitHub** (privado, mesma
   organização de `app-photo`) e adicioná-lo como remote:
   `git remote add origin git@github.com:<org>/admin-photo.git`.
2. **Push da branch `main`** — `git push -u origin main`. Isso dispara
   o workflow `CI` pela primeira vez.
3. **Segredos do repositório** (Settings → Secrets and variables →
   Actions → Secrets): `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` — mesmos
   três que o `CD.yml` já espera (`appleboy/ssh-action`).
4. **Variáveis do repositório** (mesma tela, aba Variables):
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
   — consumidas pela Task 6 deste plano.
5. **Projeto Firebase real** — criar (ou reaproveitar um existente da
   Denise) um projeto Firebase de produção. Atualizar
   `admin-photo/.firebaserc`, campo `"default"`, do placeholder
   (`"TODO-preencher-com-o-id-do-projeto-firebase-real"`, plano 6) pro
   ID real. `app-photo` também precisa apontar pro mesmo projeto (fora
   do escopo deste plano — confirmar o `.firebaserc` de lá também).
6. **Publicar os índices compostos do Firestore** —
   `firebase deploy --only firestore:indexes` rodado **de dentro do
   `app-photo`** (`packages`: plano 8; `placements` × 2: plano 10).
   **Não** rodar de dentro do `admin-photo` — seu `firestore.indexes.json`
   é deliberadamente vazio (nenhuma query do admin, planos 7-10, precisa
   de índice composto — ver Global Constraints de cada plano).
7. **Preset unsigned do Cloudinary** — criar no painel do Cloudinary
   (Settings → Upload → Upload presets → Signing Mode: **Unsigned**).
   Prerequisito já documentado desde o plano 9, ainda pendente.
8. **Serviço `admin-photo` no `docker-compose.yml` da VPS** — arquivo
   fora de qualquer repositório rastreado aqui (é da infraestrutura
   compartilhada). Precisa de um bloco de serviço novo, mais um arquivo
   `.env.admin-photo` na VPS com: `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
   `FIREBASE_WEB_API_KEY`, `REVALIDATE_SECRET`, `APP_PHOTO_URL`,
   `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_PHOTO_TAG`
   (gerenciada pelo próprio `CD.yml`), `ADMIN_PHOTO_DOMAIN`.
9. **DNS** — apontar `admin.denisegalvao.com.br` (decisão já tomada no
   brainstorming, ver spec) pra VPS.
10. **Primeiro deploy real** — depois dos passos 1-9, um push (ou merge
    de PR) em `main` já dispara `CI` → `CD` de ponta a ponta.
    `REVALIDATE_SECRET`/`APP_PHOTO_URL` também precisam estar
    configuradas no `app-photo` em produção (fora do escopo deste
    plano — `app-photo` já roda há mais tempo, confirmar que essas
    variáveis já estão no ambiente de produção dele).
```

- [ ] **Step 2: Commit**

```bash
git add DEPLOY.md
git commit -m "docs(deploy): checklist completo pro primeiro deploy real

10 passos, todos exigindo acesso que este ambiente não tem (GitHub,
SSH da VPS, painel do Cloudinary, DNS) — nenhum é executado por este
plano. DEPLOY.md fica na raiz do admin-photo, não só nos planos do
app-photo, pra quem for rodar o deploy de verdade encontrar sem
precisar reconstruir o raciocínio."
```

---

### Task 8: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa em `admin-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY FIREBASE_WEB_API_KEY=dummy-key npm run build`
Expected: sem erros.

- [ ] **Step 2: Suíte completa em `app-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros.

- [ ] **Step 3: Smoke test manual completo (precisa de credenciais reais)**

Documentar aqui, não executar sem credenciais: com Firebase real
configurado, logar no admin, abrir `/profile`, editar um campo,
salvar, confirmar no `app-photo` (seção "Quem sou" da home) que o
texto mudou sem reiniciar o servidor — valida o webhook +
`unstable_cache` de ponta a ponta pra esta última entidade.

- [ ] **Step 4: Commit final (se sobrou algo solto) em cada repo**

```bash
git -C /Users/cesarpisa/Projects/lp-fotografia/admin-photo status --short
git -C /Users/cesarpisa/Projects/lp-fotografia/app-photo status --short
# se houver pendências em qualquer um, git add -A && git commit -m "..."
# app-photo: push fica a critério do usuário (branch feat/nicho-firestore
# já tem PR #2 aberta); admin-photo continua só local até a Task 7 do
# checklist (criação do remote) ser executada por quem tiver acesso.
```

---

## Depois deste plano

Não há próximo plano no roteiro original — `niche`, `package`, `photo`,
`placement` e `profile` têm CRUD completo (ou get+save, no caso de
`profile`) no admin, o site público lê tudo por trás de cache
invalidável, e o pipeline de build está correto. O que resta é
inteiramente operacional: executar o checklist da Task 7 (acesso ao
GitHub/VPS/Cloudinary/DNS, fora do alcance deste ambiente), rodar o
primeiro deploy real, e então a Denise usa o admin pra ajustar o
conteúdo do site sem depender de mais nenhum plano de implementação.
