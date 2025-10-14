import { type Evaluation, type InsertEvaluation, type EvaluationResult, evaluations, type ScoringConfig, type InsertScoringConfig, scoringConfigs, scoringAuditLogs, type ScoringAuditLog } from "@shared/schema";
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
  
  // Scoring configuration methods
  createScoringConfig(config: InsertScoringConfig): Promise<ScoringConfig>;
  getScoringConfig(id: string): Promise<ScoringConfig | undefined>;
  getActiveScoringConfig(): Promise<ScoringConfig | undefined>;
  getAllScoringConfigs(): Promise<ScoringConfig[]>;
  updateScoringConfig(id: string, updates: Partial<ScoringConfig>): Promise<ScoringConfig | undefined>;
  activateScoringConfig(id: string, performedBy?: string): Promise<boolean>;
  deleteScoringConfig(id: string): Promise<boolean>;
  
  // Audit log methods
  createAuditLog(log: Omit<ScoringAuditLog, 'id' | 'timestamp'>): Promise<ScoringAuditLog>;
  getAuditLogs(configId?: string): Promise<ScoringAuditLog[]>;
}

export class MemStorage implements IStorage {
  private evaluations: Map<string, Evaluation>;
  private scoringConfigs: Map<string, ScoringConfig>;
  private auditLogs: Map<string, ScoringAuditLog>;

  constructor() {
    this.evaluations = new Map();
    this.scoringConfigs = new Map();
    this.auditLogs = new Map();
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

  async createScoringConfig(config: InsertScoringConfig): Promise<ScoringConfig> {
    const id = randomUUID();
    const scoringConfig = {
      ...config,
      id,
      description: config.description ?? null,
      createdBy: config.createdBy ?? null,
      aiConfig: config.aiConfig ?? null,
      isActive: config.isActive ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ScoringConfig;
    this.scoringConfigs.set(id, scoringConfig);
    return scoringConfig;
  }

  async getScoringConfig(id: string): Promise<ScoringConfig | undefined> {
    return this.scoringConfigs.get(id);
  }

  async getActiveScoringConfig(): Promise<ScoringConfig | undefined> {
    return Array.from(this.scoringConfigs.values()).find(c => c.isActive === 1);
  }

  async getAllScoringConfigs(): Promise<ScoringConfig[]> {
    return Array.from(this.scoringConfigs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateScoringConfig(id: string, updates: Partial<ScoringConfig>): Promise<ScoringConfig | undefined> {
    const existing = this.scoringConfigs.get(id);
    if (!existing) return undefined;

    const updated: ScoringConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.scoringConfigs.set(id, updated);
    return updated;
  }

  async activateScoringConfig(id: string, performedBy?: string): Promise<boolean> {
    const config = this.scoringConfigs.get(id);
    if (!config) return false;

    // Deactivate all configs
    const entries = Array.from(this.scoringConfigs.entries());
    for (const [key, cfg] of entries) {
      if (cfg.isActive === 1) {
        this.scoringConfigs.set(key, { ...cfg, isActive: 0, updatedAt: new Date() });
      }
    }

    // Activate the selected config
    this.scoringConfigs.set(id, { ...config, isActive: 1, updatedAt: new Date() });
    
    // Create audit log
    await this.createAuditLog({
      configId: id,
      action: 'activated',
      changes: null,
      performedBy: performedBy || 'system',
    });

    return true;
  }

  async deleteScoringConfig(id: string): Promise<boolean> {
    return this.scoringConfigs.delete(id);
  }

  async createAuditLog(log: Omit<ScoringAuditLog, 'id' | 'timestamp'>): Promise<ScoringAuditLog> {
    const id = randomUUID();
    const auditLog: ScoringAuditLog = {
      ...log,
      id,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, auditLog);
    return auditLog;
  }

  async getAuditLogs(configId?: string): Promise<ScoringAuditLog[]> {
    const logs = Array.from(this.auditLogs.values());
    if (configId) {
      return logs.filter(l => l.configId === configId).sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
    }
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

  async createScoringConfig(config: InsertScoringConfig): Promise<ScoringConfig> {
    if (!db) throw new Error("Database not initialized");
    try {
      const [scoringConfig] = await db.insert(scoringConfigs).values(config).returning();
      return scoringConfig;
    } catch (error) {
      console.error("Database error creating scoring config:", error);
      throw error;
    }
  }

  async getScoringConfig(id: string): Promise<ScoringConfig | undefined> {
    if (!db) throw new Error("Database not initialized");
    try {
      const [config] = await db.select().from(scoringConfigs).where(eq(scoringConfigs.id, id));
      return config;
    } catch (error) {
      console.error("Database error getting scoring config:", error);
      throw error;
    }
  }

  async getActiveScoringConfig(): Promise<ScoringConfig | undefined> {
    if (!db) throw new Error("Database not initialized");
    try {
      const [config] = await db.select().from(scoringConfigs).where(eq(scoringConfigs.isActive, 1));
      return config;
    } catch (error) {
      console.error("Database error getting active scoring config:", error);
      throw error;
    }
  }

  async getAllScoringConfigs(): Promise<ScoringConfig[]> {
    if (!db) throw new Error("Database not initialized");
    try {
      return await db.select().from(scoringConfigs).orderBy(desc(scoringConfigs.createdAt));
    } catch (error) {
      console.error("Database error getting all scoring configs:", error);
      throw error;
    }
  }

  async updateScoringConfig(id: string, updates: Partial<ScoringConfig>): Promise<ScoringConfig | undefined> {
    if (!db) throw new Error("Database not initialized");
    try {
      const [updated] = await db.update(scoringConfigs)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(scoringConfigs.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Database error updating scoring config:", error);
      throw error;
    }
  }

  async activateScoringConfig(id: string, performedBy?: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    try {
      // Deactivate all configs
      await db.update(scoringConfigs)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(scoringConfigs.isActive, 1));

      // Activate the selected config
      await db.update(scoringConfigs)
        .set({ isActive: 1, updatedAt: new Date() })
        .where(eq(scoringConfigs.id, id));

      // Create audit log
      await this.createAuditLog({
        configId: id,
        action: 'activated',
        changes: null,
        performedBy: performedBy || 'system',
      });

      return true;
    } catch (error) {
      console.error("Database error activating scoring config:", error);
      throw error;
    }
  }

  async deleteScoringConfig(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    try {
      const result = await db.delete(scoringConfigs).where(eq(scoringConfigs.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Database error deleting scoring config:", error);
      throw error;
    }
  }

  async createAuditLog(log: Omit<ScoringAuditLog, 'id' | 'timestamp'>): Promise<ScoringAuditLog> {
    if (!db) throw new Error("Database not initialized");
    try {
      const [auditLog] = await db.insert(scoringAuditLogs).values({
        ...log,
        timestamp: new Date(),
      }).returning();
      return auditLog;
    } catch (error) {
      console.error("Database error creating audit log:", error);
      throw error;
    }
  }

  async getAuditLogs(configId?: string): Promise<ScoringAuditLog[]> {
    if (!db) throw new Error("Database not initialized");
    try {
      if (configId) {
        return await db.select().from(scoringAuditLogs)
          .where(eq(scoringAuditLogs.configId, configId))
          .orderBy(desc(scoringAuditLogs.timestamp));
      }
      return await db.select().from(scoringAuditLogs).orderBy(desc(scoringAuditLogs.timestamp));
    } catch (error) {
      console.error("Database error getting audit logs:", error);
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
