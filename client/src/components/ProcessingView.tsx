import React from 'react';
import { X, Clock, Brain } from 'lucide-react';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface ProcessingViewProps {
  filename: string;
  fileSize: number;
  progress: number;
  onCancel?: () => void;
}

const PROCESSING_STEPS = [
  {
    id: 'text-extraction',
    title: 'Text Extraction',
    description: 'Extracting content from document...'
  },
  {
    id: 'language-detection',
    title: 'Language Detection', 
    description: 'Identifying book language...'
  },
  {
    id: 'content-analysis',
    title: 'Content Analysis',
    description: 'Analyzing themes and narrative...'
  },
  {
    id: 'cultural-assessment',
    title: 'Cultural Assessment',
    description: 'Evaluating Islamic values alignment...'
  },
  {
    id: 'safety-scoring',
    title: 'Safety Scoring',
    description: 'Calculating whitelist score...'
  },
  {
    id: 'age-recommendations',
    title: 'Age Recommendations',
    description: 'Determining age suitability...'
  },
  {
    id: 'report-generation',
    title: 'Report Generation',
    description: 'Creating detailed report...'
  }
];

export function ProcessingView({ filename, fileSize, progress, onCancel }: ProcessingViewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCurrentStep = () => {
    if (progress <= 15) return 1;
    if (progress <= 30) return 2;
    if (progress <= 45) return 3;
    if (progress <= 65) return 4;
    if (progress <= 80) return 5;
    if (progress <= 95) return 6;
    return 7;
  };

  const getEstimatedTime = () => {
    if (progress < 50) return '~2 minutes';
    if (progress < 80) return '~1 minute';
    return '~30 seconds';
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Processing Card */}
          <Card className="processing-glow shadow-lg">
            <CardContent className="p-8">
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Brain className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="processing-title">
                  Analyzing Your Book
                </h3>
                <p className="text-muted-foreground">Our AI is performing a comprehensive evaluation...</p>
              </div>

              {/* File Info */}
              <div className="bg-muted/50 rounded-lg p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-pdf text-primary text-xl"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground" data-testid="processing-filename">{filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(fileSize)} • Uploaded just now
                    </p>
                  </div>
                </div>
                {onCancel && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onCancel}
                    className="text-destructive hover:text-destructive/80"
                    data-testid="button-cancel"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Progress Steps */}
              <ProgressSteps 
                steps={PROCESSING_STEPS}
                currentStep={getCurrentStep()}
                className="mb-8"
              />

              {/* Overall Progress */}
              <div className="pt-8 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Overall Progress</span>
                  <span className="text-sm font-medium text-primary" data-testid="progress-percentage">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2 mb-4" />
              </div>
            </CardContent>
          </Card>

          {/* Estimated Time */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground" data-testid="estimated-time">
              <Clock className="inline w-4 h-4 mr-1" />
              Estimated time remaining: <span className="font-medium text-foreground">{getEstimatedTime()}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
