import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, FileText, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Document } from '@shared/schema';

interface FileUploadProps {
  type: 'transcript' | 'policy';
  onUploadComplete: (documents: Document[]) => void;
}

export function FileUpload({ type, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }, []);

  const handleUpload = async (files: FileList) => {
    if (uploading) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const documents = await api.uploadDocuments(files, type);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Upload successful",
        description: `${documents.length} file(s) uploaded successfully.`,
      });

      onUploadComplete(documents);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const icon = type === 'transcript' ? Mic : FileText;
  const IconComponent = icon;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {type === 'transcript' ? 'Client Transcripts' : 'Policy Documents'}
      </label>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/60'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${type}`)?.click()}
      >
        <IconComponent className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        
        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Uploading files...</p>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Drop {type === 'transcript' ? 'transcript' : 'policy'} files or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, TXT formats supported
            </p>
          </>
        )}
      </div>

      <input
        id={`file-input-${type}`}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
