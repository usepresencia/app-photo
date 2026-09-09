# admin-photo — Scaffold + Autenticação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o repositório `admin-photo` (novo, sibling de `app-photo`) com
login funcionando ponta a ponta, deploy configurado, e a ponte de
invalidação de cache com `app-photo` — **sem nenhuma entidade de conteúdo
ainda** (nicho/pacote/foto/profile ficam pros planos 7-10). No fim deste
plano: um admin vazio, mas logável, testável e deployável.

**Architecture:** Bootstrap por cópia de `Presencia/web-admin-console`
(mesmo padrão de camadas, toolchain, Docker, CI já validado em produção),
removendo tudo específico do Presencia (entidades, papéis/`platformRole`,
handoff SSO com app irmão). Autenticação **sem SDK client do Firebase** —
investigação real dos repos-irmãos (`Presencia`, `iosana-oliv`) mostrou que
nenhum dos dois tem página de login própria; os dois recebem token via
handoff de um app público irmão que `admin-photo` não tem. Login genuíno
via API REST do Identity Toolkit, chamada do servidor (Server Action),
sessão via `createSessionCookie` (14 dias) — ver spec, seções
"Autenticação" e "Invalidação de cache entre repositórios".

**Tech Stack:** Next.js `^15.0.0`, React `^18.3.1` (mesma versão do
Presencia — não atualiza pra React 19 neste plano, escopo é só scaffold),
Tailwind v4 + shadcn/ui (`components.json` copiado do Presencia),
`firebase-admin` (sem pacote `firebase` client), Vitest, ESLint 9 flat
config, ambos copiados do Presencia.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-servicos-fotos-design.md`
(seções "Dois repositórios", "Autenticação", "Invalidação de cache entre
repositórios", "Deploy")
**Precedente investigado:** `Presencia/web-admin-console` (bootstrap,
auth, camadas, deploy), `iosana-oliv` (padrão de sessão de 14 dias via
`createSessionCookie`, exclusão do healthcheck do middleware)

## Global Constraints

- **Repositório:** `/Users/cesarpisa/Projects/lp-fotografia/admin-photo` —
  não existe ainda, só local (sem remoto no GitHub por enquanto).
- **Sem SDK client do Firebase** — só `firebase-admin`. Sign-in via API
  REST do Identity Toolkit (`accounts:signInWithPassword`), chamada do
  servidor.
- **Sem papéis** — `assertSession()` só verifica "está autenticado", sem
  lista de roles (diferente do `platformRole` do Presencia).
- **Sem nenhuma entidade de conteúdo neste plano** — `niche`/`package`/
  `photo`/`placement`/`profile` ficam pros planos 7-10.
- `/v1/health` fica fora do matcher do middleware desde o início — o
  Presencia parece ter um bug latente aqui (rota de saúde sujeita à
  checagem de sessão); segue o padrão mais seguro do `iosana-oliv`.
- Porta de dev diferente da do `app-photo` (ambos default 3000) — `admin-
photo` roda em `3001` pra rodar os dois ao mesmo tempo localmente.
- `react-hook-form`/`@hookform/resolvers`/`zod` (formulário) **não entram**
  como dependência — o Presencia declara mas nunca usa (confirmado via
  grep); este plano usa `<form action={...}>` nativo do Next + validação
  manual, sem lib nenhuma pro único formulário que existe agora (login).

---

## Mapa de arquivos

**Criar (em `admin-photo`, cópia + adaptação de `Presencia/web-admin-console`):**

- Todo o scaffold de tooling (`package.json`, `tsconfig.json`,
  `eslint.config.js`, `.prettierrc`, `commitlint.config.cjs`,
  `vitest.config.ts`, `components.json`, `next.config.ts`,
  `.husky/pre-commit`, `Dockerfile`, `firebase.json`, `.firebaserc`,
  `firestore.indexes.json`)
- `src/lib/config/env.server.ts`, `env.client.ts`
- `src/api/infrastructure/firebase/admin.ts` (bootstrap do Admin SDK)
- `src/lib/auth/session.ts` (`getSession`/`assertSession`, sem papéis)
- `src/middleware.ts`
- `src/app/login/page.tsx`, `src/app/login/actions.ts`,
  `src/app/login/_components/SubmitButton.tsx`
- `src/app/api/logout/route.ts`
- `src/app/v1/health/route.ts`
- `src/app/page.tsx` (placeholder autenticado)
- `src/lib/_components/ui/*` (shadcn, copiado igual)
- `scripts/seed-admin.ts`
- `.github/workflows/CI.yml`, `.github/workflows/CD.yml`
- `.env.example`

**Modificar (em `app-photo`):**

- `src/lib/config/env.server.ts` — adiciona `REVALIDATE_SECRET`
- `src/app/api/revalidate/route.ts` (novo)

**Não copiar do Presencia:** `src/app/sso-callback/`, `src/app/(admin)/*`
(coupons/tenants/users/articles/ouvidoria — todas as rotas de entidade),
`src/actions/*.ts` (todas as actions de entidade), `src/api/domain/*`,
`src/api/application/*`, `src/api/presentation/*` (todo conteúdo —
mantém só as pastas vazias ou nem isso), `scripts/seed-dev-user.ts`
(referencia `admin_users` do Presencia — recriado do zero quando o
plano 7 precisar de mock), `CHANGELOG.md`, `.worktrees/`.

---

### Task 1: Bootstrap do repositório

**Files:** ver "Mapa de arquivos" — cópia de `Presencia/web-admin-console`
seguida de remoção do que é específico dele.

**Interfaces:**

- Produces: repositório `admin-photo` compilando (`npm run typecheck`),
  lintando (`npx eslint .`) e buildando (`npm run build`) limpo, sem
  nenhum código do domínio do Presencia.

- [ ] **Step 1: Copiar a estrutura**

```bash
mkdir -p /Users/cesarpisa/Projects/lp-fotografia/admin-photo
cd /Users/cesarpisa/Projects/Presencia/web-admin-console
rsync -a --exclude='.git' --exclude='.worktrees' --exclude='node_modules' \
  --exclude='.next' --exclude='tsconfig.tsbuildinfo' \
  --exclude='firestore-debug.log' --exclude='CHANGELOG.md' \
  --exclude='package-lock.json' --exclude='.env' --exclude='.env.local' \
  ./ /Users/cesarpisa/Projects/lp-fotografia/admin-photo/
cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo
git init
```

- [ ] **Step 2: Remover o que é específico do domínio do Presencia**

```bash
rm -rf src/app/sso-callback
rm -rf "src/app/(admin)"
rm -rf src/actions
rm -rf src/api/domain src/api/application src/api/presentation
rm -f scripts/seed-dev-user.ts
rm -f src/app/api/auth/callback/route.ts
```

Renomeia o bootstrap do Admin SDK pra bater com a convenção do
`app-photo` (lá é `firebase/admin.ts`; no Presencia, copiado, é
`firebase/firebaseAdmin.ts`):

```bash
# mv simples, não git mv — nada foi commitado ainda neste repo (só
# git init no Step 1), git mv falharia ("not under version control").
mv src/api/infrastructure/firebase/firebaseAdmin.ts src/api/infrastructure/firebase/admin.ts
grep -rl "firebaseAdmin" src | xargs sed -i '' 's#firebase/firebaseAdmin#firebase/admin#g'
```

Em `src/api/infrastructure/repositories/`, apaga tudo exceto
`RepositoryFactory.ts`:

```bash
find src/api/infrastructure/repositories -mindepth 1 -maxdepth 1 ! -name "RepositoryFactory.ts" -exec rm -rf {} +
```

Esvazia `RepositoryFactory.ts` pro mínimo:

```ts
// src/api/infrastructure/repositories/RepositoryFactory.ts
// Fábrica de repositórios — ganha entidades reais nos planos 7-10. Vazia
// de propósito: nenhuma entidade de conteúdo existe ainda neste plano.
export const RepositoryFactory = {};
```

- [ ] **Step 3: Adaptar `package.json`**

Troca o `name`/`version`/`description` pro novo projeto; remove
`react-hook-form`, `@hookform/resolvers`, `recharts`, `embla-carousel-
react`, `cmdk`, `input-otp`, `react-day-picker`, `react-resizable-panels`,
`vaul`, `framer-motion` (nenhum usado ainda — mais fácil readicionar
quando algo realmente precisar do que carregar dependência morta desde
o commit inicial). Mantém o resto (Radix, `class-variance-authority`,
`clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `zod`, `firebase-
admin`, toda a toolchain de dev). Adiciona ao `scripts`:

```json
"dev": "next dev -p 3001",
```

(troca o `dev` que rodava `scripts/dev-with-seed.sh` — sem
`seed-dev-user.ts`/emulador neste plano, `next dev` direto; porta 3001
pra rodar ao lado do `app-photo`, que usa 3000.)

Remove os scripts `dev:next`, `seed:dev-user`.

- [ ] **Step 4: Instalar dependências**

Run: `npm install`
Expected: `package-lock.json` gerado, sem erros.

- [ ] **Step 5: Rodar o typecheck e seguir os erros até compilar limpo**

Run: `npm run typecheck`
Expected: FAIL — vários imports quebrados apontando pro que foi apagado
no Step 2 (ex.: `RepositoryFactory` de algum arquivo específico de
entidade que sobrou, referências a `platformRole` em arquivos que não
foram tocados ainda). Corrige cada erro removendo o arquivo/import
órfão (não criando stub) até o typecheck passar limpo. Isso é
verificação mais confiável do que tentar listar de antemão todo arquivo
do Presencia que referencia uma entidade — o compilador acha o que
sobrou.

Run de novo até: `npm run typecheck` → sem erros.

- [ ] **Step 6: Simplificar `env.server.ts`/`env.client.ts` copiados**

O `env.server.ts` do Presencia valida `WEB_PRESENCIA_URL`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` e tem um `.refine()`
checando `DEV_AUTH_BYPASS` — nada disso existe mais neste plano (SSO
com app irmão removido; Cloudinary só entra no plano 9;
`platformRole`/dev bypass removidos junto com os papéis). Typecheck não
acusa campos de schema não usados, então isso não aparece no Step 5 —
precisa remover à mão. Deixa o schema só com:

```ts
FIREBASE_PROJECT_ID: z.string().min(1),
FIREBASE_CLIENT_EMAIL: z.string().email(),
FIREBASE_PRIVATE_KEY: z.string().min(1),
FIREBASE_WEB_API_KEY: z.string().min(1),
```

(Todas obrigatórias, sem `.optional()` — diferente do `app-photo`, que
tem fallback mock; aqui não há modo mock ainda, o app não sobe sem
credenciais reais.) Em `env.client.ts`, remove
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`/`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
(voltam no plano 9) — sobra só `NEXT_PUBLIC_APP_VERSION`.

- [ ] **Step 7: `.env.example`**

Create `.env.example`:

```
# Credenciais de uma service account do Firebase (Admin SDK — sem SDK
# client neste projeto). Sem elas, o app não sobe (não há modo mock
# ainda; entra no plano 7 com a primeira entidade).
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Chave pública de identificação do projeto Firebase (não secreta) —
# usada pra sign-in e redefinição de senha via API REST do Identity
# Toolkit, sem SDK client. Ver src/app/login/actions.ts.
FIREBASE_WEB_API_KEY=
```

(`REVALIDATE_SECRET`/`APP_PHOTO_URL` — necessários pro admin chamar o
webhook do `app-photo` — entram só no plano que primeiro grava alguma
entidade de verdade, plano 7; documentar aqui uma variável que nada
neste plano lê ainda só criaria uma promessa vazia.)

- [ ] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run test && npm run build`
Expected: sem erros. `npm run test` passa vazio (0 testes) ou só com o
que sobrou de teste genérico — sem entidade ainda, não deveria sobrar
teste nenhum quebrado.

- [ ] **Step 9: Commit inicial**

```bash
git add -A
git commit -m "chore: bootstrap do repositório (cópia de Presencia/web-admin-console)

Estrutura de camadas, toolchain, Docker e CI copiados do repositório
irmão mais próximo — sem nenhuma entidade de conteúdo do Presencia
(coupon/tenant/user/articles removidos). react-hook-form/zod-resolver e
libs de UI não usadas (recharts, embla, cmdk, etc.) removidas do
package.json — nenhuma tinha uso real lá, confirmado por grep antes de
copiar."
```

---

### Task 2: Autenticação — login sem SDK client

**Files:**

- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`,
  `src/app/login/_components/SubmitButton.tsx`
- Modify: `src/middleware.ts`
- Modify: `src/lib/auth/session.ts`
- Modify: `src/app/api/logout/route.ts`
- Create: `scripts/seed-admin.ts`

**Interfaces:**

- Consumes: `FIREBASE_WEB_API_KEY` (já no schema de `env.server.ts`
  desde a Task 1, Step 6).
- Produces: `getSession(): Promise<{uid, email} | null>`,
  `assertSession(): Promise<{uid, email}>` (lança `UNAUTHORIZED` se não
  autenticado — sem parâmetro de papéis).

Não há rota `app/api/auth/session` separada — a criação do cookie de
sessão acontece dentro da própria Server Action de login (Step 2 abaixo).
Não há handoff de token entre domínios aqui, diferente do Presencia/
iosana-oliv (que recebem o token de um app externo via HTTP): o
`idToken` nasce e morre dentro da mesma Server Action.

- [ ] **Step 1: `getSession`/`assertSession`, sem papéis**

Replace `src/lib/auth/session.ts`:

```ts
import { cookies } from "next/headers";
import { getAdminAuth } from "@/api/infrastructure/firebase/admin";

export const COOKIE_NAME = "session";

export interface SessionPayload {
  uid: string;
  email: string | undefined;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

// Sem parâmetro de papéis — spec decidiu "mesmo acesso, sem papéis"
// (diferente do platformRole do Presencia). Só verifica autenticação.
export async function assertSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
```

(`getAdminAuth()` já existe em `src/api/infrastructure/firebase/admin.ts`
— confirmado no arquivo real do Presencia antes de escrever este plano,
`export function getAdminAuth() { return getAuth(getAdminApp()); }`,
copiado junto no Task 1.)

- [ ] **Step 2: Server Action de login — REST sign-in + cria o cookie**

Create `src/app/login/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { getAdminAuth } from "@/api/infrastructure/firebase/admin";
import { env } from "@/lib/config/env.server";
import { COOKIE_NAME } from "@/lib/auth/session";
import { cookies } from "next/headers";

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias

interface SignInResponse {
  idToken: string;
}

interface SignInError {
  error: { message: string };
}

export async function login(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "Preencha email e senha.";

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  if (!res.ok) {
    const body = (await res.json()) as SignInError;
    // A API do Identity Toolkit devolve códigos como EMAIL_NOT_FOUND,
    // INVALID_PASSWORD, INVALID_LOGIN_CREDENTIALS — nenhum detalhe
    // interno vaza pro usuário, só essa mensagem genérica.
    void body;
    return "Email ou senha inválidos.";
  }

  const { idToken } = (await res.json()) as SignInResponse;

  // idToken nunca chega ao browser — vira cookie de sessão aqui mesmo,
  // no servidor, e é descartado.
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  redirect("/");
}
```

- [ ] **Step 3: Página de login**

`useActionState` (React 19) não existe em `^18.3.1`, a versão copiada do
Presencia (confirmado: `grep -rn "useActionState" src` no Presencia não
acha nada — eles nem usam esse padrão). Equivalente em React 18:
`useFormState` (de `react-dom`) devolve `[state, formAction]`, sem o
terceiro elemento `isPending` — esse vem de `useFormStatus()`, chamado
dentro de um componente filho do `<form>` (não no mesmo componente que
declara o form; é assim que o hook descobre "estou dentro de um form
pendente").

Create `src/app/login/_components/SubmitButton.tsx`:

```tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}
```

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { useFormState } from "react-dom";
import { login } from "./actions";
import { SubmitButton } from "./_components/SubmitButton";

export default function LoginPage() {
  const [error, formAction] = useFormState(login, null);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Senha"
          required
          className="w-full rounded-md border px-3 py-2"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <SubmitButton />
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Middleware — sem `/v1/health` no matcher, sem checagem de papel**

Replace `src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "session";
const PUBLIC_PATHS = ["/login", "/api/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(req.cookies.get(COOKIE_NAME)?.value);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  if (!hasSessionCookie(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

// /v1/health fica de fora do matcher (não só de PUBLIC_PATHS) — o
// Presencia parece ter um bug latente aqui: a rota de saúde não está
// isenta, então o healthcheck do deploy provavelmente recebe redirect
// em vez de 200. Ver spec, seção Autenticação.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|v1/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

(Checagem estrutural do JWT removida de propósito — o middleware do
Presencia fazia `value.split(".").length === 3` antes da verificação
real; aqui `hasSessionCookie` só confirma que o cookie existe, e
`assertSession()`/`getSession()` fazem a verificação criptográfica real
via `verifySessionCookie` em cada Server Action/Server Component. Um
cookie malformado passa pelo middleware mas falha em `getSession()` —
mesmo resultado final, um passo a menos.)

- [ ] **Step 5: Rota de logout**

Replace `src/app/api/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.redirect(new URL("/login", request.url));
}
```

- [ ] **Step 6: Página inicial autenticada (placeholder)**

Create `src/app/page.tsx`:

```tsx
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">
        Bem-vindo{session?.email ? `, ${session.email}` : ""}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Nenhuma entidade de conteúdo ainda — nicho, pacote, foto e profile chegam nos próximos
        planos.
      </p>
      <a href="/api/logout" className="mt-4 inline-block underline">
        Sair
      </a>
    </main>
  );
}
```

- [ ] **Step 7: Script de seed do primeiro usuário**

Create `scripts/seed-admin.ts`:

```ts
/**
 * Cria o primeiro usuário admin e manda email de redefinição de senha.
 * Sem autocadastro — este script é o único jeito de criar um usuário.
 *
 * Uso:
 *   ADMIN_NAME="Denise Galvão" ADMIN_EMAIL="denise@denisegalvao.com.br" \
 *     npm run seed:admin
 *
 * Lê .env (não .env.local) de propósito — evita mirar produção sem
 * querer com um override local.
 */
process.loadEnvFile(".env");

import { getAdminAuth } from "../src/api/infrastructure/firebase/admin";

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const webApiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!name || !email || !webApiKey) {
    console.error("Faltam ADMIN_NAME, ADMIN_EMAIL ou FIREBASE_WEB_API_KEY.");
    process.exit(1);
  }

  const auth = getAdminAuth();
  const user = await auth.getUserByEmail(email).catch(() => null);
  const uid = user ? user.uid : (await auth.createUser({ email, displayName: name })).uid;
  console.log(`Usuário ${uid} (${email}) ${user ? "já existia" : "criado"}.`);

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${webApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    },
  );
  if (!res.ok) {
    console.error("Falha ao mandar email de redefinição de senha:", await res.text());
    process.exit(1);
  }
  console.log(`Email de redefinição de senha enviado pra ${email}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Adiciona ao `package.json`:

```json
"seed:admin": "tsx scripts/seed-admin.ts",
```

- [ ] **Step 8: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: sem erros.

- [ ] **Step 9: Smoke test manual (precisa de credenciais reais do Firebase)**

Documentar aqui, não executar sem credenciais:

1. Rodar `ADMIN_NAME="Teste" ADMIN_EMAIL="seu-email@..." npm run seed:admin`
   com `.env` preenchido.
2. Abrir o email de redefinição de senha, definir uma senha.
3. `npm run dev`, abrir `http://localhost:3001/login`, entrar com
   email/senha.
4. Confirmar redirecionamento pra `/`, cookie `session` presente
   (httpOnly, `SameSite=Strict`).
5. Abrir `/api/logout`, confirmar redirecionamento pra `/login` e que
   acessar `/` de novo redireciona pra `/login` (sessão removida).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(auth): login sem SDK client — REST sign-in + createSessionCookie

Sign-in via API REST do Identity Toolkit, chamada do servidor
(Server Action) — o idToken nunca chega ao browser. Sessão de 14 dias
via createSessionCookie, não o ID token cru. assertSession() sem
parâmetro de papéis — spec decidiu acesso único, sem platformRole.
/v1/health fica fora do matcher do middleware desde o início."
```

---

### Task 3: Healthcheck, Dockerfile e CD

**Files:**

- Create: `src/app/v1/health/route.ts`
- Modify: `Dockerfile` (ajustar `ARG`/`ENV` de build — este projeto não
  tem `NEXT_PUBLIC_CLOUDINARY_*` ainda, Cloudinary só entra no plano 9)
- Modify: `.github/workflows/CD.yml` (nome do serviço, domínio)

**Interfaces:**

- Produces: `GET /v1/health` → `200 {status: "ok", timestamp}`, sem
  passar pelo middleware de sessão.

- [ ] **Step 1: Healthcheck**

Create `src/app/v1/health/route.ts`:

```ts
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

- [ ] **Step 2: Ajustar o `Dockerfile` copiado**

No `Dockerfile` copiado do Presencia (Task 1), remove os `ARG`/`ENV` de
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`/`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
do stage de build — nenhuma `NEXT_PUBLIC_*` existe ainda neste plano (o
build não precisa de nenhum `--build-arg`). Mantém `SKIP_ENV_VALIDATION=1`
no `RUN npm run build` (evita exigir credenciais reais durante o build
da imagem — mesmo padrão do `app-photo`).

- [ ] **Step 3: Ajustar o workflow de CD**

No `CD.yml` copiado, troca `SERVICE="web-admin-console"` por
`SERVICE="admin-photo"`, e o domínio do healthcheck
(`$ADMIN_DOMAIN` → `admin.denisegalvao.com.br`, a variável de secret
correspondente). Documentar aqui, não executar: a VPS compartilhada
precisa do serviço `admin-photo` adicionado ao `docker-compose.yml`
dela (fora deste repositório) antes do primeiro deploy — quem tem
acesso SSH faz isso manualmente uma vez.

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(deploy): healthcheck fora do middleware + Dockerfile/CD adaptados

/v1/health não passa pela checagem de sessão — precondição pro
healthcheck do deploy funcionar (ver Task 2). Dockerfile sem os
build args de Cloudinary (não existe nada de fotos ainda, plano 9).
CD.yml aponta pro serviço/domínio certos — deploy real depende de
alguém com acesso SSH adicionar o serviço no compose da VPS."
```

---

### Task 4: Webhook de invalidação de cache (no `app-photo`)

**Files:**

- Modify: `src/lib/config/env.server.ts` (`app-photo`)
- Create: `src/app/api/revalidate/route.ts` (`app-photo`)

**Interfaces:**

- Produces: `POST /api/revalidate` (`app-photo`) — `{tag: string}`,
  autenticado por `Authorization: Bearer <REVALIDATE_SECRET>`, chama
  `revalidateTag(tag)`.

- [ ] **Step 1: `REVALIDATE_SECRET` no schema de env do `app-photo`**

Em `app-photo/src/lib/config/env.server.ts`, adiciona:

```ts
  // Segredo compartilhado com o admin-photo — autentica POST
  // /api/revalidate. Opcional aqui pela mesma razão do Cloudinary: sem
  // admin ainda rodando contra este ambiente, não há quem chamar essa
  // rota, então validação não pode bloquear dev/test/CI.
  REVALIDATE_SECRET: z.string().min(1).optional(),
```

- [ ] **Step 2: Escrever o teste da rota primeiro**

Create `app-photo/src/app/api/revalidate/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

describe("POST /api/revalidate", () => {
  it("recusa sem Authorization válido", async () => {
    process.env.REVALIDATE_SECRET = "segredo";
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { Authorization: "Bearer errado" },
      body: JSON.stringify({ tag: "niches" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("chama revalidateTag com o Authorization certo", async () => {
    process.env.REVALIDATE_SECRET = "segredo";
    const { revalidateTag } = await import("next/cache");
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { Authorization: "Bearer segredo", "Content-Type": "application/json" },
      body: JSON.stringify({ tag: "niches" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("niches");
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/app/api/revalidate/route.test.ts`
Expected: FAIL — rota não existe.

- [ ] **Step 4: Implementar a rota**

Create `app-photo/src/app/api/revalidate/route.ts`:

```ts
import { revalidateTag } from "next/cache";
import { env } from "@/lib/config/env.server";

export async function POST(request: Request): Promise<Response> {
  const auth = request.headers.get("Authorization");
  if (!env.REVALIDATE_SECRET || auth !== `Bearer ${env.REVALIDATE_SECRET}`) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tag?: string } | null;
  if (!body?.tag) {
    return Response.json({ error: "MISSING_TAG" }, { status: 400 });
  }

  revalidateTag(body.tag);
  return Response.json({ revalidated: true, tag: body.tag });
}
```

- [ ] **Step 5: Rodar o teste de novo**

Run: `npx vitest run src/app/api/revalidate/route.test.ts`
Expected: PASS — 2 testes.

- [ ] **Step 6: Rodar a suíte inteira do `app-photo`**

Run: `npm run typecheck && npx eslint . && npm run test && npm run build`
Expected: sem erros.

**Nota de escopo:** este plano só cria a rota que RECEBE a invalidação.
As leituras públicas (`RepositoryFactory`/`Get*UseCase` de niche/package/
photo/profile) ainda não declaram tags (`next: { tags: [...] }`) — sem
isso, `revalidateTag` não tem o que invalidar. Isso é trabalho dos
planos 7-10 (cada plano de entidade do admin adiciona a tag
correspondente na leitura pública equivalente, junto com o CRUD).

- [ ] **Step 7: Commit (no `app-photo`)**

```bash
git add -A
git commit -m "feat(revalidate): rota de invalidação de cache pro admin-photo

POST /api/revalidate, autenticado por segredo compartilhado
(REVALIDATE_SECRET) — o admin-photo chama depois de cada escrita.
Best-effort: falha aqui não desfaz a escrita no Firestore, só deixa o
cache do site desatualizado até expirar. As leituras públicas ainda não
declaram tags — isso entra junto com o CRUD de cada entidade, planos
7-10."
```

---

### Task 5: Regressão final

**Files:** nenhum novo — só verificação.

- [ ] **Step 1: Suíte completa em `admin-photo`**

Run: `cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo && npm run typecheck && npx eslint . && npm run test && npm run build`
Expected: sem erros.

- [ ] **Step 2: Suíte completa em `app-photo`**

Run: `cd /Users/cesarpisa/Projects/lp-fotografia/app-photo && npm run typecheck && npx eslint . && npm run test && npm run build`
Expected: sem erros — confirma que a Task 4 não quebrou nada existente.

- [ ] **Step 3: Rodar os dois ao mesmo tempo, localmente**

Run: `(cd admin-photo && npm run dev &) && (cd app-photo && npm run dev &)`
Expected: `app-photo` em `:3000`, `admin-photo` em `:3001`, sem conflito
de porta. `curl http://localhost:3001/v1/health` devolve 200 sem
precisar de cookie de sessão. `curl http://localhost:3001/` (sem
cookie) redireciona pra `/login`.

- [ ] **Step 4: Commit final (se sobrou algo solto) em cada repo**

```bash
cd /Users/cesarpisa/Projects/lp-fotografia/admin-photo && git status --short
cd /Users/cesarpisa/Projects/lp-fotografia/app-photo && git status --short
# se houver pendências em qualquer um, git add -A && git commit -m "..."
# app-photo: git push (admin-photo não tem remoto ainda, per decisão do usuário)
```

---

## Depois deste plano

`admin-photo` existe, loga, faz logout, tem healthcheck, Dockerfile e CD
prontos (deploy real pendente de configurar o serviço na VPS), e
`app-photo` já aceita a chamada de invalidação de cache. Falta:

- **Plano 7** — CRUD de `niche` no admin (domain/application/
  infrastructure/presentation completos, formulário de criar/editar,
  lista, delete) + a leitura pública equivalente em `app-photo` ganha a
  tag `"niches"`.
- **Plano 8** — CRUD de `package` (filho de `niche`).
- **Plano 9** — Upload de foto + gerenciamento de `Placement` (a peça
  mais nova, sem precedente direto — spec já avisa: vale prototipar a
  query antes do CRUD completo) + integração Cloudinary (upload
  unsigned do browser, delete assinado, `next-image-loader.ts`).
- **Plano 10** — CRUD de `profile` (singleton, só `get`/`update`, sem
  lista — primeira tela do admin sem grade nenhuma) + deploy real (rodar
  o serviço na VPS pela primeira vez, validar o healthcheck em
  produção).
