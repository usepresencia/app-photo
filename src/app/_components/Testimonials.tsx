import { Section } from "@/shared/_components/Section";
import { getTestimonials } from "@/actions/testimonials";

export async function Testimonials() {
  const testimonials = await getTestimonials();
  return (
    <Section id="feedbacks" index="05" eyebrow="Feedbacks de clientes" title="O que dizem por aí">
      <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 pb-12 pt-4">
        {testimonials.map((t) => (
          <blockquote
            key={t.name}
            className="relative flex w-72 shrink-0 flex-col overflow-hidden border border-gold/20 p-6"
            style={{ boxShadow: "var(--shadow-gold)" }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--gold) 12%, transparent) 0 14px, transparent 15px), radial-gradient(circle at 62% 34%, color-mix(in oklab, var(--gold) 8%, transparent) 0 20px, transparent 21px), radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--gold) 10%, transparent) 0 18px, transparent 19px), radial-gradient(circle at 78% 88%, color-mix(in oklab, var(--gold) 8%, transparent) 0 16px, transparent 17px)",
                backgroundSize: "190px 190px",
              }}
            />
            <span
              aria-hidden="true"
              className="font-display relative z-10 block text-4xl leading-none text-gold"
            >
              &ldquo;
            </span>
            <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground">
              {t.text}
            </p>
            <footer className="font-condensed relative z-10 mt-auto pt-4 text-[0.65rem] uppercase tracking-[0.3em] text-gold">
              {t.name}
            </footer>
          </blockquote>
        ))}
      </div>
      <a
        href="https://www.google.com/search?q=denise+galvao+fotografia&sourceid=chrome&source=chrome.ob&ie=UTF-8#lrd=0x94f395332f295643:0xf7bfc7c474976814,3,,,,"
        target="_blank"
        rel="noreferrer"
        className="relative mx-auto mt-6 block w-fit overflow-hidden px-6 py-3 text-center"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
          style={{
            boxShadow: "var(--shadow-gold)",
            maskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
        <span className="font-condensed relative text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
          Avaliar
        </span>
      </a>
    </Section>
  );
}
