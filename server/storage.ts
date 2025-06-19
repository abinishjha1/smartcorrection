import type { Document, InsertDocument, ChatMessage, InsertChatMessage, VectorChunk } from '@shared/schema';

export interface IStorage {
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  updateDocumentProcessed(id: number, processed: boolean): Promise<void>;
  deleteDocument(id: number): Promise<void>;

  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getAllChatMessages(): Promise<ChatMessage[]>;
  clearChatHistory(): Promise<void>;

  // Vector operations
  storeVectorChunks(chunks: VectorChunk[]): Promise<void>;
  getVectorChunks(type?: 'transcript' | 'policy'): Promise<VectorChunk[]>;
  getAllVectorChunks(): Promise<VectorChunk[]>;
  deleteVectorChunksByDocument(documentId: number): Promise<void>;
}

import { db } from './db';
import { documents, chatMessages, vectorChunks } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(documents.uploadedAt);
  }

  async updateDocumentProcessed(id: number, processed: boolean): Promise<void> {
    await db
      .update(documents)
      .set({ processed: processed })
      .where(eq(documents.id, id));
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
    // Vector chunks will be deleted automatically due to cascade
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        message: insertMessage.message,
        response: insertMessage.response,
        sources: insertMessage.sources
      })
      .returning();
    return message;
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(chatMessages.createdAt);
  }

  async clearChatHistory(): Promise<void> {
    await db.delete(chatMessages);
  }

  async storeVectorChunks(chunks: VectorChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    
    const chunkData = chunks.map(chunk => ({
      id: chunk.id,
      text: chunk.text,
      embedding: chunk.embedding,
      documentId: chunk.metadata.documentId,
      documentName: chunk.metadata.documentName,
      type: chunk.metadata.type,
      chunkIndex: chunk.metadata.chunkIndex,
    }));

    await db.insert(vectorChunks).values(chunkData);
  }

  async getVectorChunks(type?: 'transcript' | 'policy'): Promise<VectorChunk[]> {
    const query = type 
      ? db.select().from(vectorChunks).where(eq(vectorChunks.type, type))
      : db.select().from(vectorChunks);
    
    const rows = await query;
    
    return rows.map(row => ({
      id: row.id,
      text: row.text,
      embedding: row.embedding,
      metadata: {
        documentId: row.documentId,
        documentName: row.documentName,
        type: row.type,
        chunkIndex: row.chunkIndex,
      }
    }));
  }

  async getAllVectorChunks(): Promise<VectorChunk[]> {
    return this.getVectorChunks();
  }

  async deleteVectorChunksByDocument(documentId: number): Promise<void> {
    await db.delete(vectorChunks).where(eq(vectorChunks.documentId, documentId));
  }
}

export const storage = new DatabaseStorage();