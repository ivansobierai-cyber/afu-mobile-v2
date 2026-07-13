import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {
  criarParticipante,
  listarParticipantes,
  criarFeedback,
  listarFeedback,
  resumoPiloto,
} from "../db-piloto";

export const pilotoRouter = router({
  participantes: router({
    create: publicProcedure
      .input(
        z.object({
          nome: z.string().min(2).max(200),
          email: z.string().email().optional().nullable(),
          regiao: z.string().max(100).optional().nullable(),
          cultura: z.string().max(100).optional().nullable(),
        }),
      )
      .mutation(async ({ input }) => {
        const id = await criarParticipante({
          nome: input.nome,
          email: input.email ?? null,
          regiao: input.regiao ?? null,
          cultura: input.cultura ?? null,
          status: "ativo",
        });
        return { id };
      }),

    list: publicProcedure.query(() => listarParticipantes()),
  }),

  feedback: router({
    submit: publicProcedure
      .input(
        z.object({
          participanteId: z.number().int().positive(),
          notaNps: z.number().int().min(0).max(10),
          comentario: z.string().max(2000).optional().nullable(),
        }),
      )
      .mutation(async ({ input }) => {
        const id = await criarFeedback({
          participanteId: input.participanteId,
          notaNps: input.notaNps,
          comentario: input.comentario ?? null,
        });
        return { id };
      }),

    list: publicProcedure.query(() => listarFeedback()),
  }),

  metricas: router({
    resumo: publicProcedure.query(() => resumoPiloto()),
  }),
});
