import { unstable_cache } from "next/cache";

// Fábrica pro par (leitura live cacheada / leitura rascunho sem cache) que
// todo *RepositoryImpl repete: cachear `liveFn` com `unstable_cache` (tag +
// key), e no modo rascunho chamar `draftFn` direto, sem cache. Só embrulha
// esse fio condutor comum — a query em si (where/orderBy/mapeamento,
// filtro de tombstone) continua 100% em cada *RepositoryImpl, porque isso
// difere de verdade entre eles (ex.: Profile não tem tombstone, Photo tem
// o short-circuit de lista vazia, Placement tem where condicional).
export function makeReadRepo<TArgs extends unknown[], TResult>(
  cacheKeyParts: string[],
  tags: string[],
  liveFn: (...args: TArgs) => Promise<TResult>,
  draftFn: (...args: TArgs) => Promise<TResult>,
): (isDraft: boolean, ...args: TArgs) => Promise<TResult> {
  const cachedLiveFn = unstable_cache(liveFn, cacheKeyParts, { tags });
  return (isDraft, ...args) => (isDraft ? draftFn(...args) : cachedLiveFn(...args));
}
