import { describe, expect, it } from "vitest";
import { assertSafePublicImageUrl, isBlockedIpAddress } from "../server/safe-image-url";

describe("safe-image-url SSRF guard", () => {
  it("bloqueia IPs privados e reservados", () => {
    expect(isBlockedIpAddress("127.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("10.0.0.5")).toBe(true);
    expect(isBlockedIpAddress("192.168.1.10")).toBe(true);
    expect(isBlockedIpAddress("169.254.169.254")).toBe(true);
    expect(isBlockedIpAddress("172.16.0.1")).toBe(true);
    expect(isBlockedIpAddress("100.64.1.2")).toBe(true);
    expect(isBlockedIpAddress("8.8.8.8")).toBe(false);
    expect(isBlockedIpAddress("::1")).toBe(true);
  });

  it("rejeita localhost e metadata hostnames", async () => {
    await expect(assertSafePublicImageUrl("http://localhost/img.jpg")).rejects.toThrow(
      /bloqueado/i,
    );
    await expect(
      assertSafePublicImageUrl("http://metadata.google.internal/computeMetadata/v1/"),
    ).rejects.toThrow(/bloqueado/i);
  });

  it("rejeita literal de IP privado na URL", async () => {
    await expect(assertSafePublicImageUrl("http://127.0.0.1/a.png")).rejects.toThrow(
      /privada|reservada/i,
    );
    await expect(assertSafePublicImageUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      /privada|reservada/i,
    );
  });

  it("rejeita protocolos não http(s)", async () => {
    await expect(assertSafePublicImageUrl("file:///etc/passwd")).rejects.toThrow(/http/i);
  });
});
