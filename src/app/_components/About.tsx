import Image from "next/image";
import { Section } from "@/lib/_components/Section";
import { Polaroid } from "@/lib/_components/Polaroid";
import { getAboutPhotos } from "@/actions/gallery";
import { getProfile } from "@/actions/profile";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
import { Editable } from "./Editable";
import { EditableText } from "./EditableText";

// A proporção vai para dentro do cartão, não na célula da grade: a altura passa
// a vir da foto mais a legenda, para o texto crescer sem ser cortado.
const poses = [
  { grid: "col-span-6 col-start-1 -rotate-[3.5deg] z-10", aspect: "aspect-3/4" },
  { grid: "col-span-6 col-start-6 -mt-36 rotate-[4deg] z-30", aspect: "aspect-square" },
  { grid: "col-span-6 col-start-4 -mt-40 -rotate-[2deg] z-20", aspect: "aspect-3/4" },
];

function Row({ photos }: { photos: LabeledPhoto[] }) {
  return (
    <div className="grid grid-cols-12 items-start gap-x-0 pt-4">
      {photos.map((photo, i) => {
        const pose = poses[i % poses.length];
        return (
          <Editable
            key={photo.placementId}
            type="placement"
            id={photo.placementId}
            className={`transition-transform duration-500 hover:z-40 hover:rotate-0 hover:scale-[1.03] active:z-40 active:rotate-0 active:scale-[1.03] ${pose.grid}`}
          >
            <Polaroid
              photo={photo}
              alt="Registro do portfólio de Denise Galvão"
              caption={photo.label}
              aspect={pose.aspect}
              tape={i % 2 === 0 ? "top" : "corner"}
              tapeRotationDeg={i % 2 ? 6 : -7}
              className="w-full"
            />
          </Editable>
        );
      })}
    </div>
  );
}

export async function About() {
  const [{ family }, profile] = await Promise.all([getAboutPhotos(), getProfile()]);

  return (
    <Section id="quem-sou" index="01" eyebrow="Quem sou" title="Denise Galvão">
      <div className="space-y-4">
        <Editable type="placement" id={family[0].placementId}>
          <figure className="frame-gold relative overflow-hidden p-1.5">
            <div className="relative aspect-4/5 overflow-hidden sm:aspect-16/10">
              <img
                src={family[0].src}
                alt="Denise Galvão segurando sua câmera durante um ensaio"
                className="h-full w-full object-cover grayscale"
              />
            </div>
            <figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold">
              <EditableText type="profile" id="main" field="capaCaption">
                {profile.capaCaption}
              </EditableText>
            </figcaption>
          </figure>
        </Editable>

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
          <EditableText
            type="profile"
            id="main"
            field="profissao.titulo"
            as="h3"
            className="display-xl relative text-3xl text-foreground"
          >
            {profile.profissao.titulo}
          </EditableText>
          <EditableText
            type="profile"
            id="main"
            field="profissao.eyebrow"
            as="p"
            className="font-condensed relative mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-gold"
          >
            {profile.profissao.eyebrow}
          </EditableText>
          {profile.profissao.paragrafos.map((paragrafo, i) => (
            <EditableText
              key={i}
              type="profile"
              id="main"
              field={`profissao.paragrafos.${i}`}
              as="p"
              className="relative mt-3 text-sm leading-relaxed text-foreground"
            >
              {paragrafo}
            </EditableText>
          ))}
        </div>
        <Row photos={[family[1], family[3]]} />

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
          <EditableText
            type="profile"
            id="main"
            field="familia.titulo"
            as="h3"
            className="display-xl relative text-3xl text-foreground"
          >
            {profile.familia.titulo}
          </EditableText>
          {profile.familia.paragrafos.map((paragrafo, i) => (
            <EditableText
              key={i}
              type="profile"
              id="main"
              field={`familia.paragrafos.${i}`}
              as="p"
              className="relative mt-3 text-sm leading-relaxed text-foreground"
            >
              {paragrafo}
            </EditableText>
          ))}
        </div>
        <Editable type="placement" id={family[2].placementId}>
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
            <figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
              <EditableText type="profile" id="main" field="familia.legendaFoto">
                {profile.familia.legendaFoto}
              </EditableText>
            </figcaption>
          </figure>
        </Editable>
      </div>
    </Section>
  );
}
