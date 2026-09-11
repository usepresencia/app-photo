import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { HeroFilmStrip } from "./_HeroFilmStrip";
import type { Photo } from "@/actions/_mock/types";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const photos: Photo[] = Array.from({ length: 9 }, (_, i) => ({
  src: `/fotos/teste/foto-${i}.webp`,
  width: 1600,
  height: 1067,
  blurDataURL: "data:image/webp;base64,AA",
  placementId: `placement-${i}`,
}));

/** Intervalo do slot 0 (ver INTERVALO_MS no componente). */
const UMA_TROCA = 2600;

function primeiroSlot(container: HTMLElement) {
  return container.querySelectorAll(".hero-strip-fade-in")[0] as HTMLElement;
}

/** A foto em exibição é a do quadro que está entrando (o último do slot). */
function fotoAtual(container: HTMLElement) {
  const imgs = primeiroSlot(container).querySelectorAll("img");
  return imgs[imgs.length - 1]?.getAttribute("src");
}

describe("HeroFilmStrip", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("não pisca no carregamento da página", () => {
    const { container } = render(<HeroFilmStrip photos={photos} />);
    expect(container.querySelectorAll(".hero-flash")).toHaveLength(0);
  });

  it("dispara o flash quando a foto de um slot troca", () => {
    const { container } = render(<HeroFilmStrip photos={photos} />);

    act(() => void vi.advanceTimersByTime(UMA_TROCA));

    expect(primeiroSlot(container).querySelector(".hero-flash")).not.toBeNull();
  });

  it("troca a foto exibida no slot", () => {
    const { container } = render(<HeroFilmStrip photos={photos} />);
    const antes = fotoAtual(container);

    act(() => void vi.advanceTimersByTime(UMA_TROCA));

    expect(fotoAtual(container)).not.toBe(antes);
  });

  // Regressão: quando as duas camadas eram remontadas a cada troca, a transição
  // nunca disparava e a foto trocava em corte seco, sem o dissolve.
  it("dissolve a foto nova por cima da anterior", () => {
    const { container } = render(<HeroFilmStrip photos={photos} />);
    const slot = primeiroSlot(container);

    expect(slot.querySelectorAll("img")).toHaveLength(1);

    act(() => void vi.advanceTimersByTime(UMA_TROCA));

    // As duas fotos coexistem: a anterior por baixo, a nova entrando com o dissolve.
    expect(slot.querySelectorAll("img")).toHaveLength(2);
    expect(slot.querySelector(".hero-photo-in")).not.toBeNull();
  });

  // Regressão: o flash já foi controlado por setTimeout enquanto o dissolve era
  // uma animação CSS mais longa — relógios diferentes, efeitos fora de sincronia.
  it("monta dissolve e flash na mesma troca, para tocarem juntos", () => {
    const { container } = render(<HeroFilmStrip photos={photos} />);

    act(() => void vi.advanceTimersByTime(UMA_TROCA));

    const slot = primeiroSlot(container);
    const dissolve = slot.querySelector(".hero-photo-in");
    const flash = slot.querySelector(".hero-flash");

    expect(dissolve).not.toBeNull();
    expect(flash).not.toBeNull();
    // Os dois vivem na mesma subárvore, montados pela mesma troca: nenhum
    // timer em JS envolvido. dissolve não é mais irmão direto de flash
    // desde que ganhou o wrapper <Editable> (Task 7) — o que a regressão
    // protege é que ambos apareçam juntos no mesmo slot, não a
    // profundidade exata do DOM.
    expect(flash?.parentElement?.contains(dissolve!)).toBe(true);
  });

  it("marca a foto atual do slot como editável com o placementId certo", () => {
    const { container } = render(<HeroFilmStrip photos={photos} />);
    const slot = primeiroSlot(container);
    const editable = slot.querySelector("[data-editable]");
    expect(editable?.getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
  });
});
