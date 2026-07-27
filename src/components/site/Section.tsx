import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border px-5 py-16">
      <div className="mx-auto w-full max-w-3xl">
        {(eyebrow || title) && (
          <header className="mb-8 text-center">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && (
              <h2 className="font-display mt-3 text-3xl leading-tight text-foreground sm:text-4xl">
                {title}
              </h2>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
