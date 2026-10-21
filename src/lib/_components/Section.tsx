import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  index,
  action,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  index?: string;
  // Slot opcional pra um elemento (ex.: o "+" de Addable) alinhado à
  // direita do título, em vez de solto no fim da seção.
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative px-5 py-10">
      <div className="mx-auto w-full max-w-3xl">
        {(eyebrow || title || index) && (
          <header className="mb-5">
            <div className="flex items-center gap-3">
              {index && <span className="section-index">{index}</span>}
              <span className="rose-rule flex-1" />
            </div>
            {eyebrow && (
              <p className="font-condensed mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            {title && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <h2 className="display-xl text-[2.6rem] text-foreground sm:text-6xl">{title}</h2>
                {action}
              </div>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
