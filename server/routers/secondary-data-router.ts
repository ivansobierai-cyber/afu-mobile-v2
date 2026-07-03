/**
 * secondary-data-router.ts — Router tRPC para módulos secundários do AFU
 * Cobre: Relatórios, Marketplace (produtos + pedidos), Análise Fitotécnica
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  getUsuarioAfuByUserId,
  getRelatorios,
  createRelatorio,
  updateRelatorio,
  getProdutosMarketplace,
  createProdutoMarketplace,
  updateProdutoMarketplace,
  getAnalises,
  createAnalise,
  getTicketsSuporte,
  createTicketSuporte,
  updateTicketSuporte,
  getMensagensSuporte,
  createMensagemSuporte,
} from "../db";
import { getDb } from "../db";
import { analisesFitotecnicas, relatorios, produtosMarketplace } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const relatorioInput = z.object({
  titulo: z.string().min(1).max(255),
  tipoRelatorio: z
    .enum(["diagnostico", "analise_solo", "historico", "certificado", "recomendacao"])
    .optional(),
  arquivoPdfUrl: z.string().optional(),
  status: z.enum(["rascunho", "emitido", "assinado", "cancelado"]).optional(),
  conteudo: z.string().optional(), // JSON string
  diagnosticoId: z.number().int().positive().optional(),
  analiseId: z.number().int().positive().optional(),
});

const analiseInput = z.object({
  propriedadeId: z.number().int().positive().optional(),
  culturaId: z.number().int().positive().optional(),
  tipoAnalise: z.enum(["solo", "agua", "foliar", "completa"]).optional(),
  phSolo: z.number().optional(),
  phAgua: z.number().optional(),
  nitrogenio: z.number().optional(),
  fosforo: z.number().optional(),
  potassio: z.number().optional(),
  calcio: z.number().optional(),
  magnesio: z.number().optional(),
  materiaOrganica: z.number().optional(),
  umidade: z.number().optional(),
  condutividadeEletrica: z.number().optional(),
  resultadoTecnico: z.string().optional(),
  recomendacao: z.string().optional(),
});

const produtoInput = z.object({
  nomeProduto: z.string().min(1).max(200),
  categoria: z.enum([
    "sementes", "fertilizantes", "defensivos", "equipamentos",
    "servicos", "producao_propria", "outro",
  ]),
  descricao: z.string().optional(),
  preco: z.number().positive().optional(),
  estoque: z.number().positive().optional(),
  unidade: z.string().max(30).optional(),
  imagemUrl: z.string().optional(),
  status: z.enum(["disponivel", "indisponivel", "pausado"]).optional(),
});

// ─── Router de Relatórios ─────────────────────────────────────────────────────
const relatoriosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return [];
    return getRelatorios(perfil.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(relatorios)
        .where(eq(relatorios.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      return rows[0];
    }),

  create: protectedProcedure
    .input(relatorioInput)
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      return createRelatorio({ ...input, usuarioId: perfil.id } as any);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), data: relatorioInput.partial() }))
    .mutation(async ({ input }) => updateRelatorio(input.id, input.data as any)),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(relatorios).where(eq(relatorios.id, input.id));
      return { success: true };
    }),
});

// ─── Router de Análise Fitotécnica ────────────────────────────────────────────
const analisesFitotecnicasRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return [];
    return getAnalises(perfil.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(analisesFitotecnicas)
        .where(eq(analisesFitotecnicas.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Análise não encontrada" });
      return rows[0];
    }),

  create: protectedProcedure
    .input(analiseInput)
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      return createAnalise({
        ...input,
        usuarioId: perfil.id,
        phSolo: input.phSolo?.toString(),
        phAgua: input.phAgua?.toString(),
        nitrogenio: input.nitrogenio?.toString(),
        fosforo: input.fosforo?.toString(),
        potassio: input.potassio?.toString(),
        calcio: input.calcio?.toString(),
        magnesio: input.magnesio?.toString(),
        materiaOrganica: input.materiaOrganica?.toString(),
        umidade: input.umidade?.toString(),
        condutividadeEletrica: input.condutividadeEletrica?.toString(),
      } as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(analisesFitotecnicas).where(eq(analisesFitotecnicas.id, input.id));
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return { total: 0 };
    const lista = await getAnalises(perfil.id);
    return {
      total: lista.length,
      solo: lista.filter((a) => a.tipoAnalise === "solo").length,
      agua: lista.filter((a) => a.tipoAnalise === "agua").length,
      foliar: lista.filter((a) => a.tipoAnalise === "foliar").length,
      completa: lista.filter((a) => a.tipoAnalise === "completa").length,
    };
  }),
});

// ─── Router de Marketplace ────────────────────────────────────────────────────
const marketplaceRouter = router({
  // Listagem pública (todos podem ver)
  list: protectedProcedure
    .input(
      z.object({
        categoria: z.string().optional(),
        busca: z.string().optional(),
        status: z.enum(["disponivel", "indisponivel", "pausado"]).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      let query = db.select().from(produtosMarketplace).$dynamic();
      const rows = await db
        .select()
        .from(produtosMarketplace)
        .orderBy(desc(produtosMarketplace.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
      // Filtros em memória (simples para MVP)
      let filtrados = rows;
      if (input?.status) filtrados = filtrados.filter((p) => p.status === input.status);
      if (input?.categoria) filtrados = filtrados.filter((p) => p.categoria === input.categoria);
      if (input?.busca) {
        const b = input.busca.toLowerCase();
        filtrados = filtrados.filter(
          (p) => p.nomeProduto.toLowerCase().includes(b) || (p.descricao ?? "").toLowerCase().includes(b)
        );
      }
      return filtrados;
    }),

  // Meus produtos (vendedor)
  meusProdutos: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return [];
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select()
      .from(produtosMarketplace)
      .where(eq(produtosMarketplace.vendedorId, perfil.id))
      .orderBy(desc(produtosMarketplace.createdAt));
  }),

  create: protectedProcedure
    .input(produtoInput)
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      return createProdutoMarketplace({
        ...input,
        vendedorId: perfil.id,
        preco: input.preco?.toString(),
        estoque: input.estoque?.toString(),
      } as any);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), data: produtoInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });
      // Verifica que o produto pertence ao vendedor
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [produto] = await db
        .select()
        .from(produtosMarketplace)
        .where(eq(produtosMarketplace.id, input.id))
        .limit(1);
      if (!produto) throw new TRPCError({ code: "NOT_FOUND" });
      if (produto.vendedorId !== perfil.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para editar este produto" });
      }
      return updateProdutoMarketplace(input.id, {
        ...input.data,
        preco: input.data.preco?.toString(),
        estoque: input.data.estoque?.toString(),
      } as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [produto] = await db
        .select()
        .from(produtosMarketplace)
        .where(eq(produtosMarketplace.id, input.id))
        .limit(1);
      if (!produto) throw new TRPCError({ code: "NOT_FOUND" });
      if (produto.vendedorId !== perfil.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.delete(produtosMarketplace).where(eq(produtosMarketplace.id, input.id));
      return { success: true };
    }),

  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const todos = await db.select().from(produtosMarketplace);
    return {
      total: todos.length,
      disponiveis: todos.filter((p) => p.status === "disponivel").length,
      pausados: todos.filter((p) => p.status === "pausado").length,
      indisponiveis: todos.filter((p) => p.status === "indisponivel").length,
    };
  }),
});

// ─── Router de Suporte Técnico ────────────────────────────────────────────────
const ticketInput = z.object({
  tipo: z.enum(["chamado", "duvida", "visita", "chat"]),
  titulo: z.string().min(1).max(200),
  descricao: z.string().min(1),
  prioridade: z.enum(["baixa", "normal", "alta"]).optional(),
  culturaRelacionada: z.string().max(100).optional(),
  dataVisita: z.string().max(30).optional(),
});

const suporteRouter = router({
  listTickets: protectedProcedure
    .input(z.object({ tipo: z.enum(["chamado", "duvida", "visita", "chat"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) return [];
      const tickets = await getTicketsSuporte(perfil.id);
      if (input?.tipo) return tickets.filter((t) => t.tipo === input.tipo);
      return tickets;
    }),

  createTicket: protectedProcedure
    .input(ticketInput)
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      const id = await createTicketSuporte({
        usuarioId: perfil.id,
        tipo: input.tipo,
        titulo: input.titulo,
        descricao: input.descricao,
        prioridade: input.prioridade ?? "normal",
        culturaRelacionada: input.culturaRelacionada,
        dataVisita: input.dataVisita,
        status: "aberto",
      });
      return { id };
    }),

  updateTicket: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: z.object({
          status: z.enum(["aberto", "em_andamento", "resolvido", "cancelado"]).optional(),
          resposta: z.string().optional(),
          prioridade: z.enum(["baixa", "normal", "alta"]).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      const tickets = await getTicketsSuporte(perfil.id);
      if (!tickets.some((t) => t.id === input.id)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket não encontrado" });
      }
      await updateTicketSuporte(input.id, input.data);
      return { success: true };
    }),

  listMensagens: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return [];
    return getMensagensSuporte(perfil.id);
  }),

  enviarMensagem: protectedProcedure
    .input(z.object({ texto: z.string().min(1).max(2000), ticketId: z.number().int().positive().optional() }))
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });

      const existing = await getMensagensSuporte(perfil.id);
      if (existing.length === 0) {
        await createMensagemSuporte({
          usuarioId: perfil.id,
          autor: "sistema",
          texto: "Olá! Sou o assistente técnico do AFU. Como posso ajudar você hoje?",
        });
      }

      const userMsgId = await createMensagemSuporte({
        usuarioId: perfil.id,
        ticketId: input.ticketId,
        autor: "usuario",
        texto: input.texto.trim(),
      });

      await createMensagemSuporte({
        usuarioId: perfil.id,
        ticketId: input.ticketId,
        autor: "sistema",
        texto:
          "Obrigado pela informação! Um técnico especializado irá analisar seu caso e responder em breve. Enquanto isso, você também pode abrir um chamado na aba Chamados.",
      });

      return { id: userMsgId };
    }),
});

// ─── Export ───────────────────────────────────────────────────────────────────
export const secondaryDataRouter = router({
  relatorios: relatoriosRouter,
  analises: analisesFitotecnicasRouter,
  marketplace: marketplaceRouter,
  suporte: suporteRouter,
});
