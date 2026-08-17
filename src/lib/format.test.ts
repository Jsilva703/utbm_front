import { describe, expect, it } from "vitest";
import { lastUpdateTone, relativeLastUpdate } from "@/lib/format";

describe("relativeLastUpdate", () => {
  it("formats fresh updates", () => {
    const now = new Date("2026-08-17T13:00:30Z").getTime();

    expect(relativeLastUpdate("2026-08-17T13:00:25Z", now)).toBe("Atualizado agora");
    expect(relativeLastUpdate("2026-08-17T13:00:00Z", now)).toBe("Atualizado há 30s");
  });

  it("formats missing updates", () => {
    expect(relativeLastUpdate(null)).toBe("Aguardando primeira localização");
  });
});

describe("lastUpdateTone", () => {
  it("classifies normal, attention and outdated states", () => {
    const now = new Date("2026-08-17T13:10:00Z").getTime();

    expect(lastUpdateTone("2026-08-17T13:09:00Z", now)).toBe("normal");
    expect(lastUpdateTone("2026-08-17T13:07:30Z", now)).toBe("attention");
    expect(lastUpdateTone("2026-08-17T13:04:00Z", now)).toBe("outdated");
  });
});

