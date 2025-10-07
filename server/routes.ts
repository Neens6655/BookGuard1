import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { storage } from "./storage";
import { insertEvaluationSchema } from "@shared/schema";
import { evaluateBook } from "./services/openai";
import { extractTextFromFile, extractCoverImage } from "./services/fileProcessor";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.epub', '.rtf'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, TXT, EPUB, and RTF files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and start evaluation
  app.post("/api/evaluate", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Create evaluation record
      const evaluation = await storage.createEvaluation({
        filename: req.file.originalname,
        fileSize: req.file.size,
        status: "processing",
        progress: 0,
        result: null,
      });

      res.json({ id: evaluation.id, status: "processing" });

      // Process file asynchronously
      processFileAsync(evaluation.id, req.file.path, req.file.originalname);

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Upload failed" 
      });
    }
  });

  // Get evaluation status and result
  app.get("/api/evaluate/:id", async (req, res) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      res.json(evaluation);
    } catch (error) {
      console.error("Get evaluation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get evaluation" 
      });
    }
  });

  // Get all evaluations
  app.get("/api/evaluations", async (req, res) => {
    try {
      const evaluations = await storage.getAllEvaluations();
      res.json(evaluations);
    } catch (error) {
      console.error("Get evaluations error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get evaluations" 
      });
    }
  });

  // Download report formats
  app.get("/api/evaluate/:id/download/:format", async (req, res) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      
      if (!evaluation || !evaluation.result) {
        return res.status(404).json({ error: "Evaluation or result not found" });
      }

      const format = req.params.format;
      const filename = `${evaluation.filename}_report`;

      switch (format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
          res.json(evaluation.result);
          break;

        case 'txt':
          const txtReport = generateTextReport(evaluation.result);
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
          res.send(txtReport);
          break;

        default:
          return res.status(400).json({ error: "Invalid format. Use 'json' or 'txt'" });
      }
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Download failed" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processFileAsync(evaluationId: string, filePath: string, filename: string) {
  try {
    // Update progress: Text Extraction
    await storage.updateEvaluation(evaluationId, { progress: 15 });
    
    const bookText = await extractTextFromFile(filePath, filename);
    
    // Extract cover image
    const coverImage = await extractCoverImage(filePath, filename);
    
    // Update progress: Language Detection
    await storage.updateEvaluation(evaluationId, { progress: 30 });
    
    // Simulate processing delay for UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update progress: Content Analysis
    await storage.updateEvaluation(evaluationId, { progress: 45 });
    
    // Simulate more processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update progress: Cultural Assessment
    await storage.updateEvaluation(evaluationId, { progress: 65 });
    
    // Call OpenAI for evaluation
    const result = await evaluateBook(bookText);
    
    // Update progress: Safety Scoring
    await storage.updateEvaluation(evaluationId, { progress: 80 });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update progress: Age Recommendations
    await storage.updateEvaluation(evaluationId, { progress: 95 });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update progress: Report Generation & Complete
    await storage.updateEvaluation(evaluationId, { 
      progress: 100, 
      status: "completed",
      result: result,
      coverImage: coverImage 
    });

    // Cleanup uploaded file
    await fs.unlink(filePath).catch(console.error);

  } catch (error) {
    console.error("Processing error:", error);
    await storage.updateEvaluation(evaluationId, { 
      status: "failed",
      result: { error: error instanceof Error ? error.message : "Processing failed" } 
    });
    
    // Cleanup uploaded file
    await fs.unlink(filePath).catch(console.error);
  }
}

function generateTextReport(result: any): string {
  return `
📚 Book Title: ${result.title || 'Unknown'}

📊 Whitelist Score: ${result.whitelist_score || 'N/A'} / 100
Verdict: ${result.whitelist_verdict || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Executive Summary
${result.executive_summary || 'No summary available.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 Language Complexity
${result.language_complexity || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 Lessons Learned
${result.lessons_learned || 'No lessons found.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍👩‍👧 Parent Discussion Guide

Before Reading:
${result.parent_discussion_guide?.before_reading?.map((q: string) => `- ${q}`).join('\n') || '- No questions available'}

After Reading:
${result.parent_discussion_guide?.after_reading?.map((q: string) => `- ${q}`).join('\n') || '- No questions available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Age Recommendations
Recommended Minimum Age: ${result.recommended_minimum_age || 'N/A'}

${result.age_verdicts ? Object.entries(result.age_verdicts).map(([age, verdict]) => `${age}: ${verdict}`).join('\n') : 'No age verdicts available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Key Drivers
${result.key_drivers?.map((d: string) => `- ${d}`).join('\n') || '- No key drivers available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
