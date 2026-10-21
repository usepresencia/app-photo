import Image from "next/image";
import { Section } from "@/lib/_components/Section";
import { Polaroid } from "@/lib/_components/Polaroid";
import { getAboutPhotos } from "@/actions/gallery";
import { getProfile } from "@/actions/profile";
import type { Profile } from "@/actions/profile";
import { RoseTexture } from "@/lib/_components/RoseTexture";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
import { AboutFlip, FlipButton } from "./AboutFlip";
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

function Front({ cover, capaCaption }: { cover: LabeledPhoto; capaCaption: string }) {
  return (
    // FlipButton fica fora do Editable de propósito: o PreviewOverlay
    // delega clique em capture-phase e intercepta qualquer clique dentro
    // de um [data-editable] pra abrir edição — um botão aninhado ali
    // nunca receberia o próprio clique (ver NicheHero.tsx, cujos ícones
    // flutuantes de preview também ficam como irmãos, não filhos, do
    // elemento editável). Este wrapper "relative" assume o mesmo
    // tamanho do Editable (que não tem padding próprio) pra o botão
    // absoluto continuar alinhado à foto.
    <div className="relative">
      <Editable type="placement" id={cover.placementId}>
        <figure className="frame-rose relative overflow-hidden p-1.5">
          <div className="relative aspect-4/5 overflow-hidden sm:aspect-16/10">
            <Image
              src={cover.src}
              alt="Denise Galvão segurando sua câmera durante um ensaio"
              fill
              sizes="(min-width: 640px) 768px, 100vw"
              placeholder="blur"
              blurDataURL={cover.blurDataURL}
              className="object-cover grayscale"
            />
          </div>
          <figcaption className="font-condensed absolute bottom-3 left-3 bg-background/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.3em] text-rose">
            <EditableText type="profile" id="main" field="capaCaption">
              {capaCaption}
            </EditableText>
          </figcaption>
        </figure>
      </Editable>
      <FlipButton>Ver mais</FlipButton>
    </div>
  );
}

function Back({ profile, photos }: { profile: Profile; photos: LabeledPhoto[] }) {
  const [polaroid1, altar, polaroid2] = photos;
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden border-l-2 border-rose p-6 pl-5">
        <RoseTexture variant="mask" fade="edge" />
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
          className="font-condensed relative mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-rose"
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
      <Row photos={[polaroid1, polaroid2]} />

      <div className="relative overflow-hidden border-l-2 border-rose p-6 pl-5">
        <RoseTexture variant="mask" fade="edge" />
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
      <Editable type="placement" id={altar.placementId}>
        <Polaroid
          photo={altar}
          alt="Denise Galvão no altar, em família"
          caption={
            <EditableText type="profile" id="main" field="familia.legendaFoto">
              {profile.familia.legendaFoto}
            </EditableText>
          }
          aspect="aspect-3/2"
          sizes="(min-width: 768px) 720px, 92vw"
          className="w-full -rotate-2"
        />
      </Editable>
    </div>
  );
}

export async function About() {
  const [{ family }, profile] = await Promise.all([getAboutPhotos(), getProfile()]);
  const [cover, polaroid1, altar, polaroid2] = family;

  return (
    <Section id="quem-sou" index="01">
      <AboutFlip
        eyebrow="Quem sou"
        title="Denise Galvão"
        front={<Front cover={cover} capaCaption={profile.capaCaption} />}
        back={<Back profile={profile} photos={[polaroid1, altar, polaroid2]} />}
      />
    </Section>
  );
}
