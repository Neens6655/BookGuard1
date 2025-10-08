import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, CheckCircle, Globe, Calendar, BookOpen } from 'lucide-react';

interface FilterSidebarProps {
  selectedAgeGroups: string[];
  selectedLanguages: string[];
  selectedGenres: string[];
  selectedVerdicts: string[];
  onAgeGroupChange: (ageGroup: string) => void;
  onLanguageChange: (language: string) => void;
  onGenreChange: (genre: string) => void;
  onVerdictChange: (verdict: string) => void;
  onClearFilters: () => void;
}

const AGE_GROUPS = [
  { value: '0-3', label: '0-3' },
  { value: '3-5', label: '3-5' },
  { value: '6-9', label: '6-9' },
  { value: '10-12', label: '10-12' },
  { value: '13-16', label: '13-16' },
  { value: '17+', label: '17+' },
  { value: '21+', label: '21+' },
];

const LANGUAGES = [
  { value: 'Arabic', label: 'Arabic' },
  { value: 'English', label: 'English' },
  { value: 'Bilingual', label: 'Bilingual' },
];

const VERDICTS = [
  { value: 'Approved', label: 'Approved', emoji: '🟢', color: 'text-green-600' },
  { value: 'Whitelisted', label: 'Whitelisted', emoji: '✅', color: 'text-green-600' },
  { value: 'Parent Guidance', label: 'Parent Guidance', emoji: '🟡', color: 'text-yellow-600' },
  { value: 'Not Whitelisted', label: 'Not Whitelisted', emoji: '🚫', color: 'text-red-600' },
];

const GENRES = [
  { value: 'Islamic', label: 'Islamic' },
  { value: 'UAE Culture', label: 'UAE Culture' },
  { value: 'Culture', label: 'Culture' },
  { value: 'Heritage', label: 'Heritage' },
  { value: 'Adventure', label: 'Adventure' },
  { value: 'Fantasy', label: 'Fantasy' },
  { value: 'Mystery', label: 'Mystery' },
  { value: 'Science', label: 'Science' },
  { value: 'STEM', label: 'STEM' },
  { value: 'Educational', label: 'Educational' },
  { value: 'Bedtime', label: 'Bedtime' },
  { value: 'Interactive', label: 'Interactive' },
  { value: 'Nature', label: 'Nature' },
  { value: 'Friendship', label: 'Friendship' },
  { value: 'Emotions', label: 'Emotions' },
  { value: 'Philosophy', label: 'Philosophy' },
  { value: 'Humor', label: 'Humor' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Social Learning', label: 'Social Learning' },
  { value: 'Traditional', label: 'Traditional' },
];

export function FilterSidebar({
  selectedAgeGroups,
  selectedLanguages,
  selectedGenres,
  selectedVerdicts,
  onAgeGroupChange,
  onLanguageChange,
  onGenreChange,
  onVerdictChange,
  onClearFilters,
}: FilterSidebarProps) {
  const hasActiveFilters = selectedAgeGroups.length > 0 || selectedLanguages.length > 0 || selectedGenres.length > 0 || selectedVerdicts.length > 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Filter Results</CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-orange-600 hover:text-orange-700 h-auto p-0"
              data-testid="button-clear-filters"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict/Status Filter */}
        <div className="pb-6 border-b">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Status</h3>
          </div>
          <div className="space-y-2">
            {VERDICTS.map((verdict) => (
              <label
                key={verdict.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <Checkbox
                  checked={selectedVerdicts.includes(verdict.value)}
                  onCheckedChange={() => onVerdictChange(verdict.value)}
                  data-testid={`checkbox-verdict-${verdict.value.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <span className="text-xl">{verdict.emoji}</span>
                <span className={`text-sm font-medium ${verdict.color}`}>{verdict.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Age Group Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm">Age Group</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AGE_GROUPS.map((age) => (
              <label
                key={age.value}
                className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors"
              >
                <Checkbox
                  checked={selectedAgeGroups.includes(age.value)}
                  onCheckedChange={() => onAgeGroupChange(age.value)}
                  data-testid={`checkbox-age-${age.value}`}
                />
                <span className="text-sm">{age.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Language Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-sm">Language</h3>
          </div>
          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <label
                key={lang.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <Checkbox
                  checked={selectedLanguages.includes(lang.value)}
                  onCheckedChange={() => onLanguageChange(lang.value)}
                  data-testid={`checkbox-language-${lang.value.toLowerCase()}`}
                />
                <span className="text-sm">{lang.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Genre Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-sm">Genre</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {GENRES.map((genre) => (
              <label
                key={genre.value}
                className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors"
              >
                <Checkbox
                  checked={selectedGenres.includes(genre.value)}
                  onCheckedChange={() => onGenreChange(genre.value)}
                  data-testid={`checkbox-genre-${genre.value.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <span className="text-sm truncate">{genre.label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
