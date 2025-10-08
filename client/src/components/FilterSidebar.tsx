import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  { value: 'Approved', label: 'Approved', emoji: '🟢', bgColor: 'bg-green-500/10 hover:bg-green-500/20', borderColor: 'border-green-500/30', textColor: 'text-green-700' },
  { value: 'Whitelisted', label: 'Whitelisted', emoji: '✅', bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20', borderColor: 'border-emerald-500/30', textColor: 'text-emerald-700' },
  { value: 'Parent Guidance', label: 'Parent Guidance', emoji: '🟡', bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-700' },
  { value: 'Not Whitelisted', label: 'Not Whitelisted', emoji: '🚫', bgColor: 'bg-red-500/10 hover:bg-red-500/20', borderColor: 'border-red-500/30', textColor: 'text-red-700' },
];

const GENRES = [
  { value: 'Islamic', label: 'Islamic', icon: '🕌' },
  { value: 'UAE Culture', label: 'UAE', icon: '🇦🇪' },
  { value: 'Adventure', label: 'Adventure', icon: '🗺️' },
  { value: 'Educational', label: 'Educational', icon: '📚' },
  { value: 'Bedtime', label: 'Bedtime', icon: '🌙' },
  { value: 'STEM', label: 'STEM', icon: '🔬' },
  { value: 'Emotions', label: 'Emotions', icon: '💝' },
  { value: 'Interactive', label: 'Interactive', icon: '🎮' },
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
    <Card className="sticky top-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 h-7 px-2 text-xs font-medium"
              data-testid="button-clear-filters"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Verdict/Status Filter - Pill Style */}
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-purple-700 mb-2">Status</h3>
          <div className="flex flex-wrap gap-1.5">
            {VERDICTS.map((verdict) => (
              <button
                key={verdict.value}
                onClick={() => onVerdictChange(verdict.value)}
                className={`
                  inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  transition-all border
                  ${selectedVerdicts.includes(verdict.value) 
                    ? `${verdict.bgColor} ${verdict.borderColor} ${verdict.textColor} shadow-sm` 
                    : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
                  }
                `}
                data-testid={`checkbox-verdict-${verdict.value.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-sm">{verdict.emoji}</span>
                <span className="whitespace-nowrap">{verdict.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age Group Filter - Compact Pills */}
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-purple-700 mb-2">Age</h3>
          <div className="flex flex-wrap gap-1.5">
            {AGE_GROUPS.map((age) => (
              <button
                key={age.value}
                onClick={() => onAgeGroupChange(age.value)}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium transition-all
                  ${selectedAgeGroups.includes(age.value) 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-white/60 text-gray-700 hover:bg-white hover:shadow-sm'
                  }
                `}
                data-testid={`checkbox-age-${age.value}`}
              >
                {age.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language Filter - Compact Pills */}
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-purple-700 mb-2">Language</h3>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onLanguageChange(lang.value)}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${selectedLanguages.includes(lang.value) 
                    ? 'bg-purple-500 text-white shadow-sm' 
                    : 'bg-white/60 text-gray-700 hover:bg-white hover:shadow-sm'
                  }
                `}
                data-testid={`checkbox-language-${lang.value.toLowerCase()}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Genre Filter - Icon Pills */}
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-purple-700 mb-2">Genre</h3>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((genre) => (
              <button
                key={genre.value}
                onClick={() => onGenreChange(genre.value)}
                className={`
                  inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  transition-all
                  ${selectedGenres.includes(genre.value) 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'bg-white/60 text-gray-700 hover:bg-white hover:shadow-sm'
                  }
                `}
                data-testid={`checkbox-genre-${genre.value.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span>{genre.icon}</span>
                <span>{genre.label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
