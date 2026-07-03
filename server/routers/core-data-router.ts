/**
 * core-data-router.ts — Router tRPC para dados centrais do AFU
 * Cobre: Propriedades, Terrenos, Cultivos (culturas), Calendário de Cuidados
 * Todos os endpoints são protectedProcedure (requerem autenticação).
 * A lógica de isolamento por usuário é feita via usuarioAfu.id.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getUsuarioAfuByUserId,
  getPropriedades,
  getPropriedadeById,
  createPropriedade,
  updatePropriedade,
  deletePropriedade,
  getTerrenosByPropriedade,
  createTerreno,
  updateTerreno,
  deleteTerreno,
  getCulturas,
  getCulturasByPropriedade,
  createCultura,
  updateCultura,
  deleteCultura,
  getCalendario,
  createEvento,
  updateEvento,
  deleteEvento,
} from "../db";
import { getDb } from "../db";
import { produtores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Helper: obter produtorId a partir do userId ──────────────────────────────
async function getProdutorId(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select({ id: produtores.id })
    .from(produtores)
    .where(eq(produtores.usuarioId, userId))
    .limit(1);
  if (rows.length === 0) {
    // Cria registro de produtor automaticamente se não existir
    const result = await db.insert(produtores).values({ usuarioId: userId });
    return (result as any).insertId as number;
  }
  return rows[0].id;
}

// ─── Schemas de input ─────────────────────────────────────────────────────────
const propriedadeInput = z.object({
  nome: z.string().min(1).max(150),
  cidade: z.string().max(100).optional(),
  estado: z.string().max(100).optional(),
  tamanhoArea: z.number().positive().optional(),
  unidadeArea: z.enum(["ha", "alqueire", "m2"]).optional(),
  tipoSolo: z.string().max(100).optional(),
  fonteAgua: z.string().max(100).optional(),
  sistemaIrrigacao: z.string().max(100).optional(),
  tipoProducao: z
    .enum(["graos", "hortifruti", "fruticultura", "cana", "cafe", "pecuaria", "misto", "outro"])
    .optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const terrenoInput = z.object({
  propriedadeId: z.number().int().positive(),
  nome: z.string().min(1).max(100),
  area: z.number().positive().optional(),
  tipoSolo: z.string().max(100).optional(),
  sistemaIrrigacao: z.string().max(100).optional(),
  observacoes: z.string().optional(),
});

const cultivoInput = z.object({
  propriedadeId: z.number().int().positive(),
  terrenoId: z.number().int().positive().optional(),
  nomeCultura: z.string().min(1).max(100),
  variedade: z.string().max(100).optional(),
  dataPlantio: z.string().optional(), // ISO date string
  faseAtual: z.string().max(100).optional(),
  areaPlantada: z.number().positive().optional(),
  previsaoColheita: z.string().optional(),
  producaoEstimada: z.number().positive().optional(),
  unidadeProducao: z.string().max(30).optional(),
  status: z.enum(["planejado", "em_andamento", "colhido", "perdido"]).optional(),
  observacoes: z.string().optional(),
});

const eventoInput = z.object({
  propriedadeId: z.number().int().positive().optional(),
  culturaId: z.number().int().positive().optional(),
  tipoAtividade: z.enum([
    "plantio", "irrigacao", "adubacao", "pulverizacao",
    "monitoramento", "colheita", "analise", "manutencao", "outro",
  ]),
  titulo: z.string().min(1).max(200),
  descricao: z.string().optional(),
  dataProgramada: z.string(), // ISO datetime string
  recorrencia: z.enum(["nenhuma", "diaria", "semanal", "quinzenal", "mensal"]).optional(),
  prioridade: z.enum(["baixa", "normal", "alta", "critica"]).optional(),
  status: z.enum(["pendente", "em_andamento", "concluido", "cancelado"]).optional(),
  lembreteAtivo: z.boolean().optional(),
});

// ─── Router de Propriedades ───────────────────────────────────────────────────
const propriedadesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return [];
    const produtorId = await getProdutorId(perfil.id);
    return getPropriedades(produtorId);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const prop = await getPropriedadeById(input.id);
      if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "Propriedade não encontrada" });
      return prop;
    }),

  create: protectedProcedure
    .input(propriedadeInput)
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      const produtorId = await getProdutorId(perfil.id);
      return createPropriedade({
        ...input,
        produtorId,
        tamanhoArea: input.tamanhoArea?.toString(),
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
      } as any);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), data: propriedadeInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      await getPropriedadeById(input.id); // verifica existência
      return updatePropriedade(input.id, {
        ...input.data,
        tamanhoArea: input.data.tamanhoArea?.toString(),
        latitude: input.data.latitude?.toString(),
        longitude: input.data.longitude?.toString(),
      } as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await deletePropriedade(input.id);
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return { total: 0, porTipo: {} };
    const produtorId = await getProdutorId(perfil.id);
    const lista = await getPropriedades(produtorId);
    const porTipo: Record<string, number> = {};
    lista.forEach((p) => {
      const tipo = p.tipoProducao ?? "outro";
      porTipo[tipo] = (porTipo[tipo] ?? 0) + 1;
    });
    return { total: lista.length, porTipo, areaTotal: lista.reduce((s, p) => s + Number(p.tamanhoArea ?? 0), 0) };
  }),
});

// ─── Router de Terrenos ───────────────────────────────────────────────────────
const terrenosRouter = router({
  listByPropriedade: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ input }) => getTerrenosByPropriedade(input.propriedadeId)),

  create: protectedProcedure
    .input(terrenoInput)
    .mutation(async ({ input }) =>
      createTerreno({ ...input, area: input.area?.toString() } as any)
    ),

  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), data: terrenoInput.partial() }))
    .mutation(async ({ input }) =>
      updateTerreno(input.id, { ...input.data, area: input.data.area?.toString() } as any)
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await deleteTerreno(input.id);
      return { success: true };
    }),
});

// ─── Router de Cultivos ───────────────────────────────────────────────────────
const cultivosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return [];
    return getCulturas(perfil.id);
  }),

  listByPropriedade: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ input }) => getCulturasByPropriedade(input.propriedadeId)),

  create: protectedProcedure
    .input(cultivoInput)
    .mutation(async ({ input }) =>
      createCultura({
        ...input,
        areaPlantada: input.areaPlantada?.toString(),
        producaoEstimada: input.producaoEstimada?.toString(),
      } as any)
    ),

  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), data: cultivoInput.partial() }))
    .mutation(async ({ input }) =>
      updateCultura(input.id, {
        ...input.data,
        areaPlantada: input.data.areaPlantada?.toString(),
        producaoEstimada: input.data.producaoEstimada?.toString(),
      } as any)
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await deleteCultura(input.id);
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return { total: 0, ativos: 0, colhidos: 0, perdidos: 0 };
    const lista = await getCulturas(perfil.id);
    return {
      total: lista.length,
      ativos: lista.filter((c) => c.status === "em_andamento").length,
      planejados: lista.filter((c) => c.status === "planejado").length,
      colhidos: lista.filter((c) => c.status === "colhido").length,
      perdidos: lista.filter((c) => c.status === "perdido").length,
    };
  }),
});

// ─── Router de Calendário ─────────────────────────────────────────────────────
const calendarioRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pendente", "em_andamento", "concluido", "cancelado"]).optional(),
        prioridade: z.enum(["baixa", "normal", "alta", "critica"]).optional(),
        culturaId: z.number().int().positive().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) return [];
      const eventos = await getCalendario(perfil.id);
      let filtrados = eventos;
      if (input?.status) filtrados = filtrados.filter((e) => e.status === input.status);
      if (input?.prioridade) filtrados = filtrados.filter((e) => e.prioridade === input.prioridade);
      if (input?.culturaId) filtrados = filtrados.filter((e) => e.culturaId === input.culturaId);
      return filtrados;
    }),

  create: protectedProcedure
    .input(eventoInput)
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      return createEvento({
        ...input,
        usuarioId: perfil.id,
        dataProgramada: new Date(input.dataProgramada),
      } as any);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), data: eventoInput.partial() }))
    .mutation(async ({ input }) =>
      updateEvento(input.id, {
        ...input.data,
        dataProgramada: input.data.dataProgramada ? new Date(input.data.dataProgramada) : undefined,
      } as any)
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await deleteEvento(input.id);
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return { total: 0, pendentes: 0, criticos: 0 };
    const eventos = await getCalendario(perfil.id);
    return {
      total: eventos.length,
      pendentes: eventos.filter((e) => e.status === "pendente").length,
      emAndamento: eventos.filter((e) => e.status === "em_andamento").length,
      concluidos: eventos.filter((e) => e.status === "concluido").length,
      criticos: eventos.filter((e) => e.prioridade === "critica" && e.status === "pendente").length,
    };
  }),
});

// ─── Export do router principal ───────────────────────────────────────────────
export const coreDataRouter = router({
  propriedades: propriedadesRouter,
  terrenos: terrenosRouter,
  cultivos: cultivosRouter,
  calendario: calendarioRouter,
});
