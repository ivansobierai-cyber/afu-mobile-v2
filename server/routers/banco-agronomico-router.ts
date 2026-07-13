import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import {
  listarCatalogoCulturas,
  getCatalogoCulturaById,
  getClimaByCatalogoId,
  listNutrientesByCatalogoId,
  listPragasDoencasByCatalogoId,
  consultaAgronomica,
  countCatalogoCulturas,
} from "../db-banco-agronomico";

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

    nutrientes: publicProcedure
      .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
      .query(({ input }) => listNutrientesByCatalogoId(input.culturaCatalogoId)),

    pragas: publicProcedure
      .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
      .query(({ input }) => listPragasDoencasByCatalogoId(input.culturaCatalogoId)),
  }),

  consulta: publicProcedure
    .input(z.object({ culturaCatalogoId: z.number().int().positive() }))
    .query(({ input }) => consultaAgronomica(input.culturaCatalogoId)),

  stats: publicProcedure.query(async () => ({
    totalCulturas: await countCatalogoCulturas(),
  })),
});
