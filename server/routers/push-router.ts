import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getUsuarioAfuByUserId, getPushTokensByUsuario } from "../db";
import {
  registerUsuarioPushToken,
  sendPushToUsuario,
  unregisterUsuarioPushToken,
} from "../services/push-delivery";

export const pushRouter = router({
  register: protectedProcedure
    .input(
      z.object({
        expoPushToken: z.string().min(10),
        platform: z.enum(["ios", "android", "web"]),
        deviceName: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      }

      await registerUsuarioPushToken({
        usuarioAfuId: perfil.id,
        expoPushToken: input.expoPushToken,
        platform: input.platform,
        deviceName: input.deviceName,
      });

      return { success: true };
    }),

  unregister: protectedProcedure
    .input(z.object({ expoPushToken: z.string().min(10) }))
    .mutation(async ({ input }) => {
      await unregisterUsuarioPushToken(input.expoPushToken);
      return { success: true };
    }),

  status: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return { registered: false, tokenCount: 0 };

    const tokens = await getPushTokensByUsuario(perfil.id);
    return {
      registered: tokens.length > 0,
      tokenCount: tokens.length,
      platforms: tokens.map((t) => t.platform),
    };
  }),

  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
    }

    const result = await sendPushToUsuario(perfil.id, {
      title: "AFU Agro — Teste de Push",
      body: "Notificações remotas ativas via FCM/APNs.",
      data: { type: "test" },
      priority: "high",
    });

    if (result.sent === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nenhum dispositivo registrado para push. Ative as notificações no app mobile.",
      });
    }

    return result;
  }),
});
