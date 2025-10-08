import { type Evaluation, type InsertEvaluation, type EvaluationResult, evaluations } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

// Initialize database connection only if DATABASE_URL is available
let db: ReturnType<typeof drizzle> | null = null;
if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
  }
}

export interface IStorage {
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  updateEvaluation(id: string, updates: Partial<Evaluation>): Promise<Evaluation | undefined>;
  deleteEvaluation(id: string): Promise<boolean>;
  getAllEvaluations(): Promise<Evaluation[]>;
}

export class MemStorage implements IStorage {
  private evaluations: Map<string, Evaluation>;

  constructor() {
    this.evaluations = new Map();
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const id = randomUUID();
    const evaluation: Evaluation = {
      ...insertEvaluation,
      id,
      progress: insertEvaluation.progress ?? 0,
      status: insertEvaluation.status ?? "processing",
      result: insertEvaluation.result ?? null,
      coverImage: insertEvaluation.coverImage ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.evaluations.set(id, evaluation);
    return evaluation;
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    return this.evaluations.get(id);
  }

  async updateEvaluation(id: string, updates: Partial<Evaluation>): Promise<Evaluation | undefined> {
    const existing = this.evaluations.get(id);
    if (!existing) return undefined;

    const updated: Evaluation = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.evaluations.set(id, updated);
    return updated;
  }

  async deleteEvaluation(id: string): Promise<boolean> {
    return this.evaluations.delete(id);
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export class DbStorage implements IStorage {
  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    if (!db) throw new Error("Database not initialized");
    try {
      const now = new Date();
      const [evaluation] = await db.insert(evaluations).values({
        ...insertEvaluation,
        progress: insertEvaluation.progress ?? 0,
        status: insertEvaluation.status ?? "processing",
        result: insertEvaluation.result ?? null,
        coverImage: insertEvaluation.coverImage ?? null,
        createdAt: now,
        updatedAt: now,
      }).returning();
      return evaluation;
    } catch (error) {
      console.error("Database error creating evaluation:", error);
      throw error;
    }
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    if (!db) throw new Error("Database not initialized");
    try {
      const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, id));
      return evaluation;
    } catch (error) {
      console.error("Database error getting evaluation:", error);
      throw error;
    }
  }

  async updateEvaluation(id: string, updates: Partial<Evaluation>): Promise<Evaluation | undefined> {
    if (!db) throw new Error("Database not initialized");
    try {
      const [updated] = await db.update(evaluations)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(evaluations.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Database error updating evaluation:", error);
      throw error;
    }
  }

  async deleteEvaluation(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    try {
      const result = await db.delete(evaluations).where(eq(evaluations.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Database error deleting evaluation:", error);
      throw error;
    }
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    if (!db) throw new Error("Database not initialized");
    try {
      return await db.select().from(evaluations).orderBy(desc(evaluations.createdAt));
    } catch (error) {
      console.error("Database error getting all evaluations:", error);
      throw error;
    }
  }
}

// Use database storage if available, otherwise fall back to in-memory storage
export const storage = db ? new DbStorage() : new MemStorage();

// Log which storage is being used
if (db) {
  console.log("✓ Using database storage (PostgreSQL)");
} else {
  console.warn("⚠ Using in-memory storage (data will not persist). Set DATABASE_URL to enable persistence.");
}
