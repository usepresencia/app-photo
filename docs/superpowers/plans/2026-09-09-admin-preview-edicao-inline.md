# Preview com edição inline — admin-photo + app-photo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O admin-photo ganha uma rota `/preview` que exibe o app-photo real dentro de um iframe, com botões de editar sobre cada seção — clicar abre o modal de edição já existente (Niche/Package/Placement), salvar publica de verdade e recarrega o preview.

**Architecture:** iframe do app-photo real (não uma recriação visual) + handshake via `postMessage` entre um componente cliente inerte no app-photo (`PreviewOverlay`) e um componente cliente no admin-photo (`PreviewFrame`). Cada seção editável do app-photo vira um `<Editable type id>` (wrapper fino, `data-editable="tipo:id"`); o `PreviewFrame` resolve cliques via um registro `EDIT_HANDLERS` e reaproveita 100% dos modais de edição dos planos 7-10. app-photo continua sem autenticação nenhuma — o overlay só ativa depois de confirmar via mensagem que está rodando dentro do admin-photo.

**Tech Stack:** Next.js 15 App Router (ambos os repos), React 18.3, TypeScript, Zod (env vars), Vitest + Testing Library + jsdom, Tailwind CSS.

**Spec:** `app-photo/docs/superpowers/specs/2026-09-09-admin-preview-edicao-inline-design.md`

## Global Constraints

- app-photo permanece **sem autenticação nenhuma** — nenhuma sessão, cookie ou lógica de admin entra nele. O overlay é puramente cosmético e só ativa após confirmação de origem.
- O preview cobre o site inteiro numa única entrega (home + todas as páginas de nicho), não incremental.
- Criar conteúdo pelo preview está **fora de escopo** — o preview só edita o que já existe. Toda criação continua pelas telas de CRUD normais do admin-photo.
- Marcação de seções editáveis é sempre via o componente `<Editable type id>` — nunca o atributo `data-editable` cru repetido em cada arquivo.
- Roteamento de clique pro modal certo é sempre via o registro `EDIT_HANDLERS` — nunca if/else crescendo por tipo de entidade.
- Salvar um modal sempre recarrega o iframe do preview (o webhook de revalidação dos planos 7-11 já invalida o cache do lado do app-photo — só faltava o reload).
- app-photo ganha o mesmo conjunto de cabeçalhos de segurança que o admin-photo já tem, mais um `Content-Security-Policy` com `frame-ancestors` restrito à origem do admin-photo (nunca `X-Frame-Options: DENY`, nunca um `frame-ancestors *`).
- Reaproveitar **exatamente** `EditNicheModal`, `EditPackageModal` e `EditPlacementModal` (admin-photo, planos 7-10) — nenhum modal novo.
- `niche.closingLine` é dado morto (nunca renderizado em nenhuma página) — fica fora da lista de superfícies editáveis.
- **Toda vez que `<Editable>` embrulha um elemento que hoje é filho direto de um container `grid`/`flex` (ou que depende de `position: absolute` relativo ao pai), as classes de posicionamento/tamanho daquele elemento migram pro `className` do `<Editable>`, e o elemento original ganha `block`/`w-full`/`h-full` explícitos.** Motivo: `<Editable>` renderiza sua própria `<div>`; se o elemento original for a peça que o grid/flex está posicionando e a `<div>` nova entrar no meio sem essas classes, o item de grid/flex passa a ser a `<div>` (sem posicionamento) e o elemento original volta ao fluxo normal (quebra a página). Quando o elemento embrulhado já vive num container de fluxo simples (`space-y-*`, bloco comum), embrulhar por fora sem mover nada é seguro.
- Comandos de verificação (repita a cada task): `npm run typecheck && npm run lint && npm test && npm run build`, rodado no repositório do arquivo tocado na task.
- Commits pequenos e frequentes, um por task, com o trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Mapa de arquivos

### app-photo

| Arquivo                                                       | O que muda                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/api/application/photo/PlacedPhotoDTO.ts`                 | Ganha `placementId: string`                                       |
| `src/api/application/photo/GetPhotosBySurfaceUseCase.ts`      | Popula `placementId` a partir do `placement.id`                   |
| `src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts` | Asserção nova pra `placementId`                                   |
| `src/actions/_mock/types.ts`                                  | `Photo` ganha `placementId: string`                               |
| `src/actions/_shared/getPhotosBySurface.ts`                   | `toPhoto()` inclui `placementId`                                  |
| `src/app/_components/_HeroFilmStrip.test.tsx`                 | Fixture de `Photo` ganha `placementId`                            |
| `src/lib/config/env.client.ts`                                | **Novo** — `NEXT_PUBLIC_ADMIN_PHOTO_URL`                          |
| `src/lib/config/env.client.test.ts`                           | **Novo**                                                          |
| `next.config.ts`                                              | `headers()` com cabeçalhos de segurança + CSP `frame-ancestors`   |
| `next.config.test.ts`                                         | **Novo**                                                          |
| `src/app/globals.css`                                         | Regras `[data-editable]` do modo preview                          |
| `src/app/_components/Editable.tsx`                            | **Novo**                                                          |
| `src/app/_components/Editable.test.tsx`                       | **Novo**                                                          |
| `src/app/_components/PreviewOverlay.tsx`                      | **Novo**                                                          |
| `src/app/_components/PreviewOverlay.test.tsx`                 | **Novo**                                                          |
| `src/app/layout.tsx`                                          | Monta `<PreviewOverlay />`                                        |
| `src/app/_components/_HeroFilmStrip.tsx`                      | Embrulha a foto atual do slot                                     |
| `src/app/_components/About.tsx`                               | Embrulha capa, texto profissão, polaroids, texto família, altar   |
| `src/app/_components/About.test.tsx`                          | **Novo**                                                          |
| `src/app/_components/Gallery.tsx`                             | Embrulha cada foto da galeria da home                             |
| `src/app/_components/Gallery.test.tsx`                        | **Novo**                                                          |
| `src/app/ensaios/[slug]/_components/NicheHero.tsx`            | Ganha prop `slug`; embrulha título/subtítulo e fotos do slideshow |
| `src/app/ensaios/[slug]/_components/NicheHero.test.tsx`       | **Novo**                                                          |
| `src/app/ensaios/[slug]/page.tsx`                             | Passa `slug` pro `NicheHero`; embrulha intro/descrição/destaques  |
| `src/app/ensaios/[slug]/page.test.tsx`                        | **Novo**                                                          |
| `src/app/ensaios/[slug]/_components/PackagePicker.tsx`        | Embrulha cada card de pacote                                      |
| `src/app/ensaios/[slug]/_components/PackagePicker.test.tsx`   | **Novo**                                                          |
| `src/app/ensaios/[slug]/_components/NicheGallery.tsx`         | Embrulha cada foto da galeria do nicho                            |
| `src/app/ensaios/[slug]/_components/NicheGallery.test.tsx`    | **Novo**                                                          |
| `src/app/_components/Niches.tsx`                              | Embrulha cada card de nicho da home                               |
| `src/app/_components/Niches.test.tsx`                         | **Novo**                                                          |
| `src/app/_components/Events.tsx`                              | Embrulha cada card de evento da home                              |
| `src/app/_components/Events.test.tsx`                         | **Novo**                                                          |

### admin-photo

| Arquivo                                            | O que muda                        |
| -------------------------------------------------- | --------------------------------- |
| `src/config/env.client.ts`                         | Ganha `NEXT_PUBLIC_APP_PHOTO_URL` |
| `src/config/env.client.test.ts`                    | Casos novos                       |
| `src/app/preview/_components/editHandlers.ts`      | **Novo**                          |
| `src/app/preview/_components/editHandlers.test.ts` | **Novo**                          |
| `src/app/preview/_components/PreviewFrame.tsx`     | **Novo**                          |
| `src/app/preview/page.tsx`                         | **Novo**                          |
| `src/app/_components/AdminNav.tsx`                 | Ganha link "Preview"              |

---

### Task 1: `placementId` de ponta a ponta no app-photo

**Files:**

- Modify: `src/api/application/photo/PlacedPhotoDTO.ts`
- Modify: `src/api/application/photo/GetPhotosBySurfaceUseCase.ts`
- Modify: `src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts`
- Modify: `src/actions/_mock/types.ts`
- Modify: `src/actions/_shared/getPhotosBySurface.ts`
- Modify: `src/app/_components/_HeroFilmStrip.test.tsx`

**Interfaces:**

- Produces: `PlacedPhotoDTO.placementId: string`; `Photo.placementId: string` (o tipo público consumido por todo `src/app/_components/*` e `src/app/ensaios/**`).

Hoje nenhum componente que renderiza foto tem acesso ao id do placement — só ao id da própria foto (`PlacedPhotoDTO.id`, que na verdade é o id da foto, não do placement). `GetPhotosBySurfaceUseCase.execute()` nunca lê `placement.id`. Sem esse campo, nenhuma tarefa de `<Editable type="placement">` das próximas tasks tem o que passar como `id`. Esta task é pré-requisito de tudo que segue.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final de `src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts`:

```ts
it("inclui o id do placement (não o da foto) em cada resultado", async () => {
  const photos = await useCase().execute("hero");
  for (const photo of photos) {
    expect(photo.placementId).toMatch(/^mock-placement-\d+$/);
  }
  // ids de placement são únicos por resultado, mesmo quando duas fotos
  // diferentes aparecem na mesma superfície.
  expect(new Set(photos.map((p) => p.placementId)).size).toBe(photos.length);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- GetPhotosBySurfaceUseCase -t "id do placement"`
Expected: FAIL — `photo.placementId` é `undefined`.

- [ ] **Step 3: Implementar**

`src/api/application/photo/PlacedPhotoDTO.ts`:

```ts
export interface PlacedPhotoDTO {
  id: string;
  placementId: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  role: string | null;
}
```

`src/api/application/photo/GetPhotosBySurfaceUseCase.ts`, dentro do loop `for (const placement of placements)`:

```ts
result.push({ ...photo, placementId: placement.id, role: placement.role });
```

`src/actions/_mock/types.ts`:

```ts
export interface Photo {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  placementId: string;
}
```

`src/actions/_shared/getPhotosBySurface.ts`, `toPhoto()`:

```ts
export function toPhoto(p: PlacedPhotoDTO): Photo {
  return {
    src: p.src,
    width: p.width,
    height: p.height,
    blurDataURL: p.blurDataURL,
    placementId: p.placementId,
  };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- GetPhotosBySurfaceUseCase -t "id do placement"`
Expected: PASS

- [ ] **Step 5: Corrigir o typecheck quebrado pela mudança de tipo**

`Photo` ganhou um campo obrigatório — o único lugar do projeto que constrói objetos `Photo` literais em teste é `src/app/_components/_HeroFilmStrip.test.tsx`. Rode `npm run typecheck` pra confirmar (deve falhar em `_HeroFilmStrip.test.tsx`), depois edite a fixture:

```ts
const photos: Photo[] = Array.from({ length: 9 }, (_, i) => ({
  src: `/fotos/teste/foto-${i}.webp`,
  width: 1600,
  height: 1067,
  blurDataURL: "data:image/webp;base64,AA",
  placementId: `placement-${i}`,
}));
```

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Rodar toda a suíte e o build**

Run: `npm run lint && npm test && npm run build`
Expected: tudo verde — nenhum outro teste depende do shape exato de `Photo`/`PlacedPhotoDTO` (os testes existentes em `gallery.test.ts`/`niches.test.ts` fazem asserções por campo, não `toEqual` de objeto inteiro).

- [ ] **Step 7: Commit**

```bash
git add src/api/application/photo/PlacedPhotoDTO.ts src/api/application/photo/GetPhotosBySurfaceUseCase.ts src/api/application/photo/GetPhotosBySurfaceUseCase.test.ts src/actions/_mock/types.ts src/actions/_shared/getPhotosBySurface.ts src/app/_components/_HeroFilmStrip.test.tsx
git commit -m "$(cat <<'EOF'
feat: thread placementId through the public Photo type

Nenhum componente de renderização tinha acesso ao id do placement —
só ao id da própria foto. Pré-requisito pro preview com edição
inline: cada <Editable type="placement"> precisa desse id.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `env.client.ts` no app-photo (`NEXT_PUBLIC_ADMIN_PHOTO_URL`)

**Files:**

- Create: `src/lib/config/env.client.ts`
- Create: `src/lib/config/env.client.test.ts`

**Interfaces:**

- Consumes: nenhuma
- Produces: `clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL: string | undefined`, usado por `PreviewOverlay.tsx` (Task 5).

app-photo hoje não tem nenhum arquivo de env client-side (só `src/lib/config/env.server.ts`) e nenhuma variável `NEXT_PUBLIC_*` em uso — esta é a primeira. Segue exatamente a convenção já estabelecida em `env.server.ts`: `SKIP_ENV_VALIDATION=1` pula a validação, senão `schema.parse()` lança.

- [ ] **Step 1: Escrever o teste que falha**

`src/lib/config/env.client.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SKIP_ENV_VALIDATION;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env.client", () => {
  it("aceita ausência de NEXT_PUBLIC_ADMIN_PHOTO_URL", async () => {
    delete process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL;
    const { clientEnv } = await import("./env.client");
    expect(clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL).toBeUndefined();
  });

  it("rejeita um valor que não é uma URL", async () => {
    process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL = "nao-e-url";
    await expect(import("./env.client")).rejects.toThrow();
  });

  it("aceita uma URL válida", async () => {
    process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL = "http://localhost:3001";
    const { clientEnv } = await import("./env.client");
    expect(clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL).toBe("http://localhost:3001");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- env.client`
Expected: FAIL — `./env.client` não existe.

- [ ] **Step 3: Implementar**

`src/lib/config/env.client.ts`:

```ts
import { z } from "zod";

const schema = z.object({
  // URL pública do admin-photo — única origem que PreviewOverlay confia
  // pra ativar o modo de edição (ver PreviewOverlay.tsx). Opcional: sem
  // ela, o site funciona normal pra qualquer visitante — só o preview do
  // admin não teria como se conectar (ver spec do preview com edição
  // inline, docs/superpowers/specs/2026-09-09-admin-preview-edicao-inline-design.md).
  NEXT_PUBLIC_ADMIN_PHOTO_URL: z.string().url().optional(),
});

export const clientEnv =
  process.env.SKIP_ENV_VALIDATION === "1"
    ? (process.env as unknown as z.infer<typeof schema>)
    : schema.parse({
        NEXT_PUBLIC_ADMIN_PHOTO_URL: process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL,
      });
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- env.client`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/config/env.client.ts src/lib/config/env.client.test.ts
git commit -m "$(cat <<'EOF'
feat: add app-photo client env schema (NEXT_PUBLIC_ADMIN_PHOTO_URL)

Primeira env var client-side do app-photo — usada pelo PreviewOverlay
pra validar que uma mensagem de handshake veio de verdade do
admin-photo. Segue a mesma convenção resiliente de env.server.ts.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Cabeçalhos de segurança + `frame-ancestors` no app-photo

**Files:**

- Modify: `next.config.ts`
- Create: `next.config.test.ts`

**Interfaces:**

- Consumes: `process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL` (lido diretamente do `process.env`, não de `clientEnv` — `next.config.ts` roda fora do runtime do Next, antes do bundler existir, então não pode importar `env.client.ts`).
- Produces: nenhuma interface nova pra outras tasks — self-contained.

app-photo hoje não define `headers()` nenhum. Ganha o mesmo conjunto que o admin-photo já tem, mais um `Content-Security-Policy` com `frame-ancestors` restrito à origem do admin-photo (nunca `X-Frame-Options: DENY`, que bloquearia o próprio admin-photo de iframá-lo).

- [ ] **Step 1: Escrever o teste que falha**

`next.config.test.ts` (raiz do projeto — o `include` do `vitest.config.ts` já cobre `*.test.{ts,tsx}` na raiz):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("next.config headers", () => {
  it("restringe frame-ancestors a 'self' sem NEXT_PUBLIC_ADMIN_PHOTO_URL", async () => {
    delete process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL;
    const { default: config } = await import("./next.config");
    const [{ headers }] = await config.headers!();
    const csp = headers.find((h) => h.key === "Content-Security-Policy");
    expect(csp?.value).toBe("frame-ancestors 'self'");
  });

  it("libera a origem do admin-photo quando a env var está definida", async () => {
    process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL = "http://localhost:3001";
    const { default: config } = await import("./next.config");
    const [{ headers }] = await config.headers!();
    const csp = headers.find((h) => h.key === "Content-Security-Policy");
    expect(csp?.value).toBe("frame-ancestors 'self' http://localhost:3001");
  });

  it("inclui os cabeçalhos de segurança básicos", async () => {
    const { default: config } = await import("./next.config");
    const [{ headers }] = await config.headers!();
    const keys = headers.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
      ]),
    );
    expect(keys).not.toContain("X-Frame-Options");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- next.config`
Expected: FAIL — `config.headers` é `undefined`.

- [ ] **Step 3: Implementar**

`next.config.ts` completo:

```ts
import type { NextConfig } from "next";

const adminPhotoOrigin = process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL;

// 'self' sozinho quando a env var não está setada: o site nunca fica sem
// política nenhuma (nem um wildcard, nem 'none' que quebraria o próprio
// preview quando a var estiver configurada). Ver spec do preview com
// edição inline — "risco de configuração, não de segurança".
const frameAncestors = adminPhotoOrigin ? `'self' ${adminPhotoOrigin}` : "'self'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` },
];

const nextConfig: NextConfig = {
  // Libera abrir o servidor de desenvolvimento pelo IP da rede local (celular ou
  // outro computador testando o site). Sem isso o Next devolve 403 nos chunks de
  // /_next/static e o JS do client nunca roda: a página aparece, mas nada
  // interativo funciona — o film strip do hero fica congelado, por exemplo.
  // O curinga cobre a faixa inteira para não quebrar quando o roteador troca o IP.
  // Vale apenas em desenvolvimento; não tem efeito no build de produção.
  allowedDevOrigins: ["192.168.*.*"],

  images: {
    // Cloudinary faz resize/format na entrega; ver next-image-loader.ts.
    // O otimizador embutido do Next fica desligado pra qualquer imagem
    // (loaderFile custom vale pra todo next/image, local ou remoto) — ver
    // Global Constraints do plano de migração pro Cloudinary.
    loader: "custom",
    loaderFile: "./next-image-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  async redirects() {
    return [
      {
        // Conteúdo do nicho ainda não disponível — aguarda doc da cliente (ver niches.ts).
        source: "/ensaios/making-of-da-noiva",
        destination: "/ensaios/casamento-civil",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- next.config`
Expected: PASS (3 testes)

- [ ] **Step 5: Rodar a suíte inteira e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts next.config.test.ts
git commit -m "$(cat <<'EOF'
feat: add security headers and frame-ancestors CSP to app-photo

app-photo não tinha headers() nenhum. frame-ancestors libera
especificamente a origem do admin-photo (via NEXT_PUBLIC_ADMIN_PHOTO_URL)
pro iframe do preview funcionar, sem abrir pra qualquer origem.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Componente `<Editable>` + CSS do modo preview

**Files:**

- Create: `src/app/_components/Editable.tsx`
- Create: `src/app/_components/Editable.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: `Editable({ type: "niche" | "package" | "placement" | "profile", id: string, className?: string, children }): JSX.Element` — renderiza `<div data-editable="{type}:{id}" className={className}>{children}</div>`. Usado por todas as Tasks 7-13.

- [ ] **Step 1: Escrever o teste que falha**

`src/app/_components/Editable.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Editable } from "./Editable";

describe("Editable", () => {
  it("marca o elemento com data-editable no formato tipo:id", () => {
    const { container } = render(
      <Editable type="niche" id="familia">
        <p>conteúdo</p>
      </Editable>,
    );
    expect(container.firstElementChild?.getAttribute("data-editable")).toBe("niche:familia");
  });

  it("repassa className pro elemento raiz, sem perder o data-editable", () => {
    const { container } = render(
      <Editable type="package" id="p1" className="col-span-6">
        <p>conteúdo</p>
      </Editable>,
    );
    const el = container.firstElementChild;
    expect(el?.className).toContain("col-span-6");
    expect(el?.getAttribute("data-editable")).toBe("package:p1");
  });

  it("renderiza os filhos normalmente", () => {
    const { getByText } = render(
      <Editable type="profile" id="main">
        <span>texto do perfil</span>
      </Editable>,
    );
    expect(getByText("texto do perfil")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Editable.test`
Expected: FAIL — `./Editable` não existe.

- [ ] **Step 3: Implementar**

`src/app/_components/Editable.tsx`:

```tsx
"use client";

// Wrapper fino: marca qualquer seção do site como alvo de edição no
// preview do admin-photo (PreviewOverlay.tsx lê o atributo data-editable
// via delegação de clique — nenhum handler aqui, de propósito, pra não
// pagar o custo de um listener por instância numa página com dezenas
// delas). className existe pra receber classes de posicionamento (grid/
// flex/absolute) quando o elemento embrulhado É o item posicionado pelo
// pai — ver Global Constraints do plano de preview com edição inline.
export function Editable({
  type,
  id,
  className = "",
  children,
}: {
  type: "niche" | "package" | "placement" | "profile";
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-editable={`${type}:${id}`} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Editable.test`
Expected: PASS (3 testes)

- [ ] **Step 5: Adicionar o CSS do modo preview**

Ao final de `src/app/globals.css`:

```css
/* Preview com edição inline (admin-photo): ativado só dentro do iframe,
   depois do handshake em PreviewOverlay.tsx — nunca visível fora do
   preview. pointer-events: auto existe porque o film strip do hero (ver
   _HeroFilmStrip.tsx) é decorativo (pointer-events-none no container),
   e um filho pode reativar eventos mesmo com o pai desabilitado. outline
   com offset negativo desenha pra dentro do próprio box, evitando corte
   por ancestrais com overflow-hidden (comum neste projeto). */
html[data-preview-active] [data-editable] {
  pointer-events: auto;
  cursor: pointer;
}

html[data-preview-active] [data-editable]:hover {
  outline: 2px solid var(--gold);
  outline-offset: -2px;
}
```

- [ ] **Step 6: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 7: Commit**

```bash
git add src/app/_components/Editable.tsx src/app/_components/Editable.test.tsx src/app/globals.css
git commit -m "$(cat <<'EOF'
feat: add Editable wrapper and preview-mode CSS

Componente reutilizável que marca uma seção como editável — evita
repetir o atributo data-editable cru em cada arquivo instrumentado
nas próximas tasks.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Componente `<PreviewOverlay>`

**Files:**

- Create: `src/app/_components/PreviewOverlay.tsx`
- Create: `src/app/_components/PreviewOverlay.test.tsx`

**Interfaces:**

- Consumes: `clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL` (Task 2).
- Produces: `PreviewOverlay(): JSX.Element | null` (componente, montado em `layout.tsx` na Task 6); exporta também `originOf`, `isHandshakeAck`, `parseEditableTarget` — funções puras testadas isoladamente.

Mensagens usam três tipos fixos: `"app-photo:preview:ping"` (app-photo → admin), `"app-photo:preview:ack"` (admin → app-photo) e `"app-photo:preview:edit"` (app-photo → admin, com `entityType`/`id`). O `PreviewFrame` do admin-photo (Task 16) precisa usar exatamente os mesmos três literais.

- [ ] **Step 1: Escrever os testes que falham**

`src/app/_components/PreviewOverlay.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { isHandshakeAck, originOf, parseEditableTarget, PreviewOverlay } from "./PreviewOverlay";

describe("originOf", () => {
  it("retorna a origem de uma URL válida", () => {
    expect(originOf("http://localhost:3001/qualquer/coisa")).toBe("http://localhost:3001");
  });

  it("retorna null pra valor ausente ou inválido", () => {
    expect(originOf(undefined)).toBeNull();
    expect(originOf("nao-e-url")).toBeNull();
  });
});

describe("isHandshakeAck", () => {
  const adminOrigin = "http://localhost:3001";

  it("aceita ack vindo da origem certa", () => {
    expect(
      isHandshakeAck({ origin: adminOrigin, data: { type: "app-photo:preview:ack" } }, adminOrigin),
    ).toBe(true);
  });

  it("rejeita origem errada", () => {
    expect(
      isHandshakeAck(
        { origin: "http://outro.com", data: { type: "app-photo:preview:ack" } },
        adminOrigin,
      ),
    ).toBe(false);
  });

  it("rejeita mensagem de outro tipo", () => {
    expect(
      isHandshakeAck({ origin: adminOrigin, data: { type: "outra-coisa" } }, adminOrigin),
    ).toBe(false);
  });
});

describe("parseEditableTarget", () => {
  it("separa tipo e id no primeiro ':'", () => {
    expect(parseEditableTarget("placement:mock-placement-3")).toEqual({
      entityType: "placement",
      id: "mock-placement-3",
    });
  });

  it("retorna null sem ':' ou valor vazio/nulo", () => {
    expect(parseEditableTarget("semdoispontos")).toBeNull();
    expect(parseEditableTarget(null)).toBeNull();
    expect(parseEditableTarget("")).toBeNull();
  });
});

describe("PreviewOverlay", () => {
  it("fica inerte fora de um iframe (window.self === window.top)", () => {
    render(<PreviewOverlay />);
    expect(document.documentElement.hasAttribute("data-preview-active")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- PreviewOverlay.test`
Expected: FAIL — `./PreviewOverlay` não existe.

- [ ] **Step 3: Implementar**

`src/app/_components/PreviewOverlay.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { clientEnv } from "@/lib/config/env.client";

const PING = "app-photo:preview:ping";
const ACK = "app-photo:preview:ack";
const EDIT = "app-photo:preview:edit";

export function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function isHandshakeAck(
  event: { origin: string; data: unknown },
  adminOrigin: string,
): boolean {
  return event.origin === adminOrigin && (event.data as { type?: string } | null)?.type === ACK;
}

export function parseEditableTarget(
  value: string | null,
): { entityType: string; id: string } | null {
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep === -1) return null;
  const entityType = value.slice(0, sep);
  const id = value.slice(sep + 1);
  if (!entityType || !id) return null;
  return { entityType, id };
}

// Inerte por padrão — só ativa depois de confirmar, por postMessage, que
// está sendo carregado dentro do admin-photo (ver spec do preview com
// edição inline). Nunca ativa pra um visitante comum: fora de um iframe,
// ou dentro de um iframe de qualquer outra origem, esse componente não
// faz nada.
export function PreviewOverlay() {
  const [active, setActive] = useState(false);
  const adminOrigin = originOf(clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL);

  useEffect(() => {
    if (!adminOrigin || window.self === window.top) return;

    function handleMessage(event: MessageEvent) {
      if (isHandshakeAck(event, adminOrigin!)) setActive(true);
    }
    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: PING }, adminOrigin);
    return () => window.removeEventListener("message", handleMessage);
  }, [adminOrigin]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-preview-active", active);
  }, [active]);

  useEffect(() => {
    if (!active || !adminOrigin) return;

    // Delegação num único listener no document, em vez de um handler por
    // <Editable> — mais barato numa página com dezenas de seções
    // editáveis, e captura em fase de captura pra interceptar o clique
    // antes que o próprio site reaja (ex.: navegar um <Link>, selecionar
    // um pacote no PackagePicker).
    function handleClick(event: MouseEvent) {
      const el = (event.target as HTMLElement).closest("[data-editable]");
      const parsed = parseEditableTarget(el?.getAttribute("data-editable") ?? null);
      if (!parsed) return;
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: EDIT, ...parsed }, adminOrigin);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, adminOrigin]);

  return null;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- PreviewOverlay.test`
Expected: PASS (9 testes)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/PreviewOverlay.tsx src/app/_components/PreviewOverlay.test.tsx
git commit -m "$(cat <<'EOF'
feat: add PreviewOverlay handshake component

Ativa o modo de edição só depois de confirmar, por postMessage, que
está rodando dentro do admin-photo — inerte pra qualquer visitante
comum e fora de um iframe.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Montar `<PreviewOverlay>` no layout raiz

**Files:**

- Modify: `src/app/layout.tsx`

**Interfaces:**

- Consumes: `PreviewOverlay` (Task 5).

- [ ] **Step 1: Implementar**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import "./theme.css";
import { Footer } from "./_components/Footer";
import { PreviewOverlay } from "./_components/PreviewOverlay";

const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-condensed", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-hand", subsets: ["latin"] });

const appUrl = "https://denisegalvao.com.br"; // TODO: substituir pelo domínio real quando definido

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Denise Galvão | Fotografia de ensaios e eventos",
  description:
    "Valorize sua imagem com um ensaio pensado nos mínimos detalhes, unindo direção estratégica, estética e autenticidade. Cada sessão é conduzida de forma personalizada, respeitando seu estilo, objetivo e essência.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${jakarta.variable} ${caveat.variable}`}>
      <body className="font-sans antialiased">
        <PreviewOverlay />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verificar (sem teste novo — sem lógica nova, `PreviewOverlay` já testado na Task 5)**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat: mount PreviewOverlay in the root layout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Embrulhar as fotos do hero (film strip)

**Files:**

- Modify: `src/app/_components/_HeroFilmStrip.tsx`
- Modify: `src/app/_components/_HeroFilmStrip.test.tsx`

**Interfaces:**

- Consumes: `Editable` (Task 4); `Photo.placementId` (Task 1).

O container do film strip é decorativo (`pointer-events-none`, `aria-hidden="true"`) — o CSS da Task 4 já cobre isso (`[data-editable] { pointer-events: auto }` reativa eventos no filho mesmo com o pai desabilitado). Só a foto **atual** de cada slot (não a "fantasma" que está saindo) fica editável — editar uma foto que já está desaparecendo não faz sentido.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar a `src/app/_components/_HeroFilmStrip.test.tsx`:

```tsx
it("marca a foto atual do slot como editável com o placementId certo", () => {
  const { container } = render(<HeroFilmStrip photos={photos} />);
  const slot = primeiroSlot(container);
  const editable = slot.querySelector("[data-editable]");
  expect(editable?.getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- _HeroFilmStrip.test -t "marca a foto atual"`
Expected: FAIL — nenhum `[data-editable]` no slot.

- [ ] **Step 3: Implementar**

`src/app/_components/_HeroFilmStrip.tsx` — adicionar o import e trocar o `RotatingPhoto`:

```tsx
import { Editable } from "./Editable";
```

```tsx
function RotatingPhoto({ photo }: { photo: Photo }) {
  const [current, setCurrent] = useState(photo);
  const [previous, setPrevious] = useState<Photo | null>(null);
  const [troca, setTroca] = useState(0);

  if (photo !== current) {
    setPrevious(current);
    setCurrent(photo);
    setTroca((t) => t + 1);
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {previous && <Quadro photo={previous} />}
      <Editable type="placement" id={current.placementId} className="absolute inset-0">
        <Quadro key={`foto-${troca}`} photo={current} className="hero-photo-in" />
      </Editable>
      {troca > 0 && (
        <div
          key={`flash-${troca}`}
          aria-hidden="true"
          className="hero-flash pointer-events-none absolute inset-0 bg-white"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- _HeroFilmStrip.test`
Expected: PASS (todos os testes do arquivo, incluindo o novo)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/_HeroFilmStrip.tsx src/app/_components/_HeroFilmStrip.test.tsx
git commit -m "$(cat <<'EOF'
feat: make hero film strip photos editable in preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Embrulhar a seção "Quem sou" (`About.tsx`)

**Files:**

- Modify: `src/app/_components/About.tsx`
- Create: `src/app/_components/About.test.tsx`

**Interfaces:**

- Consumes: `Editable` (Task 4); `getAboutPhotos()`/`getProfile()` (já existentes, resolvem contra os mocks em ambiente de teste).

Cinco regiões editáveis nesta seção: capa (`type="placement"`), bloco de texto "profissão" (`type="profile" id="main"`), dois polaroids (`type="placement"`, via `Row`), bloco de texto "família" (`type="profile" id="main"`), foto do altar (`type="placement"`). `About` é um Server Component assíncrono — o teste chama a função diretamente (`await About()`) e renderiza o elemento resolvido, técnica que dispensa mockar `next/navigation`/`headers` porque não há nada disso aqui.

- [ ] **Step 1: Escrever o teste que falha**

`src/app/_components/About.test.tsx`:

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

  it("marca os dois blocos de texto como editáveis (tipo profile, id main)", async () => {
    const { container } = render(await About());
    const profileEditables = container.querySelectorAll('[data-editable="profile:main"]');
    expect(profileEditables).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- About.test`
Expected: FAIL — `data-editable` não existe em nenhum elemento.

- [ ] **Step 3: Implementar**

`src/app/_components/About.tsx` completo:

```tsx
import Image from "next/image";
import { Section } from "@/lib/_components/Section";
import { Polaroid } from "@/lib/_components/Polaroid";
import { getAboutPhotos } from "@/actions/gallery";
import { getProfile } from "@/actions/profile";
import type { Photo } from "@/actions/_mock/types";
import { Editable } from "./Editable";

// A proporção vai para dentro do cartão, não na célula da grade: a altura passa
// a vir da foto mais a legenda, para o texto crescer sem ser cortado.
const poses = [
  { grid: "col-span-6 col-start-1 -rotate-[3.5deg] z-10", aspect: "aspect-3/4" },
  { grid: "col-span-6 col-start-6 -mt-36 rotate-[4deg] z-30", aspect: "aspect-square" },
  { grid: "col-span-6 col-start-4 -mt-40 -rotate-[2deg] z-20", aspect: "aspect-3/4" },
];

function Row({ photos, notes = [] }: { photos: Photo[]; notes?: string[] }) {
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
              caption={notes[i]}
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

export async function About() {
  const [{ family }, profile] = await Promise.all([getAboutPhotos(), getProfile()]);

  return (
    <Section id="quem-sou" index="01" eyebrow="Quem sou" title="Denise Galvão">
      <div className="space-y-4">
        <Editable type="placement" id={family[0].placementId}>
          <figure className="frame-gold relative overflow-hidden p-1.5">
            <div className="relative aspect-4/5 overflow-hidden sm:aspect-16/10">
              <img
                src={family[0].src}
                alt="Denise Galvão segurando sua câmera durante um ensaio"
                className="h-full w-full object-cover grayscale"
              />
            </div>
            <figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold">
              {profile.capaCaption}
            </figcaption>
          </figure>
        </Editable>

        <Editable type="profile" id="main">
          <div className="relative overflow-hidden border-l-2 border-gold p-6 pl-5">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
              style={{
                boxShadow: "var(--shadow-gold)",
                maskImage:
                  "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
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
          </div>
        </Editable>
        <Row
          photos={[family[1], family[3]]}
          notes={["Minha base, minha família", "Amo esportes radicais e amo adrenalina"]}
        />

        <Editable type="profile" id="main">
          <div className="relative overflow-hidden border-l-2 border-gold p-6 pl-5">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
              style={{
                boxShadow: "var(--shadow-gold)",
                maskImage:
                  "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
            <h3 className="display-xl relative text-3xl text-foreground">
              {profile.familia.titulo}
            </h3>
            {profile.familia.paragrafos.map((paragrafo, i) => (
              <p key={i} className="relative mt-3 text-sm leading-relaxed text-foreground">
                {paragrafo}
              </p>
            ))}
          </div>
        </Editable>
        <Editable type="placement" id={family[2].placementId}>
          <figure
            style={{ ["--tape-rot" as string]: "-6deg" }}
            className="polaroid tape relative w-full -rotate-2"
          >
            <div className="relative aspect-3/2 w-full overflow-hidden bg-background">
              <Image
                src={family[2].src}
                alt="Denise Galvão no altar, em família"
                fill
                sizes="(min-width: 768px) 720px, 92vw"
                placeholder="blur"
                blurDataURL={family[2].blurDataURL}
                className="object-cover grayscale transition-all duration-500 hover:grayscale-0 active:grayscale-0"
              />
            </div>
            <figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
              {profile.familia.legendaFoto}
            </figcaption>
          </figure>
        </Editable>
      </div>
    </Section>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- About.test`
Expected: PASS (2 testes)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/About.tsx src/app/_components/About.test.tsx
git commit -m "$(cat <<'EOF'
feat: make the "Quem sou" section editable in preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Embrulhar a galeria da home (`Gallery.tsx`)

**Files:**

- Modify: `src/app/_components/Gallery.tsx`
- Create: `src/app/_components/Gallery.test.tsx`

**Interfaces:**

- Consumes: `Editable` (Task 4).

`GalleryAlbum` é `"use client"` e recebe `photos: GalleryPhoto[]` via prop — testável de forma síncrona, sem `await`. Cada `<figure>` é filho direto de um `grid grid-cols-12`: a classe de posição (`spreadPoses[i]`) migra pro `Editable`, o `<figure>` fica só com as classes visuais.

- [ ] **Step 1: Escrever o teste que falha**

`src/app/_components/Gallery.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Gallery } from "./Gallery";
import type { GalleryPhoto } from "@/actions/gallery";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const photos: GalleryPhoto[] = Array.from({ length: 6 }, (_, i) => ({
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
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Gallery.test`
Expected: FAIL

- [ ] **Step 3: Implementar**

`src/app/_components/Gallery.tsx` — adicionar `import { Editable } from "./Editable";` e trocar o `<figure>` do map:

```tsx
{
  spread.map((photo, i) => {
    const n = page * 6 + i + 1;
    return (
      <Editable
        key={photo.placementId}
        type="placement"
        id={photo.placementId}
        className={spreadPoses[i]}
      >
        <figure
          style={{ ["--tape-rot" as string]: `${i % 2 ? 5 : -6}deg` }}
          className={`group polaroid relative transition-all duration-500 hover:z-60 hover:rotate-0 hover:scale-[1.04] active:z-60 active:rotate-0 active:scale-[1.04] ${i % 3 === 0 ? "tape" : i % 3 === 1 ? "tape-corner" : ""}`}
        >
          <div className="relative h-[calc(100%-var(--polaroid-legenda))] w-full overflow-hidden bg-background">
            <Image
              src={photo.src}
              alt={`Foto ${n} do portfólio`}
              fill
              sizes="(min-width: 640px) 500px, 60vw"
              placeholder="blur"
              blurDataURL={photo.blurDataURL}
              className="object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-active:scale-105 group-active:grayscale-0"
            />
          </div>
          <figcaption className="font-hand absolute inset-x-2 bottom-1 flex items-baseline justify-between text-[0.85rem] leading-none">
            <span>{photo.label}</span>
            <span className="font-condensed text-[0.5rem] tracking-[0.25em] opacity-60">
              {String(n).padStart(2, "0")}
            </span>
          </figcaption>
        </figure>
      </Editable>
    );
  });
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Gallery.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/Gallery.tsx src/app/_components/Gallery.test.tsx
git commit -m "$(cat <<'EOF'
feat: make home gallery photos editable in preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Embrulhar o hero e o texto do nicho (`NicheHero.tsx` + `page.tsx`)

**Files:**

- Modify: `src/app/ensaios/[slug]/_components/NicheHero.tsx`
- Create: `src/app/ensaios/[slug]/_components/NicheHero.test.tsx`
- Modify: `src/app/ensaios/[slug]/page.tsx`
- Create: `src/app/ensaios/[slug]/page.test.tsx`

**Interfaces:**

- Consumes: `Editable` (Task 4).
- Produces: `NicheHero` ganha a prop obrigatória `slug: string` — o único chamador é `page.tsx` (atualizado nesta mesma task).

`NicheHero` é `"use client"`, testável de forma síncrona. `page.tsx` é um Server Component assíncrono (`await NichePage({ params })`).

- [ ] **Step 1: Escrever os testes que falham**

`src/app/ensaios/[slug]/_components/NicheHero.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NicheHero } from "./NicheHero";
import type { Photo } from "@/actions/_mock/types";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

function foto(placementId: string): Photo {
  return {
    src: `/fotos/teste/${placementId}.webp`,
    width: 1600,
    height: 1067,
    blurDataURL: "data:image/webp;base64,AA",
    placementId,
  };
}

describe("NicheHero", () => {
  it("marca título e subtítulo como editáveis (tipo niche)", () => {
    const { container } = render(
      <NicheHero
        slug="familia"
        title="Família"
        subtitle="Ensaios em família"
        landscapePhotos={[foto("p1")]}
        portraitPhotos={[foto("p2")]}
      />,
    );
    const editable = container.querySelector('[data-editable="niche:familia"]');
    expect(editable).not.toBeNull();
    expect(editable?.textContent).toContain("Família");
    expect(editable?.textContent).toContain("Ensaios em família");
  });

  it("marca a foto exibida no slideshow como editável (tipo placement)", () => {
    const { container } = render(
      <NicheHero
        slug="familia"
        title="Família"
        subtitle="Ensaios em família"
        landscapePhotos={[foto("p1")]}
        portraitPhotos={[foto("p2")]}
      />,
    );
    const placementEditables = container.querySelectorAll('[data-editable^="placement:"]');
    // um slide visível por breakpoint (mobile "portrait" + desktop "landscape")
    expect(placementEditables).toHaveLength(2);
  });
});
```

`src/app/ensaios/[slug]/page.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import NichePage from "./page";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("NichePage", () => {
  it("marca o bloco de intro/descrição/destaques como editável (tipo niche)", async () => {
    const jsx = await NichePage({ params: Promise.resolve({ slug: "familia" }) });
    const { container } = render(jsx);
    const editable = container.querySelector('[data-editable="niche:familia"]');
    expect(editable).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- NicheHero.test page.test`
Expected: FAIL — `slug` não existe em `NicheHero` (erro de tipo) e nenhum `data-editable` em nenhum dos dois.

- [ ] **Step 3: Implementar**

`src/app/ensaios/[slug]/_components/NicheHero.tsx` completo:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useSlideshow } from "@/lib/_hooks/useSlideshow";
import { useSwipe } from "@/lib/_hooks/useSwipe";
import type { Photo } from "@/actions/_mock/types";
import { Editable } from "@/app/_components/Editable";

function AlbumSlides({ photos }: { photos: Photo[] }) {
  const { index, direction, goTo } = useSlideshow({ count: photos.length, autoplayMs: 5000 });
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => goTo(index + 1 === photos.length ? 0 : index + 1),
    onSwipeRight: () => goTo(index === 0 ? photos.length - 1 : index - 1),
  });

  return (
    <>
      <div className="album-stage relative h-full w-full overflow-hidden" {...swipeHandlers}>
        {photos.map((photo, i) =>
          i === index ? (
            <Editable
              key={photo.placementId}
              type="placement"
              id={photo.placementId}
              className={`absolute inset-0 ${direction === 1 ? "album-page-next" : "album-page-prev"}`}
            >
              <Image
                src={photo.src}
                alt={`Foto ${String(i + 1).padStart(2, "0")} do ensaio`}
                fill
                sizes="100vw"
                placeholder="blur"
                blurDataURL={photo.blurDataURL}
                className="object-contain"
                priority={i === 0}
              />
            </Editable>
          ) : null,
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-3">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir para a foto ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-gold" : "w-1.5 bg-white/30"}`}
          />
        ))}
      </div>
    </>
  );
}

export function NicheHero({
  slug,
  title,
  subtitle,
  landscapePhotos,
  portraitPhotos,
}: {
  slug: string;
  title: string;
  subtitle: string;
  landscapePhotos: Photo[];
  portraitPhotos: Photo[];
}) {
  return (
    <header className="relative aspect-2/3 overflow-hidden bg-surface sm:aspect-3/2">
      <div className="h-full w-full sm:hidden">
        <AlbumSlides photos={portraitPhotos} />
      </div>
      <div className="hidden h-full w-full sm:block">
        <AlbumSlides photos={landscapePhotos} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-linear-to-t from-background via-background/70 to-transparent" />

      <div className="absolute inset-0 z-20 mx-auto flex w-full max-w-3xl flex-col justify-end px-5 pb-14">
        <Link
          href="/"
          aria-label="Voltar"
          className="absolute left-5 top-6 z-30 flex size-10 items-center justify-center rounded-full border border-gold/40 bg-background/50 text-gold backdrop-blur-sm transition-colors hover:border-gold"
        >
          <FaArrowLeft className="size-4" />
        </Link>
        <Editable type="niche" id={slug}>
          <span className="gold-rule block" />
          <h1 className="display-xl mt-4 text-[2.8rem] leading-[0.95] text-foreground sm:text-6xl">
            {title}
          </h1>
          <p className="font-condensed mt-1 text-[0.68rem] uppercase tracking-[0.4em] text-muted-foreground">
            {subtitle}
          </p>
        </Editable>
      </div>
    </header>
  );
}
```

`src/app/ensaios/[slug]/page.tsx` — passar `slug` pro `NicheHero` e embrulhar a `<section>`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNicheBySlug } from "@/actions/niches";
import { getPackagesForNiche } from "@/actions/packages";
import { getBrand } from "@/actions/brand";
import { Editable } from "@/app/_components/Editable";
import { NicheHero } from "./_components/NicheHero";
import { PackagePicker } from "./_components/PackagePicker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const niche = await getNicheBySlug(slug);
  if (!niche) return { title: "Ensaio não encontrado", robots: { index: false } };

  const title = `${niche.title} | Denise Galvão Fotografia`;
  const description = niche.intro || niche.subtitle;
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function NichePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [niche, packages, brand] = await Promise.all([
    getNicheBySlug(slug),
    getPackagesForNiche(slug),
    getBrand(),
  ]);
  if (!niche) notFound();

  const landscapeGallery = niche.gallery.filter((photo) => photo.width > photo.height);
  const portraitGallery = niche.gallery.filter((photo) => photo.height > photo.width);
  const landscapePhotos = landscapeGallery.length > 0 ? landscapeGallery : niche.gallery;
  const portraitPhotos = portraitGallery.length > 0 ? portraitGallery : niche.gallery;

  return (
    <main className="min-h-screen bg-background">
      <NicheHero
        slug={niche.slug}
        title={niche.title}
        subtitle={niche.subtitle}
        landscapePhotos={landscapePhotos}
        portraitPhotos={portraitPhotos}
      />

      <Editable type="niche" id={niche.slug}>
        <section className="mx-auto w-full max-w-3xl space-y-8 px-5 pb-4 pt-10">
          {niche.intro && (
            <div className="relative overflow-hidden border-l-2 border-gold p-6 pl-5">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
                style={{
                  boxShadow: "var(--shadow-gold)",
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                  maskComposite: "intersect",
                  WebkitMaskComposite: "source-in",
                }}
              />
              <p className="relative text-sm leading-relaxed text-foreground">{niche.intro}</p>
            </div>
          )}
          {niche.description.length > 0 && (
            <div className="space-y-4">
              {niche.description.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          )}
          {niche.highlights.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-3">
              {niche.highlights.map((h) => (
                <li key={h} className="relative overflow-hidden px-4 py-3 text-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
                    style={{
                      boxShadow: "var(--shadow-gold)",
                      maskImage:
                        "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
                      maskComposite: "intersect",
                      WebkitMaskComposite: "source-in",
                    }}
                  />
                  <span className="font-condensed relative text-[0.7rem] uppercase tracking-[0.2em] text-foreground">
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Editable>

      <PackagePicker
        packages={packages}
        nicheTitle={niche.title}
        nicheGallery={niche.gallery}
        whatsappBase={brand.whatsapp}
      />
    </main>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- NicheHero.test page.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/ensaios/\[slug\]/_components/NicheHero.tsx src/app/ensaios/\[slug\]/_components/NicheHero.test.tsx src/app/ensaios/\[slug\]/page.tsx src/app/ensaios/\[slug\]/page.test.tsx
git commit -m "$(cat <<'EOF'
feat: make niche hero and intro text editable in preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Embrulhar os cards de pacote (`PackagePicker.tsx`)

**Files:**

- Modify: `src/app/ensaios/[slug]/_components/PackagePicker.tsx`
- Create: `src/app/ensaios/[slug]/_components/PackagePicker.test.tsx`

**Interfaces:**

- Consumes: `Editable` (Task 4).

Cada botão de pacote é filho direto de um `grid gap-3 sm:grid-cols-3` e depende do stretch automático do grid pra preencher a célula — como o `<button>` não tem largura/altura explícitas, o `Editable` precisa ficar com `className="block h-full"` e o botão ganha `block h-full w-full` explícitos (ver Global Constraints).

- [ ] **Step 1: Escrever o teste que falha**

`src/app/ensaios/[slug]/_components/PackagePicker.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PackagePicker } from "./PackagePicker";
import type { Package } from "@/actions/packages";

const packages: Package[] = [
  {
    id: "pacote-1",
    name: "Essencial",
    price: "R$ 500",
    description: "",
    items: [],
    featured: false,
  },
  { id: "pacote-2", name: "Completo", price: "R$ 900", description: "", items: [], featured: true },
];

describe("PackagePicker", () => {
  it("marca cada card de pacote como editável (tipo package)", () => {
    const { container } = render(
      <PackagePicker
        packages={packages}
        nicheTitle="Família"
        nicheGallery={[]}
        whatsappBase="https://wa.me/5511999999999"
      />,
    );
    const editables = container.querySelectorAll('[data-editable^="package:"]');
    expect(editables).toHaveLength(2);
    expect(editables[0].getAttribute("data-editable")).toBe("package:pacote-1");
    expect(editables[1].getAttribute("data-editable")).toBe("package:pacote-2");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- PackagePicker.test`
Expected: FAIL

- [ ] **Step 3: Implementar**

`src/app/ensaios/[slug]/_components/PackagePicker.tsx` — adicionar `import { Editable } from "@/app/_components/Editable";` e trocar o `<button>` do map:

```tsx
{
  packages.map((p) => (
    <Editable key={p.id} type="package" id={p.id} className="block h-full">
      <button
        type="button"
        onClick={() => setSelectedId(p.id)}
        className="relative block h-full w-full overflow-hidden border border-gold/20 p-5 text-left transition-colors hover:border-gold/50"
        style={{ boxShadow: "var(--shadow-gold)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--gold) 12%, transparent) 0 14px, transparent 15px), radial-gradient(circle at 62% 34%, color-mix(in oklab, var(--gold) 8%, transparent) 0 20px, transparent 21px), radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--gold) 10%, transparent) 0 18px, transparent 19px), radial-gradient(circle at 78% 88%, color-mix(in oklab, var(--gold) 8%, transparent) 0 16px, transparent 17px)",
            backgroundSize: "190px 190px",
          }}
        />
        <h3 className="display-xl relative z-10 text-2xl text-foreground">{p.name}</h3>
        <span className="font-condensed relative z-10 mt-1 block text-2xl font-normal text-gold">
          {p.price}
        </span>
        <span className="font-condensed relative z-10 mt-3 block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
          Ver o que inclui
        </span>
      </button>
    </Editable>
  ));
}
```

O restante do arquivo (imports, o bloco `{pack && (...)}`, `NicheGallery`, CTA) não muda.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- PackagePicker.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add "src/app/ensaios/[slug]/_components/PackagePicker.tsx" "src/app/ensaios/[slug]/_components/PackagePicker.test.tsx"
git commit -m "$(cat <<'EOF'
feat: make package cards editable in preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Embrulhar a galeria do nicho (`NicheGallery.tsx`)

**Files:**

- Modify: `src/app/ensaios/[slug]/_components/NicheGallery.tsx`
- Create: `src/app/ensaios/[slug]/_components/NicheGallery.test.tsx`

**Interfaces:**

- Consumes: `Editable` (Task 4).

`NicheGallery` recebe `photos` via prop, sem "use client" — como não usa hooks nem estado, renderiza direto num teste síncrono comum. Layout em `columns-2` (CSS multicolumn, não grid/flex) — cada `<figure>` já é `break-inside-avoid` e não depende de ser filho direto pra se posicionar, então o `Editable` pode ficar por fora sem herdar nenhuma classe.

- [ ] **Step 1: Escrever o teste que falha**

`src/app/ensaios/[slug]/_components/NicheGallery.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NicheGallery } from "./NicheGallery";
import type { Photo } from "@/actions/_mock/types";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const photos: Photo[] = Array.from({ length: 4 }, (_, i) => ({
  src: `/fotos/teste/nicho-${i}.webp`,
  width: 1200,
  height: 1600,
  blurDataURL: "data:image/webp;base64,AA",
  placementId: `placement-nicho-${i}`,
}));

describe("NicheGallery", () => {
  it("marca cada foto da galeria do nicho como editável", () => {
    const { container } = render(<NicheGallery photos={photos} nicheTitle="Família" />);
    const editables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(editables).toHaveLength(4);
    expect(editables[0].getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- NicheGallery.test`
Expected: FAIL

- [ ] **Step 3: Implementar**

`src/app/ensaios/[slug]/_components/NicheGallery.tsx` completo:

```tsx
import Image from "next/image";
import type { Photo } from "@/actions/_mock/types";
import { Editable } from "@/app/_components/Editable";

export function NicheGallery({ photos, nicheTitle }: { photos: Photo[]; nicheTitle: string }) {
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
            </figure>
          </Editable>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- NicheGallery.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add "src/app/ensaios/[slug]/_components/NicheGallery.tsx" "src/app/ensaios/[slug]/_components/NicheGallery.test.tsx"
git commit -m "$(cat <<'EOF'
feat: make niche gallery photos editable in preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Embrulhar os teasers da home (`Niches.tsx` + `Events.tsx`)

**Files:**

- Modify: `src/app/_components/Niches.tsx`
- Create: `src/app/_components/Niches.test.tsx`
- Modify: `src/app/_components/Events.tsx`
- Create: `src/app/_components/Events.test.tsx`

**Interfaces:**

- Consumes: `Editable` (Task 4); `getNiches()`/`getEventNiches()` (já existentes).

Descobertos durante a investigação deste plano — não estavam na tabela original da spec, mas são as mesmas seções de nicho (`n.image`/`n.title`/`n.subtitle`, link pra `/ensaios/${n.slug}`) reaproveitadas como teaser da home. Com "cobrir o site inteiro" já decidido, entram como extensão do mesmo padrão: cada card inteiro vira `type="niche" id={n.slug}` (sem um wrap `placement` separado pra miniatura — o card é um link simples pra página de detalhe, não uma região com sub-áreas independentes). `Niches.tsx` está num container `flex` horizontal (carrossel) — a classe de largura do card migra pro `Editable`. `Events.tsx` está num `space-y-3` vertical — o `Link` já tem `block h-44` explícito, então o `Editable` só embrulha por fora, sem herdar nada.

Ambos são Server Components assíncronos.

- [ ] **Step 1: Escrever os testes que falham**

`src/app/_components/Niches.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Niches } from "./Niches";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("Niches", () => {
  it("marca cada card de nicho como editável (tipo niche)", async () => {
    const { container } = render(await Niches());
    const editables = container.querySelectorAll('[data-editable^="niche:"]');
    expect(editables.length).toBeGreaterThan(0);
    expect(editables[0].getAttribute("data-editable")).toBe("niche:familia");
  });
});
```

`src/app/_components/Events.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Events } from "./Events";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("Events", () => {
  it("marca cada card de evento como editável (tipo niche)", async () => {
    const { container } = render(await Events({ whatsapp: "https://wa.me/5511999999999" }));
    const editables = container.querySelectorAll('[data-editable^="niche:"]');
    expect(editables).toHaveLength(3);
  });
});
```

(3 é o número confirmado de nichos marcados como evento — ver `niches.test.ts`, `getEventNiches` já testado ali.)

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Niches.test Events.test`
Expected: FAIL

- [ ] **Step 3: Implementar**

`src/app/_components/Niches.tsx` completo:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/lib/_components/Section";
import { getNiches } from "@/actions/niches";
import { Editable } from "./Editable";

export async function Niches() {
  const niches = await getNiches();
  return (
    <Section id="ensaios" index="03" title="Ensaios para cada momento">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Arraste para o lado e toque no ensaio para ver a descrição completa, os pacotes e a galeria.
      </p>

      <div className="no-scrollbar -mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3">
        {niches.map((n) => (
          <Editable
            key={n.slug}
            type="niche"
            id={n.slug}
            className="w-[78%] max-w-sm shrink-0 snap-center"
          >
            <Link
              href={`/ensaios/${n.slug}`}
              className="group relative block overflow-hidden border border-border bg-surface transition-colors hover:border-gold active:border-gold"
            >
              <div className="relative aspect-4/5 overflow-hidden">
                <Image
                  src={n.image.src}
                  alt={`Ensaio de ${n.title}`}
                  fill
                  sizes="(min-width: 640px) 380px, 78vw"
                  placeholder="blur"
                  blurDataURL={n.image.blurDataURL}
                  className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.04] group-active:grayscale-0 group-active:scale-[1.04]"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background via-background/85 to-transparent p-5 pt-12">
                <h3 className="display-xl text-3xl text-foreground">{n.title}</h3>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-condensed text-[0.6rem] uppercase tracking-[0.32em] text-muted-foreground">
                    {n.subtitle}
                  </span>
                  <span
                    className="gradient-border-gold font-condensed block w-fit shrink-0 rounded-full px-4 py-2 text-[0.6rem] uppercase tracking-[0.25em] text-gold sm:px-6"
                    style={{
                      boxShadow:
                        "0 10px 25px -8px color-mix(in oklab, var(--gold) 55%, transparent), 0 4px 10px -4px color-mix(in oklab, var(--gold) 35%, transparent)",
                    }}
                  >
                    <span className="sm:hidden">Ver</span>
                    <span className="hidden sm:inline">Ver detalhes</span>
                  </span>
                </div>
              </div>
            </Link>
          </Editable>
        ))}
      </div>
    </Section>
  );
}
```

`src/app/_components/Events.tsx` completo:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/lib/_components/Section";
import { getEventNiches } from "@/actions/niches";
import { ContactForm } from "./Contact";
import { Editable } from "./Editable";

export async function Events({ whatsapp }: { whatsapp: string }) {
  const events = await getEventNiches();
  return (
    <Section id="contato" index="04" eyebrow="Eventos" title="Formatos de cobertura">
      <div className="space-y-3">
        {events.map((e) => (
          <Editable key={e.slug} type="niche" id={e.slug}>
            <Link
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
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-background via-background/70 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-5">
                <h3 className="display-xl text-3xl text-foreground">{e.title}</h3>
                <p className="font-condensed mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
                  {e.subtitle}
                </p>
              </div>
            </Link>
          </Editable>
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

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Niches.test Events.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/Niches.tsx src/app/_components/Niches.test.tsx src/app/_components/Events.tsx src/app/_components/Events.test.tsx
git commit -m "$(cat <<'EOF'
feat: make home teaser cards (Niches, Events) editable in preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: `NEXT_PUBLIC_APP_PHOTO_URL` no admin-photo

**Files:**

- Modify: `src/config/env.client.ts`
- Modify: `src/config/env.client.test.ts` (se não existir ainda como arquivo de teste dedicado, criar)

**Interfaces:**

- Produces: `clientEnv.NEXT_PUBLIC_APP_PHOTO_URL: string | undefined`, usado por `PreviewFrame` (Task 16) e pela rota `/preview` (Task 17).

Distinta de `APP_PHOTO_URL` (server-only, já existe, usada pelo webhook de revalidação) — esta é exposta ao browser, usada como `src` do iframe.

- [ ] **Step 1: Verificar se já existe teste pra `env.client.ts`**

Run: `find src/config -iname "env.client.test.ts"`

Se existir, adicionar os casos abaixo ao arquivo existente. Se não existir, criar `src/config/env.client.test.ts` do zero, cobrindo também os dois campos do Cloudinary (já existentes, sem teste dedicado hoje) — mas o essencial pra esta task é:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env.client — NEXT_PUBLIC_APP_PHOTO_URL", () => {
  it("aceita ausência da variável", async () => {
    delete process.env.NEXT_PUBLIC_APP_PHOTO_URL;
    const { clientEnv } = await import("./env.client");
    expect(clientEnv.NEXT_PUBLIC_APP_PHOTO_URL).toBeUndefined();
  });

  it("aceita uma URL válida", async () => {
    process.env.NEXT_PUBLIC_APP_PHOTO_URL = "http://localhost:3000";
    const { clientEnv } = await import("./env.client");
    expect(clientEnv.NEXT_PUBLIC_APP_PHOTO_URL).toBe("http://localhost:3000");
  });

  it("cai pro valor bruto em vez de lançar quando a URL é inválida (mesmo padrão resiliente das demais vars)", async () => {
    process.env.NEXT_PUBLIC_APP_PHOTO_URL = "nao-e-url";
    const { clientEnv } = await import("./env.client");
    expect(clientEnv.NEXT_PUBLIC_APP_PHOTO_URL).toBe("nao-e-url");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- env.client -t "NEXT_PUBLIC_APP_PHOTO_URL"`
Expected: FAIL — o campo não existe no schema.

- [ ] **Step 3: Implementar**

`src/config/env.client.ts` completo:

```ts
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
  // Cloud name e preset unsigned do Cloudinary — usados pelo widget de
  // upload (browser → Cloudinary direto) e por
  // PhotoRepositoryImpl/fetchBlurDataURL no servidor. Opcionais: sem
  // eles, o botão de upload mostra um erro claro em vez de quebrar a
  // página inteira. O preset precisa existir de verdade no painel do
  // Cloudinary (Settings → Upload → Upload presets → Signing Mode:
  // Unsigned) — ver DEPLOY.md.
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
  // URL pública do app-photo, exposta ao browser — distinta de
  // APP_PHOTO_URL (server-only, usada só pelo webhook de revalidação).
  // Usada como src do iframe do preview (PreviewFrame.tsx) e pra
  // validar a origem das mensagens recebidas dele. Opcional: sem ela,
  // a rota /preview mostra uma mensagem clara em vez de tentar iframar
  // uma URL vazia.
  NEXT_PUBLIC_APP_PHOTO_URL: z.string().url().optional(),
});

// safeParse + fallback pro process.env bruto, não .parse() direto — uma
// var opcional deixada vazia no .env (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=`,
// exatamente como está no .env.example) vira string vazia, não undefined;
// .optional() não cobre esse caso e .parse() lançava, derrubando a
// aplicação inteira. Mesmo padrão de resiliência do env.server.ts — os
// consumidores (UploadPhotoModal, PhotoViewModel, PlacementViewModel) já
// tratam string vazia como "não configurado" via `if (!cloudName)`.
function parseClientEnv() {
  const input = {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    NEXT_PUBLIC_APP_PHOTO_URL: process.env.NEXT_PUBLIC_APP_PHOTO_URL,
  };
  const result = schema.safeParse(input);
  if (!result.success) {
    console.warn(
      "[env.client] Variáveis inválidas — usando os valores brutos:",
      result.error.flatten().fieldErrors,
    );
    return input as z.infer<typeof schema>;
  }
  return result.data;
}

export const clientEnv = parseClientEnv();
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- env.client`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/config/env.client.ts src/config/env.client.test.ts
git commit -m "$(cat <<'EOF'
feat: add NEXT_PUBLIC_APP_PHOTO_URL to admin-photo client env

Distinta de APP_PHOTO_URL (server-only, já usada pelo webhook de
revalidação) — esta é exposta ao browser, usada como src do iframe
do preview.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Registro `EDIT_HANDLERS` (`editHandlers.ts`)

**Files:**

- Create: `src/app/preview/_components/editHandlers.ts`
- Create: `src/app/preview/_components/editHandlers.test.ts`

**Interfaces:**

- Consumes: `NicheViewModel`, `PackageViewModel`, `PlacementViewModel` (já existentes, planos 7-10).
- Produces: `resolveEditHandler(entityType: string, id: string, lists: { niches: NicheViewModel[]; packages: PackageViewModel[]; placements: PlacementViewModel[] }): EditTarget | null`, usado por `PreviewFrame` (Task 16).

Lógica pura, sem DOM — testável isoladamente, sem precisar simular iframe/postMessage.

- [ ] **Step 1: Escrever o teste que falha**

`src/app/preview/_components/editHandlers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveEditHandler } from "./editHandlers";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";

const niche = { slug: "familia", title: "Família" } as NicheViewModel;
const pkg = { id: "pacote-1", name: "Essencial" } as PackageViewModel;
const placement = { id: "mock-placement-1", photoId: "foto-1" } as PlacementViewModel;

const lists = { niches: [niche], packages: [pkg], placements: [placement] };

describe("resolveEditHandler", () => {
  it("resolve um nicho pelo slug", () => {
    expect(resolveEditHandler("niche", "familia", lists)).toEqual({ kind: "niche", niche });
  });

  it("resolve um pacote pelo id", () => {
    expect(resolveEditHandler("package", "pacote-1", lists)).toEqual({ kind: "package", pkg });
  });

  it("resolve um placement pelo id", () => {
    expect(resolveEditHandler("placement", "mock-placement-1", lists)).toEqual({
      kind: "placement",
      placement,
    });
  });

  it("retorna null pra um tipo desconhecido, sem quebrar", () => {
    expect(resolveEditHandler("profile", "main", lists)).toBeNull();
  });

  it("retorna null quando o id não está na lista carregada", () => {
    expect(resolveEditHandler("niche", "nao-existe", lists)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- editHandlers.test`
Expected: FAIL — `./editHandlers` não existe.

- [ ] **Step 3: Implementar**

`src/app/preview/_components/editHandlers.ts`:

```ts
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";

export type EditTarget =
  | { kind: "niche"; niche: NicheViewModel }
  | { kind: "package"; pkg: PackageViewModel }
  | { kind: "placement"; placement: PlacementViewModel };

interface Lists {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  placements: PlacementViewModel[];
}

// Registro central — cada tipo sabe procurar sua própria entidade na
// lista já carregada pela rota /preview. "profile" fica de fora de
// propósito: o modal de perfil não segue o padrão open/onUpdated dos
// demais (é um formulário de página inteira, não um modal — ver
// ProfileForm.tsx do plano 11), fora do escopo desta primeira versão.
const EDIT_HANDLERS: Record<string, (id: string, lists: Lists) => EditTarget | null> = {
  niche: (id, lists) => {
    const niche = lists.niches.find((n) => n.slug === id);
    return niche ? { kind: "niche", niche } : null;
  },
  package: (id, lists) => {
    const pkg = lists.packages.find((p) => p.id === id);
    return pkg ? { kind: "package", pkg } : null;
  },
  placement: (id, lists) => {
    const placement = lists.placements.find((p) => p.id === id);
    return placement ? { kind: "placement", placement } : null;
  },
};

export function resolveEditHandler(
  entityType: string,
  id: string,
  lists: Lists,
): EditTarget | null {
  const handler = EDIT_HANDLERS[entityType];
  return handler ? handler(id, lists) : null;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- editHandlers.test`
Expected: PASS (5 testes)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/preview/_components/editHandlers.ts src/app/preview/_components/editHandlers.test.ts
git commit -m "$(cat <<'EOF'
feat: add EDIT_HANDLERS registry for the inline preview

Registro central que resolve um clique no preview (tipo + id) pra
entidade certa já carregada — sem if/else crescendo por tipo.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: Componente `PreviewFrame`

**Files:**

- Create: `src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `resolveEditHandler` (Task 15), `clientEnv.NEXT_PUBLIC_APP_PHOTO_URL` (Task 14), `EditNicheModal`/`EditPackageModal`/`EditPlacementModal` (já existentes, planos 7-10), `showToast` (`src/lib/_utils/toast.ts`, já existente).
- Produces: `PreviewFrame({ niches, packages, photos, placements }): JSX.Element`, usado pela rota `/preview` (Task 17).

Sem teste automatizado dedicado nesta task — a lógica pura de resolução já está coberta (Task 15), e o handshake real via iframe cross-document não é simulável de forma confiável em jsdom (mesma decisão já tomada na Task 5 do lado do app-photo, e documentada na spec: "jsdom não simula comunicação cross-document de forma confiável"). A verificação real é o smoke test manual da Task 18.

- [ ] **Step 1: Implementar**

`src/app/preview/_components/PreviewFrame.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { EditNicheModal } from "@/app/niches/_components/EditNicheModal";
import { EditPackageModal } from "@/app/packages/_components/EditPackageModal";
import { EditPlacementModal } from "@/app/placements/_components/EditPlacementModal";
import { clientEnv } from "@/config/env.client";
import { showToast } from "@/lib/_utils/toast";
import { resolveEditHandler, type EditTarget } from "./editHandlers";

// Mesmos três literais de PreviewOverlay.tsx no app-photo — mantenha
// sincronizado se um dos dois lados mudar.
const PING = "app-photo:preview:ping";
const ACK = "app-photo:preview:ack";
const EDIT = "app-photo:preview:edit";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function PreviewFrame({
  niches: initialNiches,
  packages: initialPackages,
  photos,
  placements: initialPlacements,
}: {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  photos: PhotoViewModel[];
  placements: PlacementViewModel[];
}) {
  const [niches, setNiches] = useState(initialNiches);
  const [packages, setPackages] = useState(initialPackages);
  const [placements, setPlacements] = useState(initialPlacements);
  const [activeEdit, setActiveEdit] = useState<EditTarget | null>(null);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const appPhotoUrl = clientEnv.NEXT_PUBLIC_APP_PHOTO_URL;
  const appPhotoOrigin = originOf(appPhotoUrl);

  useEffect(() => {
    if (!appPhotoOrigin) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== appPhotoOrigin) return;

      if (event.data?.type === PING) {
        iframeRef.current?.contentWindow?.postMessage({ type: ACK }, appPhotoOrigin);
        return;
      }

      if (event.data?.type === EDIT) {
        const target = resolveEditHandler(event.data.entityType, event.data.id, {
          niches,
          packages,
          placements,
        });
        if (!target) {
          showToast({
            message: "Item não encontrado no preview — recarregue a página.",
            variant: "error",
          });
          return;
        }
        setActiveEdit(target);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [appPhotoOrigin, niches, packages, placements]);

  function reloadIframe() {
    const frame = iframeRef.current;
    if (frame) {
      setLoadError(false);
      frame.src = frame.src;
    }
  }

  function closeEdit() {
    setActiveEdit(null);
  }

  if (!appPhotoUrl || !appPhotoOrigin) {
    return (
      <p className="text-muted-foreground">
        NEXT_PUBLIC_APP_PHOTO_URL não configurado — preview indisponível.
      </p>
    );
  }

  return (
    <div className="h-[80vh] w-full overflow-hidden rounded border">
      {loadError && (
        <p className="mb-2 text-sm text-destructive">
          Não foi possível carregar o site em {appPhotoUrl} — confirme que o app-photo está rodando
          e tente recarregar.
        </p>
      )}
      {/* onError só dispara pra falha de rede (DNS, conexão recusada) —
                navegadores não expõem status HTTP de conteúdo de iframe
                cross-origin. Cobre o caso mais comum em dev (app-photo
                fora do ar); uma resposta 4xx/5xx real ainda renderiza
                dentro do iframe sem acionar este aviso. */}
      <iframe
        ref={iframeRef}
        src={appPhotoUrl}
        className="h-full w-full"
        title="Preview do site"
        onError={() => setLoadError(true)}
      />

      <EditNicheModal
        niche={activeEdit?.kind === "niche" ? activeEdit.niche : null}
        open={activeEdit?.kind === "niche"}
        onOpenChange={(open) => !open && closeEdit()}
        onUpdated={(updated) => {
          setNiches((prev) => prev.map((n) => (n.slug === updated.slug ? updated : n)));
          closeEdit();
          reloadIframe();
        }}
      />
      <EditPackageModal
        pkg={activeEdit?.kind === "package" ? activeEdit.pkg : null}
        open={activeEdit?.kind === "package"}
        onOpenChange={(open) => !open && closeEdit()}
        niches={niches}
        onUpdated={(updated) => {
          setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          closeEdit();
          reloadIframe();
        }}
      />
      <EditPlacementModal
        placement={activeEdit?.kind === "placement" ? activeEdit.placement : null}
        open={activeEdit?.kind === "placement"}
        onOpenChange={(open) => !open && closeEdit()}
        photos={photos}
        niches={niches}
        packages={packages}
        onUpdated={(updated) => {
          setPlacements((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          closeEdit();
          reloadIframe();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint`
Expected: PASS — sem testes de comportamento nesta task (ver justificativa acima); o typecheck cobre a compatibilidade dos props com os modais existentes.

- [ ] **Step 3: Commit**

```bash
git add src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: add PreviewFrame — iframe handshake + edit modal dispatch

Responde o ping do app-photo, resolve cliques via EDIT_HANDLERS e
abre o modal de edição já existente da entidade certa. Salvar
recarrega o iframe.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: Rota `/preview` + link na navegação

**Files:**

- Create: `src/app/preview/page.tsx`
- Modify: `src/app/_components/AdminNav.tsx`

**Interfaces:**

- Consumes: `getNiches`, `getPackages`, `getPhotos`, `getPlacements` (já existentes — as mesmas 4 actions que `/placements/page.tsx` já usa); `PreviewFrame` (Task 16).

- [ ] **Step 1: Implementar a rota**

`src/app/preview/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

import { getNiches } from "@/actions/niches";
import { getPackages } from "@/actions/packages";
import { getPhotos } from "@/actions/photos";
import { getPlacements } from "@/actions/placements";
import { PreviewFrame } from "./_components/PreviewFrame";

export default async function PreviewPage() {
  const [niches, packages, photos, placements] = await Promise.all([
    getNiches(),
    getPackages(),
    getPhotos(),
    getPlacements(),
  ]);
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Preview do site</h1>
      <PreviewFrame niches={niches} packages={packages} photos={photos} placements={placements} />
    </main>
  );
}
```

- [ ] **Step 2: Adicionar o link na navegação**

`src/app/_components/AdminNav.tsx` — adicionar ao array `LINKS`:

```tsx
const LINKS = [
  { href: "/niches", label: "Nichos" },
  { href: "/packages", label: "Pacotes" },
  { href: "/photos", label: "Fotos" },
  { href: "/placements", label: "Posicionamentos" },
  { href: "/preview", label: "Preview" },
  { href: "/profile", label: "Perfil" },
];
```

- [ ] **Step 3: Verificar**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde — `getNiches`/`getPackages`/`getPhotos`/`getPlacements` já são chamadas testadas indiretamente pelas suítes existentes de cada use case; a página em si segue exatamente o padrão de `/placements/page.tsx`, sem lógica nova pra testar isoladamente.

- [ ] **Step 4: Commit**

```bash
git add src/app/preview/page.tsx src/app/_components/AdminNav.tsx
git commit -m "$(cat <<'EOF'
feat: add /preview route with inline editing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: Regressão final + smoke test manual documentado

**Files:** nenhum arquivo novo — só verificação.

- [ ] **Step 1: Regressão completa nos dois repositórios**

```bash
cd /Users/cesarpisa/Projects/lp-fotografia/app-photo
npm run typecheck && npm run lint && npm test && npm run build

cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: tudo verde nos dois repositórios.

- [ ] **Step 2: Documentar o smoke test manual (não executado neste ambiente — sem navegador disponível)**

Adicionar ao final do `DEPLOY.md` do admin-photo (criado no plano 11) uma seção nova:

```markdown
## Smoke test do preview com edição inline

Depois de configurar `NEXT_PUBLIC_ADMIN_PHOTO_URL` (app-photo) e
`NEXT_PUBLIC_APP_PHOTO_URL` (admin-photo) apontando um pro outro (em dev,
`http://localhost:3001` e `http://localhost:3000` respectivamente):

1. Suba os dois servidores (`npm run dev` em cada repo) e o Firebase
   Emulator Suite (`npm run emulators` no admin-photo).
2. Faça login no admin-photo e abra `/preview`.
3. Confirme que o site real aparece dentro do iframe, sem erro de
   console de CSP/frame-ancestors.
4. Passe o mouse sobre uma foto do hero — deve aparecer um contorno
   dourado. Clique — o modal de edição de posicionamento deve abrir já
   preenchido com a foto certa.
5. Troque o `role` do posicionamento e salve — o modal deve fechar e o
   iframe deve recarregar sozinho, mostrando a mudança.
6. Repita o passo 4-5 pra pelo menos um card de nicho (`/`) e um card de
   pacote (`/ensaios/[slug]`), confirmando que cada um abre o modal
   certo (`EditNicheModal`/`EditPackageModal`).
7. Feche a aba do preview e abra o site publicamente (sem o admin
   por perto) — confirme que nenhum contorno/comportamento de edição
   aparece: o overlay deve estar completamente inerte fora do iframe.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo
git add DEPLOY.md
git commit -m "$(cat <<'EOF'
docs: document manual smoke test for the inline preview

Sem navegador disponível neste ambiente — checklist documentado pra
quem for validar localmente antes do deploy.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Finalizar**

Invocar a skill `finishing-a-development-branch` nos dois repositórios (admin-photo: local, main, sem remote; app-photo: branch `feat/nicho-firestore`, PR já aberto).
