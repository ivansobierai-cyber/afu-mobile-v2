/**
 * WP-06 — helpers de gestão administrativa de produtores.
 * Isolado de db-auth / auth-router (PR #61) para reduzir conflito de merge.
 */
import * as crypto from "node:crypto";
import { desc, eq, or, sql, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  users,
  usuariosAfu,
  produtores,
  propriedades,
  diagnosticosIa,
  analisesFitotecnicas,
  type InsertProdutor,
} from "../drizzle/schema";

export type PlanoProdutor = "free" | "produtor" | "pro" | "enterprise";

export type ProdutorAdminListItem = {
  produtorId: number | null;
  usuarioAfuId: number;
  userId: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: "ativo" | "inativo" | "suspenso";
  role: "user" | "admin";
  tipoUsuario: string;
  cadastroAtivo: boolean | null;
  plano: PlanoProdutor | null;
  cidade: string | null;
  estado: string | null;
  regiao: string | null;
  tipoProdutor: string | null;
  organizationId: number | null;
  propriedadesCount: number;
  diagnosticosCount: number;
  createdAt: Date | null;
  lastSignedIn: Date | null;
};

export type ProdutorAdminDetalhe = ProdutorAdminListItem & {
  documento: string | null;
  pais: string | null;
  propriedades: Array<{
    id: number;
    nome: string;
    cidade: string | null;
    estado: string | null;
    tamanhoArea: string | null;
    unidadeArea: string | null;
    tipoProducao: string | null;
    archivedAt: Date | null;
    createdAt: Date;
  }>;
  atividadeRecente: Array<{
    tipo: "diagnostico" | "analise";
    id: number;
    propriedadeId: number | null;
    titulo: string;
    gravidadeOuTipo: string | null;
    createdAt: Date;
  }>;
  contagens: {
    propriedadesAtivas: number;
    propriedadesArquivadas: number;
    diagnosticos: number;
    analises: number;
  };
};

export async function listarProdutoresAdmin(opts?: {
  busca?: string;
  status?: "ativo" | "inativo" | "suspenso";
  estado?: string;
  cidade?: string;
  regiao?: string;
  plano?: PlanoProdutor;
  cadastroAtivo?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ produtores: ProdutorAdminListItem[]; total: number }> {
  const db = await getDb();
  if (!db) return { produtores: [], total: 0 };

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  // Base: perfis tipo produtor (+ quem já tem linha em produtores)
  const rows = await db
    .select({
      usuarioAfuId: usuariosAfu.id,
      userId: usuariosAfu.userId,
      nome: usuariosAfu.nome,
      email: usuariosAfu.email,
      telefone: usuariosAfu.telefone,
      status: usuariosAfu.status,
      tipoUsuario: usuariosAfu.tipoUsuario,
      perfilCreatedAt: usuariosAfu.createdAt,
      role: users.role,
      lastSignedIn: users.lastSignedIn,
      produtorId: produtores.id,
      cadastroAtivo: produtores.cadastroAtivo,
      plano: produtores.plano,
      cidade: produtores.cidade,
      estado: produtores.estado,
      regiao: produtores.regiao,
      tipoProdutor: produtores.tipoProdutor,
      organizationId: produtores.organizationId,
      produtorCreatedAt: produtores.createdAt,
    })
    .from(usuariosAfu)
    .innerJoin(users, eq(users.id, usuariosAfu.userId))
    .leftJoin(produtores, eq(produtores.usuarioId, usuariosAfu.id))
    .where(
      or(
        eq(usuariosAfu.tipoUsuario, "produtor"),
        sql`${produtores.id} IS NOT NULL`,
      ),
    )
    .orderBy(desc(usuariosAfu.createdAt))
    .limit(500);

  let filtered = rows;

  if (opts?.busca) {
    const q = opts.busca.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.nome?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.cidade?.toLowerCase().includes(q) ||
        r.estado?.toLowerCase().includes(q) ||
        r.regiao?.toLowerCase().includes(q) ||
        String(r.produtorId ?? "").includes(q),
    );
  }
  if (opts?.status) filtered = filtered.filter((r) => r.status === opts.status);
  if (opts?.estado) {
    const e = opts.estado.toLowerCase();
    filtered = filtered.filter((r) => r.estado?.toLowerCase() === e);
  }
  if (opts?.cidade) {
    const c = opts.cidade.toLowerCase();
    filtered = filtered.filter((r) => r.cidade?.toLowerCase().includes(c));
  }
  if (opts?.regiao) {
    const r0 = opts.regiao.toLowerCase();
    filtered = filtered.filter((r) => r.regiao?.toLowerCase().includes(r0));
  }
  if (opts?.plano) filtered = filtered.filter((r) => r.plano === opts.plano);
  if (opts?.cadastroAtivo !== undefined) {
    filtered = filtered.filter((r) => (r.cadastroAtivo ?? true) === opts.cadastroAtivo);
  }

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  const items: ProdutorAdminListItem[] = [];
  for (const r of page) {
    let propriedadesCount = 0;
    let diagnosticosCount = 0;
    if (r.produtorId != null) {
      const [propCount] = await db
        .select({ c: count() })
        .from(propriedades)
        .where(eq(propriedades.produtorId, r.produtorId));
      propriedadesCount = Number(propCount?.c ?? 0);

      const [diagCount] = await db
        .select({ c: count() })
        .from(diagnosticosIa)
        .where(eq(diagnosticosIa.usuarioId, r.usuarioAfuId));
      diagnosticosCount = Number(diagCount?.c ?? 0);
    } else {
      const [diagCount] = await db
        .select({ c: count() })
        .from(diagnosticosIa)
        .where(eq(diagnosticosIa.usuarioId, r.usuarioAfuId));
      diagnosticosCount = Number(diagCount?.c ?? 0);
    }

    items.push({
      produtorId: r.produtorId ?? null,
      usuarioAfuId: r.usuarioAfuId,
      userId: r.userId,
      nome: r.nome,
      email: r.email,
      telefone: r.telefone,
      status: r.status,
      role: r.role,
      tipoUsuario: r.tipoUsuario,
      cadastroAtivo: r.cadastroAtivo ?? null,
      plano: (r.plano as PlanoProdutor | null) ?? null,
      cidade: r.cidade,
      estado: r.estado,
      regiao: r.regiao,
      tipoProdutor: r.tipoProdutor,
      organizationId: r.organizationId,
      propriedadesCount,
      diagnosticosCount,
      createdAt: r.produtorCreatedAt ?? r.perfilCreatedAt,
      lastSignedIn: r.lastSignedIn,
    });
  }

  return { produtores: items, total };
}

export async function getProdutorAdminDetalhe(
  produtorIdOrUserId: { produtorId?: number; userId?: number },
): Promise<ProdutorAdminDetalhe | null> {
  const db = await getDb();
  if (!db) return null;

  let usuarioAfuId: number | null = null;
  let produtorRow: typeof produtores.$inferSelect | null = null;

  if (produtorIdOrUserId.produtorId != null) {
    const rows = await db
      .select()
      .from(produtores)
      .where(eq(produtores.id, produtorIdOrUserId.produtorId))
      .limit(1);
    produtorRow = rows[0] ?? null;
    usuarioAfuId = produtorRow?.usuarioId ?? null;
  } else if (produtorIdOrUserId.userId != null) {
    const perfil = await db
      .select()
      .from(usuariosAfu)
      .where(eq(usuariosAfu.userId, produtorIdOrUserId.userId))
      .limit(1);
    if (!perfil[0]) return null;
    usuarioAfuId = perfil[0].id;
    const rows = await db
      .select()
      .from(produtores)
      .where(eq(produtores.usuarioId, usuarioAfuId))
      .limit(1);
    produtorRow = rows[0] ?? null;
  }

  if (usuarioAfuId == null) return null;

  const perfilRows = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.id, usuarioAfuId))
    .limit(1);
  const perfil = perfilRows[0];
  if (!perfil) return null;

  const userRows = await db.select().from(users).where(eq(users.id, perfil.userId)).limit(1);
  const user = userRows[0];
  if (!user) return null;

  const props =
    produtorRow != null
      ? await db
          .select({
            id: propriedades.id,
            nome: propriedades.nome,
            cidade: propriedades.cidade,
            estado: propriedades.estado,
            tamanhoArea: propriedades.tamanhoArea,
            unidadeArea: propriedades.unidadeArea,
            tipoProducao: propriedades.tipoProducao,
            archivedAt: propriedades.archivedAt,
            createdAt: propriedades.createdAt,
          })
          .from(propriedades)
          .where(eq(propriedades.produtorId, produtorRow.id))
          .orderBy(desc(propriedades.createdAt))
      : [];

  const diags = await db
    .select({
      id: diagnosticosIa.id,
      propriedadeId: diagnosticosIa.propriedadeId,
      pragaProvavel: diagnosticosIa.pragaProvavel,
      doencaProvavel: diagnosticosIa.doencaProvavel,
      gravidade: diagnosticosIa.gravidade,
      createdAt: diagnosticosIa.dataDiagnostico,
    })
    .from(diagnosticosIa)
    .where(eq(diagnosticosIa.usuarioId, usuarioAfuId))
    .orderBy(desc(diagnosticosIa.dataDiagnostico))
    .limit(20);

  const analises = await db
    .select({
      id: analisesFitotecnicas.id,
      propriedadeId: analisesFitotecnicas.propriedadeId,
      tipoAnalise: analisesFitotecnicas.tipoAnalise,
      createdAt: analisesFitotecnicas.dataAnalise,
    })
    .from(analisesFitotecnicas)
    .where(eq(analisesFitotecnicas.usuarioId, usuarioAfuId))
    .orderBy(desc(analisesFitotecnicas.dataAnalise))
    .limit(20);

  const atividadeRecente: ProdutorAdminDetalhe["atividadeRecente"] = [
    ...diags.map((d) => ({
      tipo: "diagnostico" as const,
      id: d.id,
      propriedadeId: d.propriedadeId,
      titulo: d.doencaProvavel || d.pragaProvavel || "Diagnóstico IA",
      gravidadeOuTipo: d.gravidade,
      createdAt: d.createdAt,
    })),
    ...analises.map((a) => ({
      tipo: "analise" as const,
      id: a.id,
      propriedadeId: a.propriedadeId,
      titulo: `Análise ${a.tipoAnalise}`,
      gravidadeOuTipo: a.tipoAnalise,
      createdAt: a.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);

  const propriedadesAtivas = props.filter((p) => !p.archivedAt).length;
  const propriedadesArquivadas = props.filter((p) => !!p.archivedAt).length;

  return {
    produtorId: produtorRow?.id ?? null,
    usuarioAfuId: perfil.id,
    userId: user.id,
    nome: perfil.nome,
    email: perfil.email ?? user.email,
    telefone: perfil.telefone,
    status: perfil.status,
    role: user.role,
    tipoUsuario: perfil.tipoUsuario,
    cadastroAtivo: produtorRow?.cadastroAtivo ?? null,
    plano: (produtorRow?.plano as PlanoProdutor | undefined) ?? null,
    cidade: produtorRow?.cidade ?? null,
    estado: produtorRow?.estado ?? null,
    regiao: produtorRow?.regiao ?? null,
    tipoProdutor: produtorRow?.tipoProdutor ?? null,
    organizationId: produtorRow?.organizationId ?? perfil.activeOrganizationId ?? null,
    propriedadesCount: props.length,
    diagnosticosCount: diags.length,
    createdAt: produtorRow?.createdAt ?? perfil.createdAt,
    lastSignedIn: user.lastSignedIn,
    documento: produtorRow?.documento ?? null,
    pais: produtorRow?.pais ?? null,
    propriedades: props.map((p) => ({
      ...p,
      tamanhoArea: p.tamanhoArea != null ? String(p.tamanhoArea) : null,
    })),
    atividadeRecente,
    contagens: {
      propriedadesAtivas,
      propriedadesArquivadas,
      diagnosticos: diags.length,
      analises: analises.length,
    },
  };
}

export async function ensureProdutorRow(opts: {
  usuarioAfuId: number;
  organizationId?: number | null;
  cidade?: string | null;
  estado?: string | null;
  regiao?: string | null;
  documento?: string | null;
  tipoProdutor?: InsertProdutor["tipoProdutor"];
  plano?: PlanoProdutor;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(produtores)
    .where(eq(produtores.usuarioId, opts.usuarioAfuId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(produtores)
      .set({
        ...(opts.organizationId != null ? { organizationId: opts.organizationId } : {}),
        ...(opts.cidade !== undefined ? { cidade: opts.cidade } : {}),
        ...(opts.estado !== undefined ? { estado: opts.estado } : {}),
        ...(opts.regiao !== undefined ? { regiao: opts.regiao } : {}),
        ...(opts.documento !== undefined ? { documento: opts.documento } : {}),
        ...(opts.tipoProdutor ? { tipoProdutor: opts.tipoProdutor } : {}),
        ...(opts.plano ? { plano: opts.plano } : {}),
      })
      .where(eq(produtores.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(produtores).values({
    usuarioId: opts.usuarioAfuId,
    organizationId: opts.organizationId ?? null,
    cidade: opts.cidade ?? null,
    estado: opts.estado ?? null,
    regiao: opts.regiao ?? null,
    documento: opts.documento ?? null,
    tipoProdutor: opts.tipoProdutor ?? "comercial",
    plano: opts.plano ?? "free",
    cadastroAtivo: true,
  });
  return Number(result[0].insertId);
}

export async function setProdutorCadastroAtivo(
  produtorId: number,
  cadastroAtivo: boolean,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(produtores)
    .set({ cadastroAtivo })
    .where(eq(produtores.id, produtorId));
}

export async function setProdutorPlano(
  produtorId: number,
  plano: PlanoProdutor,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(produtores).set({ plano }).where(eq(produtores.id, produtorId));
}

export async function getEstatisticasProdutoresAdmin(): Promise<{
  totalPerfisProdutor: number;
  totalComCadastro: number;
  ativos: number;
  suspensos: number;
  inativos: number;
  cadastroInativo: number;
  porPlano: Record<string, number>;
  porEstado: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalPerfisProdutor: 0,
      totalComCadastro: 0,
      ativos: 0,
      suspensos: 0,
      inativos: 0,
      cadastroInativo: 0,
      porPlano: {},
      porEstado: {},
    };
  }

  const { produtores: list } = await listarProdutoresAdmin({ limit: 500, offset: 0 });
  const porPlano: Record<string, number> = {};
  const porEstado: Record<string, number> = {};
  for (const p of list) {
    const plano = p.plano ?? "sem_plano";
    porPlano[plano] = (porPlano[plano] ?? 0) + 1;
    if (p.estado) porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
  }

  return {
    totalPerfisProdutor: list.length,
    totalComCadastro: list.filter((p) => p.produtorId != null).length,
    ativos: list.filter((p) => p.status === "ativo").length,
    suspensos: list.filter((p) => p.status === "suspenso").length,
    inativos: list.filter((p) => p.status === "inativo").length,
    cadastroInativo: list.filter((p) => p.cadastroAtivo === false).length,
    porPlano,
    porEstado,
  };
}

/** Gera senha temporária forte (não logar). */
export function generateTempPassword(): string {
  return `AfU!${crypto.randomBytes(9).toString("base64url")}`;
}
