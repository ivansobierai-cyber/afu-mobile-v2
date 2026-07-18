/**
 * Etapa 8 — registro server-side de conflitos de sincronização offline.
 */
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { syncConflicts, type InsertSyncConflict } from "../drizzle/schema";
import { writeAuditLog } from "./private-files";

export async function recordServerSyncConflict(
  entry: InsertSyncConflict,
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(syncConflicts).values(entry);
  const id = result[0].insertId;
  await writeAuditLog({
    organizationId: entry.organizationId,
    actorUserId: entry.actorUserId ?? undefined,
    action: "sync.conflict",
    resourceType: entry.resourceType ?? entry.entity,
    resourceId: entry.resourceId ?? undefined,
    meta: JSON.stringify({
      reason: entry.reason,
      clientMutationId: entry.clientMutationId,
      deviceId: entry.deviceId,
      message: entry.message,
    }),
  });
  return id;
}

export async function listOpenSyncConflicts(organizationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(syncConflicts)
    .where(
      and(
        eq(syncConflicts.organizationId, organizationId),
        eq(syncConflicts.status, "aberto"),
      ),
    )
    .orderBy(desc(syncConflicts.createdAt))
    .limit(limit);
}

export async function resolveServerSyncConflict(
  organizationId: number,
  conflictId: number,
  resolvedByUserId: number,
  status: "resolvido" | "descartado" = "resolvido",
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(syncConflicts)
    .set({
      status,
      resolvedByUserId,
      resolvedAt: new Date(),
    })
    .where(
      and(
        eq(syncConflicts.id, conflictId),
        eq(syncConflicts.organizationId, organizationId),
      ),
    );
}
