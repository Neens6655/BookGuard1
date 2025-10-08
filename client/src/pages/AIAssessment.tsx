import { useState } from 'react';
import { Upload, BookOpen, Download, Plus, ArrowLeft, Sparkles, Brain, Shield, TrendingUp, AlertTriangle, CheckCircle2, Target, Languages, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface DeepAnalysis {
  title: string;
  author?: string;
  
  // Content Analysis
  narrative_structure: {
    plot_complexity: string;
    character_development: string;
    pacing: string;
    themes: string[];
  };
  
  // Language Analysis
  language_metrics: {
    vocabulary_level: string;
    sentence_complexity: string;
    reading_ease_score: number;
    unique_word_count: number;
  };
  
  // Cultural Analysis
  cultural_assessment: {
    islamic_values: string[];
    uae_cultural_elements: string[];
    universal_themes: string[];
    potential_concerns: string[];
  };
  
  // Educational Value
  educational_insights: {
    learning_objectives: string[];
    skill_development: string[];
    discussion_topics: string[];
  };
  
  // Safety Deep Dive
  safety_analysis: {
    content_warnings: string[];
    age_appropriateness: string;
    parental_guidance_areas: string[];
    positive_messages: string[];
  };
  
  // AI Recommendations
  recommendations: {
    best_for: string;
    teaching_strategies: string[];
    complementary_books: string[];
  };
}

export default function AIAssessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload a file smaller than 100MB.',
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('POST', '/api/deep-analyze', formData);
      const result = await response.json();

      clearInterval(progressInterval);
      setProgress(100);
      setAnalysis(result);
      setIsAnalyzing(false);

      toast({
        title: 'Analysis Complete',
        description: 'Your deep analysis is ready!',
      });

    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze the book. Please try again.',
      });
    }
  };

  const handleDownload = () => {
    if (!analysis) return;
    
    const reportContent = JSON.stringify(analysis, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.title}_deep_analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download Complete',
      description: 'Your detailed analysis report has been downloaded.',
    });
  };

  const handleAddToLibrary = () => {
    toast({
      title: 'Coming Soon',
      description: 'Add to library functionality will be available soon.',
    });
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setProgress(0);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-cyan-50 to-sky-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="gap-2"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">
                AI Deep Assessment
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysis ? (
          <>
            {/* Upload Section */}
            <Card className="mb-8 bg-white/80 backdrop-blur-sm border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-green-600" />
                  Upload Book for Deep Analysis
                </CardTitle>
                <p className="text-muted-foreground">
                  Get comprehensive AI-powered insights including narrative structure, language metrics, cultural assessment, and educational value
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    isDragging
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-semibold mb-2">
                    {file ? file.name : 'Drop your book here'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    or click to browse (PDF, Word, TXT, EPUB, RTF - Max 100MB)
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.epub,.rtf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    data-testid="input-file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild className="bg-gradient-to-r from-green-500 to-cyan-500 text-white">
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>

                {file && !isAnalyzing && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleAnalyze}
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-cyan-600 text-white px-8 py-6 text-lg"
                      data-testid="button-analyze"
                    >
                      <Brain className="w-5 h-5 mr-2" />
                      Start Deep Analysis
                    </Button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="mt-6 space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">Analyzing your book...</p>
                      <p className="text-sm text-muted-foreground">
                        This may take a few moments
                      </p>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <p className="text-center text-sm text-muted-foreground">{progress}% complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Analysis Results */}
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="bg-gradient-to-br from-green-500 to-cyan-400 text-white border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{analysis.title}</h2>
                      {analysis.author && <p className="text-lg opacity-90">by {analysis.author}</p>}
                    </div>
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 text-base px-4 py-2">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Analysis Complete
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Narrative Structure */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Narrative Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Plot Complexity</h4>
                    <p className="text-base">{analysis.narrative_structure.plot_complexity}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Character Development</h4>
                    <p className="text-base">{analysis.narrative_structure.character_development}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Pacing</h4>
                    <p className="text-base">{analysis.narrative_structure.pacing}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.narrative_structure.themes.map((theme, idx) => (
                        <Badge key={idx} variant="secondary">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Language Metrics */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-blue-600" />
                    Language Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Vocabulary Level</h4>
                        <p className="text-base">{analysis.language_metrics.vocabulary_level}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Sentence Complexity</h4>
                        <p className="text-base">{analysis.language_metrics.sentence_complexity}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Reading Ease Score</h4>
                        <div className="flex items-center gap-3">
                          <Progress value={analysis.language_metrics.reading_ease_score} className="flex-1" />
                          <span className="text-lg font-bold text-blue-600">{analysis.language_metrics.reading_ease_score}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Unique Words</h4>
                        <p className="text-2xl font-bold text-blue-600">{analysis.language_metrics.unique_word_count.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cultural Assessment */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Cultural Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-green-700 mb-2">Islamic Values</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.cultural_assessment.islamic_values.map((value, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-700">{value}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-cyan-700 mb-2">UAE Cultural Elements</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.cultural_assessment.uae_cultural_elements.map((element, idx) => (
                        <Badge key={idx} className="bg-cyan-100 text-cyan-700">{element}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-blue-700 mb-2">Universal Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.cultural_assessment.universal_themes.map((theme, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                  {analysis.cultural_assessment.potential_concerns.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-orange-700 mb-2">Considerations</h4>
                      <div className="space-y-1">
                        {analysis.cultural_assessment.potential_concerns.map((concern, idx) => (
                          <p key={idx} className="text-sm text-orange-600 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {concern}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Educational Value */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    Educational Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Learning Objectives</h4>
                    <ul className="space-y-1">
                      {analysis.educational_insights.learning_objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Skill Development</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.educational_insights.skill_development.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="border-orange-300 text-orange-700">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Discussion Topics</h4>
                    <ul className="space-y-1">
                      {analysis.educational_insights.discussion_topics.map((topic, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground italic">• {topic}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Analysis */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    Safety Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Age Appropriateness</h4>
                      <Badge className="bg-blue-100 text-blue-700 text-base px-3 py-1">
                        {analysis.safety_analysis.age_appropriateness}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Content Warnings</h4>
                      {analysis.safety_analysis.content_warnings.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {analysis.safety_analysis.content_warnings.map((warning, idx) => (
                            <Badge key={idx} variant="destructive">{warning}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-600 font-medium">No warnings</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Parental Guidance Areas</h4>
                    <ul className="space-y-1">
                      {analysis.safety_analysis.parental_guidance_areas.map((area, idx) => (
                        <li key={idx} className="text-sm">• {area}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-green-700 mb-2">Positive Messages</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.safety_analysis.positive_messages.map((message, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-700">{message}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Best For</h4>
                    <p className="text-base">{analysis.recommendations.best_for}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Teaching Strategies</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.teaching_strategies.map((strategy, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Complementary Books</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommendations.complementary_books.map((book, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-700">{book}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Bar */}
              <Card className="bg-white/80 backdrop-blur-sm sticky bottom-0 border-2 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Analysis Complete</h3>
                      <p className="text-sm text-muted-foreground">Download the report, add to library, or analyze another book</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="gap-2"
                        data-testid="button-new-analysis"
                      >
                        <RotateCcw className="w-4 h-4" />
                        New Analysis
                      </Button>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="gap-2"
                        data-testid="button-download-analysis"
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </Button>
                      <Button
                        onClick={handleAddToLibrary}
                        className="bg-gradient-to-r from-green-600 to-cyan-600 text-white gap-2"
                        data-testid="button-add-to-library"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Library
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
