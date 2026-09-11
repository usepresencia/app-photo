"use client";

import type { EntityType } from "./entityType";

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
  type: Exclude<EntityType, "placement" | "testimonial">;
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
