import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  pilotoParticipantes,
  pilotoFeedback,
  pilotoMetricas,
  InsertPilotoParticipante,
  InsertPilotoFeedback,
} from "../drizzle/schema";

export async function criarParticipante(data: InsertPilotoParticipante) {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const result = await db.insert(pilotoParticipantes).values(data);
  return Number(result[0].insertId);
}

export async function listarParticipantes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pilotoParticipantes).orderBy(desc(pilotoParticipantes.createdAt));
}

export async function criarFeedback(data: InsertPilotoFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const result = await db.insert(pilotoFeedback).values(data);
  return Number(result[0].insertId);
}

export async function listarFeedback() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pilotoFeedback).orderBy(desc(pilotoFeedback.createdAt));
}

export async function resumoPiloto() {
  const db = await getDb();
  if (!db) {
    return { totalParticipantes: 0, totalFeedback: 0, mediaNps: 0 };
  }

  const participantes = await db.select().from(pilotoParticipantes);
  const feedbacks = await db.select().from(pilotoFeedback);

  const mediaNps =
    feedbacks.length > 0
      ? feedbacks.reduce((acc, f) => acc + f.notaNps, 0) / feedbacks.length
      : 0;

  return {
    totalParticipantes: participantes.length,
    totalFeedback: feedbacks.length,
    mediaNps: Math.round(mediaNps * 10) / 10,
  };
}

export async function registrarMetrica(tipo: string, valor: number, metadata?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(pilotoMetricas).values({
    tipo,
    valor: String(valor),
    metadata,
  });
}
