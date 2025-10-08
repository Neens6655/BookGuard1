import React, { useEffect, useState } from 'react';
import { X, Clock, Brain, Shield, Heart, Target, Languages, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcessingViewProps {
  filename: string;
  fileSize: number;
  progress: number;
  onCancel?: () => void;
}

const SYSTEM_ANALYSIS = [
  {
    id: 1,
    name: 'Cultural Values',
    icon: Shield,
    color: 'green',
    bgColor: 'from-green-500 to-emerald-500',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    bgLight: 'bg-green-50',
    description: 'UAE/Islamic/Arab alignment',
    insights: [
      'Analyzing cultural references...',
      'Checking Islamic values alignment...',
      'Evaluating regional appropriateness...'
    ]
  },
  {
    id: 2,
    name: 'Child Safety',
    icon: Heart,
    color: 'blue',
    bgColor: 'from-blue-500 to-cyan-500',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgLight: 'bg-blue-50',
    description: 'Global safety standards',
    insights: [
      'Scanning for inappropriate content...',
      'Evaluating violence indicators...',
      'Checking age-appropriate themes...'
    ]
  },
  {
    id: 3,
    name: 'Theme Complexity',
    icon: Target,
    color: 'purple',
    bgColor: 'from-purple-500 to-pink-500',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    bgLight: 'bg-purple-50',
    description: 'Developmental readiness',
    insights: [
      'Assessing narrative complexity...',
      'Analyzing emotional depth...',
      'Evaluating conceptual maturity...'
    ]
  },
  {
    id: 4,
    name: 'Language Level',
    icon: Languages,
    color: 'orange',
    bgColor: 'from-orange-500 to-amber-500',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    bgLight: 'bg-orange-50',
    description: 'Reading comprehension',
    insights: [
      'Analyzing vocabulary complexity...',
      'Measuring sentence structure...',
      'Determining reading level...'
    ]
  }
];

export function ProcessingView({ filename, fileSize, progress, onCancel }: ProcessingViewProps) {
  const [activeInsights, setActiveInsights] = useState<Record<number, number>>({});
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInsights(prev => {
        const newInsights = { ...prev };
        SYSTEM_ANALYSIS.forEach(system => {
          const systemProgress = getSystemProgress(system.id);
          if (systemProgress > 0 && systemProgress < 100) {
            newInsights[system.id] = (newInsights[system.id] || 0) + 1;
            if (newInsights[system.id] >= system.insights.length) {
              newInsights[system.id] = 0;
            }
          }
        });
        return newInsights;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [progress]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getSystemProgress = (systemId: number) => {
    const baseProgress = progress - 20; // First 20% is file processing
    if (baseProgress <= 0) return 0;
    
    const systemStep = (baseProgress / 80) * 100; // 80% divided among 4 systems
    const perSystemProgress = systemStep / 4;
    
    if (systemId === 1) return Math.min(100, systemStep);
    if (systemId === 2) return Math.min(100, Math.max(0, systemStep - 25));
    if (systemId === 3) return Math.min(100, Math.max(0, systemStep - 50));
    if (systemId === 4) return Math.min(100, Math.max(0, systemStep - 75));
    return 0;
  };

  const getSystemStatus = (systemId: number) => {
    const systemProgress = getSystemProgress(systemId);
    if (systemProgress === 0) return 'pending';
    if (systemProgress === 100) return 'complete';
    return 'active';
  };

  const getEstimatedTime = () => {
    if (progress < 30) return '~3 minutes';
    if (progress < 60) return '~2 minutes';
    if (progress < 85) return '~1 minute';
    return '~30 seconds';
  };

  const getCurrentPhase = () => {
    if (progress < 20) return 'Extracting & Processing Content';
    if (progress < 40) return 'Deep AI Analysis - Cultural Assessment';
    if (progress < 60) return 'Deep AI Analysis - Safety Evaluation';
    if (progress < 80) return 'Deep AI Analysis - Complexity Scoring';
    if (progress < 95) return 'Generating Comprehensive Report';
    return 'Finalizing Results';
  };

  return (
    <section className="py-12 min-h-screen bg-gradient-to-b from-background to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <Brain className="text-white w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3" data-testid="processing-title">
            AI Deep Analysis in Progress
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our advanced AI is evaluating your book through 4 comprehensive systems
          </p>
        </div>

        {/* File Info Card */}
        <Card className="mb-8 max-w-4xl mx-auto border-2 border-emerald-100 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg" data-testid="processing-filename">{filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileSize)} • {getCurrentPhase()}
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

            {/* Overall Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Overall Analysis Progress</span>
                <span className="text-sm font-bold text-emerald-600" data-testid="progress-percentage">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-3 bg-gray-200" />
            </div>
          </CardContent>
        </Card>

        {/* 4-System Framework Analysis */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="text-center mb-6">
            <Badge variant="outline" className="mb-2 border-emerald-300 text-emerald-700">
              <Brain className="w-3 h-3 mr-2" />
              4-System Evaluation Framework
            </Badge>
            <h3 className="text-xl font-bold text-foreground">Live AI Analysis Status</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {SYSTEM_ANALYSIS.map((system) => {
              const SystemIcon = system.icon;
              const status = getSystemStatus(system.id);
              const systemProgress = getSystemProgress(system.id);
              const currentInsight = activeInsights[system.id] || 0;

              return (
                <Card 
                  key={system.id}
                  className={`transition-all duration-500 ${
                    status === 'active' 
                      ? `border-2 ${system.borderColor} shadow-lg scale-[1.02]` 
                      : status === 'complete'
                      ? `border-2 border-green-300 bg-green-50/30`
                      : 'border border-gray-200 opacity-60'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${system.bgColor} rounded-xl flex items-center justify-center shadow-md ${
                          status === 'active' ? 'animate-pulse' : ''
                        }`}>
                          <SystemIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">System {system.id}</h4>
                          <p className="text-sm font-semibold text-muted-foreground">{system.name}</p>
                        </div>
                      </div>
                      
                      {status === 'complete' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : status === 'active' ? (
                        <Loader2 className={`w-6 h-6 ${system.textColor} animate-spin`} />
                      ) : (
                        <div className={`w-6 h-6 rounded-full border-2 ${system.borderColor}`} />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">{system.description}</p>

                    {status === 'active' && (
                      <div className={`${system.bgLight} rounded-lg p-3 mb-3 border ${system.borderColor}`}>
                        <p className={`text-sm ${system.textColor} font-medium animate-pulse`}>
                          {system.insights[currentInsight]}
                        </p>
                      </div>
                    )}

                    {status === 'complete' && (
                      <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
                        <p className="text-sm text-green-700 font-medium flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Analysis Complete
                        </p>
                      </div>
                    )}

                    {(status === 'active' || status === 'complete') && (
                      <div className="mt-2">
                        <Progress value={systemProgress} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Time Estimate */}
        <div className="text-center">
          <Card className="inline-block border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid="estimated-time">
                <Clock className="w-4 h-4 text-emerald-600" />
                Estimated time remaining: 
                <span className="font-bold text-emerald-700">{getEstimatedTime()}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
