/**
 * SSRF guard for server-side image fetches (AGI plant_healthy gateway).
 * Allows only http(s) URLs whose host resolves to public addresses.
 */
import dns from "dns/promises";
import net from "net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return -1;
  }
  return ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n < 0) return true;
  // JS bitwise ops are signed Int32 — normalize with >>> 0 before comparing.
  const and = (mask: number) => (n & mask) >>> 0;
  // 0.0.0.0/8, 10/8, 127/8, 169.254/16, 172.16/12, 192.168/16, 100.64/10, 224+/multicast+
  if (and(0xff000000) === 0x00000000) return true;
  if (and(0xff000000) === 0x0a000000) return true;
  if (and(0xff000000) === 0x7f000000) return true;
  if (and(0xffff0000) === 0xa9fe0000) return true;
  if (and(0xfff00000) === 0xac100000) return true;
  if (and(0xffff0000) === 0xc0a80000) return true;
  if (and(0xffc00000) === 0x64400000) return true;
  if (and(0xf0000000) >= 0xe0000000) return true;
  return false;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // link-local
  // IPv4-mapped
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.slice("::ffff:".length);
    if (net.isIP(v4) === 4) return isPrivateOrReservedIpv4(v4);
  }
  return false;
}

export function isBlockedIpAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateOrReservedIpv4(ip);
  if (family === 6) return isPrivateOrReservedIpv6(ip);
  return true;
}

export async function assertSafePublicImageUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("image_url inválida");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("image_url deve usar http ou https");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("image_url host bloqueado");
  }
  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("image_url host bloqueado");
  }

  // Literal IP in URL
  if (net.isIP(hostname)) {
    if (isBlockedIpAddress(hostname)) {
      throw new Error("image_url aponta para rede privada/reservada");
    }
    return parsed;
  }

  let records: string[] = [];
  try {
    const result = await dns.lookup(hostname, { all: true, verbatim: true });
    records = result.map((r) => r.address);
  } catch {
    throw new Error("Não foi possível resolver image_url");
  }
  if (records.length === 0) {
    throw new Error("Não foi possível resolver image_url");
  }
  for (const addr of records) {
    if (isBlockedIpAddress(addr)) {
      throw new Error("image_url resolve para endereço privado/reservado");
    }
  }
  return parsed;
}
