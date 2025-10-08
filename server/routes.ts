import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { storage } from "./storage";
import { insertEvaluationSchema, updateBookMetadataSchema } from "@shared/schema";
import { evaluateBook, deepAnalyzeBook } from "./services/openai";
import { extractTextFromFile, extractCoverImage } from "./services/fileProcessor";
import { fromError } from "zod-validation-error";

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

const imageUpload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and WebP images are allowed'));
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

  // Update evaluation metadata (title, author, publisher, cover image)
  app.patch("/api/evaluations/:id", imageUpload.single("coverImage"), async (req, res) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      // Validate metadata input
      const validationResult = updateBookMetadataSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validationError.message 
        });
      }

      const validatedData = validationResult.data;
      const updates: any = {};
      
      // Handle cover image upload (multer already validated file type and size)
      if (req.file) {
        const coverImageDataUrl = `data:${req.file.mimetype};base64,${(await fs.readFile(req.file.path)).toString('base64')}`;
        updates.coverImage = coverImageDataUrl;
        
        // Cleanup uploaded file
        await fs.unlink(req.file.path).catch(console.error);
      }

      // Handle metadata updates in result object
      if (validatedData.title || validatedData.author || validatedData.publisher) {
        const currentResult = evaluation.result || {};
        updates.result = {
          ...currentResult,
          ...(validatedData.title && { title: validatedData.title }),
          ...(validatedData.author && { author: validatedData.author }),
          ...(validatedData.publisher && { publisher: validatedData.publisher }),
        };
      }

      const updatedEvaluation = await storage.updateEvaluation(req.params.id, updates);
      
      if (!updatedEvaluation) {
        return res.status(404).json({ error: "Failed to update evaluation" });
      }

      res.json(updatedEvaluation);
    } catch (error) {
      console.error("Update evaluation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update evaluation" 
      });
    }
  });

  // Delete evaluation
  app.delete("/api/evaluations/:id", async (req, res) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      const deleted = await storage.deleteEvaluation(req.params.id);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete evaluation" });
      }

      res.json({ success: true, message: "Evaluation deleted successfully" });
    } catch (error) {
      console.error("Delete evaluation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete evaluation" 
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

  // Deep Analysis Endpoint
  app.post("/api/deep-analyze", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Extract text from file
      const bookText = await extractTextFromFile(req.file.path, req.file.originalname);
      
      // Perform deep analysis
      const analysisResult = await deepAnalyzeBook(bookText);
      
      // Cleanup uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      
      res.json(analysisResult);

    } catch (error) {
      console.error("Deep analysis error:", error);
      // Cleanup file on error
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Deep analysis failed" 
      });
    }
  });

  // Generate Whitelisted Books Report
  app.get("/api/reports/whitelisted", async (req, res) => {
    try {
      const allEvaluations = await storage.getAllEvaluations();
      
      // Filter only whitelisted books with results
      const whitelistedBooks = allEvaluations.filter(
        (evaluation) => 
          evaluation.status === "completed" &&
          evaluation.result &&
          (evaluation.result as any)?.final_verdict === "Whitelisted"
      );

      if (whitelistedBooks.length === 0) {
        return res.status(404).json({ error: "No whitelisted books found" });
      }

      // Generate comprehensive report
      const reportContent = generateWhitelistedBooksReport(whitelistedBooks);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Whitelisted_Books_Report_${timestamp}.txt`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(reportContent);

    } catch (error) {
      console.error("Whitelisted report error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate report" 
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

function generateWhitelistedBooksReport(evaluations: any[]): string {
  const timestamp = new Date().toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Sort books alphabetically by title
  const sortedBooks = evaluations.sort((a, b) => {
    const titleA = (a.result?.title || a.filename || '').toLowerCase();
    const titleB = (b.result?.title || b.filename || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });

  let report = `
═══════════════════════════════════════════════════════════════════
            WHITELISTED BOOKS REPORT
            UAE Ministry of Education - Emirates BookGuard
═══════════════════════════════════════════════════════════════════

Report Generated: ${timestamp}
Total Whitelisted Books: ${evaluations.length}

This report contains comprehensive evaluations of all books that have
been approved as culturally aligned, safe, and appropriate for UAE families.

═══════════════════════════════════════════════════════════════════

`;

  sortedBooks.forEach((evaluation, index) => {
    const result = evaluation.result || {};
    const bookNumber = index + 1;

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOK ${bookNumber}: ${result.title || evaluation.filename || 'Unknown Title'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 BASIC INFORMATION
───────────────────────────────────────────────────────────────────
  Title:        ${result.title || 'Not available'}
  Author:       ${result.author || 'Not available'}
  Publisher:    ${result.publisher || 'Not available'}
  Language:     ${result.language || 'Not available'}

✅ VERDICT: WHITELISTED
  Whitelist Score: ${result.whitelist_score || 'N/A'} / 100
  
📝 EXECUTIVE SUMMARY
───────────────────────────────────────────────────────────────────
${result.executive_summary || 'No summary available.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHY THIS BOOK IS WHITELISTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formatSystemEvaluation('SYSTEM 1: UAE/Islamic/Arab Cultural Values', result.system1_uae_values)}

${formatSystemEvaluation('SYSTEM 2: General Child Safety', result.system2_child_safety)}

${formatSystemEvaluation('SYSTEM 3: Theme Complexity', result.system3_theme_complexity)}

${formatSystemEvaluation('SYSTEM 4: Language Complexity', result.system4_language_complexity)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGE RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Recommended Age: ${result.recommended_age || result.recommended_minimum_age || 'Not available'}
  
  Rationale:
  ${result.age_rationale || 'No rationale provided.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY LESSONS & VALUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${result.lessons_learned || 'No lessons documented.'}

${result.key_drivers && result.key_drivers.length > 0 ? `
📌 Key Drivers:
${result.key_drivers.map((d: string) => `  • ${d}`).join('\n')}
` : ''}

${result.islamic_uae_values && result.islamic_uae_values.length > 0 ? `
🕌 Islamic & UAE Values Highlighted:
${result.islamic_uae_values.map((v: any) => `  • ${v.title}${v.arabic_name ? ` (${v.arabic_name})` : ''}: ${v.description}`).join('\n')}
` : ''}

${result.cultural_teaching_methods && result.cultural_teaching_methods.length > 0 ? `
📖 Cultural Teaching Methods:
${result.cultural_teaching_methods.map((m: any) => `  • ${m.title}: ${m.description}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARENT DISCUSSION GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${result.parent_discussion_guide ? `
Before Reading:
${result.parent_discussion_guide.before_reading?.map((q: string) => `  • ${q}`).join('\n') || '  • No questions available'}

After Reading:
${result.parent_discussion_guide.after_reading?.map((q: string) => `  • ${q}`).join('\n') || '  • No questions available'}
` : 'No discussion guide available.'}

`;
  });

  report += `
═══════════════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════════════

Total Books in Report: ${evaluations.length}

For questions or concerns, please contact the UAE Ministry of Education.
Emirates BookGuard - Protecting Young Minds

Generated by Emirates BookGuard Evaluation System
Report Date: ${timestamp}
═══════════════════════════════════════════════════════════════════
`;

  return report;
}

function formatSystemEvaluation(systemName: string, systemData: any): string {
  if (!systemData) {
    return `${systemName}
  Status: Data not available
`;
  }

  let output = `${systemName}
  Rating: ${systemData.rating || 'Not available'}
  
  Assessment:
  ${systemData.assessment || 'No assessment provided.'}
`;

  if (systemData.concerns && systemData.concerns.length > 0) {
    output += `
  Concerns Addressed:
${systemData.concerns.map((c: string) => `    • ${c}`).join('\n')}
`;
  }

  if (systemData.evidence) {
    output += `
  Evidence:
  ${systemData.evidence}
`;
  }

  if (systemData.min_age !== undefined) {
    output += `
  Minimum Age: ${systemData.min_age}+ years
`;
  }

  return output;
}
