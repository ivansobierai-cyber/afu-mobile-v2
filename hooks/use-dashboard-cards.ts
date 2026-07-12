import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const STORAGE_KEY = "afu:dashboard-cards";

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: "propriedades", visible: true },
  { id: "cultivos", visible: true },
  { id: "diagnostico", visible: true },
  { id: "laboratorio", visible: true },
  { id: "laudos", visible: true },
  { id: "eventos", visible: true },
  { id: "marketplace", visible: true },
  { id: "clima", visible: true },
  { id: "materiais", visible: true },
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
  const [cards, setCards] = useState<DashboardCardConfig[]>(DEFAULT_DASHBOARD_CARDS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as DashboardCardConfig[];
          if (Array.isArray(parsed)) {
            setCards(mergeWithDefaults(parsed.filter((c) => VALID_IDS.has(c.id))));
          }
        }
      } catch {
        // mantém defaults
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveCards = useCallback(async (next: DashboardCardConfig[]) => {
    const merged = mergeWithDefaults(next);
    setCards(merged);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }, []);

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
