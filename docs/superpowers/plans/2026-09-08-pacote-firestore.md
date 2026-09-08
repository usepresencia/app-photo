# Pacote no Firestore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer `Package` (pacotes de preço dentro de cada nicho) vir do
Firestore em vez do array `PACKAGES_BY_NICHE` hardcoded, ganhando o campo
`description` que o spec pede e um `id` próprio por pacote.

**Architecture:** Mesmo padrão de camadas do plano 1
(`domain/application/infrastructure` + `RepositoryFactory` com fallback
mock fora de produção) — desta vez para `package`, filho de `niche` por
`nicheSlug`. `PackageRepository.findByNicheSlug` é uma query (`where
nicheSlug ==, orderBy order`), diferente de `NicheRepository.findBySlug`
que é um `doc().get()` direto — nichos usam o slug como ID do documento,
pacotes não têm um identificador natural único fora do Firestore, então
ganham um `id` gerado.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `firebase-admin`,
Vitest. Toda a infraestrutura (`firebase-admin`, `env.server`,
`RepositoryFactory`, `src/lib`) já existe — este plano só adiciona a
entidade `package` em cima dela.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
**Plano anterior:** `docs/superpowers/plans/2026-09-08-nicho-firestore.md`
(2 de 10 do roteiro)

## Global Constraints

- Sem Firebase real disponível em CI — `npm run build` e `npm run test`
  precisam funcionar só com o fallback mock, herdado do plano 1.
- Nenhum comportamento visível muda em `/ensaios/[slug]`, exceto a
  descrição do pacote passar a renderizar **quando presente** — hoje ela
  não existe em nenhum dos 14 pacotes reais, então nada aparece ainda.
- `featured` era opcional (`featured?: boolean`) no tipo atual; vira
  obrigatório (`featured: boolean`, `false` quando ausente) no novo — mesma
  normalização que o plano 1 já documentou para este campo.
- Transcrição dos 14 pacotes reais precisa ser fiel, palavra por palavra —
  não é reescrita.

---

## Mapa de arquivos

**Criar:**

- `src/api/domain/package/Package.ts`
- `src/api/domain/package/PackageRepository.ts`
- `src/api/application/package/PackageDTO.ts`
- `src/api/application/package/GetPackagesByNicheUseCase.ts`
- `src/api/application/package/GetPackagesByNicheUseCase.test.ts`
- `src/api/infrastructure/repositories/mock/MockPackageRepository.ts`
- `src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`
- `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`

**Modificar:**

- `src/api/infrastructure/repositories/RepositoryFactory.ts` — adiciona
  `packages()`
- `src/api/infrastructure/repositories/RepositoryFactory.test.ts` — cobre
  `packages()`
- `src/actions/packages.ts` — troca `PACKAGES_BY_NICHE` por
  `GetPackagesByNicheUseCase`
- `src/actions/packages.test.ts` — cobre `id`
- `src/app/ensaios/[slug]/_components/PackagePicker.tsx` — seleciona por
  `id` em vez de `name`; renderiza `description` quando presente

**Decisão de escopo:** não crio `src/api/presentation/package/PackageViewModel.ts`,
pela mesma razão do plano 1 — a "moldagem pra UI" acontece em
`src/actions/packages.ts`, que já existe e já descarta os campos internos
(`nicheSlug`, `order`) antes de devolver pro componente.

---

### Task 1: Domínio, DTO, caso de uso e repositório mock de Pacote

**Files:**

- Create: `src/api/domain/package/Package.ts`
- Create: `src/api/domain/package/PackageRepository.ts`
- Create: `src/api/application/package/PackageDTO.ts`
- Create: `src/api/application/package/GetPackagesByNicheUseCase.ts`
- Create: `src/api/application/package/GetPackagesByNicheUseCase.test.ts`
- Create: `src/api/infrastructure/repositories/mock/MockPackageRepository.ts`
- Create: `src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`

**Interfaces:**

- Consumes: nada de novo.
- Produces: `interface Package { id, nicheSlug, name, price, description,
items, featured, order }`, `interface PackageRepository { findByNicheSlug(nicheSlug: string): Promise<Package[]> }`,
  `interface PackageDTO` (idêntica a `Package`), `class GetPackagesByNicheUseCase`
  com `.execute(nicheSlug: string): Promise<PackageDTO[]>`, `class
MockPackageRepository implements PackageRepository`, seedada com os 14
  pacotes reais.

- [x] **Step 1: Entidade e contrato de repositório**

Create `src/api/domain/package/Package.ts`:

```ts
export interface Package {
  id: string;
  nicheSlug: string;
  name: string;
  price: string;
  description: string;
  items: string[];
  featured: boolean;
  order: number;
}
```

Create `src/api/domain/package/PackageRepository.ts`:

```ts
import type { Package } from "./Package";

export interface PackageRepository {
  findByNicheSlug(nicheSlug: string): Promise<Package[]>;
}
```

- [x] **Step 2: DTO e caso de uso**

Create `src/api/application/package/PackageDTO.ts`:

```ts
export interface PackageDTO {
  id: string;
  nicheSlug: string;
  name: string;
  price: string;
  description: string;
  items: string[];
  featured: boolean;
  order: number;
}
```

Create `src/api/application/package/GetPackagesByNicheUseCase.ts`:

```ts
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PackageDTO } from "./PackageDTO";

export class GetPackagesByNicheUseCase {
  constructor(private readonly repo: PackageRepository) {}

  async execute(nicheSlug: string): Promise<PackageDTO[]> {
    const packages = await this.repo.findByNicheSlug(nicheSlug);
    return packages.map((p) => ({ ...p }));
  }
}
```

- [x] **Step 3: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "./MockPackageRepository";

describe("MockPackageRepository", () => {
  it("retorna os pacotes do nicho pedido, ordenados, com no máximo um featured", async () => {
    const repo = new MockPackageRepository();
    const slugs = [
      "retratos-profissionais",
      "gestante",
      "familia",
      "comercial",
      "casamento-civil",
      "aniversario-e-eventos",
    ];
    for (const slug of slugs) {
      const packages = await repo.findByNicheSlug(slug);
      expect(packages.length).toBeGreaterThan(0);
      expect(packages.every((p) => p.nicheSlug === slug)).toBe(true);
      expect(packages.map((p) => p.order)).toEqual(packages.map((_, i) => i));
      expect(packages.filter((p) => p.featured).length).toBeLessThanOrEqual(1);
    }
  });

  it("retorna array vazio para making-of-da-noiva (aguarda doc da cliente)", async () => {
    const repo = new MockPackageRepository();
    const packages = await repo.findByNicheSlug("making-of-da-noiva");
    expect(packages).toEqual([]);
  });

  it("retorna array vazio para um nicho desconhecido", async () => {
    const repo = new MockPackageRepository();
    const packages = await repo.findByNicheSlug("nao-existe");
    expect(packages).toEqual([]);
  });

  it("cada pacote tem id único", async () => {
    const repo = new MockPackageRepository();
    const all = (
      await Promise.all(
        [
          "retratos-profissionais",
          "gestante",
          "familia",
          "comercial",
          "casamento-civil",
          "aniversario-e-eventos",
        ].map((slug) => repo.findByNicheSlug(slug)),
      )
    ).flat();
    expect(all).toHaveLength(14);
    expect(new Set(all.map((p) => p.id)).size).toBe(14);
  });
});
```

- [x] **Step 4: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`
Expected: FAIL — módulo `./MockPackageRepository` não existe.

- [x] **Step 5: Implementar o repositório mock, com os 14 pacotes reais transcritos**

Create `src/api/infrastructure/repositories/mock/MockPackageRepository.ts`:

```ts
import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";

// Transcrição fiel de PACKAGES_BY_NICHE, que hoje vive em
// src/actions/packages.ts — mesmo texto (fonte: "Ensaios Fotográficos -
// VALORES.pdf"), mesma ordem. description vazio: a cliente ainda não
// forneceu esse texto pra nenhum pacote — mesma convenção usada em
// making-of-da-noiva (niche) pra "aguarda doc da cliente".
const PACKAGES: Package[] = [
  {
    id: "retratos-profissionais-0",
    nicheSlug: "retratos-profissionais",
    name: "Pacote Básico",
    price: "R$ 280",
    description: "",
    items: [
      "1 hora de sessão",
      "Até 2 trocas de look",
      "10 fotos editadas em alta qualidade (formato digital)",
      "Direção e posicionamento durante toda a sessão",
    ],
    featured: false,
    order: 0,
  },
  {
    id: "retratos-profissionais-1",
    nicheSlug: "retratos-profissionais",
    name: "Pacote Essencial",
    price: "R$ 500",
    description: "",
    items: [
      "Até 2 horas de sessão",
      "Até 3 trocas de look",
      "20 fotos editadas em alta qualidade (formato digital)",
      "Direção e posicionamento completos",
    ],
    featured: true,
    order: 1,
  },
  {
    id: "gestante-0",
    nicheSlug: "gestante",
    name: "Pacote Básico",
    price: "R$ 280",
    description: "",
    items: [
      "1 hora de sessão",
      "Até 3 trocas de look",
      "10 fotos editadas em alta qualidade (formato digital)",
      "Direção e posicionamento durante toda a sessão",
      "Acesso a looks disponíveis (vestidos para gestante)",
    ],
    featured: false,
    order: 0,
  },
  {
    id: "gestante-1",
    nicheSlug: "gestante",
    name: "Pacote Essencial",
    price: "R$ 500",
    description: "",
    items: [
      "2 horas de sessão",
      "Até 3 ou 4 trocas de look",
      "20 fotos editadas em alta qualidade (formato digital)",
      "Direção e posicionamento completos",
      "Acesso a looks disponíveis (vestidos para gestante)",
    ],
    featured: true,
    order: 1,
  },
  {
    id: "familia-0",
    nicheSlug: "familia",
    name: "Pacote Básico",
    price: "R$ 280",
    description: "",
    items: [
      "1 hora de sessão",
      "Até 3 trocas de look",
      "10 fotos editadas em alta qualidade (formato digital)",
      "Direção e posicionamento durante toda a sessão",
    ],
    featured: false,
    order: 0,
  },
  {
    id: "familia-1",
    nicheSlug: "familia",
    name: "Pacote Essencial",
    price: "R$ 500",
    description: "",
    items: [
      "2 horas de sessão",
      "Até 3 ou 4 trocas de look",
      "20 fotos editadas em alta qualidade (formato digital)",
      "Direção e posicionamento completos",
    ],
    featured: true,
    order: 1,
  },
  {
    id: "comercial-0",
    nicheSlug: "comercial",
    name: "Comercial",
    price: "R$ 350",
    description: "",
    items: [
      "Até 1 hora e 30 minutos de sessão",
      "De 5 a 10 trocas de looks/produtos",
      "50 a 80 fotos editadas (correção de luz e cor) em alta qualidade",
      "Produção em ambiente externo ou no local do cliente",
      "Entrega rápida: até 3 dias úteis",
    ],
    featured: false,
    order: 0,
  },
  {
    id: "comercial-1",
    nicheSlug: "comercial",
    name: "Corporativo",
    price: "R$ 450",
    description: "",
    items: [
      "1 hora e 30 minutos de sessão",
      "Até 3 ou 4 trocas de look",
      "20 fotos editadas com tratamento profissional",
      "Realização no ambiente da empresa ou em estúdio",
      "Indicado para equipes de 5 a 10 pessoas",
    ],
    featured: true,
    order: 1,
  },
  {
    id: "casamento-civil-0",
    nicheSlug: "casamento-civil",
    name: "Pré Wedding",
    price: "R$ 450",
    description: "",
    items: [
      "Sessão externa em local escolhido pelo casal",
      "Até 2 horas de duração",
      "30 fotos editadas em alta qualidade (formato digital)",
      "5 fotos reveladas",
    ],
    featured: false,
    order: 0,
  },
  {
    id: "casamento-civil-1",
    nicheSlug: "casamento-civil",
    name: "Cerimônia Civil + Pós-Cerimônia",
    price: "R$ 500",
    description: "",
    items: [
      "Cobertura integral da cerimônia no cartório",
      "Fotos do casal e familiares",
      "+ 20 fotos editadas somente do casal (pós-cerimônia)",
      "Todas as fotos entregues com edição (formato digital – pendrive)",
    ],
    featured: true,
    order: 1,
  },
  {
    id: "casamento-civil-2",
    nicheSlug: "casamento-civil",
    name: "Pacote Completo",
    price: "R$ 1.500",
    description: "",
    items: [
      "Pré wedding + Cerimônia Civil + Pós-cerimônia do casal",
      "Storymaker: vídeos curtos + 1 vídeo editado completo",
      "Todas as fotos entregues com edição (formato digital – pendrive)",
      "20 fotos reveladas + caixa personalizada",
      "Brinde especial",
    ],
    featured: false,
    order: 2,
  },
  {
    id: "aniversario-e-eventos-0",
    nicheSlug: "aniversario-e-eventos",
    name: "Eventos e Aniversário Infantil",
    price: "R$ 500",
    description: "",
    items: [
      "Cobertura de até 2 horas no local",
      "Todas as fotos entregues com edição (formato digital)",
      "Registros de detalhes, aniversariante, convidados, parabéns e família",
      "Entrega de prévias no mesmo dia",
      "Entrega completa em até 5 dias úteis",
    ],
    featured: true,
    order: 0,
  },
  {
    id: "aniversario-e-eventos-1",
    nicheSlug: "aniversario-e-eventos",
    name: "Adicional Storymaker",
    price: "R$ 250",
    description: "",
    items: ["1 vídeo completo editado", "Entrega dos takes originais sem edição"],
    featured: false,
    order: 1,
  },
  {
    id: "aniversario-e-eventos-2",
    nicheSlug: "aniversario-e-eventos",
    name: "Eventos Maiores (Casamentos e Debutantes)",
    price: "Sob consulta",
    description: "",
    items: [
      "Orçamento personalizado conforme a celebração",
      "Necessário preenchimento de formulário para proposta detalhada",
      "Acima de 30 convidados: cobertura com 2 fotógrafas",
    ],
    featured: false,
    order: 2,
  },
];

export class MockPackageRepository implements PackageRepository {
  async findByNicheSlug(nicheSlug: string): Promise<Package[]> {
    return PACKAGES.filter((p) => p.nicheSlug === nicheSlug).sort((a, b) => a.order - b.order);
  }
}
```

- [x] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`
Expected: PASS — 4 testes.

- [x] **Step 7: Teste do caso de uso, contra o mock**

Create `src/api/application/package/GetPackagesByNicheUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { GetPackagesByNicheUseCase } from "./GetPackagesByNicheUseCase";

describe("GetPackagesByNicheUseCase", () => {
  it("retorna os pacotes do nicho pedido", async () => {
    const useCase = new GetPackagesByNicheUseCase(new MockPackageRepository());
    const packages = await useCase.execute("gestante");
    expect(packages).toHaveLength(2);
    expect(packages.map((p) => p.name)).toEqual(["Pacote Básico", "Pacote Essencial"]);
  });

  it("retorna array vazio para um nicho sem pacotes", async () => {
    const useCase = new GetPackagesByNicheUseCase(new MockPackageRepository());
    const packages = await useCase.execute("making-of-da-noiva");
    expect(packages).toEqual([]);
  });
});
```

- [x] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 6 testes novos (4 do mock + 2 do use case) passam.

- [x] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(package): domínio, DTO, caso de uso e repositório mock

14 pacotes reais transcritos de src/actions/packages.ts, agora com id,
nicheSlug, description (vazio — aguarda a cliente) e order. Repositório
mock serve dev/test/CI sem Firebase real."
```

---

### Task 2: Repositório Firestore e fábrica de repositórios

**Files:**

- Create: `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.test.ts`

**Interfaces:**

- Consumes: `db` (Task 2 do plano 1), `PackageRepository`/`Package`
  (Task 1), `MockPackageRepository` (Task 1).
- Produces: `class PackageRepositoryImpl implements PackageRepository`,
  `RepositoryFactory.packages(): PackageRepository`.

- [ ] **Step 1: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`:

```ts
import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import { db } from "../firebase/admin";

const COLLECTION = "packages";

function toPackage(doc: FirebaseFirestore.QueryDocumentSnapshot): Package {
  const data = doc.data();
  return {
    id: doc.id,
    nicheSlug: data.nicheSlug,
    name: data.name,
    price: data.price,
    description: data.description,
    items: data.items,
    featured: data.featured,
    order: data.order,
  };
}

// Diferente de niches: pacote não tem um identificador natural fora do
// Firestore, então o ID do documento é gerado (a migração usa o mesmo
// formato do MockPackageRepository: "<nicheSlug>-<índice>"), não o slug.
// findByNicheSlug é uma query (where + orderBy), não um doc().get() —
// exige um índice composto (nicheSlug asc, order asc) no Firestore; sem
// ele, a query falha em runtime real. Ver Step 3.
export class PackageRepositoryImpl implements PackageRepository {
  async findByNicheSlug(nicheSlug: string): Promise<Package[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("nicheSlug", "==", nicheSlug)
      .orderBy("order", "asc")
      .get();
    return snapshot.docs.map(toPackage);
  }
}
```

- [ ] **Step 2: Fábrica de repositórios**

Em `src/api/infrastructure/repositories/RepositoryFactory.ts`, troca:

```ts
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { env } from "@/lib/config/env.server";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";
```

por:

```ts
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import { env } from "@/lib/config/env.server";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";
import { PackageRepositoryImpl } from "./PackageRepositoryImpl";
import { MockPackageRepository } from "./mock/MockPackageRepository";
```

E troca:

```ts
export const RepositoryFactory = {
  niches: (): NicheRepository =>
    shouldUseMock() ? new MockNicheRepository() : new NicheRepositoryImpl(),
};
```

por:

```ts
export const RepositoryFactory = {
  niches: (): NicheRepository =>
    shouldUseMock() ? new MockNicheRepository() : new NicheRepositoryImpl(),
  packages: (): PackageRepository =>
    shouldUseMock() ? new MockPackageRepository() : new PackageRepositoryImpl(),
};
```

(`hasFirebaseCredentials`, `isProductionRuntime` e `shouldUseMock` não
mudam — são genéricas, já servem qualquer entidade.)

- [ ] **Step 3: Estender o teste da fábrica**

Em `src/api/infrastructure/repositories/RepositoryFactory.test.ts`, a
função `importFresh` cresce pra trazer as classes de package também:

```ts
async function importFresh() {
  const [
    { RepositoryFactory },
    { MockNicheRepository },
    { NicheRepositoryImpl },
    { MockPackageRepository },
    { PackageRepositoryImpl },
  ] = await Promise.all([
    import("./RepositoryFactory"),
    import("./mock/MockNicheRepository"),
    import("./NicheRepositoryImpl"),
    import("./mock/MockPackageRepository"),
    import("./PackageRepositoryImpl"),
  ]);
  return {
    RepositoryFactory,
    MockNicheRepository,
    NicheRepositoryImpl,
    MockPackageRepository,
    PackageRepositoryImpl,
  };
}
```

E cada um dos 3 testes existentes ganha uma asserção a mais sobre
`RepositoryFactory.packages()`:

```ts
describe("RepositoryFactory.niches", () => {
  it("usa o mock quando não há credenciais do Firebase, fora de produção", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { RepositoryFactory, MockNicheRepository, MockPackageRepository } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(MockNicheRepository);
    expect(RepositoryFactory.packages()).toBeInstanceOf(MockPackageRepository);
  });

  it("usa o mock durante `next build` (NODE_ENV=production, NEXT_PHASE=phase-production-build), mesmo sem credenciais", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PHASE = "phase-production-build";
    const { RepositoryFactory, MockNicheRepository, MockPackageRepository } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(MockNicheRepository);
    expect(RepositoryFactory.packages()).toBeInstanceOf(MockPackageRepository);
  });

  it("usa o repositório real em produção servindo tráfego, quando há credenciais", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.FIREBASE_PROJECT_ID = "meu-projeto";
    process.env.FIREBASE_CLIENT_EMAIL = "conta@meu-projeto.iam.gserviceaccount.com";
    process.env.FIREBASE_PRIVATE_KEY = "chave";
    const { RepositoryFactory, NicheRepositoryImpl, PackageRepositoryImpl } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(NicheRepositoryImpl);
    expect(RepositoryFactory.packages()).toBeInstanceOf(PackageRepositoryImpl);
  });
});
```

(O `describe` continua se chamando `RepositoryFactory.niches` por não
quebrar o histórico do arquivo — cobre as duas chaves da fábrica agora.
Se preferir, renomeie para `RepositoryFactory` ao aplicar.)

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 3 testes de `RepositoryFactory.test.ts` continuam
passando, agora cobrindo as duas entidades.

- [ ] **Step 5: Verificação manual (quando houver Firestore real disponível)**

Documentar aqui, não executar agora:

1. Criar o índice composto `packages` (`nicheSlug` Ascending, `order`
   Ascending) no console do Firestore — sem ele, `findByNicheSlug` falha
   em runtime com um erro pedindo exatamente esse índice.
2. Popular manualmente 2-3 documentos em `packages/` com os campos de
   `Package` (Task 1, Step 1).
3. Rodar um script ad-hoc chamando
   `new PackageRepositoryImpl().findByNicheSlug("<slug>")` com credenciais
   reais no ambiente.
4. Confirmar que os objetos retornados batem com os documentos e vêm
   ordenados por `order`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(package): repositório Firestore e fábrica de repositórios

findByNicheSlug é where+orderBy, não doc().get() — precisa de índice
composto (nicheSlug, order) no Firestore real; documentado como
verificação manual, sem Firestore de desenvolvimento configurado neste
plano."
```

---

### Task 3: Ligar `src/actions/packages.ts` e atualizar `PackagePicker.tsx`

**Files:**

- Modify: `src/actions/packages.ts`
- Modify: `src/actions/packages.test.ts`
- Modify: `src/app/ensaios/[slug]/_components/PackagePicker.tsx`

**Interfaces:**

- Consumes: `GetPackagesByNicheUseCase`, `RepositoryFactory.packages()`
  (Task 1-2).
- Produces: `getPackagesForNiche(slug): Promise<Package[]>` — mesma
  assinatura de hoje; `Package` público ganha `id` e `description`,
  perde a opcionalidade de `featured` (`boolean`, não mais `boolean |
undefined`).

- [ ] **Step 1: Atualizar o teste primeiro**

Em `src/actions/packages.test.ts`, adiciona ao primeiro `it`:

```ts
import { describe, expect, it } from "vitest";
import { getPackagesForNiche } from "./packages";

describe("getPackagesForNiche", () => {
  it("retorna pacotes reais para cada nicho precificado, com no máximo um featured", async () => {
    const slugs = [
      "retratos-profissionais",
      "gestante",
      "familia",
      "comercial",
      "casamento-civil",
      "aniversario-e-eventos",
    ];
    for (const slug of slugs) {
      const packages = await getPackagesForNiche(slug);
      expect(packages.length).toBeGreaterThan(0);
      expect(packages.filter((p) => p.featured).length).toBeLessThanOrEqual(1);
      expect(new Set(packages.map((p) => p.id)).size).toBe(packages.length);
    }
  });

  it("retorna array vazio para making-of-da-noiva (aguarda doc da cliente)", async () => {
    const packages = await getPackagesForNiche("making-of-da-noiva");
    expect(packages).toEqual([]);
  });

  it("retorna array vazio para um slug desconhecido", async () => {
    const packages = await getPackagesForNiche("nao-existe");
    expect(packages).toEqual([]);
  });
});
```

(Só a primeira asserção de `id` único é nova — as outras duas ficam como
estão.)

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/actions/packages.test.ts`
Expected: FAIL — `p.id` é `undefined` no array atual (`PACKAGES_BY_NICHE`
não tem esse campo), `new Set([undefined]).size` não bate com
`packages.length` quando há mais de um pacote.

- [ ] **Step 3: Reescrever `src/actions/packages.ts`**

Replace `src/actions/packages.ts`:

```ts
import type { PackageDTO } from "@/api/application/package/PackageDTO";
import { GetPackagesByNicheUseCase } from "@/api/application/package/GetPackagesByNicheUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Package {
  id: string;
  name: string;
  price: string;
  description: string;
  items: string[];
  featured: boolean;
}

function toPackage(dto: PackageDTO): Package {
  return {
    id: dto.id,
    name: dto.name,
    price: dto.price,
    description: dto.description,
    items: dto.items,
    featured: dto.featured,
  };
}

export async function getPackagesForNiche(slug: string): Promise<Package[]> {
  const dtos = await new GetPackagesByNicheUseCase(RepositoryFactory.packages()).execute(slug);
  return dtos.map(toPackage);
}
```

`nicheSlug` e `order` do DTO ficam de fora do tipo público — são
detalhes de consulta que o componente não precisa (a ordem já vem
aplicada pela query do Firestore/mock).

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run src/actions/packages.test.ts`
Expected: PASS — 3 testes.

- [ ] **Step 5: Atualizar `PackagePicker.tsx` para selecionar por `id`**

Em `src/app/ensaios/[slug]/_components/PackagePicker.tsx`, linha 20-21,
troca:

```ts
const [selected, setSelected] = useState<string | null>(null);
const pack = packages.find((p) => p.name === selected);
```

por:

```ts
const [selectedId, setSelectedId] = useState<string | null>(null);
const pack = packages.find((p) => p.id === selectedId);
```

Linhas 40-43 (dentro do `.map` da grade de pacotes), troca:

```tsx
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelected(p.name)}
```

por:

```tsx
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
```

Linha 72, troca:

```tsx
        <div key={pack.name} className="album-stage album-page-next mt-8 space-y-8">
```

por:

```tsx
        <div key={pack.id} className="album-stage album-page-next mt-8 space-y-8">
```

Linha 89, troca:

```tsx
                onClick={() => setSelected(null)}
```

por:

```tsx
                onClick={() => setSelectedId(null)}
```

**Por quê:** `name` não é garantidamente único entre pacotes do mesmo
nicho (hoje não colide, mas nada impede); `id` é.

- [ ] **Step 6: Renderizar `description` quando presente**

Em `src/app/ensaios/[slug]/_components/PackagePicker.tsx`, o bloco do
cabeçalho fecha com dois `</div>` seguidos (linhas 105 e 106 do arquivo
original — um fecha `<div className="flex-1">`, o outro fecha `<div
className="relative z-10 flex items-center gap-3">`), logo antes da lista
de itens (`<ul className="relative z-10 mt-5 space-y-2">` na linha 107).
Insere depois dos dois `</div>`, antes da `<ul>`:

```tsx
{
  pack.description && (
    <p className="relative z-10 mt-4 text-sm leading-relaxed text-muted-foreground">
      {pack.description}
    </p>
  );
}
```

Hoje `description` é `""` nos 14 pacotes reais (a cliente ainda não
forneceu esse texto), então nada aparece ainda — mesmo padrão condicional
já usado em `{niche.intro && (...)}` na página do nicho.

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(package): ligar actions/packages.ts e PackagePicker.tsx

Seleção de pacote passa a usar id em vez de name (name não é
garantidamente único). description renderiza condicionalmente — hoje
vazia nos 14 pacotes reais, aparece assim que a cliente fornecer o
texto."
```

---

### Task 4: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa**

Run: `npm run typecheck && npx eslint . && npx prettier '**/*.{css,ts,tsx,json,md}' --check && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: os cinco comandos terminam com código de saída 0, sem nenhuma
credencial do Firebase no ambiente — os mesmos passos que o CI roda.

- [ ] **Step 2: Smoke test manual**

Run: `npm run dev` (sem credenciais do Firebase no ambiente), abrir
`http://localhost:3000/ensaios/gestante`, clicar num pacote.
Expected: a grade mostra 2 pacotes ("Pacote Básico", "Pacote Essencial");
ao clicar, abre o detalhe com preço, itens e o botão "Agendar" com o link
de WhatsApp incluindo o nome do pacote — igual a antes da migração.

- [ ] **Step 3: Commit final (se sobrou algo solto) e push**

```bash
git status --short
# se houver pendências, git add -A && git commit -m "..."
git push
```

---

## Depois deste plano

Mesmo padrão de camadas estabelecido para `niche` (plano 1) e `package`
(este) se repete para `photo`/`placement` e `profile` — planos 3 e 4 do
roteiro. `photo`/`placement` é o mais novo dos quatro: nenhuma entidade
nos repos-irmãos tinha esse formato de "referência genérica com surface +
refId opcional" (spec, seção "Riscos").
