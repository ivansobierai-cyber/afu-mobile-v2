/**
 * materiais-parceiros-router.ts — Router tRPC para Materiais Didáticos e Parceiros
 *
 * Rotas públicas (autenticadas):
 *   materiaisParceiros.materiais.list   — lista materiais com filtros
 *   materiaisParceiros.materiais.get    — detalhe de um material
 *   materiaisParceiros.parceiros.list   — lista parceiros com filtros
 *   materiaisParceiros.parceiros.get    — detalhe de um parceiro
 *
 * Rotas admin:
 *   materiaisParceiros.materiais.create  — criar material
 *   materiaisParceiros.materiais.update  — atualizar material
 *   materiaisParceiros.materiais.delete  — remover material
 *   materiaisParceiros.materiais.stats   — estatísticas de materiais
 *   materiaisParceiros.parceiros.create  — criar parceiro
 *   materiaisParceiros.parceiros.update  — atualizar parceiro
 *   materiaisParceiros.parceiros.delete  — remover parceiro
 *   materiaisParceiros.parceiros.stats   — estatísticas de parceiros
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  listarMateriaisAdmin,
  getMaterialById,
  adminCreateMaterial,
  adminUpdateMaterial,
  adminDeleteMaterial,
  getEstatisticasMateriais,
  listarParceirosAdmin,
  getParceiroById,
  adminCreateParceiro,
  adminUpdateParceiro,
  adminDeleteParceiro,
  getEstatisticasParceiros,
} from "../db-materiais-parceiros";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const tipoMaterialSchema = z.enum(["video", "audio", "apostila", "guia", "checklist", "infografico"]);
const nivelSchema = z.enum(["iniciante", "intermediario", "avancado"]);
const publicoAlvoSchema = z.enum(["produtor", "tecnico", "todos"]);
const statusMaterialSchema = z.enum(["ativo", "inativo", "rascunho"]);

const materialFiltrosSchema = z.object({
  busca: z.string().optional(),
  tipo: tipoMaterialSchema.optional(),
  nivel: nivelSchema.optional(),
  publicoAlvo: publicoAlvoSchema.optional(),
  status: statusMaterialSchema.optional(),
  tema: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

const materialCreateSchema = z.object({
  titulo: z.string().min(1).max(255),
  tipoMaterial: tipoMaterialSchema,
  tema: z.string().max(100).optional().nullable(),
  descricao: z.string().optional().nullable(),
  arquivoUrl: z.string().url().optional().nullable().or(z.literal("")),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  idioma: z.string().max(20).default("pt-BR"),
  publicoAlvo: publicoAlvoSchema.default("todos"),
  nivel: nivelSchema.default("iniciante"),
  status: statusMaterialSchema.default("ativo"),
});

const materialUpdateSchema = materialCreateSchema.partial().extend({
  id: z.number().int().min(1),
});

const tipoParcSchema = z.enum(["laboratorio", "cooperativa", "consultoria", "revendedor", "instituicao", "outro"]);
const statusParcSchema = z.enum(["ativo", "inativo"]);

const parceiroFiltrosSchema = z.object({
  busca: z.string().optional(),
  tipo: tipoParcSchema.optional(),
  estado: z.string().optional(),
  status: statusParcSchema.optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

const parceiroCreateSchema = z.object({
  nome: z.string().min(1).max(200),
  tipo: tipoParcSchema,
  descricao: z.string().optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().max(100).optional().nullable(),
  telefone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().url().optional().nullable().or(z.literal("")),
  servicosOferecidos: z.string().optional().nullable(),
  status: statusParcSchema.default("ativo"),
});

const parceiroUpdateSchema = parceiroCreateSchema.partial().extend({
  id: z.number().int().min(1),
});

// ─── Sub-routers ──────────────────────────────────────────────────────────────

const materiaisRouter = router({
  // ── Leitura (autenticado) ──────────────────────────────────────────────────
  list: protectedProcedure
    .input(materialFiltrosSchema)
    .query(async ({ input }) => {
      return listarMateriaisAdmin(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query(async ({ input }) => {
      const material = await getMaterialById(input.id);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "Material não encontrado" });
      return material;
    }),

  // ── Escrita (admin) ────────────────────────────────────────────────────────
  create: adminProcedure
    .input(materialCreateSchema)
    .mutation(async ({ input }) => {
      return adminCreateMaterial({
        ...input,
        arquivoUrl: input.arquivoUrl || null,
        videoUrl: input.videoUrl || null,
      });
    }),

  update: adminProcedure
    .input(materialUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const exists = await getMaterialById(id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Material não encontrado" });
      return adminUpdateMaterial(id, {
        ...data,
        arquivoUrl: data.arquivoUrl || null,
        videoUrl: data.videoUrl || null,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      const exists = await getMaterialById(input.id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Material não encontrado" });
      return adminDeleteMaterial(input.id);
    }),

  stats: adminProcedure.query(async () => {
    return getEstatisticasMateriais();
  }),
});

const parceirosRouter = router({
  // ── Leitura (autenticado) ──────────────────────────────────────────────────
  list: protectedProcedure
    .input(parceiroFiltrosSchema)
    .query(async ({ input }) => {
      return listarParceirosAdmin(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query(async ({ input }) => {
      const parceiro = await getParceiroById(input.id);
      if (!parceiro) throw new TRPCError({ code: "NOT_FOUND", message: "Parceiro não encontrado" });
      return parceiro;
    }),

  // ── Escrita (admin) ────────────────────────────────────────────────────────
  create: adminProcedure
    .input(parceiroCreateSchema)
    .mutation(async ({ input }) => {
      return adminCreateParceiro({
        ...input,
        email: input.email || null,
        website: input.website || null,
      });
    }),

  update: adminProcedure
    .input(parceiroUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const exists = await getParceiroById(id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Parceiro não encontrado" });
      return adminUpdateParceiro(id, {
        ...data,
        email: data.email || null,
        website: data.website || null,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      const exists = await getParceiroById(input.id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Parceiro não encontrado" });
      return adminDeleteParceiro(input.id);
    }),

  stats: adminProcedure.query(async () => {
    return getEstatisticasParceiros();
  }),
});

// ─── Router principal ─────────────────────────────────────────────────────────

export const materiaisParceirosRouter = router({
  materiais: materiaisRouter,
  parceiros: parceirosRouter,
});
