import { describe, expect, it } from "vitest";
import {
  assertSafePublicImageUrl,
  extractIpv4FromMappedIpv6,
  isBlockedIpAddress,
} from "../server/safe-image-url";

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

  it("bloqueia IPv4-mapped IPv6 em forma hex (canonical Node)", () => {
    expect(extractIpv4FromMappedIpv6("::ffff:7f00:1")).toBe("127.0.0.1");
    expect(extractIpv4FromMappedIpv6("::ffff:a9fe:a9fe")).toBe("169.254.169.254");
    expect(extractIpv4FromMappedIpv6("::ffff:127.0.0.1")).toBe("127.0.0.1");
    expect(isBlockedIpAddress("::ffff:7f00:1")).toBe(true);
    expect(isBlockedIpAddress("::ffff:a9fe:a9fe")).toBe(true);
    expect(isBlockedIpAddress("::ffff:0808:0808")).toBe(false); // 8.8.8.8
  });

  it("rejeita localhost e metadata hostnames", async () => {
    await expect(assertSafePublicImageUrl("http://localhost/img.jpg")).rejects.toThrow(
      /bloqueado/i,
    );
    await expect(
      assertSafePublicImageUrl("http://metadata.google.internal/computeMetadata/v1/"),
    ).rejects.toThrow(/bloqueado/i);
  });

  it("rejeita literal de IP privado na URL (v4 e mapped v6)", async () => {
    await expect(assertSafePublicImageUrl("http://127.0.0.1/a.png")).rejects.toThrow(
      /privada|reservada/i,
    );
    await expect(assertSafePublicImageUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      /privada|reservada/i,
    );
    await expect(assertSafePublicImageUrl("http://[::ffff:127.0.0.1]/a.png")).rejects.toThrow(
      /privada|reservada/i,
    );
    await expect(assertSafePublicImageUrl("http://[::ffff:169.254.169.254]/meta")).rejects.toThrow(
      /privada|reservada/i,
    );
  });

  it("rejeita protocolos não http(s)", async () => {
    await expect(assertSafePublicImageUrl("file:///etc/passwd")).rejects.toThrow(/http/i);
  });

  it("retorna pinnedIp para hosts públicos literais", async () => {
    const target = await assertSafePublicImageUrl("https://8.8.8.8/logo.png");
    expect(target.pinnedIp).toBe("8.8.8.8");
    expect(target.url.hostname).toBe("8.8.8.8");
  });
});
