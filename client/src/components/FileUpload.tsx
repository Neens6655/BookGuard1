import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, FileText, File, AlertCircle, Shield, Heart, Target, Languages, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  onFilesUpload: (files: File[]) => void;
  className?: string;
  maxFiles?: number;
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

export function FileUpload({ onFilesUpload, className, maxFiles = 10 }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.some((e: any) => e.code === 'file-too-large')) {
        setError('One or more files exceed 100MB size limit');
      } else if (rejection.errors?.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Only PDF, Word, TXT, EPUB, and RTF files are supported');
      } else {
        setError('Some files are invalid. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
      if (newFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
      }
      setSelectedFiles(newFiles);
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
    if (type.includes('pdf')) return <File className="text-red-500" />;
    if (type.includes('word')) return <FileText className="text-blue-500" />;
    if (type.includes('text')) return <FileText className="text-gray-500" />;
    return <File className="text-gray-400" />;
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
          "upload-zone bg-card border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer transition-all",
          isDragActive && "drag-over",
          selectedFiles.length > 0 && "p-8"
        )}
      >
        <input {...getInputProps()} data-testid="file-input" />
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Cloud className="text-primary text-3xl w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Drop your book files here
          </h3>
          <p className="text-muted-foreground mb-6">
            or click to browse from your device (up to {maxFiles} files)
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

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            <Button
              onClick={handleUploadAll}
              className="bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 hover:from-green-600 hover:via-emerald-600 hover:to-cyan-600 text-white shadow-lg"
              data-testid="button-upload-all"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload All ({selectedFiles.length})
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 group hover:border-primary/50 transition-all"
                data-testid={`file-card-${index}`}
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
                      {file.name.split('.').pop()?.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-${index}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4-System Evaluation Framework */}
      <div className="mt-8">
        <div className="text-center mb-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            4-System Evaluation Framework
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* System 1: Cultural Values */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 text-center group hover:shadow-md transition-all" data-testid="system-cultural-values">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-xs font-bold text-green-700 mb-1">SYSTEM 1</div>
            <div className="text-sm font-semibold text-foreground">Cultural Values</div>
            <div className="text-xs text-muted-foreground mt-1">UAE/Islamic/Arab</div>
          </div>

          {/* System 2: Child Safety */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 text-center group hover:shadow-md transition-all" data-testid="system-child-safety">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="text-xs font-bold text-blue-700 mb-1">SYSTEM 2</div>
            <div className="text-sm font-semibold text-foreground">Child Safety</div>
            <div className="text-xs text-muted-foreground mt-1">Global Standards</div>
          </div>

          {/* System 3: Theme Complexity */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 text-center group hover:shadow-md transition-all" data-testid="system-theme-complexity">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-xs font-bold text-purple-700 mb-1">SYSTEM 3</div>
            <div className="text-sm font-semibold text-foreground">Theme Level</div>
            <div className="text-xs text-muted-foreground mt-1">Age Readiness</div>
          </div>

          {/* System 4: Language Complexity */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200 text-center group hover:shadow-md transition-all" data-testid="system-language-complexity">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <div className="text-xs font-bold text-orange-700 mb-1">SYSTEM 4</div>
            <div className="text-sm font-semibold text-foreground">Language Level</div>
            <div className="text-xs text-muted-foreground mt-1">Reading Ability</div>
          </div>
        </div>
      </div>
    </div>
  );
}
