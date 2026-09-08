# Nicho no Firestore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o texto de `Niche` (nichos/ensaios) vir do Firestore em vez de
um array TypeScript hardcoded, eliminar `EventFormat` como entidade duplicada
(a seção "Eventos" da home passa a filtrar `Niche`), e alinhar a estrutura de
pastas compartilhadas ao padrão `lib/` já usado nos outros projetos da
empresa. É o plano 1 de 10 do desenho em
`docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md` — o menor
corte vertical completo (entidade → domínio → Firestore → action →
componente) antes de repetir o padrão pras outras 4 entidades.

**Architecture:** Camadas `domain` (entidade + contrato de repositório),
`application` (DTO + casos de uso), `infrastructure` (implementação Firestore

- mock + fábrica que escolhe entre as duas) — o mesmo padrão já validado em
  `Presencia/web-admin-console`, `iosana-oliv` e `irizzi`. `src/actions/niches.ts`
  chama os casos de uso e continua compondo com fotos localmente (o Plano 3
  move fotos pro Firestore; até lá, foto não muda de lugar). Fora do Firestore
  em produção, tudo cai automaticamente pro mock — sem Firebase real necessário
  para `npm run test`, `npm run typecheck` ou `npm run build`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `firebase-admin` (SDK
server-side), `zod` (validação de env), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`

## Global Constraints

- Sem Firebase real disponível em CI — `npm run build` e `npm run test`
  precisam funcionar só com o fallback mock (ver Task 4).
- Nenhum componente React (`Niches.tsx`, `ensaios/[slug]/page.tsx`, etc.)
  muda de comportamento visível — mesmos 7 nichos, mesmo texto, mesma ordem,
  mesmas fotos.
- `featured?: boolean` e campos como esse: onde o tipo atual já existe em
  outro arquivo do repo, replicar o formato exato — não inventar variação.
- Todo código novo deste plano vive neste mesmo repositório (`app-photo`) —
  não cria o repositório admin.

---

## Mapa de arquivos

**Renomear** (Task 1):

- `src/shared/_components/*` → `src/lib/_components/*`
- `src/shared/_hooks/*` → `src/lib/_hooks/*`
- `src/shared/_utils/*` → `src/lib/_utils/*`

**Criar:**

- `.env.example`
- `src/lib/config/env.server.ts` + `.test.ts`
- `src/api/infrastructure/firebase/admin.ts`
- `src/api/domain/niche/Niche.ts`
- `src/api/domain/niche/NicheRepository.ts`
- `src/api/application/niche/NicheDTO.ts`
- `src/api/application/niche/GetNichesUseCase.ts`
- `src/api/application/niche/GetNicheBySlugUseCase.ts`
- `src/api/infrastructure/repositories/mock/MockNicheRepository.ts` + `.test.ts`
- `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`
- `src/api/infrastructure/repositories/RepositoryFactory.ts`

**Modificar:**

- `package.json` — adiciona `firebase-admin`, `zod`
- `src/actions/niches.ts` — troca fonte do texto, adiciona `getEventNiches`
- `src/actions/niches.test.ts` — cobre `getEventNiches`
- `src/app/_components/Events.tsx` — usa `getEventNiches`, import `@/lib`
- `src/app/ensaios/[slug]/page.tsx` — remove `generateStaticParams`

**Remover:**

- `src/actions/events.ts`
- `src/actions/events.test.ts`

**Decisão de escopo:** não crio `src/api/presentation/niche/NicheViewModel.ts`
neste plano. Nos repos-irmãos esse arquivo existe para adicionar campos
derivados só de UI (ex: `statusLabel`). Aqui a "moldagem pra UI" é compor o
DTO com a foto (ainda local, não-Firestore) — e essa composição já tem um
lugar natural: `src/actions/niches.ts`, onde já mora hoje. Um ViewModel
idêntico ao DTO sem nenhum campo derivado seria um arquivo sem função. Ver
task 5.

---

### Task 1: Renomear `src/shared` para `src/lib`

**Files:**

- Move: `src/shared/_components/*` → `src/lib/_components/*`
- Move: `src/shared/_hooks/*` → `src/lib/_hooks/*`
- Move: `src/shared/_utils/*` → `src/lib/_utils/*`
- Modify: `src/app/_components/About.tsx:2-3`
- Modify: `src/app/_components/Contact.tsx:5`
- Modify: `src/app/_components/Events.tsx:3`
- Modify: `src/app/_components/Footer.tsx:3`
- Modify: `src/app/_components/Gallery.tsx:5-7`
- Modify: `src/app/_components/Hero.tsx:4-5`
- Modify: `src/app/_components/Niches.tsx:3`
- Modify: `src/app/_components/Testimonials.tsx:1`
- Modify: `src/app/ensaios/[slug]/_components/NicheHero.tsx:6-7`

**Interfaces:**

- Produces: `@/lib/_components/{Section,Polaroid,Logo,CtaLink}`,
  `@/lib/_hooks/{useSwipe,useSlideshow}`, `@/lib/_utils/{cn,whatsapp}` — os
  mesmos exports de hoje, só o caminho de import muda.

- [x] **Step 1: Mover os diretórios**

```bash
git mv src/shared/_components src/lib/_components
git mv src/shared/_hooks src/lib/_hooks
git mv src/shared/_utils src/lib/_utils
rmdir src/shared 2>/dev/null || true
```

- [x] **Step 2: Atualizar os imports nos 9 arquivos consumidores**

Em `src/app/_components/About.tsx`, linhas 2-3:

```ts
import { Section } from "@/lib/_components/Section";
import { Polaroid } from "@/lib/_components/Polaroid";
```

Em `src/app/_components/Contact.tsx`, linha 5:

```ts
import { buildWhatsappLink } from "@/lib/_utils/whatsapp";
```

Em `src/app/_components/Events.tsx`, linha 3:

```ts
import { Section } from "@/lib/_components/Section";
```

Em `src/app/_components/Footer.tsx`, linha 3:

```ts
import { Logo } from "@/lib/_components/Logo";
```

Em `src/app/_components/Gallery.tsx`, linhas 5-7:

```ts
import { Section } from "@/lib/_components/Section";
import { useSwipe } from "@/lib/_hooks/useSwipe";
import { useSlideshow } from "@/lib/_hooks/useSlideshow";
```

Em `src/app/_components/Hero.tsx`, linhas 4-5:

```ts
import { Logo } from "@/lib/_components/Logo";
import { CtaLink } from "@/lib/_components/CtaLink";
```

Em `src/app/_components/Niches.tsx`, linha 3:

```ts
import { Section } from "@/lib/_components/Section";
```

Em `src/app/_components/Testimonials.tsx`, linha 1:

```ts
import { Section } from "@/lib/_components/Section";
```

Em `src/app/ensaios/[slug]/_components/NicheHero.tsx`, linhas 6-7:

```ts
import { useSlideshow } from "@/lib/_hooks/useSlideshow";
import { useSwipe } from "@/lib/_hooks/useSwipe";
```

- [x] **Step 3: Confirmar que não sobrou nenhuma referência a `@/shared`**

Run: `grep -rn "@/shared" src`
Expected: nenhuma linha (comando não imprime nada)

- [x] **Step 4: Rodar a suíte inteira pra confirmar que nada quebrou**

Run: `npm run typecheck && npx eslint . && npm run test && npm run build`
Expected: os quatro comandos terminam com código de saída 0. Os hooks
`useSwipe`/`useSlideshow` e utils `cn`/`whatsapp` levam seus próprios
`.test.ts` junto no `git mv` — a suíte deve continuar com o mesmo número de
testes de antes.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: renomear src/shared para src/lib

Alinha com o padrão de pastas compartilhadas (lib/_components, _hooks,
_utils) já usado nos outros projetos da empresa."
```

---

### Task 2: Dependências e validação de ambiente

**Files:**

- Modify: `package.json`
- Create: `.env.example`
- Create: `src/lib/config/env.server.ts`
- Create: `src/lib/config/env.server.test.ts`

**Interfaces:**

- Produces: `env` (objeto), de `@/lib/config/env.server`, com os campos
  `NODE_ENV: "development" | "test" | "production"`,
  `FIREBASE_PROJECT_ID: string | undefined`,
  `FIREBASE_CLIENT_EMAIL: string | undefined`,
  `FIREBASE_PRIVATE_KEY: string | undefined`.

- [x] **Step 1: Instalar as dependências**

Run: `npm install firebase-admin@^13.4.0 zod@^3.25.76`
Expected: `package.json` e `package-lock.json` atualizados, sem erro de
instalação.

- [x] **Step 2: Escrever o arquivo de exemplo de ambiente**

Create `.env.example`:

```bash
# Credenciais de uma service account do Firebase (projeto Firestore). Sem
# elas, o app cai automaticamente pro modo mock em desenvolvimento/teste —
# ver src/api/infrastructure/repositories/RepositoryFactory.ts. Em produção
# são obrigatórias: sem elas, o app falha ao iniciar.
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

- [x] **Step 3: Escrever a validação de ambiente com teste**

Create `src/lib/config/env.server.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SKIP_ENV_VALIDATION;
  // import() dinâmico é cacheado pelo module graph do Vitest — sem isso, os
  // três testes reusariam o mesmo `env` avaliado no primeiro import().
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env.server", () => {
  it("aceita ausência das três variáveis do Firebase", async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    const { env } = await import("./env.server");
    expect(env.FIREBASE_PROJECT_ID).toBeUndefined();
    expect(env.FIREBASE_CLIENT_EMAIL).toBeUndefined();
    expect(env.FIREBASE_PRIVATE_KEY).toBeUndefined();
  });

  it("rejeita FIREBASE_CLIENT_EMAIL com formato inválido quando presente", async () => {
    process.env.FIREBASE_CLIENT_EMAIL = "nao-e-um-email";
    await expect(import("./env.server")).rejects.toThrow();
  });

  it("aceita as três variáveis quando bem formadas", async () => {
    process.env.FIREBASE_PROJECT_ID = "meu-projeto";
    process.env.FIREBASE_CLIENT_EMAIL = "conta@meu-projeto.iam.gserviceaccount.com";
    process.env.FIREBASE_PRIVATE_KEY = "chave";
    const { env } = await import("./env.server");
    expect(env.FIREBASE_PROJECT_ID).toBe("meu-projeto");
  });
});
```

- [x] **Step 4: Rodar o teste e confirmar que falha (o módulo ainda não existe)**

Run: `npx vitest run src/lib/config/env.server.test.ts`
Expected: FAIL — `Cannot find module './env.server'` ou equivalente.

- [x] **Step 5: Implementar `env.server.ts`**

Create `src/lib/config/env.server.ts`:

```ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Opcionais aqui de propósito: a ausência das três é um estado válido
  // (modo mock em dev/test). A RepositoryFactory decide o que fazer com
  // isso — ver src/api/infrastructure/repositories/RepositoryFactory.ts.
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
});

export const env =
  process.env.SKIP_ENV_VALIDATION === "1"
    ? (process.env as unknown as z.infer<typeof schema>)
    : schema.parse(process.env);
```

- [x] **Step 6: Rodar o teste de novo e confirmar que passa**

Run: `npx vitest run src/lib/config/env.server.test.ts`
Expected: PASS — 3 testes.

- [x] **Step 7: Bootstrap do Firebase Admin**

Create `src/api/infrastructure/firebase/admin.ts`:

```ts
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "@/lib/config/env.server";

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// Proxy: adia getFirestore() pro primeiro uso real, não pro import do
// módulo. Evita inicializar o app do Firebase (e exigir as credenciais)
// em qualquer arquivo que só importe `db` de passagem, sem chamar nada.
export const db = new Proxy({} as Firestore, {
  get(_, prop: string | symbol) {
    return (getFirestore(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});
```

Sem teste automatizado para este arquivo: ele só monta um cliente lazy do
SDK do Firebase, e testar isso de verdade exigiria credenciais reais ou
mockar o `firebase-admin` inteiro — baixo valor pro esforço. A cobertura
real vem indireta, pela `NicheRepositoryImpl` (Task 4) quando houver
Firestore de verdade disponível — documentado como verificação manual ali.

- [x] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros. `npm run build` ainda não roda aqui porque nada usa
`db`/`env` de um jeito que afete o build — confirmado nos passos anteriores.

- [x] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(infra): adicionar firebase-admin, zod e validação de ambiente

Base para as camadas de domínio que seguem. Sem credenciais do Firebase,
env.server aceita os três campos ausentes — RepositoryFactory (task 4)
decide, a partir disso, quando cair pro repositório mock."
```

---

### Task 3: Domínio, DTO, casos de uso e repositório mock de Nicho

**Files:**

- Create: `src/api/domain/niche/Niche.ts`
- Create: `src/api/domain/niche/NicheRepository.ts`
- Create: `src/api/application/niche/NicheDTO.ts`
- Create: `src/api/application/niche/GetNichesUseCase.ts`
- Create: `src/api/application/niche/GetNicheBySlugUseCase.ts`
- Create: `src/api/infrastructure/repositories/mock/MockNicheRepository.ts`
- Test: `src/api/infrastructure/repositories/mock/MockNicheRepository.test.ts`

**Interfaces:**

- Consumes: nada (primeira peça do domínio).
- Produces: `interface Niche` (domain), `interface NicheRepository { findAll(): Promise<Niche[]>; findBySlug(slug: string): Promise<Niche | null>; }`,
  `interface NicheDTO` (idêntica a `Niche`), `class GetNichesUseCase` com
  `.execute(): Promise<NicheDTO[]>`, `class GetNicheBySlugUseCase` com
  `.execute(slug: string): Promise<NicheDTO | null>`, `class MockNicheRepository`
  implementando `NicheRepository`, seedada com os 7 nichos reais.

- [x] **Step 1: Entidade e contrato de repositório**

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
  /** Substitui a antiga entidade EventFormat — ver spec, seção "Achado". */
  showAsEventTeaser: boolean;
  /** Ordem em Niches.tsx (todos os nichos). */
  order: number;
  /** Ordem em Events.tsx (só os com showAsEventTeaser); null nos demais. */
  eventOrder: number | null;
}
```

Create `src/api/domain/niche/NicheRepository.ts`:

```ts
import type { Niche } from "./Niche";

export interface NicheRepository {
  findAll(): Promise<Niche[]>;
  findBySlug(slug: string): Promise<Niche | null>;
}
```

- [x] **Step 2: DTO e casos de uso**

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

- [x] **Step 3: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockNicheRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "./MockNicheRepository";

describe("MockNicheRepository", () => {
  it("retorna os 7 nichos ordenados por order", async () => {
    const repo = new MockNicheRepository();
    const niches = await repo.findAll();
    expect(niches).toHaveLength(7);
    expect(niches.map((n) => n.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("retorna o nicho correspondente ao slug", async () => {
    const repo = new MockNicheRepository();
    const niche = await repo.findBySlug("familia");
    expect(niche?.title).toBe("Família");
  });

  it("retorna null para um slug inexistente", async () => {
    const repo = new MockNicheRepository();
    const niche = await repo.findBySlug("nao-existe");
    expect(niche).toBeNull();
  });

  it("marca exatamente os 3 nichos de evento, na ordem de Events.tsx", async () => {
    const repo = new MockNicheRepository();
    const niches = await repo.findAll();
    const events = niches
      .filter((n) => n.showAsEventTeaser)
      .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0));
    expect(events.map((n) => n.slug)).toEqual([
      "casamento-civil",
      "aniversario-e-eventos",
      "making-of-da-noiva",
    ]);
  });
});
```

- [x] **Step 4: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockNicheRepository.test.ts`
Expected: FAIL — módulo `./MockNicheRepository` não existe.

- [x] **Step 5: Implementar o repositório mock, com o texto real transcrito de `niches.ts`**

Create `src/api/infrastructure/repositories/mock/MockNicheRepository.ts`:

```ts
import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";

// Transcrição fiel do array NICHES que hoje vive em src/actions/niches.ts —
// mesmos textos, na mesma ordem. Serve de dado local (dev/test/CI sem
// Firebase) e de referência para a migração real ao Firestore (plano 5).
const NICHES: Niche[] = [
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
    intro: "", // aguarda doc da cliente
    description: [],
    highlights: [],
    closingLine: "", // aguarda doc da cliente
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
      "Viva cada etapa do seu casamento com intensidade e significado, enquanto cada detalhe é registrado com sensibilidade, elegância e direção profissional. Do pré-wedding ao grande “sim”, criamos memórias que contam a sua história de forma autêntica e atemporal.",
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
}
```

- [x] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockNicheRepository.test.ts`
Expected: PASS — 4 testes.

- [x] **Step 7: Testes dos casos de uso, contra o mock**

Create `src/api/application/niche/GetNichesUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { GetNichesUseCase } from "./GetNichesUseCase";

describe("GetNichesUseCase", () => {
  it("retorna os 7 nichos do repositório", async () => {
    const useCase = new GetNichesUseCase(new MockNicheRepository());
    const niches = await useCase.execute();
    expect(niches).toHaveLength(7);
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
    const useCase = new GetNicheBySlugUseCase(new MockNicheRepository());
    const niche = await useCase.execute("gestante");
    expect(niche?.title).toBe("Gestante");
  });

  it("retorna null para um slug inexistente", async () => {
    const useCase = new GetNicheBySlugUseCase(new MockNicheRepository());
    const niche = await useCase.execute("nao-existe");
    expect(niche).toBeNull();
  });
});
```

- [x] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 6 testes novos (4 do mock + 2 dos use cases) passam.

- [x] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(niche): domínio, DTO, casos de uso e repositório mock

Texto dos 7 nichos transcrito de src/actions/niches.ts, agora com
showAsEventTeaser e eventOrder — substituem a entidade EventFormat.
Repositório mock serve dev/test/CI sem Firebase real."
```

---

### Task 4: Repositório Firestore e fábrica de repositórios

**Files:**

- Create: `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`
- Create: `src/api/infrastructure/repositories/RepositoryFactory.ts`
- Create: `src/api/infrastructure/repositories/RepositoryFactory.test.ts`

**Interfaces:**

- Consumes: `db` de `@/api/infrastructure/firebase/admin` (Task 2),
  `NicheRepository`/`Niche` de `@/api/domain/niche/*` (Task 3),
  `MockNicheRepository` (Task 3), `env` de `@/lib/config/env.server` (Task 2).
- Produces: `class NicheRepositoryImpl implements NicheRepository`,
  `const RepositoryFactory = { niches(): NicheRepository }`.

- [x] **Step 1: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/NicheRepositoryImpl.ts`:

```ts
import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
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

// slug é o próprio ID do documento — findBySlug vira um doc().get() direto,
// sem query.
export class NicheRepositoryImpl implements NicheRepository {
  async findAll(): Promise<Niche[]> {
    const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.map(toNiche);
  }

  async findBySlug(slug: string): Promise<Niche | null> {
    const doc = await db.collection(COLLECTION).doc(slug).get();
    if (!doc.exists) return null;
    return toNiche(doc);
  }
}
```

**Sem teste automatizado para este arquivo** — precisaria de um Firestore
real ou emulador, que este plano não configura (nenhum dos dois é usado em
CI ainda). Verificação fica manual, documentada no Step 4 abaixo, e roda
quando houver Firestore de fato disponível (depois da Task 5 do plano de
migração, spec seção "Migração do acervo atual").

- [x] **Step 2: Fábrica de repositórios**

Create `src/api/infrastructure/repositories/RepositoryFactory.ts`:

```ts
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { env } from "@/lib/config/env.server";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";

function hasFirebaseCredentials(): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

// `next build` roda com NODE_ENV=production mesmo sem credenciais reais
// (CI não tem segredos do Firebase) — NODE_ENV sozinho não distingue
// "gerando o build" de "servindo tráfego real". NEXT_PHASE distingue: só a
// segunda precisa falhar alto na ausência de credenciais.
function isProductionRuntime(): boolean {
  return env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD;
}

// Nome deliberadamente sem prefixo "use": eslint-plugin-react-hooks trata
// qualquer função "use*" como Hook e barra chamá-la fora de componente —
// achado ao rodar eslint durante a implementação desta task.
function shouldUseMock(): boolean {
  if (isProductionRuntime()) return false;
  return !hasFirebaseCredentials();
}

export const RepositoryFactory = {
  niches: (): NicheRepository =>
    shouldUseMock() ? new MockNicheRepository() : new NicheRepositoryImpl(),
};
```

**Achado ao implementar:** a primeira versão gatilhava só em
`env.NODE_ENV === "production"`. Rodei `npm run build` ao final desta task
(Step 3) e ele passou de qualquer forma — mas por acidente: nada ainda
chama `RepositoryFactory` (isso só acontece na Task 5). Assim que a Task 5
ligar `getNiches()`, o build real chamaria essa lógica durante a geração
estática da home, e `next build` seta `NODE_ENV=production` automaticamente
— quebraria em CI, que não tem segredos do Firebase. A distinção via
`NEXT_PHASE` (constante pública de `next/constants`) resolve isso. Ver
teste no Step 2.1 abaixo, que trava esse comportamento.

- [x] **Step 2.1: Testar a fábrica de repositórios**

Create `src/api/infrastructure/repositories/RepositoryFactory.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SKIP_ENV_VALIDATION;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  delete process.env.NEXT_PHASE;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllEnvs();
});

// As classes precisam ser reimportadas dinamicamente junto com a fábrica,
// depois de vi.resetModules() — se viessem de um `import` estático no topo
// do arquivo, seriam uma instância de módulo diferente da que o
// RepositoryFactory reimportado por baixo dos panos usa, e todo
// `toBeInstanceOf` falharia mesmo com o comportamento correto.
async function importFresh() {
  const [{ RepositoryFactory }, { MockNicheRepository }, { NicheRepositoryImpl }] =
    await Promise.all([
      import("./RepositoryFactory"),
      import("./mock/MockNicheRepository"),
      import("./NicheRepositoryImpl"),
    ]);
  return { RepositoryFactory, MockNicheRepository, NicheRepositoryImpl };
}

describe("RepositoryFactory.niches", () => {
  it("usa o mock quando não há credenciais do Firebase, fora de produção", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { RepositoryFactory, MockNicheRepository } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(MockNicheRepository);
  });

  // Regressão: `next build` roda com NODE_ENV=production sem credenciais
  // reais (CI não tem segredos do Firebase). Sem essa distinção, o build
  // tentaria falar com Firestore de verdade e quebraria em CI.
  it("usa o mock durante `next build` (NODE_ENV=production, NEXT_PHASE=phase-production-build), mesmo sem credenciais", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PHASE = "phase-production-build";
    const { RepositoryFactory, MockNicheRepository } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(MockNicheRepository);
  });

  it("usa o repositório real em produção servindo tráfego, quando há credenciais", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.FIREBASE_PROJECT_ID = "meu-projeto";
    process.env.FIREBASE_CLIENT_EMAIL = "conta@meu-projeto.iam.gserviceaccount.com";
    process.env.FIREBASE_PRIVATE_KEY = "chave";
    const { RepositoryFactory, NicheRepositoryImpl } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(NicheRepositoryImpl);
  });
});
```

`NODE_ENV` é somente-leitura no tipo `ProcessEnv` do `@types/node` — por
isso usa `vi.stubEnv` só para ele, e `process.env.X = ...`/`delete` direto
para as outras variáveis (essas não têm essa restrição de tipo).

- [x] **Step 3: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 3 testes novos de `RepositoryFactory.test.ts`
passam. Nenhum outro arquivo do app usa `RepositoryFactory` ainda (isso é a
Task 5) — esta task só precisa compilar e não quebrar o que já existia.

- [ ] **Step 4: Verificação manual (quando houver Firestore real disponível)**

Documentar aqui, não executar agora — não há Firestore de desenvolvimento
configurado neste plano:

1. Popular manualmente um documento em `niches/gestante` no Firestore, com
   os campos de `Niche` (Task 3, Step 1).
2. Rodar um script ad-hoc chamando `new NicheRepositoryImpl().findBySlug("gestante")`
   com `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`
   de uma service account real no ambiente.
3. Confirmar que o objeto retornado bate com o documento.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(niche): repositório Firestore e fábrica de repositórios

Fábrica cai pro mock fora de produção quando as credenciais do Firebase
não estão presentes; em produção, ausência delas é erro imediato, não
fallback silencioso.

next build seta NODE_ENV=production mesmo sem credenciais reais (CI não
tem segredos do Firebase) — a decisão usa NEXT_PHASE para distinguir
build de runtime real, senão o build quebraria assim que algo chamar
RepositoryFactory (Task 5)."
```

---

### Task 5: Ligar `src/actions/niches.ts`, remover `events.ts`, atualizar `Events.tsx`

**Files:**

- Modify: `src/actions/niches.ts`
- Modify: `src/actions/niches.test.ts`
- Modify: `src/app/_components/Events.tsx`
- Delete: `src/actions/events.ts`
- Delete: `src/actions/events.test.ts`

**Interfaces:**

- Consumes: `GetNichesUseCase`, `GetNicheBySlugUseCase` (Task 3),
  `RepositoryFactory.niches()` (Task 4).
- Produces: `getNiches(): Promise<Niche[]>`, `getNicheBySlug(slug): Promise<Niche | null>`,
  `getEventNiches(): Promise<Niche[]>` — as duas primeiras com a mesma
  assinatura pública de hoje (`Niche` continua tendo `image`/`gallery`); a
  terceira é nova, substitui `getEventFormats()`.

- [ ] **Step 1: Atualizar o teste primeiro, para refletir o novo formato esperado**

Replace `src/actions/niches.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getEventNiches, getNicheBySlug, getNiches } from "./niches";

describe("getNiches", () => {
  it("retorna os 7 nichos com slugs únicos", async () => {
    const niches = await getNiches();
    expect(niches).toHaveLength(7);
    expect(new Set(niches.map((n) => n.slug)).size).toBe(7);
  });

  it("deixa intro/description/highlights vazios só nos nichos que aguardam doc da cliente", async () => {
    const niches = await getNiches();
    const pending = ["making-of-da-noiva"];
    for (const niche of niches) {
      const isPending = pending.includes(niche.slug);
      expect(niche.intro === "").toBe(isPending);
      expect(niche.description.length === 0).toBe(isPending);
      expect(niche.highlights.length === 0).toBe(isPending);
    }
  });
});

describe("getNicheBySlug", () => {
  it("retorna o nicho correspondente ao slug", async () => {
    const niche = await getNicheBySlug("familia");
    expect(niche?.title).toBe("Família");
  });

  it("retorna null para um slug inexistente", async () => {
    const niche = await getNicheBySlug("nao-existe");
    expect(niche).toBeNull();
  });
});

describe("getEventNiches", () => {
  it("retorna só os 3 nichos marcados como evento, cada um com foto associada", async () => {
    const events = await getEventNiches();
    expect(events.map((e) => e.slug)).toEqual([
      "casamento-civil",
      "aniversario-e-eventos",
      "making-of-da-noiva",
    ]);
    for (const event of events) {
      expect(event.image.src).toMatch(/^\/fotos\//);
    }
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/actions/niches.test.ts`
Expected: FAIL — `getEventNiches` não existe em `./niches`.

- [ ] **Step 3: Reescrever `src/actions/niches.ts`**

Replace `src/actions/niches.ts`:

```ts
import photosByCategory from "./_mock/photos.json";
import type { Photo } from "./_mock/types";
import type { NicheDTO } from "@/api/application/niche/NicheDTO";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
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

const photos = photosByCategory as Record<string, Photo[]>;

// Mapa temporário slug → categorias de foto. O texto do nicho já vem do
// Firestore (via GetNichesUseCase); a foto continua vindo do pipeline local
// até o plano 3 (spec, seção "Modelo de conteúdo" — Photo/Placement) migrar
// isso também. Nenhum comportamento visível muda enquanto isso não acontece.
const NICHE_PHOTO_CATEGORIES: Record<string, string[]> = {
  "retratos-profissionais": ["profissional", "corporativo", "pessoal"],
  "making-of-da-noiva": ["making-of-noiva"],
  "aniversario-e-eventos": ["evento-aniversario"],
  "casamento-civil": ["casamento-civil"],
  comercial: ["comercial"],
  familia: ["familia"],
  gestante: ["gestante"],
};

function nichePhotos(slug: string): Photo[] {
  const categories = NICHE_PHOTO_CATEGORIES[slug] ?? [];
  return categories.flatMap((c) => photos[c] ?? []);
}

function withPhotos(dto: NicheDTO): Niche {
  const gallery = nichePhotos(dto.slug);
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
  return dtos.map(withPhotos);
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const dto = await new GetNicheBySlugUseCase(RepositoryFactory.niches()).execute(slug);
  return dto ? withPhotos(dto) : null;
}

// Substitui getEventFormats() de events.ts (removido nesta task) — a seção
// "Eventos" da home agora é uma vitrine filtrada de Niche, não uma cópia
// manual. Ver spec, "Achado que muda o modelo".
export async function getEventNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(RepositoryFactory.niches()).execute();
  return dtos
    .filter((n) => n.showAsEventTeaser)
    .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0))
    .map(withPhotos);
}
```

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run src/actions/niches.test.ts`
Expected: PASS — 5 testes.

- [ ] **Step 5: Remover `events.ts` e seu teste**

```bash
git rm src/actions/events.ts src/actions/events.test.ts
```

- [ ] **Step 6: Atualizar `Events.tsx`**

Replace `src/app/_components/Events.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/lib/_components/Section";
import { getEventNiches } from "@/actions/niches";
import { ContactForm } from "./Contact";

export async function Events({ whatsapp }: { whatsapp: string }) {
  const events = await getEventNiches();
  return (
    <Section id="contato" index="04" eyebrow="Eventos" title="Formatos de cobertura">
      <div className="space-y-3">
        {events.map((e) => (
          <Link
            key={e.slug}
            href={`/ensaios/${e.slug}`}
            className="group relative block h-44 overflow-hidden border border-border transition-colors hover:border-gold active:border-gold"
          >
            <Image
              src={e.image.src}
              alt={`Cobertura de ${e.title}`}
              fill
              sizes="(min-width: 640px) 700px, 100vw"
              placeholder="blur"
              blurDataURL={e.image.blurDataURL}
              className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.04] group-active:grayscale-0 group-active:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <h3 className="display-xl text-3xl text-foreground">{e.title}</h3>
              <p className="font-condensed mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
                {e.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <p className="font-condensed mt-8 text-center text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-muted-foreground">
        Personalize seu evento comigo
      </p>
      <div className="mt-4">
        <ContactForm whatsapp={whatsapp} />
      </div>
    </Section>
  );
}
```

(Só duas mudanças reais: `getEventFormats()` → `getEventNiches()`, e
`key={e.title}` → `key={e.slug}` — chave mais estável, slugs são únicos por
construção e títulos não têm essa garantia.)

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; nenhuma referência a `events.ts`/`getEventFormats`
sobra em lugar nenhum.

Run: `grep -rn "getEventFormats\|EventFormat" src`
Expected: nenhuma linha.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix(eventos): eliminar EventFormat, derivar de Niche

events.ts mantinha cópia manual de título/subtítulo/imagem de 3 nichos, já
desincronizada do dado original (aniversario-e-eventos tinha título
diferente nos dois lugares). Events.tsx agora filtra Niche por
showAsEventTeaser — uma fonte de verdade só."
```

---

### Task 6: Nichos deixam de ser estáticos em build time

**Files:**

- Modify: `src/app/ensaios/[slug]/page.tsx:9-12`

**Interfaces:**

- Consumes: nada de novo — mesmas `getNicheBySlug`/`getNiches`/`getPackagesForNiche`/`getBrand`.
- Produces: nada de novo — a rota continua respondendo do mesmo jeito, só
  deixa de ser pré-gerada em build time.

**Por quê:** com o texto do nicho vindo do Firestore, `generateStaticParams`
rodando durante `npm run build` (usado em CI, sem credenciais do Firebase)
cairia no repositório mock — o build passaria, mas geraria só as páginas dos
7 nichos do mock, nunca as que um admin criar depois. Renderização dinâmica
resolve os dois problemas: build não depende de dado externo, e nichos
novos aparecem sem precisar de rebuild.

- [ ] **Step 1: Remover `generateStaticParams`**

Em `src/app/ensaios/[slug]/page.tsx`, linhas 1-12, trocar:

```ts
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNicheBySlug, getNiches } from "@/actions/niches";
import { getPackagesForNiche } from "@/actions/packages";
import { getBrand } from "@/actions/brand";
import { NicheHero } from "./_components/NicheHero";
import { PackagePicker } from "./_components/PackagePicker";

export async function generateStaticParams() {
  const niches = await getNiches();
  return niches.map((n) => ({ slug: n.slug }));
}
```

por:

```ts
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNicheBySlug } from "@/actions/niches";
import { getPackagesForNiche } from "@/actions/packages";
import { getBrand } from "@/actions/brand";
import { NicheHero } from "./_components/NicheHero";
import { PackagePicker } from "./_components/PackagePicker";
```

(`getNiches` sai do import — só `generateStaticParams` usava; o resto do
arquivo, a partir de `generateMetadata`, continua sem mudança.)

- [ ] **Step 2: Rodar a suíte inteira, incluindo build**

Run: `npm run typecheck && npx eslint . && npm run test && npm run build`
Expected: sem erros. No output do build, a rota `/ensaios/[slug]` deixa de
aparecer com o marcador `●` (SSG) na tabela de rotas e passa a aparecer
como `ƒ` (dinâmica) — conferir a tabela impressa ao final do `npm run build`.

- [ ] **Step 3: Smoke test manual**

Run: `npm run dev`, depois abrir `http://localhost:3000/ensaios/gestante`
no navegador.
Expected: página renderiza normalmente, com o mesmo conteúdo de antes
(texto, galeria, pacotes).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(ensaios): renderizar /ensaios/[slug] dinamicamente

generateStaticParams rodava durante o build e dependeria de Firestore
disponível em CI (ou geraria só os nichos do mock). Renderização dinâmica
tira essa dependência do build e faz nichos criados depois pelo admin
aparecerem sem precisar de rebuild."
```

---

### Task 7: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa**

Run: `npm run typecheck && npx eslint . && npx prettier '**/*.{css,ts,tsx,json,md}' --check && npm run test && npm run build`
Expected: os cinco comandos terminam com código de saída 0 — os mesmos
passos que o CI (`ci.yaml`) roda.

- [ ] **Step 2: Confirmar que nenhum arquivo ficou órfão**

Run: `grep -rn "@/shared\|getEventFormats\|from \"./events\"" src`
Expected: nenhuma linha.

- [ ] **Step 3: Smoke test manual da home**

Run: `npm run dev`, abrir `http://localhost:3000`.
Expected: seção "Ensaios para cada momento" mostra os 7 nichos, na mesma
ordem de sempre; seção "Eventos" mostra 3 cards (Casamento Civil,
Aniversário e Eventos, Making-of da Noiva), com os títulos corretos —
"Aniversário e Eventos", não mais "Aniversário infantil".

- [ ] **Step 4: Commit final (se sobrou algo solto) e push**

```bash
git status --short
# se houver pendências, git add -A && git commit -m "..."
git push
```

---

## Depois deste plano

Este plano não migra fotos, pacotes, nem cria o repositório admin — isso é
o resto do roteiro em `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`,
planos 2 a 10. O padrão `domain/application/infrastructure` +
`RepositoryFactory` estabelecido aqui para `niche` se repete, com as mesmas
decisões de design (mock por padrão fora de produção, `slug`/`id` como
document ID do Firestore quando fizer sentido), para `package`, `photo`,
`placement` e `profile`.
