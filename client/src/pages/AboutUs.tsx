import { Shield, Heart, Users, BookOpen, Target, Sparkles, CheckCircle, Globe, ArrowLeft, Brain, AlertTriangle, Layers, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface ScoringConfig {
  id: string;
  version: string;
  name: string;
  description?: string;
  system1Config: {
    enabled: boolean;
    weight: number;
    criteria: Array<{
      name: string;
      weight: number;
      description: string;
    }>;
  };
  system2Config: {
    enabled: boolean;
    weight: number;
    criteria: Array<{
      name: string;
      weight: number;
      description: string;
    }>;
  };
  system3Config: {
    enabled: boolean;
    weight: number;
    criteria: Array<{
      name: string;
      weight: number;
      description: string;
    }>;
  };
  system4Config: {
    enabled: boolean;
    weight: number;
    criteria: Array<{
      name: string;
      weight: number;
      description: string;
    }>;
  };
}

export function AboutUs() {
  // Fetch active scoring configuration
  const { data: activeConfig, isLoading } = useQuery<ScoringConfig>({
    queryKey: ['/api/scoring-configs/active'],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition" data-testid="link-home">
              <Shield className="text-primary w-8 h-8" />
              <div>
                <h1 className="font-bold text-foreground text-lg">UAE BookGuard</h1>
                <p className="text-xs text-muted-foreground">Powered by AI</p>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition" data-testid="link-how-it-works">
                How It Works
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back-home">
                  Back to Home
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-400/30 rounded-full blur-3xl"></div>
        
        {/* Back Button */}
        <Link href="/" data-testid="button-back-to-home">
          <button className="absolute top-8 left-8 z-20 group flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-lg">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Back</span>
          </button>
        </Link>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 border-white/30 text-white bg-white/10 backdrop-blur-md">
              <Globe className="w-3 h-3 mr-2" />
              About UAE BookGuard
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" data-testid="about-title">
              Protecting Values,<br />Empowering Literacy
            </h1>
            <p className="text-xl md:text-2xl opacity-95 leading-relaxed">
              A trusted evaluation framework ensuring every book is reviewed against UAE cultural values, Islamic ethics, child protection standards, and educational appropriateness.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-green-200 text-green-700">
              <Target className="w-3 h-3 mr-2" />
              Our Mission
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Why UAE BookGuard Exists
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">The Challenge</h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Children's books shape not only literacy but also values, ethics, and worldview. In a rapidly globalized publishing market, many books available to children may include cultural references, values, or themes that do not align with UAE and Islamic principles.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Parents, educators, and schools often struggle to evaluate which titles are both safe and developmentally appropriate.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-cyan-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Our Solution</h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                UAE BookGuard was created to solve this challenge. Our mission is to provide a trusted evaluation framework that ensures every book is reviewed against UAE cultural values, Islamic ethics, child protection standards, and educational appropriateness.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                <CheckCircle className="w-5 h-5 mr-2" />
                Trusted • Transparent • Culturally Aligned
              </div>
            </div>
          </div>

          {/* Who We Help */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">Parents</h4>
                <p className="text-muted-foreground">
                  Choose safe and enriching books for their children with confidence and clarity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">Educators</h4>
                <p className="text-muted-foreground">
                  Build school libraries that reflect UAE values while promoting literacy and learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">Institutions</h4>
                <p className="text-muted-foreground">
                  Ensure reading programs are culturally aligned and globally competitive.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Evaluation Framework */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-purple-200 text-purple-700">
              <Brain className="w-3 h-3 mr-2" />
              4-System Evaluation Framework
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Our Comprehensive Review Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Every book undergoes evaluation across four interconnected systems, ensuring thorough assessment of cultural alignment, safety, and educational appropriateness.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          ) : activeConfig ? (
            <div className="grid md:grid-cols-2 gap-8">
              {/* System 1: UAE/Islamic/Arab Values */}
              <Card className="border-2 hover:border-green-300 transition-all duration-300 hover:shadow-xl" data-testid="card-system1">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Globe className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-2">System 1: Cultural Values</h3>
                      <p className="text-sm text-muted-foreground">UAE / Islamic / Arab Alignment</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Red-line system ensuring books align with Islamic principles, Arab heritage, and UAE national identity.
                    </p>
                    
                    <div className="bg-green-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm text-green-900 mb-3">Evaluation Criteria:</h4>
                      {activeConfig.system1Config.criteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-900">{criterion.name}</p>
                            <p className="text-xs text-green-700">{criterion.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        Auto-Reject on Severe
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Weight: {activeConfig.system1Config.weight}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System 2: Child Safety */}
              <Card className="border-2 hover:border-red-300 transition-all duration-300 hover:shadow-xl" data-testid="card-system2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-2">System 2: Child Safety</h3>
                      <p className="text-sm text-muted-foreground">Protection & Well-being</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Red-line system screening for age-inappropriate content, psychological harm, and safety concerns.
                    </p>
                    
                    <div className="bg-red-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm text-red-900 mb-3">Evaluation Criteria:</h4>
                      {activeConfig.system2Config.criteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">{criterion.name}</p>
                            <p className="text-xs text-red-700">{criterion.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        Auto-Reject on Severe
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        Weight: {activeConfig.system2Config.weight}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System 3: Theme Complexity */}
              <Card className="border-2 hover:border-purple-300 transition-all duration-300 hover:shadow-xl" data-testid="card-system3">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Layers className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-2">System 3: Theme Complexity</h3>
                      <p className="text-sm text-muted-foreground">Developmental Readiness</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Assesses whether themes and concepts match the child's cognitive development stage.
                    </p>
                    
                    <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm text-purple-900 mb-3">Evaluation Criteria:</h4>
                      {activeConfig.system3Config.criteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-purple-900">{criterion.name}</p>
                            <p className="text-xs text-purple-700">{criterion.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        Age Mapping System
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        Weight: {activeConfig.system3Config.weight}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System 4: Language Complexity */}
              <Card className="border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl" data-testid="card-system4">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Type className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-2">System 4: Language Complexity</h3>
                      <p className="text-sm text-muted-foreground">Reading Level Assessment</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Evaluates vocabulary, sentence structure, and reading fluency demands for age appropriateness.
                    </p>
                    
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm text-blue-900 mb-3">Evaluation Criteria:</h4>
                      {activeConfig.system4Config.criteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">{criterion.name}</p>
                            <p className="text-xs text-blue-700">{criterion.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Age Mapping System
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Weight: {activeConfig.system4Config.weight}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No active scoring configuration found.</p>
            </div>
          )}

          <div className="mt-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-200">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-bold text-foreground mb-2">Integrated Evaluation Process</h4>
                <p className="text-muted-foreground leading-relaxed">
                  All four systems work together to provide a comprehensive assessment. Books must pass both red-line systems (Cultural Values & Child Safety) to be considered safe. Theme and Language Complexity systems then determine age appropriateness. The final verdict combines all factors to produce a <span className="font-semibold text-foreground">Whitelisted</span>, <span className="font-semibold text-foreground">Parent Guidance</span>, or <span className="font-semibold text-foreground">Not Whitelisted</span> recommendation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-cyan-200 text-cyan-700">
              <Sparkles className="w-3 h-3 mr-2" />
              Our Impact
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Our Value to Society
            </h2>
          </div>

          <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 rounded-3xl p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Protect Cultural Integrity</h4>
                  <p className="opacity-90">Foster global literacy while preserving UAE and Islamic values</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Empower Stakeholders</h4>
                  <p className="opacity-90">Provide parents and teachers with reliable guidance</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Curate Quality Content</h4>
                  <p className="opacity-90">Help schools build safe, high-quality reading lists</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Encourage Reading</h4>
                  <p className="opacity-90">Foster children's love of reading without cultural conflicts</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
              <p className="text-xl font-semibold">
                UAE BookGuard bridges the gap between cultural values and global literature, ensuring that every book consumed by children in the UAE enriches, educates, and empowers.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/how-it-works">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700" data-testid="button-learn-how">
                <Sparkles className="w-4 h-4 mr-2" />
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
