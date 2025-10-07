import { type Evaluation, type InsertEvaluation, type EvaluationResult } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  updateEvaluation(id: string, updates: Partial<Evaluation>): Promise<Evaluation | undefined>;
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

  async getAllEvaluations(): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const storage = new MemStorage();
