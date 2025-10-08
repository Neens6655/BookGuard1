import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Star, CheckCircle, Settings } from 'lucide-react';
import { type Evaluation } from '@/types/evaluation';
import { EditBookDialog } from './EditBookDialog';

interface BookCardProps {
  book: Evaluation;
  onClick: () => void;
  onUpdate?: () => void;
}

export function BookCard({ book, onClick, onUpdate }: BookCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const result = book.result;
  
  if (!result) return null;

  const rating = result.rating || 4.6;
  const genres = result.genres || result.key_drivers.slice(0, 2);
  const themes = result.themes || ['General'];
  
  // Calculate domain score ratio (e.g., 0/27 means perfect in all domains)
  const domainScores = result.domain_scores || {};
  const totalDomainScore = Object.values(domainScores).reduce((sum: number, score) => sum + (score as number), 0);
  const maxDomainScore = Object.keys(domainScores).length * 5; // 6 domains × 5 max score
  
  const isPerfectScore = totalDomainScore === 0;
  
  // Approval status based on whitelist score (80+ = approved)
  const whitelistScore = result.whitelist_score || 0;
  const isApproved = whitelistScore >= 80;

  // Genre color mapping
  const genreColors: { [key: string]: string } = {
    'Educational': 'bg-yellow-100 text-yellow-700',
    'Arabic': 'bg-orange-100 text-orange-700',
    'Diversity': 'bg-purple-100 text-purple-700',
    'Philosophy': 'bg-pink-100 text-pink-700',
    'Islamic': 'bg-green-100 text-green-700',
    'UAE Culture': 'bg-blue-100 text-blue-700',
    'Adventure': 'bg-indigo-100 text-indigo-700',
    'Friendship': 'bg-rose-100 text-rose-700',
    'Nature': 'bg-emerald-100 text-emerald-700',
    'Hope': 'bg-cyan-100 text-cyan-700',
    'default': 'bg-gray-100 text-gray-700'
  };

  const getGenreColor = (genre: string) => {
    return genreColors[genre] || genreColors['default'];
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 overflow-hidden"
        onClick={onClick}
        data-testid={`card-book-${book.id}`}
      >
        {/* Book Cover */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-orange-200 via-yellow-100 to-orange-100">
          {book.coverImage ? (
            <img 
              src={book.coverImage} 
              alt={result.title}
              className="absolute inset-0 w-full h-full object-cover"
              data-testid={`img-book-cover-${book.id}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-orange-400/50" />
            </div>
          )}
          
          {/* Edit Button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 left-3 z-10 bg-white/90 hover:bg-white shadow-md h-8 w-8"
            onClick={handleEditClick}
            data-testid={`button-edit-book-${book.id}`}
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          {/* Rating Badge */}
          <Badge className="absolute top-3 right-3 bg-white text-gray-900 hover:bg-white font-semibold shadow-md">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </Badge>
          
          {/* Age Badge */}
          <Badge className="absolute bottom-3 left-3 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 font-semibold">
            Ages {result.recommended_minimum_age}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-base line-clamp-2" data-testid={`text-book-title-${book.id}`}>
          {result.title}
        </h3>
        
        {/* Arabic Subtitle */}
        {result.arabic_title && (
          <p className="text-sm text-muted-foreground" dir="rtl">
            {result.arabic_title}
          </p>
        )}
        
        {/* Age Recommendation - Prominent */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 mb-1">Recommended Age</p>
              <p className="text-lg font-bold text-blue-700">
                {result.recommended_minimum_age}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        {/* Author & Publisher */}
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Author:</span> {result.author || 'Regional author'}
          </p>
          {result.publisher && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Publisher:</span> {result.publisher}
            </p>
          )}
        </div>
        
        {/* Genre Badges */}
        <div className="flex flex-wrap gap-1.5">
          {genres.slice(0, 3).map((genre, idx) => (
            <Badge 
              key={idx}
              className={`text-xs ${getGenreColor(genre)}`}
              variant="secondary"
            >
              {genre}
            </Badge>
          ))}
        </div>
        
        {/* Themes */}
        <div className="pt-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Themes:</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {Array.isArray(themes) ? themes.join(' / ') : themes}
          </p>
        </div>
        
        {/* Approval Badge */}
        <div className="pt-2 border-t">
          <Badge 
            className={`w-full justify-center ${
              isApproved 
                ? 'bg-green-100 text-green-700 hover:bg-green-100 border border-green-300' 
                : 'bg-red-100 text-red-700 hover:bg-red-100 border border-red-300'
            }`}
            data-testid={`badge-approval-${book.id}`}
          >
            <CheckCircle className={`w-3 h-3 mr-1 ${isApproved ? 'text-green-600' : 'text-red-600'}`} />
            {isApproved ? 'Approved UAE Families' : 'Not Approved'}
          </Badge>
        </div>
      </CardContent>
    </Card>

    <EditBookDialog
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
      book={book}
      onSuccess={handleEditSuccess}
    />
    </>
  );
}
