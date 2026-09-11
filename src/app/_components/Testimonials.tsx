import { FaStar } from "react-icons/fa";
import { Section } from "@/lib/_components/Section";
import { getTestimonials } from "@/actions/testimonials";
import { ADD_PILL_CLASSNAME, Addable } from "./Addable";
import { Editable } from "./Editable";

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-hidden="true" className="relative z-10 mb-2 flex gap-0.5 text-rose">
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} className={i < rating ? "opacity-100" : "opacity-20"} />
      ))}
    </div>
  );
}

export async function Testimonials() {
  const testimonials = await getTestimonials();
  return (
    <Section
      id="feedbacks"
      index="05"
      eyebrow="Feedbacks de clientes"
      title="O que dizem por aí"
      action={
        <Addable type="testimonials" className={ADD_PILL_CLASSNAME}>
          Atualizar avaliações
        </Addable>
      }
    >
      <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 pb-12 pt-4">
        {testimonials.map((t) => (
          <Editable
            key={t.id}
            type="testimonial"
            id={t.id}
            className={t.visible ? undefined : "opacity-40"}
          >
            <blockquote
              className="relative flex w-72 shrink-0 flex-col overflow-hidden border border-rose/20 p-6"
              style={{ boxShadow: "var(--shadow-rose)" }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--rose) 12%, transparent) 0 14px, transparent 15px), radial-gradient(circle at 62% 34%, color-mix(in oklab, var(--rose) 8%, transparent) 0 20px, transparent 21px), radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--rose) 10%, transparent) 0 18px, transparent 19px), radial-gradient(circle at 78% 88%, color-mix(in oklab, var(--rose) 8%, transparent) 0 16px, transparent 17px)",
                  backgroundSize: "190px 190px",
                }}
              />
              {!t.visible && (
                <span className="font-condensed relative z-10 mb-2 block w-fit rounded-full bg-rose/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-rose">
                  Oculta
                </span>
              )}
              <Stars rating={t.rating} />
              <span
                aria-hidden="true"
                className="font-display relative z-10 block text-4xl leading-none text-rose"
              >
                &ldquo;
              </span>
              <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground">
                {t.text}
              </p>
              <footer className="font-condensed relative z-10 mt-auto pt-4 text-[0.65rem] uppercase tracking-[0.3em] text-rose">
                {t.name}
              </footer>
            </blockquote>
          </Editable>
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
          className="absolute inset-0 bg-rose/10 backdrop-blur-sm"
          style={{
            boxShadow: "var(--shadow-rose)",
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
