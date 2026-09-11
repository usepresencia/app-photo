# App Photo

Site público de **Denise Galvão**, fotógrafa de ensaios e eventos em
Toledo, Paraná. Projeto interno de agência: vitrine institucional com
nichos de ensaio, pacotes, galeria de fotos e formulário de contato via
WhatsApp — todo o conteúdo é gerenciado por um console administrativo
irmão, sem depender de pull request para qualquer atualização.

## Visão geral do produto

O produto é composto por **dois serviços irmãos** que juntos formam o
site de fotografia:

- **`app-photo`** (este repositório) — o site público em si, lido por
  qualquer visitante, sem autenticação.
- **`admin-photo`** — console privado atrás de Firebase Auth, onde a
  fotógrafa edita o conteúdo que este site renderiza.

Todo o conteúdo (nichos, pacotes, fotos, textos, avaliações) vem do
Firestore, gravado pelo `admin-photo` — nada é hardcoded. Leituras
"live" (o que qualquer visitante vê) usam cache com tag, invalidado só
quando o admin publica; o modo "rascunho" (usado apenas dentro do
preview do admin) lê direto, sem cache, pra refletir edições em tempo
real.

## Escopo deste repositório (`app-photo`)

Construído em **Next.js (App Router)** com **Tailwind CSS v4**, sem
autenticação — qualquer rota é pública. Em alto nível, este serviço é
responsável por:

- **Renderização do site institucional**: hero, "Quem sou", nichos de
  ensaio (com página própria por nicho), pacotes, galeria, avaliações
  e contato.
- **Formulário de contato via WhatsApp**: pré-preenche uma mensagem
  com os dados do formulário e abre o WhatsApp da fotógrafa.
- **Edição inline via preview**: quando carregado dentro do iframe do
  `admin-photo` (`/preview`), o componente `PreviewOverlay` ativa
  afordances de clique em qualquer elemento editável, delegando a
  edição de verdade pro admin via `postMessage` — este repositório
  nunca sabe COMO editar, só marca O QUE é editável
  (`Editable`/`Addable`/`EditableText`).
- **SEO**: `sitemap.xml`, `robots.txt` e metadados construídos a
  partir do mesmo conteúdo real do Firestore.

## Arquitetura em alto nível

Mesma arquitetura em camadas do repositório irmão
(`domain` → `application` → `infrastructure`), com um
`RepositoryFactory` assíncrono que decide, por requisição, entre
repositório real e mock, e entre leitura live (cacheada) e rascunho
(sem cache) — via um cookie que só a rota `/api/preview/enter` pode
setar.

### Principais domínios

- **Niche, Package, Photo, Placement, Profile, Testimonial** — cada
  um com seu próprio repositório real e mock, espelhando (mas nunca
  compartilhando código com) o repositório irmão `admin-photo`.
- **Preview com edição inline** — `PreviewOverlay.tsx` é o único
  ponto que fala com o admin via `postMessage`; é deliberadamente
  genérico (não ganha um caso novo por tipo de entidade).

## Tecnologias principais

- **Next.js 15 (App Router)** + **TypeScript**.
- **Tailwind CSS v4**.
- **Firebase Admin SDK** — leitura do Firestore (nunca escreve).
- **Cloudinary** — entrega de imagens (loader customizado, sem o
  otimizador embutido do Next).
- **Vitest** — testes unitários.
- **Docker** — build multi-stage (`output: standalone`), deploy via
  GitHub Actions → GHCR → VPS (Traefik + Docker Compose).

## Posição no ecossistema

Dentro do conjunto de produtos da agência, o `app-photo` é a **vitrine
pública** de um site de fotografia — consumido por qualquer visitante,
e indiretamente controlado pela fotógrafa através do console admin.

- Console admin correspondente: [`admin-photo`](https://github.com/useagendaflow/admin-photo).
- Os dois serviços compartilham o mesmo projeto Firebase e são
  implantados juntos na mesma VPS (`/srv/app-fotografia/`, um só
  `docker-compose.yml`).

## Público-alvo deste documento

Este README é voltado principalmente para desenvolvedores internos que
precisam entender o propósito do site, como o conteúdo chega até ele, e
como o modo preview funciona. Também serve de referência rápida pra
quem for dar suporte à conta da cliente.

## Leituras recomendadas

- `docs/superpowers/` — specs e planos de implementação cobrindo os
  dois repositórios (arquitetura de rascunho/publicação, preview com
  edição inline, migração pro Firestore, avaliações do Google, etc.).
- `src/app/_components/PreviewOverlay.tsx` — ponto de entrada do modo
  preview; qualquer entidade nova editável passa por aqui só no nível
  de tipos, nunca de lógica.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — serve o build de produção
- `npm run lint` — ESLint
- `npm run typecheck` — checagem de tipos
- `npm run test` — testes (Vitest)
- `npm run optimize-photos` — processa as fotos originais de `../data`
  e gera `public/fotos/` + `src/actions/_mock/photos.json` (rodar
  manualmente ao trocar fotos; o resultado fica versionado)

---

_Documento de uso interno._
