# src/api

Espelho vazio de `src/actions`. Nesta fase (refatoração visual, sem backend), cada
função em `src/actions/*.ts` resolve diretamente de `src/actions/_mock/`.

Quando o backend existir, cada action passa a chamar uma função homônima aqui
(ex.: `actions/niches.ts` chamando `api/niches.ts`), sem alterar a assinatura
pública nem os componentes que já consomem as actions.
