/**
 * Etapa 6 — cache de relatórios gerados, namespaced por organização.
 * Evita reutilizar HTML/artefato entre tenants.
 */
type CacheEntry = {
  organizationId: number;
  html: string;
  titulo: string;
  tipo: string;
  storageKey?: string;
  createdAt: number;
};

const TTL_MS = 15 * 60 * 1000;
const store = new Map<string, CacheEntry>();

function cacheKey(organizationId: number, fingerprint: string): string {
  return `org:${organizationId}:report:${fingerprint}`;
}

export function getReportCache(
  organizationId: number,
  fingerprint: string,
): CacheEntry | null {
  const key = cacheKey(organizationId, fingerprint);
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.organizationId !== organizationId) {
    store.delete(key);
    return null;
  }
  if (Date.now() - hit.createdAt > TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit;
}

export function setReportCache(
  organizationId: number,
  fingerprint: string,
  value: Omit<CacheEntry, "organizationId" | "createdAt">,
): void {
  store.set(cacheKey(organizationId, fingerprint), {
    ...value,
    organizationId,
    createdAt: Date.now(),
  });
}

export function invalidateOrgReportCache(organizationId: number): void {
  const prefix = `org:${organizationId}:report:`;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Test helper */
export function _clearReportCacheForTests(): void {
  store.clear();
}
