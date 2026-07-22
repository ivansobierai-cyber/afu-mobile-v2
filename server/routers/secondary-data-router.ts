/**
 * secondary-data-router.ts — Router tRPC para módulos secundários do AFU
 * Cobre: Relatórios, Marketplace (produtos + pedidos), Análise Fitotécnica
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure, organizationProcedure } from "../_core/trpc";
import {
  getUsuarioAfuByUserId,
  createRelatorio,
  updateRelatorio,
  getProdutosMarketplace,
  createProdutoMarketplace,
  updateProdutoMarketplace,
  getPedidosComprador,
  createPedido,
  getProdutoMarketplaceById,
  cancelarPedido,
  getPedidosVendedor,
  getUsuarioAfuById,
  atualizarStatusPedidoVendedor,
  getPedidoById,
  confirmarPagamentoPix,
  createAnalise,
  getTicketsSuporte,
  createTicketSuporte,
  getMensagensSuporte,
  createMensagemSuporte,
} from "../db";
import { getDb } from "../db";
import { produtosMarketplace, pedidos } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  getCtxTenant,
  requireRelatorioInTenant,
  requireAnaliseInTenant,
  assertRelatedIdsInTenant,
  requireOrgPermission,
} from "../tenant-access";
import { createTenantDb } from "../tenant-db";
import {
  createTemporaryDownloadUrl,
  listRecentAuditForOrg,
  writeAuditLog,
  proxyPathForKey,
} from "../private-files";
import {
  encodeMarketplaceObservacoes,
  generateDemoPixCode,
  parseMarketplaceObservacoes,
} from "../../shared/marketplace";
import {
  notifyCompradorStatusPedido,
  notifyVendedorNovoPedido,
  notifyVendedorPagamento,
} from "../services/marketplace-notifications";

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

// ─── Router de Relatórios (Etapa 4 — escopo por organização) ──────────────────
const relatoriosRouter = router({
  /** cacheScope = activeOrganizationId no cliente → React Query namespaced por org */
  list: organizationProcedure
    .input(z.object({ cacheScope: z.number().int().positive().optional() }).optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.read");
      return createTenantDb(tenant.organizationId).listRelatorios();
    }),

  get: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.read");
      return requireRelatorioInTenant(tenant, input.id);
    }),

  create: organizationProcedure
    .input(relatorioInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.export");
      return createRelatorio({
        ...input,
        usuarioId: tenant.perfilId,
        organizationId: tenant.organizationId,
      } as any);
    }),

  update: organizationProcedure
    .input(z.object({ id: z.number().int().positive(), data: relatorioInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.export");
      await requireRelatorioInTenant(tenant, input.id);
      return updateRelatorio(input.id, input.data as any, tenant.organizationId);
    }),

  delete: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.export");
      const ok = await createTenantDb(tenant.organizationId).deleteRelatorio(input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
      return { success: true };
    }),

  /**
   * Etapa 6 — URL temporária para download do artefato do relatório.
   * Valida relatório no tenant + permissão; audita o download.
   */
  getDownloadUrl: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.read");
      const rel = await requireRelatorioInTenant(tenant, input.id);
      const raw = rel.arquivoPdfUrl;
      if (!raw) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Relatório sem arquivo privado associado",
        });
      }
      const key = raw.replace(/^\/?manus-storage\//, "").replace(/^\/+/, "");
      const tmp = await createTemporaryDownloadUrl({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        storageKey: key,
        permission: "reports.read",
        auditAction: "report.download",
        resourceType: "relatorio",
        resourceId: String(rel.id),
      });
      return {
        url: tmp.url,
        expiresAt: tmp.expiresAt.toISOString(),
        proxyPath: proxyPathForKey(key),
        relatorioId: rel.id,
      };
    }),

  /** Auditoria recente da org (geração/download) */
  auditTrail: organizationProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.read");
      return listRecentAuditForOrg(tenant.organizationId, input?.limit ?? 40);
    }),
});

/** Download genérico de arquivo privado por storageKey (ACL + URL temporária) */
const filesRouter = router({
  getDownloadUrl: organizationProcedure
    .input(z.object({ storageKey: z.string().min(1).max(512) }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.read");
      const key = input.storageKey.replace(/^\/?manus-storage\//, "").replace(/^\/+/, "");
      // Prefix must match active org (defense in depth)
      if (key.startsWith("org/") && !key.startsWith(`org/${tenant.organizationId}/`)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado" });
      }
      return createTemporaryDownloadUrl({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        storageKey: key,
        permission: "reports.read",
        auditAction: "file.download",
      }).then((tmp) => ({
        url: tmp.url,
        expiresAt: tmp.expiresAt.toISOString(),
        proxyPath: proxyPathForKey(key),
      }));
    }),
});


// ─── Router de Análise Fitotécnica (Etapa 4/5) ────────────────────────────────
const analisesFitotecnicasRouter = router({
  list: organizationProcedure
    .input(z.object({ cacheScope: z.number().int().positive().optional() }).optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      return createTenantDb(tenant.organizationId).listAnalises();
    }),

  get: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return requireAnaliseInTenant(tenant, input.id);
    }),

  create: organizationProcedure
    .input(analiseInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.propriedadeId,
        culturaId: input.culturaId,
      });
      return createAnalise({
        ...input,
        usuarioId: tenant.perfilId,
        organizationId: tenant.organizationId,
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

  delete: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const ok = await createTenantDb(tenant.organizationId).deleteAnalise(input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
      return { success: true };
    }),

  stats: organizationProcedure.query(async ({ ctx }) => {
    const tenant = getCtxTenant(ctx);
    const rows = await createTenantDb(tenant.organizationId).listAnalises();
    return { total: rows.length };
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

  pedidos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) return [];
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const lista = await getPedidosComprador(perfil.id);
      const enriched = await Promise.all(
        lista.map(async (p) => {
          const produto = await getProdutoMarketplaceById(p.produtoId);
          const { metodo, observacoes } = parseMarketplaceObservacoes(p.observacoes);
          return {
            ...p,
            produtoNome: produto?.nomeProduto ?? "Produto",
            produtoCategoria: produto?.categoria ?? "outro",
            metodoPagamento: metodo,
            observacoesTexto: observacoes,
          };
        }),
      );
      return enriched;
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });

        const pedido = await getPedidoById(input.id);
        if (!pedido || pedido.compradorId !== perfil.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }

        const [produto, vendedor] = await Promise.all([
          getProdutoMarketplaceById(pedido.produtoId),
          getUsuarioAfuById(pedido.vendedorId),
        ]);
        const { metodo, observacoes } = parseMarketplaceObservacoes(pedido.observacoes);

        return {
          ...pedido,
          produtoNome: produto?.nomeProduto ?? "Produto",
          produtoCategoria: produto?.categoria ?? "outro",
          vendedorNome: vendedor?.nome ?? "Vendedor",
          metodoPagamento: metodo,
          observacoesTexto: observacoes,
        };
      }),

    checkout: protectedProcedure
      .input(
        z.object({
          items: z
            .array(
              z.object({
                produtoId: z.number().int().positive(),
                quantidade: z.number().positive(),
              }),
            )
            .min(1)
            .max(20),
          enderecoEntrega: z.string().min(5).max(500),
          metodoPagamento: z.enum(["pix", "na_entrega"]),
          observacoes: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });

        const observacoesEncoded = encodeMarketplaceObservacoes(
          input.metodoPagamento,
          input.observacoes,
        );
        const pedidoIds: number[] = [];
        let total = 0;

        for (const item of input.items) {
          const produto = await getProdutoMarketplaceById(item.produtoId);
          if (!produto) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Produto #${item.produtoId} não encontrado`,
            });
          }
          if (produto.status !== "disponivel") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `"${produto.nomeProduto}" está indisponível`,
            });
          }
          if (produto.vendedorId === perfil.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Você não pode comprar seu próprio produto",
            });
          }

          const precoUnit = Number(produto.preco ?? 0);
          const valorTotal = precoUnit > 0 ? precoUnit * item.quantidade : undefined;
          if (valorTotal) total += valorTotal;

          const id = await createPedido({
            compradorId: perfil.id,
            vendedorId: produto.vendedorId,
            produtoId: produto.id,
            quantidade: item.quantidade.toString(),
            valorUnitario: precoUnit > 0 ? precoUnit.toString() : undefined,
            valorTotal: valorTotal != null ? valorTotal.toString() : undefined,
            enderecoEntrega: input.enderecoEntrega.trim(),
            observacoes: observacoesEncoded,
            statusPedido: "aguardando",
            statusPagamento: "pendente",
          });

          pedidoIds.push(id);
          void notifyVendedorNovoPedido({
            vendedorId: produto.vendedorId,
            compradorId: perfil.id,
            pedidoId: id,
            produtoId: produto.id,
          });
        }

        return { pedidoIds, total, success: true };
      }),

    pagarPix: protectedProcedure
      .input(z.object({ pedidoId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });

        try {
          const pedido = await confirmarPagamentoPix(input.pedidoId, perfil.id);

          const valor = Number(pedido.valorTotal ?? 0);
          void notifyVendedorPagamento({
            vendedorId: pedido.vendedorId,
            pedidoId: pedido.id,
            produtoId: pedido.produtoId,
          });

          return {
            success: true,
            pixCode: generateDemoPixCode(pedido.id, valor),
          };
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Não foi possível confirmar o pagamento";
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
      }),

    create: protectedProcedure
      .input(
        z.object({
          produtoId: z.number().int().positive(),
          quantidade: z.number().positive().default(1),
          observacoes: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });

        const produto = await getProdutoMarketplaceById(input.produtoId);
        if (!produto) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        if (produto.status !== "disponivel") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Produto indisponível" });
        }
        if (produto.vendedorId === perfil.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode pedir seu próprio produto" });
        }

        const precoUnit = Number(produto.preco ?? 0);
        const quantidade = input.quantidade;
        const valorTotal = precoUnit > 0 ? precoUnit * quantidade : undefined;

        const id = await createPedido({
          compradorId: perfil.id,
          vendedorId: produto.vendedorId,
          produtoId: produto.id,
          quantidade: quantidade.toString(),
          valorUnitario: precoUnit > 0 ? precoUnit.toString() : undefined,
          valorTotal: valorTotal != null ? valorTotal.toString() : undefined,
          observacoes: input.observacoes ?? null,
          statusPedido: "aguardando",
          statusPagamento: "pendente",
        });

        void notifyVendedorNovoPedido({
          vendedorId: produto.vendedorId,
          compradorId: perfil.id,
          pedidoId: id,
          produtoId: produto.id,
        });

        return { id, success: true };
      }),

    cancelar: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });
        try {
          return await cancelarPedido(input.id, perfil.id);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Não foi possível cancelar";
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
      }),

    vendas: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) return [];
        const lista = await getPedidosVendedor(perfil.id);
        const enriched = await Promise.all(
          lista.map(async (p) => {
            const [produto, comprador] = await Promise.all([
              getProdutoMarketplaceById(p.produtoId),
              getUsuarioAfuById(p.compradorId),
            ]);
            const { metodo, observacoes } = parseMarketplaceObservacoes(p.observacoes);
            return {
              ...p,
              produtoNome: produto?.nomeProduto ?? "Produto",
              compradorNome: comprador?.nome ?? "Comprador",
              compradorTelefone: comprador?.telefone ?? null,
              metodoPagamento: metodo,
              observacoesTexto: observacoes,
            };
          }),
        );
        return enriched;
      }),

      atualizarStatus: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            status: z.enum([
              "confirmado",
              "em_preparo",
              "enviado",
              "entregue",
              "cancelado",
            ]),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const perfil = await getUsuarioAfuByUserId(ctx.user.id);
          if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED" });
          try {
            const result = await atualizarStatusPedidoVendedor(input.id, perfil.id, input.status);
            if (result.pedido) {
              void notifyCompradorStatusPedido({
                compradorId: result.pedido.compradorId,
                pedidoId: result.pedido.id,
                status: input.status,
                produtoId: result.pedido.produtoId,
              });
            }
            return { success: true };
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Não foi possível atualizar o pedido";
            throw new TRPCError({ code: "BAD_REQUEST", message });
          }
        }),
    }),
  }),
});

// ─── Router de Suporte ────────────────────────────────────────────────────────
const ticketInput = z.object({
  tipo: z.enum(["chamado", "duvida", "visita", "chat"]),
  titulo: z.string().min(1).max(200),
  descricao: z.string().min(1),
  prioridade: z.enum(["baixa", "normal", "alta"]).optional(),
  culturaRelacionada: z.string().max(100).optional(),
  dataVisita: z.string().max(30).optional(),
});

const suporteRouter = router({
  tickets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) return [];
      return getTicketsSuporte(perfil.id);
    }),

    create: protectedProcedure
      .input(ticketInput)
      .mutation(async ({ ctx, input }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
        const id = await createTicketSuporte({
          usuarioId: perfil.id,
          tipo: input.tipo,
          titulo: input.titulo.trim(),
          descricao: input.descricao.trim(),
          prioridade: input.prioridade ?? "normal",
          culturaRelacionada: input.culturaRelacionada ?? null,
          dataVisita: input.dataVisita ?? null,
          status: "aberto",
        });
        return { id, success: true };
      }),
  }),

  mensagens: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) return [];
      return getMensagensSuporte(perfil.id);
    }),

    enviar: protectedProcedure
      .input(z.object({ texto: z.string().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const perfil = await getUsuarioAfuByUserId(ctx.user.id);
        if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });

        const id = await createMensagemSuporte({
          usuarioId: perfil.id,
          autor: "usuario",
          texto: input.texto.trim(),
        });

        const respostaId = await createMensagemSuporte({
          usuarioId: perfil.id,
          autor: "sistema",
          texto:
            "Obrigado pela mensagem! Um técnico especializado irá analisar seu caso e responder em breve.",
        });

        return { id, respostaId };
      }),
  }),
});

// ─── Export ───────────────────────────────────────────────────────────────────
export const secondaryDataRouter = router({
  relatorios: relatoriosRouter,
  analises: analisesFitotecnicasRouter,
  files: filesRouter,
  marketplace: marketplaceRouter,
  suporte: suporteRouter,
});
