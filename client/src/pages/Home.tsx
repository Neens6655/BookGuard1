import React, { useState, useEffect } from 'react';
import { BookAudio, Shield, Plus } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ProcessingView } from '@/components/ProcessingView';
import { ResultsView } from '@/components/ResultsView';
import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { type Evaluation, type EvaluationResult } from '@/types/evaluation';

type ViewState = 'library' | 'upload' | 'processing' | 'results';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>('library');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const { toast } = useToast();
  
  const { data: evaluations, isLoading, refetch } = useQuery<Evaluation[]>({
    queryKey: ['/api/evaluations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/evaluations');
      return response.json();
    },
  });

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('POST', '/api/evaluate', formData);
      const data = await response.json();

      setEvaluation({
        id: data.id,
        filename: file.name,
        fileSize: file.size,
        status: 'processing',
        progress: 0,
        result: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setCurrentView('processing');
      
      // Poll for updates
      pollEvaluationProgress(data.id);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file. Please try again.',
      });
    }
  };

  const pollEvaluationProgress = async (id: string) => {
    try {
      const response = await apiRequest('GET', `/api/evaluate/${id}`);
      const data: Evaluation = await response.json();

      setEvaluation(data);

      if (data.status === 'completed' && data.result) {
        setCurrentView('library');
        refetch();
        toast({
          title: 'Analysis Complete',
          description: 'Your book has been successfully evaluated!',
        });
      } else if (data.status === 'failed') {
        throw new Error('Analysis failed');
      } else if (data.status === 'processing') {
        // Continue polling
        setTimeout(() => pollEvaluationProgress(id), 2000);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
      });
      setCurrentView('upload');
    }
  };

  const handleDownload = async (format: 'json' | 'txt' | 'pdf') => {
    if (!evaluation?.id) return;

    try {
      // For PDF, we'll download as TXT for now since PDF generation isn't implemented
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

  const handleNewAssessment = () => {
    setCurrentView('upload');
    setEvaluation(null);
  };

  const handleViewBook = (book: Evaluation) => {
    setEvaluation(book);
    setCurrentView('results');
  };

  const handleBackToLibrary = () => {
    setCurrentView('library');
    setEvaluation(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookAudio className="text-primary-foreground w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="app-title">SafeRead AI</h1>
                <p className="text-xs text-muted-foreground">Islamic Book Assessment</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" size="sm" data-testid="nav-dashboard">Dashboard</Button>
              <Button variant="ghost" size="sm" data-testid="nav-library">Library</Button>
              <Button variant="ghost" size="sm" data-testid="nav-reports">Reports</Button>
              <Button size="sm" data-testid="nav-account">
                <Shield className="w-4 h-4 mr-2" />
                Account
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {currentView === 'library' && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="library-title">Book Library</h2>
                  <p className="text-muted-foreground">View all analyzed children's books</p>
                </div>
                <Button onClick={() => setCurrentView('upload')} data-testid="button-new-assessment">
                  <Plus className="w-4 h-4 mr-2" />
                  New Assessment
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
              ) : evaluations && evaluations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {evaluations
                    .filter(e => e.status === 'completed' && e.result)
                    .map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onClick={() => handleViewBook(book)}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookAudio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No books analyzed yet</h3>
                  <p className="text-muted-foreground mb-6">Upload your first book to get started</p>
                  <Button onClick={() => setCurrentView('upload')} data-testid="button-first-upload">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Book
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {currentView === 'upload' && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
                  <Shield className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium text-primary">Powered by GPT-4 AI</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="hero-title">
                  Evaluate Children's Books with AI
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="hero-description">
                  Upload any children's book to get instant safety analysis, age recommendations, 
                  and Islamic cultural alignment scores. Supports English and Arabic.
                </p>
              </div>

              <FileUpload onFileUpload={handleFileUpload} />
              
              <div className="text-center mt-6">
                <Button variant="ghost" onClick={handleBackToLibrary} data-testid="button-back-library">
                  Back to Library
                </Button>
              </div>
            </div>
          </section>
        )}

        {currentView === 'processing' && evaluation && (
          <ProcessingView
            filename={evaluation.filename}
            fileSize={evaluation.fileSize}
            progress={evaluation.progress}
            onCancel={() => setCurrentView('upload')}
          />
        )}

        {currentView === 'results' && evaluation?.result && (
          <ResultsView
            result={evaluation.result as EvaluationResult}
            filename={evaluation.filename}
            onNewAssessment={handleNewAssessment}
            onBackToLibrary={handleBackToLibrary}
            onDownload={handleDownload}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <BookAudio className="text-primary-foreground w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">SafeRead AI</h3>
                  <p className="text-xs text-muted-foreground">Powered by GPT-4</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ensuring safe, culturally-aligned reading materials for UAE families.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition">How It Works</a></li>
                <li><a href="#" className="hover:text-foreground transition">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">API Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition">Guidelines</a></li>
                <li><a href="#" className="hover:text-foreground transition">Support</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
              </ul>
            </div>

            {/* Legal */}
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
              © 2024 SafeRead AI. All rights reserved. Ministry of Education UAE
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
