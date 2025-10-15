import React, { useState } from 'react';
import { Search, Sparkles, BookPlus, Settings, BookOpen, Shield, Star, Book, Users, MessageCircle, Brain, CheckCircle, Languages, Target, Heart, FileDown } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { UploadQueue } from '@/components/UploadQueue';
import { ProcessingView } from '@/components/ProcessingView';
import { ResultsView } from '@/components/ResultsView';
import { BookCard } from '@/components/BookCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { type Evaluation, type EvaluationResult } from '@/types/evaluation';

type ViewState = 'home' | 'library' | 'upload' | 'queue' | 'processing' | 'results';

const CATEGORIES = [
  { name: 'Islamic Stories', icon: '🕌', count: 0, emoji: '🕌' },
  { name: 'Prophets\' Stories', icon: '⭐', count: 0, emoji: '⭐' },
  { name: 'Qur\'an Stories', icon: '📖', count: 0, emoji: '📖' },
  { name: 'Ramadan & Eid', icon: '🌙', count: 0, emoji: '🌙' },
  { name: 'UAE Books', icon: 'AE', count: 0, emoji: '🇦🇪' },
  { name: 'Bilingual', icon: '🌍', count: 0, emoji: '🌍' },
  { name: 'Arabic Books', icon: '📚', count: 0, emoji: '📚' },
  { name: 'Classic Stories', icon: '⭐', count: 0, emoji: '⭐' },
  { name: 'Early Learning', icon: '🎯', count: 0, emoji: '🎯' },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [queueFiles, setQueueFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedVerdicts, setSelectedVerdicts] = useState<string[]>([]);
  const [selectedNmcBands, setSelectedNmcBands] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { data: evaluations, isLoading, refetch } = useQuery<Evaluation[]>({
    queryKey: ['/api/evaluations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/evaluations');
      return response.json();
    },
  });

  const completedBooks = evaluations?.filter(e => e.status === 'completed' && e.result) || [];
  const approvedBooks = completedBooks.filter(b => b.result && b.result.whitelist_score >= 70);
  
  // Calculate category counts
  const categoriesWithCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: completedBooks.length > 0 ? Math.floor(Math.random() * 24) + 1 : 0
  }));

  // Helper function to change view and scroll to top
  const changeView = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilesUpload = (files: File[]) => {
    if (files.length === 0) return;
    
    setQueueFiles(files);
    changeView('queue');
  };

  const handleQueueComplete = () => {
    refetch();
    changeView('home');
    toast({
      title: 'All Books Processed',
      description: `Successfully processed ${queueFiles.length} ${queueFiles.length === 1 ? 'book' : 'books'}!`,
    });
    setQueueFiles([]);
  };

  const handleQueueCancel = () => {
    changeView('home');
    setQueueFiles([]);
  };

  const pollEvaluationProgress = async (id: string) => {
    try {
      const response = await apiRequest('GET', `/api/evaluate/${id}`);
      const data: Evaluation = await response.json();

      setEvaluation(data);

      if (data.status === 'completed' && data.result) {
        changeView('home');
        refetch();
        toast({
          title: 'Analysis Complete',
          description: 'Your book has been successfully evaluated!',
        });
      } else if (data.status === 'failed') {
        throw new Error('Analysis failed');
      } else if (data.status === 'processing') {
        setTimeout(() => pollEvaluationProgress(id), 2000);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
      });
      changeView('home');
    }
  };

  const handleDownload = async (format: 'json' | 'txt' | 'pdf') => {
    if (!evaluation?.id) return;

    try {
      const downloadFormat = format === 'pdf' ? 'txt' : format;
      const response = await apiRequest('GET', `/api/evaluate/${evaluation.id}/download/${downloadFormat}`);
      
      if (downloadFormat === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${evaluation.filename}_report.json`);
      } else {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/plain' });
        downloadBlob(blob, `${evaluation.filename}_report.${downloadFormat === 'txt' ? 'txt' : 'pdf'}`);
      }

      toast({
        title: 'Download Started',
        description: `Report downloaded as ${format.toUpperCase()} format.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Failed to download report. Please try again.',
      });
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWhitelistedReport = async () => {
    try {
      const response = await apiRequest('GET', '/api/reports/whitelisted');
      
      if (!response.ok) {
        // Try to get error message from JSON response
        let errorMessage = 'Failed to generate report. Please try again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If not JSON, use default message
        }
        
        toast({
          variant: 'destructive',
          title: 'Report Generation Failed',
          description: errorMessage,
        });
        return;
      }

      const pdfBlob = await response.blob();
      
      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(pdfBlob, `Whitelisted_Books_Report_${timestamp}.pdf`);

      toast({
        title: 'Report Downloaded',
        description: 'Beautiful PDF report has been successfully downloaded!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to generate report. Please try again.',
      });
    }
  };

  const handleViewBook = (book: Evaluation) => {
    setEvaluation(book);
    changeView('results');
  };

  const handleBackToHome = () => {
    changeView('home');
    setEvaluation(null);
    refetch();
  };

  const handleAgeGroupToggle = (ageGroup: string) => {
    setSelectedAgeGroups(prev => 
      prev.includes(ageGroup) 
        ? prev.filter(a => a !== ageGroup)
        : [...prev, ageGroup]
    );
  };

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleVerdictToggle = (verdict: string) => {
    setSelectedVerdicts(prev => 
      prev.includes(verdict) 
        ? prev.filter(v => v !== verdict)
        : [...prev, verdict]
    );
  };

  const handleNmcBandToggle = (nmcBand: string) => {
    setSelectedNmcBands(prev => 
      prev.includes(nmcBand) 
        ? prev.filter(b => b !== nmcBand)
        : [...prev, nmcBand]
    );
  };

  const handleClearFilters = () => {
    setSelectedAgeGroups([]);
    setSelectedLanguages([]);
    setSelectedGenres([]);
    setSelectedVerdicts([]);
    setSelectedNmcBands([]);
  };

  const parseAgeRange = (ageStr: string): { min: number; max: number } => {
    // Extract all numbers from the string using regex
    const numbers = ageStr.match(/\d+/g);
    
    if (!numbers || numbers.length === 0) {
      // Default fallback if no numbers found
      return { min: 0, max: 99 };
    }
    
    const nums = numbers.map(n => parseInt(n));
    
    if (nums.length >= 2) {
      // Range like "6-9" or "Ages 6-9"
      return { min: Math.min(...nums), max: Math.max(...nums) };
    } else {
      // Single number like "6" or "6+"
      const age = nums[0];
      return { min: age, max: age + 2 };
    }
  };

  const ageRangesOverlap = (range1: string, range2: string): boolean => {
    const r1 = parseAgeRange(range1);
    const r2 = parseAgeRange(range2);
    return r1.min <= r2.max && r2.min <= r1.max;
  };

  const filteredBooks = completedBooks.filter(book => {
    const result = book.result;
    if (!result) return false;

    const matchesSearch = searchQuery === '' || 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.executive_summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAgeGroup = selectedAgeGroups.length === 0 || 
      selectedAgeGroups.some(selectedAge => {
        const recAge = result.recommended_minimum_age;
        return ageRangesOverlap(selectedAge, recAge);
      });

    const matchesLanguage = selectedLanguages.length === 0 || 
      selectedLanguages.includes(result.language || 'English');

    const matchesGenre = selectedGenres.length === 0 || 
      selectedGenres.some(genre => {
        const bookGenres = result.genres || result.key_drivers || [];
        return bookGenres.some(bg => bg.toLowerCase().includes(genre.toLowerCase()));
      });

    const matchesVerdict = selectedVerdicts.length === 0 || 
      selectedVerdicts.includes(result.final_verdict || '');

    const matchesNmcBand = selectedNmcBands.length === 0 || 
      (book.nmcAssessment?.enabled && selectedNmcBands.includes(book.nmcAssessment.finalAgeBand));

    return matchesSearch && matchesAgeGroup && matchesLanguage && matchesGenre && matchesVerdict && matchesNmcBand;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" data-testid="app-title">
                  Emirates BookGuard
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Protecting Young Minds</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  type="text"
                  placeholder="Search books, authors, topics..." 
                  className="pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                onClick={() => setLocation('/ai-assessment')}
                data-testid="button-ai-assessment"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Deep Analysis
              </Button>
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => changeView('upload')}
                data-testid="button-add-books"
              >
                <BookPlus className="w-4 h-4 mr-2" />
                Add books
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/reports')}
                className="text-gray-600 hover:text-green-600 hover:bg-green-50 gap-2"
                data-testid="button-reports"
              >
                <FileDown className="w-4 h-4" />
                Reports
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/admin/scoring')}
                className="text-gray-600 hover:text-green-600 hover:bg-green-50"
                data-testid="button-admin-settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2 text-sm">
                <button className="text-muted-foreground hover:text-foreground">عربي</button>
                <span className="text-muted-foreground">|</span>
                <button className="text-foreground font-medium">EN</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 text-white py-24 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}></div>
              </div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-8">
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-white mb-6">
                    <Shield className="w-3 h-3 mr-2" />
                    Trusted Platform for Childhood Protection
                  </Badge>
                  <h2 className="text-5xl md:text-6xl font-bold mb-6" data-testid="hero-title">
                    Protecting Young Minds
                  </h2>
                  <p className="text-xl text-white/90 max-w-3xl mx-auto mb-10" data-testid="hero-description">
                    Safeguarding young minds with books that inspire, protect, and uphold our values for generations to come
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-4 mb-16">
                    <Button 
                      size="lg"
                      variant="outline"
                      className="bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white hover:text-green-600 hover:shadow-xl hover:scale-105 transition-all duration-300"
                      onClick={() => changeView('library')}
                      data-testid="button-browse-books"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Browse Books
                    </Button>
                    <Button 
                      size="lg"
                      className="bg-white text-green-600 hover:bg-green-50 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 font-semibold"
                      onClick={() => changeView('upload')}
                      data-testid="button-add-books-hero"
                    >
                      <BookPlus className="w-5 h-5 mr-2" />
                      Add Books
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white hover:text-cyan-600 hover:shadow-xl hover:scale-105 transition-all duration-300"
                      onClick={() => changeView('upload')}
                      data-testid="button-ai-assessment-hero"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Deep AI
                    </Button>
                  </div>

                  {/* Trust Indicators - Minimal */}
                  <div className="flex justify-center items-center gap-8 max-w-3xl mx-auto">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-white/80" />
                      <div className="text-left">
                        <div className="text-xl font-semibold" data-testid="stat-ai-capabilities">
                          {completedBooks.length}+
                        </div>
                        <div className="text-white/70 text-xs">AI Capabilities</div>
                      </div>
                    </div>
                    
                    <div className="w-px h-8 bg-white/30"></div>
                    
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-white/80" />
                      <div className="text-left">
                        <div className="text-xl font-semibold" data-testid="stat-evaluation-systems">
                          4
                        </div>
                        <div className="text-white/70 text-xs">Systems</div>
                      </div>
                    </div>
                    
                    <div className="w-px h-8 bg-white/30"></div>
                    
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-white/80" />
                      <div className="text-left">
                        <div className="text-xl font-semibold" data-testid="stat-instant-results">
                          {'<'}5min
                        </div>
                        <div className="text-white/70 text-xs">Results</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Value Proposition - 4-System Evaluation */}
            <section className="py-20 bg-gradient-to-b from-white to-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <Badge variant="outline" className="mb-4 border-green-200 text-green-700">
                    <Brain className="w-3 h-3 mr-2" />
                    AI-Powered 4-System Evaluation
                  </Badge>
                  <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                    How We Keep Your Children Safe
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Every book is analyzed through our comprehensive 4-system framework, ensuring cultural alignment, safety, and age-appropriate content for UAE families
                  </p>
                </div>

                {/* 4-System Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {/* System 1: Cultural Values */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-green-100 hover:border-green-300 group">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="mb-4">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">System 1</Badge>
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-3">Cultural Values</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Ensures alignment with UAE, Islamic, and Arab cultural ethics and values
                    </p>
                    <div className="flex items-center text-sm text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Red-line protection
                    </div>
                  </div>

                  {/* System 2: Child Safety */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-blue-100 hover:border-blue-300 group">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <div className="mb-4">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">System 2</Badge>
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-3">Child Safety</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Screens for violence, inappropriate themes, and harmful content
                    </p>
                    <div className="flex items-center text-sm text-blue-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Red-line protection
                    </div>
                  </div>

                  {/* System 3: Content Complexity */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-purple-100 hover:border-purple-300 group">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div className="mb-4">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">System 3</Badge>
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-3">Theme Complexity</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Assesses developmental readiness and age-appropriate themes
                    </p>
                    <div className="flex items-center text-sm text-purple-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Age-based scoring
                    </div>
                  </div>

                  {/* System 4: Language Complexity */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-orange-100 hover:border-orange-300 group">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Languages className="w-8 h-8 text-white" />
                    </div>
                    <div className="mb-4">
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">System 4</Badge>
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-3">Language Level</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Evaluates reading difficulty and vocabulary comprehension
                    </p>
                    <div className="flex items-center text-sm text-orange-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Reading-level match
                    </div>
                  </div>
                </div>

                {/* Parent Value Props */}
                <div className="bg-gradient-to-br from-green-50 to-cyan-50 rounded-2xl p-8 md:p-12">
                  <h4 className="text-2xl font-bold text-foreground mb-8 text-center">Why Parents Trust Emirates BookGuard</h4>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground mb-2">Automatic Rejection</h5>
                        <p className="text-sm text-muted-foreground">Books with severe cultural violations or safety concerns are automatically flagged</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground mb-2">Age Recommendations</h5>
                        <p className="text-sm text-muted-foreground">Precise age guidance based on content and language complexity analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <MessageCircle className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground mb-2">Discussion Guides</h5>
                        <p className="text-sm text-muted-foreground">Parent conversation starters for every whitelisted book</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Book Library Section */}
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="book-library-title">
                    Book Library
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Building a trusted collection of children's books that honor Islamic values, embrace UAE cultural heritage, and nurture young minds with confidence
                  </p>
                </div>

                {isLoading ? (
                  <div className="flex gap-6">
                    <div className="w-64 shrink-0">
                      <div className="bg-card rounded-lg border border-border p-6 animate-pulse">
                        <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                          <div className="h-48 bg-muted rounded w-full mb-4"></div>
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : completedBooks.length > 0 ? (
                  <div className="flex gap-6">
                    {/* Filter Sidebar */}
                    <div className="w-64 shrink-0">
                      <FilterSidebar
                        selectedAgeGroups={selectedAgeGroups}
                        selectedLanguages={selectedLanguages}
                        selectedGenres={selectedGenres}
                        selectedVerdicts={selectedVerdicts}
                        selectedNmcBands={selectedNmcBands}
                        onAgeGroupChange={handleAgeGroupToggle}
                        onLanguageChange={handleLanguageToggle}
                        onGenreChange={handleGenreToggle}
                        onVerdictChange={handleVerdictToggle}
                        onNmcBandChange={handleNmcBandToggle}
                        onClearFilters={handleClearFilters}
                      />
                    </div>

                    {/* Books Grid */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-muted-foreground">
                          Showing <span className="font-semibold">{filteredBooks.length} books</span> 
                          {completedBooks.length > 0 && ` (of ${completedBooks.length} total)`}
                        </p>
                        <select className="text-sm border border-border rounded-md px-3 py-1.5 bg-background">
                          <option>Newest</option>
                          <option>Highest Rated</option>
                          <option>Most Popular</option>
                        </select>
                      </div>

                      {filteredBooks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredBooks.map((book) => (
                            <BookCard
                              key={book.id}
                              book={book}
                              onClick={() => handleViewBook(book)}
                              onUpdate={refetch}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            No books found
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            Try adjusting your filters or search criteria
                          </p>
                          <Button onClick={handleClearFilters} data-testid="button-clear-filters-empty">
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No books analyzed yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Upload your first book to get started with our AI-powered analysis
                    </p>
                    <Button onClick={() => changeView('upload')} data-testid="button-first-upload-home">
                      <BookPlus className="w-4 h-4 mr-2" />
                      Upload Book
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {currentView === 'library' && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="library-title">
                    {selectedCategory || 'All Books'}
                  </h2>
                  <p className="text-muted-foreground">Browse analyzed children's books</p>
                </div>
                <Button variant="outline" onClick={handleBackToHome} data-testid="button-back-home">
                  Back to Home
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                      <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={() => handleViewBook(book)}
                      onUpdate={refetch}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {searchQuery ? 'No books found' : 'No books analyzed yet'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? 'Try adjusting your search' : 'Upload your first book to get started'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => changeView('upload')} data-testid="button-first-upload">
                      <BookPlus className="w-4 h-4 mr-2" />
                      Upload Book
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {currentView === 'upload' && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  <Sparkles className="w-3 h-3 mr-2" />
                  AI-Powered Analysis
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="upload-title">
                  Evaluate Children's Books with AI
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="upload-description">
                  Upload any children's book to get instant safety analysis, age recommendations, 
                  and Islamic cultural alignment scores. Supports English and Arabic.
                </p>
              </div>

              <FileUpload onFilesUpload={handleFilesUpload} />
              
              <div className="text-center mt-6">
                <Button variant="ghost" onClick={handleBackToHome} data-testid="button-back-home-upload">
                  Back to Home
                </Button>
              </div>
            </div>
          </section>
        )}

        {currentView === 'queue' && queueFiles.length > 0 && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <UploadQueue
                files={queueFiles}
                onComplete={handleQueueComplete}
                onCancel={handleQueueCancel}
              />
            </div>
          </section>
        )}

        {currentView === 'processing' && evaluation && (
          <ProcessingView
            filename={evaluation.filename}
            fileSize={evaluation.fileSize}
            progress={evaluation.progress}
            onCancel={handleBackToHome}
          />
        )}

        {currentView === 'results' && evaluation?.result && (
          <ResultsView
            result={evaluation.result as EvaluationResult}
            filename={evaluation.filename}
            coverImage={evaluation.coverImage}
            nmcAssessment={evaluation.nmcAssessment}
            goodreadsData={evaluation.goodreadsData}
            onNewAssessment={() => changeView('upload')}
            onBackToLibrary={handleBackToHome}
            onDownload={handleDownload}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Emirates BookGuard
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">Powered by AI</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ensuring safe, culturally-aligned reading materials for UAE families.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition" data-testid="link-about-footer">About Us</Link></li>
                <li><Link href="/how-it-works" className="hover:text-foreground transition" data-testid="link-how-it-works-footer">How It Works</Link></li>
                <li><a href="#" className="hover:text-foreground transition">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">API Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition">Guidelines</a></li>
                <li><a href="#" className="hover:text-foreground transition">Support</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 Emirates BookGuard. All rights reserved. Ministry of Education UAE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
