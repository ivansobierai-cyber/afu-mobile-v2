import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  },
}));

import {
  alertaPrefsStorageKey,
  filtrarAlertasPorPreferencias,
  loadAlertaPreferencias,
  saveAlertaPreferencias,
} from "@/lib/propriedades/alerta-preferencias";
import type { AlertaPropriedade } from "@/lib/propriedades/alertas-engine";

const alertas: AlertaPropriedade[] = [
  {
    id: "info-1",
    titulo: "Info",
    motivo: "m",
    fonte: "f",
    gravidade: "info",
    acaoRecomendada: "a",
    entidadeTipo: "geometria",
    createdAt: "2026-07-14T12:00:00Z",
  },
  {
    id: "alto-1",
    titulo: "Alto",
    motivo: "m",
    fonte: "f",
    gravidade: "alto",
    acaoRecomendada: "a",
    entidadeTipo: "tarefa",
    createdAt: "2026-07-14T12:00:00Z",
  },
  {
    id: "critico-1",
    titulo: "Critico",
    motivo: "m",
    fonte: "f",
    gravidade: "critico",
    acaoRecomendada: "a",
    entidadeTipo: "estoque",
    createdAt: "2026-07-14T12:00:00Z",
  },
];

describe("alerta-preferencias", () => {
  beforeEach(() => store.clear());

  it("persiste preferências por usuário e organização", async () => {
    await saveAlertaPreferencias(7, 30, {
      gravidadeMinima: "alto",
      tiposOcultos: ["geometria"],
      snoozedIds: ["alto-1"],
    });
    expect(store.has(alertaPrefsStorageKey(7, 30))).toBe(true);
    await expect(loadAlertaPreferencias(7, 30)).resolves.toEqual({
      gravidadeMinima: "alto",
      tiposOcultos: ["geometria"],
      snoozedIds: ["alto-1"],
    });
  });

  it("filtra por gravidade, tipo e snooze sem ocultar crítico", () => {
    const filtrados = filtrarAlertasPorPreferencias(alertas, {
      gravidadeMinima: "alto",
      tiposOcultos: ["geometria"],
      snoozedIds: ["alto-1", "critico-1"],
    });
    expect(filtrados.map((a) => a.id)).toEqual(["critico-1"]);
  });
});
