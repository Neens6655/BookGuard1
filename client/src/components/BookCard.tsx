import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Star, CheckCircle, Settings, Users } from 'lucide-react';
import { type Evaluation } from '@/types/evaluation';
import { EditBookDialog } from './EditBookDialog';

interface BookCardProps {
  book: Evaluation;
  onClick: () => void;
  onUpdate?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function BookCard({ book, onClick, onUpdate, selectionMode, isSelected, onToggleSelection }: BookCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const result = book.result;
  
  if (!result) return null;

  // Only use Goodreads rating if status is 'ok'
  const hasGoodreadsRating = book.goodreadsData?.status === 'ok' && book.goodreadsData?.rating;
  const rating = hasGoodreadsRating ? book.goodreadsData?.rating : undefined;
  
  const genres = result.genres || result.key_drivers.slice(0, 2);
  const themes = result.themes || ['General'];
  
  // Calculate domain score ratio (e.g., 0/27 means perfect in all domains)
  const domainScores = result.domain_scores || {};
  const totalDomainScore = Object.values(domainScores).reduce((sum: number, score) => sum + (score as number), 0);
  const maxDomainScore = Object.keys(domainScores).length * 5; // 6 domains × 5 max score
  
  const isPerfectScore = totalDomainScore === 0;
  
  // Visual label based on final_verdict
  const finalVerdict = result.final_verdict || (result.whitelist_score >= 80 ? "Whitelisted" : "Not Whitelisted");
  
  const verdictConfig = {
    "Whitelisted": {
      symbol: "✅",
      label: "Whitelisted",
      subtext: "Safe & culturally aligned for UAE families",
      bgClass: "bg-green-100",
      textClass: "text-green-700",
      borderClass: "border-green-300"
    },
    "Parent Guidance": {
      symbol: "🟡",
      label: "Parent Guidance",
      subtext: "Review before giving",
      bgClass: "bg-yellow-100",
      textClass: "text-yellow-700",
      borderClass: "border-yellow-300"
    },
    "Not Whitelisted": {
      symbol: "🚫",
      label: "Not Whitelisted",
      subtext: "Not suitable",
      bgClass: "bg-red-100",
      textClass: "text-red-700",
      borderClass: "border-red-300"
    }
  };
  
  const verdictDisplay = verdictConfig[finalVerdict] || verdictConfig["Not Whitelisted"];

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

  const handleCardClick = () => {
    if (selectionMode && onToggleSelection) {
      onToggleSelection();
    } else {
      onClick();
    }
  };

  return (
    <>
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-all overflow-hidden ${
          selectionMode && isSelected ? 'border-primary border-2 shadow-xl' : 'hover:border-primary/50'
        }`}
        onClick={handleCardClick}
        data-testid={`card-book-${book.id}`}
      >
        {/* Book Cover */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-orange-200 via-yellow-100 to-orange-100">
          {(book.goodreadsData?.coverImageUrl || book.amazonData?.coverImageUrl || book.coverImage) ? (
            <img 
              src={book.goodreadsData?.coverImageUrl || book.amazonData?.coverImageUrl || book.coverImage || ''} 
              alt={result.title}
              className="absolute inset-0 w-full h-full object-cover"
              data-testid={`img-book-cover-${book.id}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-orange-400/50" />
            </div>
          )}
          
          {/* Selection Checkbox */}
          {selectionMode && (
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelection}
                className="h-6 w-6 bg-white border-2"
                data-testid={`checkbox-select-book-${book.id}`}
              />
            </div>
          )}
          
          {/* Edit Button */}
          {!selectionMode && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-3 left-3 z-10 bg-white/90 hover:bg-white shadow-md h-8 w-8"
              onClick={handleEditClick}
              data-testid={`button-edit-book-${book.id}`}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
          
          {/* Goodreads Rating Badge (only show if data is available) */}
          {hasGoodreadsRating && rating && (
            <Badge className="absolute top-3 right-3 bg-white text-gray-900 hover:bg-white font-semibold shadow-md">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
              <span className="text-xs ml-1 text-gray-500">Goodreads</span>
            </Badge>
          )}
          
          {/* UAE Age Badge */}
          <Badge className="absolute bottom-3 left-3 bg-white/95 text-blue-700 hover:bg-white font-semibold shadow-md border border-blue-200">
            <Users className="w-3 h-3 mr-1" />
            UAE {result.recommended_minimum_age}
          </Badge>
          
          {/* NMC Age Badge (if available) */}
          {book.nmcAssessment && book.nmcAssessment.enabled && (
            <Badge className="absolute bottom-3 right-3 bg-white/95 text-purple-700 hover:bg-white font-semibold shadow-md border border-purple-200">
              <span className="text-xs mr-1">NMC</span>
              {book.nmcAssessment.finalAgeBand}
            </Badge>
          )}
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
          <p className="text-xs font-medium text-gray-600 mb-2">Age Recommendations</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-medium mb-0.5">UAE System</p>
              <p className="text-lg font-bold text-blue-700">
                {result.recommended_minimum_age}
              </p>
            </div>
            {book.nmcAssessment && book.nmcAssessment.enabled && (
              <>
                <div className="h-8 w-px bg-blue-200"></div>
                <div className="flex-1">
                  <p className="text-xs text-purple-600 font-medium mb-0.5">NMC Standards</p>
                  <p className="text-lg font-bold text-purple-700">
                    {book.nmcAssessment.finalAgeBand}
                  </p>
                </div>
              </>
            )}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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
        
        {/* Verdict Badge */}
        <div className="pt-2 border-t">
          <div className={`${verdictDisplay.bgClass} ${verdictDisplay.textClass} border ${verdictDisplay.borderClass} rounded-lg p-2.5 text-center`}>
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <span className="text-base">{verdictDisplay.symbol}</span>
              <span className="font-bold text-xs">{verdictDisplay.label}</span>
            </div>
            <p className="text-[10px] opacity-90">{verdictDisplay.subtext}</p>
          </div>
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
