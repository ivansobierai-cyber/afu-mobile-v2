/**
 * Cultivos V2 Etapa 6 — dados de mapa (talhão + pins de ocorrências).
 */
import { getPropriedadeById } from "./db";
import { createTenantDb } from "./tenant-db";
import { listOcorrencias } from "./db-propriedade-expansao";
import { type Cultura } from "../drizzle/schema";
import {
  extractPolygonRings,
  type LatLng,
} from "../lib/propriedades/geojson-helpers";

export type CultivoMapaPayload = {
  culturaId: number;
  propriedadeId: number;
  terrenoId: number | null;
  terrenoNome: string | null;
  propriedadeNome: string | null;
  propriedadeCenter: { latitude: number; longitude: number } | null;
  polygons: {
    id: string;
    title: string;
    coordinates: LatLng[];
    color: string;
  }[];
  markers: {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
  }[];
};

function parseCoord(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export async function buildCultivoMapa(
  organizationId: number,
  cultura: Cultura,
): Promise<CultivoMapaPayload> {
  const prop = await getPropriedadeById(cultura.propriedadeId);
  const lat = parseCoord(prop?.latitude ?? null);
  const lng = parseCoord(prop?.longitude ?? null);

  let terrenoNome: string | null = null;
  let terrenoGeo: string | null = null;
  if (cultura.terrenoId) {
    try {
      const terreno = await createTenantDb(organizationId).requireTerreno(
        cultura.terrenoId,
      );
      terrenoNome = terreno.nome;
      terrenoGeo = terreno.geometriaGeoJson ?? null;
    } catch {
      terrenoNome = null;
    }
  }

  const polygons: CultivoMapaPayload["polygons"] = [];
  if (terrenoGeo) {
    const rings = extractPolygonRings(terrenoGeo);
    rings.forEach((ring, i) => {
      if (ring.length >= 3) {
        polygons.push({
          id: `talhao-${cultura.terrenoId}-${i}`,
          title: terrenoNome ?? "Talhão",
          coordinates: ring,
          color: "#38A169",
        });
      }
    });
  }
  if (prop?.geometriaGeoJson && polygons.length === 0) {
    const rings = extractPolygonRings(prop.geometriaGeoJson);
    rings.forEach((ring, i) => {
      if (ring.length >= 3) {
        polygons.push({
          id: `prop-${cultura.propriedadeId}-${i}`,
          title: prop.nome ?? "Propriedade",
          coordinates: ring,
          color: "#0EA5E9",
        });
      }
    });
  }

  const ocorrencias = (await listOcorrencias(cultura.propriedadeId)).filter(
    (o) => o.culturaId === cultura.id,
  );
  const markers: CultivoMapaPayload["markers"] = [];
  for (const o of ocorrencias) {
    const olat = parseCoord(o.latitude != null ? String(o.latitude) : null);
    const olng = parseCoord(o.longitude != null ? String(o.longitude) : null);
    if (olat == null || olng == null) continue;
    markers.push({
      id: `oc-${o.id}`,
      latitude: olat,
      longitude: olng,
      title: o.titulo,
      description: `${o.categoria} · ${o.status}`,
    });
  }

  return {
    culturaId: cultura.id,
    propriedadeId: cultura.propriedadeId,
    terrenoId: cultura.terrenoId,
    terrenoNome,
    propriedadeNome: prop?.nome ?? null,
    propriedadeCenter:
      lat != null && lng != null ? { latitude: lat, longitude: lng } : null,
    polygons,
    markers,
  };
}
