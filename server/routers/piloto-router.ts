import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import {
  criarParticipante,
  listarParticipantes,
  criarFeedback,
  listarFeedback,
  resumoPiloto,
} from "../db-piloto";

/**
 * Etapa 4 — painel piloto/NOC interno: listagens e métricas só admin.
 * Feedback submit permanece autenticado (participante do piloto).
 */
export const pilotoRouter = router({
  participantes: router({
    create: adminProcedure
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

    list: adminProcedure.query(() => listarParticipantes()),
  }),

  feedback: router({
    submit: protectedProcedure
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

    list: adminProcedure.query(() => listarFeedback()),
  }),

  metricas: router({
    resumo: adminProcedure.query(() => resumoPiloto()),
  }),
});
