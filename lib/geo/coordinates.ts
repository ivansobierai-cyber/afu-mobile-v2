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

export function staticMapUrl(
  markers: Array<{ latitude: number; longitude: number }>,
  width = 600,
  height = 300,
): string | null {
  if (markers.length === 0) return null;
  const center = markers[0];
  const markerParam = markers.map((m) => `${m.latitude},${m.longitude},red`).join("|");
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center.latitude},${center.longitude}&zoom=10&size=${width}x${height}&markers=${markerParam}`;
}

export function parseCoordinateInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(n)) return undefined;
  return n;
}
