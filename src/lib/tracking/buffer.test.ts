import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  countPendingLocations,
  deletePendingLocations,
  listPendingLocations,
  savePendingLocation,
} from "@/lib/tracking/buffer";

const location = {
  latitude: -23.524346,
  longitude: -46.885805,
  accuracy: 8,
  altitude: 785,
  recorded_at: "2026-08-17T13:00:00Z",
  client_point_id: "test-point-1",
};

describe("tracking buffer", () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase("utmb-trail-tracking");
  });

  it("stores, lists and deletes pending locations", async () => {
    await savePendingLocation(location);

    expect(await countPendingLocations()).toBe(1);
    expect(await listPendingLocations()).toEqual([location]);

    await deletePendingLocations([location.client_point_id]);

    expect(await countPendingLocations()).toBe(0);
  });

  it("keeps client_point_id idempotent locally", async () => {
    await savePendingLocation(location);
    await savePendingLocation({ ...location, accuracy: 12 });

    const pending = await listPendingLocations();

    expect(pending).toHaveLength(1);
    expect(pending[0].accuracy).toBe(12);
  });
});

