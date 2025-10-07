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

// Evaluation result types
export const evaluationResultSchema = z.object({
  title: z.string(),
  executive_summary: z.string(),
  language_complexity: z.enum(["Low", "Moderate", "High"]),
  domains: z.object({
    gambling: z.string(),
    language: z.string(),
    violence_terror: z.string(),
    alcohol_drugs_smoking: z.string(),
    sex_nudity: z.string(),
    islamic_arab_uae_cultural_ethics: z.string(),
  }),
  lessons_learned: z.string(),
  parent_discussion_guide: z.object({
    before_reading: z.array(z.string()),
    after_reading: z.array(z.string()),
  }),
  age_verdicts: z.object({
    "0-3": z.string(),
    "3-5": z.string(),
    "6-9": z.string(),
    "10-12": z.string(),
    "13-16": z.string(),
    "17+": z.string(),
    "21+": z.string(),
  }),
  recommended_minimum_age: z.string(),
  key_drivers: z.array(z.string()),
  whitelist_score: z.number(),
  whitelist_verdict: z.string(),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
