import { aboutFamily, aboutWork, gallery, niches, packages } from "./data";
import { Section } from "./Section";

function Row({ images }: { images: string[] }) {
  const poses = [
    "col-span-5 aspect-[3/4] -rotate-[1.5deg]",
    "col-span-4 col-start-5 mt-10 aspect-square rotate-[2deg] z-10",
    "col-span-4 col-start-9 -mt-6 aspect-[3/5] -rotate-[1deg]",
  ];
  return (
    <div className="grid grid-cols-12 items-start gap-x-1">
      {images.map((src, i) => (
        <figure
          key={src}
          className={`relative overflow-hidden border border-border bg-surface p-1 shadow-[var(--shadow-soft)] transition-transform duration-500 hover:rotate-0 hover:scale-[1.03] ${poses[i % poses.length]}`}
        >
          <img
            src={src}
            alt="Registro do portfólio de Denise Galvão"
            loading="lazy"
            className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
          />
        </figure>
      ))}
    </div>
  );
}


export function About() {
  return (
    <Section id="quem-sou" index="01" eyebrow="Quem sou" title="Denise Galvão">
      <div className="space-y-6">
        <figure className="frame-gold relative overflow-hidden p-1.5">
          <div className="aspect-[4/5] overflow-hidden sm:aspect-[16/10]">
            <img
              src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=1000&auto=format&fit=crop"
              alt="Denise Galvão segurando sua câmera durante um ensaio"
              className="h-full w-full object-cover grayscale"
            />
          </div>
          <figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold">
            Atrás da câmera desde 2014
          </figcaption>
        </figure>

        <div className="border-l-2 border-gold bg-surface p-6 pl-5">
          <h3 className="display-xl text-3xl text-foreground">Família</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Cresci vendo minha mãe guardar fotos em caixas de sapato. Foi ali que entendi que uma
            imagem é a forma mais honesta de segurar o tempo. Hoje fotografo famílias como quem
            organiza aquela caixa: com cuidado, sem pressa e com muito afeto.
          </p>
        </div>
        <Row images={aboutFamily} />

        <div className="border-l-2 border-gold bg-surface p-6 pl-5">
          <h3 className="display-xl text-3xl text-foreground">Profissão</h3>
          <p className="font-condensed mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-gold">
            Formação e trajetória
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Formada em Fotografia, com especialização em retrato e luz de estúdio. São mais de dez
            anos entre ensaios autorais, casamentos e projetos editoriais — sempre com uma estética
            monocromática, direção leve e entrega no prazo combinado.
          </p>
        </div>
        <Row images={aboutWork} />
      </div>
    </Section>
  );
}

const spreadPoses = [
  "col-span-7 aspect-[4/5] -rotate-[1.2deg]",
  "col-span-6 col-start-7 mt-14 aspect-[3/4] rotate-[2deg] z-20",
  "col-span-5 -mt-10 aspect-square rotate-[1deg] z-10",
  "col-span-8 col-start-5 mt-3 aspect-[16/10] -rotate-[0.8deg]",
  "col-span-6 -mt-12 aspect-[3/4] rotate-[1.6deg] z-20",
  "col-span-7 col-start-6 mt-4 aspect-[4/5] -rotate-[2deg]",
];

export function Gallery() {
  const spreads: string[][] = [];
  for (let i = 0; i < gallery.length; i += 6) spreads.push(gallery.slice(i, i + 6));

  return (
    <Section id="galeria" index="02" eyebrow="Portfólio" title="Meus trabalhos">
      <div className="space-y-14">
        {spreads.map((spread, s) => (
          <div key={s} className="relative">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-condensed text-[0.6rem] uppercase tracking-[0.35em] text-gold">
                Página {String(s + 1).padStart(2, "0")}
              </span>
              <span className="gold-rule flex-1" />
            </div>
            <div className="grid grid-cols-12 items-start gap-x-1">
              {spread.map((src, i) => {
                const n = s * 6 + i + 1;
                return (
                  <figure
                    key={src + i}
                    className={`group relative border border-border bg-surface p-1.5 shadow-[var(--shadow-soft)] transition-all duration-500 hover:z-30 hover:rotate-0 hover:scale-[1.04] ${spreadPoses[i]}`}
                  >
                    <div className="h-full w-full overflow-hidden">
                      <img
                        src={src}
                        alt={`Foto ${n} do portfólio`}
                        loading="lazy"
                        className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    </div>
                    <figcaption className="font-condensed absolute bottom-2 left-2 bg-background/80 px-1.5 text-[0.55rem] tracking-[0.3em] text-gold/90">
                      {String(n).padStart(2, "0")}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}


export function Niches() {
  return (
    <Section id="ensaios" index="03" eyebrow="Nichos — estúdio e externo" title="Ensaios para cada momento">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {niches.map((n) => (
            <div key={n.title} className="relative aspect-square overflow-hidden border border-border">
              <img
                src={n.image}
                alt={`Ensaio de ${n.title}`}
                loading="lazy"
                className="h-full w-full object-cover grayscale"
              />
              <span className="font-condensed absolute inset-x-0 bottom-0 bg-background/85 px-2 py-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold">
                {n.title}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center border border-border bg-surface p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Todos os nichos seguem o mesmo cuidado: conversa antes do ensaio, direção durante e
            seleção feita a quatro mãos. Você escolhe estúdio — com fundo controlado e luz contínua
            — ou uma locação externa na cidade.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Os pacotes abaixo valem para qualquer nicho.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {packages.map((p) => (
          <div
            key={p.name}
            className={`relative border p-6 ${
              p.featured ? "border-gold bg-surface-2" : "border-border bg-surface"
            }`}
            style={p.featured ? { boxShadow: "var(--shadow-gold)" } : undefined}
          >
            {p.featured && (
              <span className="font-condensed absolute -top-2.5 left-6 bg-gold px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.25em] text-primary-foreground">
                Mais escolhido
              </span>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
              <h3 className="display-xl truncate text-2xl text-foreground">{p.name}</h3>
              <span className="font-display shrink-0 text-2xl text-gold">{p.price}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {p.items.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="text-gold">
                    —
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="font-condensed text-center text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
          Pix, dinheiro ou cartão em até 6x
        </p>
      </div>
    </Section>
  );
}
