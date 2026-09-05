import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "./db";

const html = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const page = (title: string, body: string) => `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(title)}</title><body style="font-family:Arial,sans-serif;max-width:680px;margin:40px auto;padding:20px;line-height:1.8"><h1>${html(title)}</h1>${body}</body></html>`;

export function registerReviewLinkRoutes(app: Express) {
  app.get("/review/subscription", async (req: Request, res: Response) => {
    const rawToken = typeof req.query.token === "string" ? req.query.token : "";
    const token = await db.getSubscriptionReviewToken(hashToken(rawToken));
    if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) return res.status(410).send(page("الرابط غير صالح", "انتهت صلاحية هذا الرابط أو تم استخدامه مسبقاً."));
    const payment = await db.getSubscriptionPayment(token.paymentId);
    if (!payment || payment.status !== "pending") return res.status(409).send(page("تمت مراجعة الوصل", "تم اتخاذ قرار سابق بشأن هذا الوصل."));
    const actionLabel = token.action === "approve" ? "قبول وتفعيل الاشتراك" : "رفض الوصل";
    const form = `<p>المبلغ: <strong>${payment.amount.toLocaleString("ar-DZ")} دج</strong></p><p>معاينة الوصل: <a href="${html(payment.receiptUrl)}" target="_blank">فتح الوصل</a></p><form method="post"><input type="hidden" name="token" value="${html(rawToken)}"><label>ملاحظة (اختياري)<br><textarea name="note" rows="4" style="width:100%"></textarea></label><br><button type="submit" style="padding:12px 22px">${actionLabel}</button></form>`;
    return res.send(page("مراجعة وصل الاشتراك", form));
  });

  app.post("/review/subscription", async (req: Request, res: Response) => {
    const rawToken = typeof req.body?.token === "string" ? req.body.token : "";
    const token = await db.getSubscriptionReviewToken(hashToken(rawToken));
    if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) return res.status(410).send(page("الرابط غير صالح", "انتهت صلاحية هذا الرابط أو تم استخدامه مسبقاً."));
    const payment = await db.getSubscriptionPayment(token.paymentId);
    if (!payment || payment.status !== "pending") return res.status(409).send(page("تمت مراجعة الوصل", "تم اتخاذ قرار سابق بشأن هذا الوصل."));
    const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 1000) : undefined;
    const approved = token.action === "approve";
    await db.reviewSubscriptionPayment(payment.id, approved ? "approved" : "rejected", note);
    if (approved) {
      const days = payment.plan === "monthly" ? 30 : payment.plan === "seasonal" ? 90 : 365;
      const expires = new Date(); expires.setDate(expires.getDate() + days);
      await db.updateUserSubscription(payment.userId, "active", payment.plan, expires);
      const provider = await db.getProviderProfileByUserId(payment.userId);
      if (provider) await db.updateProviderProfile(provider.id, payment.userId, { published: true });
    } else {
      await db.updateUserSubscription(payment.userId, "rejected", payment.plan, null);
      const provider = await db.getProviderProfileByUserId(payment.userId);
      if (provider) await db.updateProviderProfile(provider.id, payment.userId, { published: false });
    }
    await db.useSubscriptionReviewToken(token.id);
    return res.send(page(approved ? "تم قبول الوصل" : "تم رفض الوصل", approved ? "تم تفعيل الاشتراك ونشر بروفايل الحرفي." : "تم رفض الوصل وإخفاء بروفايل الحرفي."));
  });
}

export { hashToken };
