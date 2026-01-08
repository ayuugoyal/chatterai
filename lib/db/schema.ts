// lib/db/schema.ts
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  uuid,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { InferModel } from "drizzle-orm/table";

// Users table for custom auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  password: varchar("password", { length: 255 }), // null for OAuth users
  name: varchar("name", { length: 191 }),
  image: text("image"),
  googleId: varchar("google_id", { length: 191 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  name: varchar("name", { length: 50 }).notNull(), // Free, Pro, Enterprise
  price: integer("price").notNull().default(0), // in cents
  maxAgents: integer("max_agents").notNull().default(1),
  maxConversations: integer("max_conversations").notNull().default(100),
  maxUrlsPerAgent: integer("max_urls_per_agent").notNull().default(5),
  features: jsonb("features").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => subscriptionPlans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, cancelled, expired, past_due
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  // Razorpay integration fields
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 191 }),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 191 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 191 }),
  // Usage tracking
  conversationsUsed: integer("conversations_used").default(0).notNull(),
  conversationsResetAt: timestamp("conversations_reset_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions for auth
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Verification tokens for email verification
export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: varchar("email", { length: 191 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: varchar("email", { length: 191 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Updated agents table
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 191 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
  systemPrompt: text("system_prompt").notNull(),
  modelProvider: varchar("model_provider", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  saveConversations: boolean("save_conversations").default(true).notNull(),
  // Custom API keys (optional - if not provided, uses platform's keys)
  geminiApiKey: varchar("gemini_api_key", { length: 255 }),
  anthropicApiKey: varchar("anthropic_api_key", { length: 255 }),
  openaiApiKey: varchar("openai_api_key", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// URLs scraped for each agent
export const agentUrls = pgTable("agent_urls", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  scrapedContent: text("scraped_content"),
  scrapedAt: timestamp("scraped_at"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, scraped, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversations tracking
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 191 }).notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shopifyConfigs = pgTable("shopify_configs", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  shopDomain: varchar("shop_domain", { length: 191 }).notNull(),
  apiKey: varchar("api_key", { length: 191 }).notNull(),
  apiSecretKey: varchar("api_secret_key", { length: 191 }).notNull(),
  accessToken: varchar("access_token", { length: 191 }).notNull(),
  enableProductRecommendations: boolean("enable_product_recommendations")
    .default(true)
    .notNull(),
  maxProductsToShow: integer("max_products_to_show").default(3).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uiConfigs = pgTable("ui_configs", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  primaryColor: varchar("primary_color", { length: 20 })
    .default("#0070f3")
    .notNull(),
  secondaryColor: varchar("secondary_color", { length: 20 })
    .default("#f5f5f5")
    .notNull(),
  backgroundColor: varchar("background_color", { length: 20 })
    .default("#ffffff")
    .notNull(),
  textColor: varchar("text_color", { length: 20 }).default("#333333").notNull(),
  buttonPosition: varchar("button_position", { length: 20 })
    .default("bottom-right")
    .notNull(),
  buttonSize: integer("button_size").default(60).notNull(),
  widgetWidth: integer("widget_width").default(380).notNull(),
  widgetHeight: integer("widget_height").default(600).notNull(),
  borderRadius: integer("border_radius").default(8).notNull(),
  welcomeMessage: text("welcome_message")
    .default("Hello! How can I help you today?")
    .notNull(),
  buttonIcon: varchar("button_icon", { length: 20 })
    .default("message")
    .notNull(),
  headerTitle: varchar("header_title", { length: 100 })
    .default("Chat Support")
    .notNull(),
  showAgentAvatar: boolean("show_agent_avatar").default(true).notNull(),
  showTimestamp: boolean("show_timestamp").default(true).notNull(),
  showTypingIndicator: boolean("show_typing_indicator").default(true).notNull(),
  allowAttachments: boolean("allow_attachments").default(false).notNull(),
  maxOutputTokens: integer("max_output_tokens").default(1000).notNull(),
  uiStyle: varchar("ui_style", { length: 20 }).default("floating").notNull(), // floating or widget
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
  sessions: many(sessions),
  subscriptions: many(subscriptions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    subscriptions: many(subscriptions),
  })
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  urls: many(agentUrls),
  conversations: many(conversations),
  shopifyConfigs: many(shopifyConfigs),
  uiConfigs: many(uiConfigs),
}));

export const agentUrlsRelations = relations(agentUrls, ({ one }) => ({
  agent: one(agents, {
    fields: [agentUrls.agentId],
    references: [agents.id],
  }),
}));

// Messages in a conversation
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    agent: one(agents, {
      fields: [conversations.agentId],
      references: [agents.id],
    }),
    messages: many(messages),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const shopifyConfigsRelations = relations(shopifyConfigs, ({ one }) => ({
  agent: one(agents, {
    fields: [shopifyConfigs.agentId],
    references: [agents.id],
  }),
}));

export const uiConfigsRelations = relations(uiConfigs, ({ one }) => ({
  agent: one(agents, {
    fields: [uiConfigs.agentId],
    references: [agents.id],
  }),
}));

// Types
export type UserTable = InferModel<typeof users>;
export type SessionTable = InferModel<typeof sessions>;
export type SubscriptionTable = InferModel<typeof subscriptions>;
export type SubscriptionPlanTable = InferModel<typeof subscriptionPlans>;
export type AgentTable = InferModel<typeof agents>;
export type AgentUrlTable = InferModel<typeof agentUrls>;
export type ConversationTable = InferModel<typeof conversations>;
export type MessageTable = InferModel<typeof messages>;
