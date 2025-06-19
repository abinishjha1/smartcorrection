import { apiRequest } from './queryClient';
import type { Document, ChatMessage, RAGResponse } from '@shared/schema';

export const api = {
  // Document operations
  async uploadDocuments(files: FileList, type?: 'transcript' | 'policy'): Promise<Document[]> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    if (type) {
      formData.append('type', type);
    }

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return response.json();
  },

  async processDocument(documentId: number): Promise<{ success: boolean; chunksCreated: number; document: Document }> {
    const response = await apiRequest('POST', `/api/documents/${documentId}/process`);
    return response.json();
  },

  async deleteDocument(documentId: number): Promise<{ success: boolean }> {
    const response = await apiRequest('DELETE', `/api/documents/${documentId}`);
    return response.json();
  },

  // Chat operations
  async sendQuery(query: string): Promise<RAGResponse> {
    const response = await apiRequest('POST', '/api/chat/query', { query });
    return response.json();
  },

  async clearChatHistory(): Promise<{ success: boolean }> {
    const response = await apiRequest('DELETE', '/api/chat/history');
    return response.json();
  },

  // Stats
  async getStats(): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    transcriptDocuments: number;
    policyDocuments: number;
    totalChunks: number;
    transcriptChunks: number;
    policyChunks: number;
    totalQueries: number;
  }> {
    const response = await apiRequest('GET', '/api/stats');
    return response.json();
  },

  // Compliance
  async evaluateCompliance(transcriptContent: string, policyName: string): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const response = await apiRequest('POST', '/api/compliance/evaluate', { 
      transcriptContent, 
      policyName 
    });
    return response.json();
  },
};
