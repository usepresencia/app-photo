import { Section } from "@/shared/_components/Section";
import { Polaroid } from "@/shared/_components/Polaroid";
import { getAboutPhotos } from "@/actions/gallery";
import type { Photo } from "@/actions/_mock/types";

const poses = [
  "col-span-6 col-start-1 aspect-[3/4] -rotate-[3.5deg] z-10",
  "col-span-6 col-start-6 -mt-36 aspect-square rotate-[4deg] z-30",
  "col-span-6 col-start-4 -mt-40 aspect-[3/4] -rotate-[2deg] z-20",
];

function Row({ photos, notes = [] }: { photos: Photo[]; notes?: string[] }) {
  return (
    <div className="grid grid-cols-12 items-start gap-x-0 pt-4">
      {photos.map((photo, i) => (
        <div
          key={photo.src}
          className={`transition-transform duration-500 hover:rotate-0 hover:scale-[1.03] ${poses[i % poses.length]}`}
        >
          <Polaroid
            photo={photo}
            alt="Registro do portfólio de Denise Galvão"
            caption={notes[i]}
            tape={i % 2 === 0 ? "top" : "corner"}
            tapeRotationDeg={i % 2 ? 6 : -7}
            className="h-full w-full"
          />
        </div>
      ))}
    </div>
  );
}

export async function About() {
  const { family, work } = await getAboutPhotos();

  return (
    <Section id="quem-sou" index="01" eyebrow="Quem sou" title="Denise Galvão">
      <div className="space-y-4">
        <figure className="frame-gold relative overflow-hidden p-1.5">
          <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/10]">
            <img
              src={family[0].src}
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
        <Row photos={family} notes={["nossa gente", "domingo", "colo"]} />

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
        <Row photos={work} notes={["bastidor", "luz de estúdio", "revelando"]} />
      </div>
    </Section>
  );
}
