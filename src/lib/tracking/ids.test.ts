import { describe, expect, it } from "vitest";
import { createClientPointId } from "@/lib/tracking/ids";

describe("createClientPointId", () => {
  it("creates unique client-side ids", () => {
    const ids = new Set(Array.from({ length: 20 }, () => createClientPointId()));

    expect(ids.size).toBe(20);
  });
});

