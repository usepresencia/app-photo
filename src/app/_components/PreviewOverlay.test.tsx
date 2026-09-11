import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  isHandshakeAck,
  isPreviewAffordance,
  originOf,
  parseAddableTarget,
  parseEditableTarget,
  parseEditableTextTarget,
  PreviewOverlay,
} from "./PreviewOverlay";

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

describe("parseEditableTextTarget", () => {
  it("separa tipo, id e campo pelos dois pontos", () => {
    expect(parseEditableTextTarget("niche:familia:description.1")).toEqual({
      entityType: "niche",
      id: "familia",
      field: "description.1",
    });
  });

  it("separa um campo aninhado sem problema (o campo em si nunca tem ':')", () => {
    expect(parseEditableTextTarget("profile:main:profissao.paragrafos.2")).toEqual({
      entityType: "profile",
      id: "main",
      field: "profissao.paragrafos.2",
    });
  });

  it("retorna null se faltar qualquer uma das 3 partes, ou valor vazio/nulo", () => {
    expect(parseEditableTextTarget("niche:familia")).toBeNull();
    expect(parseEditableTextTarget("niche::title")).toBeNull();
    expect(parseEditableTextTarget(null)).toBeNull();
    expect(parseEditableTextTarget("")).toBeNull();
  });
});

describe("isPreviewAffordance", () => {
  it("reconhece o próprio ícone flutuante e qualquer filho dele", () => {
    const icon = document.createElement("button");
    icon.setAttribute("data-preview-affordance", "");
    const child = document.createElement("span");
    icon.appendChild(child);
    expect(isPreviewAffordance(icon)).toBe(true);
    expect(isPreviewAffordance(child)).toBe(true);
  });

  it("não confunde o conteúdo editável do site com um ícone do overlay", () => {
    const editable = document.createElement("div");
    editable.setAttribute("data-editable", "placement:hero-none-0");
    expect(isPreviewAffordance(editable)).toBe(false);
  });

  it("aceita null (mouseout pra fora da janela não tem relatedTarget)", () => {
    expect(isPreviewAffordance(null)).toBe(false);
  });
});

describe("parseAddableTarget", () => {
  it("separa tipo e context (JSON) no primeiro ':'", () => {
    expect(parseAddableTarget('package:{"nicheSlug":"familia"}')).toEqual({
      entityType: "package",
      context: { nicheSlug: "familia" },
    });
  });

  it("aceita ausência de context (nada depois do ':')", () => {
    expect(parseAddableTarget("niche:")).toEqual({ entityType: "niche", context: undefined });
  });

  it("retorna null sem ':', valor vazio/nulo, ou JSON inválido", () => {
    expect(parseAddableTarget("semdoispontos")).toBeNull();
    expect(parseAddableTarget(null)).toBeNull();
    expect(parseAddableTarget("")).toBeNull();
    expect(parseAddableTarget("package:{invalido")).toBeNull();
  });
});

describe("PreviewOverlay", () => {
  it("fica inerte fora de um iframe (window.self === window.top)", () => {
    render(<PreviewOverlay />);
    expect(document.documentElement.hasAttribute("data-preview-active")).toBe(false);
  });
});

describe("PreviewOverlay — ícone de lixeira", () => {
  it("não renderiza nenhum botão de lixeira fora do modo preview", () => {
    const { container } = render(<PreviewOverlay />);
    expect(container.querySelector(".preview-delete-icon")).toBeNull();
  });
});
