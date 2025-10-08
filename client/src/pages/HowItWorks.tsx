import { Shield, Heart, Target, Languages, CheckCircle, AlertTriangle, XCircle, BookOpen, Users, Sparkles, Brain, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';

export function HowItWorks() {
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
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition" data-testid="link-about">
                About Us
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 border-white/30 text-white bg-white/10 backdrop-blur-md">
              <Brain className="w-3 h-3 mr-2" />
              AI-Powered Evaluation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" data-testid="how-title">
              How Our Evaluation<br />Framework Works
            </h1>
            <p className="text-xl md:text-2xl opacity-95 leading-relaxed">
              Each book is reviewed through our comprehensive four-system model, designed for clarity, trust, and transparency.
            </p>
          </div>
        </div>
      </section>

      {/* 4-System Framework */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-green-200 text-green-700">
              <Shield className="w-3 h-3 mr-2" />
              4-System Evaluation
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Our Comprehensive Framework
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Every book undergoes rigorous analysis across four critical dimensions
            </p>
          </div>

          <div className="space-y-8">
            {/* System 1 */}
            <Card className="border-2 border-green-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-green-600 text-white hover:bg-green-600">System 1</Badge>
                      <Badge variant="outline" className="border-red-300 text-red-700">Highest Priority</Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">UAE / Islamic / Arab Cultural Values</h3>
                    <p className="text-muted-foreground mb-4">
                      Books must respect religion, culture, traditions, and authority. This is our red-line protection system.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">Safe</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Respects Islam, Arab culture, modesty, and authority</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold text-yellow-700">Moderate</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Fantasy/magic, mild disobedience, light Western influence</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="font-semibold text-red-700">Severe</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Mockery of religion, negative stereotypes, promotion of harmful content</p>
                      </div>
                    </div>
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-red-700">⚠️ Any Severe Concern = Not Whitelisted (automatic rejection)</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System 2 */}
            <Card className="border-2 border-blue-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-blue-600 text-white hover:bg-blue-600">System 2</Badge>
                      <Badge variant="outline" className="border-red-300 text-red-700">Red-Line Protection</Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">General Child Safety</h3>
                    <p className="text-muted-foreground mb-4">
                      Protects children from harmful themes using global child safety standards.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">Safe</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Positive lessons, humor, light adventure</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold text-yellow-700">Moderate</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Mild violence, scary creatures, light bullying</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="font-semibold text-red-700">Severe</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Gore, explicit content, substance abuse, suicide</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System 3 */}
            <Card className="border-2 border-purple-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <Badge className="bg-purple-600 text-white hover:bg-purple-600 mb-3">System 3</Badge>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Theme Complexity</h3>
                    <p className="text-muted-foreground mb-4">
                      Ensures content matches children's cognitive and emotional maturity.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <span className="font-semibold text-purple-700 block mb-1">Simple</span>
                        <p className="text-sm text-muted-foreground">Everyday life, clear morals</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <span className="font-semibold text-purple-700 block mb-1">Moderate</span>
                        <p className="text-sm text-muted-foreground">Abstract ideas, grief, dilemmas</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <span className="font-semibold text-purple-700 block mb-1">High</span>
                        <p className="text-sm text-muted-foreground">War, trauma, philosophy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System 4 */}
            <Card className="border-2 border-orange-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Languages className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <Badge className="bg-orange-600 text-white hover:bg-orange-600 mb-3">System 4</Badge>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Language Complexity</h3>
                    <p className="text-muted-foreground mb-4">
                      Matches reading level with child's ability.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <span className="font-semibold text-orange-700 block mb-1">Easy</span>
                        <p className="text-sm text-muted-foreground">Short sentences, simple vocabulary</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <span className="font-semibold text-orange-700 block mb-1">Moderate</span>
                        <p className="text-sm text-muted-foreground">Longer sentences, figurative language</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <span className="font-semibold text-orange-700 block mb-1">Advanced</span>
                        <p className="text-sm text-muted-foreground">Complex syntax, rare vocabulary</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Verdict Labels */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-cyan-200 text-cyan-700">
              <Sparkles className="w-3 h-3 mr-2" />
              Clear Results
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Verdict & Labels for Families
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We don't show complex scores. Instead, we use clear categories and visual labels that parents can understand at a glance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-3">🟢</div>
                <h4 className="text-xl font-bold text-foreground mb-2">Approved</h4>
                <p className="text-sm text-muted-foreground">Fully suitable, safe, and culturally aligned</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-3">✅</div>
                <h4 className="text-xl font-bold text-foreground mb-2">Whitelisted</h4>
                <p className="text-sm text-muted-foreground">Safe for UAE families and institutions</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-3">🟡</div>
                <h4 className="text-xl font-bold text-foreground mb-2">Parent Guidance</h4>
                <p className="text-sm text-muted-foreground">Safe, but parents should guide due to moderate concerns</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-3">🚫</div>
                <h4 className="text-xl font-bold text-foreground mb-2">Not Whitelisted</h4>
                <p className="text-sm text-muted-foreground">Not suitable; violates cultural or safety standards</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <h4 className="text-xl font-bold text-foreground mb-4">Each book also receives:</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold text-foreground mb-1">Recommended Minimum Age</h5>
                    <p className="text-sm text-muted-foreground">0–3, 3–5, 6–9, 10–12, 13–16, 17+, 21+</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Languages className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold text-foreground mb-1">Reading Level</h5>
                    <p className="text-sm text-muted-foreground">Easy / Moderate / Advanced</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold text-foreground mb-1">Theme Complexity</h5>
                    <p className="text-sm text-muted-foreground">Simple / Moderate / Mature</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-green-200 text-green-700">
              <BookOpen className="w-3 h-3 mr-2" />
              Real Example
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Case Study: Charlotte's Web
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A classic tale of friendship, sacrifice, and life on a farm
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-border">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">System 1 (UAE Values): Safe</h4>
                      <p className="text-sm text-muted-foreground">No disrespect to culture or religion</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">System 2 (Child Safety): Moderate</h4>
                      <p className="text-sm text-muted-foreground">Themes of death may be emotionally heavy for younger readers</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">System 3 (Theme Complexity): Moderate</h4>
                      <p className="text-sm text-muted-foreground">Concepts of mortality and sacrifice</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">System 4 (Language Complexity): Moderate</h4>
                      <p className="text-sm text-muted-foreground">Rich vocabulary, better suited for older readers</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-6 border-2 border-yellow-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl">🟡</div>
                      <h4 className="text-2xl font-bold text-foreground">Final Verdict: Parent Guidance Recommended</h4>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <Badge className="bg-blue-600">Age 10+</Badge>
                      <Badge variant="outline">Reading Level: Moderate</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Notes:</strong> Safe and valuable, but best introduced with parent/teacher guidance to help children process themes of loss.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-12">
              <Link href="/">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700" data-testid="button-try-now">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try It Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
