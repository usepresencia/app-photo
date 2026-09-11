# Preview — criar, deletar, editar perfil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O `/preview` do admin-photo ganha criar (nicho/pacote/foto+posicionamento), deletar (qualquer entidade editável), editar o perfil do site, e um painel pra fotos sem posicionamento — as quatro capacidades que faltam pra ele deixar de ser só um editor do que já existe.

**Architecture:** Estende o protocolo `postMessage` já existente (handshake + `edit`) com dois tipos novos — `add` e `delete`. App-photo ganha `<Addable>` (mesmo padrão do `<Editable>`, mas invisível fora do modo preview) e o `PreviewOverlay` passa a rastrear hover de verdade pra desenhar um ícone de lixeira flutuante. Admin-photo ganha `ADD_HANDLERS`/`DELETE_HANDLERS` (espelham o `EDIT_HANDLERS` já existente), um `AddPhotoModal` de 2 passos, um `EditProfileModal`, e um painel de fotos órfãs.

**Tech Stack:** Next.js 15/16 App Router (ambos os repos), React 18.3, TypeScript, Vitest, Tailwind CSS.

**Spec:** `app-photo/docs/superpowers/specs/2026-09-09-preview-criar-deletar-perfil-design.md`

## Global Constraints

- Deletar um item `placement` remove **só o posicionamento** — a foto (`Photo`) continua existindo. Deletar a foto de verdade só acontece no painel de órfãs.
- Criar conteúdo continua reaproveitando as actions/modais já existentes (`createNiche`, `createPackage`, `createPhoto`, `createPlacement`, `NewNicheModal`, `UploadPhotoModal`) — nenhuma lógica de negócio nova, só novos pontos de entrada.
- `AddPhotoModal` não inventa auto-incremento de ordem — usa o mesmo padrão manual (`EMPTY_PLACEMENT_FORM.order = '0'`) que `NewPlacementModal` já usa hoje.
- Hero e "Quem sou" **não** ganham `Addable` — são layouts fixos de 4 slots com papel visual próprio cada, não listas que crescem (ver spec). Só `Niches.tsx`, `PackagePicker.tsx`, `Gallery.tsx` e `NicheGallery.tsx` ganham `+`.
- `data-addable` fica separado de `data-editable` — dois atributos distintos, não um prefixo dentro do mesmo.
- app-photo: testes só de funções puras extraídas de componentes (mesmo padrão de `parseEditableTarget`) — nada de testar `getBoundingClientRect`/posicionamento real, isso é coberto só pelo smoke test manual.
- admin-photo: `vitest.config.ts` só inclui `src/**/*.test.ts` (`environment: 'node'`) — nunca criar um arquivo `.test.tsx`, nunca tentar renderizar um componente React em teste. Só lógica pura (registries, hooks isolados de estado) é testável aqui.
- Comandos de verificação (repita a cada task): `npm run typecheck && npm run lint && npm test && npm run build`, rodado no repositório do arquivo tocado na task.
- Commits pequenos e frequentes, um por task, com o trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Mapa de arquivos

### app-photo

| Arquivo                                                     | O que muda                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/_components/Addable.tsx`                           | **Novo**                                                                                                      |
| `src/app/_components/Addable.test.tsx`                      | **Novo**                                                                                                      |
| `src/app/globals.css`                                       | Regras `[data-addable]` + ícone de lixeira                                                                    |
| `src/app/_components/PreviewOverlay.tsx`                    | Ganha `parseAddableTarget`, tratamento de `add`, rastreio de hover + ícone de lixeira, tratamento de `delete` |
| `src/app/_components/PreviewOverlay.test.tsx`               | Casos novos                                                                                                   |
| `src/app/_components/Niches.tsx`                            | Ganha `<Addable type="niche">` no fim do carrossel                                                            |
| `src/app/_components/Niches.test.tsx`                       | Caso novo                                                                                                     |
| `src/app/ensaios/[slug]/_components/PackagePicker.tsx`      | Ganha prop `nicheSlug`; `<Addable type="package">` no fim da grade                                            |
| `src/app/ensaios/[slug]/_components/PackagePicker.test.tsx` | Casos novos                                                                                                   |
| `src/app/ensaios/[slug]/page.tsx`                           | Passa `nicheSlug` pro `PackagePicker`/`NicheGallery`                                                          |
| `src/app/ensaios/[slug]/_components/NicheGallery.tsx`       | Ganha prop `nicheSlug`; `<Addable type="placement">` no fim da galeria                                        |
| `src/app/ensaios/[slug]/_components/NicheGallery.test.tsx`  | Casos novos                                                                                                   |
| `src/app/_components/Gallery.tsx`                           | `<Addable type="placement">` no fim da galeria da home                                                        |
| `src/app/_components/Gallery.test.tsx`                      | Caso novo                                                                                                     |

### admin-photo

| Arquivo                                              | O que muda                                                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/app/preview/_components/addHandlers.ts`         | **Novo**                                                                                                                     |
| `src/app/preview/_components/addHandlers.test.ts`    | **Novo**                                                                                                                     |
| `src/app/preview/_components/deleteHandlers.ts`      | **Novo**                                                                                                                     |
| `src/app/preview/_components/deleteHandlers.test.ts` | **Novo**                                                                                                                     |
| `src/app/profile/_components/ProfileForm.tsx`        | Ganha prop opcional `onSaved`                                                                                                |
| `src/app/preview/_components/EditProfileModal.tsx`   | **Novo**                                                                                                                     |
| `src/app/preview/_components/editHandlers.ts`        | Ganha entrada `profile`                                                                                                      |
| `src/app/preview/_components/editHandlers.test.ts`   | Caso novo                                                                                                                    |
| `src/app/preview/_components/AddPhotoModal.tsx`      | **Novo**                                                                                                                     |
| `src/app/packages/_components/NewPackageModal.tsx`   | Ganha prop opcional `initialNicheSlug`                                                                                       |
| `src/app/preview/_components/OrphanPhotosPanel.tsx`  | **Novo**                                                                                                                     |
| `src/app/preview/_components/PreviewFrame.tsx`       | Ganha `profile`/fotos órfãs, trata `add`/`delete`, abre `AddPhotoModal`/`EditProfileModal`, `ConfirmationDialog` de exclusão |
| `src/app/preview/page.tsx`                           | Busca `getProfile()` também                                                                                                  |

---

### Task 1: Componente `<Addable>` + CSS

**Files:**

- Create: `src/app/_components/Addable.tsx`
- Create: `src/app/_components/Addable.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: `Addable({ type: "niche" | "package" | "placement", context?: Record<string, string>, className?: string, children }): JSX.Element` — renderiza `<div data-addable="{type}:{contextJSON}" className={className}>`. Usado pelas Tasks 4-7.

- [ ] **Step 1: Escrever o teste que falha**

`src/app/_components/Addable.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Addable } from "./Addable";

describe("Addable", () => {
  it("marca o elemento com data-addable no formato tipo:contexto (JSON)", () => {
    const { container } = render(
      <Addable type="package" context={{ nicheSlug: "familia" }}>
        <span>+</span>
      </Addable>,
    );
    expect(container.firstElementChild?.getAttribute("data-addable")).toBe(
      'package:{"nicheSlug":"familia"}',
    );
  });

  it("sem context, o atributo fica com o tipo e nada depois do ':'", () => {
    const { container } = render(
      <Addable type="niche">
        <span>+</span>
      </Addable>,
    );
    expect(container.firstElementChild?.getAttribute("data-addable")).toBe("niche:");
  });

  it("repassa className", () => {
    const { container } = render(
      <Addable type="niche" className="shrink-0">
        <span>+</span>
      </Addable>,
    );
    expect(container.firstElementChild?.className).toContain("shrink-0");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Addable.test`
Expected: FAIL — `./Addable` não existe.

- [ ] **Step 3: Implementar**

`src/app/_components/Addable.tsx`:

```tsx
"use client";

// Mesmo padrão do Editable.tsx, mas semântica oposta: marca onde um "+"
// pode aparecer, não um item existente. Fica invisível fora do modo
// preview via CSS (globals.css) — diferente de Editable, que já é
// visível no site normal e só ganha contorno extra no hover.
export function Addable({
  type,
  context,
  className = "",
  children,
}: {
  type: "niche" | "package" | "placement";
  context?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-addable={`${type}:${context ? JSON.stringify(context) : ""}`} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Addable.test`
Expected: PASS (3 testes)

- [ ] **Step 5: CSS do modo preview pra `[data-addable]`**

Ao final de `src/app/globals.css`:

```css
/* [data-addable] (Addable.tsx) fica invisível fora do modo preview —
   diferente de [data-editable], que já é visível no site normal. */
[data-addable] {
  display: none;
}

html[data-preview-active] [data-addable] {
  display: flex;
  pointer-events: auto;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--gold);
  color: var(--gold);
  opacity: 0.7;
}

html[data-preview-active] [data-addable]:hover {
  opacity: 1;
}

/* Ícone de lixeira flutuante (PreviewOverlay.tsx) — z-index máximo
   pra ficar acima de qualquer coisa do site, inclusive elementos com
   z-index alto já usados nas animações do hero/galeria. */
.preview-delete-icon {
  position: fixed;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  border: none;
  background: #dc2626;
  color: white;
  font-size: 12px;
  cursor: pointer;
}
```

- [ ] **Step 6: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 7: Commit**

```bash
git add src/app/_components/Addable.tsx src/app/_components/Addable.test.tsx src/app/globals.css
git commit -m "$(cat <<'EOF'
feat: add Addable component and preview-mode CSS for it

Marca onde um "+" de criação pode aparecer no preview — invisível
fora do modo preview, diferente do Editable (que já é visível no
site normal).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `PreviewOverlay` trata mensagens `add`

**Files:**

- Modify: `src/app/_components/PreviewOverlay.tsx`
- Modify: `src/app/_components/PreviewOverlay.test.tsx`

**Interfaces:**

- Consumes: `Addable` (Task 1, via `[data-addable]`).
- Produces: exporta também `parseAddableTarget` — função pura testada isoladamente. `PreviewFrame` (Task 11) precisa tratar a mensagem `{ type: "app-photo:preview:add", entityType, context }`.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar a `src/app/_components/PreviewOverlay.test.tsx`:

```tsx
import { parseAddableTarget } from "./PreviewOverlay";
```

(adicionar `parseAddableTarget` ao import já existente de `PreviewOverlay`)

```tsx
describe("parseAddableTarget", () => {
  it("separa tipo e context (JSON) no primeiro ':'", () => {
    expect(parseAddableTarget('package:{"nicheSlug":"familia"}')).toEqual({
      entityType: "package",
      context: { nicheSlug: "familia" },
    });
  });

  it("aceita ausência de context (nada depois do ':')", () => {
    expect(parseAddableTarget("niche:")).toEqual({ entityType: "niche", context: undefined });
  });

  it("retorna null sem ':', valor vazio/nulo, ou JSON inválido", () => {
    expect(parseAddableTarget("semdoispontos")).toBeNull();
    expect(parseAddableTarget(null)).toBeNull();
    expect(parseAddableTarget("")).toBeNull();
    expect(parseAddableTarget("package:{invalido")).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- PreviewOverlay.test -t "parseAddableTarget"`
Expected: FAIL — `parseAddableTarget` não existe.

- [ ] **Step 3: Implementar**

`src/app/_components/PreviewOverlay.tsx` — adicionar a constante e a função pura, depois estender o handler de clique existente:

```ts
const ADD = "app-photo:preview:add";
```

(junto das constantes `PING`/`ACK`/`EDIT` já existentes)

```ts
export function parseAddableTarget(
  value: string | null,
): { entityType: string; context: unknown } | null {
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep === -1) return null;
  const entityType = value.slice(0, sep);
  if (!entityType) return null;
  const contextStr = value.slice(sep + 1);
  if (!contextStr) return { entityType, context: undefined };
  try {
    return { entityType, context: JSON.parse(contextStr) };
  } catch {
    return null;
  }
}
```

No `handleClick` do terceiro `useEffect` (o que já lida com `[data-editable]`), adicionar a checagem de `[data-addable]` **antes** da de `[data-editable]` (um elemento nunca tem os dois atributos ao mesmo tempo, mas checar primeiro o mais específico evita qualquer ambiguidade futura):

```ts
function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  const addEl = target.closest("[data-addable]");
  const addParsed = parseAddableTarget(addEl?.getAttribute("data-addable") ?? null);
  if (addParsed) {
    event.preventDefault();
    event.stopPropagation();
    window.parent.postMessage({ type: ADD, ...addParsed }, origin);
    return;
  }

  const el = (event.target as HTMLElement).closest("[data-editable]");
  const parsed = parseEditableTarget(el?.getAttribute("data-editable") ?? null);
  if (!parsed) return;
  event.preventDefault();
  event.stopPropagation();
  window.parent.postMessage({ type: EDIT, ...parsed }, origin);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- PreviewOverlay.test`
Expected: PASS (todos os testes do arquivo, incluindo os 3 novos)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/PreviewOverlay.tsx src/app/_components/PreviewOverlay.test.tsx
git commit -m "$(cat <<'EOF'
feat: PreviewOverlay sends app-photo:preview:add on Addable clicks

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `PreviewOverlay` — hover real + ícone de lixeira + `delete`

**Files:**

- Modify: `src/app/_components/PreviewOverlay.tsx`
- Modify: `src/app/_components/PreviewOverlay.test.tsx`

**Interfaces:**

- Consumes: nada novo além do que já existe.
- Produces: `PreviewFrame` (Task 11) precisa tratar a mensagem `{ type: "app-photo:preview:delete", entityType, id }` — mesmo formato de payload que `edit` já usa.

Esta é a peça mais frágil do plano (posicionamento via `getBoundingClientRect`, não testável de forma confiável em jsdom — só a lógica de montagem da mensagem é testada isoladamente). O ícone só aparece sobre itens já `[data-editable]`, nunca sobre `[data-addable]` (criar não tem "deletar").

- [ ] **Step 1: Escrever o teste que falha**

Adicionar a `src/app/_components/PreviewOverlay.test.tsx`:

```tsx
describe("PreviewOverlay — ícone de lixeira", () => {
  it("não renderiza nenhum botão de lixeira fora do modo preview", () => {
    const { container } = render(<PreviewOverlay />);
    expect(container.querySelector(".preview-delete-icon")).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que passa (é um caso trivial — o componente já não renderiza nada fora do iframe)**

Run: `npm test -- PreviewOverlay.test -t "ícone de lixeira"`
Expected: PASS — já passa antes de qualquer mudança, porque `PreviewOverlay` continua retornando `null` fora de um iframe. Esse teste existe pra travar essa garantia antes de adicionar a lógica nova, não pra guiar uma implementação — siga direto pro Step 3.

- [ ] **Step 3: Implementar**

`src/app/_components/PreviewOverlay.tsx` completo (com as adições desta task e da Task 2 já incorporadas):

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { clientEnv } from "@/lib/config/env.client";

const PING = "app-photo:preview:ping";
const ACK = "app-photo:preview:ack";
const EDIT = "app-photo:preview:edit";
const ADD = "app-photo:preview:add";
const DELETE = "app-photo:preview:delete";

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

export function parseAddableTarget(
  value: string | null,
): { entityType: string; context: unknown } | null {
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep === -1) return null;
  const entityType = value.slice(0, sep);
  if (!entityType) return null;
  const contextStr = value.slice(sep + 1);
  if (!contextStr) return { entityType, context: undefined };
  try {
    return { entityType, context: JSON.parse(contextStr) };
  } catch {
    return null;
  }
}

interface HoveredEditable {
  el: HTMLElement;
  entityType: string;
  id: string;
}

export function PreviewOverlay() {
  const [active, setActive] = useState(false);
  const [, forceRender] = useState(0);
  const hoveredRef = useRef<HoveredEditable | null>(null);
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
    const origin = adminOrigin;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;

      const addEl = target.closest("[data-addable]");
      const addParsed = parseAddableTarget(addEl?.getAttribute("data-addable") ?? null);
      if (addParsed) {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({ type: ADD, ...addParsed }, origin);
        return;
      }

      const el = target.closest("[data-editable]");
      const parsed = parseEditableTarget(el?.getAttribute("data-editable") ?? null);
      if (!parsed) return;
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: EDIT, ...parsed }, origin);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, adminOrigin]);

  // Rastreio de hover de verdade (mouseover/mouseout) — o contorno de
  // edição continua sendo CSS puro (:hover em [data-editable]), mas o
  // ícone de lixeira é um elemento novo que precisa saber sobre qual
  // item está o mouse pra se posicionar.
  useEffect(() => {
    if (!active) return;

    function handleMouseOver(event: MouseEvent) {
      const el = (event.target as HTMLElement).closest("[data-editable]") as HTMLElement | null;
      const parsed = parseEditableTarget(el?.getAttribute("data-editable") ?? null);
      hoveredRef.current = el && parsed ? { el, ...parsed } : null;
      forceRender((v) => v + 1);
    }

    function handleMouseOut(event: MouseEvent) {
      const related = event.relatedTarget as Node | null;
      if (hoveredRef.current && (!related || !hoveredRef.current.el.contains(related))) {
        hoveredRef.current = null;
        forceRender((v) => v + 1);
      }
    }

    function handleReposition() {
      if (hoveredRef.current) forceRender((v) => v + 1);
    }

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [active]);

  if (!active || !hoveredRef.current || !adminOrigin) return null;

  const rect = hoveredRef.current.el.getBoundingClientRect();
  const hovered = hoveredRef.current;

  return (
    <button
      type="button"
      aria-label="Remover"
      className="preview-delete-icon"
      style={{ top: rect.top - 8, left: rect.right - 16 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage(
          { type: DELETE, entityType: hovered.entityType, id: hovered.id },
          adminOrigin,
        );
      }}
    >
      🗑
    </button>
  );
}
```

Nota: o `return null` condicional de antes (`if (!active) ...` implícito) foi substituído por um `if` explícito no fim da função — o componente sempre monta os `useEffect`s (regra dos hooks: nunca `return` antes de todos os hooks rodarem), só o JSX final muda entre "nada" e "o ícone de lixeira".

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- PreviewOverlay.test`
Expected: PASS (todos os testes do arquivo)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/PreviewOverlay.tsx src/app/_components/PreviewOverlay.test.tsx
git commit -m "$(cat <<'EOF'
feat: PreviewOverlay renders a floating delete icon on hover

Rastreia mouseover/mouseout de verdade (não só CSS :hover) pra
desenhar um ícone de lixeira posicionado sobre o item editável sob o
mouse. Clicar nele manda app-photo:preview:delete — mesmo
entityType/id que um edit naquele item usaria.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `Addable` no carrossel de nichos (`Niches.tsx`)

**Files:**

- Modify: `src/app/_components/Niches.tsx`
- Modify: `src/app/_components/Niches.test.tsx`

**Interfaces:**

- Consumes: `Addable` (Task 1).

- [ ] **Step 1: Escrever o teste que falha**

Adicionar a `src/app/_components/Niches.test.tsx`:

```tsx
it("marca o fim do carrossel com um Addable de tipo niche", async () => {
  const { container } = render(await Niches());
  const addable = container.querySelector('[data-addable^="niche:"]');
  expect(addable).not.toBeNull();
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Niches.test -t "Addable"`
Expected: FAIL — nenhum `[data-addable]` no carrossel.

- [ ] **Step 3: Implementar**

`src/app/_components/Niches.tsx` — adicionar o import e um `<Addable>` depois do `{niches.map(...)}`, dentro do mesmo container flex:

```tsx
import { Addable } from "./Addable";
```

```tsx
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
  <Addable type="niche" className="w-24 shrink-0 snap-center text-4xl font-light">
    +
  </Addable>
</div>
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Niches.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/Niches.tsx src/app/_components/Niches.test.tsx
git commit -m "$(cat <<'EOF'
feat: add Addable niche marker at the end of the home carousel

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `Addable` na grade de pacotes (`PackagePicker.tsx`)

**Files:**

- Modify: `src/app/ensaios/[slug]/_components/PackagePicker.tsx`
- Modify: `src/app/ensaios/[slug]/_components/PackagePicker.test.tsx`
- Modify: `src/app/ensaios/[slug]/page.tsx`

**Interfaces:**

- Consumes: `Addable` (Task 1).
- Produces: `PackagePicker` ganha a prop obrigatória `nicheSlug: string` — `page.tsx` (mesma task) passa `niche.slug`.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar a `src/app/ensaios/[slug]/_components/PackagePicker.test.tsx`, dentro do `describe("PackagePicker")` já existente:

```tsx
it("marca o fim da grade de pacotes com um Addable de tipo package (contexto: nicheSlug)", () => {
  const { container } = render(
    <PackagePicker
      packages={packages}
      nicheSlug="familia"
      nicheTitle="Família"
      nicheGallery={[]}
      whatsappBase="https://wa.me/5511999999999"
    />,
  );
  const addable = container.querySelector('[data-addable^="package:"]');
  expect(addable?.getAttribute("data-addable")).toBe('package:{"nicheSlug":"familia"}');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- PackagePicker.test -t "Addable"`
Expected: FAIL — `nicheSlug` não existe na prop e nenhum `[data-addable]` na grade.

- [ ] **Step 3: Implementar**

`src/app/ensaios/[slug]/_components/PackagePicker.tsx` — adicionar o import, a prop `nicheSlug`, e o `<Addable>` no fim da grade (só aparece na tela de escolha de pacote, não depois de um já selecionado — o `!pack &&` já existente cobre isso):

```tsx
import { Addable } from "@/app/_components/Addable";
```

```tsx
export function PackagePicker({
  packages,
  nicheSlug,
  nicheTitle,
  nicheGallery,
  whatsappBase,
}: {
  packages: Package[];
  nicheSlug: string;
  nicheTitle: string;
  nicheGallery: Photo[];
  whatsappBase: string;
}) {
```

```tsx
<div className="grid gap-3 sm:grid-cols-3">
  {packages.map((p) => (
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
  ))}
  <Addable
    type="package"
    context={{ nicheSlug }}
    className="block h-full min-h-24 text-4xl font-light"
  >
    +
  </Addable>
</div>
```

O restante do arquivo (bloco `{pack && (...)}`, CTA) não muda.

`src/app/ensaios/[slug]/page.tsx` — passar `nicheSlug` pro `PackagePicker`:

```tsx
<PackagePicker
  packages={packages}
  nicheSlug={niche.slug}
  nicheTitle={niche.title}
  nicheGallery={niche.gallery}
  whatsappBase={brand.whatsapp}
/>
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- PackagePicker.test page.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add "src/app/ensaios/[slug]/_components/PackagePicker.tsx" "src/app/ensaios/[slug]/_components/PackagePicker.test.tsx" "src/app/ensaios/[slug]/page.tsx"
git commit -m "$(cat <<'EOF'
feat: add Addable package marker at the end of the package grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `Addable` na galeria do nicho (`NicheGallery.tsx`)

**Files:**

- Modify: `src/app/ensaios/[slug]/_components/NicheGallery.tsx`
- Modify: `src/app/ensaios/[slug]/_components/NicheGallery.test.tsx`
- Modify: `src/app/ensaios/[slug]/_components/PackagePicker.tsx`
- Modify: `src/app/ensaios/[slug]/page.tsx`

**Interfaces:**

- Consumes: `Addable` (Task 1).
- Produces: `NicheGallery` ganha a prop obrigatória `nicheSlug: string`. `PackagePicker` (que já renderiza `<NicheGallery>`) precisa repassar o `nicheSlug` que já recebeu na Task 5.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar a `src/app/ensaios/[slug]/_components/NicheGallery.test.tsx`:

```tsx
it("marca o fim da galeria com um Addable de tipo placement (surface niche + refId)", () => {
  const { container } = render(
    <NicheGallery photos={photos} nicheTitle="Família" nicheSlug="familia" />,
  );
  const addable = container.querySelector('[data-addable^="placement:"]');
  expect(addable?.getAttribute("data-addable")).toBe(
    'placement:{"surface":"niche","refId":"familia"}',
  );
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- NicheGallery.test -t "Addable"`
Expected: FAIL — `nicheSlug` não existe na prop e nenhum `[data-addable]` na galeria.

- [ ] **Step 3: Implementar**

`src/app/ensaios/[slug]/_components/NicheGallery.tsx` completo:

```tsx
import Image from "next/image";
import type { Photo } from "@/actions/_mock/types";
import { Addable } from "@/app/_components/Addable";
import { Editable } from "@/app/_components/Editable";

export function NicheGallery({
  photos,
  nicheTitle,
  nicheSlug,
}: {
  photos: Photo[];
  nicheTitle: string;
  nicheSlug: string;
}) {
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
        <Addable
          type="placement"
          context={{ surface: "niche", refId: nicheSlug }}
          className="mb-2 flex aspect-square items-center justify-center break-inside-avoid text-4xl font-light"
        >
          +
        </Addable>
      </div>
    </div>
  );
}
```

`src/app/ensaios/[slug]/_components/PackagePicker.tsx` — repassar `nicheSlug` pro `<NicheGallery>`:

```tsx
<NicheGallery photos={nicheGallery} nicheTitle={nicheTitle} nicheSlug={nicheSlug} />
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- NicheGallery.test PackagePicker.test page.test`
Expected: PASS

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add "src/app/ensaios/[slug]/_components/NicheGallery.tsx" "src/app/ensaios/[slug]/_components/NicheGallery.test.tsx" "src/app/ensaios/[slug]/_components/PackagePicker.tsx"
git commit -m "$(cat <<'EOF'
feat: add Addable placement marker at the end of the niche gallery

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `Addable` na galeria da home (`Gallery.tsx`)

**Files:**

- Modify: `src/app/_components/Gallery.tsx`
- Modify: `src/app/_components/Gallery.test.tsx`

**Interfaces:**

- Consumes: `Addable` (Task 1).

O `+` entra só na última página do álbum (`page === spreads.length - 1`) — nas páginas intermediárias, a grade já está com os 6 slots de `spreadPoses` ocupados (ver Global Constraints do plano anterior sobre por que `spreadPoses` tem exatamente 6 entradas); adicionar um 7º item ali estouraria `spreadPoses[6]` (`undefined`). Na última página, o `<Addable>` fica fora do grid posicionado por `spreadPoses` (não usa nenhuma posição do array), como um elemento a mais depois da grade.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar a `src/app/_components/Gallery.test.tsx`:

```tsx
it("marca a última página do álbum com um Addable de tipo placement (home-gallery)", () => {
  const { container } = render(<Gallery photos={photos} />);
  const addable = container.querySelector('[data-addable^="placement:"]');
  expect(addable?.getAttribute("data-addable")).toBe('placement:{"surface":"home-gallery"}');
});
```

(o fixture `photos` de 6 itens já existente no arquivo cobre exatamente uma página — a única/última — então o `Addable` aparece sem precisar simular paginação.)

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Gallery.test -t "Addable"`
Expected: FAIL — nenhum `[data-addable]` renderizado.

- [ ] **Step 3: Implementar**

`src/app/_components/Gallery.tsx` — adicionar o import e o `<Addable>` condicional à última página, dentro do `album-stage`:

```tsx
import { Addable } from "./Addable";
```

```tsx
  return (
    <div className="select-none">
      <div
        className="album-stage relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...swipeHandlers}
      >
        <div key={page} className={dir === 1 ? "album-page-next" : "album-page-prev"}>
          <div className="grid grid-cols-12 items-start gap-x-0">
            {spread.map((photo, i) => {
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
            })}
          </div>
          {page === spreads.length - 1 && (
            <Addable
              type="placement"
              context={{ surface: "home-gallery" }}
              className="mt-4 aspect-4/5 w-full text-4xl font-light"
            >
              +
            </Addable>
          )}
        </div>
      </div>
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
feat: add Addable placement marker at the end of the home gallery

Só aparece na última página do álbum — as páginas intermediárias já
usam os 6 slots de spreadPoses por completo.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `ADD_HANDLERS` (`addHandlers.ts`)

**Files:**

- Create: `src/app/preview/_components/addHandlers.ts`
- Create: `src/app/preview/_components/addHandlers.test.ts`

**Interfaces:**

- Produces: `resolveAddHandler(entityType: string, context: unknown): AddTarget | null`, `AddTarget = {kind:'niche'} | {kind:'package', nicheSlug:string} | {kind:'placement', surface:PhotoSurface, refId:string|null}`. Usado por `PreviewFrame` (Task 14).

Diferente do `EDIT_HANDLERS`/`DELETE_HANDLERS`, não precisa de nenhuma lista carregada — só interpreta o `context` já recebido do `Addable`.

- [ ] **Step 1: Escrever o teste que falha**

`src/app/preview/_components/addHandlers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveAddHandler } from "./addHandlers";

describe("resolveAddHandler", () => {
  it("resolve niche sem context nenhum", () => {
    expect(resolveAddHandler("niche", undefined)).toEqual({ kind: "niche" });
  });

  it("resolve package com nicheSlug", () => {
    expect(resolveAddHandler("package", { nicheSlug: "familia" })).toEqual({
      kind: "package",
      nicheSlug: "familia",
    });
  });

  it("resolve placement com surface e refId", () => {
    expect(resolveAddHandler("placement", { surface: "niche", refId: "familia" })).toEqual({
      kind: "placement",
      surface: "niche",
      refId: "familia",
    });
  });

  it("resolve placement sem refId (ex.: home-gallery) como refId null", () => {
    expect(resolveAddHandler("placement", { surface: "home-gallery" })).toEqual({
      kind: "placement",
      surface: "home-gallery",
      refId: null,
    });
  });

  it("retorna null pra tipo desconhecido, sem quebrar", () => {
    expect(resolveAddHandler("profile", undefined)).toBeNull();
  });

  it("retorna null quando package/placement não têm o context esperado", () => {
    expect(resolveAddHandler("package", undefined)).toBeNull();
    expect(resolveAddHandler("placement", { refId: "sem-surface" })).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- addHandlers.test`
Expected: FAIL — `./addHandlers` não existe.

- [ ] **Step 3: Implementar**

`src/app/preview/_components/addHandlers.ts`:

```ts
import type { PhotoSurface } from "@/api/domain/placement/Placement";

export type AddTarget =
  | { kind: "niche" }
  | { kind: "package"; nicheSlug: string }
  | { kind: "placement"; surface: PhotoSurface; refId: string | null };

const ADD_HANDLERS: Record<string, (context: unknown) => AddTarget | null> = {
  niche: () => ({ kind: "niche" }),
  package: (context) => {
    const nicheSlug = (context as { nicheSlug?: string } | undefined)?.nicheSlug;
    return nicheSlug ? { kind: "package", nicheSlug } : null;
  },
  placement: (context) => {
    const surface = (context as { surface?: PhotoSurface } | undefined)?.surface;
    if (!surface) return null;
    const refId = (context as { refId?: string } | undefined)?.refId ?? null;
    return { kind: "placement", surface, refId };
  },
};

export function resolveAddHandler(entityType: string, context: unknown): AddTarget | null {
  const handler = ADD_HANDLERS[entityType];
  return handler ? handler(context) : null;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- addHandlers.test`
Expected: PASS (6 testes)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/preview/_components/addHandlers.ts src/app/preview/_components/addHandlers.test.ts
git commit -m "$(cat <<'EOF'
feat: add ADD_HANDLERS registry for the inline preview

Interpreta o context de um Addable clicado — não precisa de nenhuma
lista carregada, diferente de EDIT_HANDLERS/DELETE_HANDLERS.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `DELETE_HANDLERS` (`deleteHandlers.ts`)

**Files:**

- Create: `src/app/preview/_components/deleteHandlers.ts`
- Create: `src/app/preview/_components/deleteHandlers.test.ts`

**Interfaces:**

- Produces: `resolveDeleteHandler(entityType, id, lists): DeleteTarget | null`, `DeleteTarget = {kind:'niche',niche} | {kind:'package',pkg} | {kind:'placement',placement}`, `lists = {niches, packages, placements}` — mesmo shape de `editHandlers.ts`. Usado por `PreviewFrame` (Task 14).

- [ ] **Step 1: Escrever o teste que falha**

`src/app/preview/_components/deleteHandlers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveDeleteHandler } from "./deleteHandlers";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";

const niche = { slug: "familia", title: "Família" } as NicheViewModel;
const pkg = { id: "pacote-1", name: "Essencial" } as PackageViewModel;
const placement = { id: "mock-placement-1", photoId: "foto-1" } as PlacementViewModel;

const lists = { niches: [niche], packages: [pkg], placements: [placement] };

describe("resolveDeleteHandler", () => {
  it("resolve um nicho pelo slug", () => {
    expect(resolveDeleteHandler("niche", "familia", lists)).toEqual({ kind: "niche", niche });
  });

  it("resolve um pacote pelo id", () => {
    expect(resolveDeleteHandler("package", "pacote-1", lists)).toEqual({
      kind: "package",
      pkg,
    });
  });

  it("resolve um placement pelo id", () => {
    expect(resolveDeleteHandler("placement", "mock-placement-1", lists)).toEqual({
      kind: "placement",
      placement,
    });
  });

  it("retorna null pra um tipo desconhecido (ex.: profile — não é deletável)", () => {
    expect(resolveDeleteHandler("profile", "main", lists)).toBeNull();
  });

  it("retorna null quando o id não está na lista carregada", () => {
    expect(resolveDeleteHandler("niche", "nao-existe", lists)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- deleteHandlers.test`
Expected: FAIL — `./deleteHandlers` não existe.

- [ ] **Step 3: Implementar**

`src/app/preview/_components/deleteHandlers.ts`:

```ts
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";

export type DeleteTarget =
  | { kind: "niche"; niche: NicheViewModel }
  | { kind: "package"; pkg: PackageViewModel }
  | { kind: "placement"; placement: PlacementViewModel };

interface Lists {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  placements: PlacementViewModel[];
}

// "profile" fica de fora de propósito — o perfil é um singleton, não
// faz sentido "deletar" (só editar, ver editHandlers.ts).
const DELETE_HANDLERS: Record<string, (id: string, lists: Lists) => DeleteTarget | null> = {
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

export function resolveDeleteHandler(
  entityType: string,
  id: string,
  lists: Lists,
): DeleteTarget | null {
  const handler = DELETE_HANDLERS[entityType];
  return handler ? handler(id, lists) : null;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- deleteHandlers.test`
Expected: PASS (5 testes)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/preview/_components/deleteHandlers.ts src/app/preview/_components/deleteHandlers.test.ts
git commit -m "$(cat <<'EOF'
feat: add DELETE_HANDLERS registry for the inline preview

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `ProfileForm` ganha `onSaved` opcional

**Files:**

- Modify: `src/app/profile/_components/ProfileForm.tsx`

**Interfaces:**

- Produces: `ProfileForm({ initialProfile, onSaved? }): JSX.Element` — `onSaved?: (profile: ProfileDTO) => void`, chamado com o resultado depois de um save bem-sucedido. Compatível com o uso atual (`/profile/page.tsx` não passa `onSaved`, comportamento idêntico ao de hoje). Usado por `EditProfileModal` (Task 11).

Sem teste novo — este projeto não testa componentes React (`vitest.config.ts` só inclui `.test.ts`, ver Global Constraints), e não há lógica pura nova aqui, só uma prop opcional a mais. Verificado por `typecheck` (prop compatível com o uso existente) e pelo smoke test manual da Task 17.

- [ ] **Step 1: Implementar**

`src/app/profile/_components/ProfileForm.tsx` — mudar a assinatura e o corpo de `handleSubmit`:

```tsx
export function ProfileForm({
    initialProfile,
    onSaved,
}: {
    initialProfile: ProfileDTO | null;
    onSaved?: (profile: ProfileDTO) => void;
}) {
    const [values, setValues] = useState<ProfileFormValues>(
        initialProfile ? fromProfile(initialProfile) : EMPTY_FORM,
    );
    const [isPending, startTransition] = useTransition();

    function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
        setValues(current => ({ ...current, [key]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            const result = await runMutation(() => saveProfile(toPayload(values)), {
                success: 'Perfil salvo.',
                fallbackError: 'Falha ao salvar o perfil.',
            });
            if (result.ok) {
                setValues(fromProfile(result.value));
                onSaved?.(result.value);
            }
        });
    }
```

O resto do arquivo (JSX do formulário) não muda.

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde — `/profile/page.tsx` continua chamando `<ProfileForm initialProfile={profile} />` sem `onSaved`, comportamento idêntico ao de antes.

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/_components/ProfileForm.tsx
git commit -m "$(cat <<'EOF'
feat: add optional onSaved callback to ProfileForm

Prop opcional, compatível com o uso atual em /profile — necessária
pro EditProfileModal (preview) saber quando fechar/recarregar depois
de salvar.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: `EditProfileModal` + `EDIT_HANDLERS` ganha `profile`

**Files:**

- Create: `src/app/preview/_components/EditProfileModal.tsx`
- Modify: `src/app/preview/_components/editHandlers.ts`
- Modify: `src/app/preview/_components/editHandlers.test.ts`

**Interfaces:**

- Consumes: `ProfileForm` com `onSaved` (Task 10).
- Produces: `EditTarget` ganha o variant `{kind:'profile', profile: ProfileDTO}`. `EditProfileModal({open, onOpenChange, profile, onSaved}): JSX.Element`. Usado por `PreviewFrame` (Task 14).

- [ ] **Step 1: Escrever o teste que falha**

Adicionar a `src/app/preview/_components/editHandlers.test.ts`:

```ts
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";
```

(junto dos demais imports de tipo)

```ts
const profile: ProfileDTO = {
  capaCaption: "Legenda",
  profissao: { titulo: "Título", eyebrow: "Eyebrow", paragrafos: [] },
  familia: { titulo: "Família", paragrafos: [], legendaFoto: "" },
};

const listsComProfile = { niches: [niche], packages: [pkg], placements: [placement], profile };
```

```ts
it("resolve o perfil ignorando o id recebido — é um singleton", () => {
  expect(resolveEditHandler("profile", "qualquer-coisa", listsComProfile)).toEqual({
    kind: "profile",
    profile,
  });
});
```

(adicionar dentro do `describe('resolveEditHandler')` já existente)

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- editHandlers.test -t "perfil"`
Expected: FAIL — `resolveEditHandler` não aceita `profile` no tipo `Lists`, e não há handler pra `profile`.

- [ ] **Step 3: Implementar**

`src/app/preview/_components/editHandlers.ts` completo:

```ts
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";

export type EditTarget =
  | { kind: "niche"; niche: NicheViewModel }
  | { kind: "package"; pkg: PackageViewModel }
  | { kind: "placement"; placement: PlacementViewModel }
  | { kind: "profile"; profile: ProfileDTO };

interface Lists {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  placements: PlacementViewModel[];
  profile: ProfileDTO | null;
}

// Registro central — cada tipo sabe procurar sua própria entidade na
// lista já carregada pela rota /preview. "profile" ignora o id
// recebido: é um singleton (profile/main), sempre o mesmo registro.
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
  profile: (_id, lists) => (lists.profile ? { kind: "profile", profile: lists.profile } : null),
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

`src/app/preview/_components/EditProfileModal.tsx`:

```tsx
"use client";

import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";
import { ProfileForm } from "@/app/profile/_components/ProfileForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileDTO | null;
  onSaved: (profile: ProfileDTO) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <ProfileForm initialProfile={profile} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- editHandlers.test`
Expected: PASS (todos os testes do arquivo, incluindo o novo)

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde — este step vai apontar qualquer chamador de `resolveEditHandler`/`Lists` que ainda não passa `profile` (só `PreviewFrame`, ajustado na Task 14).

- [ ] **Step 6: Commit**

```bash
git add src/app/preview/_components/EditProfileModal.tsx src/app/preview/_components/editHandlers.ts src/app/preview/_components/editHandlers.test.ts
git commit -m "$(cat <<'EOF'
feat: wire up profile editing in the inline preview

EDIT_HANDLERS ganha "profile" (ignora o id — é um singleton). Os
wraps <Editable type="profile" id="main"> em About.tsx, já existentes
desde o plano anterior, passam a funcionar de verdade.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: `AddPhotoModal` (2 passos)

**Files:**

- Create: `src/app/preview/_components/AddPhotoModal.tsx`

**Interfaces:**

- Consumes: `uploadToCloudinary` (`src/app/photos/_lib/uploadToCloudinary.ts`), `EMPTY_PLACEMENT_FORM`/`toCreatePayload`/`PlacementFormValues` (`src/app/placements/_components/PlacementForm.tsx`), `createPhoto`/`createPlacement` actions, `NULL_REF_SURFACES` (`src/api/domain/placement/Placement.ts`).
- Produces: `AddPhotoModal({open, onOpenChange, surface, refId, onCreated}): JSX.Element`, `onCreated: (placement: PlacementViewModel) => void`. Usado por `PreviewFrame` (Task 14).

Sem teste novo — mesmo motivo da Task 10 (componente React, sem lógica pura nova; a validação real é o `typecheck` + smoke test manual, mesma decisão já tomada pro `PreviewFrame` no plano anterior).

- [ ] **Step 1: Implementar**

`src/app/preview/_components/AddPhotoModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import { NULL_REF_SURFACES } from "@/api/domain/placement/Placement";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { createPlacement } from "@/actions/placements";
import { createPhoto } from "@/actions/photos";
import { uploadToCloudinary } from "@/app/photos/_lib/uploadToCloudinary";
import {
  EMPTY_PLACEMENT_FORM,
  toCreatePayload,
  type PlacementFormValues,
} from "@/app/placements/_components/PlacementForm";
import { Button } from "@/lib/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { Input } from "@/lib/_components/ui/input";
import { Label } from "@/lib/_components/ui/label";
import { clientEnv } from "@/config/env.client";
import { runMutation } from "@/lib/_utils/runMutation";
import { showToast } from "@/lib/_utils/toast";

interface UploadedPhoto {
  cloudinaryPublicId: string;
  width: number;
  height: number;
}

export function AddPhotoModal({
  open,
  onOpenChange,
  surface,
  refId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surface: PhotoSurface;
  refId: string | null;
  onCreated: (placement: PlacementViewModel) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedPhoto | null>(null);
  const [values, setValues] = useState<PlacementFormValues>({
    ...EMPTY_PLACEMENT_FORM,
    surface,
    refId: refId ?? "",
  });
  const [isPending, setIsPending] = useState(false);

  function reset() {
    setStep(1);
    setUploaded(null);
    setValues({ ...EMPTY_PLACEMENT_FORM, surface, refId: refId ?? "" });
  }

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
      const result = await uploadToCloudinary(file, cloudName, preset);
      setUploaded(result);
      setStep(2);
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Falha ao enviar a foto.",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!uploaded) return;
    setIsPending(true);
    const result = await runMutation(
      async () => {
        const photo = await createPhoto(uploaded);
        // Se createPlacement falhar daqui pra frente, a foto já
        // existe (createPhoto teve sucesso) mas fica sem
        // posicionamento — aparece no painel de fotos órfãs, não
        // é um estado quebrado (ver spec).
        // createPlacement já retorna PlacementViewModel (converte
        // internamente) — nada a converter aqui.
        return createPlacement({
          ...toCreatePayload(values),
          photoId: photo.id,
        });
      },
      { success: "Foto adicionada.", fallbackError: "Falha ao criar o posicionamento." },
    );
    setIsPending(false);
    if (result.ok) {
      onCreated(result.value);
      reset();
      onOpenChange(false);
    }
  }

  const usesNullRef = NULL_REF_SURFACES.includes(surface);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Nova foto — passo 1: enviar" : "Nova foto — passo 2: posicionamento"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileChange}
              className="text-sm"
            />
            {isUploading && <p className="text-muted-foreground text-sm">Enviando…</p>}
          </div>
        )}

        {step === 2 && uploaded && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {usesNullRef ? surface : `${surface} — ${refId}`}
            </p>
            <div>
              <Label htmlFor="role">Papel (opcional)</Label>
              <Input
                id="role"
                value={values.role}
                onChange={(e) => setValues({ ...values, role: e.target.value })}
                placeholder="ex.: capa, polaroid-1, destaque"
              />
            </div>
            <div>
              <Label htmlFor="order">Ordem</Label>
              <Input
                id="order"
                type="number"
                value={values.order}
                onChange={(e) => setValues({ ...values, order: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : "Adicionar"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 3: Commit**

```bash
git add src/app/preview/_components/AddPhotoModal.tsx
git commit -m "$(cat <<'EOF'
feat: add AddPhotoModal — 2-step upload then placement creation

Passo 1 reaproveita o upload do UploadPhotoModal sem criar a foto
ainda; passo 2 reaproveita os campos de papel/ordem do
PlacementForm, com surface/refId fixos vindos do Addable clicado.
Confirmar cria a foto e o posicionamento em sequência.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: `NewPackageModal` ganha `initialNicheSlug` opcional

**Files:**

- Modify: `src/app/packages/_components/NewPackageModal.tsx`

**Interfaces:**

- Produces: `NewPackageModal` ganha a prop opcional `initialNicheSlug?: string` — quando presente, o formulário abre com `nicheSlug` já preenchido e travado (não editável). Compatível com o uso atual (`PackagesManager.tsx` não passa a prop, comportamento idêntico). Usado por `PreviewFrame` (Task 14).

Sem teste novo — mesmo motivo das Tasks 10/12.

- [ ] **Step 1: Implementar**

`src/app/packages/_components/NewPackageModal.tsx` completo:

```tsx
"use client";

import { createPackage } from "@/actions/packages";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import { Button } from "@/lib/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/_components/ui/dialog";
import { runMutation } from "@/lib/_utils/runMutation";
import { useEffect, useState, useTransition } from "react";
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
  initialNicheSlug,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niches: NicheViewModel[];
  initialNicheSlug?: string;
  onCreated: (pkg: PackageViewModel) => void;
}) {
  const [values, setValues] = useState<PackageFormValues>(EMPTY_PACKAGE_FORM);
  const [isPending, startTransition] = useTransition();

  // initialNicheSlug só existe quando o modal abre a partir de um
  // Addable de pacote no preview (já sabe o nicho) — sem ele,
  // comportamento idêntico ao de sempre (nicho vazio, dropdown
  // editável).
  useEffect(() => {
    if (open && initialNicheSlug) {
      setValues((current) => ({ ...current, nicheSlug: initialNicheSlug }));
    }
  }, [open, initialNicheSlug]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await runMutation(() => createPackage(toPackagePayload(values)), {
        success: "Pacote criado.",
        fallbackError: "Falha ao criar pacote.",
      });
      if (result.ok) {
        onCreated(result.value);
        setValues(EMPTY_PACKAGE_FORM);
        onOpenChange(false);
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
          <PackageForm
            values={values}
            onChange={setValues}
            niches={niches}
            nicheSlugEditable={!initialNicheSlug}
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

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde — `PackagesManager.tsx` continua chamando `<NewPackageModal open onOpenChange niches onCreated />` sem `initialNicheSlug`, comportamento idêntico ao de antes.

- [ ] **Step 3: Commit**

```bash
git add src/app/packages/_components/NewPackageModal.tsx
git commit -m "$(cat <<'EOF'
feat: add optional initialNicheSlug to NewPackageModal

Prop opcional, compatível com o uso atual em /packages — quando o
modal abre a partir de um Addable de pacote no preview, o nicho já
vem preenchido e travado.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: `PreviewFrame` trata `add`/`delete`, abre os modais novos

**Files:**

- Modify: `src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `resolveAddHandler` (Task 8), `resolveDeleteHandler` (Task 9), `EditProfileModal` (Task 11), `AddPhotoModal` (Task 12), `NewNicheModal`/`NewPackageModal` (Task 13) com `initialNicheSlug`, `ConfirmationDialog`.
- Produces: `PreviewFrame` ganha a prop `profile: ProfileDTO | null`. Usado por `page.tsx` (Task 16).

Sem teste novo — mesmo motivo das Tasks 10/12/13 (componente React de orquestração, sem lógica pura nova; a lógica pura já está coberta em `addHandlers.test.ts`/`deleteHandlers.test.ts`/`editHandlers.test.ts`).

- [ ] **Step 1: Implementar**

`src/app/preview/_components/PreviewFrame.tsx` completo:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";
import { EditNicheModal } from "@/app/niches/_components/EditNicheModal";
import { NewNicheModal } from "@/app/niches/_components/NewNicheModal";
import { EditPackageModal } from "@/app/packages/_components/EditPackageModal";
import { NewPackageModal } from "@/app/packages/_components/NewPackageModal";
import { EditPlacementModal } from "@/app/placements/_components/EditPlacementModal";
import { clientEnv } from "@/config/env.client";
import { ConfirmationDialog } from "@/lib/_components/ui/confirmation-dialog";
import { showToast } from "@/lib/_utils/toast";
import { deleteNiche } from "@/actions/niches";
import { deletePackage } from "@/actions/packages";
import { deletePlacement } from "@/actions/placements";
import { runMutation } from "@/lib/_utils/runMutation";
import { resolveAddHandler, type AddTarget } from "./addHandlers";
import { resolveDeleteHandler, type DeleteTarget } from "./deleteHandlers";
import { resolveEditHandler, type EditTarget } from "./editHandlers";
import { EditProfileModal } from "./EditProfileModal";
import { AddPhotoModal } from "./AddPhotoModal";

const PING = "app-photo:preview:ping";
const ACK = "app-photo:preview:ack";
const EDIT = "app-photo:preview:edit";
const ADD = "app-photo:preview:add";
const DELETE = "app-photo:preview:delete";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function deleteLabel(target: DeleteTarget): { title: string; description: string } {
  switch (target.kind) {
    case "niche":
      return {
        title: "Remover nicho",
        description: `Remover "${target.niche.title}"? Esta ação não pode ser desfeita.`,
      };
    case "package":
      return {
        title: "Remover pacote",
        description: `Remover "${target.pkg.name}"? Esta ação não pode ser desfeita.`,
      };
    case "placement":
      return {
        title: "Remover posicionamento",
        description:
          "Remover este posicionamento? A foto em si não é apagada, só desvinculada desta superfície.",
      };
  }
}

export function PreviewFrame({
  niches: initialNiches,
  packages: initialPackages,
  photos,
  placements: initialPlacements,
  profile: initialProfile,
}: {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  photos: PhotoViewModel[];
  placements: PlacementViewModel[];
  profile: ProfileDTO | null;
}) {
  const [niches, setNiches] = useState(initialNiches);
  const [packages, setPackages] = useState(initialPackages);
  const [placements, setPlacements] = useState(initialPlacements);
  const [profile, setProfile] = useState(initialProfile);
  const [activeEdit, setActiveEdit] = useState<EditTarget | null>(null);
  const [activeAdd, setActiveAdd] = useState<AddTarget | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
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
          profile,
        });
        if (!target) {
          showToast({
            message: "Item não encontrado no preview — recarregue a página.",
            variant: "error",
          });
          return;
        }
        setActiveEdit(target);
        return;
      }

      if (event.data?.type === ADD) {
        const target = resolveAddHandler(event.data.entityType, event.data.context);
        if (!target) {
          showToast({ message: "Não foi possível abrir a criação.", variant: "error" });
          return;
        }
        setActiveAdd(target);
        return;
      }

      if (event.data?.type === DELETE) {
        const target = resolveDeleteHandler(event.data.entityType, event.data.id, {
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
        setDeleting(target);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [appPhotoOrigin, niches, packages, placements, profile]);

  function reloadIframe() {
    const frame = iframeRef.current;
    if (!frame) return;
    setLoadError(false);
    const url = new URL(frame.src);
    url.searchParams.set("_preview", Date.now().toString());
    frame.src = url.toString();
  }

  function closeEdit() {
    setActiveEdit(null);
  }

  function closeAdd() {
    setActiveAdd(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    const result = await (async () => {
      switch (deleting.kind) {
        case "niche":
          return runMutation(() => deleteNiche(deleting.niche.slug), {
            success: "Nicho removido.",
            fallbackError: "Falha ao remover nicho.",
          });
        case "package":
          return runMutation(() => deletePackage(deleting.pkg.id), {
            success: "Pacote removido.",
            fallbackError: "Falha ao remover pacote.",
          });
        case "placement":
          return runMutation(() => deletePlacement(deleting.placement.id), {
            success: "Posicionamento removido.",
            fallbackError: "Falha ao remover posicionamento.",
          });
      }
    })();
    if (result.ok) {
      if (deleting.kind === "niche") {
        setNiches((prev) => prev.filter((n) => n.slug !== deleting.niche.slug));
      } else if (deleting.kind === "package") {
        setPackages((prev) => prev.filter((p) => p.id !== deleting.pkg.id));
      } else {
        setPlacements((prev) => prev.filter((p) => p.id !== deleting.placement.id));
      }
      reloadIframe();
    }
  }

  if (!appPhotoUrl || !appPhotoOrigin) {
    return (
      <p className="text-muted-foreground">
        NEXT_PUBLIC_APP_PHOTO_URL não configurado — preview indisponível.
      </p>
    );
  }

  const deleteText = deleting ? deleteLabel(deleting) : null;

  return (
    <div className="h-[80vh] w-full overflow-hidden rounded border">
      {loadError && (
        <p className="text-destructive mb-2 text-sm">
          Não foi possível carregar o site em {appPhotoUrl} — confirme que o app-photo está rodando
          e tente recarregar.
        </p>
      )}
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
      <EditProfileModal
        profile={activeEdit?.kind === "profile" ? activeEdit.profile : null}
        open={activeEdit?.kind === "profile"}
        onOpenChange={(open) => !open && closeEdit()}
        onSaved={(updated) => {
          setProfile(updated);
          closeEdit();
          reloadIframe();
        }}
      />

      <NewNicheModal
        open={activeAdd?.kind === "niche"}
        onOpenChange={(open) => !open && closeAdd()}
        onCreated={(created) => {
          setNiches((prev) => [...prev, created]);
          closeAdd();
          reloadIframe();
        }}
      />
      <NewPackageModal
        open={activeAdd?.kind === "package"}
        onOpenChange={(open) => !open && closeAdd()}
        niches={niches}
        initialNicheSlug={activeAdd?.kind === "package" ? activeAdd.nicheSlug : undefined}
        onCreated={(created) => {
          setPackages((prev) => [...prev, created]);
          closeAdd();
          reloadIframe();
        }}
      />
      {activeAdd?.kind === "placement" && (
        <AddPhotoModal
          open
          onOpenChange={(open) => !open && closeAdd()}
          surface={activeAdd.surface}
          refId={activeAdd.refId}
          onCreated={(created) => {
            setPlacements((prev) => [...prev, created]);
            closeAdd();
            reloadIframe();
          }}
        />
      )}

      {deleteText && (
        <ConfirmationDialog
          open={deleting !== null}
          onOpenChange={(open) => !open && setDeleting(null)}
          title={deleteText.title}
          description={deleteText.description}
          variant="destructive"
          confirmLabel="Remover"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 3: Commit**

```bash
git add src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: PreviewFrame handles add/delete, wires profile editing

Trata as mensagens novas (add/delete), abre NewNicheModal/
NewPackageModal/AddPhotoModal pra criação, EditProfileModal pra
perfil, e um ConfirmationDialog reaproveitado pra exclusão — mesmo
padrão de onUpdated+reloadIframe que a edição já usa.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Painel de fotos órfãs (`OrphanPhotosPanel`)

**Files:**

- Create: `src/app/preview/_components/OrphanPhotosPanel.tsx`
- Modify: `src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `UploadPhotoModal` (`src/app/photos/_components/UploadPhotoModal.tsx`), `deletePhoto` action, `ConfirmationDialog`.
- Produces: `OrphanPhotosPanel({photos, placements, onPhotoCreated, onPhotoDeleted}): JSX.Element`. Montado dentro de `PreviewFrame` (mesma task, fora do iframe).

Sem teste novo — mesmo motivo das demais tasks de componente React desta plano.

- [ ] **Step 1: Implementar**

`src/app/preview/_components/OrphanPhotosPanel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { deletePhoto } from "@/actions/photos";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { Button } from "@/lib/_components/ui/button";
import { ConfirmationDialog } from "@/lib/_components/ui/confirmation-dialog";
import { runMutation } from "@/lib/_utils/runMutation";
import { UploadPhotoModal } from "@/app/photos/_components/UploadPhotoModal";

export function OrphanPhotosPanel({
  photos,
  placements,
  onPhotoCreated,
  onPhotoDeleted,
}: {
  photos: PhotoViewModel[];
  placements: PlacementViewModel[];
  onPhotoCreated: (photo: PhotoViewModel) => void;
  onPhotoDeleted: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<PhotoViewModel | null>(null);

  const orphanPhotos = photos.filter((p) => !placements.some((pl) => pl.photoId === p.id));

  async function handleDelete() {
    if (!deleting) return;
    const result = await runMutation(() => deletePhoto(deleting.id), {
      success: "Foto removida.",
      fallbackError: "Falha ao remover foto.",
    });
    if (result.ok) onPhotoDeleted(deleting.id);
  }

  return (
    <div className="mt-4 rounded border">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between p-3 text-sm font-medium"
      >
        Fotos sem posicionamento ({orphanPhotos.length})
        <span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t p-3">
          <Button type="button" onClick={() => setIsUploadOpen(true)}>
            Enviar foto
          </Button>

          {orphanPhotos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma foto sem posicionamento.</p>
          ) : (
            <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {orphanPhotos.map((photo) => (
                <li key={photo.id} className="space-y-1">
                  {photo.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- miniatura vinda do Cloudinary, mesmo padrão de PhotosManager.tsx
                    <img
                      src={photo.thumbnailUrl}
                      alt=""
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleting(photo)}
                    className="text-destructive block text-xs hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <UploadPhotoModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onCreated={onPhotoCreated}
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
    </div>
  );
}
```

`src/app/preview/_components/PreviewFrame.tsx` completo — `photos` vira state local (era prop direta, sem `useState`, já que nada antes desta task precisava mutá-la), e o retorno passa a ser um fragmento com o painel novo depois da `div` do iframe:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { PhotoViewModel } from "@/api/presentation/photo/PhotoViewModel";
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";
import { EditNicheModal } from "@/app/niches/_components/EditNicheModal";
import { NewNicheModal } from "@/app/niches/_components/NewNicheModal";
import { EditPackageModal } from "@/app/packages/_components/EditPackageModal";
import { NewPackageModal } from "@/app/packages/_components/NewPackageModal";
import { EditPlacementModal } from "@/app/placements/_components/EditPlacementModal";
import { clientEnv } from "@/config/env.client";
import { ConfirmationDialog } from "@/lib/_components/ui/confirmation-dialog";
import { showToast } from "@/lib/_utils/toast";
import { deleteNiche } from "@/actions/niches";
import { deletePackage } from "@/actions/packages";
import { deletePlacement } from "@/actions/placements";
import { runMutation } from "@/lib/_utils/runMutation";
import { resolveAddHandler, type AddTarget } from "./addHandlers";
import { resolveDeleteHandler, type DeleteTarget } from "./deleteHandlers";
import { resolveEditHandler, type EditTarget } from "./editHandlers";
import { EditProfileModal } from "./EditProfileModal";
import { AddPhotoModal } from "./AddPhotoModal";
import { OrphanPhotosPanel } from "./OrphanPhotosPanel";

const PING = "app-photo:preview:ping";
const ACK = "app-photo:preview:ack";
const EDIT = "app-photo:preview:edit";
const ADD = "app-photo:preview:add";
const DELETE = "app-photo:preview:delete";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function deleteLabel(target: DeleteTarget): { title: string; description: string } {
  switch (target.kind) {
    case "niche":
      return {
        title: "Remover nicho",
        description: `Remover "${target.niche.title}"? Esta ação não pode ser desfeita.`,
      };
    case "package":
      return {
        title: "Remover pacote",
        description: `Remover "${target.pkg.name}"? Esta ação não pode ser desfeita.`,
      };
    case "placement":
      return {
        title: "Remover posicionamento",
        description:
          "Remover este posicionamento? A foto em si não é apagada, só desvinculada desta superfície.",
      };
  }
}

export function PreviewFrame({
  niches: initialNiches,
  packages: initialPackages,
  photos: initialPhotos,
  placements: initialPlacements,
  profile: initialProfile,
}: {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  photos: PhotoViewModel[];
  placements: PlacementViewModel[];
  profile: ProfileDTO | null;
}) {
  const [niches, setNiches] = useState(initialNiches);
  const [packages, setPackages] = useState(initialPackages);
  const [photos, setPhotos] = useState(initialPhotos);
  const [placements, setPlacements] = useState(initialPlacements);
  const [profile, setProfile] = useState(initialProfile);
  const [activeEdit, setActiveEdit] = useState<EditTarget | null>(null);
  const [activeAdd, setActiveAdd] = useState<AddTarget | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
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
          profile,
        });
        if (!target) {
          showToast({
            message: "Item não encontrado no preview — recarregue a página.",
            variant: "error",
          });
          return;
        }
        setActiveEdit(target);
        return;
      }

      if (event.data?.type === ADD) {
        const target = resolveAddHandler(event.data.entityType, event.data.context);
        if (!target) {
          showToast({ message: "Não foi possível abrir a criação.", variant: "error" });
          return;
        }
        setActiveAdd(target);
        return;
      }

      if (event.data?.type === DELETE) {
        const target = resolveDeleteHandler(event.data.entityType, event.data.id, {
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
        setDeleting(target);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [appPhotoOrigin, niches, packages, placements, profile]);

  function reloadIframe() {
    const frame = iframeRef.current;
    if (!frame) return;
    setLoadError(false);
    const url = new URL(frame.src);
    url.searchParams.set("_preview", Date.now().toString());
    frame.src = url.toString();
  }

  function closeEdit() {
    setActiveEdit(null);
  }

  function closeAdd() {
    setActiveAdd(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    const result = await (async () => {
      switch (deleting.kind) {
        case "niche":
          return runMutation(() => deleteNiche(deleting.niche.slug), {
            success: "Nicho removido.",
            fallbackError: "Falha ao remover nicho.",
          });
        case "package":
          return runMutation(() => deletePackage(deleting.pkg.id), {
            success: "Pacote removido.",
            fallbackError: "Falha ao remover pacote.",
          });
        case "placement":
          return runMutation(() => deletePlacement(deleting.placement.id), {
            success: "Posicionamento removido.",
            fallbackError: "Falha ao remover posicionamento.",
          });
      }
    })();
    if (result.ok) {
      if (deleting.kind === "niche") {
        setNiches((prev) => prev.filter((n) => n.slug !== deleting.niche.slug));
      } else if (deleting.kind === "package") {
        setPackages((prev) => prev.filter((p) => p.id !== deleting.pkg.id));
      } else {
        setPlacements((prev) => prev.filter((p) => p.id !== deleting.placement.id));
      }
      reloadIframe();
    }
  }

  if (!appPhotoUrl || !appPhotoOrigin) {
    return (
      <p className="text-muted-foreground">
        NEXT_PUBLIC_APP_PHOTO_URL não configurado — preview indisponível.
      </p>
    );
  }

  const deleteText = deleting ? deleteLabel(deleting) : null;

  return (
    <>
      <div className="h-[80vh] w-full overflow-hidden rounded border">
        {loadError && (
          <p className="text-destructive mb-2 text-sm">
            Não foi possível carregar o site em {appPhotoUrl} — confirme que o app-photo está
            rodando e tente recarregar.
          </p>
        )}
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
        <EditProfileModal
          profile={activeEdit?.kind === "profile" ? activeEdit.profile : null}
          open={activeEdit?.kind === "profile"}
          onOpenChange={(open) => !open && closeEdit()}
          onSaved={(updated) => {
            setProfile(updated);
            closeEdit();
            reloadIframe();
          }}
        />

        <NewNicheModal
          open={activeAdd?.kind === "niche"}
          onOpenChange={(open) => !open && closeAdd()}
          onCreated={(created) => {
            setNiches((prev) => [...prev, created]);
            closeAdd();
            reloadIframe();
          }}
        />
        <NewPackageModal
          open={activeAdd?.kind === "package"}
          onOpenChange={(open) => !open && closeAdd()}
          niches={niches}
          initialNicheSlug={activeAdd?.kind === "package" ? activeAdd.nicheSlug : undefined}
          onCreated={(created) => {
            setPackages((prev) => [...prev, created]);
            closeAdd();
            reloadIframe();
          }}
        />
        {activeAdd?.kind === "placement" && (
          <AddPhotoModal
            open
            onOpenChange={(open) => !open && closeAdd()}
            surface={activeAdd.surface}
            refId={activeAdd.refId}
            onCreated={(created) => {
              setPlacements((prev) => [...prev, created]);
              closeAdd();
              reloadIframe();
            }}
          />
        )}

        {deleteText && (
          <ConfirmationDialog
            open={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
            title={deleteText.title}
            description={deleteText.description}
            variant="destructive"
            confirmLabel="Remover"
            onConfirm={handleDelete}
          />
        )}
      </div>

      <OrphanPhotosPanel
        photos={photos}
        placements={placements}
        onPhotoCreated={(photo) => setPhotos((prev) => [...prev, photo])}
        onPhotoDeleted={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
      />
    </>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 3: Commit**

```bash
git add src/app/preview/_components/OrphanPhotosPanel.tsx src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: add orphan photos panel to /preview

Painel retrátil fora do iframe, listando fotos sem posicionamento
nenhum (não aparecem no site publicado, por definição) — upload
avulso e exclusão real do asset, único lugar do preview onde isso
acontece.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: `/preview` busca o perfil também

**Files:**

- Modify: `src/app/preview/page.tsx`

**Interfaces:**

- Consumes: `getProfile()` (`src/actions/profile.ts`, já existente).

- [ ] **Step 1: Implementar**

`src/app/preview/page.tsx` completo:

```tsx
export const dynamic = "force-dynamic";

import { getNiches } from "@/actions/niches";
import { getPackages } from "@/actions/packages";
import { getPhotos } from "@/actions/photos";
import { getPlacements } from "@/actions/placements";
import { getProfile } from "@/actions/profile";
import { PreviewFrame } from "./_components/PreviewFrame";

export default async function PreviewPage() {
  const [niches, packages, photos, placements, profile] = await Promise.all([
    getNiches(),
    getPackages(),
    getPhotos(),
    getPlacements(),
    getProfile(),
  ]);
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Preview do site</h1>
      <PreviewFrame
        niches={niches}
        packages={packages}
        photos={photos}
        placements={placements}
        profile={profile}
      />
    </main>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: tudo verde.

- [ ] **Step 3: Commit**

```bash
git add src/app/preview/page.tsx
git commit -m "$(cat <<'EOF'
feat: /preview also fetches the profile

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: Regressão final + smoke test manual documentado

**Files:** nenhum arquivo novo — só verificação e documentação.

- [ ] **Step 1: Regressão completa nos dois repositórios**

```bash
cd /Users/cesarpisa/Projects/lp-fotografia/app-photo
npm run typecheck && npm run lint && npm test && npm run build

cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: tudo verde nos dois repositórios.

- [ ] **Step 2: Documentar o smoke test manual**

Adicionar ao `DEPLOY.md` do admin-photo, na seção "Smoke test do preview com edição inline" já existente (criada no plano anterior), os passos novos:

```markdown
8. No carrossel de nichos da home (dentro do iframe), role até o fim e
   clique no `+` — deve abrir o formulário de novo nicho. Cancele.
9. Numa página de nicho, role até o fim da grade de pacotes e clique
   no `+` — deve abrir o formulário de novo pacote já com o nicho
   preenchido e travado. Cancele.
10. Role até o fim de uma galeria (home ou nicho) e clique no `+` —
    deve abrir o passo 1 (upload). Envie uma imagem, confirme que o
    passo 2 abre com superfície/referência corretas, preencha papel e
    ordem, confirme — o iframe deve recarregar mostrando a foto nova.
11. Passe o mouse sobre um item editável qualquer — deve aparecer um
    ícone de lixeira no canto. Clique nele — deve pedir confirmação
    antes de remover.
12. Clique no bloco de texto "Quem sou" — deve abrir o formulário de
    edição do perfil (antes deste plano, não fazia nada).
13. Abra o painel "Fotos sem posicionamento" (fora do iframe, abaixo
    do preview) — confirme que ele lista só fotos realmente sem
    nenhum posicionamento, e que enviar/remover uma foto ali funciona.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo
git add DEPLOY.md
git commit -m "$(cat <<'EOF'
docs: document manual smoke test for create/delete/profile in preview

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Finalizar**

Invocar a skill `finishing-a-development-branch` nos dois repositórios (admin-photo: local, main, sem remote; app-photo: branch `feat/nicho-firestore`, PR #2 já aberto).
