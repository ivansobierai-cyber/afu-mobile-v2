import { describe, expect, it } from "vitest";
import {
  formatCoordinates,
  hasValidCoordinates,
  parseCoordinate,
  parseCoordinateInput,
  staticMapUrl,
} from "@/lib/geo/coordinates";

describe("geo coordinates", () => {
  it("parseCoordinate converte string decimal", () => {
    expect(parseCoordinate("-21.17750000")).toBeCloseTo(-21.1775);
    expect(parseCoordinate(47.81)).toBeCloseTo(47.81);
    expect(parseCoordinate(null)).toBeNull();
    expect(parseCoordinate("")).toBeNull();
  });

  it("hasValidCoordinates valida limites", () => {
    expect(hasValidCoordinates(-21.17, -47.81)).toBe(true);
    expect(hasValidCoordinates(91, 0)).toBe(false);
    expect(hasValidCoordinates(0, 181)).toBe(false);
    expect(hasValidCoordinates(null, -47)).toBe(false);
  });

  it("parseCoordinateInput aceita vírgula decimal", () => {
    expect(parseCoordinateInput("-21,1775")).toBeCloseTo(-21.1775);
    expect(parseCoordinateInput("")).toBeUndefined();
    expect(parseCoordinateInput("abc")).toBeUndefined();
  });

  it("formatCoordinates formata com 6 casas", () => {
    expect(formatCoordinates(-21.1775, -47.8103)).toBe("-21.177500, -47.810300");
  });

  it("staticMapUrl retorna null sem marcadores", () => {
    expect(staticMapUrl([])).toBeNull();
  });

  it("staticMapUrl monta URL com marcadores", () => {
    const url = staticMapUrl([{ latitude: -21.17, longitude: -47.81 }]);
    expect(url).toContain("staticmap.openstreetmap.de");
    expect(url).toContain("-21.17");
  });
});
