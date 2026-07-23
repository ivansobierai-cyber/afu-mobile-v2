import { describe, expect, it } from "vitest";
import {
  approxAreaHaFromGeoJson,
  GEOMETRIA_GEOJSON_MAX_CHARS,
  polygonRingToVertices,
  squarePolygonAround,
  validatePolygonGeoJson,
  verticesToPolygonGeoJson,
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

  it("extrai vértices editáveis sem duplicar o fechamento", () => {
    const geo = squarePolygonAround(-23.5, -51.4, 0.004);
    const vertices = polygonRingToVertices(geo);
    expect(vertices).toHaveLength(4);
    expect(vertices.at(0)).not.toEqual(vertices.at(-1));
  });

  it("fecha vértices editáveis e valida GeoJSON normalizado", () => {
    const result = verticesToPolygonGeoJson([
      { latitude: -23.5, longitude: -51.4 },
      { latitude: -23.5, longitude: -51.39 },
      { latitude: -23.49, longitude: -51.39 },
      { latitude: -23.49, longitude: -51.4 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const coords = JSON.parse(result.normalized).coordinates[0];
      expect(coords).toHaveLength(5);
      expect(coords[0]).toEqual(coords.at(-1));
      expect(result.areaHa).toBeGreaterThan(0);
    }
  });

  it("recusa lista editável com menos de três vértices", () => {
    const result = verticesToPolygonGeoJson([
      { latitude: -23.5, longitude: -51.4 },
      { latitude: -23.5, longitude: -51.39 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("pelo menos 3 vértices");
  });

  it("recusa payload acima do limite de caracteres", () => {
    const result = validatePolygonGeoJson("x".repeat(GEOMETRIA_GEOJSON_MAX_CHARS + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("excede o limite");
  });
});
