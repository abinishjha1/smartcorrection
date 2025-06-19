import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileManagement } from '@/components/FileManagement';
import { ChatInterface } from '@/components/ChatInterface';
import { Brain, Circle } from 'lucide-react';

export default function Home() {
  const [selectedQuery, setSelectedQuery] = useState<string>();

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5000,
  });

  const handleQuerySelect = (query: string) => {
    setSelectedQuery(query);
    // Clear the selected query after a short delay to allow the chat interface to process it
    setTimeout(() => setSelectedQuery(undefined), 100);
  };

  const getIndexStatus = (documents: number, processed: number) => {
    if (documents === 0) return 'empty';
    if (processed === documents) return 'ready';
    return 'processing';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-500';
      case 'processing': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const transcriptStatus = getIndexStatus(stats?.transcriptDocuments || 0, stats?.processedDocuments || 0);
  const policyStatus = getIndexStatus(stats?.policyDocuments || 0, stats?.processedDocuments || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Community Corrections RAG Assistant</h1>
                <p className="text-sm text-gray-500">Multi-hop retrieval over transcripts and policies</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Circle className={`w-2 h-2 fill-current ${getStatusColor(transcriptStatus)}`} />
                  <span className="text-sm text-gray-600">Transcripts Index</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Circle className={`w-2 h-2 fill-current ${getStatusColor(policyStatus)}`} />
                  <span className="text-sm text-gray-600">Documents Index</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - File Management */}
          <div className="lg:col-span-1">
            <FileManagement onQuerySelect={handleQuerySelect} />
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface 
              selectedQuery={selectedQuery}
              onQueryProcessed={() => setSelectedQuery(undefined)}
            />
          </div>
        </div>

        {/* Bottom Statistics Bar */}
        {stats && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalQueries}</div>
                <p className="text-sm text-gray-600">Total Queries</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats.policyDocuments}</div>
                <p className="text-sm text-gray-600">Policy Documents</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.transcriptDocuments}</div>
                <p className="text-sm text-gray-600">Transcript Documents</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{stats.totalChunks}</div>
                <p className="text-sm text-gray-600">Total Chunks</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
