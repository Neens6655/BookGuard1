export interface EvaluationResult {
  title: string;
  arabic_title?: string;
  author?: string;
  publisher?: string;
  language?: "Arabic" | "English" | "Bilingual";
  rating?: number;
  executive_summary: string;
  
  // New 4-system framework
  system1_uae_values: {
    rating: "Safe" | "Moderate" | "Severe";
    assessment: string;
    evidence?: string | null;
    concerns: string[];
  };
  
  system2_child_safety: {
    rating: "Safe" | "Moderate" | "Severe";
    assessment: string;
    evidence?: string | null;
    concerns: string[];
  };
  
  system3_theme_complexity: {
    rating: "Simple" | "Moderate" | "High";
    assessment: string;
    min_age: number;
  };
  
  system4_language_complexity: {
    rating: "Easy" | "Moderate" | "Advanced";
    assessment: string;
    min_age: number;
  };
  
  final_verdict: "Approved" | "Whitelisted" | "Parent Guidance" | "Not Whitelisted";
  recommended_age: string;
  age_rationale: string;
  
  // Legacy fields for backward compatibility
  language_complexity?: "Low" | "Moderate" | "High";
  domains?: {
    gambling: string;
    language: string;
    violence_terror: string;
    alcohol_drugs_smoking: string;
    sex_nudity: string;
    islamic_arab_uae_cultural_ethics: string;
  };
  domain_evidence?: {
    gambling?: string | null;
    language?: string | null;
    violence_terror?: string | null;
    alcohol_drugs_smoking?: string | null;
    sex_nudity?: string | null;
    islamic_arab_uae_cultural_ethics?: string | null;
  };
  age_verdicts?: {
    "0-3": string;
    "3-5": string;
    "6-9": string;
    "10-12": string;
    "13-16": string;
    "17+": string;
    "21+": string;
  };
  domain_scores?: {
    [key: string]: number;
  };
  
  lessons_learned: string;
  parent_discussion_guide: {
    before_reading: string[];
    after_reading: string[];
  };
  recommended_minimum_age: string;
  key_drivers: string[];
  genres?: string[];
  themes?: string[];
  whitelist_score: number;
  whitelist_verdict: string;
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
