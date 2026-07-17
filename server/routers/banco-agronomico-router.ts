import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import {
  listarCatalogoCulturas,
  getCatalogoCulturaById,
  getClimaByCatalogoId,
  getIrrigacaoByCatalogoId,
  listNutrientesByCatalogoId,
  listGeneticaByCatalogoId,
  listPragasDoencasByCatalogoId,
  listarPragasCatalogo,
  listarDoencasCatalogo,
  listarZonasClimaticas,
  listarTiposSolo,
  calendarioPlantioCatalogo,
  listarLabModulos,
  listarEconomiaCulturas,
  simularEconomia,
  resumoIaAgronomo,
  consultaAgronomica,
  countBancoAgronomicoStats,
  countExpansaoStats,
} from "../db-banco-agronomico";

function parseJsonField(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export const bancoAgronomicoRouter = router({
  catalogo: router({
    list: publicProcedure
      .input(z.object({ busca: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const items = await listarCatalogoCulturas(input?.busca);
        return items.map((c) => ({
          ...c,
          fasesFenologicas: c.fasesFenologicas ? JSON.parse(c.fasesFenologicas) : [],
          epocasPlantio: c.epocasPlantio ? JSON.parse(c.epocasPlantio) : [],
        }));
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const cultura = await getCatalogoCulturaById(input.id);
        if (!cultura) throw new TRPCError({ code: "NOT_FOUND", message: "Cultura não encontrada" });
        return {
          ...cultura,
          fasesFenologicas: cultura.fasesFenologicas ? JSON.parse(cultura.fasesFenologicas) : [],
          epocasPlantio: cultura.epocasPlantio ? JSON.parse(cultura.epocasPlantio) : [],
        };
      }),

    clima: publicProcedure
      .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
      .query(({ input }) => getClimaByCatalogoId(input.culturaCatalogoId)),

    irrigacao: publicProcedure
      .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
      .query(({ input }) => getIrrigacaoByCatalogoId(input.culturaCatalogoId)),

    nutrientes: publicProcedure
      .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
      .query(({ input }) => listNutrientesByCatalogoId(input.culturaCatalogoId)),

    genetica: publicProcedure
      .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
      .query(({ input }) => listGeneticaByCatalogoId(input.culturaCatalogoId)),

    pragas: publicProcedure
      .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
      .query(({ input }) => listPragasDoencasByCatalogoId(input.culturaCatalogoId)),
  }),

  fitossanitario: router({
    pragas: publicProcedure.query(() => listarPragasCatalogo()),
    doencas: publicProcedure.query(() => listarDoencasCatalogo()),
  }),

  geoclima: router({
    zonas: publicProcedure.query(async () => {
      const rows = await listarZonasClimaticas();
      return rows.map((z) => ({
        ...z,
        aptidaoCulturas: parseJsonField(z.aptidaoCulturas),
      }));
    }),
  }),

  solos: router({
    list: publicProcedure.query(async () => {
      const rows = await listarTiposSolo();
      return rows.map((s) => ({
        ...s,
        aptidaoCulturas: parseJsonField(s.aptidaoCulturas),
      }));
    }),
  }),

  calendarioPlantio: publicProcedure.query(() => calendarioPlantioCatalogo()),

  laboratorio: router({
    modulos: publicProcedure.query(async () => {
      const rows = await listarLabModulos();
      return rows.map((m) => ({
        ...m,
        parametros: parseJsonField(m.parametros),
      }));
    }),
  }),

  economia: router({
    list: publicProcedure.query(() => listarEconomiaCulturas()),
    simular: publicProcedure
      .input(
        z.object({
          culturaCatalogoId: z.number().int().positive(),
          areaHa: z.number().positive().max(100000),
          produtividade: z.number().positive().optional(),
        }),
      )
      .query(({ input }) => simularEconomia(input)),
  }),

  ia: router({
    resumo: publicProcedure.query(() => resumoIaAgronomo()),
  }),

  consulta: publicProcedure
    .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
    .query(({ input }) => consultaAgronomica(input.culturaCatalogoId)),

  stats: publicProcedure.query(async () => {
    const [core, expansao] = await Promise.all([
      countBancoAgronomicoStats(),
      countExpansaoStats(),
    ]);
    return { ...core, ...expansao };
  }),
});
