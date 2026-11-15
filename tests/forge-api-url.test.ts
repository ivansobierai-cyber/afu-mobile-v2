import { describe, expect, it } from "vitest";
import { normalizeForgeApiUrl } from "../server/_core/env";
import { resolveForgeChatCompletionsUrl } from "../server/_core/llm";

describe("normalizeForgeApiUrl", () => {
  it("acrescenta https quando o host vem sem esquema", () => {
    expect(normalizeForgeApiUrl("ws-example.ap-southeast-1.maas.aliyuncs.com")).toBe(
      "https://ws-example.ap-southeast-1.maas.aliyuncs.com",
    );
  });

  it("remove /v1 e /v1/chat/completions acidentais", () => {
    expect(normalizeForgeApiUrl("https://api.openai.com/v1")).toBe("https://api.openai.com");
    expect(normalizeForgeApiUrl("https://api.openai.com/v1/chat/completions")).toBe(
      "https://api.openai.com",
    );
  });

  it("preserva /compatible-mode do Alibaba MaaS", () => {
    expect(
      normalizeForgeApiUrl(
        "https://ws-example.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions",
      ),
    ).toBe("https://ws-example.ap-southeast-1.maas.aliyuncs.com/compatible-mode");
    expect(
      normalizeForgeApiUrl(
        "https://ws-example.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
      ),
    ).toBe("https://ws-example.ap-southeast-1.maas.aliyuncs.com/compatible-mode");
  });

  it("preserva URL já correta", () => {
    expect(normalizeForgeApiUrl("https://api.openai.com")).toBe("https://api.openai.com");
    expect(normalizeForgeApiUrl("")).toBe("");
  });
});

describe("resolveForgeChatCompletionsUrl", () => {
  it("usa /v1/chat/completions em bases genéricas", () => {
    expect(resolveForgeChatCompletionsUrl("https://api.openai.com")).toBe(
      "https://api.openai.com/v1/chat/completions",
    );
  });

  it("injeta /compatible-mode em hosts MaaS Alibaba", () => {
    expect(
      resolveForgeChatCompletionsUrl(
        "https://ws-example.ap-southeast-1.maas.aliyuncs.com",
      ),
    ).toBe(
      "https://ws-example.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions",
    );
  });

  it("não duplica /compatible-mode se já estiver na base", () => {
    expect(
      resolveForgeChatCompletionsUrl(
        "https://ws-example.ap-southeast-1.maas.aliyuncs.com/compatible-mode",
      ),
    ).toBe(
      "https://ws-example.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions",
    );
  });
});
