import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  index,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  index?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative px-5 py-10">
      <div className="mx-auto w-full max-w-3xl">
        {(eyebrow || title) && (
          <header className="mb-5">
            <div className="flex items-center gap-3">
              {index && <span className="section-index">{index}</span>}
              <span className="gold-rule flex-1" />
            </div>
            {eyebrow && (
              <p className="font-condensed mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="display-xl mt-2 text-[2.6rem] text-foreground sm:text-6xl">{title}</h2>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
