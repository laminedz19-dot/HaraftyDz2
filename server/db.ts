import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertMessage, InsertNotification, InsertPortfolioImage, InsertProviderProfile, InsertProviderReport, InsertProviderReview, InsertPushToken, InsertServiceRequest, InsertSubscriptionPayment, InsertUser, messages, notifications, portfolioImages, providerProfiles, providerReports, providerReviews, pushTokens, serviceRequests, subscriptionPayments, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserAccountType(userId: number, accountType: "customer" | "provider") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ accountType }).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, status: "inactive" | "pending" | "active" | "rejected", plan?: "monthly" | "seasonal" | "yearly", expiresAt?: Date | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ subscriptionStatus: status, subscriptionPlan: plan, subscriptionExpiresAt: expiresAt ?? null }).where(eq(users.id, userId));
}

export async function listProviderProfiles(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category) return db.select().from(providerProfiles).where(eq(providerProfiles.category, category));
  return db.select().from(providerProfiles).orderBy(desc(providerProfiles.rating));
}

export async function getProviderProfile(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providerProfiles).where(eq(providerProfiles.id, id)).limit(1);
  return result[0];
}

export async function getProviderProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, userId)).limit(1);
  return result[0];
}
export async function createProviderReport(data: InsertProviderReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(providerReports).values(data);
  return Number((result as { insertId?: number }).insertId ?? 0);
}
export async function listProviderReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(providerReports).orderBy(desc(providerReports.createdAt));
}
export async function updateProviderReportStatus(id: number, status: "reviewed" | "dismissed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(providerReports).set({ status }).where(eq(providerReports.id, id));
}

export async function createProviderProfile(data: InsertProviderProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(providerProfiles).values(data);
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function createServiceRequest(data: InsertServiceRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceRequests).values(data);
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function listServiceRequests(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceRequests).where(eq(serviceRequests.customerId, customerId)).orderBy(desc(serviceRequests.createdAt));
}

export async function listProviderRequests(providerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const provider = await getProviderProfileByUserId(providerUserId);
  if (!provider) return [];
  return db.select().from(serviceRequests).where(eq(serviceRequests.providerId, provider.id)).orderBy(desc(serviceRequests.createdAt));
}

export async function updateServiceRequestStatus(id: number, customerId: number, status: "pending" | "confirmed" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(serviceRequests).set({ status }).where(eq(serviceRequests.id, id));
}

export async function updateProviderRequestStatus(id: number, providerUserId: number, status: "confirmed" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const provider = await getProviderProfileByUserId(providerUserId);
  if (!provider) return false;
  const request = await getServiceRequest(id);
  if (!request || request.providerId !== provider.id) return false;
  await db.update(serviceRequests).set({ status }).where(eq(serviceRequests.id, id));
  return true;
}

export async function listPortfolioImages(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioImages).where(eq(portfolioImages.providerId, providerId)).orderBy(desc(portfolioImages.createdAt));
}

export async function createPortfolioImage(data: InsertPortfolioImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(portfolioImages).values(data);
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function deletePortfolioImage(id: number, providerUserId: number) {
  const db = await getDb();
  if (!db) return;
  const provider = await getProviderProfileByUserId(providerUserId);
  if (!provider) return;
  const image = await db.select({ providerId: portfolioImages.providerId }).from(portfolioImages).where(eq(portfolioImages.id, id)).limit(1);
  if (!image[0] || image[0].providerId !== provider.id) return;
  await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
}

export async function upsertPushToken(data: InsertPushToken) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(pushTokens).values(data).onDuplicateKeyUpdate({ set: { userId: data.userId, platform: data.platform, updatedAt: new Date() } });
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function listPushTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
}

export async function getServiceRequest(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
  return result[0];
}

export async function createProviderReview(data: InsertProviderReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(providerReviews).values(data);
  const reviews = await db.select().from(providerReviews).where(eq(providerReviews.providerId, data.providerId));
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(reviews.length, 1);
  await db.update(providerProfiles).set({ rating: average.toFixed(1) }).where(eq(providerProfiles.id, data.providerId));
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function hasReviewForRequest(requestId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: providerReviews.id }).from(providerReviews).where(eq(providerReviews.requestId, requestId)).limit(1);
  return result.length > 0;
}

export async function listConversation(conversationId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function markConversationRead(conversationId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ read: true }).where(eq(messages.conversationId, conversationId));
}

export async function listUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const sent = await db.select().from(messages).where(eq(messages.senderId, userId)).orderBy(desc(messages.createdAt));
  const received = await db.select().from(messages).where(eq(messages.receiverId, userId)).orderBy(desc(messages.createdAt));
  const all = [...sent, ...received].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const seen = new Set<string>();
  return all.filter((message) => { if (seen.has(message.conversationId)) return false; seen.add(message.conversationId); return true; });
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(notifications).values(data);
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function createSubscriptionPayment(data: InsertSubscriptionPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscriptionPayments).values(data);
  return Number((result as { insertId?: number }).insertId ?? 0);
}

export async function getSubscriptionPayment(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptionPayments).where(eq(subscriptionPayments.id, id)).limit(1);
  return result[0];
}

export async function listUserSubscriptionPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPayments).where(eq(subscriptionPayments.userId, userId)).orderBy(desc(subscriptionPayments.createdAt));
}

export async function listSubscriptionPayments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPayments).orderBy(desc(subscriptionPayments.createdAt));
}

export async function reviewSubscriptionPayment(id: number, status: "approved" | "rejected", adminNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscriptionPayments).set({ status, adminNote, reviewedAt: new Date() }).where(eq(subscriptionPayments.id, id));
}
