import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { type Evaluation } from '@/types/evaluation';
import { Link } from 'wouter';

export default function Analytics() {
  const { data: evaluations, isLoading } = useQuery<Evaluation[]>({
    queryKey: ['/api/evaluations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/evaluations');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedEvals = evaluations?.filter(e => e.status === 'completed') || [];
  const failedEvals = evaluations?.filter(e => e.status === 'failed') || [];
  const totalEvals = evaluations?.length || 0;
  const successRate = totalEvals > 0 ? (completedEvals.length / totalEvals) * 100 : 0;

  // Calculate average processing time (mock for now since we don't have timestamps)
  const avgProcessingTime = 45; // seconds

  // Verdict breakdown
  const verdictCounts = completedEvals.reduce((acc, e) => {
    const verdict = e.result?.final_verdict || 'Unknown';
    acc[verdict] = (acc[verdict] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Language breakdown
  const languageCounts = completedEvals.reduce((acc, e) => {
    const lang = e.result?.language || 'Unknown';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Genre breakdown (top 5)
  const allGenres = completedEvals.flatMap(e => e.result?.genres || []);
  const genreCounts = allGenres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Age group breakdown
  const ageGroups = completedEvals.reduce((acc, e) => {
    const age = e.result?.recommended_minimum_age || 'Unknown';
    acc[age] = (acc[age] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-analytics">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">Evaluation metrics and insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="metric-total-books">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Evaluations</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEvals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedEvals.length} completed, {failedEvals.length} failed
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-success-rate">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedEvals.length} of {totalEvals} successful
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-avg-time">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Processing Time</CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{avgProcessingTime}s</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per book evaluation
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-whitelisted">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Whitelisted Books</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{verdictCounts['Whitelisted'] || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Safe for UAE families
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Verdict Breakdown */}
          <Card data-testid="chart-verdict-breakdown">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Verdict Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(verdictCounts).map(([verdict, count]) => {
                  const percentage = (count / completedEvals.length) * 100;
                  const colors: Record<string, string> = {
                    'Whitelisted': 'bg-green-500',
                    'Parent Guidance': 'bg-yellow-500',
                    'Not Whitelisted': 'bg-red-500'
                  };
                  return (
                    <div key={verdict}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{verdict}</span>
                        <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`${colors[verdict] || 'bg-gray-500'} h-2 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Language Distribution */}
          <Card data-testid="chart-language-distribution">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Language Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(languageCounts).map(([lang, count]) => {
                  const percentage = (count / completedEvals.length) * 100;
                  return (
                    <div key={lang}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{lang}</span>
                        <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Genres */}
          <Card data-testid="chart-top-genres">
            <CardHeader>
              <CardTitle>Top Genres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topGenres.map(([genre, count]) => (
                  <Badge key={genre} variant="secondary" className="text-sm">
                    {genre} ({count})
                  </Badge>
                ))}
                {topGenres.length === 0 && (
                  <p className="text-sm text-muted-foreground">No genre data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Age Group Distribution */}
          <Card data-testid="chart-age-distribution">
            <CardHeader>
              <CardTitle>Age Group Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ageGroups)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([age, count]) => (
                    <Badge key={age} variant="outline" className="text-sm">
                      {age} ({count})
                    </Badge>
                  ))}
                {Object.keys(ageGroups).length === 0 && (
                  <p className="text-sm text-muted-foreground">No age data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {totalEvals === 0 && (
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-6">
              Analyze some books to see analytics and insights here
            </p>
            <Link href="/">
              <Button data-testid="button-go-home">
                <BookOpen className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
