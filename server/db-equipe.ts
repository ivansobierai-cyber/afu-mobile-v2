/**
 * Etapa 8 Passo 4 — equipe (reusa memberships) + alocações em tarefas.
 */
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  tarefaAlocacoes,
  InsertTarefaAlocacao,
  type InsertTarefaAlocacao as InsertAloc,
} from "../drizzle/schema";
import { listMembers } from "./db-organizations";
import type { OrgRole } from "../lib/security/org-roles";

export type PapelEquipe = "funcionario" | "operador" | "tecnico" | "agronomo";

/** Mapeia orgRole → papel de equipe do plano auxiliar. */
export function mapOrgRoleToPapelEquipe(role: string): PapelEquipe {
  switch (role as OrgRole) {
    case "agronomo":
      return "agronomo";
    case "operador":
      return "operador";
    case "consultor":
      return "tecnico";
    case "gerente":
    case "administrador":
    case "proprietario":
      return "funcionario";
    default:
      return "funcionario";
  }
}

export async function listEquipeOrganizacao(organizationId: number) {
  const members = await listMembers(organizationId);
  return members
    .filter((m) => m.status === "ativo")
    .map((m) => ({
      userId: m.userId,
      membershipId: m.id,
      nome: m.userName ?? m.userEmail ?? `Usuário #${m.userId}`,
      email: m.userEmail ?? null,
      orgRole: m.role,
      papelEquipe: mapOrgRoleToPapelEquipe(m.role),
      status: m.status,
    }));
}

export async function listAlocacoesPorTarefa(tarefaId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tarefaAlocacoes)
    .where(
      and(
        eq(tarefaAlocacoes.tarefaId, tarefaId),
        eq(tarefaAlocacoes.organizationId, organizationId),
      ),
    )
    .orderBy(desc(tarefaAlocacoes.createdAt));
}

export async function upsertAlocacaoTarefa(data: InsertTarefaAlocacao) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(tarefaAlocacoes)
    .where(
      and(
        eq(tarefaAlocacoes.tarefaId, data.tarefaId),
        eq(tarefaAlocacoes.userId, data.userId),
        eq(tarefaAlocacoes.organizationId, data.organizationId!),
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(tarefaAlocacoes)
      .set({
        papelEquipe: data.papelEquipe,
        horasPlanejadas: data.horasPlanejadas,
      })
      .where(
        and(
          eq(tarefaAlocacoes.id, existing[0].id),
          eq(tarefaAlocacoes.organizationId, data.organizationId!),
        ),
      );
    return existing[0].id;
  }
  const result = await db.insert(tarefaAlocacoes).values(data as InsertAloc);
  return result[0].insertId;
}

export async function removeAlocacaoTarefa(
  id: number,
  organizationId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db
    .delete(tarefaAlocacoes)
    .where(
      and(eq(tarefaAlocacoes.id, id), eq(tarefaAlocacoes.organizationId, organizationId)),
    );
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Alocação não encontrada");
  }
}
