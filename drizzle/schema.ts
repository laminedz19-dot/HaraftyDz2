import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accountType: mysqlEnum("accountType", ["customer", "provider"]).default("customer").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["inactive", "pending", "active", "rejected"]).default("inactive").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["monthly", "seasonal", "yearly"]),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const providerProfiles = mysqlTable("providerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  trade: varchar("trade", { length: 160 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  bio: text("bio"),
  city: varchar("city", { length: 120 }),
  phone: varchar("phone", { length: 32 }),
  hourlyRate: int("hourlyRate"),
  published: boolean("published").default(false).notNull(),
  rating: varchar("rating", { length: 8 }).default("0"),
  completedJobs: int("completedJobs").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = typeof providerProfiles.$inferInsert;

export const providerReports = mysqlTable("providerReports", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(),
  reason: varchar("reason", { length: 64 }).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["pending", "reviewed", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProviderReport = typeof providerReports.$inferSelect;
export type InsertProviderReport = typeof providerReports.$inferInsert;

export const serviceRequests = mysqlTable("serviceRequests", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  providerId: int("providerId"),
  category: varchar("category", { length: 64 }).notNull(),
  subcategory: varchar("subcategory", { length: 120 }),
  description: text("description"),
  address: varchar("address", { length: 255 }).notNull(),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  scheduledAt: timestamp("scheduledAt"),
  status: mysqlEnum("status", ["draft", "pending", "confirmed", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: varchar("conversationId", { length: 120 }).notNull(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const portfolioImages = mysqlTable("portfolioImages", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type InsertPortfolioImage = typeof portfolioImages.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  platform: varchar("platform", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const providerReviews = mysqlTable("providerReviews", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().unique(),
  providerId: int("providerId").notNull(),
  customerId: int("customerId").notNull(),
  rating: int("rating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
export type ProviderReview = typeof providerReviews.$inferSelect;
export type InsertProviderReview = typeof providerReviews.$inferInsert;

export const subscriptionPayments = mysqlTable("subscriptionPayments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["monthly", "seasonal", "yearly"]).notNull(),
  amount: int("amount").notNull(),
  destinationAccount: varchar("destinationAccount", { length: 64 }).notNull(),
  paymentKey: varchar("paymentKey", { length: 16 }).notNull(),
  receiptUrl: varchar("receiptUrl", { length: 500 }).notNull(),
  providerDraft: text("providerDraft"),
  aiVerdict: mysqlEnum("aiVerdict", ["likely_valid", "needs_review", "likely_forged"]).default("needs_review").notNull(),
  aiConfidence: int("aiConfidence").default(0).notNull(),
  aiNotes: text("aiNotes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});

export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type InsertSubscriptionPayment = typeof subscriptionPayments.$inferInsert;
