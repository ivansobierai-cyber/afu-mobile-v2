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
