import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'transcript' | 'policy'
  content: text("content").notNull(),
  chunks: jsonb("chunks").default([]).$type<Array<{
    id: string;
    text: string;
    embedding: number[];
    metadata: Record<string, any>;
  }>>(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  processed: boolean("processed").notNull().default(false),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  sources: jsonb("sources").notNull().$type<Array<{
    documentName: string;
    chunkId: string;
    text: string;
    type: 'transcript' | 'policy';
    similarity: number;
  }>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vectorChunks = pgTable("vector_chunks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  text: text("text").notNull(),
  embedding: jsonb("embedding").$type<number[]>().notNull(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  documentName: varchar("document_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).$type<'transcript' | 'policy'>().notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
}).partial({
  processed: true,
  chunks: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Vector search types
export type VectorChunk = {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    documentId: number;
    documentName: string;
    type: 'transcript' | 'policy';
    chunkIndex: number;
  };
};

export type RAGResponse = {
  answer: string;
  sources: Array<{
    documentName: string;
    chunkId: string;
    text: string;
    type: 'transcript' | 'policy';
    similarity: number;
  }>;
  reasoning: string;
};
