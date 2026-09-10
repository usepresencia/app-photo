import { describe, expect, it } from "vitest";
import { formatDataPretendida } from "./formatDataPretendida";

describe("formatDataPretendida", () => {
  it("formata uma data ISO (yyyy-mm-dd) como 'dia de mês de ano'", () => {
    expect(formatDataPretendida("2026-09-11")).toBe("11 de setembro de 2026");
  });

  it("funciona pro primeiro dia do ano (mês janeiro)", () => {
    expect(formatDataPretendida("2026-01-01")).toBe("1 de janeiro de 2026");
  });

  it("funciona pro último dia do ano (mês dezembro)", () => {
    expect(formatDataPretendida("2026-12-31")).toBe("31 de dezembro de 2026");
  });

  it("retorna 'a definir' quando a data está vazia", () => {
    expect(formatDataPretendida("")).toBe("a definir");
  });
});
