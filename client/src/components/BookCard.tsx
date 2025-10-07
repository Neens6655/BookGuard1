import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { type Evaluation } from '@/types/evaluation';

interface BookCardProps {
  book: Evaluation;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  const result = book.result;
  
  if (!result) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getVerdictBadge = (verdict: string) => {
    const verdictLower = verdict.toLowerCase();
    const isApproved = verdictLower.includes('approved') || 
                       verdictLower.includes('suitable') || 
                       verdictLower.includes('whitelisted') || 
                       verdictLower.includes('safe') ||
                       verdict.includes('✅');
    return (
      <Badge 
        variant={isApproved ? 'default' : 'destructive'}
        className="flex items-center gap-1"
        data-testid={`badge-verdict-${book.id}`}
      >
        {isApproved ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {isApproved ? 'Approved' : 'Not Suitable'}
      </Badge>
    );
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
      onClick={onClick}
      data-testid={`card-book-${book.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {getVerdictBadge(result.whitelist_verdict)}
        </div>
        <CardTitle className="text-lg line-clamp-2" data-testid={`text-book-title-${book.id}`}>
          {result.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-summary-${book.id}`}>
          {result.executive_summary}
        </p>
        
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Safety Score:</span>
            <span className={`text-lg font-bold ${getScoreColor(result.whitelist_score)}`} data-testid={`text-score-${book.id}`}>
              {result.whitelist_score}
            </span>
          </div>
          <Badge variant="outline" data-testid={`badge-age-${book.id}`}>
            Age {result.recommended_minimum_age}+
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'Date unavailable'}
        </div>
      </CardContent>
    </Card>
  );
}
