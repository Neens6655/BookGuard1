import { useState, useEffect, useCallback } from 'react';
import { FileText, File, CheckCircle, AlertCircle, Loader2, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

export interface QueueFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  evaluationId?: string;
}

interface UploadQueueProps {
  files: File[];
  onComplete: () => void;
  onCancel: () => void;
  className?: string;
}

export function UploadQueue({ files, onComplete, onCancel, className }: UploadQueueProps) {
  const [queueFiles, setQueueFiles] = useState<QueueFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  
  const MAX_CONCURRENT = 3; // Process 3 files at once

  // Initialize queue
  useEffect(() => {
    const initialQueue = files.map((file, index) => ({
      file,
      id: `${file.name}-${Date.now()}-${index}`,
      status: 'pending' as const,
      progress: 0,
    }));
    setQueueFiles(initialQueue);
  }, [files]);

  // Process files in parallel with concurrency limit
  useEffect(() => {
    if (!isProcessing) return;

    const pendingFiles = queueFiles.filter(f => f.status === 'pending');
    const activeFiles = queueFiles.filter(f => f.status === 'uploading' || f.status === 'processing');
    const canStartNew = activeFiles.length < MAX_CONCURRENT && pendingFiles.length > 0;

    if (canStartNew) {
      // Start processing next pending file
      const nextIndex = queueFiles.findIndex(f => f.status === 'pending');
      if (nextIndex !== -1) {
        processFile(nextIndex);
      }
    } else if (activeFiles.length === 0 && pendingFiles.length === 0 && queueFiles.length > 0) {
      // All files processed (completed or failed)
      const allTerminal = queueFiles.every(f => f.status === 'completed' || f.status === 'failed');
      if (allTerminal) {
        setTimeout(onComplete, 1000);
      }
    }
  }, [queueFiles, isProcessing]);

  const processFile = async (index: number) => {
    // Re-check status to prevent duplicate processing from stale closures
    const currentFile = queueFiles[index];
    if (!currentFile || currentFile.status !== 'pending') {
      return;
    }
    
    try {
      // Upload file
      updateFileStatus(index, 'uploading', 0);
      
      const formData = new FormData();
      formData.append('file', currentFile.file);

      const response = await apiRequest('POST', '/api/evaluate', formData);
      const data = await response.json();

      // Start processing
      updateFileStatus(index, 'processing', 0, data.id);
      
      // Poll for progress
      await pollProgress(index, data.id);
      
    } catch (error) {
      updateFileStatus(index, 'failed', 0, undefined, 
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  };

  const pollProgress = async (index: number, evaluationId: string): Promise<void> => {
    try {
      const response = await apiRequest('GET', `/api/evaluate/${evaluationId}`);
      const data = await response.json();

      updateFileStatus(index, 'processing', data.progress || 0, evaluationId);

      if (data.status === 'completed') {
        updateFileStatus(index, 'completed', 100, evaluationId);
      } else if (data.status === 'failed') {
        throw new Error(data.result?.error || 'Processing failed');
      } else {
        // Continue polling
        setTimeout(() => pollProgress(index, evaluationId), 2000);
      }
    } catch (error) {
      updateFileStatus(index, 'failed', 0, evaluationId,
        error instanceof Error ? error.message : 'Processing failed'
      );
    }
  };

  const updateFileStatus = (
    index: number,
    status: QueueFile['status'],
    progress: number,
    evaluationId?: string,
    error?: string
  ) => {
    setQueueFiles(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status,
        progress,
        evaluationId: evaluationId || updated[index].evaluationId,
        error,
      };
      return updated;
    });
  };

  const retryFile = (index: number) => {
    updateFileStatus(index, 'pending', 0, undefined, undefined);
  };

  const removeFile = (index: number) => {
    setQueueFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    if (type.includes('word')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getStatusIcon = (status: QueueFile['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusText = (queueFile: QueueFile) => {
    switch (queueFile.status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return `Processing... ${queueFile.progress}%`;
      case 'completed':
        return 'Completed';
      case 'failed':
        return queueFile.error || 'Failed';
    }
  };

  const completedCount = queueFiles.filter(f => f.status === 'completed').length;
  const failedCount = queueFiles.filter(f => f.status === 'failed').length;

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-1">
              Processing Books
            </h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {queueFiles.length} completed
              {failedCount > 0 && ` • ${failedCount} failed`}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-queue"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium text-foreground">
              {queueFiles.length > 0 ? Math.round((completedCount / queueFiles.length) * 100) : 0}%
            </span>
          </div>
          <Progress 
            value={queueFiles.length > 0 ? (completedCount / queueFiles.length) * 100 : 0} 
            className="h-2"
          />
        </div>
      </div>

      {/* File Queue */}
      <div className="space-y-3">
        {queueFiles.map((queueFile, index) => (
          <div
            key={queueFile.id}
            className={cn(
              "bg-card border rounded-lg p-4 transition-all duration-300",
              queueFile.status === 'processing' && "border-primary shadow-lg",
              queueFile.status === 'completed' && "border-green-500/50",
              queueFile.status === 'failed' && "border-destructive/50",
              queueFile.status === 'pending' && "border-border"
            )}
            data-testid={`queue-file-${index}`}
          >
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <div className="flex-shrink-0 mt-1">
                {getFileIcon(queueFile.file.type)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {queueFile.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {queueFile.file.name.split('.').pop()?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(queueFile.file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusIcon(queueFile.status)}
                    {queueFile.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryFile(index)}
                        data-testid={`button-retry-${index}`}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                    {queueFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        data-testid={`button-remove-queue-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status Text */}
                <p className={cn(
                  "text-sm",
                  queueFile.status === 'failed' ? "text-destructive" : "text-muted-foreground"
                )}>
                  {getStatusText(queueFile)}
                </p>

                {/* Progress Bar */}
                {(queueFile.status === 'processing' || queueFile.status === 'uploading') && (
                  <Progress 
                    value={queueFile.progress} 
                    className="h-1.5 mt-2"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
