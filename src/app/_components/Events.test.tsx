import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Events } from "./Events";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("Events", () => {
  it("marca título e subtítulo de cada card de evento como editáveis (tipo niche)", async () => {
    const { container } = render(await Events({ whatsapp: "https://wa.me/5511999999999" }));
    const editables = container.querySelectorAll('[data-editable-text^="niche:"]');
    // 3 nichos de evento, título + subtítulo cada um.
    expect(editables).toHaveLength(6);
  });
});
