import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from './FileUpload';
import { Upload, Database, Lightbulb, FileText, Mic, Trash2, Play, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Document } from '@shared/schema';

interface FileManagementProps {
  onQuerySelect: (query: string) => void;
}

const exampleQueries = [
  "What did Nathan say about work stress?",
  "What programs could help based on Robert's transcript?",
  "Did the staff follow grievance policy in Nathan's case?",
  "Based on the 8 principles, which program fits Nathan's risk?",
];

export function FileManagement({ onQuerySelect }: FileManagementProps) {
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5000, // Refresh stats every 5 seconds
  });

  const processDocumentMutation = useMutation({
    mutationFn: api.processDocument,
    onSuccess: (data, variables) => {
      setProcessing(prev => ({ ...prev, [variables]: false }));
      toast({
        title: "Processing complete",
        description: `Created ${data.chunksCreated} chunks for indexing.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error, variables) => {
      setProcessing(prev => ({ ...prev, [variables]: false }));
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: api.deleteDocument,
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "Document and its index chunks have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (newDocuments: Document[]) => {
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  };

  const handleProcessDocument = (documentId: number) => {
    setProcessing(prev => ({ ...prev, [documentId]: true }));
    processDocumentMutation.mutate(documentId);
  };

  const handleDeleteDocument = (documentId: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const getDocumentIcon = (type: string) => {
    return type === 'transcript' ? Mic : FileText;
  };

  const getStatusColor = (processed: boolean) => {
    return processed ? 'bg-green-500' : 'bg-yellow-500';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload type="policy" onUploadComplete={handleUploadComplete} />
          <FileUpload type="transcript" onUploadComplete={handleUploadComplete} />
          
          {documents.some((doc: Document) => !doc.processed) && (
            <Button
              onClick={() => {
                const unprocessedDocs = documents.filter((doc: Document) => !doc.processed);
                unprocessedDocs.forEach((doc: Document) => handleProcessDocument(doc.id));
              }}
              className="w-full"
              disabled={Object.values(processing).some(Boolean)}
            >
              <Play className="w-4 h-4 mr-2" />
              Process & Index All Files
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Indexed Files Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Indexed Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No documents uploaded yet. Upload some files to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((document: Document) => {
                const IconComponent = getDocumentIcon(document.type);
                const isProcessing = processing[document.id];
                const chunks = document.chunks?.length || 0;
                
                return (
                  <div
                    key={document.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      document.processed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <IconComponent className={`w-5 h-5 ${
                        document.type === 'transcript' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{document.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {document.type}
                          </Badge>
                          {document.processed ? (
                            <span className="text-xs text-gray-500">{chunks} chunks indexed</span>
                          ) : (
                            <span className="text-xs text-yellow-600">Not processed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isProcessing ? (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      ) : document.processed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcessDocument(document.id)}
                          disabled={processDocumentMutation.isPending}
                        >
                          Process
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDocument(document.id)}
                        disabled={deleteDocumentMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {stats && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>{stats.processedDocuments} documents</strong> indexed with{' '}
                  <strong>{stats.totalChunks} total chunks</strong>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Query Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-orange-500" />
            Example Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {exampleQueries.map((query, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 bg-gray-50 hover:bg-gray-100"
              onClick={() => onQuerySelect(query)}
            >
              <span className="text-sm text-gray-700">"{query}"</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
