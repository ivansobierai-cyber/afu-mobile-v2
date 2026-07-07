import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb, getPropriedadeById, getUsuarioAfuByUserId } from "../db";
import { produtores } from "../../drizzle/schema";
import { fetchPropertyWeather } from "../services/open-meteo";

async function getProdutorId(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select({ id: produtores.id })
    .from(produtores)
    .where(eq(produtores.usuarioId, userId))
    .limit(1);
  if (rows.length === 0) {
    const result = await db.insert(produtores).values({ usuarioId: userId });
    return (result as any).insertId as number;
  }
  return rows[0].id;
}

function parseCoord(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export const weatherRouter = router({
  byCoordinates: protectedProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        locationName: z.string().optional(),
      }),
    )
    .query(async ({ input }) =>
      fetchPropertyWeather(input.latitude, input.longitude, input.locationName),
    ),

  byPropriedade: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      }

      const propriedade = await getPropriedadeById(input.propriedadeId);
      if (!propriedade) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Propriedade não encontrada" });
      }

      const produtorId = await getProdutorId(perfil.id);
      if (propriedade.produtorId !== produtorId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a esta propriedade" });
      }

      const latitude = parseCoord(propriedade.latitude);
      const longitude = parseCoord(propriedade.longitude);
      if (latitude == null || longitude == null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Propriedade sem coordenadas GPS. Cadastre latitude e longitude para ver o clima.",
        });
      }

      const locationName = [propriedade.nome, propriedade.cidade, propriedade.estado]
        .filter(Boolean)
        .join(" · ");

      return fetchPropertyWeather(latitude, longitude, locationName);
    }),
});
