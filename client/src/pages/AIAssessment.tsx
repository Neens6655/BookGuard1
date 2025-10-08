import { useState } from 'react';
import { Upload, BookOpen, Download, Plus, ArrowLeft, Sparkles, Brain, Shield, TrendingUp, AlertTriangle, CheckCircle2, Target, Languages, RotateCcw, FileText, Quote, XCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';

interface DeepAnalysis {
  title: string;
  author?: string;
  
  narrative_structure: {
    plot_complexity: string;
    plot_evidence: string;
    character_development: string;
    character_evidence: string;
    pacing: string;
    pacing_evidence: string;
    themes: string[];
    key_moments: Array<{ page: string; quote: string; significance: string }>;
  };
  
  language_metrics: {
    vocabulary_level: string;
    vocabulary_examples: string[];
    sentence_complexity: string;
    complexity_examples: string[];
    reading_ease_score: number;
    unique_word_count: number;
    linguistic_features: string[];
  };
  
  cultural_assessment: {
    islamic_values: Array<{ value: string; evidence: string; page: string }>;
    uae_cultural_elements: Array<{ element: string; context: string; quote: string }>;
    universal_themes: string[];
    potential_concerns: Array<{ concern: string; evidence: string; severity: string }>;
  };
  
  educational_insights: {
    learning_objectives: Array<{ objective: string; evidence: string }>;
    skill_development: Array<{ skill: string; how_developed: string }>;
    discussion_topics: Array<{ topic: string; guiding_questions: string[] }>;
    pedagogical_value: string;
  };
  
  safety_analysis: {
    content_warnings: Array<{ warning: string; context: string; evidence: string; page: string }>;
    age_appropriateness: {
      recommended_age: string;
      rationale: string;
      developmental_considerations: string[];
    };
    parental_guidance_areas: Array<{ area: string; reason: string; discussion_points: string[] }>;
    positive_messages: Array<{ message: string; evidence: string }>;
    risk_assessment: {
      level: string;
      factors: string[];
    };
  };
  
  recommendations: {
    best_for: string;
    teaching_strategies: Array<{ strategy: string; implementation: string }>;
    complementary_books: string[];
    usage_contexts: string[];
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

  const getWhitelistStatus = (analysis: DeepAnalysis) => {
    const riskLevel = analysis.safety_analysis.risk_assessment.level;
    const hasSevereConcerns = analysis.cultural_assessment.potential_concerns.some(
      c => c.severity === 'High' || c.severity === 'Severe'
    );
    const hasModerateConcerns = analysis.cultural_assessment.potential_concerns.some(
      c => c.severity === 'Moderate'
    );
    const hasContentWarnings = analysis.safety_analysis.content_warnings.length > 0;

    if (hasSevereConcerns || riskLevel === 'High') {
      return {
        label: 'Not Whitelisted',
        icon: XCircle,
        className: 'bg-red-500/20 text-red-100 border-red-300/50',
      };
    }
    
    if (hasModerateConcerns || riskLevel === 'Moderate' || hasContentWarnings) {
      return {
        label: 'Parent Guidance',
        icon: AlertTriangle,
        className: 'bg-yellow-500/20 text-yellow-100 border-yellow-300/50',
      };
    }
    
    return {
      label: 'Whitelisted',
      icon: CheckCircle2,
      className: 'bg-green-500/20 text-green-100 border-green-300/50',
    };
  };

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
            <Link href="/" data-testid="button-back-to-home" className="group inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-md border border-green-500/30 rounded-full text-green-700 hover:bg-green-500/20 hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back</span>
            </Link>
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
                  Get comprehensive AI-powered insights with evidence-based analysis, textual quotes, and structured assessments
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
                        Extracting evidence and generating insights
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
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-2">{analysis.title}</h2>
                      {analysis.author && <p className="text-lg opacity-90 mb-4">by {analysis.author}</p>}
                      
                      {/* Age Group and Whitelist Status */}
                      <div className="flex items-center gap-3 mt-4">
                        <Badge 
                          className="bg-white/30 backdrop-blur-md text-white border-white/40 text-base px-4 py-2 flex items-center gap-2"
                          data-testid="badge-age-group"
                        >
                          <Users className="w-4 h-4" />
                          {analysis.safety_analysis.age_appropriateness.recommended_age}
                        </Badge>
                        
                        {(() => {
                          const status = getWhitelistStatus(analysis);
                          const StatusIcon = status.icon;
                          return (
                            <Badge 
                              className={`${status.className} backdrop-blur-md border text-base px-4 py-2 flex items-center gap-2`}
                              data-testid="badge-whitelist-status"
                            >
                              <StatusIcon className="w-4 h-4" />
                              {status.label}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 text-base px-4 py-2">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Analysis Complete
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Narrative Structure with Evidence */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Narrative Structure & Evidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Plot Complexity</h4>
                      <p className="text-base mb-3">{analysis.narrative_structure.plot_complexity}</p>
                      <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                        <p className="text-sm text-purple-900 italic leading-relaxed whitespace-pre-line">
                          "{analysis.narrative_structure.plot_evidence}"
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Character Development</h4>
                      <p className="text-base mb-3">{analysis.narrative_structure.character_development}</p>
                      <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded">
                        <p className="text-sm text-indigo-900 italic leading-relaxed whitespace-pre-line">
                          "{analysis.narrative_structure.character_evidence}"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Pacing Analysis</h4>
                    <p className="text-base mb-3">{analysis.narrative_structure.pacing}</p>
                    <div className="bg-violet-50 border-l-4 border-violet-400 p-3 rounded">
                      <p className="text-sm text-violet-900 italic leading-relaxed whitespace-pre-line">
                        "{analysis.narrative_structure.pacing_evidence}"
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Key Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.narrative_structure.themes || []).map((theme, idx) => (
                        <Badge key={idx} variant="secondary">{theme}</Badge>
                      ))}
                    </div>
                  </div>

                  {analysis.narrative_structure.key_moments && analysis.narrative_structure.key_moments.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">Pivotal Moments</h4>
                      <div className="space-y-4">
                        {analysis.narrative_structure.key_moments.map((moment, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start gap-3">
                              <Quote className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">{moment.page}</Badge>
                                </div>
                                <p className="text-sm italic text-gray-700 mb-2 leading-relaxed">"{moment.quote}"</p>
                                <p className="text-sm text-gray-600"><strong>Significance:</strong> {moment.significance}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language Metrics with Examples */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-blue-600" />
                    Language Metrics & Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Vocabulary Level</h4>
                      <p className="text-lg font-semibold text-blue-700 mb-3">{analysis.language_metrics.vocabulary_level}</p>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-2">Advanced Vocabulary Examples:</p>
                        <div className="flex flex-wrap gap-2">
                          {(analysis.language_metrics.vocabulary_examples || []).map((word, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700">{word}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Sentence Complexity</h4>
                      <p className="text-base mb-3">{analysis.language_metrics.sentence_complexity}</p>
                      <div className="bg-sky-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-sky-800 mb-2">Complexity Examples:</p>
                        <div className="space-y-2">
                          {(analysis.language_metrics.complexity_examples || []).map((example, idx) => (
                            <p key={idx} className="text-xs text-sky-900 italic">"{example}"</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Reading Ease Score</h4>
                      <div className="flex items-center gap-3">
                        <Progress value={analysis.language_metrics.reading_ease_score} className="flex-1" />
                        <span className="text-2xl font-bold text-blue-600">{analysis.language_metrics.reading_ease_score}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Unique Words</h4>
                      <p className="text-2xl font-bold text-blue-600">{analysis.language_metrics.unique_word_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Linguistic Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {(analysis.language_metrics.linguistic_features || []).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cultural Assessment with Evidence */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Cultural Assessment with Evidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-sm text-green-700 mb-3">Islamic Values Identified</h4>
                    <div className="space-y-4">
                      {(analysis.cultural_assessment.islamic_values || []).map((item, idx) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-start gap-3 mb-3">
                            <Badge className="bg-green-600 text-white">{item.value}</Badge>
                            <Badge variant="outline" className="text-xs">{item.page}</Badge>
                          </div>
                          <div className="bg-white/80 border-l-4 border-green-500 p-3 rounded">
                            <p className="text-sm text-green-900 italic leading-relaxed whitespace-pre-line">"{item.evidence}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-cyan-700 mb-3">UAE Cultural Elements</h4>
                    <div className="space-y-4">
                      {(analysis.cultural_assessment.uae_cultural_elements || []).map((item, idx) => (
                        <div key={idx} className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                          <div className="mb-2">
                            <Badge className="bg-cyan-600 text-white mb-2">{item.element}</Badge>
                            <p className="text-sm text-cyan-800 mb-2">{item.context}</p>
                          </div>
                          <div className="bg-white/80 border-l-4 border-cyan-500 p-3 rounded">
                            <p className="text-sm text-cyan-900 italic leading-relaxed">"{item.quote}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-blue-700 mb-2">Universal Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.cultural_assessment.universal_themes || []).map((theme, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700">{theme}</Badge>
                      ))}
                    </div>
                  </div>

                  {analysis.cultural_assessment.potential_concerns.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-orange-700 mb-3">Cultural Considerations</h4>
                      <div className="space-y-4">
                        {(analysis.cultural_assessment.potential_concerns || []).map((item, idx) => (
                          <div key={idx} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              <Badge variant="outline" className={`
                                ${item.severity === 'High' ? 'border-red-500 text-red-700' : ''}
                                ${item.severity === 'Moderate' ? 'border-orange-500 text-orange-700' : ''}
                                ${item.severity === 'Low' ? 'border-yellow-500 text-yellow-700' : ''}
                              `}>
                                {item.severity} Severity
                              </Badge>
                              <span className="text-sm font-medium text-orange-800">{item.concern}</span>
                            </div>
                            <div className="bg-white/80 border-l-4 border-orange-500 p-3 rounded">
                              <p className="text-sm text-orange-900 italic leading-relaxed whitespace-pre-line">"{item.evidence}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Educational Insights with Evidence */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    Educational Value & Pedagogy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-semibold text-sm text-amber-800 mb-2">Pedagogical Value</h4>
                    <p className="text-base text-amber-900">{analysis.educational_insights.pedagogical_value}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Learning Objectives</h4>
                    <div className="space-y-3">
                      {(analysis.educational_insights.learning_objectives || []).map((item, idx) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-start gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="font-medium text-green-800">{item.objective}</p>
                          </div>
                          <p className="text-sm text-green-700 ml-7 italic">Evidence: "{item.evidence}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Skill Development</h4>
                    <div className="space-y-3">
                      {(analysis.educational_insights.skill_development || []).map((item, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <Badge className="bg-blue-600 text-white mb-2">{item.skill}</Badge>
                          <p className="text-sm text-blue-800">{item.how_developed}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Discussion Topics & Questions</h4>
                    <div className="space-y-4">
                      {(analysis.educational_insights.discussion_topics || []).map((item, idx) => (
                        <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <p className="font-medium text-purple-800 mb-2">{item.topic}</p>
                          <ul className="space-y-1 ml-4">
                            {item.guiding_questions.map((q, qIdx) => (
                              <li key={qIdx} className="text-sm text-purple-700">• {q}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Analysis with Evidence */}
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    Comprehensive Safety Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Risk Assessment Overview */}
                  <div className="bg-slate-100 rounded-lg p-4 border-2 border-slate-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800">Risk Assessment Level</h4>
                      <Badge className={`text-base px-4 py-1
                        ${analysis.safety_analysis.risk_assessment.level === 'Low' ? 'bg-green-100 text-green-800' : ''}
                        ${analysis.safety_analysis.risk_assessment.level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${analysis.safety_analysis.risk_assessment.level === 'High' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {analysis.safety_analysis.risk_assessment.level} Risk
                      </Badge>
                    </div>
                    <ul className="space-y-1">
                      {(analysis.safety_analysis.risk_assessment.factors || []).map((factor, idx) => (
                        <li key={idx} className="text-sm text-slate-700">• {factor}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Age Appropriateness */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Age Appropriateness</h4>
                    <Badge className="bg-blue-600 text-white mb-3 text-base px-3 py-1">
                      {analysis.safety_analysis.age_appropriateness.recommended_age}
                    </Badge>
                    <p className="text-base text-blue-900 mb-3">{analysis.safety_analysis.age_appropriateness.rationale}</p>
                    <div className="bg-white/80 rounded p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2">Developmental Considerations:</p>
                      <ul className="space-y-1">
                        {(analysis.safety_analysis.age_appropriateness.developmental_considerations || []).map((consideration, idx) => (
                          <li key={idx} className="text-sm text-blue-800">• {consideration}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Content Warnings with Evidence */}
                  {analysis.safety_analysis.content_warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-700 mb-3">Content Warnings (Evidence-Based)</h4>
                      <div className="space-y-4">
                        {(analysis.safety_analysis.content_warnings || []).map((item, idx) => (
                          <div key={idx} className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <Badge variant="destructive" className="font-semibold">{item.warning}</Badge>
                              <Badge variant="outline" className="text-xs">{item.page}</Badge>
                            </div>
                            <p className="text-sm text-red-800 mb-3"><strong>Context:</strong> {item.context}</p>
                            <div className="bg-white/90 border-l-4 border-red-600 p-4 rounded">
                              <p className="text-xs text-red-700 font-semibold mb-1">Textual Evidence:</p>
                              <p className="text-sm text-red-900 italic leading-loose whitespace-pre-line">"{item.evidence}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parental Guidance Areas */}
                  <div>
                    <h4 className="font-semibold text-amber-700 mb-3">Parental Guidance Areas</h4>
                    <div className="space-y-4">
                      {(analysis.safety_analysis.parental_guidance_areas || []).map((item, idx) => (
                        <div key={idx} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <p className="font-semibold text-amber-900">{item.area}</p>
                          </div>
                          <p className="text-sm text-amber-800 mb-3">{item.reason}</p>
                          <div className="bg-white/80 rounded p-3">
                            <p className="text-xs font-semibold text-amber-800 mb-2">Discussion Points:</p>
                            <ul className="space-y-1">
                              {item.discussion_points.map((point, pIdx) => (
                                <li key={pIdx} className="text-sm text-amber-800">• {point}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Positive Messages with Evidence */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-3">Positive Messages & Values</h4>
                    <div className="space-y-3">
                      {(analysis.safety_analysis.positive_messages || []).map((item, idx) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <Badge className="bg-green-600 text-white mb-3">{item.message}</Badge>
                          <div className="bg-white/80 border-l-4 border-green-500 p-3 rounded">
                            <p className="text-sm text-green-900 italic leading-relaxed">"{item.evidence}"</p>
                          </div>
                        </div>
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
                    AI Recommendations & Implementation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Best For</h4>
                    <p className="text-base">{analysis.recommendations.best_for}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-3">Teaching Strategies</h4>
                    <div className="space-y-3">
                      {(analysis.recommendations.teaching_strategies || []).map((item, idx) => (
                        <div key={idx} className="bg-white/80 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-start gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                            <p className="font-semibold text-purple-800">{item.strategy}</p>
                          </div>
                          <p className="text-sm text-purple-700 ml-7">{item.implementation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Usage Contexts</h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.recommendations.usage_contexts || []).map((context, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-700">{context}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Complementary Books</h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.recommendations.complementary_books || []).map((book, idx) => (
                        <Badge key={idx} className="bg-pink-100 text-pink-700">{book}</Badge>
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
                      <h3 className="font-semibold text-lg">Evidence-Based Analysis Complete</h3>
                      <p className="text-sm text-muted-foreground">Download the detailed report, add to library, or analyze another book</p>
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
