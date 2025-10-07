import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, FileText, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  className?: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/epub+zip': ['.epub'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf']
};

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export function FileUpload({ onFileUpload, className }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.some((e: any) => e.code === 'file-too-large')) {
        setError('File size must be less than 100MB');
      } else if (rejection.errors?.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Only PDF, Word, TXT, EPUB, and RTF files are supported');
      } else {
        setError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false
  });

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <File className="text-red-500" />;
    if (type.includes('word')) return <FileText className="text-blue-500" />;
    if (type.includes('text')) return <FileText className="text-gray-500" />;
    return <File className="text-gray-400" />;
  };

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "upload-zone bg-card border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer transition-all",
          isDragActive && "drag-over"
        )}
      >
        <input {...getInputProps()} data-testid="file-input" />
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Cloud className="text-primary text-3xl w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Drop your book file here
          </h3>
          <p className="text-muted-foreground mb-6">
            or click to browse from your device
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm flex items-center gap-1">
              <File className="w-3 h-3" />
              PDF
            </span>
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Word
            </span>
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm flex items-center gap-1">
              <FileText className="w-3 h-3" />
              TXT
            </span>
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm flex items-center gap-1">
              <File className="w-3 h-3" />
              EPUB
            </span>
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm flex items-center gap-1">
              <FileText className="w-3 h-3" />
              RTF
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Maximum file size: 100MB</p>
        </div>
      </div>

      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-card rounded-lg p-4 border border-border text-center" data-testid="stat-books-analyzed">
          <div className="text-2xl font-bold text-primary">12,847</div>
          <div className="text-sm text-muted-foreground mt-1">Books Analyzed</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border text-center" data-testid="stat-accuracy">
          <div className="text-2xl font-bold text-secondary">98.5%</div>
          <div className="text-sm text-muted-foreground mt-1">Accuracy Rate</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border text-center" data-testid="stat-steps">
          <div className="text-2xl font-bold text-accent">7 Steps</div>
          <div className="text-sm text-muted-foreground mt-1">AI Analysis</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border text-center" data-testid="stat-languages">
          <div className="text-2xl font-bold text-primary">2 Lang</div>
          <div className="text-sm text-muted-foreground mt-1">EN | AR</div>
        </div>
      </div>
    </div>
  );
}
