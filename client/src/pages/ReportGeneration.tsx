import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  ArrowLeft, 
  CheckSquare, 
  Square,
  Filter,
  BookOpen
} from "lucide-react";
import { useLocation } from "wouter";
import type { Evaluation } from "@/types/evaluation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type VerdictFilter = "all" | "Whitelisted" | "Parent Guidance" | "Not Whitelisted";
type SafetyRating = "Safe" | "Moderate" | "Severe";

// Helper function to parse age range strings
const parseAgeRange = (ageStr: string): { min: number; max: number } => {
  const numbers = ageStr.match(/\d+/g);
  
  if (!numbers || numbers.length === 0) {
    return { min: 0, max: 99 };
  }
  
  const nums = numbers.map(n => parseInt(n));
  
  if (nums.length >= 2) {
    // Range like "6-9" or "Ages 6-9"
    return { min: Math.min(...nums), max: Math.max(...nums) };
  } else {
    // Single number like "6" or "6+"
    const age = nums[0];
    return { min: age, max: age + 2 };
  }
};

// Helper function to check if two age ranges overlap
const ageRangesOverlap = (range1: string, range2: string): boolean => {
  const r1 = parseAgeRange(range1);
  const r2 = parseAgeRange(range2);
  return r1.min <= r2.max && r2.min <= r1.max;
};

export default function ReportGeneration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Filter states
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [culturalValuesFilter, setCulturalValuesFilter] = useState<SafetyRating | "all">("all");
  const [childSafetyFilter, setChildSafetyFilter] = useState<SafetyRating | "all">("all");
  const [themeComplexityFilter, setThemeComplexityFilter] = useState<string>("all");
  const [languageLevelFilter, setLanguageLevelFilter] = useState<string>("all");
  
  // Selected books
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: evaluations = [], isLoading } = useQuery<Evaluation[]>({
    queryKey: ["/api/evaluations"],
  });

  // Filter evaluations based on all criteria
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      if (evaluation.status !== "completed" || !evaluation.result) return false;

      // Verdict filter
      if (verdictFilter !== "all" && evaluation.result.final_verdict !== verdictFilter) {
        return false;
      }

      // Age group filter (use recommended_minimum_age from result)
      if (ageGroupFilter !== "all") {
        const recAge = evaluation.result.recommended_minimum_age;
        // Check if the age groups overlap or match
        if (!recAge || !ageRangesOverlap(ageGroupFilter, recAge)) {
          return false;
        }
      }

      // Language filter
      if (languageFilter !== "all" && evaluation.result.language !== languageFilter) {
        return false;
      }

      // Cultural Values filter (System 1)
      if (culturalValuesFilter !== "all") {
        const culturalRating = evaluation.result.system1_uae_values?.rating;
        if (culturalRating !== culturalValuesFilter) return false;
      }

      // Child Safety filter (System 2)
      if (childSafetyFilter !== "all") {
        const safetyRating = evaluation.result.system2_child_safety?.rating;
        if (safetyRating !== childSafetyFilter) return false;
      }

      // Theme Complexity filter (System 3)
      if (themeComplexityFilter !== "all") {
        const themeComplexity = evaluation.result.system3_theme_complexity?.rating;
        if (themeComplexity?.toLowerCase() !== themeComplexityFilter.toLowerCase()) return false;
      }

      // Language Level filter (System 4)
      if (languageLevelFilter !== "all") {
        const langLevel = evaluation.result.system4_language_complexity?.rating;
        if (langLevel?.toLowerCase() !== languageLevelFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [evaluations, verdictFilter, ageGroupFilter, languageFilter, culturalValuesFilter, childSafetyFilter, themeComplexityFilter, languageLevelFilter]);

  const handleSelectAll = () => {
    const allIds = new Set(filteredEvaluations.map(e => e.id));
    setSelectedBooks(allIds);
  };

  const handleSelectNone = () => {
    setSelectedBooks(new Set());
  };

  const handleToggleBook = (id: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBooks(newSelected);
  };

  const handleGenerateReport = async () => {
    if (selectedBooks.size === 0) {
      toast({
        title: "No books selected",
        description: "Please select at least one book to generate a report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookIds: Array.from(selectedBooks),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Selected_Books_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report generated successfully!",
        description: `PDF report with ${selectedBooks.size} books has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Error generating report",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Whitelisted":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Parent Guidance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Not Whitelisted":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="gap-2"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h1 className="text-xl font-bold">Report Generation</h1>
              </div>
            </div>
            <Button
              onClick={handleGenerateReport}
              disabled={selectedBooks.size === 0 || isGenerating}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              data-testid="button-generate-report"
            >
              <Download className="w-4 h-4" />
              Generate Report ({selectedBooks.size})
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>

              <div className="space-y-4">
                {/* Verdict Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Verdict</Label>
                  <div className="space-y-2">
                    {(["all", "Whitelisted", "Parent Guidance", "Not Whitelisted"] as const).map((verdict) => (
                      <div key={verdict} className="flex items-center space-x-2">
                        <Checkbox
                          id={`verdict-${verdict}`}
                          checked={verdictFilter === verdict}
                          onCheckedChange={() => setVerdictFilter(verdict)}
                          data-testid={`checkbox-verdict-${verdict.toLowerCase().replace(" ", "-")}`}
                        />
                        <Label htmlFor={`verdict-${verdict}`} className="text-sm cursor-pointer">
                          {verdict === "all" ? "All Verdicts" : verdict}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Age Group Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Age Group</Label>
                  <div className="space-y-2">
                    {["all", "3-7", "8-12", "13-18"].map((age) => (
                      <div key={age} className="flex items-center space-x-2">
                        <Checkbox
                          id={`age-${age}`}
                          checked={ageGroupFilter === age}
                          onCheckedChange={() => setAgeGroupFilter(age)}
                          data-testid={`checkbox-age-${age}`}
                        />
                        <Label htmlFor={`age-${age}`} className="text-sm cursor-pointer">
                          {age === "all" ? "All Ages" : `Ages ${age}`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Language Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Language</Label>
                  <div className="space-y-2">
                    {["all", "Arabic", "English"].map((lang) => (
                      <div key={lang} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${lang}`}
                          checked={languageFilter === lang}
                          onCheckedChange={() => setLanguageFilter(lang)}
                          data-testid={`checkbox-language-${lang.toLowerCase()}`}
                        />
                        <Label htmlFor={`lang-${lang}`} className="text-sm cursor-pointer">
                          {lang === "all" ? "All Languages" : lang}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Advanced Scoring Filters */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="scoring">
                    <AccordionTrigger className="text-sm font-semibold">
                      Scoring Criteria
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {/* Cultural Values */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-green-700">Cultural Values</Label>
                        <div className="space-y-1">
                          {(["all", "Safe", "Moderate", "Severe"] as const).map((rating) => (
                            <div key={rating} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cultural-${rating}`}
                                checked={culturalValuesFilter === rating}
                                onCheckedChange={() => setCulturalValuesFilter(rating)}
                                data-testid={`checkbox-cultural-${rating.toLowerCase()}`}
                              />
                              <Label htmlFor={`cultural-${rating}`} className="text-xs cursor-pointer">
                                {rating === "all" ? "All Ratings" : rating}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Child Safety */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-blue-700">Child Safety</Label>
                        <div className="space-y-1">
                          {(["all", "Safe", "Moderate", "Severe"] as const).map((rating) => (
                            <div key={rating} className="flex items-center space-x-2">
                              <Checkbox
                                id={`safety-${rating}`}
                                checked={childSafetyFilter === rating}
                                onCheckedChange={() => setChildSafetyFilter(rating)}
                                data-testid={`checkbox-safety-${rating.toLowerCase()}`}
                              />
                              <Label htmlFor={`safety-${rating}`} className="text-xs cursor-pointer">
                                {rating === "all" ? "All Ratings" : rating}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Theme Complexity */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-purple-700">Theme Complexity</Label>
                        <div className="space-y-1">
                          {["all", "simple", "moderate", "high"].map((level) => (
                            <div key={level} className="flex items-center space-x-2">
                              <Checkbox
                                id={`theme-${level}`}
                                checked={themeComplexityFilter === level}
                                onCheckedChange={() => setThemeComplexityFilter(level)}
                                data-testid={`checkbox-theme-${level}`}
                              />
                              <Label htmlFor={`theme-${level}`} className="text-xs cursor-pointer capitalize">
                                {level === "all" ? "All Levels" : level}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Language Level */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-orange-700">Language Level</Label>
                        <div className="space-y-1">
                          {["all", "easy", "moderate", "advanced"].map((level) => (
                            <div key={level} className="flex items-center space-x-2">
                              <Checkbox
                                id={`language-level-${level}`}
                                checked={languageLevelFilter === level}
                                onCheckedChange={() => setLanguageLevelFilter(level)}
                                data-testid={`checkbox-language-level-${level}`}
                              />
                              <Label htmlFor={`language-level-${level}`} className="text-xs cursor-pointer capitalize">
                                {level === "all" ? "All Levels" : level}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </Card>
          </div>

          {/* Books List */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {filteredEvaluations.length} Book{filteredEvaluations.length !== 1 ? "s" : ""} Found
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedBooks.size} selected for report
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredEvaluations.length === 0}
                  className="gap-2"
                  data-testid="button-select-all"
                >
                  <CheckSquare className="w-4 h-4" />
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNone}
                  disabled={selectedBooks.size === 0}
                  className="gap-2"
                  data-testid="button-select-none"
                >
                  <Square className="w-4 h-4" />
                  Select None
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Loading books...</p>
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No books found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters to see more results.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEvaluations.map((evaluation) => {
                  const result = evaluation.result;
                  if (!result) return null;

                  return (
                    <Card
                      key={evaluation.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedBooks.has(evaluation.id) ? "ring-2 ring-green-500" : ""
                      }`}
                      onClick={() => handleToggleBook(evaluation.id)}
                      data-testid={`card-book-${evaluation.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedBooks.has(evaluation.id)}
                          onCheckedChange={() => handleToggleBook(evaluation.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-book-${evaluation.id}`}
                        />
                        {evaluation.coverImage && (
                          <img
                            src={evaluation.coverImage}
                            alt={result.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{result.title}</h3>
                              {result.author && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  by {result.author}
                                </p>
                              )}
                            </div>
                            <Badge className={getVerdictColor(result.final_verdict || "")}>
                              {result.final_verdict}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.recommended_minimum_age && (
                              <Badge variant="outline" className="text-xs">
                                Ages {result.recommended_minimum_age}
                              </Badge>
                            )}
                            {result.language && (
                              <Badge variant="outline" className="text-xs">
                                {result.language}
                              </Badge>
                            )}
                            {result.system1_uae_values?.rating && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Cultural: {result.system1_uae_values.rating}
                              </Badge>
                            )}
                            {result.system2_child_safety?.rating && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Safety: {result.system2_child_safety.rating}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
