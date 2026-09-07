import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { sendPushNotification } from "./_core/notification";
import { storageGetSignedUrl } from "./storage";
import { screenSubscriptionReceipt } from "./subscription-review";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

const reviewLinkBase = () => (process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");
const reviewTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

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
    registerProvider: publicProcedure.input(z.object({ phone: z.string().regex(/^0[5-7][0-9]{8}$/), password: z.string().min(8), name: z.string().min(2) })).mutation(async ({ input, ctx }) => {
      if (await db.getUserByPhone(input.phone)) throw new TRPCError({ code: "CONFLICT", message: "رقم الهاتف مسجل مسبقاً. استخدم تسجيل الدخول." });
      const userId = await db.createPhoneUser({ phone: input.phone, passwordHash: hashPassword(input.password), name: input.name });
      const user = await db.getUserById(userId);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء الحساب." });
      const sessionToken = await (await import("./_core/sdk")).sdk.createSessionToken(user.openId, { name: user.name ?? "" });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: 365 * 24 * 60 * 60 * 1000 });
      return { sessionToken, user };
    }),
    loginProvider: publicProcedure.input(z.object({ phone: z.string().regex(/^0[5-7][0-9]{8}$/), password: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const user = await db.getUserByPhone(input.phone);
      if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "رقم الهاتف أو كلمة المرور غير صحيحة." });
      const sessionToken = await (await import("./_core/sdk")).sdk.createSessionToken(user.openId, { name: user.name ?? "" });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: 365 * 24 * 60 * 60 * 1000 });
      return { sessionToken, user };
    }),
  }),

  providers: router({
    list: publicProcedure.input(z.object({ category: z.string().optional() }).optional()).query(({ input }) => db.listProviderProfiles(input?.category)),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getProviderProfile(input.id)),
    mine: protectedProcedure.query(({ ctx }) => db.getProviderProfileByUserId(ctx.user.id)),
    report: publicProcedure.input(z.object({ providerId: z.number(), reason: z.enum(["fake", "inactive", "wrong_info", "inappropriate", "other"]), details: z.string().max(1000).optional() })).mutation(async ({ input }) => {
      const provider = await db.getProviderProfile(input.providerId);
      if (!provider) throw new TRPCError({ code: "NOT_FOUND", message: "بروفايل الحرفي غير موجود." });
      return db.createProviderReport(input);
    }),
    adminReports: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه الصفحة مخصصة للإدارة." });
      return db.listProviderReports();
    }),
    adminUpdateReport: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["reviewed", "dismissed"]) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية مخصصة للإدارة." });
      await db.updateProviderReportStatus(input.id, input.status);
      return { success: true } as const;
    }),
    createProfile: protectedProcedure.input(z.object({
      name: z.string().min(2), trade: z.string().min(2), category: z.string().min(2), bio: z.string().optional(), city: z.string().optional(), phone: z.string().optional(), hourlyRate: z.number().optional(), published: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (input.published && ctx.user.subscriptionStatus !== "active") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "فعّل اشتراكك قبل نشر ملف الحرفي." });
      }
      await db.updateUserAccountType(ctx.user.id, "provider");
      return db.createProviderProfile({ ...input, userId: ctx.user.id });
    }),
    updateProfile: protectedProcedure.input(z.object({ id: z.number(), name: z.string().min(2).optional(), trade: z.string().min(2).optional(), category: z.string().min(2).optional(), city: z.string().max(120).optional(), phone: z.string().max(32).optional(), hourlyRate: z.number().int().min(0).max(1000000), bio: z.string().max(2000).optional(), published: z.boolean().optional() })).mutation(async ({ input, ctx }) => {
      if (input.published && ctx.user.subscriptionStatus !== "active") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "فعّل اشتراكك قبل نشر ملف الحرفي." });
      }
      return db.updateProviderProfile(input.id, ctx.user.id, { name: input.name, trade: input.trade, category: input.category, city: input.city, phone: input.phone, hourlyRate: input.hourlyRate, bio: input.bio, published: input.published });
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
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input, ctx }) => db.deletePortfolioImage(input.id, ctx.user.id)),
  }),

  push: router({
    register: protectedProcedure.input(z.object({ token: z.string().min(20), platform: z.enum(["ios", "android"]) })).mutation(({ input, ctx }) => db.upsertPushToken({ userId: ctx.user.id, token: input.token, platform: input.platform })),
  }),

  requests: router({
    list: protectedProcedure.query(({ ctx }) => db.listServiceRequests(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      providerId: z.number().optional(), category: z.string().min(2), subcategory: z.string().optional(), description: z.string().optional(), address: z.string().min(3), latitude: z.string().optional(), longitude: z.string().optional(), scheduledAt: z.coerce.date().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createServiceRequest({ ...input, customerId: ctx.user.id, status: "pending" });
      await db.createNotification({ userId: ctx.user.id, title: "تم استلام طلبك", content: `طلب ${input.subcategory ?? input.category} قيد المراجعة وسنخبرك بأي تحديث.` });
      return id;
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["confirmed", "completed", "cancelled"]) })).mutation(async ({ input, ctx }) => {
      const request = await db.getServiceRequest(input.id);
      if (!request || request.customerId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود." });
      await db.updateServiceRequestStatus(input.id, ctx.user.id, input.status);
      const title = input.status === "confirmed" ? "تم تأكيد طلبك" : input.status === "completed" ? "اكتملت خدمتك" : "تم إلغاء الطلب";
      const content = input.status === "confirmed" ? "الحرفي أكد موعد الخدمة. افتح التطبيق لمراجعة التفاصيل." : input.status === "completed" ? "يمكنك الآن تقييم الحرفي وتجربتك." : "تم تحديث حالة طلبك إلى ملغى.";
      await db.createNotification({ userId: ctx.user.id, title, content });
      const tokens = await db.listPushTokens(ctx.user.id);
      await sendPushNotification(tokens.map((token) => token.token), { title, content });
      return { success: true } as const;
    }),
  }),

  dashboard: router({
    requests: protectedProcedure.query(({ ctx }) => db.listProviderRequests(ctx.user.id)),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["confirmed", "completed", "cancelled"]) })).mutation(async ({ input, ctx }) => {
      const updated = await db.updateProviderRequestStatus(input.id, ctx.user.id, input.status);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود في لوحة الحرفي." });
      const request = await db.getServiceRequest(input.id);
      if (request) {
        const title = input.status === "confirmed" ? "تم تأكيد طلبك" : input.status === "completed" ? "اكتملت خدمتك" : "تم إلغاء الطلب";
        const content = input.status === "confirmed" ? "الحرفي أكد موعد الخدمة." : input.status === "completed" ? "يمكنك الآن تقييم الحرفي وتجربتك." : "تم إلغاء طلب الخدمة.";
        await db.createNotification({ userId: request.customerId, title, content });
        const tokens = await db.listPushTokens(request.customerId);
        await sendPushNotification(tokens.map((token) => token.token), { title, content });
      }
      return { success: true } as const;
    }),
  }),

  chat: router({
    conversations: protectedProcedure.query(({ ctx }) => db.listUserConversations(ctx.user.id)),
    messages: protectedProcedure.input(z.object({ conversationId: z.string().min(1) })).query(async ({ input, ctx }) => {
      const rows = await db.listConversation(input.conversationId);
      if (rows.some((message) => message.senderId === ctx.user.id || message.receiverId === ctx.user.id)) {
        await db.markConversationRead(input.conversationId);
        return rows;
      }
      return [];
    }),
    send: protectedProcedure.input(z.object({ conversationId: z.string().min(1), receiverId: z.number(), content: z.string().min(1).max(2000) })).mutation(async ({ input, ctx }) => {
      const content = input.content.trim();
      const id = await db.createMessage({ conversationId: input.conversationId, senderId: ctx.user.id, receiverId: input.receiverId, content, read: false });
      const title = "رسالة جديدة من خدمني";
      await db.createNotification({ userId: input.receiverId, title, content });
      const tokens = await db.listPushTokens(input.receiverId);
      await sendPushNotification(tokens.map((token) => token.token), { title, content });
      return { id };
    }),
  }),

  reviews: router({
    submit: protectedProcedure.input(z.object({ requestId: z.number(), rating: z.number().int().min(1).max(5) })).mutation(async ({ input, ctx }) => {
      const request = await db.getServiceRequest(input.requestId);
      if (!request || request.customerId !== ctx.user.id || request.status !== "completed" || !request.providerId) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تقييم هذا الطلب الآن." });
      if (await db.hasReviewForRequest(input.requestId)) throw new TRPCError({ code: "CONFLICT", message: "تم تقييم هذا الطلب مسبقاً." });
      const reviewId = await db.createProviderReview({ requestId: input.requestId, providerId: request.providerId, customerId: ctx.user.id, rating: input.rating });
      await db.createNotification({ userId: ctx.user.id, title: "شكراً لتقييمك", content: "يساعد تقييمك العملاء الآخرين على اختيار الحرفي المناسب." });
      return { reviewId };
    }),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input, ctx }) => db.markNotificationRead(input.id, ctx.user.id)),
  }),

  subscriptions: router({
    plans: publicProcedure.query(() => ({ destinationAccount: "007999990008761821", paymentKey: "94", plans: [{ id: "monthly", label: "شهري", price: 1400, duration: "30 يوماً" }, { id: "seasonal", label: "موسمي", price: 4000, duration: "90 يوماً" }, { id: "yearly", label: "سنوي", price: 15000, duration: "365 يوماً" }] })),
    mine: protectedProcedure.query(({ ctx }) => db.listUserSubscriptionPayments(ctx.user.id)),
    submitReceipt: protectedProcedure.input(z.object({ plan: z.enum(["monthly", "seasonal", "yearly"]), base64: z.string().min(100).max(12_000_000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]), providerDraft: z.string().max(5000).optional() })).mutation(async ({ input, ctx }) => {
      const planData = { monthly: { amount: 1400, label: "شهري" }, seasonal: { amount: 4000, label: "موسمي" }, yearly: { amount: 15000, label: "سنوي" } }[input.plan];
      const stored = await storagePut(`subscriptions/${ctx.user.id}/receipt`, Buffer.from(input.base64, "base64"), input.mimeType);
      const signedUrl = await storageGetSignedUrl(stored.key);
      const screening = await screenSubscriptionReceipt({ signedUrl, mimeType: input.mimeType, amount: planData.amount, planLabel: planData.label, destinationAccount: "007999990008761821", paymentKey: "94" });
      const id = await db.createSubscriptionPayment({ userId: ctx.user.id, plan: input.plan, amount: planData.amount, destinationAccount: "007999990008761821", paymentKey: "94", receiptUrl: stored.url, providerDraft: input.providerDraft, aiVerdict: screening.verdict, aiConfidence: screening.confidence, aiNotes: screening.notes, status: "pending" });
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const approveToken = randomBytes(32).toString("hex");
      const rejectToken = randomBytes(32).toString("hex");
      await db.createSubscriptionReviewToken({ paymentId: id, tokenHash: reviewTokenHash(approveToken), action: "approve", expiresAt });
      await db.createSubscriptionReviewToken({ paymentId: id, tokenHash: reviewTokenHash(rejectToken), action: "reject", expiresAt });
      await db.updateUserSubscription(ctx.user.id, "pending", input.plan, null);
      if (input.providerDraft) {
        try {
          const draft = JSON.parse(input.providerDraft) as { firstName: string; lastName: string; phone: string; wilaya: string; municipality: string; trade: string; hourlyRate?: number };
          const existing = await db.getProviderProfileByUserId(ctx.user.id);
          const profileData = { name: `${draft.firstName} ${draft.lastName}`, trade: draft.trade, category: draft.trade, city: `${draft.municipality}, ${draft.wilaya}`, phone: draft.phone, bio: "حرفي مسجل عبر خدمني", hourlyRate: draft.hourlyRate ? Number(draft.hourlyRate) : undefined, published: screening.verdict === "likely_valid" };
          if (existing) await db.updateProviderProfile(existing.id, ctx.user.id, profileData);
          else await db.createProviderProfile({ ...profileData, userId: ctx.user.id });
        } catch (error) {
          console.warn("[Subscription] Receipt saved but provider profile draft could not be stored", error);
        }
      }
      await db.createNotification({ userId: ctx.user.id, title: "وصل الاشتراك قيد المراجعة", content: "تم استلام الوصل. لن يتم تفعيل الاشتراك حتى تتم الموافقة اليدوية." });
      const base = reviewLinkBase();
      return { id, verdict: screening.verdict, confidence: screening.confidence, notes: screening.notes, reviewLinks: base ? { approve: `${base}/review/subscription?token=${approveToken}`, reject: `${base}/review/subscription?token=${rejectToken}` } : null };
    }),
    adminList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه الصفحة مخصصة للإدارة." });
      return db.listSubscriptionPayments();
    }),
    adminReview: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["approved", "rejected"]), adminNote: z.string().max(1000).optional() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية مخصصة للإدارة." });
      const payment = await db.getSubscriptionPayment(input.id);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "طلب الاشتراك غير موجود." });
      await db.reviewSubscriptionPayment(input.id, input.status, input.adminNote);
      if (input.status === "approved") {
        const days = payment.plan === "monthly" ? 30 : payment.plan === "seasonal" ? 90 : 365;
        const expires = new Date(); expires.setDate(expires.getDate() + days);
        await db.updateUserSubscription(payment.userId, "active", payment.plan, expires);
        const existingProvider = await db.getProviderProfileByUserId(payment.userId);
        if (payment.providerDraft && !existingProvider) {
          try {
            const draft = JSON.parse(payment.providerDraft) as { firstName: string; lastName: string; phone: string; wilaya: string; municipality: string; trade: string; hourlyRate?: string };
            await db.updateUserAccountType(payment.userId, "provider");
            await db.createProviderProfile({ userId: payment.userId, name: `${draft.firstName} ${draft.lastName}`, trade: draft.trade, category: draft.trade, city: `${draft.municipality}, ${draft.wilaya}`, phone: draft.phone, hourlyRate: draft.hourlyRate ? Number(draft.hourlyRate) : undefined, bio: "حرفي مسجل عبر خدمني", verified: false, published: true });
          } catch (error) {
            console.warn("[Subscription] Approved payment but provider draft could not create profile", error);
          }
        } else if (existingProvider) {
          await db.updateProviderProfile(existingProvider.id, payment.userId, { published: true });
        }
      } else {
        await db.updateUserSubscription(payment.userId, "rejected", payment.plan, null);
        const rejectedProvider = await db.getProviderProfileByUserId(payment.userId);
        if (rejectedProvider) await db.updateProviderProfile(rejectedProvider.id, payment.userId, { published: false });
      }
      const title = input.status === "approved" ? "تم تفعيل اشتراكك" : "تم رفض وصل الاشتراك";
      const content = input.adminNote || (input.status === "approved" ? "أصبح حسابك مفعلاً حتى تاريخ انتهاء الاشتراك." : "راجع الوصل وأعد رفع صورة واضحة وصحيحة.");
      await db.createNotification({ userId: payment.userId, title, content });
      return { success: true } as const;
    }),
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
