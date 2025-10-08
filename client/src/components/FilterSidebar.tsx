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
    <Card className="sticky top-4 bg-gradient-to-br from-green-50/90 via-emerald-50/80 to-cyan-50/90 backdrop-blur-sm border-emerald-200/60 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/80 h-7 px-2 text-xs font-medium transition-all hover:scale-105"
              data-testid="button-clear-filters"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {/* Verdict/Status Filter - Pill Style */}
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-700 mb-2.5">Status</h3>
          <div className="flex flex-wrap gap-2">
            {VERDICTS.map((verdict) => (
              <button
                key={verdict.value}
                onClick={() => onVerdictChange(verdict.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-200 border backdrop-blur-sm
                  ${selectedVerdicts.includes(verdict.value) 
                    ? `${verdict.bgColor} ${verdict.borderColor} ${verdict.textColor} shadow-md scale-105` 
                    : 'bg-white/70 border-gray-200 text-gray-600 hover:bg-white hover:border-emerald-300 hover:scale-105'
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
          <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-700 mb-2.5">Age</h3>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((age) => (
              <button
                key={age.value}
                onClick={() => onAgeGroupChange(age.value)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-sm
                  ${selectedAgeGroups.includes(age.value) 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md scale-105' 
                    : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 hover:text-emerald-700'
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
          <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-700 mb-2.5">Language</h3>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onLanguageChange(lang.value)}
                className={`
                  px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-sm
                  ${selectedLanguages.includes(lang.value) 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md scale-105' 
                    : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 hover:text-green-700'
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
          <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-700 mb-2.5">Genre</h3>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.value}
                onClick={() => onGenreChange(genre.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-200 backdrop-blur-sm
                  ${selectedGenres.includes(genre.value) 
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md scale-105' 
                    : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 hover:text-cyan-700'
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
