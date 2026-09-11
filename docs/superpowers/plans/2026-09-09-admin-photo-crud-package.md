# admin-photo — CRUD de Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Segunda entidade de conteúdo do admin — CRUD completo de `Package`
(criar, editar, remover, listar), filho de `Niche` via `nicheSlug`, com a
leitura pública equivalente em `app-photo` ganhando cache por tag
(`"packages"`).

**Architecture:** Mesmo padrão de camadas do plano 7 (domain/application/
infrastructure/presentation + actions + UI com DataTable). A diferença
central é que `Package` não tem chave de negócio natural como o `slug`
de `Niche` — o ID do documento é gerado (`"<nicheSlug>-<índice>"`, mesmo
formato que a migração e o `MockPackageRepository` do `app-photo` já
usam) — e é filho de `Niche` (referência por `nicheSlug`, validada na
criação contra o `NicheRepository`). A UI continua uma única página com
`DataTable` plana (14 pacotes reais, não justifica navegação aninhada
por nicho) — o formulário ganha um seletor de nicho alimentado por
`getNiches()` (plano 7).

**Tech Stack:** Mesmo dos planos 6 e 7. Sem mudança de dependências.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
(seções "Modelo de conteúdo" — `Package`, "Contrato Firestore de
produção" — `packages/{id}`)
**Plano anterior:** `2026-09-09-admin-photo-crud-nicho.md` (7/10) — CRUD
de `Niche` completo, `RepositoryFactory` com fallback mock,
`getNiches()` disponível pro seletor deste plano.
**Precedente investigado:** `app-photo/src/api/domain/package/Package.ts`,
`PackageRepository.ts`, `PackageDTO.ts`,
`infrastructure/repositories/PackageRepositoryImpl.ts` e
`mock/MockPackageRepository.ts` (formato real do dado e do ID gerado);
`admin-photo/src/api/**/niche/*` e `src/app/niches/**` (template direto
de CRUD com ID gerado em vez de natural).

## Global Constraints

- **`Package` não tem chave de negócio natural** — ID do documento é
  gerado em `create()`: `"<nicheSlug>-<índice>"`, onde `índice` é
  `max(sufixos numéricos dos pacotes existentes do mesmo nicheSlug) + 1`
  (ou `0` se não houver nenhum) — nunca uma contagem simples (contagem
  colide após uma remoção no meio da lista; max+1 não).
- **`nicheSlug` é imutável** — igual o `slug` de `Niche` (plano 7):
  definido só na criação, o formulário de edição mostra como texto,
  não como seletor.
- **`create` valida que o `nicheSlug` referencia um nicho existente** —
  `CreatePackageUseCase` recebe também um `NicheRepository` e chama
  `findBySlug` antes de gravar. Defesa em profundidade: a UI já só
  oferece nichos reais no seletor, mas a Server Action é a fronteira de
  confiança real, não o componente React.
- **Sem índice composto do Firestore pro admin** — ao contrário da
  leitura do `app-photo` (`where(nicheSlug) + orderBy(order)`, que
  precisa de índice composto), o `PackageRepositoryImpl` do admin nunca
  combina `where` com `orderBy` na mesma query: `findAll()` traz tudo
  sem filtro e ordena em JS (14 documentos, ordenar em memória é trivial
  e evita a dança de índice); o cálculo do próximo índice em `create()`
  usa só um `where` de igualdade (não precisa de índice).
- Toda Server Action que grava dado chama `assertSession()` antes do
  caso de uso e `callRevalidateWebhook("packages")` depois — mesmo
  padrão do plano 7 (`src/actions/_lib/callRevalidateWebhook.ts`, já
  existe, reutilizado sem alteração).
- Sem `cacheComponents` no `next.config.ts` do `app-photo` — a tag usa
  `unstable_cache`, não `"use cache"`/`cacheTag()` (mesma confirmação do
  plano 7).

---

## Mapa de arquivos

**Criar (em `admin-photo`):**

- `src/api/domain/package/Package.ts`, `PackageRepository.ts`
- `src/api/application/package/PackageDTO.ts`,
  `GetPackagesUseCase.ts`, `CreatePackageUseCase.ts`,
  `UpdatePackageUseCase.ts`, `DeletePackageUseCase.ts` (+ `.test.ts` de
  cada)
- `src/api/presentation/package/PackageViewModel.ts`
- `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`
- `src/api/infrastructure/repositories/mock/MockPackageRepository.ts` (+
  `.test.ts`)
- `src/actions/packages.ts`
- `src/app/packages/page.tsx`
- `src/app/packages/_components/PackagesManager.tsx`,
  `PackageForm.tsx`, `NewPackageModal.tsx`, `EditPackageModal.tsx`

**Modificar (em `admin-photo`):**

- `src/api/infrastructure/repositories/RepositoryFactory.ts` — ganha
  `packages()`

**Modificar (em `app-photo`):**

- `src/api/infrastructure/repositories/PackageRepositoryImpl.ts` —
  ganha `unstable_cache` com tag `"packages"`
- `firestore.indexes.json` (criar — não existe hoje) — índice composto
  `nicheSlug asc, order asc`, já exigido pela query existente de
  `findByNicheSlug` (comentário no código já apontava isso desde o
  plano 2; nunca foi materializado)

---

### Task 1: Domínio, DTO, casos de uso e repositório mock de Package

**Files:**

- Create: `src/api/domain/package/Package.ts`, `PackageRepository.ts`
- Create: `src/api/application/package/PackageDTO.ts`
- Create: `src/api/application/package/GetPackagesUseCase.ts`,
  `CreatePackageUseCase.ts`, `UpdatePackageUseCase.ts`,
  `DeletePackageUseCase.ts` (+ `.test.ts` de cada)
- Create: `src/api/infrastructure/repositories/mock/MockPackageRepository.ts`
  (+ `.test.ts`)

**Interfaces:**

- Consumes: `NicheRepository` (`@/api/domain/niche/NicheRepository`,
  plano 7, já existe).
- Produces: `interface Package { id, nicheSlug, name, price,
description, items: string[], featured: boolean, order: number }`,
  `interface PackageRepository { findAll(): Promise<Package[]>;
create(data: Omit<Package, "id">): Promise<Package>; update(id,
data: Partial<Omit<Package, "id" | "nicheSlug">>): Promise<Package>;
delete(id): Promise<void> }`, `PackageDTO` (idêntica a `Package`),
  `class Create/Update/Delete/GetPackagesUseCase`.

- [ ] **Step 1: Entidade e contrato de repositório**

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
  findAll(): Promise<Package[]>;
  create(data: Omit<Package, "id">): Promise<Package>;
  update(id: string, data: Partial<Omit<Package, "id" | "nicheSlug">>): Promise<Package>;
  delete(id: string): Promise<void>;
}
```

(Sem `findBySlug`/`findById`: nada na UI precisa buscar um pacote
isolado — a lista completa já alimenta a tabela e o modal de edição
recebe a linha diretamente do estado local do `PackagesManager`, mesmo
padrão do `EditNicheModal` do plano 7. Adicionar um método sem
consumidor real violaria YAGNI.)

- [ ] **Step 2: DTO e caso de uso de leitura**

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

Create `src/api/application/package/GetPackagesUseCase.ts`:

```ts
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PackageDTO } from "./PackageDTO";

export class GetPackagesUseCase {
  constructor(private readonly repo: PackageRepository) {}

  async execute(): Promise<PackageDTO[]> {
    const packages = await this.repo.findAll();
    return packages.map((p) => ({ ...p }));
  }
}
```

- [ ] **Step 3: Casos de uso de escrita**

Create `src/api/application/package/CreatePackageUseCase.ts`:

```ts
import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageDTO } from "./PackageDTO";

export class CreatePackageUseCase {
  constructor(
    private readonly repo: PackageRepository,
    private readonly nicheRepo: NicheRepository,
  ) {}

  async execute(data: Omit<Package, "id">): Promise<PackageDTO> {
    const niche = await this.nicheRepo.findBySlug(data.nicheSlug);
    if (!niche) {
      throw new Error(`Nicho "${data.nicheSlug}" não existe — não é possível criar o pacote.`);
    }
    const pkg = await this.repo.create(data);
    return { ...pkg };
  }
}
```

Create `src/api/application/package/UpdatePackageUseCase.ts`:

```ts
import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PackageDTO } from "./PackageDTO";

export class UpdatePackageUseCase {
  constructor(private readonly repo: PackageRepository) {}

  async execute(id: string, data: Partial<Omit<Package, "id" | "nicheSlug">>): Promise<PackageDTO> {
    const pkg = await this.repo.update(id, data);
    return { ...pkg };
  }
}
```

Create `src/api/application/package/DeletePackageUseCase.ts`:

```ts
import type { PackageRepository } from "@/api/domain/package/PackageRepository";

export class DeletePackageUseCase {
  constructor(private readonly repo: PackageRepository) {}

  async execute(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
```

- [ ] **Step 4: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "./MockPackageRepository";

const SAMPLE: import("@/api/domain/package/Package").Package = {
  id: "gestante-2",
  nicheSlug: "gestante",
  name: "Pacote Teste",
  price: "R$ 100",
  description: "",
  items: ["item 1"],
  featured: false,
  order: 2,
};

describe("MockPackageRepository", () => {
  it("lista todos ordenados por nicheSlug e depois por order", async () => {
    const repo = new MockPackageRepository();
    const all = await repo.findAll();
    expect(all.length).toBeGreaterThan(0);
    const sorted = [...all].sort(
      (a, b) => a.nicheSlug.localeCompare(b.nicheSlug) || a.order - b.order,
    );
    expect(all).toEqual(sorted);
  });

  it("cria um pacote gerando o próximo índice do nicho", async () => {
    const repo = new MockPackageRepository();
    const created = await repo.create({
      nicheSlug: "gestante",
      name: "Pacote Novo",
      price: "R$ 900",
      description: "",
      items: [],
      featured: false,
      order: 2,
    });
    expect(created.id).toBe("gestante-2");
  });

  it("gera o próximo índice corretamente mesmo após remoção no meio da lista", async () => {
    const repo = new MockPackageRepository();
    // gestante já tem gestante-0 e gestante-1 nos dados reais.
    await repo.delete("gestante-0");
    const created = await repo.create({
      nicheSlug: "gestante",
      name: "Pacote Depois De Remover",
      price: "R$ 1",
      description: "",
      items: [],
      featured: false,
      order: 5,
    });
    // max(sufixos restantes: 1) + 1 = 2, nunca reutiliza "gestante-0"
    // nem colide com "gestante-1".
    expect(created.id).toBe("gestante-2");
  });

  it("primeiro pacote de um nicho sem nenhum ganha índice 0", async () => {
    const repo = new MockPackageRepository();
    const created = await repo.create({
      nicheSlug: "making-of-da-noiva",
      name: "Primeiro Pacote",
      price: "R$ 1",
      description: "",
      items: [],
      featured: false,
      order: 0,
    });
    expect(created.id).toBe("making-of-da-noiva-0");
  });

  it("atualiza campos parciais sem afetar nicheSlug", async () => {
    const repo = new MockPackageRepository();
    const updated = await repo.update("gestante-0", { name: "Novo Nome" });
    expect(updated.name).toBe("Novo Nome");
    expect(updated.nicheSlug).toBe("gestante");
  });

  it("remove por id", async () => {
    const repo = new MockPackageRepository();
    await repo.delete("gestante-0");
    const all = await repo.findAll();
    expect(all.find((p) => p.id === "gestante-0")).toBeUndefined();
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 6: Implementar o repositório mock, com os 14 pacotes reais**

Create `src/api/infrastructure/repositories/mock/MockPackageRepository.ts` —
transcrição fiel dos 14 pacotes reais, **copiada verbatim** do
`MockPackageRepository.ts` do `app-photo`
(`src/api/infrastructure/repositories/mock/MockPackageRepository.ts`,
plano 2) — mesmo texto, mesma ordem — sobre um array mutável, com
`create`/`update`/`delete` somados:

```ts
import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";

// Transcrição fiel dos 14 pacotes reais — mesmo texto do
// MockPackageRepository do app-photo (plano 2). Aqui o array é mutável:
// create/update/delete simulam escrita real, pra testar o CRUD completo
// sem Firestore.
let PACKAGES: Package[] = [
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
    id: "comercial-1",
    nicheSlug: "comercial",
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
    id: "casamento-civil-0",
    nicheSlug: "casamento-civil",
    name: "Pré-Wedding",
    price: "R$ 500",
    description: "",
    items: [
      "1 hora de sessão em local escolhido pelo casal",
      "Todas as fotos entregues com edição (formato digital)",
    ],
    featured: false,
    order: 0,
  },
  {
    id: "casamento-civil-1",
    nicheSlug: "casamento-civil",
    name: "Cerimônia Civil",
    price: "R$ 700",
    description: "",
    items: [
      "Cobertura da cerimônia no Cartório de Toledo",
      "Todas as fotos entregues com edição (formato digital)",
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

function nextIndexFor(nicheSlug: string): number {
  const suffixes = PACKAGES.filter((p) => p.nicheSlug === nicheSlug).map((p) =>
    Number(p.id.split("-").pop()),
  );
  if (suffixes.length === 0) return 0;
  return Math.max(...suffixes) + 1;
}

export class MockPackageRepository implements PackageRepository {
  async findAll(): Promise<Package[]> {
    return [...PACKAGES].sort(
      (a, b) => a.nicheSlug.localeCompare(b.nicheSlug) || a.order - b.order,
    );
  }

  async create(data: Omit<Package, "id">): Promise<Package> {
    const id = `${data.nicheSlug}-${nextIndexFor(data.nicheSlug)}`;
    const pkg: Package = { id, ...data };
    PACKAGES = [...PACKAGES, pkg];
    return pkg;
  }

  async update(id: string, data: Partial<Omit<Package, "id" | "nicheSlug">>): Promise<Package> {
    const index = PACKAGES.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Pacote "${id}" não encontrado.`);
    const updated = { ...PACKAGES[index], ...data };
    PACKAGES = [...PACKAGES.slice(0, index), updated, ...PACKAGES.slice(index + 1)];
    return updated;
  }

  async delete(id: string): Promise<void> {
    PACKAGES = PACKAGES.filter((p) => p.id !== id);
  }
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockPackageRepository.test.ts`
Expected: PASS — 6 testes.

- [ ] **Step 8: Testes dos casos de uso, contra o mock**

Create `src/api/application/package/GetPackagesUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { GetPackagesUseCase } from "./GetPackagesUseCase";

describe("GetPackagesUseCase", () => {
  it("retorna os 14 pacotes reais", async () => {
    const packages = await new GetPackagesUseCase(new MockPackageRepository()).execute();
    expect(packages).toHaveLength(14);
  });
});
```

Create `src/api/application/package/CreatePackageUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { CreatePackageUseCase } from "./CreatePackageUseCase";

const NEW_PACKAGE = {
  nicheSlug: "gestante",
  name: "Pacote Novo",
  price: "R$ 900",
  description: "",
  items: [] as string[],
  featured: false,
  order: 2,
};

describe("CreatePackageUseCase", () => {
  it("cria um pacote quando o nicho existe", async () => {
    const useCase = new CreatePackageUseCase(
      new MockPackageRepository(),
      new MockNicheRepository(),
    );
    const pkg = await useCase.execute(NEW_PACKAGE);
    expect(pkg.id).toBe("gestante-2");
  });

  it("rejeita nicheSlug inexistente", async () => {
    const useCase = new CreatePackageUseCase(
      new MockPackageRepository(),
      new MockNicheRepository(),
    );
    await expect(useCase.execute({ ...NEW_PACKAGE, nicheSlug: "nao-existe" })).rejects.toThrow(
      /não existe/i,
    );
  });
});
```

Create `src/api/application/package/UpdatePackageUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { UpdatePackageUseCase } from "./UpdatePackageUseCase";

describe("UpdatePackageUseCase", () => {
  it("atualiza um campo do pacote", async () => {
    const pkg = await new UpdatePackageUseCase(new MockPackageRepository()).execute("gestante-0", {
      name: "Nome Atualizado",
    });
    expect(pkg.name).toBe("Nome Atualizado");
  });
});
```

Create `src/api/application/package/DeletePackageUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { GetPackagesUseCase } from "./GetPackagesUseCase";
import { DeletePackageUseCase } from "./DeletePackageUseCase";

describe("DeletePackageUseCase", () => {
  it("remove o pacote", async () => {
    const repo = new MockPackageRepository();
    await new DeletePackageUseCase(repo).execute("gestante-0");
    const all = await new GetPackagesUseCase(repo).execute();
    expect(all.find((p) => p.id === "gestante-0")).toBeUndefined();
  });
});
```

- [ ] **Step 9: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros — `RepositoryFactory.ts` ainda não referencia
`PackageRepositoryImpl` (Task 2) nem `packages()` (Task 2), então nada
quebra por enquanto; os 12 testes novos desta task passam (6 do mock +
2 de create + 1 de update + 1 de delete + 1 de getPackages, mais o teste
de `nicheSlug` inexistente).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(package): domínio, DTO, casos de uso e repositório mock

MockPackageRepository transcreve fielmente os 14 pacotes reais (mesmo
texto do app-photo, plano 2). create() gera o ID como
\"<nicheSlug>-<índice>\", onde índice é max(sufixos existentes)+1 — não
uma contagem simples, que colidiria após remover um pacote no meio da
lista. CreatePackageUseCase valida contra NicheRepository que o
nicheSlug existe antes de gravar."
```

---

### Task 2: `PackageRepositoryImpl` (Firestore, CRUD completo) + `RepositoryFactory`

**Files:**

- Create: `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`

**Interfaces:**

- Produces: `class PackageRepositoryImpl implements PackageRepository`,
  `RepositoryFactory.packages(): PackageRepository` (soma-se a
  `RepositoryFactory.niches()`, já existente).

- [ ] **Step 1: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`:

```ts
import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import { getAdminDb } from "@/api/infrastructure/firebase/admin";

const COLLECTION = "packages";

function toPackage(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Package {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
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

// Sem índice composto: findAll() não filtra (traz tudo, ordena em JS —
// 14 documentos, trivial). O cálculo do próximo índice em create() usa
// só um where de igualdade (nicheSlug) — sem orderBy combinado, não
// exige índice. Ver Global Constraints do plano.
export class PackageRepositoryImpl implements PackageRepository {
  async findAll(): Promise<Package[]> {
    const snapshot = await getAdminDb().collection(COLLECTION).get();
    return snapshot.docs
      .map(toPackage)
      .sort((a, b) => a.nicheSlug.localeCompare(b.nicheSlug) || a.order - b.order);
  }

  async create(data: Omit<Package, "id">): Promise<Package> {
    const existing = await getAdminDb()
      .collection(COLLECTION)
      .where("nicheSlug", "==", data.nicheSlug)
      .get();
    const suffixes = existing.docs.map((doc) => Number(doc.id.split("-").pop()));
    const nextIndex = suffixes.length === 0 ? 0 : Math.max(...suffixes) + 1;
    const id = `${data.nicheSlug}-${nextIndex}`;
    await getAdminDb().collection(COLLECTION).doc(id).set(data);
    return { id, ...data };
  }

  async update(id: string, data: Partial<Omit<Package, "id" | "nicheSlug">>): Promise<Package> {
    await getAdminDb().collection(COLLECTION).doc(id).update(data);
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    if (!doc.exists) throw new Error(`Pacote "${id}" não encontrado depois de atualizar.`);
    return toPackage(doc);
  }

  async delete(id: string): Promise<void> {
    await getAdminDb().collection(COLLECTION).doc(id).delete();
  }
}
```

- [ ] **Step 2: `RepositoryFactory` ganha `packages()`**

Replace `src/api/infrastructure/repositories/RepositoryFactory.ts`:

```ts
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import { env } from "@/config/env.server";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { PackageRepositoryImpl } from "./PackageRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";
import { MockPackageRepository } from "./mock/MockPackageRepository";

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
};
```

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(package): repositório Firestore + RepositoryFactory.packages()

findAll() sem where — traz tudo e ordena em JS, evita precisar de
índice composto (só 14 documentos). create() calcula o próximo índice
via where de igualdade simples (sem orderBy combinado, sem índice
necessário)."
```

---

### Task 3: ViewModel e actions

**Files:**

- Create: `src/api/presentation/package/PackageViewModel.ts`
- Create: `src/actions/packages.ts`

**Interfaces:**

- Consumes: `callRevalidateWebhook` (`src/actions/_lib/`, plano 7, já
  existe), `assertSession` (`src/lib/auth/session.ts`, plano 6).
- Produces: `getPackages(): Promise<PackageViewModel[]>`,
  `createPackage(data): Promise<PackageViewModel>`,
  `updatePackage(id, data): Promise<PackageViewModel>`,
  `deletePackage(id): Promise<void>` — todas exigem sessão.

- [ ] **Step 1: ViewModel**

Create `src/api/presentation/package/PackageViewModel.ts`:

```ts
import type { PackageDTO } from "@/api/application/package/PackageDTO";

export interface PackageViewModel extends PackageDTO {
  featuredLabel: string;
  // Campo sintético, sem valor de negócio — mesma técnica do
  // NicheViewModel (plano 7): dá à DataTable uma key própria pra
  // coluna de ações, sem colidir com nenhuma coluna visível.
  actions: null;
}

export function toPackageViewModel(dto: PackageDTO): PackageViewModel {
  return { ...dto, featuredLabel: dto.featured ? "Sim" : "Não", actions: null };
}
```

- [ ] **Step 2: Actions**

Create `src/actions/packages.ts`:

```ts
"use server";

import type { Package } from "@/api/domain/package/Package";
import { GetPackagesUseCase } from "@/api/application/package/GetPackagesUseCase";
import { CreatePackageUseCase } from "@/api/application/package/CreatePackageUseCase";
import { UpdatePackageUseCase } from "@/api/application/package/UpdatePackageUseCase";
import { DeletePackageUseCase } from "@/api/application/package/DeletePackageUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import {
  toPackageViewModel,
  type PackageViewModel,
} from "@/api/presentation/package/PackageViewModel";
import { assertSession } from "@/lib/auth/session";
import { callRevalidateWebhook } from "./_lib/callRevalidateWebhook";

export async function getPackages(): Promise<PackageViewModel[]> {
  await assertSession();
  const packages = await new GetPackagesUseCase(RepositoryFactory.packages()).execute();
  return packages.map(toPackageViewModel);
}

export async function createPackage(data: Omit<Package, "id">): Promise<PackageViewModel> {
  await assertSession();
  const pkg = await new CreatePackageUseCase(
    RepositoryFactory.packages(),
    RepositoryFactory.niches(),
  ).execute(data);
  await callRevalidateWebhook("packages");
  return toPackageViewModel(pkg);
}

export async function updatePackage(
  id: string,
  data: Partial<Omit<Package, "id" | "nicheSlug">>,
): Promise<PackageViewModel> {
  await assertSession();
  const pkg = await new UpdatePackageUseCase(RepositoryFactory.packages()).execute(id, data);
  await callRevalidateWebhook("packages");
  return toPackageViewModel(pkg);
}

export async function deletePackage(id: string): Promise<void> {
  await assertSession();
  await new DeletePackageUseCase(RepositoryFactory.packages()).execute(id);
  await callRevalidateWebhook("packages");
}
```

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(package): actions com sessão + webhook de revalidação

Mesmo padrão do plano 7: assertSession() antes de cada caso de uso,
callRevalidateWebhook(\"packages\") depois de toda escrita."
```

---

### Task 4: UI — lista, formulário com seletor de nicho, criar/editar/remover

**Files:**

- Create: `src/app/packages/page.tsx`
- Create: `src/app/packages/_components/PackagesManager.tsx`,
  `PackageForm.tsx`, `NewPackageModal.tsx`, `EditPackageModal.tsx`

**Interfaces:**

- Consumes: `getPackages`, `createPackage`, `updatePackage`,
  `deletePackage` (Task 3), `getNiches` (`src/actions/niches.ts`, plano
  7 — alimenta o seletor de nicho), componentes `DataTable`/
  `ConfirmationDialog`/`Dialog`/`Button`/`Input`/`Label` (copiados do
  Presencia, plano 6), `showToast`. Seletor de nicho usa `<select>`
  nativo, não o componente `Select` do kit — ver Step 2.

- [ ] **Step 1: Página (Server Component)**

Create `src/app/packages/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { getPackages } from "@/actions/packages";
import { getNiches } from "@/actions/niches";
import { PackagesManager } from "./_components/PackagesManager";

export default async function PackagesPage() {
  const [packages, niches] = await Promise.all([getPackages(), getNiches()]);
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Pacotes</h1>
      <PackagesManager initialPackages={packages} niches={niches} />
    </main>
  );
}
```

- [ ] **Step 2: Formulário compartilhado (criar e editar)**

Create `src/app/packages/_components/PackageForm.tsx` — `items` como
`<textarea>` linha-a-linha (mesma técnica de `description`/`highlights`
no `NicheForm`, plano 7); `nicheSlug` como `<select>` nativo (evita
depender da API ainda não confirmada do kit `Select` do Presencia —
mais simples e suficiente pra uma lista de 7 opções) quando
`nicheSlugEditable` é `true`, ou texto fixo quando `false`:

```tsx
"use client";

import { Input } from "@/lib/_components/ui/input";
import { Label } from "@/lib/_components/ui/label";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";

export interface PackageFormValues {
  nicheSlug: string;
  name: string;
  price: string;
  description: string;
  items: string;
  featured: boolean;
  order: string;
}

export const EMPTY_PACKAGE_FORM: PackageFormValues = {
  nicheSlug: "",
  name: "",
  price: "",
  description: "",
  items: "",
  featured: false,
  order: "0",
};

export function PackageForm({
  values,
  onChange,
  niches,
  nicheSlugEditable = true,
}: {
  values: PackageFormValues;
  onChange: (values: PackageFormValues) => void;
  niches: NicheViewModel[];
  nicheSlugEditable?: boolean;
}) {
  function set<K extends keyof PackageFormValues>(key: K, value: PackageFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="nicheSlug">Nicho</Label>
        {nicheSlugEditable ? (
          <select
            id="nicheSlug"
            value={values.nicheSlug}
            onChange={(e) => set("nicheSlug", e.target.value)}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Selecione um nicho
            </option>
            {niches.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.title}
              </option>
            ))}
          </select>
        ) : (
          <Input id="nicheSlug" value={values.nicheSlug} disabled />
        )}
      </div>
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="price">Preço</Label>
        <Input
          id="price"
          value={values.price}
          onChange={(e) => set("price", e.target.value)}
          placeholder="ex.: R$ 500 ou Sob consulta"
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="items">Itens inclusos (um por linha)</Label>
        <textarea
          id="items"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          rows={5}
          value={values.items}
          onChange={(e) => set("items", e.target.value)}
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
          checked={values.featured}
          onChange={(e) => set("featured", e.target.checked)}
        />
        Pacote em destaque
      </label>
    </div>
  );
}

export function toPackagePayload(values: PackageFormValues) {
  return {
    nicheSlug: values.nicheSlug,
    name: values.name.trim(),
    price: values.price.trim(),
    description: values.description.trim(),
    items: values.items
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    featured: values.featured,
    order: Number(values.order) || 0,
  };
}

export function fromPackage(pkg: {
  nicheSlug: string;
  name: string;
  price: string;
  description: string;
  items: string[];
  featured: boolean;
  order: number;
}): PackageFormValues {
  return {
    nicheSlug: pkg.nicheSlug,
    name: pkg.name,
    price: pkg.price,
    description: pkg.description,
    items: pkg.items.join("\n"),
    featured: pkg.featured,
    order: String(pkg.order),
  };
}
```

- [ ] **Step 3: Modal de criar**

Create `src/app/packages/_components/NewPackageModal.tsx`:

```tsx
"use client";

import { createPackage } from "@/actions/packages";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import { Button } from "@/lib/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { showToast } from "@/lib/_utils/toast";
import { useState, useTransition } from "react";
import {
  EMPTY_PACKAGE_FORM,
  PackageForm,
  toPackagePayload,
  type PackageFormValues,
} from "./PackageForm";

export function NewPackageModal({
  open,
  onOpenChange,
  niches,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niches: NicheViewModel[];
  onCreated: (pkg: PackageViewModel) => void;
}) {
  const [values, setValues] = useState<PackageFormValues>(EMPTY_PACKAGE_FORM);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const pkg = await createPackage(toPackagePayload(values));
        showToast({ message: "Pacote criado.", variant: "success" });
        onCreated(pkg);
        setValues(EMPTY_PACKAGE_FORM);
        onOpenChange(false);
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Falha ao criar pacote.",
          variant: "error",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo pacote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PackageForm values={values} onChange={setValues} niches={niches} />
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

Create `src/app/packages/_components/EditPackageModal.tsx` — mesma
forma do `NewPackageModal`, com `nicheSlug` desabilitado (imutável) e
chamando `updatePackage(id, data)`:

```tsx
"use client";

import { updatePackage } from "@/actions/packages";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import { Button } from "@/lib/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { showToast } from "@/lib/_utils/toast";
import { useEffect, useState, useTransition } from "react";
import { fromPackage, PackageForm, toPackagePayload, type PackageFormValues } from "./PackageForm";

export function EditPackageModal({
  pkg,
  open,
  onOpenChange,
  niches,
  onUpdated,
}: {
  pkg: PackageViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niches: NicheViewModel[];
  onUpdated: (pkg: PackageViewModel) => void;
}) {
  const [values, setValues] = useState<PackageFormValues | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (pkg) setValues(fromPackage(pkg));
  }, [pkg]);

  if (!pkg || !values) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pkg || !values) return;
    const { nicheSlug: _nicheSlug, ...data } = toPackagePayload(values);
    startTransition(async () => {
      try {
        const updated = await updatePackage(pkg.id, data);
        showToast({ message: "Pacote atualizado.", variant: "success" });
        onUpdated(updated);
        onOpenChange(false);
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Falha ao atualizar pacote.",
          variant: "error",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar pacote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PackageForm
            values={values}
            onChange={setValues}
            niches={niches}
            nicheSlugEditable={false}
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

(`const { nicheSlug: _nicheSlug, ...data } = toPackagePayload(values)` é
seguro: `@typescript-eslint/no-unused-vars` está `'off'` inteiro no
`eslint.config.js` do admin-photo, mesma confirmação do plano 7.)

- [ ] **Step 5: Gerenciador (lista + orquestra os modais)**

Create `src/app/packages/_components/PackagesManager.tsx`:

```tsx
"use client";

import { deletePackage } from "@/actions/packages";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import { Button } from "@/lib/_components/ui/button";
import { ConfirmationDialog } from "@/lib/_components/ui/confirmation-dialog";
import { DataTable, type DataTableColumn } from "@/lib/_components/ui/data-table";
import { showToast } from "@/lib/_utils/toast";
import { useState } from "react";
import { EditPackageModal } from "./EditPackageModal";
import { NewPackageModal } from "./NewPackageModal";

export function PackagesManager({
  initialPackages,
  niches,
}: {
  initialPackages: PackageViewModel[];
  niches: NicheViewModel[];
}) {
  const [packages, setPackages] = useState(initialPackages);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editing, setEditing] = useState<PackageViewModel | null>(null);
  const [deleting, setDeleting] = useState<PackageViewModel | null>(null);

  const columns: DataTableColumn<PackageViewModel>[] = [
    { key: "nicheSlug", header: "Nicho", sortable: true, filterable: true },
    { key: "name", header: "Nome", sortable: true },
    { key: "price", header: "Preço" },
    { key: "order", header: "Ordem", sortable: true },
    { key: "featuredLabel", header: "Destaque?" },
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
    await deletePackage(deleting.id);
    setPackages((current) => current.filter((p) => p.id !== deleting.id));
    showToast({ message: "Pacote removido.", variant: "success" });
  }

  return (
    <>
      <DataTable
        data={packages}
        columns={columns}
        headerAction={<Button onClick={() => setIsNewOpen(true)}>Novo pacote</Button>}
        onRowClick={(row) => setEditing(row)}
      />

      <NewPackageModal
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        niches={niches}
        onCreated={(pkg) => setPackages((current) => [...current, pkg])}
      />

      <EditPackageModal
        pkg={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        niches={niches}
        onUpdated={(updated) =>
          setPackages((current) => current.map((p) => (p.id === updated.id ? updated : p)))
        }
      />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover pacote"
        description={`Remover "${deleting?.name}"? Esta ação não pode ser desfeita.`}
        variant="destructive"
        confirmLabel="Remover"
        onConfirm={handleDelete}
      />
    </>
  );
}
```

(A coluna `nicheSlug` usa `filterable: true` — o kit `DataTable`, plano
6, já suporta um campo de filtro por coluna nativamente; com 6 nichos
tendo pacotes, filtrar por nicho é o caso de uso mais comum desta tela.)

- [ ] **Step 6: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: sem erros.

- [ ] **Step 7: Smoke test manual (precisa de credenciais reais do Firebase)**

Documentar aqui, não executar sem credenciais: logar, abrir
`/packages`, confirmar que os 14 pacotes aparecem, filtrar por um
nicho, criar um pacote de teste escolhendo um nicho no seletor, editá-lo
(confirmar que o campo Nicho aparece travado), removê-lo — conferir que
cada ação mostra o toast certo.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(package): UI de lista, criação, edição e remoção

Formulário com seletor de nicho (nativo <select>, alimentado por
getNiches()) — travado na edição, já que nicheSlug é imutável. Coluna
\"Nicho\" da DataTable é filtrável (filterable: true) — 6 dos 7 nichos
têm pacotes, filtrar por nicho é o caso de uso mais comum da tela."
```

---

### Task 5: `app-photo` — leitura pública ganha a tag `"packages"` + índice composto

**Files:**

- Modify: `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`
  (`app-photo`)
- Create: `firestore.indexes.json` (`app-photo` — não existe hoje)

**Interfaces:**

- Consumes: `unstable_cache` (`next/cache`).
- Produces: mesma interface pública de sempre — `findByNicheSlug(nicheSlug)`
  — agora cacheada com tag `"packages"`.

- [ ] **Step 1: Envolver a leitura em `unstable_cache`**

Replace `src/api/infrastructure/repositories/PackageRepositoryImpl.ts`:

```ts
import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import { unstable_cache } from "next/cache";
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

// db.collection(...).get() não é fetch() — unstable_cache é o jeito
// certo de dar tag a uma leitura assim (mesma confirmação do plano 7).
// admin-photo chama POST /api/revalidate → revalidateTag("packages",
// "max") quando escreve.
const findPackagesByNicheSlug = unstable_cache(
  async (nicheSlug: string): Promise<Package[]> => {
    const snapshot = await db
      .collection(COLLECTION)
      .where("nicheSlug", "==", nicheSlug)
      .orderBy("order", "asc")
      .get();
    return snapshot.docs.map(toPackage);
  },
  ["packages", "findByNicheSlug"],
  { tags: ["packages"] },
);

// Diferente de niches: pacote não tem um identificador natural fora do
// Firestore, então o ID do documento é gerado (a migração usa o mesmo
// formato do MockPackageRepository: "<nicheSlug>-<índice>"), não o slug.
// findByNicheSlug é uma query (where + orderBy), não um doc().get() —
// exige o índice composto (nicheSlug asc, order asc) em
// firestore.indexes.json; sem ele, a query falha em runtime real.
export class PackageRepositoryImpl implements PackageRepository {
  findByNicheSlug(nicheSlug: string): Promise<Package[]> {
    return findPackagesByNicheSlug(nicheSlug);
  }
}
```

- [ ] **Step 2: Criar `firestore.indexes.json` com o índice composto**

Este arquivo não existe hoje no `app-photo` — a query de
`findByNicheSlug` (`where("nicheSlug", "==", ...) + orderBy("order",
"asc")`) já exigia um índice composto desde o plano 2, mas ele nunca
foi materializado (gap pré-existente, descoberto ao tocar neste arquivo
agora). Create `firestore.indexes.json`:

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
    }
  ],
  "fieldOverrides": []
}
```

Documentar no README de deploy (se existir um passo de `firebase deploy
--only firestore:indexes` já documentado no plano 6 do admin-photo) que
o `app-photo` agora também tem um índice pra publicar manualmente antes
do primeiro deploy em produção que use esta query — não executar o
deploy agora, sem projeto Firebase real configurado neste ambiente.

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test && env -u FIREBASE_PROJECT_ID -u FIREBASE_CLIENT_EMAIL -u FIREBASE_PRIVATE_KEY npm run build`
Expected: sem erros — `MockPackageRepository`/testes existentes (plano 2) continuam passando sem alteração (mock não muda, só a implementação
real ganha a camada de cache por cima).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(package): leitura pública ganha cache com tag \"packages\"

unstable_cache envolve findByNicheSlug. Cria firestore.indexes.json
(não existia) com o índice composto (nicheSlug asc, order asc) que essa
query já exigia desde o plano 2 — gap pré-existente, corrigido aqui por
tocar diretamente neste arquivo."
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

Documentar aqui, não executar sem credenciais: com o Firestore de
verdade populado e o índice composto de `packages` já publicado
(`firebase deploy --only firestore:indexes`), logar no admin,
criar/editar/remover um pacote, confirmar no site público (`app-photo`,
sem reiniciar o servidor) que a mudança aparece na página do nicho
correspondente — valida o webhook + `unstable_cache` + `revalidateTag`

- índice composto de ponta a ponta.

* [ ] **Step 4: Commit final (se sobrou algo solto) em cada repo**

```bash
git -C /Users/cesarpisa/Projects/lp-fotografia/admin-photo status --short
git -C /Users/cesarpisa/Projects/lp-fotografia/app-photo status --short
# se houver pendências em qualquer um, git add -A && git commit -m "..."
# app-photo: push fica a critério do usuário (branch feat/nicho-firestore
# já tem PR #2 aberta); admin-photo continua só local.
```

---

## Depois deste plano

`niche` e `package` têm CRUD completo no admin, com o site público
lendo por trás de cache invalidável nos dois casos. Faltam:

- **Plano 9** — Upload de foto + gerenciamento de `Placement` — a peça
  mais nova, sem precedente direto (spec já avisa: vale prototipar a
  query antes do CRUD completo) — mais a integração Cloudinary (upload
  unsigned do browser, delete assinado). Diferente de `Niche`/`Package`,
  `Placement` referencia fotos por `refId` que pode apontar pra `niche`
  OU `package` (`surface` decide qual) — o formulário de criação precisa
  de dois seletores condicionais.
- **Plano 10** — CRUD de `profile` (singleton, só `get`/`update`, sem
  lista nem delete — primeira tela do admin sem `DataTable` nenhuma) +
  deploy real (rodar o serviço na VPS pela primeira vez, publicar os
  índices do Firestore de `niches`... na verdade `niches` não precisa de
  índice — só `packages` precisa, publicado neste plano).
