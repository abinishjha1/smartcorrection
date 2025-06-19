import type { VectorChunk } from '@shared/schema';

export class MockVectorService {
  
  // Generate mock embeddings for text chunks (random vectors for demo)
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map(() => {
      // Generate 1536-dimensional vectors (same as OpenAI text-embedding-3-small)
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    });
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

  // Mock semantic search using keyword matching and relevance scoring
  static findSimilarChunks(
    queryEmbedding: number[], 
    chunks: VectorChunk[], 
    topK: number = 5,
    threshold: number = 0.3
  ): Array<VectorChunk & { similarity: number }> {
    // For demo purposes, use text-based similarity scoring
    const query = "work stress taxes money financial pressure employment";
    
    const similarities = chunks.map(chunk => {
      // Simple keyword-based relevance scoring for demo
      let score = 0;
      const chunkText = chunk.text.toLowerCase();
      const queryTerms = query.toLowerCase().split(' ');
      
      queryTerms.forEach(term => {
        if (chunkText.includes(term)) {
          score += 0.2;
        }
      });
      
      // Add some randomness to simulate vector similarity
      score += Math.random() * 0.3;
      
      return {
        ...chunk,
        similarity: Math.min(score, 0.95),
      };
    });

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
    threshold: number = 0.3
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