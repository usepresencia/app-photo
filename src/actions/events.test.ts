import { describe, expect, it } from "vitest";
import { getEventFormats } from "./events";

describe("getEventFormats", () => {
  it("retorna 3 formatos de evento, cada um com foto associada", async () => {
    const events = await getEventFormats();
    expect(events).toHaveLength(3);
    for (const event of events) {
      expect(event.image.src).toMatch(/^\/fotos\//);
    }
  });
});
