# admin-photo — CRUD de Nicho — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Primeira entidade de conteúdo do admin — CRUD completo de `Niche`
(criar, editar, remover, listar), com a leitura pública equivalente em
`app-photo` ganhando cache por tag (`"niches"`), invalidado pelo webhook
que o plano 6 já construiu.

**Architecture:** Mesmo padrão de camadas dos planos 1-5 do `app-photo`
(domain/application/infrastructure), agora com o lado de escrita — que
não tem precedente no `app-photo` (só lê). Confirmado contra o CRUD
completo de `Coupon` no `Presencia/web-admin-console`: ID do documento é
a chave de negócio (`slug`, não gerado), `create`/`update` usam
`.doc(id).set()`/`.update()` (nunca `.add()`), `delete` é hard delete.
`RepositoryFactory` ganha fallback mock de verdade agora (Task 1) — o
plano 6 deixou vazio porque não havia entidade nenhuma pra mockar.

Leitura pública: `NicheRepositoryImpl` do `app-photo` (Firestore Admin
SDK, não `fetch`) precisa de `unstable_cache` pra ganhar uma tag
invalidável — confirmado contra `node_modules/next/dist/docs` (este
projeto **não** tem `cacheComponents` ligado no `next.config.ts`, então
é o modelo "Previous" de cache: `unstable_cache(fn, keyParts, {tags})` +
`revalidateTag(tag, perfil)`, não `"use cache"`/`cacheTag()`).

**Tech Stack:** Mesmo dos planos 6 (admin-photo) e 1-5 (app-photo).
Formulário com campos de lista (`description[]`, `highlights[]`) via
`<textarea>` linha-a-linha — sem lib de formulário (decisão já tomada no
plano 6: nada usa `react-hook-form`/zod-resolver de verdade nos
repos-irmãos).

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
(seções "Modelo de conteúdo" — `Niche`, "Contrato Firestore de produção" —
`niches/{slug}`, "Testes", "Invalidação de cache entre repositórios")
**Planos anteriores:** `2026-09-09-admin-photo-scaffold-auth.md` (6/10) —
login, `RepositoryFactory` vazio, webhook `/api/revalidate` já existem.
**Precedente investigado:** CRUD completo de `Coupon` em
`Presencia/web-admin-console` (`src/api/{domain,application,
infrastructure,presentation}/coupon/*`, `src/actions/coupons.ts`,
`src/app/(admin)/coupons/**`) — mesma forma pra `Niche`.

## Global Constraints

- **Sem cascade delete de `Placement`** — remover um nicho não limpa
  `placements` com `refId` apontando pra ele. `GetPhotosBySurfaceUseCase`
  (plano 3, `app-photo`) já ignora placement órfão silenciosamente; um
  placement de nicho órfão é dado morto no Firestore, não um bug visível.
  Limpeza fica pra um plano futuro, se a Denise realmente remover nichos
  (não é o caso hoje — os 7 nichos reais são fixos).
- **`slug` é imutável** — é o ID do documento; editar um nicho nunca
  troca o slug (trocar exigiria apagar e recriar, fora de escopo).
- **`create` rejeita slug duplicado** — diferente do `Coupon` do
  Presencia (que faz upsert silencioso via `.doc(code).set()`), aqui um
  slug repetido provavelmente é erro de digitação num campo raramente
  preenchido (só 7 nichos reais existem) — mais seguro falhar alto que
  sobrescrever sem avisar.
- **Toda Server Action chama `assertSession()` antes do caso de uso** —
  sem parâmetro de papéis (plano 6 já decidiu isso).
- **Toda Server Action que grava dado chama o webhook `/api/revalidate`
  do `app-photo`** depois de escrever no Firestore — best-effort, não
  desfaz a escrita se o webhook falhar (plano 6, já documentado).
- Sem `cacheComponents` no `next.config.ts` do `app-photo` — a tag usa
  `unstable_cache`, não `"use cache"`/`cacheTag()`.

---

## Mapa de arquivos

**Criar (em `admin-photo`):**

- `src/api/domain/niche/Niche.ts`, `NicheRepository.ts`
- `src/api/application/niche/NicheDTO.ts`, `CreateNicheUseCase.ts`,
  `UpdateNicheUseCase.ts`, `DeleteNicheUseCase.ts`, `GetNichesUseCase.ts`,
  `GetNicheBySlugUseCase.ts` (+ `.test.ts` de cada)
- `src/api/presentation/niche/NicheViewModel.ts`
- `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`
- `src/api/infrastructure/repositories/mock/MockNicheRepository.ts` (+ `.test.ts`)
- `src/actions/niches.ts`
- `src/actions/_lib/callRevalidateWebhook.ts`
- `src/app/niches/page.tsx`
- `src/app/niches/_components/NichesManager.tsx`, `NicheForm.tsx`,
  `NewNicheModal.tsx`, `EditNicheModal.tsx`

**Modificar (em `admin-photo`):**

- `src/config/env.server.ts` — Firebase volta a ser opcional (fallback
  mock real, Task 1)
- `src/api/infrastructure/repositories/RepositoryFactory.ts` — ganha
  `niches()` + `shouldUseMock()`
- `.env.example` — `REVALIDATE_SECRET`, `APP_PHOTO_URL` (só agora fazem
  sentido — a primeira Server Action que escreve dado existe)

**Modificar (em `app-photo`):**

- `src/api/infrastructure/repositories/NicheRepositoryImpl.ts` — ganha
  `unstable_cache` com tag `"niches"`

---

### Task 1: `RepositoryFactory` ganha fallback mock de verdade

**Files:**

- Modify: `src/config/env.server.ts`
- Modify: `src/config/env.server.test.ts` (criar se não existir)
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`

**Interfaces:**

- Produces: `hasFirebaseCredentials()`, `isProductionRuntime()`,
  `shouldUseMock()` (mesmo trio do `app-photo`,
  `RepositoryFactory.ts`).

- [ ] **Step 1: Firebase volta a ser opcional**

Em `src/config/env.server.ts`, troca:

```ts
FIREBASE_PROJECT_ID: z.string().min(1),
FIREBASE_CLIENT_EMAIL: z.string().email(),
FIREBASE_PRIVATE_KEY: z.string().min(1),
FIREBASE_WEB_API_KEY: z.string().min(1),
```

por:

```ts
// Opcionais aqui de propósito: a ausência das três é um estado válido
// (modo mock em dev/test/CI) — RepositoryFactory decide o que fazer com
// isso, mesmo padrão do app-photo. FIREBASE_WEB_API_KEY continua
// obrigatória: login não tem modo mock (chama a API REST de verdade),
// diferente das entidades.
FIREBASE_PROJECT_ID: z.string().min(1).optional(),
FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
FIREBASE_WEB_API_KEY: z.string().min(1),
```

- [ ] **Step 2: `admin.ts` lança erro claro se usado sem credenciais**

Em `src/api/infrastructure/firebase/admin.ts`, `getAdminApp()` já falha
(o SDK do Firebase reclama de `projectId`/`clientEmail`/`privateKey`
undefined) — mas com uma mensagem genérica do SDK. Adiciona uma checagem
explícita antes:

```ts
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Credenciais do Firebase Admin ausentes — RepositoryFactory deveria ter caído pro mock antes de chegar aqui.",
    );
  }
  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}
```

- [ ] **Step 3: `RepositoryFactory` real**

Replace `src/api/infrastructure/repositories/RepositoryFactory.ts`:

```ts
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { env } from "@/config/env.server";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";

function hasFirebaseCredentials(): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

// `next build` roda com NODE_ENV=production mesmo sem credenciais reais
// (CI não tem segredos do Firebase) — NODE_ENV sozinho não distingue
// "gerando o build" de "servindo tráfego real". NEXT_PHASE distingue: só
// a segunda precisa falhar alto na ausência de credenciais. Mesmo padrão
// do app-photo.
function isProductionRuntime(): boolean {
  return env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD;
}

// Nome deliberadamente sem prefixo "use": eslint-plugin-react-hooks trata
// qualquer função "use*" como Hook e barra chamá-la fora de componente.
function shouldUseMock(): boolean {
  if (isProductionRuntime()) return false;
  return !hasFirebaseCredentials();
}

export const RepositoryFactory = {
  niches: (): NicheRepository =>
    shouldUseMock() ? new MockNicheRepository() : new NicheRepositoryImpl(),
};
```

(Nota: login/sessão **não** passam por `RepositoryFactory` — usam
`getAdminAuth()` direto, sempre real, sem mock. Só entidades de
conteúdo caem no fallback.)

- [ ] **Step 4: Teste de `env.server.ts` cobrindo a ausência do Firebase**

`parseEnv()` (já existente em `src/config/env.server.ts`) usa
`safeParse` e só **lança** quando `NODE_ENV === "production"`; fora
disso, dá `console.warn` e segue com `process.env` bruto — o teste
abaixo já reflete esse comportamento real, não o hipotético.

Create `src/config/env.server.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SKIP_ENV_VALIDATION;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env.server", () => {
  it("aceita ausência das três variáveis do Firebase fora de produção", async () => {
    process.env.NODE_ENV = "test";
    process.env.FIREBASE_WEB_API_KEY = "chave";
    const { env } = await import("./env.server");
    expect(env.FIREBASE_PROJECT_ID).toBeUndefined();
  });

  it("lança em produção quando FIREBASE_WEB_API_KEY está ausente", async () => {
    process.env.NODE_ENV = "production";
    process.env.FIREBASE_WEB_API_KEY = "";
    await expect(import("./env.server")).rejects.toThrow();
  });
});
```

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros — `RepositoryFactory.ts` ainda não compila sozinho
(`NicheRepositoryImpl`/`MockNicheRepository` não existem até a Task 2/3);
se o typecheck falhar por isso, é esperado — vira erro real só depois
da Task 3. Rodar `npm run test` isolado (`npx vitest run
src/config/env.server.test.ts`) já é suficiente pra fechar esta task.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(niche): RepositoryFactory ganha fallback mock real

env.server.ts volta a ter Firebase opcional (FIREBASE_WEB_API_KEY
continua obrigatória — login não tem modo mock). shouldUseMock()/
isProductionRuntime() replicam o padrão já estabelecido no app-photo."
```

---

### Task 2: Domínio, DTO, casos de uso e repositório mock de Niche

**Files:**

- Create: `src/api/domain/niche/Niche.ts`, `NicheRepository.ts`
- Create: `src/api/application/niche/NicheDTO.ts`
- Create: `src/api/application/niche/GetNichesUseCase.ts`,
  `GetNicheBySlugUseCase.ts`, `CreateNicheUseCase.ts`,
  `UpdateNicheUseCase.ts`, `DeleteNicheUseCase.ts` (+ `.test.ts` de cada)
- Create: `src/api/infrastructure/repositories/mock/MockNicheRepository.ts` (+ `.test.ts`)

**Interfaces:**

- Produces: `interface Niche { slug, title, subtitle, intro,
description: string[], highlights: string[], closingLine,
showAsEventTeaser, order, eventOrder: number | null }`,
  `interface NicheRepository { findAll(): Promise<Niche[]>;
findBySlug(slug): Promise<Niche | null>; create(data: Omit<Niche, never>):
Promise<Niche>; update(slug, data: Partial<Omit<Niche, "slug">>):
Promise<Niche>; delete(slug): Promise<void> }`, `NicheDTO` (idêntica a
  `Niche`), `class Create/Update/Delete/Get/GetBySlugNicheUseCase`.

- [ ] **Step 1: Entidade e contrato de repositório**

Create `src/api/domain/niche/Niche.ts`:

```ts
export interface Niche {
  slug: string;
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

Create `src/api/domain/niche/NicheRepository.ts`:

```ts
import type { Niche } from "./Niche";

export interface NicheRepository {
  findAll(): Promise<Niche[]>;
  findBySlug(slug: string): Promise<Niche | null>;
  create(data: Niche): Promise<Niche>;
  update(slug: string, data: Partial<Omit<Niche, "slug">>): Promise<Niche>;
  delete(slug: string): Promise<void>;
}
```

(`create` recebe o `Niche` inteiro, `slug` incluso — diferente do
`Coupon` do Presencia, que gera parte dos campos no repositório; aqui
não há nada computado no lado do repositório, então o objeto completo
já é o contrato mais simples.)

- [ ] **Step 2: DTO e casos de uso de leitura**

Create `src/api/application/niche/NicheDTO.ts`:

```ts
export interface NicheDTO {
  slug: string;
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

Create `src/api/application/niche/GetNichesUseCase.ts`:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { NicheDTO } from "./NicheDTO";

export class GetNichesUseCase {
  constructor(private readonly repo: NicheRepository) {}

  async execute(): Promise<NicheDTO[]> {
    const niches = await this.repo.findAll();
    return niches.map((n) => ({ ...n }));
  }
}
```

Create `src/api/application/niche/GetNicheBySlugUseCase.ts`:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { NicheDTO } from "./NicheDTO";

export class GetNicheBySlugUseCase {
  constructor(private readonly repo: NicheRepository) {}

  async execute(slug: string): Promise<NicheDTO | null> {
    const niche = await this.repo.findBySlug(slug);
    return niche ? { ...niche } : null;
  }
}
```

- [ ] **Step 3: Casos de uso de escrita**

Create `src/api/application/niche/CreateNicheUseCase.ts`:

```ts
import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { NicheDTO } from "./NicheDTO";

export class CreateNicheUseCase {
  constructor(private readonly repo: NicheRepository) {}

  async execute(data: Niche): Promise<NicheDTO> {
    const existing = await this.repo.findBySlug(data.slug);
    if (existing) {
      throw new Error(`Já existe um nicho com o slug "${data.slug}".`);
    }
    const niche = await this.repo.create(data);
    return { ...niche };
  }
}
```

Create `src/api/application/niche/UpdateNicheUseCase.ts`:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheDTO } from "./NicheDTO";

export class UpdateNicheUseCase {
  constructor(private readonly repo: NicheRepository) {}

  async execute(slug: string, data: Partial<Omit<Niche, "slug">>): Promise<NicheDTO> {
    const niche = await this.repo.update(slug, data);
    return { ...niche };
  }
}
```

Create `src/api/application/niche/DeleteNicheUseCase.ts`:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";

export class DeleteNicheUseCase {
  constructor(private readonly repo: NicheRepository) {}

  async execute(slug: string): Promise<void> {
    await this.repo.delete(slug);
  }
}
```

- [ ] **Step 4: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockNicheRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "./MockNicheRepository";

const SAMPLE = {
  slug: "teste",
  title: "Título",
  subtitle: "Subtítulo",
  intro: "Intro",
  description: ["linha 1", "linha 2"],
  highlights: ["destaque 1"],
  closingLine: "Fechamento",
  showAsEventTeaser: false,
  order: 99,
  eventOrder: null,
};

describe("MockNicheRepository", () => {
  it("cria e encontra por slug", async () => {
    const repo = new MockNicheRepository();
    await repo.create(SAMPLE);
    const found = await repo.findBySlug("teste");
    expect(found?.title).toBe("Título");
  });

  it("lista todos ordenados por order", async () => {
    const repo = new MockNicheRepository();
    const all = await repo.findAll();
    expect(all.map((n) => n.order)).toEqual([...all.map((n) => n.order)].sort((a, b) => a - b));
  });

  it("atualiza campos parciais sem afetar os demais", async () => {
    const repo = new MockNicheRepository();
    await repo.create(SAMPLE);
    const updated = await repo.update("teste", { title: "Novo título" });
    expect(updated.title).toBe("Novo título");
    expect(updated.subtitle).toBe("Subtítulo");
  });

  it("remove por slug", async () => {
    const repo = new MockNicheRepository();
    await repo.create(SAMPLE);
    await repo.delete("teste");
    expect(await repo.findBySlug("teste")).toBeNull();
  });

  it("retorna null pra slug inexistente", async () => {
    const repo = new MockNicheRepository();
    expect(await repo.findBySlug("nao-existe")).toBeNull();
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockNicheRepository.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 6: Implementar o repositório mock, com os 7 nichos reais**

Create `src/api/infrastructure/repositories/mock/MockNicheRepository.ts` —
transcrição fiel dos 7 nichos reais, **copiada verbatim** do
`MockNicheRepository.ts` do `app-photo`
(`src/api/infrastructure/repositories/mock/MockNicheRepository.ts`,
plano 1) — mesmo texto, mesma ordem — mas com `findAll`/`findBySlug`
somados a `create`/`update`/`delete` operando sobre um array mutável em
vez de uma constante:

```ts
import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";

// Transcrição fiel dos 7 nichos reais — mesmo texto do MockNicheRepository
// do app-photo (plano 1). Aqui o array é mutável: create/update/delete
// simulam escrita real, pra testar o CRUD completo sem Firestore.
let NICHES: Niche[] = [
  {
    slug: "retratos-profissionais",
    title: "Retratos Profissionais",
    subtitle: "Retratos para marca e carreira",
    intro:
      "Retratos que funcionam no LinkedIn, no site e no material da sua marca, com direção de pose e luz de estúdio controlada.",
    description: [
      "Começamos com uma conversa rápida sobre onde as imagens serão usadas: perfil, site institucional, imprensa ou redes sociais. A partir daí eu monto a luz e a direção certa para o seu rosto.",
      "Durante o ensaio eu conduzo pose por pose: você não precisa saber posar. O resultado é um material sóbrio, atual e coerente com a sua profissão.",
    ],
    highlights: ["Estúdio com luz contínua", "Direção de pose completa", "Fundo neutro ou preto"],
    closingLine: "Transforme sua imagem em uma ferramenta poderosa de comunicação e presença.",
    showAsEventTeaser: false,
    order: 0,
    eventOrder: null,
  },
  {
    slug: "making-of-da-noiva",
    title: "Making-of da Noiva",
    subtitle: "Preparação antes do grande dia",
    intro: "",
    description: [],
    highlights: [],
    closingLine: "",
    showAsEventTeaser: true,
    order: 1,
    eventOrder: 2,
  },
  {
    slug: "aniversario-e-eventos",
    title: "Aniversário e Eventos",
    subtitle: "Festa, detalhes e convidados",
    intro:
      "Cobertura da festa do começo ao fim: decoração antes dos convidados, o momento do parabéns e os retratos espontâneos.",
    description: [
      "Chego antes para registrar a decoração ainda intacta e acompanho a festa em fotojornalismo, sem interromper o que está acontecendo.",
      "Faço também retratos rápidos com a família e os convidados principais, sempre respeitando o ritmo do evento.",
    ],
    highlights: ["Registro da decoração", "Cobertura documental", "Retratos com convidados"],
    closingLine:
      "Cada evento é único e merece ser lembrado com a mesma intensidade com que foi vivido.",
    showAsEventTeaser: true,
    order: 2,
    eventOrder: 1,
  },
  {
    slug: "casamento-civil",
    title: "Casamento Civil",
    subtitle: "Pré-wedding / pós-cerimônia",
    intro:
      'Viva cada etapa do seu casamento com intensidade e significado, enquanto cada detalhe é registrado com sensibilidade, elegância e direção profissional. Do pré-wedding ao grande "sim", criamos memórias que contam a sua história de forma autêntica e atemporal.',
    description: [
      "Cada momento é conduzido com orientação completa, captando emoções reais, conexões e a essência do casal, com um olhar atento aos detalhes que tornam esse dia único.",
      "A cobertura da cerimônia civil é feita no Cartório de Toledo; consulte valores de deslocamento para locais fora da região.",
    ],
    highlights: [
      "Pré-wedding em local escolhido pelo casal",
      "Cobertura completa da cerimônia civil",
      "Adicional Storymaker em vídeo",
    ],
    closingLine:
      "Mais do que fotografias, entregamos lembranças que contam a sua história com emoção, beleza e verdade.",
    showAsEventTeaser: true,
    order: 3,
    eventOrder: 0,
  },
  {
    slug: "comercial",
    title: "Comercial",
    subtitle: "Produto e marca em foco",
    intro:
      "Fortaleça a imagem da sua marca com fotografias estratégicas, pensadas para transmitir profissionalismo, identidade e conexão com o seu público. Cada ensaio é conduzido com olhar técnico e direcionamento criativo, alinhado aos objetivos do seu negócio.",
    description: [
      "As sessões são planejadas de acordo com o posicionamento da marca, com orientação completa de poses, enquadramentos e estética visual, garantindo imagens que valorizam seus produtos, equipe e presença no mercado.",
      "Os ensaios podem contar com modelos indicados pela empresa ou sugeridos pela fotógrafa. Empresas que buscam constância têm condições especiais para planos mensais, e o segmento corporativo conta com descontos exclusivos para contratos integrados com marketing.",
    ],
    highlights: [
      "Produção externa ou no local do cliente",
      "Modelos da empresa ou indicados pela fotógrafa",
      "Descontos para planos mensais e contratos integrados",
    ],
    closingLine: "Invista em uma imagem que comunica, posiciona e gera valor para o seu negócio.",
    showAsEventTeaser: false,
    order: 4,
    eventOrder: null,
  },
  {
    slug: "familia",
    title: "Família",
    subtitle: "Retratos de quem é seu",
    intro:
      "Fotos de família sem pose forçada: brincadeira, colo e as manias de cada um viram registro.",
    description: [
      "Trabalho com dinâmicas simples para as crianças se soltarem: caminhar, abraçar, contar segredo. As melhores imagens quase sempre aparecem entre uma pose e outra.",
      "Pode ser no estúdio ou em uma locação externa (parque, casa, praia). Famílias com pets são muito bem-vindas.",
    ],
    highlights: ["Estúdio ou locação externa", "Dinâmicas para crianças", "Pets bem-vindos"],
    closingLine: "Mais do que fotos, entregamos memórias cheias de afeto, conexão e significado.",
    showAsEventTeaser: false,
    order: 5,
    eventOrder: null,
  },
  {
    slug: "gestante",
    title: "Gestante",
    subtitle: "Ensaio de espera",
    intro:
      "Um ensaio calmo para registrar a barriga, o companheiro e a expectativa, no estúdio ou em uma locação com luz natural.",
    description: [
      "O ideal é fotografar entre a 30ª e a 36ª semana, quando a barriga já está evidente e o corpo ainda responde bem ao ritmo do ensaio. Fazemos pausas sempre que preciso.",
      "Você pode trazer companheiro, filhos mais velhos e peças afetivas. A estética segue monocromática, com foco em pele, mãos e silhueta.",
    ],
    highlights: [
      "Ritmo tranquilo com pausas",
      "Acompanhante e filhos inclusos",
      "Tecidos e véus do estúdio",
    ],
    closingLine: "Mais do que fotos, entregamos memórias cheias de afeto, conexão e significado.",
    showAsEventTeaser: false,
    order: 6,
    eventOrder: null,
  },
];

export class MockNicheRepository implements NicheRepository {
  async findAll(): Promise<Niche[]> {
    return [...NICHES].sort((a, b) => a.order - b.order);
  }

  async findBySlug(slug: string): Promise<Niche | null> {
    return NICHES.find((n) => n.slug === slug) ?? null;
  }

  async create(data: Niche): Promise<Niche> {
    NICHES = [...NICHES, data];
    return data;
  }

  async update(slug: string, data: Partial<Omit<Niche, "slug">>): Promise<Niche> {
    const index = NICHES.findIndex((n) => n.slug === slug);
    if (index === -1) throw new Error(`Nicho "${slug}" não encontrado.`);
    const updated = { ...NICHES[index], ...data };
    NICHES = [...NICHES.slice(0, index), updated, ...NICHES.slice(index + 1)];
    return updated;
  }

  async delete(slug: string): Promise<void> {
    NICHES = NICHES.filter((n) => n.slug !== slug);
  }
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockNicheRepository.test.ts`
Expected: PASS — 5 testes.

- [ ] **Step 8: Testes dos casos de uso, contra o mock**

Create `src/api/application/niche/GetNichesUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { GetNichesUseCase } from "./GetNichesUseCase";

describe("GetNichesUseCase", () => {
  it("retorna os 7 nichos reais", async () => {
    const niches = await new GetNichesUseCase(new MockNicheRepository()).execute();
    expect(niches).toHaveLength(7);
  });
});
```

Create `src/api/application/niche/CreateNicheUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { CreateNicheUseCase } from "./CreateNicheUseCase";

const NEW_NICHE = {
  slug: "novo-nicho",
  title: "Novo Nicho",
  subtitle: "Subtítulo",
  intro: "Intro",
  description: [],
  highlights: [],
  closingLine: "",
  showAsEventTeaser: false,
  order: 7,
  eventOrder: null,
};

describe("CreateNicheUseCase", () => {
  it("cria um nicho novo", async () => {
    const niche = await new CreateNicheUseCase(new MockNicheRepository()).execute(NEW_NICHE);
    expect(niche.slug).toBe("novo-nicho");
  });

  it("rejeita slug duplicado", async () => {
    const useCase = new CreateNicheUseCase(new MockNicheRepository());
    await expect(useCase.execute({ ...NEW_NICHE, slug: "gestante" })).rejects.toThrow(/já existe/);
  });
});
```

Create `src/api/application/niche/UpdateNicheUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { UpdateNicheUseCase } from "./UpdateNicheUseCase";

describe("UpdateNicheUseCase", () => {
  it("atualiza um campo do nicho", async () => {
    const niche = await new UpdateNicheUseCase(new MockNicheRepository()).execute("gestante", {
      title: "Gestante e Espera",
    });
    expect(niche.title).toBe("Gestante e Espera");
  });
});
```

Create `src/api/application/niche/DeleteNicheUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { GetNicheBySlugUseCase } from "./GetNicheBySlugUseCase";
import { DeleteNicheUseCase } from "./DeleteNicheUseCase";

describe("DeleteNicheUseCase", () => {
  it("remove o nicho", async () => {
    const repo = new MockNicheRepository();
    await new DeleteNicheUseCase(repo).execute("gestante");
    const found = await new GetNicheBySlugUseCase(repo).execute("gestante");
    expect(found).toBeNull();
  });
});
```

Create `src/api/application/niche/GetNicheBySlugUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { GetNicheBySlugUseCase } from "./GetNicheBySlugUseCase";

describe("GetNicheBySlugUseCase", () => {
  it("retorna o nicho correspondente ao slug", async () => {
    const niche = await new GetNicheBySlugUseCase(new MockNicheRepository()).execute("familia");
    expect(niche?.title).toBe("Família");
  });

  it("retorna null pra slug inexistente", async () => {
    const niche = await new GetNicheBySlugUseCase(new MockNicheRepository()).execute("nao-existe");
    expect(niche).toBeNull();
  });
});
```

- [ ] **Step 9: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 12 testes novos desta task passam (5 do mock +
2 de create + 1 de update + 1 de delete + 2 de getBySlug + 1 de
getNiches).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(niche): domínio, DTO, casos de uso e repositório mock

MockNicheRepository transcreve fielmente os 7 nichos reais (mesmo texto
do app-photo, plano 1) — sobre um array mutável, pra exercitar
create/update/delete sem Firestore. CreateNicheUseCase rejeita slug
duplicado em vez de sobrescrever (diferente do upsert do Coupon no
Presencia — aqui a chance de erro de digitação supera a conveniência)."
```

---

### Task 3: `NicheRepositoryImpl` (Firestore, CRUD completo)

**Files:**

- Create: `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts` (já
  referenciava `NicheRepositoryImpl` desde a Task 1 — este é o arquivo
  que faz isso compilar)

**Interfaces:**

- Produces: `class NicheRepositoryImpl implements NicheRepository`.

- [ ] **Step 1: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`:

```ts
import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { getAdminDb } from "@/api/infrastructure/firebase/admin";

const COLLECTION = "niches";

function toNiche(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Niche {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    slug: doc.id,
    title: data.title,
    subtitle: data.subtitle,
    intro: data.intro,
    description: data.description,
    highlights: data.highlights,
    closingLine: data.closingLine,
    showAsEventTeaser: data.showAsEventTeaser,
    order: data.order,
    eventOrder: data.eventOrder ?? null,
  };
}

// slug é o próprio ID do documento — igual o app-photo já lê (plano 1).
// create/update usam .set()/.update() com ID determinístico, nunca
// .add() — mesmo padrão confirmado no CouponRepositoryImpl do Presencia.
export class NicheRepositoryImpl implements NicheRepository {
  async findAll(): Promise<Niche[]> {
    const snapshot = await getAdminDb().collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.map(toNiche);
  }

  async findBySlug(slug: string): Promise<Niche | null> {
    const doc = await getAdminDb().collection(COLLECTION).doc(slug).get();
    if (!doc.exists) return null;
    return toNiche(doc);
  }

  async create(data: Niche): Promise<Niche> {
    const { slug, ...fields } = data;
    await getAdminDb().collection(COLLECTION).doc(slug).set(fields);
    return data;
  }

  async update(slug: string, data: Partial<Omit<Niche, "slug">>): Promise<Niche> {
    await getAdminDb().collection(COLLECTION).doc(slug).update(data);
    const updated = await this.findBySlug(slug);
    if (!updated) throw new Error(`Nicho "${slug}" não encontrado depois de atualizar.`);
    return updated;
  }

  async delete(slug: string): Promise<void> {
    await getAdminDb().collection(COLLECTION).doc(slug).delete();
  }
}
```

(`const { slug, ...fields } = data` aqui é seguro mesmo sem
`ignoreRestSiblings` — `slug` é **usado** logo em seguida, em
`.doc(slug)`; a regra só acusa quando a variável destructurada fica sem
uso nenhum. Diferente do caso `toPhoto()` do `app-photo`, onde `role`
era descartado sem uso.)

- [ ] **Step 2: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros — `RepositoryFactory.ts` (Task 1) agora compila de
verdade, `NicheRepositoryImpl` existe.

- [ ] **Step 3: Verificação manual (quando houver Firestore real disponível)**

Documentar aqui, não executar agora:

1. Popular manualmente 1-2 documentos em `niches/` com os campos de
   `Niche`.
2. Rodar um script ad-hoc chamando `new NicheRepositoryImpl().findAll()`
   com credenciais reais no ambiente.
3. Confirmar que os objetos batem com os documentos, ordenados por
   `order`.
4. Testar `create`/`update`/`delete` manualmente contra o Firestore de
   teste antes de considerar o CRUD pronto pra produção.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(niche): repositório Firestore com CRUD completo

create/update usam doc(slug).set()/.update() — ID determinístico, nunca
.add(). delete é hard delete, sem cascade em Placement (ver Global
Constraints do plano)."
```

---

### Task 4: ViewModel, actions e webhook de revalidação

**Files:**

- Create: `src/api/presentation/niche/NicheViewModel.ts`
- Create: `src/actions/_lib/callRevalidateWebhook.ts`
- Create: `src/actions/niches.ts`
- Modify: `.env.example` (`REVALIDATE_SECRET`, `APP_PHOTO_URL`)
- Modify: `src/config/env.server.ts` (mesmas duas variáveis)

**Interfaces:**

- Produces: `getNiches(): Promise<NicheViewModel[]>`,
  `getNicheBySlug(slug): Promise<NicheViewModel | null>`,
  `createNiche(data): Promise<NicheViewModel>`,
  `updateNiche(slug, data): Promise<NicheViewModel>`,
  `deleteNiche(slug): Promise<void>` — todas exigem sessão.

- [ ] **Step 1: `REVALIDATE_SECRET`/`APP_PHOTO_URL` no schema de env**

Em `src/config/env.server.ts`, adiciona:

```ts
// Chama o webhook de invalidação de cache do app-photo depois de toda
// escrita — best-effort (ver callRevalidateWebhook.ts). Opcionais: sem
// elas, o app ainda funciona, só não invalida o cache do site público
// (loga um aviso em vez de quebrar a operação).
REVALIDATE_SECRET: z.string().min(1).optional(),
APP_PHOTO_URL: z.string().url().optional(),
```

Em `.env.example`, adiciona:

```
# Segredo compartilhado com o app-photo — autentica POST /api/revalidate
# lá. Sem ela, escritas aqui funcionam normalmente, só não invalidam o
# cache do site público (loga um aviso).
REVALIDATE_SECRET=
APP_PHOTO_URL=http://localhost:3000
```

- [ ] **Step 2: Helper do webhook — best-effort, nunca lança**

Create `src/actions/_lib/callRevalidateWebhook.ts`:

```ts
import { env } from "@/config/env.server";

// Best-effort de propósito: falha aqui não desfaz a escrita no
// Firestore que já aconteceu — só loga, nunca lança. Ver spec, seção
// "Invalidação de cache entre repositórios".
export async function callRevalidateWebhook(tag: string): Promise<void> {
  if (!env.REVALIDATE_SECRET || !env.APP_PHOTO_URL) {
    console.warn(
      `[revalidate] REVALIDATE_SECRET/APP_PHOTO_URL ausentes — cache de "${tag}" no app-photo não foi invalidado.`,
    );
    return;
  }
  try {
    const res = await fetch(`${env.APP_PHOTO_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.REVALIDATE_SECRET}`,
      },
      body: JSON.stringify({ tag }),
    });
    if (!res.ok) {
      console.warn(`[revalidate] app-photo respondeu ${res.status} pra tag "${tag}".`);
    }
  } catch (err) {
    console.warn(`[revalidate] falha ao chamar o webhook pra tag "${tag}":`, err);
  }
}
```

- [ ] **Step 3: ViewModel**

Create `src/api/presentation/niche/NicheViewModel.ts`:

```ts
import type { NicheDTO } from "@/api/application/niche/NicheDTO";

export interface NicheViewModel extends NicheDTO {
  eventLabel: string;
  // Campo sintético, sem valor de negócio — existe só pra dar à
  // DataTable uma `key: keyof T` própria pra coluna de ações (ver
  // NichesManager.tsx), que não pode reusar a key de nenhuma coluna
  // visível sem colidir no `key={String(column.key)}` do React.
  actions: null;
}

export function toNicheViewModel(dto: NicheDTO): NicheViewModel {
  return { ...dto, eventLabel: dto.showAsEventTeaser ? "Sim" : "Não", actions: null };
}
```

- [ ] **Step 4: Actions**

Create `src/actions/niches.ts`:

```ts
"use server";

import type { Niche } from "@/api/domain/niche/Niche";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
import { CreateNicheUseCase } from "@/api/application/niche/CreateNicheUseCase";
import { UpdateNicheUseCase } from "@/api/application/niche/UpdateNicheUseCase";
import { DeleteNicheUseCase } from "@/api/application/niche/DeleteNicheUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import { toNicheViewModel, type NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import { assertSession } from "@/lib/auth/session";
import { callRevalidateWebhook } from "./_lib/callRevalidateWebhook";

export async function getNiches(): Promise<NicheViewModel[]> {
  await assertSession();
  const niches = await new GetNichesUseCase(RepositoryFactory.niches()).execute();
  return niches.map(toNicheViewModel);
}

export async function getNicheBySlug(slug: string): Promise<NicheViewModel | null> {
  await assertSession();
  const niche = await new GetNicheBySlugUseCase(RepositoryFactory.niches()).execute(slug);
  return niche ? toNicheViewModel(niche) : null;
}

export async function createNiche(data: Niche): Promise<NicheViewModel> {
  await assertSession();
  const niche = await new CreateNicheUseCase(RepositoryFactory.niches()).execute(data);
  await callRevalidateWebhook("niches");
  return toNicheViewModel(niche);
}

export async function updateNiche(
  slug: string,
  data: Partial<Omit<Niche, "slug">>,
): Promise<NicheViewModel> {
  await assertSession();
  const niche = await new UpdateNicheUseCase(RepositoryFactory.niches()).execute(slug, data);
  await callRevalidateWebhook("niches");
  return toNicheViewModel(niche);
}

export async function deleteNiche(slug: string): Promise<void> {
  await assertSession();
  await new DeleteNicheUseCase(RepositoryFactory.niches()).execute(slug);
  await callRevalidateWebhook("niches");
}
```

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(niche): actions com sessão + webhook de revalidação

Toda action chama assertSession() antes do caso de uso, e
callRevalidateWebhook('niches') depois de toda escrita — best-effort,
nunca lança (falha em invalidar cache não é motivo pra falhar a
operação que já aconteceu no Firestore)."
```

---

### Task 5: UI — lista, formulário e delete

**Files:**

- Create: `src/app/niches/page.tsx`
- Create: `src/app/niches/_components/NichesManager.tsx`,
  `NicheForm.tsx`, `NewNicheModal.tsx`, `EditNicheModal.tsx`

**Interfaces:**

- Consumes: `getNiches`, `createNiche`, `updateNiche`, `deleteNiche`
  (Task 4), `DataTable`/`ConfirmationDialog`/`Dialog`/`Button`/`Input`/
  `Label` (copiados do Presencia, plano 6), `showToast` (idem).

- [ ] **Step 1: Página (Server Component)**

Create `src/app/niches/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { getNiches } from "@/actions/niches";
import { NichesManager } from "./_components/NichesManager";

export default async function NichesPage() {
  const niches = await getNiches();
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Nichos</h1>
      <NichesManager initialNiches={niches} />
    </main>
  );
}
```

- [ ] **Step 2: Formulário compartilhado (criar e editar)**

Create `src/app/niches/_components/NicheForm.tsx` — um `<textarea>` por
campo de lista (`description`/`highlights`), uma linha = um item:

```tsx
"use client";

import { Input } from "@/lib/_components/ui/input";
import { Label } from "@/lib/_components/ui/label";
import { useState } from "react";

export interface NicheFormValues {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  description: string;
  highlights: string;
  closingLine: string;
  showAsEventTeaser: boolean;
  order: string;
  eventOrder: string;
}

export const EMPTY_NICHE_FORM: NicheFormValues = {
  slug: "",
  title: "",
  subtitle: "",
  intro: "",
  description: "",
  highlights: "",
  closingLine: "",
  showAsEventTeaser: false,
  order: "0",
  eventOrder: "",
};

// description/highlights trafegam como texto (uma linha = um item) no
// formulário — convertidos pra string[] só na hora de submeter (ver
// toNichePayload em NewNicheModal/EditNicheModal). Evita construir um
// componente de lista repetível pra um caso de uso simples.
export function NicheForm({
  values,
  onChange,
  slugEditable = true,
}: {
  values: NicheFormValues;
  onChange: (values: NicheFormValues) => void;
  slugEditable?: boolean;
}) {
  const [showEventOrder, setShowEventOrder] = useState(values.showAsEventTeaser);

  function set<K extends keyof NicheFormValues>(key: K, value: NicheFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={values.slug}
          disabled={!slugEditable}
          onChange={(e) => set("slug", e.target.value)}
          placeholder="ex.: retratos-profissionais"
        />
      </div>
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="subtitle">Subtítulo</Label>
        <Input
          id="subtitle"
          value={values.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="intro">Introdução</Label>
        <textarea
          id="intro"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          value={values.intro}
          onChange={(e) => set("intro", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição (uma linha por parágrafo)</Label>
        <textarea
          id="description"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="highlights">Destaques (um por linha)</Label>
        <textarea
          id="highlights"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          value={values.highlights}
          onChange={(e) => set("highlights", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="closingLine">Frase de fechamento</Label>
        <Input
          id="closingLine"
          value={values.closingLine}
          onChange={(e) => set("closingLine", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="order">Ordem</Label>
        <Input
          id="order"
          type="number"
          value={values.order}
          onChange={(e) => set("order", e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.showAsEventTeaser}
          onChange={(e) => {
            set("showAsEventTeaser", e.target.checked);
            setShowEventOrder(e.target.checked);
          }}
        />
        Aparece na seção &quot;Eventos&quot; da home
      </label>
      {showEventOrder && (
        <div>
          <Label htmlFor="eventOrder">Ordem na seção Eventos</Label>
          <Input
            id="eventOrder"
            type="number"
            value={values.eventOrder}
            onChange={(e) => set("eventOrder", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export function toNichePayload(values: NicheFormValues) {
  return {
    slug: values.slug.trim(),
    title: values.title.trim(),
    subtitle: values.subtitle.trim(),
    intro: values.intro.trim(),
    description: values.description
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    highlights: values.highlights
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    closingLine: values.closingLine.trim(),
    showAsEventTeaser: values.showAsEventTeaser,
    order: Number(values.order) || 0,
    eventOrder: values.showAsEventTeaser && values.eventOrder ? Number(values.eventOrder) : null,
  };
}

export function fromNiche(niche: {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  showAsEventTeaser: boolean;
  order: number;
  eventOrder: number | null;
}): NicheFormValues {
  return {
    slug: niche.slug,
    title: niche.title,
    subtitle: niche.subtitle,
    intro: niche.intro,
    description: niche.description.join("\n"),
    highlights: niche.highlights.join("\n"),
    closingLine: niche.closingLine,
    showAsEventTeaser: niche.showAsEventTeaser,
    order: String(niche.order),
    eventOrder: niche.eventOrder === null ? "" : String(niche.eventOrder),
  };
}
```

- [ ] **Step 3: Modal de criar**

Create `src/app/niches/_components/NewNicheModal.tsx`:

```tsx
"use client";

import { createNiche } from "@/actions/niches";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { Button } from "@/lib/_components/ui/button";
import { showToast } from "@/lib/_utils/toast";
import { useState, useTransition } from "react";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import { EMPTY_NICHE_FORM, NicheForm, toNichePayload, type NicheFormValues } from "./NicheForm";

export function NewNicheModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (niche: NicheViewModel) => void;
}) {
  const [values, setValues] = useState<NicheFormValues>(EMPTY_NICHE_FORM);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const niche = await createNiche(toNichePayload(values));
        showToast({ message: "Nicho criado.", variant: "success" });
        onCreated(niche);
        setValues(EMPTY_NICHE_FORM);
        onOpenChange(false);
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Falha ao criar nicho.",
          variant: "error",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo nicho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <NicheForm values={values} onChange={setValues} />
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

Create `src/app/niches/_components/EditNicheModal.tsx` — mesma forma do
`NewNicheModal`, com `slug` desabilitado (imutável) e chamando
`updateNiche(slug, data)`:

```tsx
"use client";

import { updateNiche } from "@/actions/niches";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { Button } from "@/lib/_components/ui/button";
import { showToast } from "@/lib/_utils/toast";
import { useEffect, useState, useTransition } from "react";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import { fromNiche, NicheForm, toNichePayload, type NicheFormValues } from "./NicheForm";

export function EditNicheModal({
  niche,
  open,
  onOpenChange,
  onUpdated,
}: {
  niche: NicheViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (niche: NicheViewModel) => void;
}) {
  const [values, setValues] = useState<NicheFormValues | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (niche) setValues(fromNiche(niche));
  }, [niche]);

  if (!niche || !values) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche || !values) return;
    const { slug: _slug, ...data } = toNichePayload(values);
    startTransition(async () => {
      try {
        const updated = await updateNiche(niche.slug, data);
        showToast({ message: "Nicho atualizado.", variant: "success" });
        onUpdated(updated);
        onOpenChange(false);
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Falha ao atualizar nicho.",
          variant: "error",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar nicho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <NicheForm values={values} onChange={setValues} slugEditable={false} />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

(`const { slug: _slug, ...data } = toNichePayload(values)` é seguro
aqui: `@typescript-eslint/no-unused-vars` está `'off'` inteiro no
`eslint.config.js` do admin-photo, confirmado — `_slug` sem uso não
gera erro de lint.)

- [ ] **Step 5: Gerenciador (lista + orquestra os modais)**

Create `src/app/niches/_components/NichesManager.tsx`:

```tsx
"use client";

import { deleteNiche } from "@/actions/niches";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import { Button } from "@/lib/_components/ui/button";
import { ConfirmationDialog } from "@/lib/_components/ui/confirmation-dialog";
import { DataTable, type DataTableColumn } from "@/lib/_components/ui/data-table";
import { showToast } from "@/lib/_utils/toast";
import { useState } from "react";
import { EditNicheModal } from "./EditNicheModal";
import { NewNicheModal } from "./NewNicheModal";

export function NichesManager({ initialNiches }: { initialNiches: NicheViewModel[] }) {
  const [niches, setNiches] = useState(initialNiches);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editing, setEditing] = useState<NicheViewModel | null>(null);
  const [deleting, setDeleting] = useState<NicheViewModel | null>(null);

  const columns: DataTableColumn<NicheViewModel>[] = [
    { key: "slug", header: "Slug", sortable: true },
    { key: "title", header: "Título", sortable: true },
    { key: "order", header: "Ordem", sortable: true },
    { key: "eventLabel", header: "Evento?" },
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
    await deleteNiche(deleting.slug);
    setNiches((current) => current.filter((n) => n.slug !== deleting.slug));
    showToast({ message: "Nicho removido.", variant: "success" });
  }

  return (
    <>
      <DataTable
        data={niches}
        columns={columns}
        headerAction={<Button onClick={() => setIsNewOpen(true)}>Novo nicho</Button>}
        onRowClick={(row) => setEditing(row)}
      />

      <NewNicheModal
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        onCreated={(niche) => setNiches((current) => [...current, niche])}
      />

      <EditNicheModal
        niche={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onUpdated={(updated) =>
          setNiches((current) => current.map((n) => (n.slug === updated.slug ? updated : n)))
        }
      />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover nicho"
        description={`Remover "${deleting?.title}"? Esta ação não pode ser desfeita.`}
        variant="destructive"
        confirmLabel="Remover"
        onConfirm={handleDelete}
      />
    </>
  );
}
```

(`onRowClick` abre edição; a coluna `actions` tem seu próprio botão
com `e.stopPropagation()` pra abrir a confirmação de exclusão sem
disparar a edição — os dois caminhos não colidem.)

- [ ] **Step 6: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: sem erros.

- [ ] **Step 7: Smoke test manual (precisa de credenciais reais do Firebase)**

Documentar aqui, não executar sem credenciais: logar, abrir
`/niches`, confirmar que os 7 nichos aparecem na tabela, criar um nicho
de teste, editá-lo, removê-lo — conferir que cada ação mostra o toast
certo e que a tabela atualiza sem recarregar a página.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(niche): UI de lista, criação, edição e remoção

DataTable + modais (padrão do Coupon no Presencia — useState +
useTransition, sem react-hook-form). description/highlights trafegam
como texto multi-linha no formulário, convertidos pra string[] só ao
submeter."
```

---

### Task 6: `app-photo` — leitura pública ganha a tag `"niches"`

**Files:**

- Modify: `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`
  (`app-photo`)

**Interfaces:**

- Consumes: `unstable_cache` (`next/cache`).
- Produces: mesma interface pública de sempre — `findAll()`/
  `findBySlug(slug)` — agora cacheados com tag `"niches"`.

- [ ] **Step 1: Confirmar que `cacheComponents` está desligado**

Run: `grep -n "cacheComponents" next.config.ts`
Expected: nenhuma linha — confirma que este projeto usa o modelo
"Previous" de cache (`unstable_cache`), não `"use cache"`/`cacheTag()`.
Se essa checagem um dia mudar de resultado, este plano fica
desatualizado — reler `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
antes de aplicar este step.

- [ ] **Step 2: Envolver as leituras em `unstable_cache`**

Replace `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`:

```ts
import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "niches";

function toNiche(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Niche {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    slug: doc.id,
    title: data.title,
    subtitle: data.subtitle,
    intro: data.intro,
    description: data.description,
    highlights: data.highlights,
    closingLine: data.closingLine,
    showAsEventTeaser: data.showAsEventTeaser,
    order: data.order,
    eventOrder: data.eventOrder ?? null,
  };
}

// db.collection(...).get() não é fetch() — unstable_cache é o jeito
// certo de dar tag a uma leitura assim (confirmado contra
// node_modules/next/dist/docs, "Caching (Previous Model)": este projeto
// não tem cacheComponents ligado). admin-photo chama
// POST /api/revalidate → revalidateTag("niches", "max") quando escreve.
const findAllNiches = unstable_cache(
  async (): Promise<Niche[]> => {
    const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.map(toNiche);
  },
  ["niches", "findAll"],
  { tags: ["niches"] },
);

const findNicheBySlug = unstable_cache(
  async (slug: string): Promise<Niche | null> => {
    const doc = await db.collection(COLLECTION).doc(slug).get();
    if (!doc.exists) return null;
    return toNiche(doc);
  },
  ["niches", "findBySlug"],
  { tags: ["niches"] },
);

export class NicheRepositoryImpl implements NicheRepository {
  findAll(): Promise<Niche[]> {
    return findAllNiches();
  }

  findBySlug(slug: string): Promise<Niche | null> {
    return findNicheBySlug(slug);
  }
}
```

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros — `RepositoryFactory.test.ts` (planos 1-5) continua
passando sem alteração (mock não muda, só a implementação real ganha a
camada de cache por cima).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(niche): leitura pública ganha cache com tag \"niches\"

unstable_cache envolve findAll/findBySlug (Firestore Admin SDK não usa
fetch, então next: { tags } não se aplica) — POST /api/revalidate
(plano 6) chama revalidateTag(\"niches\", \"max\") quando o admin grava."
```

---

### Task 7: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa em `admin-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && npm run build`
Expected: sem erros.

- [ ] **Step 2: Suíte completa em `app-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros.

- [ ] **Step 3: Smoke test manual completo (precisa de credenciais reais)**

Documentar aqui, não executar sem credenciais: com o Firestore de
verdade populado (migração, plano 5, já deve ter rodado antes disso em
produção — em dev, popular manualmente `niches/` com 1-2 documentos),
logar no admin, criar/editar/remover um nicho, confirmar no site
público (`app-photo`, sem reiniciar o servidor) que a mudança aparece —
valida o webhook + `unstable_cache` + `revalidateTag` de ponta a ponta.

- [ ] **Step 4: Commit final (se sobrou algo solto) em cada repo**

```bash
cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo && git status --short
cd /Users/cesarpisa/Projects/lp-fotografia/app-photo && git status --short
# se houver pendências em qualquer um, git add -A && git commit -m "..."
# app-photo: git push (admin-photo continua só local)
```

---

## Depois deste plano

`niche` tem CRUD completo no admin, com o site público lendo por trás de
cache invalidável. O mesmo padrão (Task 1-6 deste plano, adaptadas) se
repete pros planos seguintes:

- **Plano 8** — CRUD de `package` (filho de `niche` — `nicheSlug` como
  chave estrangeira, sem doc ID natural, gerado como
  `"<nicheSlug>-<índice>"`, igual o `app-photo` já faz, plano 2).
- **Plano 9** — Upload de foto + gerenciamento de `Placement` — a peça
  mais nova, sem precedente direto (spec já avisa: vale prototipar a
  query antes do CRUD completo) — mais a integração Cloudinary (upload
  unsigned do browser, delete assinado).
- **Plano 10** — CRUD de `profile` (singleton, só `get`/`update`, sem
  lista nem delete — primeira tela do admin sem `DataTable` nenhuma) +
  deploy real (rodar o serviço na VPS pela primeira vez).
