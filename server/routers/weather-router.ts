import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, organizationProcedure, protectedProcedure } from "../_core/trpc";
import { fetchPropertyWeather } from "../services/open-meteo";
import {
  getCtxTenant,
  requireOrgPermission,
  requirePropertyInTenant,
} from "../tenant-access";

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
    .query(async ({ input }) => {
      try {
        return await fetchPropertyWeather(
          input.latitude,
          input.longitude,
          input.locationName,
        );
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Não foi possível carregar o clima agora.";
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message,
        });
      }
    }),

  byPropriedade: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        cacheScope: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const propriedade = await requirePropertyInTenant(tenant, input.propriedadeId);

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

      try {
        return await fetchPropertyWeather(latitude, longitude, locationName);
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Não foi possível carregar o clima agora.";
        // Upstream (Open-Meteo) timeout/DNS/SSL → soft failure for the UI, not a opaque 500.
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message,
        });
      }
    }),
});
