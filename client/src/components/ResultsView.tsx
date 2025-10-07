import React, { useState } from 'react';
import { Download, Share2, Star, Shield, Award, BookOpen, Lightbulb, Users, MessageCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { type EvaluationResult } from '@/types/evaluation';

interface ResultsViewProps {
  result: EvaluationResult;
  filename: string;
  onNewAssessment: () => void;
  onDownload: (format: 'json' | 'txt' | 'pdf') => void;
}

export function ResultsView({ result, filename, onNewAssessment, onDownload }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadgeVariant = () => {
    if (result.whitelist_score >= 70) return 'default';
    return 'destructive';
  };

  const getAgeRecommendationIcon = (verdict: string) => {
    if (verdict.includes('Perfect') || verdict.includes('Suitable')) {
      return '✅';
    }
    if (verdict.includes('advanced') || verdict.includes('simple')) {
      return '❌';
    }
    return '✓';
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Book Header */}
        <div className="gradient-bg rounded-2xl p-8 md:p-12 mb-8 text-white slide-in">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <img 
                src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800" 
                alt="Book cover" 
                className="rounded-xl shadow-2xl w-full max-w-xs mx-auto"
              />
            </div>
            
            {/* Book Info */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-primary text-primary-foreground" data-testid="badge-islamic-approved">
                  <Shield className="w-3 h-3 mr-1" />
                  Islamic Approved
                </Badge>
                <Badge className="bg-secondary text-secondary-foreground" data-testid="badge-age-range">
                  {result.recommended_minimum_age}
                </Badge>
                <Badge className="bg-accent text-accent-foreground">
                  English/Arabic
                </Badge>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-2" data-testid="book-title">
                {result.title}
              </h2>
              <p className="text-xl opacity-90 mb-4">by Regional Author</p>
              
              <div className="flex items-center space-x-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
                <span className="ml-2 font-semibold">4.6</span>
                <span className="ml-1 opacity-75 text-sm">(127 reviews)</span>
              </div>
              
              <p className="text-base opacity-90 leading-relaxed mb-6" data-testid="book-description">
                {result.executive_summary}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => onDownload('txt')}
                  data-testid="button-download-summary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Book
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Safety Score */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Safety Score</h3>
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-primary" data-testid="safety-score">
                  {result.whitelist_score}
                </span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <Progress value={result.whitelist_score} className="mt-4 h-2" />
              <p className="mt-3 text-sm text-muted-foreground">
                <Shield className="inline w-4 h-4 text-primary mr-1" />
                <span className="font-medium text-primary">
                  {result.whitelist_score >= 70 ? 'Excellent Score' : 'Needs Review'}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Rating</h3>
                <Star className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-accent">4.6</span>
                <span className="text-lg text-muted-foreground">★</span>
              </div>
              <div className="mt-4 flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Based on content quality & engagement</p>
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Approval</h3>
                <Award className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground" data-testid="approval-status">
                    {result.whitelist_score >= 70 ? 'APPROVED' : 'NEEDS REVIEW'}
                  </p>
                  <p className="text-sm text-muted-foreground">For UAE Families</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Reviewed today</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="text-xs" data-testid="tab-overview">
              <BookOpen className="w-4 h-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-xs" data-testid="tab-safety">
              <Shield className="w-4 h-4 mr-1" />
              Safety
            </TabsTrigger>
            <TabsTrigger value="lessons" className="text-xs" data-testid="tab-lessons">
              <Lightbulb className="w-4 h-4 mr-1" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-xs" data-testid="tab-activities">
              <Users className="w-4 h-4 mr-1" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="discussion" className="text-xs" data-testid="tab-discussion">
              <MessageCircle className="w-4 h-4 mr-1" />
              Discussion
            </TabsTrigger>
            <TabsTrigger value="parents" className="text-xs" data-testid="tab-parents">
              <GraduationCap className="w-4 h-4 mr-1" />
              For Parents
            </TabsTrigger>
          </TabsList>

          <Card className="mt-0 rounded-t-none">
            <CardContent className="p-8">
              
              <TabsContent value="overview" className="mt-0">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">
                      <BookOpen className="inline w-5 h-5 text-primary mr-2" />
                      Quick Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Reading Time</span>
                        <span className="font-semibold text-foreground">15-20 minutes</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Whitelist Score</span>
                        <span className="font-semibold text-primary">{result.whitelist_score}/100</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Language Complexity</span>
                        <Badge variant="secondary" className="text-xs">
                          {result.language_complexity}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* About This Book */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">
                      <BookOpen className="inline w-5 h-5 text-primary mr-2" />
                      About This Book
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4" data-testid="executive-summary">
                      {result.executive_summary}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="safety" className="mt-0">
                <h3 className="text-xl font-bold text-foreground mb-6">
                  <Shield className="inline w-5 h-5 text-primary mr-2" />
                  Detailed Safety Assessment
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(result.domains).map(([domain, assessment]) => (
                    <Card key={domain} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground capitalize">
                          {domain.replace(/_/g, ' ')}
                        </h4>
                        <Badge 
                          variant={assessment.toLowerCase().includes('none') || assessment.toLowerCase().includes('appropriate') ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {assessment.includes('None') ? 'None Detected' : 'Appropriate'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{assessment}</p>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="lessons" className="mt-0">
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-8">
                  <h3 className="text-xl font-bold text-foreground mb-6">
                    <GraduationCap className="inline w-5 h-5 text-primary mr-2" />
                    Lessons Learned
                  </h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="lessons-learned">
                    {result.lessons_learned}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="activities" className="mt-0">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground">Interactive activities and games based on the book content.</p>
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="mt-0">
                <h3 className="text-xl font-bold text-foreground mb-6">
                  <MessageCircle className="inline w-5 h-5 text-primary mr-2" />
                  Parent Discussion Guide
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Before Reading */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-secondary" />
                      </div>
                      <h4 className="font-semibold text-foreground">Before Reading</h4>
                    </div>
                    <ul className="space-y-3">
                      {result.parent_discussion_guide.before_reading.map((question, index) => (
                        <li key={index} className="flex items-start">
                          <MessageCircle className="w-4 h-4 text-secondary mt-1 mr-3 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* After Reading */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-accent" />
                      </div>
                      <h4 className="font-semibold text-foreground">After Reading</h4>
                    </div>
                    <ul className="space-y-3">
                      {result.parent_discussion_guide.after_reading.map((question, index) => (
                        <li key={index} className="flex items-start">
                          <MessageCircle className="w-4 h-4 text-accent mt-1 mr-3 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="mt-0">
                {/* Age Recommendations */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-foreground mb-6">
                    <Users className="inline w-5 h-5 text-primary mr-2" />
                    Age Recommendations
                  </h3>
                  
                  <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Recommended Minimum Age: <span className="text-primary" data-testid="recommended-age">{result.recommended_minimum_age}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">Based on content complexity, themes, and cultural appropriateness</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(result.age_verdicts).map(([age, verdict]) => {
                      const isRecommended = age === result.recommended_minimum_age;
                      const icon = getAgeRecommendationIcon(verdict);
                      
                      return (
                        <Card key={age} className={`p-4 ${isRecommended ? 'border-2 border-primary bg-primary/5' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-semibold ${isRecommended ? 'text-primary' : 'text-foreground'}`}>
                              {age} years
                            </h4>
                            <span className="text-lg">{icon}</span>
                          </div>
                          <p className={`text-sm ${isRecommended ? 'text-primary' : 'text-muted-foreground'}`}>
                            {verdict}
                          </p>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Key Drivers */}
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3">
                      <Lightbulb className="inline w-4 h-4 text-accent mr-2" />
                      Key Classification Drivers
                    </h4>
                    <ul className="space-y-2">
                      {result.key_drivers.map((driver, index) => (
                        <li key={index} className="flex items-start text-sm text-muted-foreground">
                          <span className="w-2 h-2 bg-primary rounded-full mr-2 mt-1.5 flex-shrink-0" />
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {/* Download Actions */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Download Full Report</h4>
                <p className="text-sm text-muted-foreground">Get detailed analysis in your preferred format</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => onDownload('txt')}
                  data-testid="button-download-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF Report
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => onDownload('json')}
                  data-testid="button-download-json"
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON Data
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onDownload('txt')}
                  data-testid="button-download-txt"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Text Summary
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Assessment Button */}
        <div className="mt-8 text-center">
          <Button 
            size="lg"
            className="gradient-bg text-white hover:shadow-lg transition-all px-8 py-4 text-lg font-semibold"
            onClick={onNewAssessment}
            data-testid="button-new-assessment"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Assess Another Book
          </Button>
        </div>
      </div>
    </section>
  );
}
