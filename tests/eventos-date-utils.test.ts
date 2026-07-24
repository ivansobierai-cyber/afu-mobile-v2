import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildMonthGrid,
  groupByDateKey,
  startOfMonth,
  toDateKey,
} from "../lib/eventos/date-utils";

describe("eventos date-utils", () => {
  it("toDateKey formata YYYY-MM-DD em horário local", () => {
    expect(toDateKey(new Date(2026, 6, 14))).toBe("2026-07-14");
  });

  it("buildMonthGrid gera 42 células e inclui o mês", () => {
    const month = startOfMonth(new Date(2026, 6, 1));
    const grid = buildMonthGrid(month, new Date(2026, 6, 14));
    expect(grid).toHaveLength(42);
    expect(grid.filter((c) => c.inMonth).length).toBe(31);
    const today = grid.find((c) => c.key === "2026-07-14");
    expect(today?.isToday).toBe(true);
  });

  it("addMonths navega meses", () => {
    const next = addMonths(new Date(2026, 6, 1), 1);
    expect(next.getMonth()).toBe(7);
    expect(next.getFullYear()).toBe(2026);
  });

  it("groupByDateKey agrupa e ordena", () => {
    const groups = groupByDateKey(
      [
        { id: 2, data: "2026-07-16T10:00:00" },
        { id: 1, data: "2026-07-14T08:00:00" },
        { id: 3, data: "2026-07-14T12:00:00" },
      ],
      (i) => i.data,
    );
    expect(groups.map((g) => g.key)).toEqual(["2026-07-14", "2026-07-16"]);
    expect(groups[0]?.items).toHaveLength(2);
  });
});
