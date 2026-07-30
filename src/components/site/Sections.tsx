import { aboutFamily, aboutWork, gallery, niches, packages } from "./data";
import { GalleryAlbum } from "./GalleryAlbum";
import { Section } from "./Section";

function Row({ images, notes = [] }: { images: string[]; notes?: string[] }) {
  const poses = [
    "col-span-6 col-start-1 aspect-[3/4] -rotate-[3.5deg] z-10",
    "col-span-6 col-start-6 -mt-24 aspect-square rotate-[4deg] z-30",
    "col-span-5 col-start-3 -mt-16 aspect-[3/4] -rotate-[2deg] z-20",
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
