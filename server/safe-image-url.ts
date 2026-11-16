/**
 * SSRF guard for server-side image fetches (AGI plant_healthy gateway).
 * Allows only http(s) URLs whose host resolves to public addresses,
 * and returns a pinned IP so callers can avoid DNS rebinding.
 */
import dns from "dns/promises";
import http from "http";
import https from "https";
import net from "net";
import type { IncomingMessage } from "http";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

export type SafePublicImageTarget = {
  /** Original parsed URL (hostname preserved for TLS SNI / Host). */
  url: URL;
  /** Verified public IP used for the TCP connect (anti DNS-rebinding). */
  pinnedIp: string;
};

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

/** Decode IPv4-mapped IPv6 (`::ffff:127.0.0.1` or Node's `::ffff:7f00:1`). */
export function extractIpv4FromMappedIpv6(ip: string): string | null {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (!normalized.startsWith("::ffff:")) return null;
  const rest = normalized.slice("::ffff:".length);
  if (net.isIP(rest) === 4) return rest;

  // Hex form: HHHH:HHHH (each hextet is 16 bits → two IPv4 octets)
  const m = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(rest);
  if (!m) return null;
  const hi = Number.parseInt(m[1]!, 16);
  const lo = Number.parseInt(m[2]!, 16);
  if (!Number.isFinite(hi) || !Number.isFinite(lo) || hi > 0xffff || lo > 0xffff) {
    return null;
  }
  return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // link-local

  const mappedV4 = extractIpv4FromMappedIpv6(normalized);
  if (mappedV4) return isPrivateOrReservedIpv4(mappedV4);

  return false;
}

export function isBlockedIpAddress(ip: string): boolean {
  const cleaned = ip.replace(/^\[|\]$/g, "");
  const family = net.isIP(cleaned);
  if (family === 4) return isPrivateOrReservedIpv4(cleaned);
  if (family === 6) return isPrivateOrReservedIpv6(cleaned);
  return true;
}

export async function assertSafePublicImageUrl(rawUrl: string): Promise<SafePublicImageTarget> {
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
    return { url: parsed, pinnedIp: hostname };
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
  return { url: parsed, pinnedIp: records[0]! };
}

/**
 * Fetch an image URL after SSRF checks, connecting to the pinned public IP
 * (Host / SNI still use the original hostname).
 */
export async function fetchSafePublicImage(
  rawUrl: string,
  opts?: { timeoutMs?: number; maxBytes?: number },
): Promise<{ buffer: Buffer; contentType: string }> {
  const { url, pinnedIp } = await assertSafePublicImageUrl(rawUrl);
  if (isBlockedIpAddress(pinnedIp)) {
    throw new Error("image_url resolve para endereço privado/reservado");
  }

  const timeoutMs = opts?.timeoutMs ?? 10_000;
  const maxBytes = opts?.maxBytes ?? 1_875_000;
  const lib = url.protocol === "https:" ? https : http;
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;

  return await new Promise((resolve, reject) => {
    const req = lib.request(
      {
        host: pinnedIp,
        servername: url.hostname.replace(/^\[|\]$/g, ""),
        port,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          Host: url.host,
          Accept: "image/*,*/*;q=0.8",
        },
        timeout: timeoutMs,
      },
      (res: IncomingMessage) => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error("Não foi possível baixar image_url"));
          return;
        }
        const contentType = res.headers["content-type"] ?? "";
        if (contentType && !String(contentType).startsWith("image/")) {
          res.resume();
          reject(new Error("image_url não retornou uma imagem"));
          return;
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            req.destroy();
            reject(new Error("Imagem remota excede o limite (~1.8 MB). Comprima e tente novamente."));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve({ buffer: Buffer.concat(chunks), contentType: String(contentType) });
        });
        res.on("error", reject);
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout ao baixar image_url"));
    });
    req.on("error", reject);
    req.end();
  });
}
