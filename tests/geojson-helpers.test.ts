import { describe, expect, it } from "vitest";
import {
  approxAreaHaFromGeoJson,
  squarePolygonAround,
  validatePolygonGeoJson,
} from "@/lib/propriedades/geojson-helpers";

describe("geojson-helpers", () => {
  it("valida e normaliza Feature Polygon", () => {
    const geo = {
      type: "Feature",
      properties: { nome: "Talhão A" },
      geometry: JSON.parse(squarePolygonAround(-23.5, -51.4, 0.01)),
    };
    const result = validatePolygonGeoJson(JSON.stringify(geo));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.normalized).type).toBe("Polygon");
      expect(result.areaHa).toBeGreaterThan(0);
    }
  });

  it("recusa anel aberto", () => {
    const result = validatePolygonGeoJson(
      JSON.stringify({
        type: "Polygon",
        coordinates: [
          [
            [-51.4, -23.5],
            [-51.39, -23.5],
            [-51.39, -23.49],
            [-51.4, -23.49],
          ],
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("não está fechado");
  });

  it("estima área positiva para polígono gerado por GPS", () => {
    const geo = squarePolygonAround(-23.5, -51.4, 0.004);
    expect(approxAreaHaFromGeoJson(geo)).toBeGreaterThan(0);
  });
});
