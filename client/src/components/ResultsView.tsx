import React, { useState } from 'react';
import { Download, Share2, Star, Shield, BookOpen, BookAudio, Lightbulb, Users, MessageCircle, GraduationCap, CheckCircle, AlertTriangle, XCircle, Info, Sparkles, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { type EvaluationResult, type NMCAssessment, type GoodreadsData } from '@/types/evaluation';

interface ResultsViewProps {
  result: EvaluationResult;
  filename: string;
  coverImage?: string | null;
  nmcAssessment?: NMCAssessment | null;
  goodreadsData?: GoodreadsData | null;
  onNewAssessment: () => void;
  onBackToLibrary?: () => void;
  onDownload: (format: 'json' | 'txt' | 'pdf') => void;
}

export function ResultsView({ result, filename, coverImage, nmcAssessment, goodreadsData, onNewAssessment, onBackToLibrary, onDownload }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Map score to risk level label
  const getRiskLevel = (score: number): { label: string; level: 'none' | 'low' | 'medium' | 'high' } => {
    if (score === 0) return { label: 'No Concern', level: 'none' };
    if (score <= 2) return { label: 'Low', level: 'low' };
    if (score === 3) return { label: 'Medium', level: 'medium' };
    return { label: 'High', level: 'high' };
  };

  // Count high-risk domains
  const highRiskCount = Object.entries(result.domain_scores || {}).filter(([_, score]) => {
    const risk = getRiskLevel(score);
    return risk.level === 'high';
  }).length;

  // Approval based on high-risk count: more than 2 highs = not approved
  const isApproved = highRiskCount <= 2;
  
  // Only use Goodreads rating if status is 'ok'
  const hasGoodreadsRating = goodreadsData?.status === 'ok' && goodreadsData.rating;
  const rating = hasGoodreadsRating ? goodreadsData.rating : undefined;
  
  // Extract genre/themes from key_drivers
  const genres = result.key_drivers.slice(0, 4).map((driver, idx) => ({
    name: driver,
    color: ['purple', 'blue', 'green', 'pink'][idx % 4]
  }));

  return (
    <section className="py-12 bg-gradient-to-br from-green-50 via-cyan-50 to-sky-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Book Header - Fresh Garden Theme */}
        <div className="relative bg-gradient-to-br from-green-500 to-cyan-400 rounded-3xl p-10 md:p-14 mb-8 overflow-hidden shadow-2xl">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          
          {/* Decorative gradient orbs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-300/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-300/30 rounded-full blur-3xl"></div>
          
          {/* Back Button */}
          {onBackToLibrary && (
            <button 
              onClick={onBackToLibrary}
              className="absolute top-8 left-8 z-20 group flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-lg"
              data-testid="button-back-to-home-header"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back</span>
            </button>
          )}
          
          <div className="relative grid md:grid-cols-3 gap-10 items-start">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 transform hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-orange-200 to-yellow-100 rounded-xl w-full aspect-[3/4] overflow-hidden relative">
                  {(coverImage || goodreadsData?.coverImageUrl) ? (
                    <img 
                      src={coverImage || goodreadsData?.coverImageUrl || ''} 
                      alt={result.title}
                      className="w-full h-full object-cover"
                      data-testid="img-book-cover-detail"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-24 h-24 text-orange-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Book Info */}
            <div className="md:col-span-2 text-white">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full backdrop-blur-md border shadow-lg ${
                  result.final_verdict === "Whitelisted" ? "bg-green-500/90 border-green-400/50" :
                  result.final_verdict === "Parent Guidance" ? "bg-yellow-500/90 border-yellow-400/50" :
                  "bg-red-500/90 border-red-400/50"
                }`} data-testid="badge-verdict-status">
                  <span className="text-lg">
                    {result.final_verdict === "Whitelisted" ? "✅" :
                     result.final_verdict === "Parent Guidance" ? "🟡" : "🚫"}
                  </span>
                  <span className="text-sm font-semibold">{result.final_verdict || "Whitelisted"}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-blue-200 shadow-lg" data-testid="badge-age-range">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">UAE {result.recommended_minimum_age}</span>
                </div>
                {nmcAssessment && nmcAssessment.enabled && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-purple-200 shadow-lg" data-testid="badge-nmc-age">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700">NMC {nmcAssessment.finalAgeBand}</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-300/40 backdrop-blur-md border border-white/30 shadow-lg">
                  <span className="text-sm font-semibold">Arabic</span>
                </div>
              </div>
              
              {/* Title with better spacing */}
              <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight leading-tight" data-testid="book-title">
                {result.title}
              </h2>
              <p className="text-lg opacity-90 mb-2">by {result.author || 'Regional author'}</p>
              {goodreadsData?.isbn && (
                <p className="text-sm opacity-75 mb-6">ISBN: {goodreadsData.isbn}</p>
              )}
              
              {/* Rating - Only show if Goodreads data is available */}
              {hasGoodreadsRating && rating && (
                <div className="flex items-center space-x-1 mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-6 h-6 ${i < Math.floor(rating) ? 'fill-yellow-300 text-yellow-300' : 'fill-white/30 text-white/30'}`} />
                  ))}
                  <span className="ml-3 font-bold text-xl">{rating.toFixed(1)}</span>
                  <span className="ml-1 opacity-80 text-base">/5</span>
                  {goodreadsData?.ratingsCount && (
                    <span className="ml-2 text-sm opacity-80">({goodreadsData.ratingsCount.toLocaleString()} ratings)</span>
                  )}
                </div>
              )}
              
              {/* Description */}
              <p className="text-lg opacity-95 leading-relaxed mb-8" data-testid="book-description">
                {result.executive_summary}
              </p>
              
              {/* Key Features - Card Style */}
              <div className="mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <h4 className="font-bold text-white text-lg">Key Features</h4>
                </div>
                <div className="space-y-2.5">
                  {result.key_drivers.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span className="text-white/95 text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  className="bg-white text-green-600 hover:bg-white/90 font-semibold shadow-lg px-6 py-6 text-base"
                  onClick={() => onDownload('txt')}
                  data-testid="button-download-summary"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Summary
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white/20 backdrop-blur-md text-white border-2 border-white/40 hover:bg-white/30 font-semibold shadow-lg px-6 py-6 text-base"
                  data-testid="button-share"
                >
                  <Share2 className="w-5 h-5 mr-2" />
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
              <p className="text-sm text-muted-foreground">
                {hasGoodreadsRating && goodreadsData.rating && (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{goodreadsData.rating.toFixed(1)}</span>
                    {goodreadsData.ratingsCount && (
                      <span className="text-xs">({goodreadsData.ratingsCount.toLocaleString()} Goodreads ratings)</span>
                    )}
                    <span className="mx-2">•</span>
                  </span>
                )}
                Comprehensive review and safety analysis
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600" data-testid="age-header">
                  {result.recommended_minimum_age}
                </div>
                <div className="text-xs text-muted-foreground">Age</div>
              </div>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  result.final_verdict === "Whitelisted" ? 'bg-green-100' :
                  result.final_verdict === "Parent Guidance" ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <span className="text-2xl">
                    {result.final_verdict === "Whitelisted" ? "✅" :
                     result.final_verdict === "Parent Guidance" ? "🟡" :
                     result.final_verdict === "Not Whitelisted" ? "🚫" :
                     isApproved ? "✅" : "🚫"}
                  </span>
                </div>
                <div className={`text-xs mt-1 font-medium ${
                  result.final_verdict === "Whitelisted" ? 'text-green-600' :
                  result.final_verdict === "Parent Guidance" ? 'text-yellow-600' :
                  result.final_verdict === "Not Whitelisted" ? 'text-red-600' :
                  isApproved ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.final_verdict || (isApproved ? 'Whitelisted' : 'Not Whitelisted')}
                </div>
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
              {nmcAssessment && nmcAssessment.enabled && (
                <TabsTrigger 
                  value="nmc" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  data-testid="tab-nmc"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  NMC Standards
                </TabsTrigger>
              )}
              {goodreadsData?.reviews && goodreadsData.reviews.length > 0 && (
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  data-testid="tab-reviews"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Reviews ({goodreadsData.reviews.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Final Verdict - Most Prominent */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-4xl">
                      {result.final_verdict === "Whitelisted" ? "✅" :
                       result.final_verdict === "Parent Guidance" ? "🟡" : "🚫"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {result.final_verdict || "Evaluation Complete"}
                    </h3>
                    
                    {/* Executive Summary based on verdict */}
                    {result.final_verdict === "Not Whitelisted" ? (
                      <div className="space-y-2 mb-3">
                        <p className="text-sm font-semibold text-red-700">
                          {result.system1_uae_values?.rating === "Severe" 
                            ? "Severe UAE/Islamic cultural violations detected"
                            : result.system2_child_safety?.rating === "Severe"
                            ? "Severe child safety concerns identified"
                            : "Not suitable for children"}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.system1_uae_values?.rating === "Severe" && result.system1_uae_values.assessment
                            ? result.system1_uae_values.assessment
                            : result.system2_child_safety?.rating === "Severe" && result.system2_child_safety.assessment
                            ? result.system2_child_safety.assessment
                            : result.executive_summary || "This book contains content that violates UAE/Islamic values or child safety standards."}
                        </p>
                      </div>
                    ) : result.final_verdict === "Parent Guidance" ? (
                      <div className="space-y-2 mb-3">
                        <p className="text-sm font-semibold text-yellow-700">Requires parental discussion and guidance</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.system1_uae_values?.rating === "Moderate" && result.system1_uae_values.assessment
                            ? result.system1_uae_values.assessment
                            : result.system2_child_safety?.rating === "Moderate" && result.system2_child_safety.assessment
                            ? result.system2_child_safety.assessment
                            : result.executive_summary || "Parents should review content before sharing with children."}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {result.executive_summary || "Safe & culturally aligned for UAE families - Fully suitable"}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Ages {result.recommended_age || result.recommended_minimum_age}
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        {result.language || 'Multilingual'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-System Framework Overview */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                  <h4 className="font-bold text-foreground text-xl">Evaluation Framework</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This book has been evaluated using the UAE Ministry of Education's 4-system framework for comprehensive content assessment.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* UAE Values */}
                  <div className={`rounded-lg p-4 border-2 ${
                    result.system1_uae_values?.rating === "Safe" ? "bg-green-50 border-green-300" :
                    result.system1_uae_values?.rating === "Moderate" ? "bg-yellow-50 border-yellow-300" :
                    "bg-red-50 border-red-300"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-foreground">UAE Values</h5>
                      <Badge variant="outline" className={
                        result.system1_uae_values?.rating === "Safe" ? "text-green-700 border-green-700" :
                        result.system1_uae_values?.rating === "Moderate" ? "text-yellow-700 border-yellow-700" :
                        "text-red-700 border-red-700"
                      }>
                        {result.system1_uae_values?.rating || "N/A"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Islamic, Arab & UAE Cultural Ethics
                    </p>
                  </div>

                  {/* Child Safety */}
                  <div className={`rounded-lg p-4 border-2 ${
                    result.system2_child_safety?.rating === "Safe" ? "bg-green-50 border-green-300" :
                    result.system2_child_safety?.rating === "Moderate" ? "bg-yellow-50 border-yellow-300" :
                    "bg-red-50 border-red-300"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-foreground">Child Safety</h5>
                      <Badge variant="outline" className={
                        result.system2_child_safety?.rating === "Safe" ? "text-green-700 border-green-700" :
                        result.system2_child_safety?.rating === "Moderate" ? "text-yellow-700 border-yellow-700" :
                        "text-red-700 border-red-700"
                      }>
                        {result.system2_child_safety?.rating || "N/A"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Global child safety standards
                    </p>
                  </div>

                  {/* Content Complexity */}
                  <div className={`rounded-lg p-4 border-2 ${
                    result.system3_theme_complexity?.rating === "Simple" ? "bg-green-50 border-green-300" :
                    result.system3_theme_complexity?.rating === "Moderate" ? "bg-yellow-50 border-yellow-300" :
                    "bg-orange-50 border-orange-300"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-foreground">Content</h5>
                      <Badge variant="outline" className={
                        result.system3_theme_complexity?.rating === "Simple" ? "text-green-700 border-green-700" :
                        result.system3_theme_complexity?.rating === "Moderate" ? "text-yellow-700 border-yellow-700" :
                        "text-orange-700 border-orange-700"
                      }>
                        {result.system3_theme_complexity?.rating || "N/A"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Min Age: {result.system3_theme_complexity?.min_age || "N/A"}+
                    </p>
                  </div>

                  {/* Language Complexity */}
                  <div className={`rounded-lg p-4 border-2 ${
                    result.system4_language_complexity?.rating === "Easy" ? "bg-green-50 border-green-300" :
                    result.system4_language_complexity?.rating === "Moderate" ? "bg-yellow-50 border-yellow-300" :
                    "bg-orange-50 border-orange-300"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-foreground">Language</h5>
                      <Badge variant="outline" className={
                        result.system4_language_complexity?.rating === "Easy" ? "text-green-700 border-green-700" :
                        result.system4_language_complexity?.rating === "Moderate" ? "text-yellow-700 border-yellow-700" :
                        "text-orange-700 border-orange-700"
                      }>
                        {result.system4_language_complexity?.rating || "N/A"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Min Age: {result.system4_language_complexity?.min_age || "N/A"}+
                    </p>
                  </div>
                </div>

                {/* Age Rationale */}
                {result.age_rationale && (
                  <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                    <h6 className="font-medium text-foreground text-sm mb-2">Age Recommendation Rationale:</h6>
                    <p className="text-sm text-muted-foreground">{result.age_rationale}</p>
                  </div>
                )}
              </div>

              {/* Age Recommendations - Prominent Section */}
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  <h4 className="font-bold text-foreground text-xl">Age Recommendations</h4>
                </div>
                
                {/* Primary Recommendation */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-2xl">
                        {(result.recommended_minimum_age?.split('-')[0]?.replace(/\+/g, '') || result.recommended_minimum_age?.replace(/[^0-9]/g, '') || '6')}+
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600 mb-1">Recommended Minimum Age</p>
                      <p className="text-2xl font-bold text-foreground">{result.recommended_minimum_age}</p>
                      <p className="text-sm text-muted-foreground mt-1">Best suited for this age group and above</p>
                    </div>
                  </div>
                </div>

                {/* Age Verdicts Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(result.age_verdicts || {})
                    .sort(([ageA], [ageB]) => {
                      // Sort age bands chronologically: 0-3, 3-5, 6-9, 10-12, 13-16, 17+, 21+
                      const getAgeValue = (age: string) => {
                        if (age === '21+') return 21;
                        if (age === '17+') return 17;
                        const match = age.match(/^(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                      };
                      return getAgeValue(ageA) - getAgeValue(ageB);
                    })
                    .map(([age, verdict]) => {
                    // Robust normalization for age strings to handle various formats
                    const normalizeAge = (ageStr: string) => {
                      return ageStr
                        .toLowerCase()
                        .replace(/\s+to\s+/g, '-')        // "6 to 9" → "6-9"
                        .replace(/[–—]/g, '-')            // en-dash, em-dash → hyphen
                        .replace(/\+/g, '')               // "17+" → "17"
                        .replace(/[^0-9-]/g, '')          // remove all except digits and hyphen
                        .trim();
                    };
                    
                    const isRecommended = normalizeAge(age) === normalizeAge(result.recommended_minimum_age || '');
                    
                    return (
                      <div 
                        key={age}
                        className={`rounded-lg p-3 border-2 transition-all ${
                          isRecommended 
                            ? 'bg-blue-100 border-blue-400' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`font-bold text-sm mb-1 ${isRecommended ? 'text-blue-700' : 'text-foreground'}`}>
                            {age}
                          </div>
                          <div className={`text-xs ${isRecommended ? 'text-blue-600' : 'text-muted-foreground'}`}>
                            {verdict === '✓' || verdict === 'Yes' || verdict?.toLowerCase().includes('appropriate') 
                              ? '✓ Suitable' 
                              : verdict === '✗' || verdict === 'No' 
                                ? '✗ Not suitable' 
                                : verdict}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
            </TabsContent>

            <TabsContent value="safety" className="mt-6">
              <div className="space-y-6">
                {/* System 1: UAE/Islamic/Arab Values */}
                {result.system1_uae_values && (
                  <div className={`rounded-xl p-6 border-2 ${
                    result.system1_uae_values.rating === "Safe" ? "bg-green-50 border-green-300" :
                    result.system1_uae_values.rating === "Moderate" ? "bg-yellow-50 border-yellow-300" :
                    "bg-red-50 border-red-300"
                  }`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
                        <Globe className={`w-7 h-7 ${
                          result.system1_uae_values.rating === "Safe" ? "text-green-600" :
                          result.system1_uae_values.rating === "Moderate" ? "text-yellow-600" :
                          "text-red-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-foreground text-xl">UAE / Islamic / Arab Values</h4>
                          <Badge className={
                            result.system1_uae_values.rating === "Safe" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                            result.system1_uae_values.rating === "Moderate" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                            "bg-red-100 text-red-700 hover:bg-red-100"
                          }>
                            {result.system1_uae_values.rating}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{result.system1_uae_values.assessment}</p>
                        
                        {result.system1_uae_values.concerns && result.system1_uae_values.concerns.length > 0 && (
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <h6 className="font-medium text-sm mb-2">Specific Concerns:</h6>
                            <ul className="space-y-1">
                              {result.system1_uae_values.concerns.map((concern, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {result.system1_uae_values.evidence && (
                          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                            <h6 className="font-medium text-sm mb-2 text-blue-700">Evidence from Book:</h6>
                            <blockquote className="text-sm text-foreground italic leading-relaxed whitespace-pre-line">
                              "{result.system1_uae_values.evidence}"
                            </blockquote>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* System 2: Child Safety */}
                {result.system2_child_safety && (
                  <div className={`rounded-xl p-6 border-2 ${
                    result.system2_child_safety.rating === "Safe" ? "bg-green-50 border-green-300" :
                    result.system2_child_safety.rating === "Moderate" ? "bg-yellow-50 border-yellow-300" :
                    "bg-red-50 border-red-300"
                  }`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
                        <Shield className={`w-7 h-7 ${
                          result.system2_child_safety.rating === "Safe" ? "text-green-600" :
                          result.system2_child_safety.rating === "Moderate" ? "text-yellow-600" :
                          "text-red-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-foreground text-xl">General Child Safety</h4>
                          <Badge className={
                            result.system2_child_safety.rating === "Safe" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                            result.system2_child_safety.rating === "Moderate" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                            "bg-red-100 text-red-700 hover:bg-red-100"
                          }>
                            {result.system2_child_safety.rating}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{result.system2_child_safety.assessment}</p>
                        
                        {result.system2_child_safety.concerns && result.system2_child_safety.concerns.length > 0 && (
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <h6 className="font-medium text-sm mb-2">Specific Concerns:</h6>
                            <ul className="space-y-1">
                              {result.system2_child_safety.concerns.map((concern, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {result.system2_child_safety.evidence && (
                          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                            <h6 className="font-medium text-sm mb-2 text-blue-700">Evidence from Book:</h6>
                            <blockquote className="text-sm text-foreground italic leading-relaxed whitespace-pre-line">
                              "{result.system2_child_safety.evidence}"
                            </blockquote>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy Domain Analysis (for backward compatibility) */}
                {result.domains && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-foreground mb-2">Legacy Domain Breakdown</h5>
                    <p className="text-xs text-muted-foreground">Detailed content analysis by domain (older evaluation format)</p>
                  </div>
                  {Object.entries(result.domains).map(([domain, assessment]) => {
                    // Get domain icon and colors
                    const domainConfig = {
                      gambling: { 
                        icon: Sparkles, 
                        color: 'orange',
                        label: 'Gambling & Gaming'
                      },
                      language: { 
                        icon: MessageCircle, 
                        color: 'blue',
                        label: 'Language & Profanity'
                      },
                      violence_terror: { 
                        icon: AlertTriangle, 
                        color: 'red',
                        label: 'Violence & Terror'
                      },
                      alcohol_drugs_smoking: { 
                        icon: XCircle, 
                        color: 'purple',
                        label: 'Alcohol, Drugs & Smoking'
                      },
                      sex_nudity: { 
                        icon: Info, 
                        color: 'pink',
                        label: 'Sexual Content & Nudity'
                      },
                      islamic_arab_uae_cultural_ethics: { 
                        icon: Globe, 
                        color: 'green',
                        label: 'Islamic, Arab & UAE Cultural Ethics'
                      }
                    }[domain] || { icon: Shield, color: 'gray', label: domain.replace(/_/g, ' ') };

                    const Icon = domainConfig.icon;
                    const score = result.domain_scores?.[domain] || 0;
                    const riskLevel = getRiskLevel(score);
                    
                    // Determine severity level
                    const getSeverityInfo = (assessment: string, score: number) => {
                      const lowerAssessment = assessment.toLowerCase();
                      if (lowerAssessment.includes('not present') || lowerAssessment.includes('absent') || score === 0) {
                        return { level: 'safe', label: 'Safe', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' };
                      } else if (lowerAssessment.includes('minor') || lowerAssessment.includes('mild') || score <= 2) {
                        return { level: 'low', label: 'Low Concern', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700' };
                      } else if (lowerAssessment.includes('moderate') || lowerAssessment.includes('present') || score <= 3) {
                        return { level: 'moderate', label: 'Moderate', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' };
                      } else {
                        return { level: 'high', label: 'High Concern', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' };
                      }
                    };

                    const severity = getSeverityInfo(assessment, score);

                    return (
                      <Card key={domain} className={`${severity.borderColor} border-2`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`p-2 rounded-lg ${severity.bgColor}`}>
                                <Icon className={`w-5 h-5 ${severity.textColor}`} />
                              </div>
                              <div>
                                <h5 className="font-semibold text-foreground">{domainConfig.label}</h5>
                                <Badge variant="outline" className={`mt-1 ${severity.textColor} border-current`}>
                                  {severity.label}
                                </Badge>
                              </div>
                            </div>
                            <div className={`text-right ${severity.bgColor} rounded-lg px-4 py-2`}>
                              <div className={`text-lg font-bold ${severity.textColor}`}>{riskLevel.label}</div>
                            </div>
                          </div>

                          {/* Assessment Details */}
                          <div className={`${severity.bgColor} rounded-lg p-4 border ${severity.borderColor}`}>
                            <h6 className="font-medium text-foreground text-sm mb-2">Assessment:</h6>
                            <p className="text-sm text-foreground leading-relaxed">
                              {assessment}
                            </p>
                          </div>

                          {/* Evidence/Quote from Book */}
                          {result.domain_evidence?.[domain as keyof typeof result.domain_evidence] && (
                            <div className="mt-3 bg-white dark:bg-gray-50 rounded-lg p-5 border-l-4 border-blue-500 shadow-sm">
                              <div className="flex items-start gap-2 mb-3">
                                <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                  Text Evidence from Book:
                                </span>
                              </div>
                              <blockquote className="text-base text-foreground italic leading-loose pl-4 border-l-2 border-gray-300 whitespace-pre-line">
                                "{result.domain_evidence[domain as keyof typeof result.domain_evidence]}"
                              </blockquote>
                            </div>
                          )}

                          {/* Show example indicator if content was found but no quote available */}
                          {!assessment.toLowerCase().includes('not present') && 
                           !assessment.toLowerCase().includes('absent') && 
                           !result.domain_evidence?.[domain as keyof typeof result.domain_evidence] && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="italic">
                                Analysis based on content examination and context within the book
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                )}

                {/* Overall Safety Summary */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground">Overall Safety Verdict</h5>
                      <p className="text-sm text-muted-foreground">{result.whitelist_verdict}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={result.whitelist_score} className="h-3" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{result.whitelist_score}%</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="mt-6">
              <div className="space-y-6">
                {/* Introduction */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground text-lg mb-2">Values & Ethics Guide for Parents</h4>
                      <p className="text-sm text-muted-foreground">
                        Use this book as a tool to teach your children important life lessons, Islamic values, and ethical principles. Below are key teachings from the book and practical ways to reinforce them.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Lessons */}
                <div>
                  <h5 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Key Lessons from the Book
                  </h5>
                  <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <p className="text-muted-foreground leading-relaxed">{result.lessons_learned}</p>
                  </div>
                </div>

                {/* How to Teach These Values */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                  <h5 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    How to Teach These Values
                  </h5>
                  <div className="space-y-4">
                    {(result as any).cultural_teaching_methods && (result as any).cultural_teaching_methods.length > 0 ? (
                      (result as any).cultural_teaching_methods.map((method: { title: string; description: string }, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {idx + 1}. {method.title}
                          </h6>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            1. Lead by Example
                          </h6>
                          <p className="text-sm text-muted-foreground">
                            Children learn best by observing. Demonstrate the values from this book in your daily life. Show patience, kindness, honesty, and the other virtues the book teaches.
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            2. Connect to Real-Life Situations
                          </h6>
                          <p className="text-sm text-muted-foreground">
                            When similar situations arise in your child's life, reference the book's lessons. Ask: "Do you remember how the character handled this?" This helps them apply values practically.
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            3. Link to Islamic Teachings
                          </h6>
                          <p className="text-sm text-muted-foreground">
                            Connect the book's lessons to Islamic values. Mention relevant Quranic verses or Hadith that support these teachings. This strengthens their faith alongside character development.
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            4. Encourage Reflection
                          </h6>
                          <p className="text-sm text-muted-foreground">
                            Ask your child how they would apply these lessons. Questions like "What would you do differently?" or "How can you practice this at school?" promote deeper understanding.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Islamic & UAE Values Connection */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h5 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-600" />
                    Islamic & UAE Cultural Values
                  </h5>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(result as any).islamic_uae_values && (result as any).islamic_uae_values.length > 0 ? (
                      (result as any).islamic_uae_values.map((value: { title: string; arabic_name?: string; description: string }, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-green-700 mb-2">
                            {value.title}{value.arabic_name ? ` (${value.arabic_name})` : ''}
                          </h6>
                          <p className="text-sm text-muted-foreground">
                            {value.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-green-700 mb-2">Respect & Kindness (Akhlaq)</h6>
                          <p className="text-sm text-muted-foreground">
                            Reinforce the importance of good character (akhlaq) as taught by Prophet Muhammad (PBUH). Discuss how the book's characters demonstrate respect, compassion, and kindness.
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-green-700 mb-2">Honesty & Trustworthiness (Amanah)</h6>
                          <p className="text-sm text-muted-foreground">
                            Emphasize the Islamic principle of trustworthiness. Help children understand that being truthful and reliable are core Islamic values reflected in the story.
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-green-700 mb-2">Patience & Perseverance (Sabr)</h6>
                          <p className="text-sm text-muted-foreground">
                            Teach the value of patience (sabr) in achieving goals. Connect challenges faced by characters to the Islamic teaching that "Allah is with those who are patient" (Quran 2:153).
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-green-700 mb-2">Gratitude & Appreciation (Shukr)</h6>
                          <p className="text-sm text-muted-foreground">
                            Highlight moments of gratitude in the book. Teach children to say "Alhamdulillah" and appreciate Allah's blessings, just as characters in the story appreciate what they have.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Practical Activities */}
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                  <h5 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Practical Family Activities
                  </h5>
                  <ul className="space-y-3">
                    {(result as any).family_activities && (result as any).family_activities.length > 0 ? (
                      (result as any).family_activities.map((activity: { title: string; description: string }, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-700">{idx + 1}</span>
                          </div>
                          <div>
                            <h6 className="font-medium text-foreground mb-1">{activity.title}</h6>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-700">1</span>
                          </div>
                          <div>
                            <h6 className="font-medium text-foreground mb-1">Family Reading Circle</h6>
                            <p className="text-sm text-muted-foreground">Read the book together as a family. Take turns reading pages and pause to discuss the values being presented.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-700">2</span>
                          </div>
                          <div>
                            <h6 className="font-medium text-foreground mb-1">Role-Playing Scenarios</h6>
                            <p className="text-sm text-muted-foreground">Act out key scenes from the book. Let children play different characters to understand various perspectives and moral choices.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-700">3</span>
                          </div>
                          <div>
                            <h6 className="font-medium text-foreground mb-1">Daily Value Practice</h6>
                            <p className="text-sm text-muted-foreground">Choose one value from the book each week. Challenge your child to practice it daily and share their experiences at dinner.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-700">4</span>
                          </div>
                          <div>
                            <h6 className="font-medium text-foreground mb-1">Creative Expression</h6>
                            <p className="text-sm text-muted-foreground">Encourage children to draw, write, or create art inspired by the book's lessons. Display their work to reinforce positive values.</p>
                          </div>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Suggested Activities</h4>
                <p className="text-muted-foreground">Activities based on the book's themes and lessons</p>
              </div>
            </TabsContent>

            <TabsContent value="discussion" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Discussion Topics</h4>
                <p className="text-muted-foreground">Engage with the book's key themes and messages through thoughtful conversation.</p>
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    Use the discussion questions in the "For Parents" tab to guide meaningful conversations with your children.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parents" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3">Parent Discussion Guide</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use these questions to engage your children in meaningful conversations about the book
                  </p>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-100">
                      <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        Before Reading
                      </h5>
                      <ul className="space-y-2">
                        {result.parent_discussion_guide.before_reading.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-100">
                      <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                        After Reading
                      </h5>
                      <ul className="space-y-2">
                        {result.parent_discussion_guide.after_reading.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {nmcAssessment && nmcAssessment.enabled && (
              <TabsContent value="nmc" className="mt-6">
                <div className="space-y-6">
                  {/* NMC Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-lg mb-1">National Media Council (NMC) Standards</h4>
                        <p className="text-sm text-muted-foreground">Content evaluation across 5 regulatory categories</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                        {nmcAssessment.finalAgeBand}
                      </Badge>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="grid gap-4">
                    {/* Gambling */}
                    <Card className={`border-2 ${nmcAssessment.categories.gambling.detected ? 'border-purple-300 bg-purple-50/30' : 'border-green-300 bg-green-50/30'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nmcAssessment.categories.gambling.detected ? 'bg-purple-100' : 'bg-green-100'}`}>
                              <span className="text-xl">🎰</span>
                            </div>
                            <div>
                              <h5 className="font-semibold">Gambling Content</h5>
                              <p className="text-xs text-muted-foreground">Betting, casinos, games of chance</p>
                            </div>
                          </div>
                          <Badge className={nmcAssessment.categories.gambling.detected ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'}>
                            {nmcAssessment.categories.gambling.ageBand}
                          </Badge>
                        </div>
                        <div className={`rounded-lg p-3 border ${nmcAssessment.categories.gambling.detected ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm italic">{nmcAssessment.categories.gambling.evidence}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Language */}
                    <Card className={`border-2 ${nmcAssessment.categories.language.detected ? 'border-yellow-300 bg-yellow-50/30' : 'border-green-300 bg-green-50/30'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nmcAssessment.categories.language.detected ? 'bg-yellow-100' : 'bg-green-100'}`}>
                              <span className="text-xl">📝</span>
                            </div>
                            <div>
                              <h5 className="font-semibold">Language & Profanity</h5>
                              <p className="text-xs text-muted-foreground">Inappropriate language, insults</p>
                            </div>
                          </div>
                          <Badge className={nmcAssessment.categories.language.detected ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}>
                            {nmcAssessment.categories.language.ageBand}
                          </Badge>
                        </div>
                        <div className={`rounded-lg p-3 border ${nmcAssessment.categories.language.detected ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm italic">{nmcAssessment.categories.language.evidence}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Violence */}
                    <Card className={`border-2 ${nmcAssessment.categories.violence.detected ? 'border-red-300 bg-red-50/30' : 'border-green-300 bg-green-50/30'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nmcAssessment.categories.violence.detected ? 'bg-red-100' : 'bg-green-100'}`}>
                              <span className="text-xl">⚔️</span>
                            </div>
                            <div>
                              <h5 className="font-semibold">Violence & Terror</h5>
                              <p className="text-xs text-muted-foreground">Physical conflict, scary themes</p>
                            </div>
                          </div>
                          <Badge className={nmcAssessment.categories.violence.detected ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}>
                            {nmcAssessment.categories.violence.ageBand}
                          </Badge>
                        </div>
                        <div className={`rounded-lg p-3 border ${nmcAssessment.categories.violence.detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm italic">{nmcAssessment.categories.violence.evidence}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Substance Use */}
                    <Card className={`border-2 ${nmcAssessment.categories.substanceUse.detected ? 'border-orange-300 bg-orange-50/30' : 'border-green-300 bg-green-50/30'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nmcAssessment.categories.substanceUse.detected ? 'bg-orange-100' : 'bg-green-100'}`}>
                              <span className="text-xl">🍺</span>
                            </div>
                            <div>
                              <h5 className="font-semibold">Alcohol, Smoking & Drugs</h5>
                              <p className="text-xs text-muted-foreground">Substance use references</p>
                            </div>
                          </div>
                          <Badge className={nmcAssessment.categories.substanceUse.detected ? 'bg-orange-600 text-white' : 'bg-green-600 text-white'}>
                            {nmcAssessment.categories.substanceUse.ageBand}
                          </Badge>
                        </div>
                        <div className={`rounded-lg p-3 border ${nmcAssessment.categories.substanceUse.detected ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm italic">{nmcAssessment.categories.substanceUse.evidence}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sexual Content */}
                    <Card className={`border-2 ${nmcAssessment.categories.sexualContent.detected ? 'border-pink-300 bg-pink-50/30' : 'border-green-300 bg-green-50/30'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nmcAssessment.categories.sexualContent.detected ? 'bg-pink-100' : 'bg-green-100'}`}>
                              <span className="text-xl">💕</span>
                            </div>
                            <div>
                              <h5 className="font-semibold">Sex & Nudity</h5>
                              <p className="text-xs text-muted-foreground">Romantic intimacy, sexual content</p>
                            </div>
                          </div>
                          <Badge className={nmcAssessment.categories.sexualContent.detected ? 'bg-pink-600 text-white' : 'bg-green-600 text-white'}>
                            {nmcAssessment.categories.sexualContent.ageBand}
                          </Badge>
                        </div>
                        <div className={`rounded-lg p-3 border ${nmcAssessment.categories.sexualContent.detected ? 'bg-pink-50 border-pink-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm italic">{nmcAssessment.categories.sexualContent.evidence}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Final Age Band Explanation */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-200">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-indigo-900 mb-2">How NMC Age Band is Determined</h5>
                        <p className="text-sm text-indigo-800">
                          The final NMC age band (<strong>{nmcAssessment.finalAgeBand}</strong>) is determined by taking the <strong>highest (most restrictive)</strong> age rating across all 5 categories. This ensures the book meets the most stringent content requirements across all regulatory areas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Goodreads Reviews Tab */}
            {goodreadsData?.reviews && goodreadsData.reviews.length > 0 && (
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-semibold text-lg">Goodreads Community Reviews</h4>
                      <p className="text-sm text-muted-foreground">
                        Top {goodreadsData.reviews.length} reader reviews from Goodreads
                      </p>
                    </div>
                    {goodreadsData.goodreadsUrl && (
                      <a 
                        href={goodreadsData.goodreadsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View on Goodreads →
                      </a>
                    )}
                  </div>

                  {goodreadsData.reviews.map((review, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                              {review.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{review.author}</p>
                              <p className="text-xs text-muted-foreground">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          {review.text}
                        </p>
                        {review.numOfLikes && review.numOfLikes > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>👍 {review.numOfLikes.toLocaleString()} people found this helpful</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
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
