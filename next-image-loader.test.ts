import { describe, expect, it } from "vitest";
import cloudinaryLoader from "./next-image-loader";

describe("cloudinaryLoader", () => {
  it("injeta f_auto,q_auto,w_<width> em URLs do Cloudinary", () => {
    const src = "https://res.cloudinary.com/minha-conta/image/upload/v1/foto.webp";
    const result = cloudinaryLoader({ src, width: 600 });
    expect(result).toBe(
      "https://res.cloudinary.com/minha-conta/image/upload/f_auto,q_auto,w_600/v1/foto.webp",
    );
  });

  it("usa a quality explícita quando informada", () => {
    const src = "https://res.cloudinary.com/minha-conta/image/upload/v1/foto.webp";
    const result = cloudinaryLoader({ src, width: 600, quality: 80 });
    expect(result).toContain("f_auto,q_80,w_600");
  });

  it("devolve paths locais sem alteração — mock/dev não passam pelo Cloudinary", () => {
    const src = "/fotos/mock/hero-1.webp";
    expect(cloudinaryLoader({ src, width: 600 })).toBe(src);
  });

  it("devolve URLs que não são do Cloudinary sem alteração", () => {
    const src = "https://outro-dominio.com/imagem.jpg";
    expect(cloudinaryLoader({ src, width: 600 })).toBe(src);
  });
});
