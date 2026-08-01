import { aboutFamily, aboutWork, gallery, niches, packages } from "./data";
import { GalleryAlbum } from "./GalleryAlbum";
import { Section } from "./Section";

function Row({ images, notes = [] }: { images: string[]; notes?: string[] }) {
  const poses = [
    "col-span-6 col-start-1 aspect-[3/4] -rotate-[3.5deg] z-10",
    "col-span-6 col-start-6 -mt-36 aspect-square rotate-[4deg] z-30",
    "col-span-6 col-start-4 -mt-40 aspect-[3/4] -rotate-[2deg] z-20",
  ];
  return (
    <div className="grid grid-cols-12 items-start gap-x-0 pt-4">

      {images.map((src, i) => (
        <figure
          key={src}
          style={{ ["--tape-rot" as string]: `${i % 2 ? 6 : -7}deg` }}
          className={`polaroid relative transition-transform duration-500 hover:rotate-0 hover:scale-[1.03] ${
            i % 2 === 0 ? "tape" : "tape-corner"
          } ${poses[i % poses.length]}`}
        >
          <div className="h-[calc(100%-1.1rem)] w-full overflow-hidden bg-background">
            <img
              src={src}
              alt="Registro do portfólio de Denise Galvão"
              loading="lazy"
              className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
            />
          </div>
          <figcaption className="font-hand absolute inset-x-2 bottom-1 truncate text-[0.8rem] leading-none text-[oklch(0.25_0.02_60)]">
            {notes[i] ?? ""}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}



export function About() {
  return (
    <Section id="quem-sou" index="01" eyebrow="Quem sou" title="Denise Galvão">
      <div className="space-y-4">
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
        <Row images={aboutFamily} notes={["nossa gente", "domingo", "colo"]} />

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
        <Row images={aboutWork} notes={["bastidor", "luz de estúdio", "revelando"]} />
      </div>
    </Section>
  );
}

export function Gallery() {
  return (
    <Section id="galeria" index="02" eyebrow="Portfólio" title="Meus trabalhos">
      <GalleryAlbum images={gallery} />
    </Section>
  );
}



export function Niches() {
  return (
    <Section id="ensaios" index="03" eyebrow="Nichos — estúdio e externo" title="Ensaios para cada momento">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Arraste para o lado e toque no ensaio para ver a descrição completa, os pacotes e a galeria.
      </p>

      <div className="no-scrollbar -mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3">
        {niches.map((n) => (
          <Link
            key={n.slug}
            to="/ensaios/$slug"
            params={{ slug: n.slug }}
            className="group relative w-[78%] max-w-sm shrink-0 snap-center overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={n.image}
                alt={`Ensaio de ${n.title}`}
                loading="lazy"
                className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.04]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent p-5 pt-12">
              <span className="font-condensed text-[0.6rem] uppercase tracking-[0.32em] text-muted-foreground">
                {n.subtitle}
              </span>
              <h3 className="display-xl mt-1 text-3xl text-foreground">{n.title}</h3>
              <span className="font-condensed mt-3 inline-block border border-gold/50 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-gold">
                Ver serviço →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="font-condensed mt-4 text-center text-[0.62rem] uppercase tracking-[0.3em] text-muted-foreground">
        Os pacotes valem para qualquer nicho
      </p>
    </Section>
  );
}

