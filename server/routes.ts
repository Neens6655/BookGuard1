import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import puppeteer from "puppeteer";
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

  // Generate Whitelisted Books Report (PDF)
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

      // Generate PDF report
      const pdfBuffer = await generateWhitelistedBooksPDF(whitelistedBooks);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Whitelisted_Books_Report_${timestamp}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);

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

// Generate HTML template for PDF report
function generateWhitelistedBooksHTML(evaluations: any[]): string {
  const timestamp = new Date().toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  });

  // Sort books alphabetically by title
  const sortedBooks = evaluations.sort((a, b) => {
    const titleA = (a.result?.title || a.filename || '').toLowerCase();
    const titleB = (b.result?.title || b.filename || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });

  const booksHTML = sortedBooks.map((evaluation, index) => {
    const result = evaluation.result || {};
    const bookNumber = index + 1;

    return `
      <div class="book-card">
        <div class="book-header">
          <h2><span class="book-number">${bookNumber}.</span> ${result.title || evaluation.filename || 'Unknown Title'}</h2>
          <div class="badge whitelisted">✅ Whitelisted</div>
        </div>

        <div class="book-meta">
          <div class="meta-item"><strong>Author:</strong> ${result.author || 'Not available'}</div>
          <div class="meta-item"><strong>Publisher:</strong> ${result.publisher || 'Not available'}</div>
          <div class="meta-item"><strong>Language:</strong> ${result.language || 'Not available'}</div>
          <div class="meta-item"><strong>Score:</strong> ${result.whitelist_score || 'N/A'}/100</div>
        </div>

        <div class="section">
          <h3>📝 Summary</h3>
          <p>${result.executive_summary || 'No summary available.'}</p>
        </div>

        <div class="section">
          <h3>✨ Why This Book is Whitelisted</h3>
          
          <div class="system-card cultural">
            <h4>🕌 Cultural Values</h4>
            <div class="rating-badge">${result.system1_uae_values?.rating || 'N/A'}</div>
            <p>${result.system1_uae_values?.assessment || 'No assessment available.'}</p>
          </div>

          <div class="system-card safety">
            <h4>🛡️ Child Safety</h4>
            <div class="rating-badge">${result.system2_child_safety?.rating || 'N/A'}</div>
            <p>${result.system2_child_safety?.assessment || 'No assessment available.'}</p>
          </div>

          <div class="system-card theme">
            <h4>🎭 Theme Complexity</h4>
            <div class="rating-badge">${result.system3_theme_complexity?.rating || 'N/A'}</div>
            <p>${result.system3_theme_complexity?.assessment || 'No assessment available.'}</p>
            ${result.system3_theme_complexity?.min_age ? `<p class="min-age">Minimum Age: ${result.system3_theme_complexity.min_age}+ years</p>` : ''}
          </div>

          <div class="system-card language">
            <h4>📚 Language Complexity</h4>
            <div class="rating-badge">${result.system4_language_complexity?.rating || 'N/A'}</div>
            <p>${result.system4_language_complexity?.assessment || 'No assessment available.'}</p>
            ${result.system4_language_complexity?.min_age ? `<p class="min-age">Minimum Age: ${result.system4_language_complexity.min_age}+ years</p>` : ''}
          </div>
        </div>

        <div class="section">
          <h3>👨‍👩‍👧 Perfect For Ages</h3>
          <div class="age-badge">${result.recommended_age || result.recommended_minimum_age || 'Not specified'}</div>
          <p>${result.age_rationale || 'No rationale provided.'}</p>
        </div>

        <div class="section">
          <h3>💎 Key Values & Lessons</h3>
          <p>${result.lessons_learned || 'No lessons documented.'}</p>
          ${result.key_drivers && result.key_drivers.length > 0 ? `
            <ul class="values-list">
              ${result.key_drivers.map((d: string) => `<li>${d}</li>`).join('')}
            </ul>
          ` : ''}
        </div>

        ${result.parent_discussion_guide ? `
          <div class="section discussion-guide">
            <h3>💬 Parent Discussion Guide</h3>
            <div class="discussion-section">
              <h4>Before Reading:</h4>
              <ul>
                ${result.parent_discussion_guide.before_reading?.map((q: string) => `<li>${q}</li>`).join('') || '<li>No questions available</li>'}
              </ul>
            </div>
            <div class="discussion-section">
              <h4>After Reading:</h4>
              <ul>
                ${result.parent_discussion_guide.after_reading?.map((q: string) => `<li>${q}</li>`).join('') || '<li>No questions available</li>'}
              </ul>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%);
      color: #333;
      padding: 40px;
    }

    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px;
      border-radius: 20px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
      text-align: center;
    }

    .logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin-bottom: 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header .subtitle {
      font-size: 18px;
      opacity: 0.95;
      margin-bottom: 20px;
    }

    .header .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .stat-item {
      background: rgba(255,255,255,0.15);
      padding: 15px 30px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .stat-number {
      font-size: 32px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 5px;
    }

    .book-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      page-break-inside: avoid;
    }

    .book-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
    }

    .book-header h2 {
      font-size: 28px;
      color: #1a1a1a;
      flex: 1;
      line-height: 1.3;
    }

    .book-number {
      color: #10b981;
      margin-right: 10px;
    }

    .badge {
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
    }

    .badge.whitelisted {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .book-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fffe;
      border-radius: 12px;
      border-left: 4px solid #10b981;
    }

    .meta-item {
      font-size: 14px;
      color: #555;
    }

    .meta-item strong {
      color: #10b981;
      margin-right: 8px;
    }

    .section {
      margin: 30px 0;
    }

    .section h3 {
      font-size: 22px;
      color: #1a1a1a;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section p {
      line-height: 1.8;
      color: #555;
      margin-bottom: 15px;
    }

    .system-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #10b981;
      position: relative;
    }

    .system-card.cultural {
      border-left-color: #10b981;
      background: linear-gradient(to right, #f0fdf4, #ffffff);
    }

    .system-card.safety {
      border-left-color: #3b82f6;
      background: linear-gradient(to right, #eff6ff, #ffffff);
    }

    .system-card.theme {
      border-left-color: #a855f7;
      background: linear-gradient(to right, #faf5ff, #ffffff);
    }

    .system-card.language {
      border-left-color: #f97316;
      background: linear-gradient(to right, #fff7ed, #ffffff);
    }

    .system-card h4 {
      font-size: 18px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }

    .rating-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .age-badge {
      display: inline-block;
      background: linear-gradient(135deg, #a855f7, #7c3aed);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
    }

    .min-age {
      font-size: 13px;
      color: #059669;
      font-weight: 600;
      margin-top: 8px;
    }

    .values-list {
      list-style: none;
      padding: 0;
      margin: 15px 0;
    }

    .values-list li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
      line-height: 1.6;
    }

    .values-list li:before {
      content: "✨";
      position: absolute;
      left: 0;
    }

    .discussion-guide {
      background: #fff7ed;
      padding: 25px;
      border-radius: 15px;
      border: 2px solid #fb923c;
    }

    .discussion-section {
      margin: 20px 0;
    }

    .discussion-section h4 {
      color: #ea580c;
      font-size: 16px;
      margin-bottom: 12px;
    }

    .discussion-section ul {
      padding-left: 20px;
    }

    .discussion-section li {
      margin: 10px 0;
      line-height: 1.6;
      color: #555;
    }

    .footer {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 20px;
      margin-top: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    .footer h3 {
      color: #10b981;
      margin-bottom: 10px;
    }

    .footer p {
      color: #666;
      margin: 5px 0;
    }

    @media print {
      body {
        background: white;
        padding: 20px;
      }
      
      /* Prevent page breaks inside major content blocks */
      .book-card,
      .section,
      .system-card,
      .discussion-guide,
      .discussion-section {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Keep headings with their content */
      h2, h3, h4 {
        page-break-after: avoid;
        break-after: avoid;
      }
      
      /* Keep meta info together */
      .book-meta {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Prevent orphans and widows */
      p, li {
        orphans: 3;
        widows: 3;
      }
      
      /* Keep age recommendations together */
      .age-badge,
      .min-age {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Keep values list items together */
      .values-list li {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📚</div>
    <h1>Whitelisted Books Report</h1>
    <div class="subtitle">Emirates BookGuard - UAE Ministry of Education</div>
    <div class="subtitle">Celebrating books that inspire, protect, and uphold our values</div>
    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">${evaluations.length}</div>
        <div class="stat-label">Whitelisted Books</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Report Generated</div>
        <div class="stat-number" style="font-size: 16px;">${timestamp}</div>
      </div>
    </div>
  </div>

  ${booksHTML}

  <div class="footer">
    <h3>🌟 Emirates BookGuard</h3>
    <p>Protecting Young Minds • Building Future Generations</p>
    <p style="margin-top: 20px; font-size: 14px;">For questions or support, please contact the UAE Ministry of Education</p>
    <p style="font-size: 12px; color: #999; margin-top: 20px;">Generated by Emirates BookGuard Evaluation System • ${timestamp}</p>
  </div>
</body>
</html>
  `;
}

// Generate PDF from HTML using Puppeteer
async function generateWhitelistedBooksPDF(evaluations: any[]): Promise<Buffer> {
  const html = generateWhitelistedBooksHTML(evaluations);
  
  // Find chromium executable dynamically
  const { execSync } = await import('child_process');
  let chromiumPath = '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
  try {
    chromiumPath = execSync('which chromium').toString().trim();
  } catch (error) {
    console.warn('Could not find chromium with which command, using default path');
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromiumPath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
