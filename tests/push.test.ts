import { describe, expect, it } from "vitest";
import { chunkPushMessages, collectInvalidPushTokens } from "@/server/services/expo-push";
import type { ExpoPushResponse } from "@/shared/push";

describe("expo push service", () => {
  it("chunkPushMessages divide em lotes", () => {
    const items = Array.from({ length: 5 }, (_, i) => i);
    expect(chunkPushMessages(items, 2)).toEqual([[0, 1], [2, 3], [4]]);
  });

  it("collectInvalidPushTokens identifica tokens inválidos", () => {
    const response: ExpoPushResponse = {
      data: [
        { status: "ok", id: "ticket-1" },
        { status: "error", message: "gone", details: { error: "DeviceNotRegistered" } },
      ],
    };

    const invalid = collectInvalidPushTokens(response, ["token-a", "token-b"]);
    expect(invalid).toEqual(["token-b"]);
  });
});
