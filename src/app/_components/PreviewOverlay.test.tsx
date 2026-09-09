import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { isHandshakeAck, originOf, parseEditableTarget, PreviewOverlay } from "./PreviewOverlay";

describe("originOf", () => {
  it("retorna a origem de uma URL válida", () => {
    expect(originOf("http://localhost:3001/qualquer/coisa")).toBe("http://localhost:3001");
  });

  it("retorna null pra valor ausente ou inválido", () => {
    expect(originOf(undefined)).toBeNull();
    expect(originOf("nao-e-url")).toBeNull();
  });
});

describe("isHandshakeAck", () => {
  const adminOrigin = "http://localhost:3001";

  it("aceita ack vindo da origem certa", () => {
    expect(
      isHandshakeAck({ origin: adminOrigin, data: { type: "app-photo:preview:ack" } }, adminOrigin),
    ).toBe(true);
  });

  it("rejeita origem errada", () => {
    expect(
      isHandshakeAck(
        { origin: "http://outro.com", data: { type: "app-photo:preview:ack" } },
        adminOrigin,
      ),
    ).toBe(false);
  });

  it("rejeita mensagem de outro tipo", () => {
    expect(
      isHandshakeAck({ origin: adminOrigin, data: { type: "outra-coisa" } }, adminOrigin),
    ).toBe(false);
  });
});

describe("parseEditableTarget", () => {
  it("separa tipo e id no primeiro ':'", () => {
    expect(parseEditableTarget("placement:mock-placement-3")).toEqual({
      entityType: "placement",
      id: "mock-placement-3",
    });
  });

  it("retorna null sem ':' ou valor vazio/nulo", () => {
    expect(parseEditableTarget("semdoispontos")).toBeNull();
    expect(parseEditableTarget(null)).toBeNull();
    expect(parseEditableTarget("")).toBeNull();
  });
});

describe("PreviewOverlay", () => {
  it("fica inerte fora de um iframe (window.self === window.top)", () => {
    render(<PreviewOverlay />);
    expect(document.documentElement.hasAttribute("data-preview-active")).toBe(false);
  });
});
