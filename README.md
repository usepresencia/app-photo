# Denise Galvão — Fotografia

Landing page de Denise Galvão, fotógrafa de ensaios e eventos (Toledo, Paraná). Next.js (App Router) + Tailwind CSS v4.

## Desenvolvimento

```sh
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — serve o build de produção
- `npm run lint` — ESLint
- `npm run typecheck` — checagem de tipos
- `npm run test` — testes (Vitest)
- `npm run optimize-photos` — processa as fotos originais de `../data` e gera `public/fotos/` + `src/actions/_mock/photos.json` (rodar manualmente ao trocar fotos; o resultado fica versionado no repositório)
