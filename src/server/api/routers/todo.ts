import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

const todoRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.todo.findMany({
      where: {
        userId: ctx.auth.userId as string,
      },
    });
  }),

  add: publicProcedure
    .input(z.string()) // title content
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.auth.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to create a Todo.",
          });
        }

        await ctx.prisma.todo.create({
          data: {
            title: input,
            userId: ctx.auth.userId,
          },
        });
        return true;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong, cannot create Todo.",
        });
      }
    }),

  toggleCompleted: publicProcedure
    .input(
      z.object({
        id: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.todo.update({
          where: { id: input.id },
          data: {
            completed: {
              set: input.completed,
            },
          },
        });
        return true;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong, cannot mark Todo as done or undone.",
        });
      }
    }),

  delete: publicProcedure
    .input(z.string()) // id
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.todo.delete({
          where: { id: input },
        });
        return true;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong, cannot delete the Todo.",
        });
      }
    }),
});

export default todoRouter;
