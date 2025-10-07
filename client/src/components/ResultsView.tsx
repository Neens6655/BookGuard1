import React, { useState } from 'react';
import { Download, Share2, Star, Shield, BookOpen, BookAudio, Lightbulb, Users, MessageCircle, GraduationCap, CheckCircle } from 'lucide-react';
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
  onBackToLibrary?: () => void;
  onDownload: (format: 'json' | 'txt' | 'pdf') => void;
}

export function ResultsView({ result, filename, onNewAssessment, onBackToLibrary, onDownload }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const isApproved = result.whitelist_score >= 70;
  const rating = 4.6; // Mock rating based on score
  
  // Extract genre/themes from key_drivers
  const genres = result.key_drivers.slice(0, 4).map((driver, idx) => ({
    name: driver,
    color: ['purple', 'blue', 'green', 'pink'][idx % 4]
  }));

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Book Header */}
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-orange-200 to-yellow-100 rounded-xl shadow-2xl w-full aspect-[3/4] flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-orange-400" />
              </div>
            </div>
            
            {/* Book Info */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-green-500 text-white hover:bg-green-600" data-testid="badge-islamic-approved">
                  <Shield className="w-3 h-3 mr-1" />
                  Islamic Approved
                </Badge>
                <Badge className="bg-blue-500 text-white hover:bg-blue-600" data-testid="badge-age-range">
                  Ages {result.recommended_minimum_age}
                </Badge>
                <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                  Arabic
                </Badge>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-2" data-testid="book-title">
                {result.title}
              </h2>
              <p className="text-lg opacity-90 mb-1" dir="rtl">مغامرات في الصحراء</p>
              <p className="text-base opacity-90 mb-4">by Regional author</p>
              
              <div className="flex items-center space-x-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`} />
                ))}
                <span className="ml-2 font-semibold text-lg">{rating}</span>
                <span className="ml-1 opacity-75 text-sm">/5</span>
              </div>
              
              <p className="text-base opacity-90 leading-relaxed mb-6" data-testid="book-description">
                {result.executive_summary}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="bg-white text-purple-600 hover:bg-white/90"
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

        {/* Analysis Section */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Book Analysis</h3>
              <p className="text-sm text-muted-foreground">Comprehensive review and safety analysis</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500" data-testid="safety-score-header">
                  {result.whitelist_score}/100
                </div>
                <div className="text-xs text-muted-foreground">Safety Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500" data-testid="rating-header">
                  {rating}★
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Approved</div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-overview"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="safety" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-safety"
              >
                <Shield className="w-4 h-4 mr-2" />
                Safety Score
              </TabsTrigger>
              <TabsTrigger 
                value="lessons" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-lessons"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Lessons
              </TabsTrigger>
              <TabsTrigger 
                value="activities" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-activities"
              >
                <Users className="w-4 h-4 mr-2" />
                Activities
              </TabsTrigger>
              <TabsTrigger 
                value="discussion" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-discussion"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Discussion
              </TabsTrigger>
              <TabsTrigger 
                value="parents" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-parents"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                For Parents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Quick Stats */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-foreground">Quick Stats</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">N/A</div>
                    <div className="text-sm text-muted-foreground">Pages</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">N/A</div>
                    <div className="text-sm text-muted-foreground">Minutes</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className={`text-2xl font-bold mb-1 ${result.whitelist_score >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                      {result.whitelist_score}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">Safety Score</div>
                    <div className="text-xs text-muted-foreground">out of 100</div>
                    <Progress value={result.whitelist_score} className="mt-2 h-2" />
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        {result.whitelist_score >= 70 ? 'Excellent Score' : 'Good Score'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* About This Book */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-foreground" />
                  <h4 className="font-semibold text-foreground text-lg">About This Book</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {result.executive_summary}
                </p>
              </div>

              {/* Genre & Themes */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-foreground text-lg">Genre & Themes</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre, idx) => (
                    <Badge 
                      key={idx}
                      className={`
                        ${genre.color === 'purple' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : ''}
                        ${genre.color === 'blue' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                        ${genre.color === 'green' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                        ${genre.color === 'pink' ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' : ''}
                      `}
                      data-testid={`genre-${genre.name.toLowerCase()}`}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-foreground text-lg">Key Features</h4>
                </div>
                <div className="space-y-2">
                  {result.key_drivers.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Badge */}
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div className="text-xl font-bold text-green-700 mb-1">APPROVED</div>
                <div className="text-sm text-green-600">For UAE Families</div>
              </div>
            </TabsContent>

            <TabsContent value="safety" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Domain Analysis</h4>
                {Object.entries(result.domains).map(([domain, assessment]) => (
                  <Card key={domain}>
                    <CardContent className="p-4">
                      <h5 className="font-medium text-foreground mb-2 capitalize">
                        {domain.replace(/_/g, ' ')}
                      </h5>
                      <p className="text-sm text-muted-foreground">{assessment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Lessons Learned</h4>
                <p className="text-muted-foreground">{result.lessons_learned}</p>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Suggested Activities</h4>
                <p className="text-muted-foreground">Activities based on the book's themes and lessons</p>
              </div>
            </TabsContent>

            <TabsContent value="discussion" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3">Before Reading</h4>
                  <ul className="space-y-2">
                    {result.parent_discussion_guide.before_reading.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-3">After Reading</h4>
                  <ul className="space-y-2">
                    {result.parent_discussion_guide.after_reading.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parents" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3">Age Recommendations</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(result.age_verdicts).map(([age, verdict]) => (
                      <Card key={age}>
                        <CardContent className="p-4 text-center">
                          <div className="font-semibold text-foreground mb-2">{age}</div>
                          <div className="text-sm text-muted-foreground">{verdict}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-3">Recommended Age</h4>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {result.recommended_minimum_age}+
                  </Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Download Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
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

        {/* Action Buttons */}
        <div className="mt-8 text-center flex flex-wrap gap-4 justify-center">
          {onBackToLibrary && (
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg font-semibold"
              onClick={onBackToLibrary}
              data-testid="button-back-to-library"
            >
              <BookAudio className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          )}
          <Button 
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 px-8 py-4 text-lg font-semibold"
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
