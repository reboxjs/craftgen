import { z } from "../deps.ts";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";
import { packageRouter } from "./package.ts";

export const appRouter = createTRPCRouter({
  package: packageRouter,
  context: publicProcedure
    .input(
      z.object({
        machineId: z.string(),
        type: z.string(),
        payload: z.any(),
        delay: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const event = {
        type: input.type,
        payload: input.payload,
        delay: input.delay,
      };

      await ctx.queue.enqueueEvent({
        machineId: input.machineId,
        type: input.type,
        payload: input.payload,
        scheduledFor: new Date(),
      });

      return {
        event,
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
