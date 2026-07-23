/**
 * Cultivos V2 — histórico de fases fenológicas (cultivo_fase_eventos).
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  cultivoFaseEventos,
  type InsertCultivoFaseEvento,
} from "../drizzle/schema";

export type OrigemFaseCultivo = "manual" | "api" | "backfill" | "sistema";

export async function insertCultivoFaseEvento(
  data: Omit<InsertCultivoFaseEvento, "id" | "createdAt"> & {
    origem?: OrigemFaseCultivo;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cultivoFaseEventos).values({
    organizationId: data.organizationId,
    propriedadeId: data.propriedadeId,
    culturaId: data.culturaId,
    faseAnterior: data.faseAnterior ?? null,
    faseNova: data.faseNova,
    dataEvento: data.dataEvento ?? new Date(),
    origem: data.origem ?? "manual",
    userId: data.userId ?? null,
    observacao: data.observacao ?? null,
  });
  return result[0].insertId;
}

/** Registra evento apenas se a fase mudou de fato. */
export async function recordFaseChangeIfNeeded(params: {
  organizationId: number;
  propriedadeId: number;
  culturaId: number;
  faseAnterior: string | null | undefined;
  faseNova: string | null | undefined;
  userId?: number | null;
  origem?: OrigemFaseCultivo;
}) {
  const nova = params.faseNova?.trim() || null;
  if (!nova) return null;
  const anterior = params.faseAnterior?.trim() || null;
  if (anterior === nova) return null;
  return insertCultivoFaseEvento({
    organizationId: params.organizationId,
    propriedadeId: params.propriedadeId,
    culturaId: params.culturaId,
    faseAnterior: anterior,
    faseNova: nova,
    userId: params.userId ?? null,
    origem: params.origem ?? "manual",
  });
}

export async function listCultivoFaseEventos(
  organizationId: number,
  culturaId: number,
  opts?: { order?: "asc" | "desc"; limit?: number },
) {
  const db = await getDb();
  if (!db) return [];
  const orderFn = opts?.order === "asc" ? asc : desc;
  const q = db
    .select()
    .from(cultivoFaseEventos)
    .where(
      and(
        eq(cultivoFaseEventos.organizationId, organizationId),
        eq(cultivoFaseEventos.culturaId, culturaId),
      ),
    )
    .orderBy(orderFn(cultivoFaseEventos.dataEvento));
  if (opts?.limit && opts.limit > 0) {
    return q.limit(opts.limit);
  }
  return q;
}
