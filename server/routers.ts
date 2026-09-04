import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  providers: router({
    list: publicProcedure.input(z.object({ category: z.string().optional() }).optional()).query(({ input }) => db.listProviderProfiles(input?.category)),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getProviderProfile(input.id)),
    createProfile: protectedProcedure.input(z.object({
      name: z.string().min(2), trade: z.string().min(2), category: z.string().min(2), bio: z.string().optional(), city: z.string().optional(), phone: z.string().optional(), hourlyRate: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserAccountType(ctx.user.id, "provider");
      return db.createProviderProfile({ ...input, userId: ctx.user.id });
    }),
  }),

  portfolio: router({
    list: publicProcedure.input(z.object({ providerId: z.number() })).query(({ input }) => db.listPortfolioImages(input.providerId)),
    upload: protectedProcedure.input(z.object({ base64: z.string().min(10).max(8_000_000), mimeType: z.string().regex(/^image\//), caption: z.string().max(255).optional() })).mutation(async ({ input, ctx }) => {
      const provider = await db.getProviderProfileByUserId(ctx.user.id);
      if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: "أنشئ ملف الحرفي أولاً." });
      const stored = await storagePut(`providers/${ctx.user.id}/portfolio/image`, Buffer.from(input.base64, "base64"), input.mimeType);
      const id = await db.createPortfolioImage({ providerId: provider.id, url: stored.url, caption: input.caption });
      return { id, url: stored.url };
    }),
  }),

  requests: router({
    list: protectedProcedure.query(({ ctx }) => db.listServiceRequests(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      providerId: z.number().optional(), category: z.string().min(2), subcategory: z.string().optional(), description: z.string().optional(), address: z.string().min(3), scheduledAt: z.coerce.date().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createServiceRequest({ ...input, customerId: ctx.user.id, status: "pending" });
      await db.createNotification({ userId: ctx.user.id, title: "تم استلام طلبك", content: `طلب ${input.subcategory ?? input.category} قيد المراجعة وسنخبرك بأي تحديث.` });
      return id;
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["confirmed", "completed", "cancelled"]) })).mutation(async ({ input, ctx }) => {
      await db.updateServiceRequestStatus(input.id, ctx.user.id, input.status);
      await db.createNotification({ userId: ctx.user.id, title: "تحديث حالة الطلب", content: `تم تحديث حالة طلبك إلى: ${input.status}.` });
      return { success: true } as const;
    }),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input, ctx }) => db.markNotificationRead(input.id, ctx.user.id)),
  }),

  accounts: router({
    setType: protectedProcedure.input(z.object({ accountType: z.enum(["customer", "provider"]) })).mutation(async ({ input, ctx }) => {
      await db.updateUserAccountType(ctx.user.id, input.accountType);
      return { success: true, accountType: input.accountType } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
