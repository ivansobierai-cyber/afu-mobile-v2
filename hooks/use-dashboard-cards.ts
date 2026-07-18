import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOfflineTenantScope } from "@/hooks/use-offline-tenant-scope";
import { localDbStorageKey } from "@/lib/offline/tenant-scope";

export type DashboardCardId =
  | "propriedades"
  | "cultivos"
  | "diagnostico"
  | "laboratorio"
  | "laudos"
  | "eventos"
  | "marketplace"
  | "clima"
  | "materiais";

export type DashboardCardConfig = {
  id: DashboardCardId;
  visible: boolean;
};

/** Legado global; preferências passam a ser por user+org (Etapa 8) */
const LEGACY_STORAGE_KEY = "afu:dashboard-cards:v2";

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: "propriedades", visible: true },
  { id: "cultivos", visible: true },
  { id: "diagnostico", visible: true },
  { id: "eventos", visible: true },
  { id: "laboratorio", visible: false },
  { id: "laudos", visible: false },
  { id: "marketplace", visible: false },
  { id: "clima", visible: false },
  { id: "materiais", visible: false },
];

const VALID_IDS = new Set<string>(DEFAULT_DASHBOARD_CARDS.map((c) => c.id));

function mergeWithDefaults(saved: DashboardCardConfig[]): DashboardCardConfig[] {
  const byId = new Map(saved.map((c) => [c.id, c]));
  const merged: DashboardCardConfig[] = [];

  for (const def of DEFAULT_DASHBOARD_CARDS) {
    merged.push(byId.get(def.id) ?? def);
    byId.delete(def.id);
  }

  for (const extra of byId.values()) {
    if (VALID_IDS.has(extra.id)) merged.push(extra);
  }

  return merged;
}

export function useDashboardCards() {
  const { scope } = useOfflineTenantScope();
  const [cards, setCards] = useState<DashboardCardConfig[]>(DEFAULT_DASHBOARD_CARDS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = scope
          ? localDbStorageKey(scope, "prefs", "dashboard-cards")
          : LEGACY_STORAGE_KEY;
        const raw = await AsyncStorage.getItem(key);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as DashboardCardConfig[];
          if (Array.isArray(parsed)) {
            setCards(mergeWithDefaults(parsed.filter((c) => VALID_IDS.has(c.id))));
          }
        } else {
          setCards(DEFAULT_DASHBOARD_CARDS);
        }
      } catch {
        // mantém defaults
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [scope?.userId, scope?.organizationId, scope?.deviceId]);

  const saveCards = useCallback(async (next: DashboardCardConfig[]) => {
    const merged = mergeWithDefaults(next);
    setCards(merged);
    const key = scope
      ? localDbStorageKey(scope, "prefs", "dashboard-cards")
      : LEGACY_STORAGE_KEY;
    await AsyncStorage.setItem(key, JSON.stringify(merged));
  }, [scope]);

  const moveCard = useCallback(
    (id: DashboardCardId, direction: "up" | "down") => {
      const idx = cards.findIndex((c) => c.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= cards.length) return;
      const next = [...cards];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      void saveCards(next);
    },
    [cards, saveCards],
  );

  const toggleVisible = useCallback(
    (id: DashboardCardId) => {
      const next = cards.map((c) =>
        c.id === id ? { ...c, visible: !c.visible } : c,
      );
      void saveCards(next);
    },
    [cards, saveCards],
  );

  const resetCards = useCallback(() => {
    void saveCards(DEFAULT_DASHBOARD_CARDS);
  }, [saveCards]);

  return {
    cards,
    loaded,
    moveCard,
    toggleVisible,
    resetCards,
  };
}
