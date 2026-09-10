"use client";

// Classe compartilhada pela pill "Adicionar..." usada ao lado do título
// de uma seção (Gallery.tsx, Niches.tsx, NicheGallery.tsx, NicheHero.tsx)
// — cada chamador só acrescenta o posicionamento próprio (ex.: absolute
// right-5 top-6 em NicheHero, que não fica dentro do slot action de
// Section).
export const ADD_PILL_CLASSNAME =
  "font-condensed flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[0.65rem] font-semibold uppercase tracking-[0.2em]";

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
  type: "niche" | "package" | "placement" | "testimonials";
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
