import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Sem isso, nenhum teste desmonta o que renderizou (convenção do projeto
// é consultar via `container`, não `screen`, exatamente pra não depender
// de cleanup automático pra as queries) — mas um componente com efeito
// que agenda algo (ex.: useSlideshow com autoplayMs, em NicheHero.tsx)
// continua de pé entre testes. O timer dispara mais tarde, em cima de um
// ambiente jsdom de outro arquivo já destruído, e estoura
// "ReferenceError: window is not defined" como erro não tratado — com
// todos os testes passando, isso ainda derruba o processo com exit 1.
afterEach(() => {
  cleanup();
});
