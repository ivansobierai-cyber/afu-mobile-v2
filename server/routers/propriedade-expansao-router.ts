/**
 * Etapas 4–10 — alertas, ocorrências, estoque, custos, geometria, métricas
 * Segurança Etapa 4: organizationProcedure + propriedade no tenant.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  organizationProcedure,
  orgPermissionProcedure,
} from "../_core/trpc";
import {
  getPropriedadeById,
  getTarefasByPropriedade,
  getCulturasByPropriedade,
  getTerrenosByPropriedade,
  createTarefa,
} from "../db";
import {
  listOcorrencias,
  createOcorrencia,
  updateOcorrencia,
  getOcorrenciaById,
  listEstoque,
  createEstoqueItem,
  getEstoqueItem,
  registrarMovimentoEstoque,
  listMovimentosEstoque,
  listLotesPorPropriedade,
  listReservasPorPropriedade,
  listOrcamentos,
  createOrcamento,
  listCustos,
  createCusto,
  listAtividades,
  registrarAtividade,
  updateGeometriaPropriedade,
  updateGeometriaTerreno,
  listMaquinasOperacionais,
  getMaquinaOperacional,
  createMaquinaOperacional,
  updateMaquinaOperacional,
  removeMaquinaOperacional,
} from "../db-propriedade-expansao";
import { gerarAlertas, METRICAS_CATALOGO } from "../../lib/propriedades/alertas-engine";
import {
  GEOMETRIA_GEOJSON_MAX_CHARS,
  validatePolygonGeoJson,
} from "../../lib/propriedades/geojson-helpers";
import { STATUS_ABERTOS, type TarefaStatus } from "../../lib/propriedades/tarefa-status";
import {
  getCtxTenant,
  requireOrgPermission,
  requirePropertyInTenant,
  requireTerrenoInTenant,
  assertRelatedIdsInTenant,
  TENANT_NOT_FOUND,
  type TenantContext,
} from "../tenant-access";
import { createTenantDb } from "../tenant-db";
import { safraLabelsMatch } from "../../lib/propriedades/safra-label";

const geometriaGeoJsonInput = z
  .string()
  .min(2)
  .max(GEOMETRIA_GEOJSON_MAX_CHARS, {
    message: `GeoJSON excede o limite de ${GEOMETRIA_GEOJSON_MAX_CHARS} caracteres.`,
  });

/** Valida anel fechado WGS84 e devolve Polygon normalizado. */
function requireNormalizedPolygonGeoJson(raw: string): {
  normalized: string;
  areaHa: number | null;
} {
  const result = validatePolygonGeoJson(raw);
  if (!result.ok) {
    throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
  }
  return { normalized: result.normalized, areaHa: result.areaHa };
}

const maquinaTipoSchema = z.enum([
  "trator",
  "pulverizador",
  "colheitadeira",
  "implemento",
  "irrigacao",
  "outro",
]);

const maquinaStatusSchema = z.enum(["disponivel", "em_uso", "manutencao", "inativa"]);

async function assertPropertyInTenant(tenant: TenantContext, propriedadeId: number) {
  requireOrgPermission(tenant, "property.read");
  return requirePropertyInTenant(tenant, propriedadeId);
}

export const propriedadeExpansaoRouter = router({
  // ── Etapa 4: alertas + feed ───────────────────────────────────────────────
  alertas: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        cacheScope: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertPropertyInTenant(tenant, input.propriedadeId);
      const tdb = createTenantDb(tenant.organizationId);
      const [tarefas, cultivos, estoque, orcamentos, ocorrencias, prop, lotes, reservas] =
        await Promise.all([
          tdb.listTarefasByPropriedade(input.propriedadeId),
          tdb.listCulturasByPropriedade(input.propriedadeId),
          tdb.listEstoque(input.propriedadeId),
          tdb.listOrcamentos(input.propriedadeId),
          tdb.listOcorrencias(input.propriedadeId),
          tdb.requirePropriedade(input.propriedadeId),
          listLotesPorPropriedade(input.propriedadeId, tenant.organizationId),
          listReservasPorPropriedade(input.propriedadeId, tenant.organizationId),
        ]);
      const estoqueNome = new Map(estoque.map((e) => [e.id, e.nome]));
      return gerarAlertas({
        tarefas,
        cultivos,
        estoque,
        lotes: lotes.map((l) => ({
          id: l.id,
          itemId: l.itemId,
          itemNome: estoqueNome.get(l.itemId),
          codigo: l.codigo,
          validade: l.validade,
          bloqueado: Boolean(l.bloqueado),
        })),
        reservas: reservas.map((r) => ({
          id: r.id,
          itemId: r.itemId,
          itemNome: estoqueNome.get(r.itemId),
          quantidade: r.quantidade,
          status: r.status,
          tarefaId: r.tarefaId,
        })),
        orcamentos,
        ocorrencias: ocorrencias.map((o) => ({
          id: o.id,
          titulo: o.titulo,
          status: o.status,
          severidade: o.severidade,
          createdAt: o.createdAt,
        })),
        temGeometriaPropriedade: Boolean(prop?.geometriaGeoJson),
      });
    }),

  atividades: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        limit: z.number().int().positive().max(100).optional(),
        cacheScope: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertPropertyInTenant(tenant, input.propriedadeId);
      return createTenantDb(tenant.organizationId).listAtividades(
        input.propriedadeId,
        input.limit ?? 30,
      );
    }),

  // ── Etapa 5: geometria ────────────────────────────────────────────────────
  setGeometriaPropriedade: orgPermissionProcedure("property.write")
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        geometriaGeoJson: geometriaGeoJsonInput,
        areaGeometricaHa: z.number().optional(),
        origem: z.enum(["desenhada", "gps", "importada", "integracao"]).optional(),
        /** Etapa 8 — optimistic concurrency; omitir só em writes online frescos */
        expectedGeometriaVersao: z.number().int().positive().optional(),
        clientMutationId: z.string().min(8).max(64).optional(),
        deviceId: z.string().max(80).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requirePropertyInTenant(tenant, input.propriedadeId);
      const { normalized, areaHa } = requireNormalizedPolygonGeoJson(input.geometriaGeoJson);
      try {
        const updated = await updateGeometriaPropriedade(
          input.propriedadeId,
          {
            geometriaGeoJson: normalized,
            areaGeometricaHa: (input.areaGeometricaHa ?? areaHa ?? undefined)?.toString(),
            geometriaOrigem: input.origem,
            expectedGeometriaVersao: input.expectedGeometriaVersao,
          },
          tenant.organizationId,
        );
        await registrarAtividade({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          usuarioId: tenant.perfilId,
          tipo: "geometria",
          titulo: "Perímetro da propriedade atualizado",
          detalhe: `Origem: ${input.origem ?? "desenhada"}`,
          gravidade: "info",
        });
        return { success: true, geometriaVersao: updated.geometriaVersao };
      } catch (e: any) {
        if (e?.code === "GEOMETRY_VERSION_CONFLICT") {
          const { recordServerSyncConflict } = await import("../sync-conflicts");
          await recordServerSyncConflict({
            organizationId: tenant.organizationId,
            actorUserId: tenant.userId,
            deviceId: input.deviceId,
            clientMutationId: input.clientMutationId,
            entity: "geometria_propriedade",
            action: "update",
            resourceType: "propriedade",
            resourceId: String(input.propriedadeId),
            reason: "geometry_version",
            message: e.message,
            payload: JSON.stringify({
              expectedGeometriaVersao: input.expectedGeometriaVersao,
              serverVersion: e.serverVersion,
            }),
          });
          throw new TRPCError({
            code: "CONFLICT",
            message: e.message,
          });
        }
        throw e;
      }
    }),

  setGeometriaTerreno: orgPermissionProcedure("property.write")
    .input(
      z.object({
        terrenoId: z.number().int().positive(),
        propriedadeId: z.number().int().positive(),
        geometriaGeoJson: geometriaGeoJsonInput,
        areaGeometricaHa: z.number().optional(),
        origem: z.enum(["desenhada", "gps", "importada", "integracao"]).optional(),
        expectedGeometriaVersao: z.number().int().positive().optional(),
        clientMutationId: z.string().min(8).max(64).optional(),
        deviceId: z.string().max(80).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requirePropertyInTenant(tenant, input.propriedadeId);
      await requireTerrenoInTenant(tenant, input.terrenoId, input.propriedadeId);
      const { normalized, areaHa } = requireNormalizedPolygonGeoJson(input.geometriaGeoJson);
      try {
        const updated = await updateGeometriaTerreno(
          input.terrenoId,
          {
            geometriaGeoJson: normalized,
            areaGeometricaHa: (input.areaGeometricaHa ?? areaHa ?? undefined)?.toString(),
            geometriaOrigem: input.origem,
            expectedGeometriaVersao: input.expectedGeometriaVersao,
          },
          tenant.organizationId,
        );
        return { success: true, geometriaVersao: updated.geometriaVersao };
      } catch (e: any) {
        if (e?.code === "GEOMETRY_VERSION_CONFLICT") {
          const { recordServerSyncConflict } = await import("../sync-conflicts");
          await recordServerSyncConflict({
            organizationId: tenant.organizationId,
            actorUserId: tenant.userId,
            deviceId: input.deviceId,
            clientMutationId: input.clientMutationId,
            entity: "geometria_terreno",
            action: "update",
            resourceType: "terreno",
            resourceId: String(input.terrenoId),
            reason: "geometry_version",
            message: e.message,
            payload: JSON.stringify({
              expectedGeometriaVersao: input.expectedGeometriaVersao,
              serverVersion: e.serverVersion,
            }),
          });
          throw new TRPCError({
            code: "CONFLICT",
            message: e.message,
          });
        }
        throw e;
      }
    }),

  // ── Etapa 6: ocorrências ──────────────────────────────────────────────────
  ocorrencias: router({
    list: organizationProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          safraId: z.number().int().positive().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await assertPropertyInTenant(tenant, input.propriedadeId);
        if (input.safraId) {
          const { requireSafraInProperty } = await import("../db-safras");
          await requireSafraInProperty(
            tenant.organizationId,
            input.propriedadeId,
            input.safraId,
          );
        }
        const { filterRowsBySafraId } = await import("../../lib/propriedades/safra-filter");
        const all = await listOcorrencias(input.propriedadeId);
        return filterRowsBySafraId(all, input.safraId ?? null).matched;
      }),

    create: orgPermissionProcedure("operations.write")
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          safraId: z.number().int().positive().optional(),
          terrenoId: z.number().int().positive().optional(),
          culturaId: z.number().int().positive().optional(),
          diagnosticoId: z.number().int().positive().optional(),
          categoria: z.enum(["praga", "doenca", "nutricao", "clima", "solo", "outro"]).optional(),
          titulo: z.string().min(1).max(200),
          descricao: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          severidade: z.enum(["baixa", "media", "alta", "critica"]).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await assertRelatedIdsInTenant(tenant, {
          propriedadeId: input.propriedadeId,
          terrenoId: input.terrenoId,
          culturaId: input.culturaId,
        });
        let safraId = input.safraId;
        if (safraId) {
          const { requireWritableSafraInProperty } = await import("../db-safras");
          await requireWritableSafraInProperty(
            tenant.organizationId,
            input.propriedadeId,
            safraId,
          );
        } else {
          const { ensureDefaultSafra } = await import("../db-safras");
          safraId = (
            await ensureDefaultSafra({
              organizationId: tenant.organizationId,
              propriedadeId: input.propriedadeId,
              createdByUserId: tenant.userId,
            })
          ).id;
        }
        const id = await createOcorrencia({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          safraId,
          terrenoId: input.terrenoId,
          culturaId: input.culturaId,
          diagnosticoId: input.diagnosticoId,
          usuarioId: tenant.perfilId,
          categoria: input.categoria ?? "outro",
          titulo: input.titulo,
          descricao: input.descricao,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          severidade: input.severidade ?? "media",
          status: "aberta",
        } as any);
        await registrarAtividade({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          usuarioId: tenant.perfilId,
          tipo: "ocorrencia",
          titulo: `Ocorrência: ${input.titulo}`,
          detalhe: input.descricao,
          gravidade: input.severidade === "critica" ? "critico" : "atencao",
        });
        return id;
      }),

    criarTarefa: orgPermissionProcedure("operations.write")
      .input(
        z.object({
          ocorrenciaId: z.number().int().positive(),
          titulo: z.string().min(1).max(200).optional(),
          dataPrevista: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        const oc = await getOcorrenciaById(input.ocorrenciaId);
        if (!oc || oc.organizationId !== tenant.organizationId) {
          throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
        }
        await requirePropertyInTenant(tenant, oc.propriedadeId);
        const { requireWritableSafraId } = await import("../db-safras");
        const safra = await requireWritableSafraId(
          tenant.organizationId,
          oc.propriedadeId,
          (oc as { safraId?: number | null }).safraId,
        );
        const tarefaId = await createTarefa({
          usuarioId: tenant.perfilId,
          organizationId: tenant.organizationId,
          propriedadeId: oc.propriedadeId,
          safraId: safra.id,
          terrenoId: oc.terrenoId ?? undefined,
          culturaId: oc.culturaId ?? undefined,
          tipoOperacao: oc.categoria === "praga" || oc.categoria === "doenca" ? "monitoramento" : "vistoria",
          titulo: input.titulo ?? `Resolver: ${oc.titulo}`,
          instrucoes: `Origem: ocorrência #${oc.id}. ${oc.descricao ?? ""}\nDiagnóstico vinculado: ${oc.diagnosticoId ?? "nenhum"}. Confiança/IA não é certeza absoluta.`,
          prioridade: oc.severidade === "critica" ? "critica" : oc.severidade === "alta" ? "alta" : "normal",
          status: "planejada",
          dataPrevista: input.dataPrevista ? new Date(input.dataPrevista) : new Date(),
          origem: "manual",
        } as any);
        await updateOcorrencia(
          oc.id,
          { tarefaId, status: "em_acompanhamento" } as any,
          tenant.organizationId,
        );
        await registrarAtividade({
          propriedadeId: oc.propriedadeId,
          organizationId: tenant.organizationId,
          usuarioId: tenant.perfilId,
          tipo: "tarefa",
          titulo: `Tarefa criada a partir da ocorrência #${oc.id}`,
          gravidade: "info",
        });
        return { tarefaId, ocorrenciaId: oc.id };
      }),

    resolver: orgPermissionProcedure("operations.write")
      .input(
        z.object({
          id: z.number().int().positive(),
          resultado: z.enum(["melhorou", "estavel", "piorou", "resolvido"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        const oc = await getOcorrenciaById(input.id);
        if (!oc || oc.organizationId !== tenant.organizationId) {
          throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
        }
        await requirePropertyInTenant(tenant, oc.propriedadeId);
        const { requireWritableSafraId } = await import("../db-safras");
        await requireWritableSafraId(
          tenant.organizationId,
          oc.propriedadeId,
          (oc as { safraId?: number | null }).safraId,
        );
        await updateOcorrencia(
          oc.id,
          {
            status: input.resultado === "resolvido" ? "resolvida" : "em_acompanhamento",
            resultadoAcompanhamento: input.resultado,
          } as any,
          tenant.organizationId,
        );
        return { success: true };
      }),
  }),

  // ── Etapa 7: estoque ──────────────────────────────────────────────────────
  estoque: router({
    list: organizationProcedure
      .input(z.object({ propriedadeId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await assertPropertyInTenant(tenant, input.propriedadeId);
        return listEstoque(input.propriedadeId, tenant.organizationId);
      }),

    createItem: orgPermissionProcedure("operations.write")
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          nome: z.string().min(1).max(150),
          categoria: z
            .enum([
              "fertilizante",
              "defensivo",
              "herbicida",
              "fungicida",
              "inseticida",
              "semente",
              "combustivel",
              "peca",
              "ferramenta",
              "outro",
            ])
            .default("outro"),
          unidadeBase: z
            .string()
            .trim()
            .min(1, "Unidade padrão é obrigatória")
            .max(30)
            .default("kg"),
          saldoInicial: z.number().min(0).optional(),
          estoqueMinimo: z.number().min(0).optional(),
          fabricante: z.string().max(120).optional(),
          observacoes: z.string().max(2_000).optional(),
          depositoId: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        const unidadeBase = input.unidadeBase.trim();
        if (!unidadeBase) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unidade padrão é obrigatória",
          });
        }
        const id = await createEstoqueItem({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          depositoId: input.depositoId,
          nome: input.nome.trim(),
          categoria: input.categoria,
          unidadeBase,
          saldo: "0",
          estoqueMinimo: (input.estoqueMinimo ?? 0).toFixed(3),
          fabricante: input.fabricante?.trim() || undefined,
          observacoes: input.observacoes?.trim() || undefined,
          createdByUserId: tenant.userId,
        } as any);
        if ((input.saldoInicial ?? 0) > 0) {
          await registrarMovimentoEstoque({
            itemId: id,
            organizationId: tenant.organizationId,
            propriedadeId: input.propriedadeId,
            usuarioId: tenant.perfilId,
            createdByUserId: tenant.userId,
            tipo: "entrada",
            quantidade: (input.saldoInicial ?? 0).toFixed(3),
            motivo: "Saldo inicial",
          } as any);
        }
        return id;
      }),

    movimento: orgPermissionProcedure("operations.write")
      .input(
        z.object({
          itemId: z.number().int().positive(),
          propriedadeId: z.number().int().positive(),
          tipo: z.enum(["entrada", "saida", "reserva", "consumo", "ajuste", "perda", "transferencia"]),
          quantidade: z.number().positive(),
          motivo: z.string().optional(),
          tarefaId: z.number().int().positive().optional(),
          depositoId: z.number().int().positive().optional(),
          loteId: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        const item = await getEstoqueItem(input.itemId);
        if (
          !item ||
          item.propriedadeId !== input.propriedadeId ||
          (item.organizationId != null && item.organizationId !== tenant.organizationId)
        ) {
          throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
        }
        try {
          return await registrarMovimentoEstoque({
            itemId: input.itemId,
            organizationId: tenant.organizationId,
            propriedadeId: input.propriedadeId,
            usuarioId: tenant.perfilId,
            createdByUserId: tenant.userId,
            tipo: input.tipo,
            quantidade: input.quantidade.toFixed(3),
            motivo: input.motivo,
            tarefaId: input.tarefaId,
            depositoId: input.depositoId,
            loteId: input.loteId,
          } as any);
        } catch (e: any) {
          const msg = e?.message ?? "Falha no movimento";
          if (
            msg.includes("Saldo insuficiente") ||
            msg.includes("Quantidade inválida") ||
            msg.includes("operação relacionada")
          ) {
            throw new TRPCError({ code: "BAD_REQUEST", message: msg });
          }
          throw e;
        }
      }),

    historico: organizationProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          itemId: z.number().int().positive().optional(),
          limit: z.number().int().min(1).max(200).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await assertPropertyInTenant(tenant, input.propriedadeId);
        return listMovimentosEstoque({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          itemId: input.itemId,
          limit: input.limit,
        });
      }),
  }),

  // ── Etapa 8: custos ───────────────────────────────────────────────────────
  custos: router({
    list: organizationProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          safraId: z.number().int().positive().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        requireOrgPermission(tenant, "finance.read");
        await requirePropertyInTenant(tenant, input.propriedadeId);
        if (input.safraId) {
          const { requireSafraInProperty } = await import("../db-safras");
          await requireSafraInProperty(
            tenant.organizationId,
            input.propriedadeId,
            input.safraId,
          );
        }
        const { filterRowsBySafraId } = await import("../../lib/propriedades/safra-filter");
        const [orcamentosAll, custosAll] = await Promise.all([
          listOrcamentos(input.propriedadeId),
          listCustos(input.propriedadeId),
        ]);
        return {
          orcamentos: filterRowsBySafraId(orcamentosAll, input.safraId ?? null).matched,
          custos: filterRowsBySafraId(custosAll, input.safraId ?? null).matched,
          scope: {
            organizationId: tenant.organizationId,
            propriedadeId: input.propriedadeId,
            safraId: input.safraId ?? null,
          },
        };
      }),

    createOrcamento: orgPermissionProcedure("finance.write")
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          nomeSafra: z.string().min(1).max(80),
          safraId: z.number().int().positive().optional(),
          orcamentoPrevisto: z.number().min(0),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        let safraId = input.safraId;
        if (safraId) {
          const { requireSafraInProperty } = await import("../db-safras");
          await requireSafraInProperty(
            tenant.organizationId,
            input.propriedadeId,
            safraId,
          );
        } else {
          const { ensureDefaultSafra } = await import("../db-safras");
          safraId = (
            await ensureDefaultSafra({
              organizationId: tenant.organizationId,
              propriedadeId: input.propriedadeId,
              createdByUserId: tenant.userId,
              nome: input.nomeSafra,
            })
          ).id;
        }
        return createOrcamento({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          safraId,
          nomeSafra: input.nomeSafra,
          orcamentoPrevisto: input.orcamentoPrevisto.toFixed(2),
          custoRealizado: "0",
          moeda: "BRL",
        } as any);
      }),

    createCusto: orgPermissionProcedure("finance.write")
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          safraId: z.number().int().positive().optional(),
          orcamentoId: z.number().int().positive().optional(),
          tarefaId: z.number().int().positive().optional(),
          categoria: z.enum(["insumo", "mao_obra", "maquina", "combustivel", "servico", "outro"]).optional(),
          descricao: z.string().min(1).max(200),
          valor: z.number().positive(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        let safraId = input.safraId;
        if (safraId) {
          const { requireSafraInProperty } = await import("../db-safras");
          await requireSafraInProperty(
            tenant.organizationId,
            input.propriedadeId,
            safraId,
          );
        } else {
          const { ensureDefaultSafra } = await import("../db-safras");
          safraId = (
            await ensureDefaultSafra({
              organizationId: tenant.organizationId,
              propriedadeId: input.propriedadeId,
              createdByUserId: tenant.userId,
            })
          ).id;
        }
        const id = await createCusto({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          safraId,
          orcamentoId: input.orcamentoId,
          tarefaId: input.tarefaId,
          categoria: input.categoria ?? "outro",
          descricao: input.descricao,
          valor: input.valor.toFixed(2),
          usuarioId: tenant.perfilId,
          dataCusto: new Date(),
        } as any);
        await registrarAtividade({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          usuarioId: tenant.perfilId,
          tipo: "custo",
          titulo: `Custo: ${input.descricao}`,
          detalhe: `R$ ${input.valor.toFixed(2)}`,
          gravidade: "info",
        });
        return id;
      }),
  }),

  // ── P3: máquinas e equipamentos operacionais ─────────────────────────────
  maquinas: router({
    list: organizationProcedure
      .input(z.object({ propriedadeId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await assertPropertyInTenant(tenant, input.propriedadeId);
        return listMaquinasOperacionais(input.propriedadeId, tenant.organizationId);
      }),

    create: orgPermissionProcedure("property.write")
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          nome: z.string().min(1).max(120),
          tipo: maquinaTipoSchema.optional(),
          identificador: z.string().max(80).optional(),
          status: maquinaStatusSchema.optional(),
          horasUso: z.number().nonnegative().optional(),
          notas: z.string().max(2_000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        const id = await createMaquinaOperacional({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          nome: input.nome.trim(),
          tipo: input.tipo ?? "outro",
          identificador: input.identificador?.trim() || undefined,
          status: input.status ?? "disponivel",
          horasUso: input.horasUso != null ? input.horasUso.toFixed(1) : undefined,
          notas: input.notas?.trim() || undefined,
          createdByUserId: tenant.userId,
        } as any);
        await registrarAtividade({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          usuarioId: tenant.perfilId,
          tipo: "maquina",
          titulo: `Máquina cadastrada: ${input.nome.trim()}`,
          detalhe: input.tipo ?? "outro",
          gravidade: "info",
        });
        return id;
      }),

    update: orgPermissionProcedure("property.write")
      .input(
        z.object({
          id: z.number().int().positive(),
          nome: z.string().min(1).max(120).optional(),
          tipo: maquinaTipoSchema.optional(),
          identificador: z.string().max(80).optional().nullable(),
          status: maquinaStatusSchema.optional(),
          horasUso: z.number().nonnegative().optional().nullable(),
          notas: z.string().max(2_000).optional().nullable(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        const maquina = await getMaquinaOperacional(input.id, tenant.organizationId);
        if (!maquina) {
          throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
        }
        await requirePropertyInTenant(tenant, maquina.propriedadeId);
        const patch: Record<string, unknown> = {};
        if (input.nome != null) patch.nome = input.nome.trim();
        if (input.tipo != null) patch.tipo = input.tipo;
        if (input.identificador !== undefined) patch.identificador = input.identificador?.trim() || null;
        if (input.status != null) patch.status = input.status;
        if (input.horasUso !== undefined) {
          patch.horasUso = input.horasUso == null ? null : input.horasUso.toFixed(1);
        }
        if (input.notas !== undefined) patch.notas = input.notas?.trim() || null;
        if (Object.keys(patch).length > 0) {
          await updateMaquinaOperacional(input.id, patch as any, tenant.organizationId);
        }
        return { success: true };
      }),

    remove: orgPermissionProcedure("property.write")
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        const maquina = await getMaquinaOperacional(input.id, tenant.organizationId);
        if (!maquina) {
          throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
        }
        await requirePropertyInTenant(tenant, maquina.propriedadeId);
        await removeMaquinaOperacional(input.id, tenant.organizationId);
        return { success: true };
      }),
  }),

  // ── Etapa 10 / Segurança Etapa 7: métricas (tenant-db + safra) ─────────────
  metricas: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        nomeSafra: z.string().min(1).max(80).optional(),
        safraId: z.number().int().positive().optional(),
        cacheScope: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertPropertyInTenant(tenant, input.propriedadeId);
      const { filterRowsBySafraId } = await import("../../lib/propriedades/safra-filter");
      let resolvedSafraId: number | null = input.safraId ?? null;
      let resolvedLabel = input.nomeSafra ?? null;
      if (input.safraId) {
        const { requireSafraInProperty } = await import("../db-safras");
        const safra = await requireSafraInProperty(
          tenant.organizationId,
          input.propriedadeId,
          input.safraId,
        );
        resolvedSafraId = safra.id;
        resolvedLabel = safra.nome;
      }
      const tdb = createTenantDb(tenant.organizationId);
      const [tarefasAll, terrenos, custosAll, ocorrenciasAll, estoque, orcamentosAll] =
        await Promise.all([
          tdb.listTarefasByPropriedade(input.propriedadeId),
          tdb.listTerrenosByPropriedade(input.propriedadeId),
          tdb.listCustos(input.propriedadeId),
          tdb.listOcorrencias(input.propriedadeId),
          tdb.listEstoque(input.propriedadeId),
          tdb.listOrcamentos(input.propriedadeId),
        ]);

      const tarefas = filterRowsBySafraId(tarefasAll, resolvedSafraId).matched;
      const ocorrencias = filterRowsBySafraId(ocorrenciasAll, resolvedSafraId).matched;
      let orcamentosSafra = filterRowsBySafraId(orcamentosAll, resolvedSafraId).matched;
      if (orcamentosSafra.length === 0 && resolvedLabel) {
        orcamentosSafra = orcamentosAll.filter((o) =>
          safraLabelsMatch(o.nomeSafra, resolvedLabel),
        );
      }
      const orcamentoIds = new Set(orcamentosSafra.map((o) => o.id));
      const custosBySafra = filterRowsBySafraId(custosAll, resolvedSafraId).matched;
      const custos =
        resolvedSafraId != null
          ? custosBySafra.length > 0
            ? custosBySafra
            : custosAll.filter((c) => c.orcamentoId != null && orcamentoIds.has(c.orcamentoId))
          : resolvedLabel
            ? custosAll.filter((c) => c.orcamentoId != null && orcamentoIds.has(c.orcamentoId))
            : custosAll;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const abertas = tarefas.filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus));
      const atrasadas = abertas.filter((t) => new Date(t.dataPrevista) < today);
      const areaHa = terrenos.reduce((s, t) => s + Number(t.area || 0), 0);
      const totalCustos = custos.reduce((s, c) => s + Number(c.valor || 0), 0);
      const ocorrenciasAbertas = ocorrencias.filter(
        (o) => o.status === "aberta" || o.status === "em_acompanhamento",
      );
      const estoqueCritico = estoque.filter(
        (e) => Number(e.saldo) <= Number(e.estoqueMinimo ?? 0),
      );

      const valores: Record<string, number> = {
        tarefas_abertas: abertas.length,
        tarefas_atrasadas: atrasadas.length,
        area_talhoes_ha: areaHa,
        custo_ha: areaHa > 0 ? totalCustos / areaHa : 0,
        ocorrencias_abertas: ocorrenciasAbertas.length,
        estoque_itens_criticos: estoqueCritico.length,
      };

      return {
        periodo: {
          inicio: null,
          fim: new Date().toISOString(),
          label: resolvedLabel ?? "atual",
          nomeSafra: resolvedLabel,
          safraId: resolvedSafraId,
        },
        scope: {
          organizationId: tenant.organizationId,
          propriedadeId: input.propriedadeId,
          safraId: resolvedSafraId,
        },
        organizationId: tenant.organizationId,
        propriedadeId: input.propriedadeId,
        catalogo: METRICAS_CATALOGO.map((m) => ({
          ...m,
          valor: valores[m.id] ?? null,
          confianca: m.tipo === "calculada" ? "alta" : "media",
        })),
        qualidadeDados: {
          score: Math.round(
            ((propHas(valores) + (areaHa > 0 ? 1 : 0) + (tarefas.length > 0 ? 1 : 0)) / 3) * 100,
          ),
          notas: [
            areaHa > 0 ? "Área de talhões preenchida" : "Sem área de talhões",
            tarefas.length > 0 ? "Há tarefas registradas" : "Sem tarefas",
            estoque.length > 0 ? "Estoque iniciado" : "Estoque vazio",
            resolvedSafraId
              ? `Safra filtrada: id=${resolvedSafraId} (${orcamentosSafra.length} orçamento(s))`
              : "Sem filtro de safra",
          ],
        },
      };

      function propHas(v: Record<string, number>) {
        return Object.values(v).some((n) => n > 0) ? 1 : 0;
      }
    }),

  /** Safras persistentes (correção Etapa 2) — listagem + ensure default */
  safras: router({
    list: organizationProcedure
      .input(z.object({ propriedadeId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await assertPropertyInTenant(tenant, input.propriedadeId);
        const { listSafrasByPropriedade, ensureDefaultSafra } = await import("../db-safras");
        let list = await listSafrasByPropriedade(
          tenant.organizationId,
          input.propriedadeId,
        );
        // Reparo server-side: leitor não depende de mutação property.write
        if (list.length === 0) {
          await ensureDefaultSafra({
            organizationId: tenant.organizationId,
            propriedadeId: input.propriedadeId,
            createdByUserId: tenant.userId,
          });
          list = await listSafrasByPropriedade(
            tenant.organizationId,
            input.propriedadeId,
          );
        }
        return list;
      }),

    ensureDefault: orgPermissionProcedure("property.write")
      .input(z.object({ propriedadeId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        const { ensureDefaultSafra } = await import("../db-safras");
        return ensureDefaultSafra({
          organizationId: tenant.organizationId,
          propriedadeId: input.propriedadeId,
          createdByUserId: tenant.userId,
        });
      }),

    get: organizationProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          safraId: z.number().int().positive(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await assertPropertyInTenant(tenant, input.propriedadeId);
        const { requireSafraInProperty } = await import("../db-safras");
        return requireSafraInProperty(
          tenant.organizationId,
          input.propriedadeId,
          input.safraId,
        );
      }),

    close: orgPermissionProcedure("safra.close")
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          safraId: z.number().int().positive(),
          /** Obrigatório se a safra encerrada for a padrão — não criar silenciosamente */
          nextDefaultSafraId: z.number().int().positive().optional(),
          allowNoDefault: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        const { closeSafra } = await import("../db-safras");
        const { writeAuditLog } = await import("../private-files");
        const { registrarAtividade } = await import("../db-propriedade-expansao");
        const { closed, newDefault } = await closeSafra({
          organizationId: tenant.organizationId,
          propriedadeId: input.propriedadeId,
          safraId: input.safraId,
          nextDefaultSafraId: input.nextDefaultSafraId,
          allowNoDefault: input.allowNoDefault,
        });
        await writeAuditLog({
          organizationId: tenant.organizationId,
          actorUserId: tenant.userId,
          action: "safra.close",
          resourceType: "safra",
          resourceId: String(closed.id),
          meta: JSON.stringify({
            propriedadeId: input.propriedadeId,
            nome: closed.nome,
            status: closed.status,
            nextDefaultSafraId: newDefault?.id ?? null,
          }),
        });
        await registrarAtividade({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          safraId: closed.id,
          usuarioId: tenant.perfilId,
          tipo: "safra",
          titulo: `Safra encerrada: ${closed.nome}`,
          detalhe: newDefault
            ? `Nova corrente: ${newDefault.nome}`
            : "Modo histórico — somente leitura",
          gravidade: "atencao",
        } as any);
        return { ...closed, newDefault };
      }),

    reopen: orgPermissionProcedure("safra.reopen")
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          safraId: z.number().int().positive(),
          makeDefault: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        await requirePropertyInTenant(tenant, input.propriedadeId);
        const { reopenSafra } = await import("../db-safras");
        const { writeAuditLog } = await import("../private-files");
        const { registrarAtividade } = await import("../db-propriedade-expansao");
        const safra = await reopenSafra({
          organizationId: tenant.organizationId,
          propriedadeId: input.propriedadeId,
          safraId: input.safraId,
          makeDefault: input.makeDefault ?? true,
        });
        await writeAuditLog({
          organizationId: tenant.organizationId,
          actorUserId: tenant.userId,
          action: "safra.reopen",
          resourceType: "safra",
          resourceId: String(safra.id),
          meta: JSON.stringify({
            propriedadeId: input.propriedadeId,
            nome: safra.nome,
            status: safra.status,
            makeDefault: input.makeDefault ?? true,
          }),
        });
        await registrarAtividade({
          propriedadeId: input.propriedadeId,
          organizationId: tenant.organizationId,
          safraId: safra.id,
          usuarioId: tenant.perfilId,
          tipo: "safra",
          titulo: `Safra reaberta: ${safra.nome}`,
          detalhe: "Escrita liberada conforme capabilities",
          gravidade: "info",
        } as any);
        return safra;
      }),
  }),

  /** Agregador visão geral — dados só via tenant-db */
  overview: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        nomeSafra: z.string().min(1).max(80).optional(),
        /** Preferir safraId quando disponível; nomeSafra é legado */
        safraId: z.number().int().positive().optional(),
        cacheScope: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertPropertyInTenant(tenant, input.propriedadeId);
      const { ensureDefaultSafra, requireSafraInProperty } = await import("../db-safras");
      const {
        filterRowsBySafraId,
        buildCompleteness,
      } = await import("../../lib/propriedades/safra-filter");

      let resolvedSafraId: number | null = input.safraId ?? null;
      let resolvedSafraNome: string | null = input.nomeSafra ?? null;
      if (input.safraId) {
        const safra = await requireSafraInProperty(
          tenant.organizationId,
          input.propriedadeId,
          input.safraId,
        );
        resolvedSafraId = safra.id;
        resolvedSafraNome = safra.nome;
      } else {
        const def = await ensureDefaultSafra({
          organizationId: tenant.organizationId,
          propriedadeId: input.propriedadeId,
          createdByUserId: tenant.userId,
        });
        resolvedSafraId = def.id;
        resolvedSafraNome = def.nome;
      }

      const tdb = createTenantDb(tenant.organizationId);
      const [
        tarefasAll,
        cultivosAll,
        terrenos,
        estoque,
        orcamentosAll,
        ocorrenciasAll,
        atividadesAll,
        prop,
        lotes,
        reservas,
      ] = await Promise.all([
        tdb.listTarefasByPropriedade(input.propriedadeId),
        tdb.listCulturasByPropriedade(input.propriedadeId),
        tdb.listTerrenosByPropriedade(input.propriedadeId),
        tdb.listEstoque(input.propriedadeId),
        tdb.listOrcamentos(input.propriedadeId),
        tdb.listOcorrencias(input.propriedadeId),
        tdb.listAtividades(input.propriedadeId, 30),
        tdb.requirePropriedade(input.propriedadeId),
        listLotesPorPropriedade(input.propriedadeId, tenant.organizationId),
        listReservasPorPropriedade(input.propriedadeId, tenant.organizationId),
      ]);

      const tarefasF = filterRowsBySafraId(tarefasAll, resolvedSafraId);
      const cultivosF = filterRowsBySafraId(cultivosAll, resolvedSafraId);
      const ocorrenciasF = filterRowsBySafraId(ocorrenciasAll, resolvedSafraId);
      const orcamentosF = filterRowsBySafraId(orcamentosAll, resolvedSafraId);
      const atividadesF = filterRowsBySafraId(atividadesAll, resolvedSafraId);

      // Legado: se orçamentos ainda sem safraId, fallback por nome
      let orcamentos = orcamentosF.matched;
      if (orcamentos.length === 0 && resolvedSafraNome) {
        orcamentos = orcamentosAll.filter((o) =>
          safraLabelsMatch(o.nomeSafra, resolvedSafraNome),
        );
      }

      const completeness = buildCompleteness({
        safraId: resolvedSafraId,
        orphanCounts: {
          tarefas: tarefasF.orphans,
          cultivos: cultivosF.orphans,
          ocorrencias: ocorrenciasF.orphans,
          orcamentos: orcamentosF.orphans,
          atividades: atividadesF.orphans,
        },
      });

      const tarefas = tarefasF.matched;
      const cultivos = cultivosF.matched;
      const ocorrencias = ocorrenciasF.matched;
      const atividades = atividadesF.matched.slice(0, 10);

      const estoqueNomeDash = new Map(estoque.map((e) => [e.id, e.nome]));
      const alertas = gerarAlertas({
        tarefas,
        cultivos,
        estoque,
        lotes: lotes.map((l) => ({
          id: l.id,
          itemId: l.itemId,
          itemNome: estoqueNomeDash.get(l.itemId),
          codigo: l.codigo,
          validade: l.validade,
          bloqueado: Boolean(l.bloqueado),
        })),
        reservas: reservas.map((r) => ({
          id: r.id,
          itemId: r.itemId,
          itemNome: estoqueNomeDash.get(r.itemId),
          quantidade: r.quantidade,
          status: r.status,
          tarefaId: r.tarefaId,
        })),
        orcamentos,
        ocorrencias: ocorrencias.map((o) => ({
          id: o.id,
          titulo: o.titulo,
          status: o.status,
          severidade: o.severidade,
          createdAt: o.createdAt,
        })),
        temGeometriaPropriedade: Boolean(prop?.geometriaGeoJson),
      });
      return {
        propriedade: prop,
        organizationId: tenant.organizationId,
        nomeSafra: resolvedSafraNome,
        scope: {
          organizationId: tenant.organizationId,
          propriedadeId: input.propriedadeId,
          safraId: resolvedSafraId,
          generatedAt: new Date().toISOString(),
        },
        completeness,
        contagens: {
          talhoes: terrenos.length,
          cultivos: cultivos.length,
          tarefasAbertas: tarefas.filter((t) =>
            STATUS_ABERTOS.includes(t.status as TarefaStatus),
          ).length,
          ocorrenciasAbertas: ocorrencias.filter((o) => o.status === "aberta").length,
          itensEstoque: estoque.length,
          orcamentosSafra: orcamentos.length,
        },
        alertas: alertas.slice(0, 10),
        atividades,
        geometrias: {
          propriedade: prop?.geometriaGeoJson ?? null,
          talhoes: terrenos
            .filter((t) => t.geometriaGeoJson)
            .map((t) => ({ id: t.id, nome: t.nome, geojson: t.geometriaGeoJson })),
        },
      };
    }),
});
