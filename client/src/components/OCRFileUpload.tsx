import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Scan, Image, AlertCircle, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface OCRFileUploadProps {
  onFilesUpload: (files: File[]) => void;
  className?: string;
  maxFiles?: number;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'application/pdf': ['.pdf']
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export function OCRFileUpload({ onFilesUpload, className, maxFiles = 10 }: OCRFileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.some((e: any) => e.code === 'file-too-large')) {
        setError('One or more files exceed 50MB size limit');
      } else if (rejection.errors?.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Only image files (JPG, PNG, WEBP, PDF, GIF, BMP) are supported for OCR');
      } else {
        setError('Some files are invalid. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const totalFiles = selectedFiles.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        const allowed = maxFiles - selectedFiles.length;
        setError(`You can only add ${allowed} more file${allowed !== 1 ? 's' : ''}. Maximum ${maxFiles} files allowed at once.`);
        setSelectedFiles([...selectedFiles, ...acceptedFiles.slice(0, allowed)]);
      } else {
        setSelectedFiles([...selectedFiles, ...acceptedFiles]);
      }
    }
  }, [selectedFiles, maxFiles]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUploadAll = useCallback(() => {
    if (selectedFiles.length > 0) {
      onFilesUpload(selectedFiles);
      setSelectedFiles([]);
    }
  }, [selectedFiles, onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true
  });

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <Image className="text-red-500" />;
    if (type.includes('image')) return <Image className="text-blue-500" />;
    return <Image className="text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "upload-zone bg-card border-2 border-dashed border-amber-500/50 rounded-xl p-12 text-center cursor-pointer transition-all hover:border-amber-500",
          isDragActive && "drag-over border-amber-500",
          selectedFiles.length > 0 && "p-8"
        )}
      >
        <input {...getInputProps()} data-testid="ocr-file-input" />
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
            <Scan className="text-amber-500 text-3xl w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Drop scanned book images here
          </h3>
          <p className="text-muted-foreground mb-2">
            or click to browse from your device (up to {maxFiles} files)
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
            🤖 Powered by DeepSeek OCR - Extract text from scanned books and images
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm flex items-center gap-1">
              <Image className="w-3 h-3" />
              JPG
            </span>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm flex items-center gap-1">
              <Image className="w-3 h-3" />
              PNG
            </span>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm flex items-center gap-1">
              <Image className="w-3 h-3" />
              WEBP
            </span>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm flex items-center gap-1">
              <Image className="w-3 h-3" />
              PDF
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Maximum file size: 50MB</p>
        </div>
      </div>

      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            <Button
              onClick={handleUploadAll}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-lg"
              data-testid="button-ocr-upload-all"
            >
              <Upload className="w-4 h-4 mr-2" />
              Extract & Analyze ({selectedFiles.length})
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="bg-card border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 group hover:border-amber-500/50 transition-all"
                data-testid={`ocr-file-card-${index}`}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                      <Scan className="w-3 h-3 mr-1" />
                      OCR
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 p-1 hover:bg-destructive/10 rounded transition-colors"
                  data-testid={`button-remove-ocr-file-${index}`}
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
