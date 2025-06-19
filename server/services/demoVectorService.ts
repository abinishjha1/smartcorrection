import type { VectorChunk, RAGResponse } from '@shared/schema';

export class DemoVectorService {
  
  // Generate demo embeddings that maintain realistic similarity patterns
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map(text => this.generateSingleEmbedding(text));
  }

  static async generateQueryEmbedding(query: string): Promise<number[]> {
    return this.generateSingleEmbedding(query);
  }

  private static generateSingleEmbedding(text: string): number[] {
    // Create deterministic embeddings based on text content
    // This ensures consistent similarity scoring for the same text
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // Standard embedding dimension
    
    // Create semantic features based on content
    words.forEach((word, index) => {
      const hash = this.simpleHash(word) % 384;
      embedding[hash] += 1 / (index + 1); // Weight earlier words more
    });
    
    // Add context-specific features for Community Corrections content
    if (text.includes('Nathan') || text.includes('nathan')) {
      embedding[100] += 2.0; // Nathan identifier
    }
    if (text.includes('Robert') || text.includes('robert')) {
      embedding[101] += 2.0; // Robert identifier  
    }
    if (text.includes('stress') || text.includes('financial')) {
      embedding[200] += 1.5; // Stress/financial topics
    }
    if (text.includes('work') || text.includes('employment')) {
      embedding[201] += 1.5; // Employment topics
    }
    if (text.includes('sobriety') || text.includes('meetings')) {
      embedding[202] += 1.5; // Recovery topics
    }
    if (text.includes('policy') || text.includes('procedure')) {
      embedding[300] += 1.5; // Policy content
    }
    if (text.includes('grievance') || text.includes('appeal')) {
      embedding[301] += 1.5; // Grievance procedures
    }
    if (text.includes('programming') || text.includes('treatment')) {
      embedding[302] += 1.5; // Programming content
    }
    
    // Normalize the embedding vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  static findSimilarChunks(
    queryEmbedding: number[],
    chunks: VectorChunk[],
    topK: number = 5,
    threshold: number = 0.01
  ): Array<VectorChunk & { similarity: number }> {
    const similarities = chunks.map(chunk => ({
      ...chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  static findSimilarChunksByType(
    queryEmbedding: number[],
    chunks: VectorChunk[],
    type: 'transcript' | 'policy',
    topK: number = 3,
    threshold: number = 0.01
  ): Array<VectorChunk & { similarity: number }> {
    const filteredChunks = chunks.filter(chunk => chunk.metadata.type === type);
    return this.findSimilarChunks(queryEmbedding, filteredChunks, topK, threshold);
  }

  static async multiHopRetrieval(
    query: string,
    allChunks: VectorChunk[]
  ): Promise<{
    transcriptChunks: Array<VectorChunk & { similarity: number }>;
    policyChunks: Array<VectorChunk & { similarity: number }>;
  }> {
    const queryEmbedding = await this.generateQueryEmbedding(query);
    
    const transcriptChunks = this.findSimilarChunksByType(
      queryEmbedding, 
      allChunks, 
      'transcript', 
      5, 
      0.01
    );
    
    const policyChunks = this.findSimilarChunksByType(
      queryEmbedding, 
      allChunks, 
      'policy', 
      5, 
      0.01
    );

    return { transcriptChunks, policyChunks };
  }
}