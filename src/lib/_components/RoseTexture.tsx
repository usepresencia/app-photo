const DOTS_BACKGROUND_IMAGE =
  "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--rose) 12%, transparent) 0 14px, transparent 15px), radial-gradient(circle at 62% 34%, color-mix(in oklab, var(--rose) 8%, transparent) 0 20px, transparent 21px), radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--rose) 10%, transparent) 0 18px, transparent 19px), radial-gradient(circle at 78% 88%, color-mix(in oklab, var(--rose) 8%, transparent) 0 16px, transparent 17px)";

const VERTICAL_FADE = "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)";
const HORIZONTAL_FADE_EDGE = "linear-gradient(to right, black 70%, transparent)";
const HORIZONTAL_FADE_CENTER =
  "linear-gradient(to right, transparent, black 30%, black 70%, transparent)";

// Textura decorativa "rose" reusada nos cards/blocos com moldura rose:
// - "dots": pontos radiais sutis atrás do conteúdo (cards de pacote/depoimento).
// - "mask": véu bg-rose/10 com borrão, recortado por um degradê de máscara
//   (blocos de texto com borda à esquerda). `fade` escolhe se a máscara
//   some só numa borda ("edge") ou nas duas ("center").
export function RoseTexture(
  props: { variant: "dots" } | { variant: "mask"; fade: "edge" | "center" },
) {
  if (props.variant === "dots") {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: DOTS_BACKGROUND_IMAGE,
          backgroundSize: "190px 190px",
        }}
      />
    );
  }

  const horizontalFade = props.fade === "edge" ? HORIZONTAL_FADE_EDGE : HORIZONTAL_FADE_CENTER;
  const maskImage = `${VERTICAL_FADE}, ${horizontalFade}`;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-rose/10 backdrop-blur-sm"
      style={{
        boxShadow: "var(--shadow-rose)",
        maskImage,
        WebkitMaskImage: maskImage,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    />
  );
}
