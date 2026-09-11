"use client";

import type { EntityType } from "./entityType";

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
  type: EntityType;
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
