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
