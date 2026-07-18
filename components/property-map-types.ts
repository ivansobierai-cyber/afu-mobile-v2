export interface MapMarker {
  id: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

/** Anel de polígono em lat/lng (Etapa 5). */
export interface MapPolygon {
  id: string | number;
  coordinates: { latitude: number; longitude: number }[];
  title?: string;
  color?: string;
  strokeColor?: string;
}
