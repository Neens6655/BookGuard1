export interface EvaluationResult {
  title: string;
  arabic_title?: string;
  author?: string;
  publisher?: string;
  language?: "Arabic" | "English" | "Bilingual";
  rating?: number;
  executive_summary: string;
  language_complexity: "Low" | "Moderate" | "High";
  domains: {
    gambling: string;
    language: string;
    violence_terror: string;
    alcohol_drugs_smoking: string;
    sex_nudity: string;
    islamic_arab_uae_cultural_ethics: string;
  };
  lessons_learned: string;
  parent_discussion_guide: {
    before_reading: string[];
    after_reading: string[];
  };
  age_verdicts: {
    "0-3": string;
    "3-5": string;
    "6-9": string;
    "10-12": string;
    "13-16": string;
    "17+": string;
    "21+": string;
  };
  recommended_minimum_age: string;
  key_drivers: string[];
  genres?: string[];
  themes?: string[];
  whitelist_score: number;
  whitelist_verdict: string;
  domain_scores?: {
    [key: string]: number;
  };
}

export interface Evaluation {
  id: string;
  filename: string;
  fileSize: number;
  status: "processing" | "completed" | "failed";
  progress: number;
  result: EvaluationResult | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}
