"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { BACK_BUTTON_CLASSNAME } from "@/lib/_components/BackButton";

// Front/back continuam Server Components comuns (About.tsx) — um Server
// Component não pode passar função como prop pra um Client Component (só
// dado serializável atravessa essa fronteira). Por isso o flip/unflip não
// vem por callback: só os botões-folha abaixo (FlipButton/UnflipButton)
// são "use client" de fato, e pegam a ação de um contexto que o próprio
// AboutFlip (também client, dono do estado) provê.
interface AboutFlipActions {
  flip: () => void;
  unflip: () => void;
}

const AboutFlipContext = createContext<AboutFlipActions | null>(null);

function useAboutFlipActions(): AboutFlipActions {
  const actions = useContext(AboutFlipContext);
  if (!actions) {
    throw new Error("FlipButton/UnflipButton só funcionam dentro de <AboutFlip>");
  }
  return actions;
}

export function FlipButton({ children }: { children: ReactNode }) {
  const { flip } = useAboutFlipActions();
  return (
    <button
      type="button"
      onClick={flip}
      className="font-condensed absolute bottom-3 right-3 bg-rose px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
    >
      {children}
    </button>
  );
}

// Mesmo visual do botão "Voltar" de NicheHero.tsx (BACK_BUTTON_CLASSNAME)
// — lá é navegação real (<Link href="/">), aqui é só um toggle de estado,
// mas a ação "voltar" deve parecer a mesma em qualquer lugar do site. Só
// usado dentro do cabeçalho do próprio AboutFlip (não é mais passado via
// prop `back` por About.tsx), então não precisa ser exportado.
function UnflipButton() {
  const { unflip } = useAboutFlipActions();
  return (
    <button type="button" onClick={unflip} aria-label="Voltar" className={BACK_BUTTON_CLASSNAME}>
      <FaArrowLeft className="size-4" />
    </button>
  );
}

// O cabeçalho (eyebrow/título) precisa saber se a página está virada —
// por isso não pode mais vir do Section (que é renderizado por About.tsx,
// de fora do Provider acima, sem acesso a esse estado). Section continua
// cuidando só do índice/régua (index sem eyebrow/title ainda mostra o
// cabeçalho — ver Section.tsx); eyebrow some no verso, e o botão de
// voltar aparece junto ao título em vez de ficar solto no topo do verso.
function AboutFlipHeader({
  eyebrow,
  title,
  flipped,
}: {
  eyebrow: string;
  title: string;
  flipped: boolean;
}) {
  return (
    // mb-5 aqui, não só no index/régua do Section: antes esse respiro
    // vinha do <header> inteiro (index+régua+eyebrow+título) ter um
    // único mb-5 fechando o bloco. Separar eyebrow/título em flip-aware
    // tirou esse texto do <header> — sem o mb-5 aqui, o espaço antes do
    // conteúdo zerava, ficando diferente de toda outra seção do site.
    <div className="mb-5">
      {!flipped && (
        <p className="font-condensed mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <div className="mt-2 flex items-center gap-3">
        {flipped && <UnflipButton />}
        <h2 className="display-xl text-[2.6rem] text-foreground sm:text-6xl">{title}</h2>
      </div>
    </div>
  );
}

// Reaproveita a mesma mecânica de "virar página" do álbum de NicheHero.tsx
// (AlbumSlides: album-stage + album-page-next/prev, definidas em
// globals.css), só que com dois lados fixos (frente/verso) em vez de N
// páginas — sem autoplay, sem swipe.
export function AboutFlip({
  eyebrow,
  title,
  front,
  back,
}: {
  eyebrow: string;
  title: string;
  front: ReactNode;
  back: ReactNode;
}) {
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const flip = () => {
    setDirection(1);
    setFlipped(true);
  };
  const unflip = () => {
    setDirection(-1);
    setFlipped(false);
  };

  return (
    <AboutFlipContext.Provider value={{ flip, unflip }}>
      <AboutFlipHeader eyebrow={eyebrow} title={title} flipped={flipped} />
      <div className="album-stage relative">
        <div
          key={flipped ? "back" : "front"}
          className={direction === 1 ? "album-page-next" : "album-page-prev"}
        >
          {flipped ? back : front}
        </div>
      </div>
    </AboutFlipContext.Provider>
  );
}
