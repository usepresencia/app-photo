import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { About } from "./About";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("About", () => {
  it("marca a capa, os dois polaroids e a foto do altar como editáveis (tipo placement)", async () => {
    const { container } = render(await About());
    const placementEditables = container.querySelectorAll('[data-editable^="placement:"]');
    // capa + 2 polaroids (Row) + altar = 4 fotos editáveis
    expect(placementEditables).toHaveLength(4);
  });

  it("marca os dois blocos de texto como editáveis (tipo profile, id main)", async () => {
    const { container } = render(await About());
    const profileEditables = container.querySelectorAll('[data-editable="profile:main"]');
    expect(profileEditables).toHaveLength(2);
  });
});
