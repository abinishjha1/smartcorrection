import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Trash2, Bot, User, Database, Link, FileText, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ChatMessage, RAGResponse } from '@shared/schema';

interface ChatInterfaceProps {
  selectedQuery?: string;
  onQueryProcessed?: () => void;
}

export function ChatInterface({ selectedQuery, onQueryProcessed }: ChatInterfaceProps) {
  const [currentQuery, setCurrentQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chatHistory = [], isLoading: historyLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/history'],
  });

  const sendQueryMutation = useMutation({
    mutationFn: api.sendQuery,
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setCurrentQuery('');
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      onQueryProcessed?.();
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Query failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: api.clearChatHistory,
    onSuccess: () => {
      toast({
        title: "Chat cleared",
        description: "Chat history has been cleared.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
    },
    onError: (error) => {
      toast({
        title: "Clear failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedQuery) {
      setCurrentQuery(selectedQuery);
    }
  }, [selectedQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSendQuery = () => {
    if (!currentQuery.trim() || sendQueryMutation.isPending) return;
    sendQueryMutation.mutate(currentQuery.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <div key={message.id} className="space-y-4">
      {/* User Query */}
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-2xl">
          <div className="flex items-start space-x-2">
            <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{message.message}</p>
          </div>
        </div>
      </div>

      {/* Assistant Response */}
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="bg-muted rounded-lg p-4 max-w-4xl flex-1">
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.response}
              </p>
            </div>

            {message.sources && message.sources.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Sources referenced:
                </p>
                <div className="space-y-3">
                  {message.sources.map((source) => {
                    const IconComponent = source.type === 'transcript' ? Mic : FileText;
                    const matchPercentage = Math.round((source.similarity || 0) * 100);
                    return (
                      <div
                        key={source.chunkId}
                        className={`p-3 rounded-md border ${
                          source.type === 'transcript' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-3 h-3" />
                            <span className="font-medium text-xs">{source.documentName}</span>
                          </div>
                          <span className="text-xs opacity-75">
                            Match: {matchPercentage}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 bg-white/50 rounded p-2 border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-700">
                              {source.documentName}
                            </div>
                            <a 
                              href={`/pdf-viewer/${source.documentName}?page=${(source as any).pageNumber || 1}&search=${encodeURIComponent(source.text.substring(0, 30))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium"
                            >
                              View Source
                            </a>
                          </div>
                          <div className="italic text-gray-600">
                            "{source.text.length > 150 ? source.text.substring(0, 150) + '...' : source.text}"
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-[800px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Multi-hop RAG Analysis
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearHistoryMutation.mutate()}
            disabled={clearHistoryMutation.isPending || chatHistory.length === 0}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear chat
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask questions about transcripts and policies - the system will retrieve relevant context from both sources
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-4 max-w-2xl">
                <p className="text-sm text-muted-foreground">
                  Hello! I'm your Community Corrections RAG Assistant. I can help you analyze client transcripts 
                  and policy documents. Ask me anything about compliance, program recommendations, or cross-document insights.
                </p>
              </div>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading chat history...</span>
              </div>
            ) : (
              chatHistory.map(renderMessage)
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Chat Input */}
        <div className="p-6">
          <div className="flex space-x-3">
            <div className="flex-1">
              <div className="relative">
                <Input
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about transcripts, policies, compliance, or program recommendations..."
                  disabled={sendQueryMutation.isPending}
                  className="pr-12"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={handleSendQuery}
                  disabled={!currentQuery.trim() || sendQueryMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Database className="w-3 h-3 mr-1" />
                Vector search enabled
              </span>
              <span className="flex items-center">
                <Link className="w-3 h-3 mr-1" />
                Multi-hop reasoning
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
