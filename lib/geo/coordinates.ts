export function parseCoordinate(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  if (latitude == null || longitude == null) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function openStreetMapUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
}

/** Bbox + embed URL for web preview (staticmap.openstreetmap.de is offline). */
export function openStreetMapEmbedUrl(
  markers: Array<{ latitude: number; longitude: number }>,
): string | null {
  if (markers.length === 0) return null;

  let minLat = markers[0].latitude;
  let maxLat = markers[0].latitude;
  let minLon = markers[0].longitude;
  let maxLon = markers[0].longitude;

  for (const marker of markers) {
    minLat = Math.min(minLat, marker.latitude);
    maxLat = Math.max(maxLat, marker.latitude);
    minLon = Math.min(minLon, marker.longitude);
    maxLon = Math.max(maxLon, marker.longitude);
  }

  const latPad = Math.max((maxLat - minLat) * 0.25, 0.015);
  const lonPad = Math.max((maxLon - minLon) * 0.25, 0.015);
  const south = minLat - latPad;
  const north = maxLat + latPad;
  const west = minLon - lonPad;
  const east = maxLon + lonPad;
  const primary = markers[0];

  return `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${primary.latitude}%2C${primary.longitude}`;
}

export function staticMapUrl(
  markers: Array<{ latitude: number; longitude: number }>,
  _width = 600,
  _height = 300,
): string | null {
  return openStreetMapEmbedUrl(markers);
}

export function parseCoordinateInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(n)) return undefined;
  return n;
}
