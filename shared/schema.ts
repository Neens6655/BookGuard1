import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status", { enum: ["processing", "completed", "failed"] }).notNull().default("processing"),
  progress: integer("progress").notNull().default(0),
  result: jsonb("result"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

// Schema for updating book metadata
export const updateBookMetadataSchema = z.object({
  title: z.string().transform(s => s.trim()).pipe(z.string().min(1, "Title cannot be empty").max(500)).optional(),
  author: z.string().transform(s => s.trim()).pipe(z.string().min(1, "Author cannot be empty").max(200)).optional(),
  publisher: z.string().transform(s => s.trim()).pipe(z.string().min(1, "Publisher cannot be empty").max(200)).optional(),
});

export type UpdateBookMetadata = z.infer<typeof updateBookMetadataSchema>;

// Evaluation result types
export const evaluationResultSchema = z.object({
  title: z.string(),
  arabic_title: z.string().optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  language: z.enum(["Arabic", "English", "Bilingual"]).optional(),
  rating: z.number().optional(),
  executive_summary: z.string(),
  
  // New 4-system framework
  system1_uae_values: z.object({
    rating: z.enum(["Safe", "Moderate", "Severe"]),
    assessment: z.string(),
    evidence: z.string().nullable().optional(),
    concerns: z.array(z.string()),
  }),
  
  system2_child_safety: z.object({
    rating: z.enum(["Safe", "Moderate", "Severe"]),
    assessment: z.string(),
    evidence: z.string().nullable().optional(),
    concerns: z.array(z.string()),
  }),
  
  system3_theme_complexity: z.object({
    rating: z.enum(["Simple", "Moderate", "High"]),
    assessment: z.string(),
    min_age: z.number(),
  }),
  
  system4_language_complexity: z.object({
    rating: z.enum(["Easy", "Moderate", "Advanced"]),
    assessment: z.string(),
    min_age: z.number(),
  }),
  
  final_verdict: z.enum(["Approved", "Whitelisted", "Parent Guidance", "Not Whitelisted"]),
  recommended_age: z.string(),
  age_rationale: z.string(),
  
  // Legacy fields for backward compatibility
  language_complexity: z.enum(["Low", "Moderate", "High"]).optional(),
  domains: z.object({
    gambling: z.string(),
    language: z.string(),
    violence_terror: z.string(),
    alcohol_drugs_smoking: z.string(),
    sex_nudity: z.string(),
    islamic_arab_uae_cultural_ethics: z.string(),
  }).optional(),
  domain_evidence: z.object({
    gambling: z.string().nullable().optional(),
    language: z.string().nullable().optional(),
    violence_terror: z.string().nullable().optional(),
    alcohol_drugs_smoking: z.string().nullable().optional(),
    sex_nudity: z.string().nullable().optional(),
    islamic_arab_uae_cultural_ethics: z.string().nullable().optional(),
  }).optional(),
  age_verdicts: z.object({
    "0-3": z.string(),
    "3-5": z.string(),
    "6-9": z.string(),
    "10-12": z.string(),
    "13-16": z.string(),
    "17+": z.string(),
    "21+": z.string(),
  }).optional(),
  domain_scores: z.record(z.number()).optional(),
  
  lessons_learned: z.string(),
  parent_discussion_guide: z.object({
    before_reading: z.array(z.string()),
    after_reading: z.array(z.string()),
  }),
  
  // Dynamic UAE/Islamic/Arab Cultural Values Teaching Content
  cultural_teaching_methods: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  
  islamic_uae_values: z.array(z.object({
    title: z.string(),
    arabic_name: z.string().optional(),
    description: z.string(),
  })).optional(),
  
  family_activities: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  
  recommended_minimum_age: z.string(),
  key_drivers: z.array(z.string()),
  genres: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  whitelist_score: z.number(),
  whitelist_verdict: z.string(),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
