/**
 * Etapa 2 — organizações, memberships e organização ativa.
 */
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import {
  organizations,
  organizationMemberships,
  usuariosAfu,
  produtores,
  users,
  type Organization,
  type OrganizationMembership,
} from "../drizzle/schema";
import type { OrgRole } from "../lib/security/org-roles";

export type MembershipWithOrg = {
  membership: OrganizationMembership;
  organization: Organization;
};

export async function listActiveMemberships(userId: number): Promise<MembershipWithOrg[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      membership: organizationMemberships,
      organization: organizations,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.status, "ativo"),
        eq(organizations.status, "ativa"),
      ),
    );
  return rows;
}

export async function getActiveMembership(
  userId: number,
  organizationId: number,
): Promise<MembershipWithOrg | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      membership: organizationMemberships,
      organization: organizations,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "ativo"),
        eq(organizations.status, "ativa"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getOrganizationById(id: number): Promise<Organization | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return rows[0];
}

export async function setActiveOrganizationId(usuarioAfuId: number, organizationId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(usuariosAfu)
    .set({ activeOrganizationId: organizationId })
    .where(eq(usuariosAfu.id, usuarioAfuId));
}

export async function createOrganization(input: {
  nome: string;
  tipo?: Organization["tipo"];
  ownerUserId: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(organizations).values({
    nome: input.nome,
    tipo: input.tipo ?? "produtor_individual",
    status: "ativa",
    ownerUserId: input.ownerUserId,
  });
  return result[0].insertId;
}

export async function createMembership(input: {
  organizationId: number;
  userId: number;
  role: OrgRole;
  status?: OrganizationMembership["status"];
  invitedByUserId?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(organizationMemberships).values({
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role,
    status: input.status ?? "ativo",
    invitedByUserId: input.invitedByUserId,
  });
  return result[0].insertId;
}

export async function listMembers(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: organizationMemberships.id,
      userId: organizationMemberships.userId,
      role: organizationMemberships.role,
      status: organizationMemberships.status,
      joinedAt: organizationMemberships.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(organizationMemberships)
    .innerJoin(users, eq(users.id, organizationMemberships.userId))
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        ne(organizationMemberships.status, "removido"),
      ),
    );
}

export async function updateMembershipRole(
  membershipId: number,
  organizationId: number,
  role: OrgRole,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(organizationMemberships)
    .set({ role })
    .where(
      and(
        eq(organizationMemberships.id, membershipId),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    );
}

export async function setMembershipStatus(
  membershipId: number,
  organizationId: number,
  status: OrganizationMembership["status"],
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(organizationMemberships)
    .set({ status })
    .where(
      and(
        eq(organizationMemberships.id, membershipId),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    );
}

/**
 * Garante org pessoal + membership proprietário + ligação do produtor.
 * Idempotente.
 */
export async function ensurePersonalOrganization(userId: number): Promise<{
  organizationId: number;
  created: boolean;
}> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const existing = await listActiveMemberships(userId);
  const personal = existing.find(
    (m) =>
      m.membership.role === "proprietario" &&
      m.organization.tipo === "produtor_individual" &&
      m.organization.ownerUserId === userId,
  );
  if (personal) {
    await linkProdutorToOrg(userId, personal.organization.id);
    await ensureActiveOrgSet(userId, personal.organization.id);
    return { organizationId: personal.organization.id, created: false };
  }

  // Membership proprietário em qualquer org ativa?
  const asOwner = existing.find((m) => m.membership.role === "proprietario");
  if (asOwner) {
    await linkProdutorToOrg(userId, asOwner.organization.id);
    await ensureActiveOrgSet(userId, asOwner.organization.id);
    return { organizationId: asOwner.organization.id, created: false };
  }

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  const nome = user?.name?.trim() || user?.email || `Organização ${userId}`;

  const orgId = await createOrganization({
    nome: `${nome}`,
    tipo: "produtor_individual",
    ownerUserId: userId,
  });
  await createMembership({
    organizationId: orgId,
    userId,
    role: "proprietario",
    status: "ativo",
  });
  await linkProdutorToOrg(userId, orgId);
  await ensureActiveOrgSet(userId, orgId);
  return { organizationId: orgId, created: true };
}

async function ensureActiveOrgSet(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return;
  const perfilRows = await db.select().from(usuariosAfu).where(eq(usuariosAfu.userId, userId)).limit(1);
  const perfil = perfilRows[0];
  if (!perfil) return;
  if (!perfil.activeOrganizationId) {
    await setActiveOrganizationId(perfil.id, organizationId);
  } else {
    // Se active aponta para org sem membership, corrige
    const ok = await getActiveMembership(userId, perfil.activeOrganizationId);
    if (!ok) await setActiveOrganizationId(perfil.id, organizationId);
  }
}

async function linkProdutorToOrg(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return;
  const perfilRows = await db.select().from(usuariosAfu).where(eq(usuariosAfu.userId, userId)).limit(1);
  const perfil = perfilRows[0];
  if (!perfil) return;
  const prodRows = await db
    .select()
    .from(produtores)
    .where(eq(produtores.usuarioId, perfil.id))
    .limit(1);
  const prod = prodRows[0];
  if (!prod) return;
  if (prod.organizationId !== organizationId) {
    await db
      .update(produtores)
      .set({ organizationId })
      .where(eq(produtores.id, prod.id));
  }
}

/** Backfill: uma org pessoal por usuário com perfil AFU */
export async function backfillPersonalOrganizations(): Promise<{
  processed: number;
  created: number;
}> {
  const db = await getDb();
  if (!db) return { processed: 0, created: 0 };
  const perfis = await db.select({ userId: usuariosAfu.userId }).from(usuariosAfu);
  let created = 0;
  for (const p of perfis) {
    const r = await ensurePersonalOrganization(p.userId);
    if (r.created) created += 1;
  }
  return { processed: perfis.length, created };
}

export async function resolveSessionOrganization(userId: number): Promise<{
  organizations: Array<{
    id: number;
    nome: string;
    tipo: Organization["tipo"];
    role: OrgRole;
    status: Organization["status"];
  }>;
  activeOrganizationId: number | null;
  activeRole: OrgRole | null;
}> {
  /**
   * Etapa 10 — NÃO chamar ensurePersonalOrganization aqui.
   * Recriar org/membership em toda resolução mascarava remoção de acesso
   * e permitia "sync" após membership removido.
   * ensurePersonalOrganization fica em signup / login / backfill explícito.
   */
  const memberships = await listActiveMemberships(userId);
  const db = await getDb();
  let activeOrganizationId: number | null = null;
  if (db) {
    const perfilRows = await db.select().from(usuariosAfu).where(eq(usuariosAfu.userId, userId)).limit(1);
    activeOrganizationId = perfilRows[0]?.activeOrganizationId ?? null;
  }
  if (
    activeOrganizationId &&
    !memberships.some((m) => m.organization.id === activeOrganizationId)
  ) {
    // Membership perdido na org ativa → limpa escopo (não recria org silenciosamente)
    activeOrganizationId = memberships[0]?.organization.id ?? null;
    if (db) {
      const perfilRows = await db.select().from(usuariosAfu).where(eq(usuariosAfu.userId, userId)).limit(1);
      if (perfilRows[0]) {
        await setActiveOrganizationId(perfilRows[0].id, activeOrganizationId);
      }
    }
  }
  if (!activeOrganizationId && memberships[0]) {
    activeOrganizationId = memberships[0].organization.id;
  }

  const active = memberships.find((m) => m.organization.id === activeOrganizationId);

  return {
    organizations: memberships.map((m) => ({
      id: m.organization.id,
      nome: m.organization.nome,
      tipo: m.organization.tipo,
      role: m.membership.role as OrgRole,
      status: m.organization.status,
    })),
    activeOrganizationId,
    activeRole: (active?.membership.role as OrgRole) ?? null,
  };
}
