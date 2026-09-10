# Edição Inline de Texto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace whole-block editing (click anywhere on a niche/package/profile card → modal with every field) with per-field inline editing — click one specific piece of text, edit it in place via `contentEditable`, confirm/cancel with a floating icon pair, one message sent only on confirm.

**Architecture:** A new `<EditableText>` component marks individual text nodes (not whole blocks) with `data-editable-text="type:id:field"`. `PreviewOverlay` (app-photo) handles entering/exiting edit mode entirely inside the iframe — no round-trip to admin-photo until the user confirms, at which point one `edit-text` message carries the final value. `PreviewFrame` (admin-photo) resolves it via a new `applyTextEdit` helper that patches the right field and calls the existing `updateNiche`/`updatePackage`/`saveProfile` actions (already draft-aware from the rascunho/publicar feature — no changes needed there). Placement (photo) editing is untouched.

**Tech Stack:** Next.js (both repos), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-edicao-inline-texto-design.md`

## Global Constraints

- `data-editable-text` is resolved with priority over both `[data-addable]` and `[data-editable]` in `PreviewOverlay`'s click handler — checked first, so nesting (e.g. `capaCaption` inside a placement `Editable`) resolves correctly via `.closest()` without any `stopPropagation` tricks in `EditableText` itself.
- Entering/exiting text-edit mode is entirely local to the iframe (`contentEditable` toggle + floating icons) — only the final confirm sends a message to admin-photo.
- `field` is a dot-separated path (`"title"`, `"description.1"`, `"profissao.paragrafos.2"`) — never contains `:`, so `data-editable-text` splits cleanly into exactly 3 `:`-separated parts.
- `updateNiche`/`updatePackage` accept `Partial<...>` already — `applyTextEdit` sends only the one top-level field that changed, never the whole entity. `saveProfile` requires the full object — `applyTextEdit` reads current profile state, patches it, and sends the whole patched object.
- The whole-block `<Editable type="niche"|"package"|"profile">` wraps are removed everywhere they exist (replaced by `EditableText` on the specific fields inside). `<Editable type="placement">` wraps are never touched by this plan.
- Every commit: full verification first (`npm run typecheck && npm run lint && npm test && npm run build` in whichever repo changed), commit message ending with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- admin-photo tests: vitest, `environment:'node'`, `include:['src/**/*.test.ts']` only. app-photo tests: vitest+jsdom+testing-library for component-touching things, plain vitest for pure functions.
- `contentEditable`/floating-icon/`getBoundingClientRect` mechanics and the field-instrumentation tasks are not unit tested (same precedent as the existing delete-icon) — verified via full typecheck/lint/build plus a manual smoke test per task.

---

## Task 1: `setValueAtPath` (admin-photo)

**Files:**

- Create: `admin-photo/src/actions/_lib/setValueAtPath.ts`
- Test: `admin-photo/src/actions/_lib/setValueAtPath.test.ts`

**Interfaces:**

- Produces: `setValueAtPath<T>(current: T, path: string[], value: string): T` — consumed by `applyTextEdit` (Task 2).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { setValueAtPath } from "./setValueAtPath";

describe("setValueAtPath", () => {
  it("caminho vazio devolve o valor direto", () => {
    expect(setValueAtPath("qualquer coisa", [], "novo valor")).toBe("novo valor");
  });

  it("substitui uma chave de objeto de um nível", () => {
    const result = setValueAtPath({ title: "old", other: 1 }, ["title"], "new");
    expect(result).toEqual({ title: "new", other: 1 });
  });

  it("substitui um índice de array, sem tocar os outros itens", () => {
    const original = ["a", "b", "c"];
    const result = setValueAtPath(original, ["1"], "new");
    expect(result).toEqual(["a", "new", "c"]);
    expect(result).not.toBe(original);
    expect(result[0]).toBe("a");
    expect(result[2]).toBe("c");
  });

  it("substitui um valor aninhado (objeto + array), sem tocar campos irmãos", () => {
    const profile = {
      profissao: { titulo: "Fotógrafa", paragrafos: ["um", "dois", "três"] },
      familia: { titulo: "Família", paragrafos: ["x"] },
    };
    const result = setValueAtPath(profile, ["profissao", "paragrafos", "2"], "novo três");
    expect(result.profissao.paragrafos).toEqual(["um", "dois", "novo três"]);
    expect(result.profissao.titulo).toBe("Fotógrafa");
    expect(result.familia).toEqual(profile.familia);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd admin-photo && npm test -- setValueAtPath`
Expected: FAIL — module `./setValueAtPath` doesn't exist

- [ ] **Step 3: Write the implementation**

```ts
// Aplica um valor num caminho dentro de uma estrutura (objeto/array
// aninhado), devolvendo uma cópia — nunca muta o original. Reusado
// tanto pra patchar só o valor de UM campo de nicho/pacote (chamado
// com o caminho relativo àquele campo) quanto pro objeto de perfil
// inteiro (chamado com o caminho desde a raiz) — ver applyTextEdit.ts.
export function setValueAtPath<T>(current: T, path: string[], value: string): T {
  if (path.length === 0) return value as unknown as T;
  const [head, ...rest] = path;
  if (Array.isArray(current)) {
    const index = Number(head);
    const clone = [...current];
    clone[index] = setValueAtPath(clone[index], rest, value);
    return clone as unknown as T;
  }
  const obj = current as Record<string, unknown>;
  return { ...obj, [head]: setValueAtPath(obj[head], rest, value) } as T;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd admin-photo && npm test -- setValueAtPath`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd admin-photo
git add src/actions/_lib/setValueAtPath.ts src/actions/_lib/setValueAtPath.test.ts
git commit -m "$(cat <<'EOF'
feat: add setValueAtPath, pure nested-path patch helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `applyTextEdit` (admin-photo)

**Files:**

- Create: `admin-photo/src/actions/_lib/applyTextEdit.ts`
- Test: `admin-photo/src/actions/_lib/applyTextEdit.test.ts`

**Interfaces:**

- Consumes: `setValueAtPath` (Task 1); `updateNiche(slug, Partial<Omit<Niche,'slug'>>)` from `@/actions/niches`; `updatePackage(id, Partial<Omit<Package,'id'|'nicheSlug'>>)` from `@/actions/packages`; `saveProfile(data: Profile)` from `@/actions/profile` — all three already exist, unchanged, already draft-aware.
- Produces: `applyTextEdit(entityType, id, field, value, lists): Promise<ApplyTextEditResult>`, `ApplyTextEditResult = { ok: true } | { ok: false; error: string }` — consumed by `PreviewFrame.tsx` (Task 3).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";

vi.mock("../niches", () => ({ updateNiche: vi.fn().mockResolvedValue({}) }));
vi.mock("../packages", () => ({ updatePackage: vi.fn().mockResolvedValue({}) }));
vi.mock("../profile", () => ({ saveProfile: vi.fn().mockResolvedValue({}) }));

import { updateNiche } from "../niches";
import { updatePackage } from "../packages";
import { saveProfile } from "../profile";
import { applyTextEdit } from "./applyTextEdit";

const niche = {
  slug: "familia",
  title: "Família",
  description: ["um", "dois"],
} as unknown as NicheViewModel;

const pkg = {
  id: "familia-0",
  name: "Essencial",
  items: ["a", "b"],
} as unknown as PackageViewModel;

const profile: ProfileDTO = {
  capaCaption: "legenda",
  profissao: { titulo: "Fotógrafa", eyebrow: "eyebrow", paragrafos: ["x", "y"] },
  familia: { titulo: "Família", paragrafos: ["z"], legendaFoto: "legenda2" },
};

const lists = { niches: [niche], packages: [pkg], profile };

describe("applyTextEdit", () => {
  it("nicho — campo escalar chama updateNiche só com esse campo", async () => {
    const result = await applyTextEdit("niche", "familia", "title", "Novo Título", lists);
    expect(result).toEqual({ ok: true });
    expect(updateNiche).toHaveBeenCalledWith("familia", { title: "Novo Título" });
  });

  it("nicho — campo de array chama updateNiche com o array inteiro patchado", async () => {
    await applyTextEdit("niche", "familia", "description.1", "novo dois", lists);
    expect(updateNiche).toHaveBeenCalledWith("familia", { description: ["um", "novo dois"] });
  });

  it("pacote — campo de array chama updatePackage com o array inteiro patchado", async () => {
    await applyTextEdit("package", "familia-0", "items.0", "novo a", lists);
    expect(updatePackage).toHaveBeenCalledWith("familia-0", { items: ["novo a", "b"] });
  });

  it("perfil — campo aninhado chama saveProfile com o objeto inteiro patchado", async () => {
    await applyTextEdit("profile", "main", "profissao.paragrafos.0", "novo x", lists);
    expect(saveProfile).toHaveBeenCalledWith({
      ...profile,
      profissao: { ...profile.profissao, paragrafos: ["novo x", "y"] },
    });
  });

  it("nicho não encontrado retorna erro sem chamar updateNiche", async () => {
    const result = await applyTextEdit("niche", "nao-existe", "title", "x", lists);
    expect(result).toEqual({
      ok: false,
      error: "Nicho não encontrado no preview — recarregue a página.",
    });
  });

  it("pacote não encontrado retorna erro sem chamar updatePackage", async () => {
    const result = await applyTextEdit("package", "nao-existe", "name", "x", lists);
    expect(result).toEqual({
      ok: false,
      error: "Pacote não encontrado no preview — recarregue a página.",
    });
  });

  it("perfil ausente retorna erro sem chamar saveProfile", async () => {
    const result = await applyTextEdit("profile", "main", "capaCaption", "x", {
      ...lists,
      profile: null,
    });
    expect(result).toEqual({
      ok: false,
      error: "Perfil não encontrado no preview — recarregue a página.",
    });
  });

  it("tipo desconhecido retorna erro genérico, sem chamar nenhuma action", async () => {
    const result = await applyTextEdit("foto", "x", "y", "z", lists);
    expect(result).toEqual({ ok: false, error: "Tipo de campo desconhecido." });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd admin-photo && npm test -- applyTextEdit`
Expected: FAIL — module `./applyTextEdit` doesn't exist

- [ ] **Step 3: Write the implementation**

```ts
import { updateNiche } from "../niches";
import { updatePackage } from "../packages";
import { saveProfile } from "../profile";
import { setValueAtPath } from "./setValueAtPath";
import type { NicheViewModel } from "@/api/presentation/niche/NicheViewModel";
import type { PackageViewModel } from "@/api/presentation/package/PackageViewModel";
import type { ProfileDTO } from "@/api/application/profile/ProfileDTO";

export type ApplyTextEditResult = { ok: true } | { ok: false; error: string };

interface Lists {
  niches: NicheViewModel[];
  packages: PackageViewModel[];
  profile: ProfileDTO | null;
}

// Aplica a edição de UM campo de texto — chamado pelo handler de
// "edit-text" do PreviewFrame. niche/package usam update parcial (só
// o campo top-level muda); profile precisa do objeto inteiro (mesma
// limitação de saveProfile hoje). As 3 actions chamadas aqui já
// gravam em rascunho — nada muda nelas.
export async function applyTextEdit(
  entityType: string,
  id: string,
  field: string,
  value: string,
  lists: Lists,
): Promise<ApplyTextEditResult> {
  const path = field.split(".");

  if (entityType === "niche") {
    const niche = lists.niches.find((n) => n.slug === id);
    if (!niche) {
      return { ok: false, error: "Nicho não encontrado no preview — recarregue a página." };
    }
    const [topField, ...rest] = path;
    const currentValue = (niche as unknown as Record<string, unknown>)[topField];
    const patchedValue = setValueAtPath(currentValue, rest, value);
    await updateNiche(niche.slug, { [topField]: patchedValue } as Partial<
      Omit<NicheViewModel, "slug">
    >);
    return { ok: true };
  }

  if (entityType === "package") {
    const pkg = lists.packages.find((p) => p.id === id);
    if (!pkg) {
      return { ok: false, error: "Pacote não encontrado no preview — recarregue a página." };
    }
    const [topField, ...rest] = path;
    const currentValue = (pkg as unknown as Record<string, unknown>)[topField];
    const patchedValue = setValueAtPath(currentValue, rest, value);
    await updatePackage(pkg.id, { [topField]: patchedValue } as Partial<
      Omit<PackageViewModel, "id" | "nicheSlug">
    >);
    return { ok: true };
  }

  if (entityType === "profile") {
    if (!lists.profile) {
      return { ok: false, error: "Perfil não encontrado no preview — recarregue a página." };
    }
    const patched = setValueAtPath(lists.profile, path, value);
    await saveProfile(patched);
    return { ok: true };
  }

  return { ok: false, error: "Tipo de campo desconhecido." };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd admin-photo && npm test -- applyTextEdit`
Expected: PASS (8 tests)

- [ ] **Step 5: Full verification**

Run: `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS (if `updateNiche`/`updatePackage`/`saveProfile`'s exact parameter types reject the `as Partial<...>` casts, adjust the cast to whatever shape actually satisfies `tsc` — the behavior above is what matters, not the exact cast syntax)

- [ ] **Step 6: Commit**

```bash
git add src/actions/_lib/applyTextEdit.ts src/actions/_lib/applyTextEdit.test.ts
git commit -m "$(cat <<'EOF'
feat: add applyTextEdit, dispatches a text-field patch to the right action

niche/package send a partial update (just the one top-level field);
profile sends the whole patched object, since saveProfile has no
partial-update mode. Reuses the existing draft-aware actions as-is.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `PreviewFrame`/`editHandlers` wiring (admin-photo)

**Files:**

- Modify: `admin-photo/src/app/preview/_components/editHandlers.ts`
- Modify: `admin-photo/src/app/preview/_components/editHandlers.test.ts`
- Modify: `admin-photo/src/app/preview/_components/PreviewFrame.tsx`

**Interfaces:**

- Consumes: `applyTextEdit` (Task 2).
- Produces: `EditTarget` narrowed to `{ kind: 'placement'; placement: PlacementViewModel }` only; `PreviewFrame` handles a new `EDIT_TEXT` message type.

- [ ] **Step 1: Simplify `editHandlers.ts` to placement-only**

Replace the full content:

```ts
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";

export type EditTarget = { kind: "placement"; placement: PlacementViewModel };

interface Lists {
  placements: PlacementViewModel[];
}

// Registro central — niche/package/profile passaram a editar campo
// por campo, inline (ver applyTextEdit.ts e a mensagem "edit-text" em
// PreviewFrame.tsx) — só placement (troca de foto) continua usando o
// fluxo de clique → modal.
const EDIT_HANDLERS: Record<string, (id: string, lists: Lists) => EditTarget | null> = {
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

- [ ] **Step 2: Update `editHandlers.test.ts`**

Replace the full content:

```ts
import type { PlacementViewModel } from "@/api/presentation/placement/PlacementViewModel";
import { describe, expect, it } from "vitest";
import { resolveEditHandler } from "./editHandlers";

const placement = { id: "mock-placement-1", photoId: "foto-1" } as PlacementViewModel;

const lists = { placements: [placement] };

describe("resolveEditHandler", () => {
  it("resolve um placement pelo id", () => {
    expect(resolveEditHandler("placement", "mock-placement-1", lists)).toEqual({
      kind: "placement",
      placement,
    });
  });

  it("retorna null pra um tipo desconhecido, sem quebrar", () => {
    expect(resolveEditHandler("niche", "qualquer-coisa", lists)).toBeNull();
  });

  it("retorna null quando o id não está na lista carregada", () => {
    expect(resolveEditHandler("placement", "nao-existe", lists)).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to confirm it passes on its own**

Run: `cd admin-photo && npm test -- editHandlers`
Expected: PASS (3 tests)

- [ ] **Step 4: Remove the niche/package/profile modal wiring from `PreviewFrame.tsx`**

Remove these three import lines:

```ts
import { EditNicheModal } from "@/app/niches/_components/EditNicheModal";
```

```ts
import { EditPackageModal } from "@/app/packages/_components/EditPackageModal";
```

```ts
import { EditProfileModal } from "./EditProfileModal";
```

(these components stay — `/niches`, `/packages`, `/profile` still use them — only these import sites in `PreviewFrame.tsx` go away)

Remove the three JSX blocks (currently right before `<NewNicheModal`):

```tsx
                <EditNicheModal
                    niche={activeEdit?.kind === 'niche' ? activeEdit.niche : null}
                    open={activeEdit?.kind === 'niche'}
                    onOpenChange={open => !open && closeEdit()}
                    onUpdated={updated => {
                        setNiches(prev => prev.map(n => (n.slug === updated.slug ? updated : n)));
                        closeEdit();
                        reloadIframe();
                    }}
                />
                <EditPackageModal
                    pkg={activeEdit?.kind === 'package' ? activeEdit.pkg : null}
                    open={activeEdit?.kind === 'package'}
                    onOpenChange={open => !open && closeEdit()}
                    niches={niches}
                    onUpdated={updated => {
                        setPackages(prev => prev.map(p => (p.id === updated.id ? updated : p)));
                        closeEdit();
                        reloadIframe();
                    }}
                />
```

and (right after `<EditPlacementModal>`, before `<NewNicheModal>`):

```tsx
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
```

(keep `<EditPlacementModal>` exactly as it is, untouched, between where `EditPackageModal` and `EditProfileModal` used to sit)

- [ ] **Step 5: Add the `EDIT_TEXT` message constant and handler**

Add the constant alongside the existing ones:

```ts
const EDIT_TEXT = "app-photo:preview:edit-text";
```

Add the import:

```ts
import { applyTextEdit } from "@/actions/_lib/applyTextEdit";
```

Add the handling branch in the message listener, right after the existing `EDIT` branch:

```ts
if (event.data?.type === EDIT_TEXT) {
  const { entityType, id, field, value } = event.data;
  void applyTextEdit(entityType, id, field, value, { niches, packages, profile }).then((result) => {
    if (!result.ok) {
      showToast({ message: result.error, variant: "error" });
      return;
    }
    reloadIframe();
  });
  return;
}
```

- [ ] **Step 6: Simplify the `EDIT` branch's call to `resolveEditHandler`**

Replace:

```ts
const target = resolveEditHandler(event.data.entityType, event.data.id, {
  niches,
  packages,
  placements,
  profile,
});
```

with:

```ts
const target = resolveEditHandler(event.data.entityType, event.data.id, {
  placements,
});
```

- [ ] **Step 7: Full verification**

Run: `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS (typecheck will point out anywhere `niches`/`packages`/`profile` were only used by the removed code — if `setNiches`/`setPackages`/`setProfile` become genuinely unused after this, that's a real signal something else still needs them or they're truly dead now; check each one against the rest of the file — e.g. `setPackages` is still used by `NewPackageModal`'s `onCreated` and `handleDelete`'s package branch, so it stays)

- [ ] **Step 8: Manual smoke test**

Run both dev servers, log into `/preview`. Click a niche card, a package card, a profile section — confirm NONE of them open a modal anymore (this is expected at this point in the plan; `EditableText`/the actual inline editing doesn't exist until later tasks, so right now clicking anywhere on those blocks should do **nothing** — no modal, no error). Click on a placement's photo — confirm the photo picker still opens exactly as before.

- [ ] **Step 9: Commit**

```bash
git add src/app/preview/_components/editHandlers.ts src/app/preview/_components/editHandlers.test.ts src/app/preview/_components/PreviewFrame.tsx
git commit -m "$(cat <<'EOF'
feat: remove whole-block edit modals for niche/package/profile

EDIT_HANDLERS narrows to placement only — the click→modal path for
niche/package/profile is replaced by per-field inline editing (this
task wires the receiving end, EDIT_TEXT; EditableText/the click-side
of it lands in later tasks). EditNicheModal/EditPackageModal/
EditProfileModal keep working from the old CRUD pages, unaffected.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `parseEditableTextTarget` (app-photo)

**Files:**

- Modify: `app-photo/src/app/_components/PreviewOverlay.tsx`
- Modify: `app-photo/src/app/_components/PreviewOverlay.test.tsx`

**Interfaces:**

- Produces: `parseEditableTextTarget(value: string | null): { entityType: string; id: string; field: string } | null` — consumed by `EditableText` instrumentation (Tasks 7-10) indirectly (via the click handler in Task 6) and directly testable now.

- [ ] **Step 1: Write the failing test**

Add to `PreviewOverlay.test.tsx` (alongside the existing `describe("parseEditableTarget", ...)` block). First, update the existing import line from `"./PreviewOverlay"` to also pull in the new function:

```ts
import {
  isHandshakeAck,
  originOf,
  parseAddableTarget,
  parseEditableTarget,
  parseEditableTextTarget,
  PreviewOverlay,
} from "./PreviewOverlay";
```

Then add the new `describe` block:

```ts
describe("parseEditableTextTarget", () => {
  it("separa tipo, id e campo pelos dois pontos", () => {
    expect(parseEditableTextTarget("niche:familia:description.1")).toEqual({
      entityType: "niche",
      id: "familia",
      field: "description.1",
    });
  });

  it("separa um campo aninhado sem problema (o campo em si nunca tem ':')", () => {
    expect(parseEditableTextTarget("profile:main:profissao.paragrafos.2")).toEqual({
      entityType: "profile",
      id: "main",
      field: "profissao.paragrafos.2",
    });
  });

  it("retorna null se faltar qualquer uma das 3 partes, ou valor vazio/nulo", () => {
    expect(parseEditableTextTarget("niche:familia")).toBeNull();
    expect(parseEditableTextTarget("niche::title")).toBeNull();
    expect(parseEditableTextTarget(null)).toBeNull();
    expect(parseEditableTextTarget("")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app-photo && npm test -- PreviewOverlay`
Expected: FAIL — `parseEditableTextTarget` is not exported from `./PreviewOverlay`

- [ ] **Step 3: Add the function to `PreviewOverlay.tsx`**

Add this new export right after the existing `parseAddableTarget`:

```ts
export function parseEditableTextTarget(
  value: string | null,
): { entityType: string; id: string; field: string } | null {
  if (!value) return null;
  const [entityType, id, field] = value.split(":");
  if (!entityType || !id || !field) return null;
  return { entityType, id, field };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app-photo && npm test -- PreviewOverlay`
Expected: PASS (all `PreviewOverlay.test.tsx` cases, including the 3 new ones)

- [ ] **Step 5: Full verification**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
cd app-photo
git add src/app/_components/PreviewOverlay.tsx src/app/_components/PreviewOverlay.test.tsx
git commit -m "$(cat <<'EOF'
feat: add parseEditableTextTarget

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `<EditableText>` component (app-photo)

**Files:**

- Create: `app-photo/src/app/_components/EditableText.tsx`
- Test: `app-photo/src/app/_components/EditableText.test.tsx`

**Interfaces:**

- Produces: `<EditableText type id field as? className? children />` — consumed by Tasks 7-10 (field instrumentation).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { EditableText } from "./EditableText";

describe("EditableText", () => {
  it("gera o atributo data-editable-text no formato type:id:field", () => {
    const { container } = render(
      <EditableText type="niche" id="familia" field="title">
        Família
      </EditableText>,
    );
    const el = container.querySelector("[data-editable-text]");
    expect(el?.getAttribute("data-editable-text")).toBe("niche:familia:title");
    expect(el?.textContent).toBe("Família");
  });

  it("usa a tag pedida em 'as', span por padrão", () => {
    const { container } = render(
      <EditableText type="package" id="familia-0" field="name" as="h3">
        Essencial
      </EditableText>,
    );
    expect(container.querySelector("h3[data-editable-text]")).not.toBeNull();
  });

  it("repassa className pro elemento renderizado", () => {
    const { container } = render(
      <EditableText type="profile" id="main" field="capaCaption" className="text-gold">
        Legenda
      </EditableText>,
    );
    expect(container.querySelector(".text-gold")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app-photo && npm test -- EditableText`
Expected: FAIL — module `./EditableText` doesn't exist

- [ ] **Step 3: Write the implementation**

```tsx
"use client";

// Mesmo padrão do Editable.tsx (data-* cru, sem handler próprio —
// PreviewOverlay.tsx lê via delegação de clique), mas marca um TEXTO
// específico (não um bloco inteiro): "field" é o caminho do campo
// dentro da entidade ("title", "description.1",
// "profissao.paragrafos.2"). Ver
// docs/superpowers/specs/2026-09-10-edicao-inline-texto-design.md.
export function EditableText({
  type,
  id,
  field,
  as: Tag = "span",
  className = "",
  children,
}: {
  type: "niche" | "package" | "profile";
  id: string;
  field: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children: string;
}) {
  return (
    <Tag data-editable-text={`${type}:${id}:${field}`} className={className}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app-photo && npm test -- EditableText`
Expected: PASS (3 tests)

- [ ] **Step 5: Full verification**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/EditableText.tsx src/app/_components/EditableText.test.tsx
git commit -m "$(cat <<'EOF'
feat: add EditableText, marks one text field (not a whole block)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `PreviewOverlay` text-edit mode + CSS (app-photo)

**Files:**

- Modify: `app-photo/src/app/_components/PreviewOverlay.tsx`
- Modify: `app-photo/src/app/globals.css`

**Interfaces:**

- Consumes: `parseEditableTextTarget` (Task 4).
- Produces: clicking a `[data-editable-text]` node enters local `contentEditable` edit mode; confirming sends `{ type: "app-photo:preview:edit-text", entityType, id, field, value }` to `window.parent`.

- [ ] **Step 1: Add the message constant and text-editing state**

Add alongside the other message-type consts:

```ts
const EDIT_TEXT = "app-photo:preview:edit-text";
```

Add a new interface and state, right after the existing `HoveredEditable` interface:

```ts
interface TextEditing {
  el: HTMLElement;
  entityType: string;
  id: string;
  field: string;
  originalValue: string;
}
```

Inside `PreviewOverlay()`, add alongside the existing `hovered` state:

```ts
const [textEditing, setTextEditing] = useState<TextEditing | null>(null);
```

- [ ] **Step 2: Resolve `[data-editable-text]` first in the click handler**

Inside the click-handler `useEffect`'s `handleClick`, add this check as the FIRST thing in the function body (before the existing `[data-addable]` check):

```ts
const textEl = target.closest("[data-editable-text]") as HTMLElement | null;
if (textEl) {
  const parsed = parseEditableTextTarget(textEl.getAttribute("data-editable-text"));
  if (parsed && textEditing?.el !== textEl) {
    event.preventDefault();
    event.stopPropagation();
    const originalValue = textEl.textContent ?? "";
    textEl.contentEditable = "true";
    textEl.focus();
    setTextEditing({ el: textEl, ...parsed, originalValue });
  }
  return;
}
```

(When `parsed` is null — malformed attribute — or the clicked node is the one ALREADY being edited, this just `return`s without `preventDefault`/`stopPropagation`, letting the click land normally so the cursor moves inside the already-editable text instead of being frozen at its starting position.)

Since `textEditing` is now read inside this `useEffect`'s closure, add it to that `useEffect`'s dependency array (currently `[active, adminOrigin]` → becomes `[active, adminOrigin, textEditing]`).

- [ ] **Step 3: Add `confirmTextEdit`/`cancelTextEdit` and their keydown/blur wiring**

Add these two functions inside `PreviewOverlay()`, above the `return`:

```ts
function confirmTextEdit() {
  if (!textEditing || !adminOrigin) return;
  const value = textEditing.el.textContent ?? "";
  textEditing.el.contentEditable = "false";
  window.parent.postMessage(
    {
      type: EDIT_TEXT,
      entityType: textEditing.entityType,
      id: textEditing.id,
      field: textEditing.field,
      value,
    },
    adminOrigin,
  );
  setTextEditing(null);
}

function cancelTextEdit() {
  if (!textEditing) return;
  textEditing.el.textContent = textEditing.originalValue;
  textEditing.el.contentEditable = "false";
  setTextEditing(null);
}
```

Add a new `useEffect` (place it after the existing hover-tracking `useEffect`):

```ts
useEffect(() => {
  if (!textEditing) return;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      confirmTextEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelTextEdit();
    }
  }

  // blur é cancelar implícito — os ícones flutuantes usam
  // onMouseDown/preventDefault (ver passo 4) pra nunca causar esse
  // blur antes do próprio onClick deles disparar; então este
  // handler só roda pra "cliquei em outro lugar da página" (que já
  // não conta como confirmar).
  function handleBlur() {
    cancelTextEdit();
  }

  const el = textEditing.el;
  el.addEventListener("keydown", handleKeyDown);
  el.addEventListener("blur", handleBlur);
  return () => {
    el.removeEventListener("keydown", handleKeyDown);
    el.removeEventListener("blur", handleBlur);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- confirmTextEdit/cancelTextEdit fecham sobre textEditing/adminOrigin do próprio render; recriá-las a cada dependência já é coberto por este efeito rodar de novo quando textEditing muda
}, [textEditing]);
```

- [ ] **Step 4: Render the floating ✓/✗ pair, restructure the final return**

Replace the current tail of the component (the `if (!active || !hovered || !adminOrigin) return null;` line through the closing of the function) with:

```tsx
  return (
    <>
      {active && hovered && adminOrigin && (
        <button
          type="button"
          aria-label="Remover"
          className="preview-delete-icon"
          style={{ top: hovered.el.getBoundingClientRect().top - 8, left: hovered.el.getBoundingClientRect().right - 16 }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            window.parent.postMessage(
              { type: DELETE, entityType: hovered.entityType, id: hovered.id },
              adminOrigin!,
            );
          }}
        >
          🗑
        </button>
      )}
      {active && textEditing && (
        <div
          className="preview-textedit-icons"
          style={{
            top: textEditing.el.getBoundingClientRect().top - 32,
            left: textEditing.el.getBoundingClientRect().left,
          }}
        >
          <button
            type="button"
            aria-label="Confirmar"
            onMouseDown={(event) => event.preventDefault()}
            onClick={confirmTextEdit}
          >
            ✓
          </button>
          <button
            type="button"
            aria-label="Cancelar"
            onMouseDown={(event) => event.preventDefault()}
            onClick={cancelTextEdit}
          >
            ✗
          </button>
        </div>
      )}
    </>
  );
}
```

(This replaces the old `if (!active || !hovered || !adminOrigin) return null; const rect = hovered.el.getBoundingClientRect(); return (<button ...>);` shape — the rect is now computed inline per-button instead of once at the top, since there are now two independent conditionally-rendered pieces instead of one.)

- [ ] **Step 5: Add the CSS**

Append to `app-photo/src/app/globals.css`, right after the existing `.preview-delete-icon` rule:

```css
/* [data-editable-text] (EditableText.tsx) — mesmo padrão de
   pointer-events/cursor do [data-editable] de bloco, mas cada texto
   individual vira o alvo do clique, não o card inteiro. */
html[data-preview-active] [data-editable-text] {
  pointer-events: auto;
  cursor: text;
}

html[data-preview-active] [data-editable-text]:hover {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

html[data-preview-active] [data-editable-text][contenteditable="true"] {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  background: color-mix(in oklab, var(--gold) 8%, transparent);
}

/* Par de ícones flutuantes de confirmar/cancelar (PreviewOverlay.tsx) —
   mesmo z-index/position:fixed do .preview-delete-icon, ao lado dele. */
.preview-textedit-icons {
  position: fixed;
  z-index: 2147483647;
  display: flex;
  gap: 4px;
}

.preview-textedit-icons button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.preview-textedit-icons button[aria-label="Confirmar"] {
  background: #16a34a;
}

.preview-textedit-icons button[aria-label="Cancelar"] {
  background: #dc2626;
}
```

- [ ] **Step 6: Full verification**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 7: Manual smoke test**

This can't be fully exercised yet — no field is wrapped in `EditableText` until Tasks 7-10. Confirm only that nothing broke: run both dev servers, open `/preview`, confirm the existing delete-icon-on-hover and photo-editing flows still work exactly as before (this task changed the component's internal structure — the returned JSX shape — without touching that existing behavior).

- [ ] **Step 8: Commit**

```bash
git add src/app/_components/PreviewOverlay.tsx src/app/globals.css
git commit -m "$(cat <<'EOF'
feat: add local text-edit mode to PreviewOverlay

Clicking a [data-editable-text] node makes it contentEditable in
place; a floating confirm/cancel icon pair (or Enter/Escape) is the
only thing that leaves the iframe — one edit-text message on confirm,
nothing on cancel/blur. Resolved with priority over [data-addable]/
[data-editable] so nesting (e.g. a caption inside a placement wrap)
just works via .closest() ordering.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Instrument niche title/subtitle (app-photo)

**Files:**

- Modify: `app-photo/src/app/_components/Niches.tsx`
- Modify: `app-photo/src/app/_components/Events.tsx`
- Modify: `app-photo/src/app/ensaios/[slug]/_components/NicheHero.tsx`

**Interfaces:**

- Consumes: `<EditableText>` (Task 5).

- [ ] **Step 1: `Niches.tsx` — remove the whole-block `Editable`, add `EditableText` on title/subtitle**

The current card is wrapped in `<Editable type="niche" id={n.slug} className="w-[78%] max-w-sm shrink-0 snap-center">...</Editable>` — remove that wrapper (keep its `className` by moving it onto the `<Link>` it directly wrapped, since that's the element that actually needs the sizing/snap classes), and remove the now-unused `Editable` import if nothing else in this file uses it (check — `Niches.tsx` only had this one `Editable` usage, so the import goes away; the `Addable` import stays, that's a separate concern, unaffected by this plan).

Replace:

```tsx
<h3 className="display-xl text-3xl text-foreground">{n.title}</h3>
```

with:

```tsx
<EditableText
  type="niche"
  id={n.slug}
  field="title"
  as="h3"
  className="display-xl text-3xl text-foreground"
>
  {n.title}
</EditableText>
```

Replace:

```tsx
<span className="font-condensed text-[0.6rem] uppercase tracking-[0.32em] text-muted-foreground">
  {n.subtitle}
</span>
```

with:

```tsx
<EditableText
  type="niche"
  id={n.slug}
  field="subtitle"
  className="font-condensed text-[0.6rem] uppercase tracking-[0.32em] text-muted-foreground"
>
  {n.subtitle}
</EditableText>
```

Add the import: `import { EditableText } from "./EditableText";`

- [ ] **Step 2: `Events.tsx` — same pattern**

Remove the `<Editable type="niche" id={e.slug}>...</Editable>` wrapper (keep its children unwrapped, one level up — this one had no `className` on the `Editable` itself, so nothing to move). Remove the `Editable` import (only usage in this file).

Replace:

```tsx
<h3 className="display-xl text-3xl text-foreground">{e.title}</h3>
```

with:

```tsx
<EditableText
  type="niche"
  id={e.slug}
  field="title"
  as="h3"
  className="display-xl text-3xl text-foreground"
>
  {e.title}
</EditableText>
```

Replace:

```tsx
<p className="font-condensed mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
  {e.subtitle}
</p>
```

with:

```tsx
<EditableText
  type="niche"
  id={e.slug}
  field="subtitle"
  as="p"
  className="font-condensed mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground"
>
  {e.subtitle}
</EditableText>
```

Add the import: `import { EditableText } from "./EditableText";`

- [ ] **Step 3: `NicheHero.tsx` — same pattern**

This component receives `slug`/`title`/`subtitle` as plain props (not a `niche` object) — `id` is the `slug` prop already in scope. Remove the `<Editable type="niche" id={slug}>...</Editable>` wrapper (unwrap its children one level up). Remove the `Editable` import — but check first: this file ALSO uses `<Editable type="placement" ...>` inside `AlbumSlides` (a completely different, unrelated usage) — keep that import, only remove the `type="niche"` usage's wrapper, the import itself stays because of the placement usage.

Replace:

```tsx
<h1 className="display-xl mt-4 text-[2.8rem] leading-[0.95] text-foreground sm:text-6xl">
  {title}
</h1>
```

with:

```tsx
<EditableText
  type="niche"
  id={slug}
  field="title"
  as="h1"
  className="display-xl mt-4 text-[2.8rem] leading-[0.95] text-foreground sm:text-6xl"
>
  {title}
</EditableText>
```

Replace:

```tsx
<p className="font-condensed mt-1 text-[0.68rem] uppercase tracking-[0.4em] text-muted-foreground">
  {subtitle}
</p>
```

with:

```tsx
<EditableText
  type="niche"
  id={slug}
  field="subtitle"
  as="p"
  className="font-condensed mt-1 text-[0.68rem] uppercase tracking-[0.4em] text-muted-foreground"
>
  {subtitle}
</EditableText>
```

Add the import: `import { EditableText } from "@/app/_components/EditableText";` (this file lives in `ensaios/[slug]/_components/`, same relative-import convention it already uses for `Editable` from `@/app/_components/Editable`)

- [ ] **Step 4: Full verification**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 5: Manual smoke test**

Run both dev servers, open `/preview` on the Rascunho tab. On the home page teaser carousel: click a niche card's title — confirm the floating ✓/✗ appear, edit it, confirm — check the Firestore emulator UI that `niches_draft/<slug>`'s `title` changed. Click the card's background (not the title) — confirm it now navigates to `/ensaios/<slug>` instead of doing nothing (this was broken before this whole plan started). On the niche page itself, edit the hero title/subtitle the same way. Cancel an edit (Escape) and confirm the text reverts visually and nothing was written to Firestore.

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/Niches.tsx src/app/_components/Events.tsx "src/app/ensaios/[slug]/_components/NicheHero.tsx"
git commit -m "$(cat <<'EOF'
feat: make niche title/subtitle inline-editable (3 render locations)

Removes the whole-block Editable wrap in all 3 places — as a side
effect, the home teaser and events cards' real navigation (Link to
/ensaios/[slug]) works again in preview mode, since only the specific
text is now a click target instead of the entire card.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Instrument niche intro/description/highlights (app-photo)

**Files:**

- Modify: `app-photo/src/app/ensaios/[slug]/page.tsx`

**Interfaces:**

- Consumes: `<EditableText>` (Task 5).

- [ ] **Step 1: Remove the whole-block `Editable`, add `EditableText` on intro/description/highlights**

The current section is wrapped in `<Editable type="niche" id={niche.slug}>...</Editable>` — remove that wrapper (unwrap its children one level up: the `<section className="mx-auto w-full max-w-3xl space-y-8 px-5 pb-4 pt-10">...</section>` stays, just no longer inside an `Editable`). Remove the `Editable` import if this file has no other usage of it (check — if `page.tsx` only used `Editable` for this one wrap, the import goes away entirely).

Replace:

```tsx
<p className="relative text-sm leading-relaxed text-foreground">{niche.intro}</p>
```

with:

```tsx
<EditableText
  type="niche"
  id={niche.slug}
  field="intro"
  as="p"
  className="relative text-sm leading-relaxed text-foreground"
>
  {niche.intro}
</EditableText>
```

Replace:

```tsx
{
  niche.description.map((p) => (
    <p key={p} className="text-sm leading-relaxed text-muted-foreground">
      {p}
    </p>
  ));
}
```

with:

```tsx
{
  niche.description.map((p, i) => (
    <EditableText
      key={p}
      type="niche"
      id={niche.slug}
      field={`description.${i}`}
      as="p"
      className="text-sm leading-relaxed text-muted-foreground"
    >
      {p}
    </EditableText>
  ));
}
```

Replace:

```tsx
              {niche.highlights.map((h) => (
                <li key={h} className="relative overflow-hidden px-4 py-3 text-center">
```

(and its matching closing structure, which has the same shape — the `<span>` inside becomes the `EditableText`, the surrounding `<li>` with its decorative `<div aria-hidden>` stays exactly as-is) — replace just the inner text span:

```tsx
<span className="font-condensed relative text-[0.7rem] uppercase tracking-[0.2em] text-foreground">
  {h}
</span>
```

with:

```tsx
<EditableText
  type="niche"
  id={niche.slug}
  field={`highlights.${i}`}
  className="font-condensed relative text-[0.7rem] uppercase tracking-[0.2em] text-foreground"
>
  {h}
</EditableText>
```

and add the index parameter to that `.map()`: `{niche.highlights.map((h, i) => (`.

Add the import: `import { EditableText } from "@/app/_components/EditableText";`

- [ ] **Step 2: Full verification**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 3: Manual smoke test**

Open a niche page on the Rascunho tab. Edit the intro paragraph, one description paragraph, one highlight — confirm each independently (they're 3 separate `EditableText` fields, editing one shouldn't put the others into edit mode). Check the Firestore emulator UI: `niches_draft/<slug>`'s `intro` is a plain string, `description`/`highlights` are arrays with only the edited index changed, siblings untouched.

- [ ] **Step 4: Commit**

```bash
git add "src/app/ensaios/[slug]/page.tsx"
git commit -m "$(cat <<'EOF'
feat: make niche intro/description/highlights inline-editable

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Instrument package fields (app-photo)

**Files:**

- Modify: `app-photo/src/app/ensaios/[slug]/_components/PackagePicker.tsx`

**Interfaces:**

- Consumes: `<EditableText>` (Task 5).

- [ ] **Step 1: Card view — remove the whole-block `Editable`, add `EditableText` on name/price**

The picker card is wrapped in `<Editable key={p.id} type="package" id={p.id} className="block h-full">...</Editable>` — remove that wrapper, moving its `className="block h-full"` onto the `<button>` it directly wrapped (the button already has its own classes — append `block h-full` to that existing className string). Check whether `Editable` has any OTHER usage in this file before removing the import — this file also imports `Addable`, which is unrelated and stays regardless.

Replace:

```tsx
<h3 className="display-xl relative z-10 text-2xl text-foreground">{p.name}</h3>
```

with:

```tsx
<EditableText
  type="package"
  id={p.id}
  field="name"
  as="h3"
  className="display-xl relative z-10 text-2xl text-foreground"
>
  {p.name}
</EditableText>
```

Replace:

```tsx
<span className="font-condensed relative z-10 mt-1 block text-2xl font-normal text-gold">
  {p.price}
</span>
```

with:

```tsx
<EditableText
  type="package"
  id={p.id}
  field="price"
  className="font-condensed relative z-10 mt-1 block text-2xl font-normal text-gold"
>
  {p.price}
</EditableText>
```

- [ ] **Step 2: Detail view — add `EditableText` on name/price/description/items (no `Editable` existed here before)**

Replace:

```tsx
<h3 className="display-xl text-3xl text-foreground">{pack.name}</h3>
```

with:

```tsx
<EditableText
  type="package"
  id={pack.id}
  field="name"
  as="h3"
  className="display-xl text-3xl text-foreground"
>
  {pack.name}
</EditableText>
```

Replace:

```tsx
<span className="font-condensed shrink-0 text-3xl font-normal text-gold">{pack.price}</span>
```

with:

```tsx
<EditableText
  type="package"
  id={pack.id}
  field="price"
  className="font-condensed shrink-0 text-3xl font-normal text-gold"
>
  {pack.price}
</EditableText>
```

Replace:

```tsx
{
  pack.description && (
    <p className="relative z-10 mt-4 text-sm leading-relaxed text-muted-foreground">
      {pack.description}
    </p>
  );
}
```

with:

```tsx
{
  pack.description && (
    <EditableText
      type="package"
      id={pack.id}
      field="description"
      as="p"
      className="relative z-10 mt-4 text-sm leading-relaxed text-muted-foreground"
    >
      {pack.description}
    </EditableText>
  );
}
```

Replace:

```tsx
<ul className="relative z-10 mt-5 space-y-2">
  {pack.items.map((i) => (
    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
      <span aria-hidden="true" className="text-gold">
        •
      </span>
      {i}
    </li>
  ))}
</ul>
```

with:

```tsx
<ul className="relative z-10 mt-5 space-y-2">
  {pack.items.map((i, idx) => (
    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
      <span aria-hidden="true" className="text-gold">
        •
      </span>
      <EditableText type="package" id={pack.id} field={`items.${idx}`}>
        {i}
      </EditableText>
    </li>
  ))}
</ul>
```

Add the import (if not already added in Step 1 — same file): `import { EditableText } from "@/app/_components/EditableText";`

- [ ] **Step 3: Full verification**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 4: Manual smoke test**

Open a niche page, Rascunho tab. Click a package card's name in the picker grid — confirm inline edit works, and clicking elsewhere on the card now correctly SELECTS the package (opens the detail view) instead of doing nothing, since the whole-card Editable no longer intercepts it. In the detail view, edit name, price, description, and one item — confirm each is independently editable, and that this is the FIRST time these 4 fields have ever been reachable from `/preview` at all (there was no `Editable` here before this task).

- [ ] **Step 5: Commit**

```bash
git add "src/app/ensaios/[slug]/_components/PackagePicker.tsx"
git commit -m "$(cat <<'EOF'
feat: make package name/price/description/items inline-editable

Card view: name/price replace the whole-card Editable (selecting a
package works again in preview). Detail view: all 4 fields are
reachable from /preview for the first time — nothing wrapped them
before.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Instrument profile fields (app-photo)

**Files:**

- Modify: `app-photo/src/app/_components/About.tsx`

**Interfaces:**

- Consumes: `<EditableText>` (Task 5).

- [ ] **Step 1: `capaCaption` — nested inside the existing placement `Editable`, unaffected**

Replace:

```tsx
<figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold">
  {profile.capaCaption}
</figcaption>
```

with:

```tsx
<figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold">
  <EditableText type="profile" id="main" field="capaCaption">
    {profile.capaCaption}
  </EditableText>
</figcaption>
```

(the surrounding `<Editable type="placement" id={family[0].placementId}>` stays completely untouched — this is the nesting case the spec documented)

- [ ] **Step 2: First `profile`-type block (profissao) — remove the whole-block `Editable`**

Remove the `<Editable type="profile" id="main">...</Editable>` wrapper around this block (unwrap its children one level up — the inner `<div className="relative overflow-hidden border-l-2 border-gold p-6 pl-5">...</div>` stays, just no longer inside `Editable`).

Replace:

```tsx
<h3 className="display-xl relative text-3xl text-foreground">{profile.profissao.titulo}</h3>
```

with:

```tsx
<EditableText
  type="profile"
  id="main"
  field="profissao.titulo"
  as="h3"
  className="display-xl relative text-3xl text-foreground"
>
  {profile.profissao.titulo}
</EditableText>
```

Replace:

```tsx
<p className="font-condensed relative mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-gold">
  {profile.profissao.eyebrow}
</p>
```

with:

```tsx
<EditableText
  type="profile"
  id="main"
  field="profissao.eyebrow"
  as="p"
  className="font-condensed relative mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-gold"
>
  {profile.profissao.eyebrow}
</EditableText>
```

Replace:

```tsx
{
  profile.profissao.paragrafos.map((paragrafo, i) => (
    <p key={i} className="relative mt-3 text-sm leading-relaxed text-foreground">
      {paragrafo}
    </p>
  ));
}
```

with:

```tsx
{
  profile.profissao.paragrafos.map((paragrafo, i) => (
    <EditableText
      key={i}
      type="profile"
      id="main"
      field={`profissao.paragrafos.${i}`}
      as="p"
      className="relative mt-3 text-sm leading-relaxed text-foreground"
    >
      {paragrafo}
    </EditableText>
  ));
}
```

- [ ] **Step 3: Second `profile`-type block (familia) — remove the whole-block `Editable`**

Remove the SECOND `<Editable type="profile" id="main">...</Editable>` wrapper (further down the page) the same way.

Replace:

```tsx
<h3 className="display-xl relative text-3xl text-foreground">{profile.familia.titulo}</h3>
```

with:

```tsx
<EditableText
  type="profile"
  id="main"
  field="familia.titulo"
  as="h3"
  className="display-xl relative text-3xl text-foreground"
>
  {profile.familia.titulo}
</EditableText>
```

Replace:

```tsx
{
  profile.familia.paragrafos.map((paragrafo, i) => (
    <p key={i} className="relative mt-3 text-sm leading-relaxed text-foreground">
      {paragrafo}
    </p>
  ));
}
```

with:

```tsx
{
  profile.familia.paragrafos.map((paragrafo, i) => (
    <EditableText
      key={i}
      type="profile"
      id="main"
      field={`familia.paragrafos.${i}`}
      as="p"
      className="relative mt-3 text-sm leading-relaxed text-foreground"
    >
      {paragrafo}
    </EditableText>
  ));
}
```

- [ ] **Step 4: `familia.legendaFoto` — nested inside the existing placement `Editable`, unaffected**

Replace:

```tsx
<figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
  {profile.familia.legendaFoto}
</figcaption>
```

with:

```tsx
<figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
  <EditableText type="profile" id="main" field="familia.legendaFoto">
    {profile.familia.legendaFoto}
  </EditableText>
</figcaption>
```

(the surrounding `<Editable type="placement" id={family[2].placementId}>` stays completely untouched)

Add the import (once, at the top of the file): `import { EditableText } from "./EditableText";` (this file already imports `Editable` from `"./Editable"` — same directory, matching that convention)

- [ ] **Step 5: Full verification**

Run: `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
Expected: all PASS

- [ ] **Step 6: Manual smoke test**

Open the home page, Rascunho tab, scroll to "Quem sou". Edit `capaCaption` (the caption under the cover photo) — confirm this is the FIRST time it's been reachable via preview (previously only the photo next to it could be swapped). Edit `profissao.titulo`, `.eyebrow`, and one paragraph independently. Edit `familia.titulo` and one paragraph. Edit `familia.legendaFoto` (caption under the altar photo) — same "first time reachable" check as capaCaption. Confirm each edit lands correctly in `profile_draft/main` in the Firestore emulator UI, at the right nested path, without disturbing sibling fields.

- [ ] **Step 7: Commit**

```bash
git add src/app/_components/About.tsx
git commit -m "$(cat <<'EOF'
feat: make profile fields inline-editable

capaCaption and familia.legendaFoto are reachable from /preview for
the first time — they used to live only inside a placement Editable
(the photo next to them), with no path to edit the text itself.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification (both repos)

- [ ] Run `cd admin-photo && npm run typecheck && npm run lint && npm test && npm run build`
- [ ] Run `cd app-photo && npm run typecheck && npm run lint && npm test && npm run build`
- [ ] Full manual smoke test end-to-end on the Rascunho tab: edit at least one field from each of the 10 render locations covered by this plan (niche ×3 locations, niche detail ×3 fields, package ×2 locations, profile ×6 fields). Confirm none of them show on the Live tab until Publicar is clicked (reusing the already-implemented rascunho/publicar feature — no new behavior here, just confirming the two features compose correctly). Confirm cancelling an edit (Escape, or the ✗ icon) never writes anything — check the emulator UI shows no change for that specific field after a cancel.
