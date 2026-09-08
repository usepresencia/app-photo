import Image from "next/image";
import { Section } from "@/lib/_components/Section";
import { Polaroid } from "@/lib/_components/Polaroid";
import { getAboutPhotos } from "@/actions/gallery";
import type { Photo } from "@/actions/_mock/types";

// A proporção vai para dentro do cartão, não na célula da grade: a altura passa
// a vir da foto mais a legenda, para o texto crescer sem ser cortado.
const poses = [
  { grid: "col-span-6 col-start-1 -rotate-[3.5deg] z-10", aspect: "aspect-[3/4]" },
  { grid: "col-span-6 col-start-6 -mt-36 rotate-[4deg] z-30", aspect: "aspect-square" },
  { grid: "col-span-6 col-start-4 -mt-40 -rotate-[2deg] z-20", aspect: "aspect-[3/4]" },
];

function Row({ photos, notes = [] }: { photos: Photo[]; notes?: string[] }) {
  return (
    <div className="grid grid-cols-12 items-start gap-x-0 pt-4">
      {photos.map((photo, i) => {
        const pose = poses[i % poses.length];
        return (
          <div
            key={photo.src}
            className={`transition-transform duration-500 hover:z-40 hover:rotate-0 hover:scale-[1.03] active:z-40 active:rotate-0 active:scale-[1.03] ${pose.grid}`}
          >
            <Polaroid
              photo={photo}
              alt="Registro do portfólio de Denise Galvão"
              caption={notes[i]}
              aspect={pose.aspect}
              tape={i % 2 === 0 ? "top" : "corner"}
              tapeRotationDeg={i % 2 ? 6 : -7}
              className="w-full"
            />
          </div>
        );
      })}
    </div>
  );
}

export async function About() {
  const { family } = await getAboutPhotos();

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
            Há vários anos marcando momentos
          </figcaption>
        </figure>

        <div className="relative overflow-hidden border-l-2 border-gold p-6 pl-5">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
            style={{
              boxShadow: "var(--shadow-gold)",
              maskImage:
                "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          <h3 className="display-xl relative text-3xl text-foreground">Profissão</h3>
          <p className="font-condensed relative mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-gold">
            Formação e trajetória
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Formada em Design Gráfico com pós-graduação em Marketing Digital, trago uma bagagem de
            mais de 10 anos em comunicação visual e edição.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Minha prática na fotografia une técnica em estúdio, domínio de iluminação e direção de
            retratos a um propósito claro: capturar histórias com intenção e sensibilidade.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Seja para fortalecer sua presença profissional ou registrar marcos da sua vida pessoal,
            meu compromisso é criar imagens que preservem exatamente a verdade e a essência daquilo
            que você viveu.
          </p>
        </div>
        <Row
          photos={[family[1], family[3]]}
          notes={["Minha base, minha família", "Amo esportes radicais e amo adrenalina"]}
        />

        <div className="relative overflow-hidden border-l-2 border-gold p-6 pl-5">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
            style={{
              boxShadow: "var(--shadow-gold)",
              maskImage:
                "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          <h3 className="display-xl relative text-3xl text-foreground">Família</h3>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Aprendi o verdadeiro valor da fotografia quando percebi como a saudade busca, nos
            detalhes, os momentos que não puderam ser registrados.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Foi assim que entendi que fotografar vai muito além de uma imagem bonita: é criar pontes
            para o passado, preservando histórias, pessoas e a essência de quem amamos.
          </p>
          <p className="relative mt-3 text-sm leading-relaxed text-foreground">
            Porque o tempo passa rápido, mas uma fotografia tem o poder de nos levar de volta
            exatamente para onde fomos felizes.
          </p>
        </div>
        <figure
          style={{ ["--tape-rot" as string]: "-6deg" }}
          className="polaroid tape relative w-full -rotate-2"
        >
          <div className="relative aspect-3/2 w-full overflow-hidden bg-background">
            <Image
              src={family[2].src}
              alt="Denise Galvão no altar, em família"
              fill
              sizes="(min-width: 768px) 720px, 92vw"
              placeholder="blur"
              blurDataURL={family[2].blurDataURL}
              className="object-cover grayscale transition-all duration-500 hover:grayscale-0 active:grayscale-0"
            />
          </div>
          <figcaption className="font-hand mt-2 px-1 text-sm leading-snug text-[oklch(0.25_0.02_60)] sm:text-base">
            Quando estive no altar, ao lado de quem amo e com a nossa filha nos braços, percebi de
            vez: essas são as imagens que contam quem nós somos. Viver esse momento do outro lado da
            câmera me fez valorizar ainda mais cada segundo que registro. Ter esse dia guardado me
            traz de volta o abraço, o olhar e a certeza de que a família é o nosso bem mais
            precioso.
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
