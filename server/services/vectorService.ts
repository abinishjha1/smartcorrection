import OpenAI from 'openai';
import type { VectorChunk } from '@shared/schema';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "default_key"
});

export class VectorService {
  
  // Generate embeddings for text chunks
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  // Generate embedding for a single query
  static async generateQueryEmbedding(query: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([query]);
    return embeddings[0];
  }

  // Calculate cosine similarity between two vectors
  static cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Find most similar chunks to a query
  static findSimilarChunks(
    queryEmbedding: number[], 
    chunks: VectorChunk[], 
    topK: number = 5,
    threshold: number = 0.7
  ): Array<VectorChunk & { similarity: number }> {
    const similarities = chunks.map(chunk => ({
      ...chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // Find similar chunks with type filtering
  static findSimilarChunksByType(
    queryEmbedding: number[], 
    chunks: VectorChunk[], 
    type: 'transcript' | 'policy',
    topK: number = 3,
    threshold: number = 0.7
  ): Array<VectorChunk & { similarity: number }> {
    const filteredChunks = chunks.filter(chunk => chunk.metadata.type === type);
    return this.findSimilarChunks(queryEmbedding, filteredChunks, topK, threshold);
  }

  // Multi-hop retrieval: find related chunks across different types
  static async multiHopRetrieval(
    query: string,
    chunks: VectorChunk[],
    transcriptTopK: number = 3,
    policyTopK: number = 3
  ): Promise<{
    transcriptChunks: Array<VectorChunk & { similarity: number }>;
    policyChunks: Array<VectorChunk & { similarity: number }>;
    queryEmbedding: number[];
  }> {
    const queryEmbedding = await this.generateQueryEmbedding(query);
    
    const transcriptChunks = this.findSimilarChunksByType(
      queryEmbedding, chunks, 'transcript', transcriptTopK
    );
    
    const policyChunks = this.findSimilarChunksByType(
      queryEmbedding, chunks, 'policy', policyTopK
    );

    return {
      transcriptChunks,
      policyChunks,
      queryEmbedding,
    };
  }
}
