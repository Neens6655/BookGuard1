import { Shield, Heart, Users, BookOpen, Target, Sparkles, CheckCircle, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';

export function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition" data-testid="link-home">
              <Shield className="text-primary w-8 h-8" />
              <div>
                <h1 className="font-bold text-foreground text-lg">Emirates BookGuard</h1>
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
              About Emirates BookGuard
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
              Why Emirates BookGuard Exists
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
                Emirates BookGuard was created to solve this challenge. Our mission is to provide a trusted evaluation framework that ensures every book is reviewed against UAE cultural values, Islamic ethics, child protection standards, and educational appropriateness.
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
                Emirates BookGuard bridges the gap between cultural values and global literature, ensuring that every book consumed by children in the UAE enriches, educates, and empowers.
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
