# Profile no Firestore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer os textos fixos da seção "Quem sou" (capa, Profissão,
Família) virem do Firestore (`Profile`, documento único) em vez de
estarem hardcoded dentro de `About.tsx`.

**Architecture:** Mesmo padrão de camadas dos planos 1-3
(`domain/application/infrastructure` + `RepositoryFactory` com fallback
mock fora de produção), mas `Profile` é a primeira entidade singleton do
modelo — sem lista, sem slug/id próprio, um documento fixo
(`profile/main`). Isso troca completamente o formato do repositório: não
há `findAll` nem `findBySlug`/`findByNicheSlug` como nos planos
anteriores, só um `get()` que busca o único documento que existe.
`GetProfileUseCase` lança erro se o documento não existir, em vez de
devolver `null` como os casos de uso anteriores devolviam para uma busca
sem resultado — um "Quem sou" sem texto é uma falha de deploy (site sem
migração rodada), não um estado válido para a página renderizar
silenciosamente vazia.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `firebase-admin`,
Vitest. Toda a infraestrutura (`firebase-admin`, `env.server`,
`RepositoryFactory`, `src/lib`) já existe — este plano só adiciona a
entidade `profile` em cima dela.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
**Planos anteriores:** `docs/superpowers/plans/2026-09-08-nicho-firestore.md`
(1/10), `docs/superpowers/plans/2026-09-08-pacote-firestore.md` (2/10),
`docs/superpowers/plans/2026-09-08-foto-placement-firestore.md` (3/10)

## Global Constraints

- Sem Firebase real disponível em CI — `npm run build` e `npm run test`
  precisam funcionar só com o fallback mock, herdado dos planos
  anteriores.
- Nenhum comportamento visível muda em "Quem sou": `MockProfileRepository`
  é uma transcrição fiel, palavra por palavra, do texto hoje hardcoded em
  `About.tsx` — não é reescrita (mesma regra do plano 2 para os pacotes).
- As fotos da seção (capa, 2 polaroids, altar) já vêm de
  `getAboutPhotos()`/`Placement` com `surface: "quem-sou"` desde o plano
  3 — este plano só migra o **texto**, não repete esse trabalho.
- **Decisão de escopo:** as legendas dos dois polaroids ("Minha base,
  minha família", "Amo esportes radicais e amo adrenalina") e os textos
  `alt` das imagens continuam hardcoded em `About.tsx`. A interface
  `Profile` do spec (`capaCaption`, `profissao`, `familia`) não inclui
  essas legendas — expandir o modelo além do que o spec pede não é
  necessário aqui; se a cliente quiser editá-las futuramente, é um plano
  à parte.

---

## Mapa de arquivos

**Criar:**

- `src/api/domain/profile/Profile.ts`
- `src/api/domain/profile/ProfileRepository.ts`
- `src/api/application/profile/ProfileDTO.ts`
- `src/api/application/profile/GetProfileUseCase.ts`
- `src/api/application/profile/GetProfileUseCase.test.ts`
- `src/api/infrastructure/repositories/mock/MockProfileRepository.ts`
- `src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`
- `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`
- `src/actions/profile.ts`
- `src/actions/profile.test.ts`

**Modificar:**

- `src/api/infrastructure/repositories/RepositoryFactory.ts` — adiciona
  `profile()`
- `src/api/infrastructure/repositories/RepositoryFactory.test.ts` — cobre
  `profile()`
- `src/app/_components/About.tsx` — troca os textos hardcoded por
  `getProfile()`

**Decisão de escopo:** não crio `src/api/presentation/profile/ProfileViewModel.ts`
— mesma razão dos planos 1-2: a "moldagem pra UI" acontece em
`src/actions/profile.ts`.

---

### Task 1: Domínio, DTO, caso de uso e repositório mock de Profile

**Files:**

- Create: `src/api/domain/profile/Profile.ts`
- Create: `src/api/domain/profile/ProfileRepository.ts`
- Create: `src/api/application/profile/ProfileDTO.ts`
- Create: `src/api/application/profile/GetProfileUseCase.ts`
- Create: `src/api/application/profile/GetProfileUseCase.test.ts`
- Create: `src/api/infrastructure/repositories/mock/MockProfileRepository.ts`
- Create: `src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`

**Interfaces:**

- Consumes: nada de novo.
- Produces: `interface Profile { capaCaption: string; profissao: {
titulo, eyebrow, paragrafos: string[]}; familia: { titulo, paragrafos:
string[], legendaFoto } }`, `interface ProfileRepository { get():
Promise<Profile | null> }`, `interface ProfileDTO` (idêntica a
  `Profile`), `class GetProfileUseCase` com `.execute(): Promise<ProfileDTO>`
  (lança erro se `repo.get()` devolver `null`), `class
MockProfileRepository implements ProfileRepository`, seedada com o texto
  real hoje hardcoded em `About.tsx`.

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

// Documento único (spec: "Profile — documento único, seção Quem sou") —
// sem findAll/delete, só get. null é o estado válido só antes da
// migração (plano 5) rodar com Firestore real; o mock sempre devolve algo.
export interface ProfileRepository {
  get(): Promise<Profile | null>;
}
```

- [ ] **Step 2: DTO e caso de uso**

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

export class GetProfileUseCase {
  constructor(private readonly repo: ProfileRepository) {}

  async execute(): Promise<ProfileDTO> {
    const profile = await this.repo.get();
    if (!profile) {
      throw new Error(
        'Documento "profile/main" não encontrado — rode a migração (plano 5) antes de servir tráfego real.',
      );
    }
    return { ...profile };
  }
}
```

- [ ] **Step 3: Escrever o teste do repositório mock primeiro**

Create `src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockProfileRepository } from "./MockProfileRepository";

describe("MockProfileRepository", () => {
  it("retorna o profile com os textos da seção Quem sou", async () => {
    const repo = new MockProfileRepository();
    const profile = await repo.get();
    expect(profile).not.toBeNull();
    expect(profile?.capaCaption).toBe("Há vários anos marcando momentos");
    expect(profile?.profissao.titulo).toBe("Profissão");
    expect(profile?.profissao.paragrafos).toHaveLength(3);
    expect(profile?.familia.titulo).toBe("Família");
    expect(profile?.familia.paragrafos).toHaveLength(3);
    expect(profile?.familia.legendaFoto).toBeTruthy();
  });
});
```

- [ ] **Step 4: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`
Expected: FAIL — módulo `./MockProfileRepository` não existe.

- [ ] **Step 5: Implementar o repositório mock, com o texto real transcrito**

Create `src/api/infrastructure/repositories/mock/MockProfileRepository.ts`:

```ts
import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";

// Transcrição fiel do texto hoje hardcoded em src/app/_components/About.tsx
// — mesmas palavras, mesma ordem de parágrafos. Serve de dado local
// (dev/test/CI sem Firebase) e de referência para a migração real ao
// Firestore (plano 5).
const PROFILE: Profile = {
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
}
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/api/infrastructure/repositories/mock/MockProfileRepository.test.ts`
Expected: PASS — 1 teste.

- [ ] **Step 7: Teste do caso de uso, contra o mock**

Create `src/api/application/profile/GetProfileUseCase.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { MockProfileRepository } from "@/api/infrastructure/repositories/mock/MockProfileRepository";
import { GetProfileUseCase } from "./GetProfileUseCase";

describe("GetProfileUseCase", () => {
  it("retorna o profile", async () => {
    const useCase = new GetProfileUseCase(new MockProfileRepository());
    const profile = await useCase.execute();
    expect(profile.capaCaption).toBe("Há vários anos marcando momentos");
    expect(profile.familia.legendaFoto).toBeTruthy();
  });

  it("lança erro se o documento não existir", async () => {
    const repoSemDado: ProfileRepository = { get: async () => null };
    const useCase = new GetProfileUseCase(repoSemDado);
    await expect(useCase.execute()).rejects.toThrow();
  });
});
```

(O segundo teste usa um objeto literal implementando `ProfileRepository`
direto, em vez de uma classe mock nova — só pra exercitar o branch de
"documento não existe", que `MockProfileRepository` nunca produz por
design.)

- [ ] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros; os 3 testes novos (1 do mock + 2 do use case)
passam.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(profile): domínio, DTO, caso de uso e repositório mock

Profile é a primeira entidade singleton do modelo — sem findAll/delete,
só get(). GetProfileUseCase lança erro se o documento não existir: um
Quem-sou sem texto é falha de deploy, não estado válido. Texto real
transcrito de About.tsx no mock, que serve dev/test/CI sem Firebase."
```

---

### Task 2: Repositório Firestore e fábrica de repositórios

**Files:**

- Create: `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.ts`
- Modify: `src/api/infrastructure/repositories/RepositoryFactory.test.ts`

**Interfaces:**

- Consumes: `db` (Task 2 do plano 1), `ProfileRepository`/`Profile`
  (Task 1), `MockProfileRepository` (Task 1).
- Produces: `class ProfileRepositoryImpl implements ProfileRepository`,
  `RepositoryFactory.profile(): ProfileRepository`.

- [ ] **Step 1: Implementar o repositório Firestore**

Create `src/api/infrastructure/repositories/ProfileRepositoryImpl.ts`:

```ts
import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { db } from "../firebase/admin";

const COLLECTION = "profile";
const DOCUMENT_ID = "main";

// Documento único e fixo — diferente de niches (slug como ID) e de
// packages/placements (query com where/orderBy), aqui não há nenhuma
// variação possível de "qual documento": é sempre profile/main. Sem
// índice composto, sem paginação.
export class ProfileRepositoryImpl implements ProfileRepository {
  async get(): Promise<Profile | null> {
    const doc = await db.collection(COLLECTION).doc(DOCUMENT_ID).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return {
      capaCaption: data.capaCaption,
      profissao: data.profissao,
      familia: data.familia,
    };
  }
}
```

- [ ] **Step 2: Fábrica de repositórios**

Em `src/api/infrastructure/repositories/RepositoryFactory.ts`, adiciona
aos imports:

```ts
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { ProfileRepositoryImpl } from "./ProfileRepositoryImpl";
import { MockProfileRepository } from "./mock/MockProfileRepository";
```

E ao objeto `RepositoryFactory`:

```ts
  profile: (): ProfileRepository =>
    shouldUseMock() ? new MockProfileRepository() : new ProfileRepositoryImpl(),
```

(`hasFirebaseCredentials`, `isProductionRuntime` e `shouldUseMock` não
mudam — são genéricas, já servem qualquer entidade.)

- [ ] **Step 3: Estender o teste da fábrica**

Em `src/api/infrastructure/repositories/RepositoryFactory.test.ts`,
`importFresh` ganha mais 2 imports (`MockProfileRepository`,
`ProfileRepositoryImpl`) devolvidos junto no mesmo objeto, e cada um dos
3 testes ganha uma asserção a mais (`RepositoryFactory.profile()`), no
mesmo padrão que a Task 2 do plano 2 já fez para `packages()` e a Task 2
do plano 3 fez para `photos()`/`placements()`.

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 5: Verificação manual (quando houver Firestore real disponível)**

Documentar aqui, não executar agora:

1. Popular manualmente o documento `profile/main` com os campos de
   `Profile` (Task 1, Step 1).
2. Rodar um script ad-hoc chamando `new ProfileRepositoryImpl().get()`
   com credenciais reais no ambiente.
3. Confirmar que o objeto retornado bate com o documento.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(profile): repositório Firestore e fábrica de repositórios

get() é um doc('main').get() direto — sem query, sem índice composto,
diferente de package/placement. Documento inexistente devolve null; a
migração (plano 5) cria profile/main uma única vez."
```

---

### Task 3: Ligar `src/actions/profile.ts` e `About.tsx`

**Files:**

- Create: `src/actions/profile.ts`
- Create: `src/actions/profile.test.ts`
- Modify: `src/app/_components/About.tsx`

**Interfaces:**

- Consumes: `GetProfileUseCase`, `RepositoryFactory.profile()` (Task
  1-2).
- Produces: `getProfile(): Promise<Profile>`, com `Profile` = `{
capaCaption: string; profissao: { titulo, eyebrow, paragrafos:
string[]}; familia: { titulo, paragrafos: string[], legendaFoto } }`.

- [ ] **Step 1: Escrever o teste da action primeiro**

Create `src/actions/profile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getProfile } from "./profile";

describe("getProfile", () => {
  it("retorna os textos da seção Quem sou", async () => {
    const profile = await getProfile();
    expect(profile.capaCaption).toBeTruthy();
    expect(profile.profissao.titulo).toBeTruthy();
    expect(profile.profissao.eyebrow).toBeTruthy();
    expect(profile.profissao.paragrafos.length).toBeGreaterThan(0);
    expect(profile.familia.titulo).toBeTruthy();
    expect(profile.familia.paragrafos.length).toBeGreaterThan(0);
    expect(profile.familia.legendaFoto).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/actions/profile.test.ts`
Expected: FAIL — módulo `./profile` não existe.

- [ ] **Step 3: Criar `src/actions/profile.ts`**

Create `src/actions/profile.ts`:

```ts
import { GetProfileUseCase } from "@/api/application/profile/GetProfileUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

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

export async function getProfile(): Promise<Profile> {
  const dto = await new GetProfileUseCase(RepositoryFactory.profile()).execute();
  return { ...dto };
}
```

(`Profile` aqui é idêntico a `ProfileDTO` campo por campo — diferente de
`Package`/`Niche`, não há nenhum campo interno como `nicheSlug`/`order`
para descartar antes de devolver pro componente, então `{ ...dto }`
basta, sem um `toProfile()` explícito.)

- [ ] **Step 4: Rodar o teste de novo**

Run: `npx vitest run src/actions/profile.test.ts`
Expected: PASS.

- [ ] **Step 5: Ligar `About.tsx` ao profile**

Em `src/app/_components/About.tsx`, adiciona ao import de
`getAboutPhotos`:

```ts
import { getAboutPhotos } from "@/actions/gallery";
import { getProfile } from "@/actions/profile";
```

Troca:

```ts
export async function About() {
  const { family } = await getAboutPhotos();
```

por:

```ts
export async function About() {
  const [{ family }, profile] = await Promise.all([getAboutPhotos(), getProfile()]);
```

Troca a legenda da capa:

```tsx
<figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold">
  Há vários anos marcando momentos
</figcaption>
```

por:

```tsx
<figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold">
  {profile.capaCaption}
</figcaption>
```

Troca o bloco "Profissão" inteiro:

```tsx
          <h3 className="display-xl relative text-3xl text-foreground">Profissão</h3>
          <p className="font-condensed relative mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-gold">
            Formação e trajetória
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Formada em Design Gráfico com pós-graduação em Marketing Digital, trago uma bagagem de
            mais de 10 anos em comunicação visual e edição.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Minha prática na fotografia une técnica em estúdio, domínio de iluminação e direção de
            retratos a um propósito claro: capturar histórias com intenção e sensibilidade.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Seja para fortalecer sua presença profissional ou registrar marcos da sua vida pessoal,
            meu compromisso é criar imagens que preservem exatamente a verdade e a essência daquilo
            que você viveu.
          </p>
```

por:

```tsx
          <h3 className="display-xl relative text-3xl text-foreground">
            {profile.profissao.titulo}
          </h3>
          <p className="font-condensed relative mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-gold">
            {profile.profissao.eyebrow}
          </p>
          {profile.profissao.paragrafos.map((paragrafo, i) => (
            <p key={i} className="relative mt-3 text-sm leading-relaxed text-foreground">
              {paragrafo}
            </p>
          ))}
```

Troca o bloco "Família" (só o título e os 3 parágrafos — a legenda do
polaroid entre os dois blocos, `notes={[...]}` em `<Row>`, e a legenda da
foto do altar são passos separados abaixo):

```tsx
          <h3 className="display-xl relative text-3xl text-foreground">Família</h3>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Aprendi o verdadeiro valor da fotografia quando percebi como a saudade busca, nos
            detalhes, os momentos que não puderam ser registrados.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Foi assim que entendi que fotografar vai muito além de uma imagem bonita: é criar pontes
            para o passado, preservando histórias, pessoas e a essência de quem amamos.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Porque o tempo passa rápido, mas uma fotografia tem o poder de nos levar de volta
            exatamente para onde fomos felizes.
          </p>
```

por:

```
          <h3 className="display-xl relative text-3xl text-foreground">{profile.familia.titulo}</h3>
          {profile.familia.paragrafos.map((paragrafo, i) => (
            <p key={i} className="relative mt-3 text-sm leading-relaxed text-foreground">
              {paragrafo}
            </p>
          ))}
```

(Bloco de código sem a tag `tsx` de propósito: com ela, o `prettier
--write` que roda em todo commit deste projeto — via lint-staged, sobre
`**/*.md` também — reinterpreta este trecho como um programa TypeScript
solto e o reescreve como `<h3>...</h3>;` seguido de um bloco `{ ... }`
com `;` dentro do map, o que não é JSX válido se colado literalmente.
Verificado rodando `prettier --write` de verdade sobre este arquivo
antes de escrever este plano — sem a tag, o bloco fica estável. Note
também que o `<h3>` de "Família" cabe numa linha só, diferente do de
"Profissão" — `{profile.familia.titulo}` é mais curto que
`{profile.profissao.titulo}` somado à indentação; ambos foram
verificados contra o `eslint --fix` real no código de verdade antes de
escrever este plano.)

Troca a legenda da foto do altar:

```tsx
<figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
  Quando estive no altar, ao lado de quem amo e com a nossa filha nos braços, percebi de vez: essas
  são as imagens que contam quem nós somos. Viver esse momento do outro lado da câmera me fez
  valorizar ainda mais cada segundo que registro. Ter esse dia guardado me traz de volta o abraço, o
  olhar e a certeza de que a família é o nosso bem mais precioso.
</figcaption>
```

por:

```tsx
<figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
  {profile.familia.legendaFoto}
</figcaption>
```

**O que não muda:** os `alt` das imagens, as legendas dos polaroids em
`<Row notes={["Minha base, minha família", "Amo esportes radicais e amo
adrenalina"]} />` e toda a estrutura visual (classes, poses, `Section`)
continuam hardcoded — fora do escopo de `Profile` (ver Global
Constraints).

- [ ] **Step 6: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(profile): ligar actions/profile.ts e About.tsx

About.tsx troca os textos hardcoded (capa, Profissão, Família) por
getProfile(). Legendas dos polaroids e alt das imagens continuam
hardcoded — fora da interface Profile do spec."
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
`http://localhost:3000` e rolar até a seção "Quem sou".
Expected: os textos de capa, Profissão e Família aparecem exatamente
como antes da migração (o mock é uma transcrição fiel) — capa com a
legenda "Há vários anos marcando momentos", bloco Profissão com o
eyebrow "Formação e trajetória" e os 3 parágrafos, bloco Família com os
3 parágrafos, foto do altar com a legenda longa. Nada quebra.

- [ ] **Step 3: Commit final (se sobrou algo solto) e push**

```bash
git status --short
# se houver pendências, git add -A && git commit -m "..."
git push
```

---

## Depois deste plano

`niche`, `package`, `photo`/`placement` e `profile` — as quatro
entidades do modelo de conteúdo — estão todas ligadas ao Firestore (com
fallback mock). Falta:

- **Plano 5** — o script de migração: sobe as 87 fotos reais pro
  Cloudinary, grava `Photo`/`Placement`/`Profile` de produção (incluindo
  o documento `profile/main`), e migra `niches.ts`/`packages.ts` pro
  Firestore de produção.
- **Planos 6-10** — o repositório admin: scaffold + auth, CRUD de
  nicho/pacote, upload de foto + placement, CRUD de profile (`get`/
  `update`, sem lista — a primeira tela admin sem uma grade), deploy.

Este plano deixa `About.tsx` rodando inteiramente sobre o mock sintético
em dev/test/CI — texto idêntico ao real (transcrição fiel), diferente da
foto de capa/família que já era mock desde o plano 3. Isso é esperado e
documentado no Step 2 da Task 4.
