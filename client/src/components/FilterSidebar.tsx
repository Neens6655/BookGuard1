import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
  { value: 'Whitelisted', label: 'Whitelisted', emoji: '✅', activeColor: 'bg-green-500 border-green-600 text-white', hoverColor: 'hover:border-green-400' },
  { value: 'Parent Guidance', label: 'Parent Guidance', emoji: '🟡', activeColor: 'bg-yellow-500 border-yellow-600 text-white', hoverColor: 'hover:border-yellow-400' },
  { value: 'Not Whitelisted', label: 'Not Whitelisted', emoji: '🚫', activeColor: 'bg-red-500 border-red-600 text-white', hoverColor: 'hover:border-red-400' },
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
    <Card className="sticky top-4 border-2 border-emerald-200 shadow-lg bg-white">
      <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-emerald-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-emerald-900">
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-400 h-8 px-3 text-xs font-semibold"
              data-testid="button-clear-filters"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Verdict/Status Filter */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-3">Status</h3>
          <div className="flex flex-wrap gap-2">
            {VERDICTS.map((verdict) => (
              <button
                key={verdict.value}
                onClick={() => onVerdictChange(verdict.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                  transition-all duration-200 border-2
                  ${selectedVerdicts.includes(verdict.value) 
                    ? verdict.activeColor
                    : `bg-white border-gray-300 text-gray-700 ${verdict.hoverColor} hover:bg-gray-50`
                  }
                `}
                data-testid={`checkbox-verdict-${verdict.value.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-base">{verdict.emoji}</span>
                <span className="whitespace-nowrap">{verdict.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-emerald-100" />

        {/* Age Group Filter */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-3">Age Group</h3>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((age) => (
              <button
                key={age.value}
                onClick={() => onAgeGroupChange(age.value)}
                className={`
                  px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border-2 min-w-[60px]
                  ${selectedAgeGroups.includes(age.value) 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 border-emerald-600 text-white shadow-md' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                  }
                `}
                data-testid={`checkbox-age-${age.value}`}
              >
                {age.label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-emerald-100" />

        {/* Language Filter */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-3">Language</h3>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onLanguageChange(lang.value)}
                className={`
                  px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border-2
                  ${selectedLanguages.includes(lang.value) 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-600 text-white shadow-md' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                  }
                `}
                data-testid={`checkbox-language-${lang.value.toLowerCase()}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-emerald-100" />

        {/* Genre Filter */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-3">Genre</h3>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.value}
                onClick={() => onGenreChange(genre.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                  transition-all duration-200 border-2
                  ${selectedGenres.includes(genre.value) 
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 border-cyan-600 text-white shadow-md' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-cyan-400 hover:bg-cyan-50'
                  }
                `}
                data-testid={`checkbox-genre-${genre.value.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-base">{genre.icon}</span>
                <span>{genre.label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
