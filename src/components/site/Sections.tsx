import { aboutFamily, aboutWork, gallery, niches, packages } from "./data";
import { Section } from "./Section";

function Row({ images }: { images: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {images.map((src) => (
        <div key={src} className="aspect-[3/4] overflow-hidden rounded-md border border-border">
          <img
            src={src}
            alt="Registro do portfólio de Denise Galvão"
            loading="lazy"
            className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
          />
        </div>
      ))}
    </div>
  );
}

export function About() {
  return (
    <Section id="quem-sou" eyebrow="Quem sou" title="Denise Galvão">
      <div className="space-y-6">
        <div className="aspect-[4/5] overflow-hidden rounded-lg border border-border sm:aspect-[16/10]">
          <img
            src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=1000&auto=format&fit=crop"
            alt="Denise Galvão segurando sua câmera durante um ensaio"
            className="h-full w-full object-cover grayscale"
          />
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="font-display text-2xl text-foreground">Família</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Cresci vendo minha mãe guardar fotos em caixas de sapato. Foi ali que entendi que uma
            imagem é a forma mais honesta de segurar o tempo. Hoje fotografo famílias como quem
            organiza aquela caixa: com cuidado, sem pressa e com muito afeto.
          </p>
        </div>
        <Row images={aboutFamily} />

        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="font-display text-2xl text-foreground">Profissão</h3>
          <p className="eyebrow mt-1">Formação e trajetória</p>
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

export function Gallery() {
  return (
    <Section id="galeria" eyebrow="Portfólio" title="Meus trabalhos">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {gallery.map((src, i) => (
          <figure
            key={i}
            className="aspect-[3/4] overflow-hidden rounded-md border border-border bg-surface"
          >
            <img
              src={src}
              alt={`Foto ${i + 1} do portfólio`}
              loading="lazy"
              className="h-full w-full object-cover grayscale transition-all duration-500 hover:scale-105 hover:grayscale-0"
            />
          </figure>
        ))}
      </div>
    </Section>
  );
}

export function Niches() {
  return (
    <Section
      id="ensaios"
      eyebrow="Nichos — estúdio e externo"
      title="Ensaios para cada momento"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {niches.map((n) => (
            <div
              key={n.title}
              className="relative aspect-square overflow-hidden rounded-md border border-border"
            >
              <img
                src={n.image}
                alt={`Ensaio de ${n.title}`}
                loading="lazy"
                className="h-full w-full object-cover grayscale"
              />
              <span className="absolute inset-x-0 bottom-0 bg-background/80 px-2 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-foreground">
                {n.title}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center rounded-lg border border-border bg-surface p-6">
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
            className={`rounded-lg border p-6 ${
              p.featured ? "border-foreground bg-surface-2" : "border-border bg-surface"
            }`}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
              <h3 className="font-display truncate text-2xl text-foreground">{p.name}</h3>
              <span className="shrink-0 text-lg font-semibold text-foreground">{p.price}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {p.items.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="text-foreground">
                    —
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="eyebrow text-center">
          Formas de pagamento: Pix, dinheiro ou cartão em até 6x
        </p>
      </div>
    </Section>
  );
}
