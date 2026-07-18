/**
 * Etapas 4–10 — alertas, ocorrências, estoque, custos, geometria, métricas
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getUsuarioAfuByUserId,
  getPropriedadeById,
  getTarefasByPropriedade,
  getCulturasByPropriedade,
  getTerrenosByPropriedade,
  propriedadeBelongsToProdutor,
  createTarefa,
  getDb,
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
  listOrcamentos,
  createOrcamento,
  listCustos,
  createCusto,
  listAtividades,
  registrarAtividade,
  updateGeometriaPropriedade,
  updateGeometriaTerreno,
} from "../db-propriedade-expansao";
import { produtores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { gerarAlertas, METRICAS_CATALOGO } from "../../lib/propriedades/alertas-engine";
import { STATUS_ABERTOS, type TarefaStatus } from "../../lib/propriedades/tarefa-status";

async function getProdutorId(usuarioAfuId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select({ id: produtores.id })
    .from(produtores)
    .where(eq(produtores.usuarioId, usuarioAfuId))
    .limit(1);
  if (rows.length === 0) {
    const result = await db.insert(produtores).values({ usuarioId: usuarioAfuId });
    return (result as any)[0].insertId as number;
  }
  return rows[0].id;
}

async function assertOwns(userId: number, propriedadeId: number) {
  const perfil = await getUsuarioAfuByUserId(userId);
  if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
  const produtorId = await getProdutorId(perfil.id);
  const owned = await propriedadeBelongsToProdutor(propriedadeId, produtorId);
  if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "Propriedade não pertence ao usuário" });
  return perfil;
}

export const propriedadeExpansaoRouter = router({
  // ── Etapa 4: alertas + feed ───────────────────────────────────────────────
  alertas: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertOwns(ctx.user.id, input.propriedadeId);
      const [tarefas, cultivos, estoque, orcamentos, ocorrencias, prop] = await Promise.all([
        getTarefasByPropriedade(input.propriedadeId),
        getCulturasByPropriedade(input.propriedadeId),
        listEstoque(input.propriedadeId),
        listOrcamentos(input.propriedadeId),
        listOcorrencias(input.propriedadeId),
        getPropriedadeById(input.propriedadeId),
      ]);
      return gerarAlertas({
        tarefas,
        cultivos,
        estoque,
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

  atividades: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive(), limit: z.number().int().positive().max(100).optional() }))
    .query(async ({ ctx, input }) => {
      await assertOwns(ctx.user.id, input.propriedadeId);
      return listAtividades(input.propriedadeId, input.limit ?? 30);
    }),

  // ── Etapa 5: geometria ────────────────────────────────────────────────────
  setGeometriaPropriedade: protectedProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        geometriaGeoJson: z.string().min(2),
        areaGeometricaHa: z.number().optional(),
        origem: z.enum(["desenhada", "gps", "importada", "integracao"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const perfil = await assertOwns(ctx.user.id, input.propriedadeId);
      // Validação mínima GeoJSON
      let parsed: any;
      try {
        parsed = JSON.parse(input.geometriaGeoJson);
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "GeoJSON inválido" });
      }
      if (!parsed || (parsed.type !== "Polygon" && parsed.type !== "Feature" && parsed.type !== "FeatureCollection")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "GeoJSON deve ser Polygon ou Feature" });
      }
      await updateGeometriaPropriedade(input.propriedadeId, {
        geometriaGeoJson: input.geometriaGeoJson,
        areaGeometricaHa: input.areaGeometricaHa?.toString(),
        geometriaOrigem: input.origem,
      });
      await registrarAtividade({
        propriedadeId: input.propriedadeId,
        usuarioId: perfil.id,
        tipo: "geometria",
        titulo: "Perímetro da propriedade atualizado",
        detalhe: `Origem: ${input.origem ?? "desenhada"}`,
        gravidade: "info",
      });
      return { success: true };
    }),

  setGeometriaTerreno: protectedProcedure
    .input(
      z.object({
        terrenoId: z.number().int().positive(),
        propriedadeId: z.number().int().positive(),
        geometriaGeoJson: z.string().min(2),
        areaGeometricaHa: z.number().optional(),
        origem: z.enum(["desenhada", "gps", "importada", "integracao"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwns(ctx.user.id, input.propriedadeId);
      try {
        JSON.parse(input.geometriaGeoJson);
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "GeoJSON inválido" });
      }
      await updateGeometriaTerreno(input.terrenoId, {
        geometriaGeoJson: input.geometriaGeoJson,
        areaGeometricaHa: input.areaGeometricaHa?.toString(),
        geometriaOrigem: input.origem,
      });
      return { success: true };
    }),

  // ── Etapa 6: ocorrências ──────────────────────────────────────────────────
  ocorrencias: router({
    list: protectedProcedure
      .input(z.object({ propriedadeId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await assertOwns(ctx.user.id, input.propriedadeId);
        return listOcorrencias(input.propriedadeId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
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
        const perfil = await assertOwns(ctx.user.id, input.propriedadeId);
        const id = await createOcorrencia({
          propriedadeId: input.propriedadeId,
          terrenoId: input.terrenoId,
          culturaId: input.culturaId,
          diagnosticoId: input.diagnosticoId,
          usuarioId: perfil.id,
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
          usuarioId: perfil.id,
          tipo: "ocorrencia",
          titulo: `Ocorrência: ${input.titulo}`,
          detalhe: input.descricao,
          gravidade: input.severidade === "critica" ? "critico" : "atencao",
        });
        return id;
      }),

    criarTarefa: protectedProcedure
      .input(
        z.object({
          ocorrenciaId: z.number().int().positive(),
          titulo: z.string().min(1).max(200).optional(),
          dataPrevista: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const oc = await getOcorrenciaById(input.ocorrenciaId);
        if (!oc) throw new TRPCError({ code: "NOT_FOUND", message: "Ocorrência não encontrada" });
        const perfil = await assertOwns(ctx.user.id, oc.propriedadeId);
        const tarefaId = await createTarefa({
          usuarioId: perfil.id,
          propriedadeId: oc.propriedadeId,
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
        await updateOcorrencia(oc.id, { tarefaId, status: "em_acompanhamento" } as any);
        await registrarAtividade({
          propriedadeId: oc.propriedadeId,
          usuarioId: perfil.id,
          tipo: "tarefa",
          titulo: `Tarefa criada a partir da ocorrência #${oc.id}`,
          gravidade: "info",
        });
        return { tarefaId, ocorrenciaId: oc.id };
      }),

    resolver: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          resultado: z.enum(["melhorou", "estavel", "piorou", "resolvido"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const oc = await getOcorrenciaById(input.id);
        if (!oc) throw new TRPCError({ code: "NOT_FOUND", message: "Ocorrência não encontrada" });
        await assertOwns(ctx.user.id, oc.propriedadeId);
        await updateOcorrencia(oc.id, {
          status: input.resultado === "resolvido" ? "resolvida" : "em_acompanhamento",
          resultadoAcompanhamento: input.resultado,
        } as any);
        return { success: true };
      }),
  }),

  // ── Etapa 7: estoque ──────────────────────────────────────────────────────
  estoque: router({
    list: protectedProcedure
      .input(z.object({ propriedadeId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await assertOwns(ctx.user.id, input.propriedadeId);
        return listEstoque(input.propriedadeId);
      }),

    createItem: protectedProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          nome: z.string().min(1).max(150),
          categoria: z.enum(["fertilizante", "defensivo", "semente", "combustivel", "peca", "outro"]).optional(),
          unidadeBase: z.string().max(30).optional(),
          saldoInicial: z.number().min(0).optional(),
          estoqueMinimo: z.number().min(0).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const perfil = await assertOwns(ctx.user.id, input.propriedadeId);
        const id = await createEstoqueItem({
          propriedadeId: input.propriedadeId,
          nome: input.nome,
          categoria: input.categoria ?? "outro",
          unidadeBase: input.unidadeBase ?? "kg",
          saldo: "0",
          estoqueMinimo: (input.estoqueMinimo ?? 0).toFixed(3),
        } as any);
        if ((input.saldoInicial ?? 0) > 0) {
          await registrarMovimentoEstoque({
            itemId: id,
            usuarioId: perfil.id,
            tipo: "entrada",
            quantidade: (input.saldoInicial ?? 0).toFixed(3),
            motivo: "Saldo inicial",
          } as any);
        }
        return id;
      }),

    movimento: protectedProcedure
      .input(
        z.object({
          itemId: z.number().int().positive(),
          propriedadeId: z.number().int().positive(),
          tipo: z.enum(["entrada", "saida", "reserva", "consumo", "ajuste", "perda"]),
          quantidade: z.number().positive(),
          motivo: z.string().optional(),
          tarefaId: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const perfil = await assertOwns(ctx.user.id, input.propriedadeId);
        const item = await getEstoqueItem(input.itemId);
        if (!item || item.propriedadeId !== input.propriedadeId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
        }
        return registrarMovimentoEstoque({
          itemId: input.itemId,
          usuarioId: perfil.id,
          tipo: input.tipo,
          quantidade: input.quantidade.toFixed(3),
          motivo: input.motivo,
          tarefaId: input.tarefaId,
        } as any);
      }),
  }),

  // ── Etapa 8: custos ───────────────────────────────────────────────────────
  custos: router({
    list: protectedProcedure
      .input(z.object({ propriedadeId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await assertOwns(ctx.user.id, input.propriedadeId);
        const [orcamentos, custos] = await Promise.all([
          listOrcamentos(input.propriedadeId),
          listCustos(input.propriedadeId),
        ]);
        return { orcamentos, custos };
      }),

    createOrcamento: protectedProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          nomeSafra: z.string().min(1).max(80),
          orcamentoPrevisto: z.number().min(0),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertOwns(ctx.user.id, input.propriedadeId);
        return createOrcamento({
          propriedadeId: input.propriedadeId,
          nomeSafra: input.nomeSafra,
          orcamentoPrevisto: input.orcamentoPrevisto.toFixed(2),
          custoRealizado: "0",
          moeda: "BRL",
        } as any);
      }),

    createCusto: protectedProcedure
      .input(
        z.object({
          propriedadeId: z.number().int().positive(),
          orcamentoId: z.number().int().positive().optional(),
          tarefaId: z.number().int().positive().optional(),
          categoria: z.enum(["insumo", "mao_obra", "maquina", "combustivel", "servico", "outro"]).optional(),
          descricao: z.string().min(1).max(200),
          valor: z.number().positive(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const perfil = await assertOwns(ctx.user.id, input.propriedadeId);
        const id = await createCusto({
          propriedadeId: input.propriedadeId,
          orcamentoId: input.orcamentoId,
          tarefaId: input.tarefaId,
          categoria: input.categoria ?? "outro",
          descricao: input.descricao,
          valor: input.valor.toFixed(2),
          usuarioId: perfil.id,
          dataCusto: new Date(),
        } as any);
        await registrarAtividade({
          propriedadeId: input.propriedadeId,
          usuarioId: perfil.id,
          tipo: "custo",
          titulo: `Custo: ${input.descricao}`,
          detalhe: `R$ ${input.valor.toFixed(2)}`,
          gravidade: "info",
        });
        return id;
      }),
  }),

  // ── Etapa 10: métricas ────────────────────────────────────────────────────
  metricas: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertOwns(ctx.user.id, input.propriedadeId);
      const [tarefas, terrenos, custos, ocorrencias, estoque] = await Promise.all([
        getTarefasByPropriedade(input.propriedadeId),
        getTerrenosByPropriedade(input.propriedadeId),
        listCustos(input.propriedadeId),
        listOcorrencias(input.propriedadeId),
        listEstoque(input.propriedadeId),
      ]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const abertas = tarefas.filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus));
      const atrasadas = abertas.filter((t) => new Date(t.dataPrevista) < today);
      const areaHa = terrenos.reduce((s, t) => s + Number(t.area || 0), 0);
      const totalCustos = custos.reduce((s, c) => s + Number(c.valor || 0), 0);
      const ocorrenciasAbertas = ocorrencias.filter((o) => o.status === "aberta" || o.status === "em_acompanhamento");
      const estoqueCritico = estoque.filter((e) => Number(e.saldo) <= Number(e.estoqueMinimo ?? 0));

      const valores: Record<string, number> = {
        tarefas_abertas: abertas.length,
        tarefas_atrasadas: atrasadas.length,
        area_talhoes_ha: areaHa,
        custo_ha: areaHa > 0 ? totalCustos / areaHa : 0,
        ocorrencias_abertas: ocorrenciasAbertas.length,
        estoque_itens_criticos: estoqueCritico.length,
      };

      return {
        periodo: { inicio: null, fim: new Date().toISOString(), label: "atual" },
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
          ],
        },
      };

      function propHas(v: Record<string, number>) {
        return Object.values(v).some((n) => n > 0) ? 1 : 0;
      }
    }),

  /** Agregador visão geral (Etapa 2/10) */
  overview: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertOwns(ctx.user.id, input.propriedadeId);
      const [tarefas, cultivos, terrenos, estoque, orcamentos, ocorrencias, atividades, prop] =
        await Promise.all([
          getTarefasByPropriedade(input.propriedadeId),
          getCulturasByPropriedade(input.propriedadeId),
          getTerrenosByPropriedade(input.propriedadeId),
          listEstoque(input.propriedadeId),
          listOrcamentos(input.propriedadeId),
          listOcorrencias(input.propriedadeId),
          listAtividades(input.propriedadeId, 10),
          getPropriedadeById(input.propriedadeId),
        ]);
      const alertas = gerarAlertas({
        tarefas,
        cultivos,
        estoque,
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
        contagens: {
          talhoes: terrenos.length,
          cultivos: cultivos.length,
          tarefasAbertas: tarefas.filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus)).length,
          ocorrenciasAbertas: ocorrencias.filter((o) => o.status === "aberta").length,
          itensEstoque: estoque.length,
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
