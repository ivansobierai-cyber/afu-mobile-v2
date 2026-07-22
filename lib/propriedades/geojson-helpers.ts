/**
 * Helpers GeoJSON (Etapa 5) — polígonos WGS84 simples.
 */

export type LatLng = { latitude: number; longitude: number };

/** Retângulo aproximado ao redor de um ponto (delta em graus ~1km em lat). */
export function squarePolygonAround(
  latitude: number,
  longitude: number,
  deltaDegrees = 0.008,
): string {
  const coords = [
    [longitude - deltaDegrees, latitude - deltaDegrees],
    [longitude + deltaDegrees, latitude - deltaDegrees],
    [longitude + deltaDegrees, latitude + deltaDegrees],
    [longitude - deltaDegrees, latitude + deltaDegrees],
    [longitude - deltaDegrees, latitude - deltaDegrees],
  ];
  return JSON.stringify({
    type: "Polygon",
    coordinates: [coords],
  });
}

/** Extrai anéis [lat,lng] de Polygon / Feature / FeatureCollection. */
export function extractPolygonRings(geojson: string | null | undefined): LatLng[][] {
  if (!geojson) return [];
  try {
    const parsed = JSON.parse(geojson);
    const rings: LatLng[][] = [];

    const pushPolygon = (geometry: any) => {
      if (!geometry) return;
      if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates?.[0])) {
        rings.push(
          geometry.coordinates[0].map((c: number[]) => ({
            longitude: c[0],
            latitude: c[1],
          })),
        );
      } else if (geometry.type === "MultiPolygon") {
        for (const poly of geometry.coordinates ?? []) {
          if (Array.isArray(poly?.[0])) {
            rings.push(
              poly[0].map((c: number[]) => ({
                longitude: c[0],
                latitude: c[1],
              })),
            );
          }
        }
      }
    };

    if (parsed.type === "Feature") pushPolygon(parsed.geometry);
    else if (parsed.type === "FeatureCollection") {
      for (const f of parsed.features ?? []) pushPolygon(f.geometry);
    } else {
      pushPolygon(parsed);
    }
    return rings;
  } catch {
    return [];
  }
}

/** Área aproximada em ha (shoelace + cos(lat)). Suficiente para UI. */
export function approxAreaHaFromGeoJson(geojson: string): number | null {
  const rings = extractPolygonRings(geojson);
  if (rings.length === 0 || rings[0].length < 3) return null;
  const ring = rings[0];
  const lat0 = (ring.reduce((s, p) => s + p.latitude, 0) / ring.length) * (Math.PI / 180);
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos(lat0);
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x1 = ring[i].longitude * mPerDegLng;
    const y1 = ring[i].latitude * mPerDegLat;
    const x2 = ring[i + 1].longitude * mPerDegLng;
    const y2 = ring[i + 1].latitude * mPerDegLat;
    area += x1 * y2 - x2 * y1;
  }
  const m2 = Math.abs(area / 2);
  return Math.round((m2 / 10_000) * 100) / 100;
}

export type GeoJsonValidation =
  | { ok: true; normalized: string; areaHa: number | null }
  | { ok: false; error: string };

/**
 * Valida Polygon / Feature / FeatureCollection com anel fechado (≥4 pontos).
 * Normaliza para Geometry Polygon (primeiro anel).
 */
export function validatePolygonGeoJson(raw: string): GeoJsonValidation {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Cole um GeoJSON de polígono." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON inválido." };
  }
  const rings = extractPolygonRings(text);
  if (rings.length === 0) {
    return { ok: false, error: "Nenhum Polygon encontrado no GeoJSON." };
  }
  const ring = rings[0];
  if (ring.length < 4) {
    return { ok: false, error: "Polígono precisa de pelo menos 4 posições (anel fechado)." };
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    Math.abs(first.latitude - last.latitude) > 1e-9 ||
    Math.abs(first.longitude - last.longitude) > 1e-9
  ) {
    return { ok: false, error: "Anel do polígono não está fechado (primeiro ≠ último)." };
  }
  for (const p of ring) {
    if (
      !Number.isFinite(p.latitude) ||
      !Number.isFinite(p.longitude) ||
      p.latitude < -90 ||
      p.latitude > 90 ||
      p.longitude < -180 ||
      p.longitude > 180
    ) {
      return { ok: false, error: "Coordenadas fora do intervalo WGS84." };
    }
  }
  const coords = ring.map((p) => [p.longitude, p.latitude]);
  const normalized = JSON.stringify({ type: "Polygon", coordinates: [coords] });
  return { ok: true, normalized, areaHa: approxAreaHaFromGeoJson(normalized) };
}
