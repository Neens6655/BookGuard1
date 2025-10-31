import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import puppeteer from "puppeteer";
import { storage } from "./storage";
import { insertEvaluationSchema, updateBookMetadataSchema, insertScoringConfigSchema } from "@shared/schema";
import { evaluateBook, deepAnalyzeBook, evaluateNMCStandards } from "./services/openai";
import { extractTextFromFile, extractCoverImage, extractISBN } from "./services/fileProcessor";
import { extractTextWithDeepSeekOCR } from "./services/replicate";
import { searchGoodreadsBook } from "./services/apify";
import { searchAmazonBook } from "./services/amazon";
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

const ocrUpload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for OCR files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF, BMP) are allowed for OCR. For PDFs, use the regular upload.'));
    }
  },
});

/**
 * Sanitize text for safe PostgreSQL storage
 * Removes null bytes and other problematic characters that cause DB errors
 */
function sanitizeTextForDB(text: string): string {
  if (!text) return text;
  
  return text
    // Remove null bytes (0x00) - these cause PostgreSQL errors
    .replace(/\x00/g, '')
    // Remove other control characters that can cause issues (but keep newlines and tabs)
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode to prevent encoding issues
    .normalize('NFC');
}

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
      
      // Cleanup uploaded file on error
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Upload failed" 
      });
    }
  });

  // Upload and evaluate scanned book with OCR
  app.post("/api/evaluate-ocr", ocrUpload.single("file"), async (req, res) => {
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

      // Process OCR file asynchronously
      processOCRFileAsync(evaluation.id, req.file.path, req.file.originalname);

    } catch (error) {
      console.error("OCR upload error:", error);
      
      // Cleanup uploaded file on error
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "OCR upload failed" 
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
          const txtReport = generateTextReport(evaluation.result, evaluation.nmcAssessment, evaluation.goodreadsData);
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

  // Scoring Configuration API Routes
  
  // Get all scoring configurations
  app.get("/api/scoring-configs", async (req, res) => {
    try {
      const configs = await storage.getAllScoringConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Get scoring configs error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get scoring configs" 
      });
    }
  });

  // Get active scoring configuration
  app.get("/api/scoring-configs/active", async (req, res) => {
    try {
      const config = await storage.getActiveScoringConfig();
      if (!config) {
        return res.status(404).json({ error: "No active scoring configuration found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Get active scoring config error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get active scoring config" 
      });
    }
  });

  // Get specific scoring configuration by ID
  app.get("/api/scoring-configs/:id", async (req, res) => {
    try {
      const config = await storage.getScoringConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Scoring configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Get scoring config error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get scoring config" 
      });
    }
  });

  // Create new scoring configuration
  app.post("/api/scoring-configs", async (req, res) => {
    try {
      const validationResult = insertScoringConfigSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validationError.message 
        });
      }

      const config = await storage.createScoringConfig(validationResult.data);
      
      // Create audit log
      await storage.createAuditLog({
        configId: config.id,
        action: 'created',
        changes: null,
        performedBy: req.body.createdBy || 'system',
      });

      res.status(201).json(config);
    } catch (error) {
      console.error("Create scoring config error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create scoring config" 
      });
    }
  });

  // Update scoring configuration
  app.patch("/api/scoring-configs/:id", async (req, res) => {
    try {
      const config = await storage.getScoringConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Scoring configuration not found" });
      }

      const updated = await storage.updateScoringConfig(req.params.id, req.body);
      
      // Create audit log
      await storage.createAuditLog({
        configId: req.params.id,
        action: 'updated',
        changes: req.body,
        performedBy: req.body.performedBy || 'system',
      });

      res.json(updated);
    } catch (error) {
      console.error("Update scoring config error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update scoring config" 
      });
    }
  });

  // Activate scoring configuration
  app.post("/api/scoring-configs/:id/activate", async (req, res) => {
    try {
      const config = await storage.getScoringConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Scoring configuration not found" });
      }

      const success = await storage.activateScoringConfig(
        req.params.id, 
        req.body.performedBy || 'system'
      );
      
      if (!success) {
        return res.status(500).json({ error: "Failed to activate scoring configuration" });
      }

      res.json({ success: true, message: "Configuration activated successfully" });
    } catch (error) {
      console.error("Activate scoring config error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to activate scoring config" 
      });
    }
  });

  // Delete scoring configuration
  app.delete("/api/scoring-configs/:id", async (req, res) => {
    try {
      const config = await storage.getScoringConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Scoring configuration not found" });
      }

      if (config.isActive === 1) {
        return res.status(400).json({ 
          error: "Cannot delete active configuration. Please activate another configuration first." 
        });
      }

      const deleted = await storage.deleteScoringConfig(req.params.id);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete scoring configuration" });
      }

      // Create audit log
      await storage.createAuditLog({
        configId: req.params.id,
        action: 'deleted',
        changes: null,
        performedBy: req.body.performedBy || 'system',
      });

      res.json({ success: true, message: "Configuration deleted successfully" });
    } catch (error) {
      console.error("Delete scoring config error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete scoring config" 
      });
    }
  });

  // Get audit logs
  app.get("/api/scoring-audit-logs", async (req, res) => {
    try {
      const configId = req.query.configId as string | undefined;
      const logs = await storage.getAuditLogs(configId);
      res.json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get audit logs" 
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

  // Generate Filtered Books Report (PDF) - accepts array of book IDs
  app.post("/api/generate-pdf-report", async (req, res) => {
    try {
      const { bookIds } = req.body;

      if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
        return res.status(400).json({ error: "Please provide an array of book IDs" });
      }

      const allEvaluations = await storage.getAllEvaluations();
      
      // Filter evaluations by provided book IDs
      const selectedBooks = allEvaluations.filter(
        (evaluation) => 
          bookIds.includes(evaluation.id) &&
          evaluation.status === "completed" &&
          evaluation.result
      );

      if (selectedBooks.length === 0) {
        return res.status(404).json({ error: "No valid books found with the provided IDs" });
      }

      // Generate PDF report
      const pdfBuffer = await generateWhitelistedBooksPDF(selectedBooks);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Selected_Books_Report_${timestamp}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Filtered report error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate filtered report" 
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
    
    // Evaluate against NMC Standards (parallel system)
    const nmcAssessment = await evaluateNMCStandards(bookText);
    
    // Extract ISBN from book text for improved Amazon matching
    const isbn = extractISBN(bookText);
    if (isbn) {
      console.log(`Extracted ISBN: ${isbn}`);
    }
    
    // Fetch Goodreads data if available
    const goodreadsData = await searchGoodreadsBook(
      result.title || 'Unknown', 
      result.author
    );
    
    // Fetch Amazon age validation data (runs in parallel for UAE marketplace)
    // Pass ISBN, publisher for improved matching accuracy
    const amazonData = await searchAmazonBook(
      result.title || 'Unknown',
      result.author,
      result.publisher,
      isbn
    );
    
    // Update progress: Age Recommendations
    await storage.updateEvaluation(evaluationId, { progress: 95 });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // IMPROVEMENT: Multi-source cover image fallback
    // Priority: Extracted file cover > Goodreads (confidence >50%) > Amazon > Placeholder
    let finalCoverImage = coverImage; // From extracted file
    
    if (!finalCoverImage && goodreadsData?.status === 'ok') {
      // Use Goodreads cover if confidence is reasonable (>50%)
      const goodreadsConfidence = goodreadsData.matchConfidence || 0;
      if (goodreadsConfidence > 50 && goodreadsData.coverImageUrl) {
        finalCoverImage = goodreadsData.coverImageUrl;
        console.log(`Using Goodreads cover image (${goodreadsConfidence}% confidence)`);
      }
    }
    
    if (!finalCoverImage && amazonData?.status === 'ok' && amazonData.coverImageUrl) {
      // Use Amazon cover as fallback
      finalCoverImage = amazonData.coverImageUrl;
      console.log(`Using Amazon cover image as fallback`);
    }
    
    // Update progress: Report Generation & Complete
    await storage.updateEvaluation(evaluationId, { 
      progress: 100, 
      status: "completed",
      result: result,
      extractedText: sanitizeTextForDB(bookText),
      nmcAssessment: nmcAssessment,
      goodreadsData: goodreadsData,
      amazonData: amazonData,
      coverImage: finalCoverImage 
    });

    // Cleanup uploaded file
    await fs.unlink(filePath).catch(console.error);

  } catch (error) {
    console.error("Processing error:", error);
    
    // Determine user-friendly error message
    let errorMessage = "Processing failed";
    
    if (error instanceof Error) {
      // Provide specific error messages based on error type
      if (error.message.includes('No text content could be extracted')) {
        errorMessage = 'Unable to extract text from file. The file may be empty, corrupted, or password-protected.';
      } else if (error.message.includes('Insufficient text content')) {
        errorMessage = 'The uploaded file contains too little text to analyze (minimum 100 characters required).';
      } else if (error.message.includes('Unsupported file type')) {
        errorMessage = 'Unsupported file format. Please upload PDF, Word, TXT, EPUB, or RTF files.';
      } else if (error.message.includes('OpenAI') || error.message.includes('evaluation failed')) {
        errorMessage = 'AI evaluation service temporarily unavailable. Please try again in a few moments.';
      } else if (error.message.includes('API') || error.message.includes('rate limit')) {
        errorMessage = 'Service temporarily busy. Please try again shortly.';
      } else {
        errorMessage = error.message;
      }
    }
    
    await storage.updateEvaluation(evaluationId, { 
      status: "failed",
      result: { error: errorMessage } 
    });
    
    // Cleanup uploaded file
    await fs.unlink(filePath).catch(console.error);
  }
}

async function processOCRFileAsync(evaluationId: string, filePath: string, filename: string) {
  try {
    // Update progress: OCR Text Extraction
    await storage.updateEvaluation(evaluationId, { progress: 10 });
    
    // Update progress: OCR Processing
    await storage.updateEvaluation(evaluationId, { progress: 25 });
    
    // Extract text using DeepSeek OCR via Replicate (optimized for images)
    console.log(`Using DeepSeek OCR for image: ${filename}`);
    const bookText = await extractTextWithDeepSeekOCR(filePath);
    
    console.log(`✓ DeepSeek OCR completed: ${bookText.length} characters extracted from ${filename}`);
    
    // Update progress: Language Detection
    await storage.updateEvaluation(evaluationId, { progress: 35 });
    
    // Simulate processing delay for UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update progress: Content Analysis
    await storage.updateEvaluation(evaluationId, { progress: 50 });
    
    // Simulate more processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update progress: Cultural Assessment
    await storage.updateEvaluation(evaluationId, { progress: 65 });
    
    // Call OpenAI for evaluation
    const result = await evaluateBook(bookText);
    
    // Update progress: Safety Scoring
    await storage.updateEvaluation(evaluationId, { progress: 80 });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Evaluate against NMC Standards (parallel system)
    const nmcAssessment = await evaluateNMCStandards(bookText);
    
    // Extract ISBN from book text for improved Amazon matching
    const isbn = extractISBN(bookText);
    if (isbn) {
      console.log(`Extracted ISBN: ${isbn}`);
    }
    
    // Fetch Goodreads data if available
    const goodreadsData = await searchGoodreadsBook(
      result.title || 'Unknown', 
      result.author
    );
    
    // Fetch Amazon age validation data (runs in parallel for UAE marketplace)
    const amazonData = await searchAmazonBook(
      result.title || 'Unknown',
      result.author,
      result.publisher,
      isbn
    );
    
    // Update progress: Age Recommendations
    await storage.updateEvaluation(evaluationId, { progress: 95 });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For OCR files, prioritize external cover images since we can't extract from scanned images
    let finalCoverImage = null;
    
    if (goodreadsData?.status === 'ok') {
      const goodreadsConfidence = goodreadsData.matchConfidence || 0;
      if (goodreadsConfidence > 50 && goodreadsData.coverImageUrl) {
        finalCoverImage = goodreadsData.coverImageUrl;
        console.log(`Using Goodreads cover image (${goodreadsConfidence}% confidence)`);
      }
    }
    
    if (!finalCoverImage && amazonData?.status === 'ok' && amazonData.coverImageUrl) {
      finalCoverImage = amazonData.coverImageUrl;
      console.log(`Using Amazon cover image as fallback`);
    }
    
    // Update progress: Report Generation & Complete
    await storage.updateEvaluation(evaluationId, { 
      progress: 100, 
      status: "completed",
      result: result,
      extractedText: sanitizeTextForDB(bookText),
      nmcAssessment: nmcAssessment,
      goodreadsData: goodreadsData,
      amazonData: amazonData,
      coverImage: finalCoverImage 
    });

    // Cleanup uploaded file
    await fs.unlink(filePath).catch(console.error);

  } catch (error) {
    console.error("OCR processing error:", error);
    
    // Determine user-friendly error message
    let errorMessage = "OCR processing failed";
    
    if (error instanceof Error) {
      if (error.message.includes('REPLICATE_API_TOKEN')) {
        errorMessage = 'Replicate API key not configured. Please contact administrator.';
      } else if (error.message.includes('DeepSeek OCR')) {
        errorMessage = 'OCR service temporarily unavailable. Please try again in a few moments.';
      } else if (error.message.includes('OCR extraction failed')) {
        errorMessage = 'Unable to extract text from image. The file may be corrupted or unreadable.';
      } else if (error.message.includes('DeepInfra API error')) {
        errorMessage = 'OCR service temporarily unavailable. Please try again in a few moments.';
      } else if (error.message.includes('Insufficient text content')) {
        errorMessage = 'The scanned image contains too little text to analyze (minimum 100 characters required).';
      } else if (error.message.includes('OpenAI') || error.message.includes('evaluation failed')) {
        errorMessage = 'AI evaluation service temporarily unavailable. Please try again in a few moments.';
      } else {
        errorMessage = error.message;
      }
    }
    
    await storage.updateEvaluation(evaluationId, { 
      status: "failed",
      result: { error: errorMessage } 
    });
    
    // Cleanup uploaded file
    await fs.unlink(filePath).catch(console.error);
  }
}

function generateTextReport(result: any, nmcAssessment?: any, goodreadsData?: any): string {
  let report = `
📚 Book Title: ${result.title || 'Unknown'}${result.author ? ` by ${result.author}` : ''}

${goodreadsData?.status === 'ok' && goodreadsData?.rating ? `⭐ Goodreads Rating: ${goodreadsData.rating.toFixed(1)}/5.0 (${goodreadsData.ratingsCount?.toLocaleString() || 'N/A'} ratings)\n` : ''}📊 Whitelist Score: ${result.whitelist_score || 'N/A'} / 100
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
UAE Recommended Minimum Age: ${result.recommended_minimum_age || 'N/A'}

${result.age_verdicts ? Object.entries(result.age_verdicts).map(([age, verdict]) => `${age}: ${verdict}`).join('\n') : 'No age verdicts available'}
`;

  // Add NMC Standards section if available
  if (nmcAssessment && nmcAssessment.enabled) {
    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ NMC Standards Assessment
Final NMC Age Band: ${nmcAssessment.finalAgeBand}

Category Breakdown:
─────────────────────────────────────────────
🎰 Gambling Content: ${nmcAssessment.categories.gambling.ageBand}
   ${nmcAssessment.categories.gambling.detected ? '⚠️ Detected' : '✓ Not Detected'}
   ${nmcAssessment.categories.gambling.evidence}

📝 Language & Profanity: ${nmcAssessment.categories.language.ageBand}
   ${nmcAssessment.categories.language.detected ? '⚠️ Detected' : '✓ Not Detected'}
   ${nmcAssessment.categories.language.evidence}

⚔️ Violence & Terror: ${nmcAssessment.categories.violence.ageBand}
   ${nmcAssessment.categories.violence.detected ? '⚠️ Detected' : '✓ Not Detected'}
   ${nmcAssessment.categories.violence.evidence}

🍺 Alcohol, Smoking & Drugs: ${nmcAssessment.categories.substanceUse.ageBand}
   ${nmcAssessment.categories.substanceUse.detected ? '⚠️ Detected' : '✓ Not Detected'}
   ${nmcAssessment.categories.substanceUse.evidence}

💕 Sex & Nudity: ${nmcAssessment.categories.sexualContent.ageBand}
   ${nmcAssessment.categories.sexualContent.detected ? '⚠️ Detected' : '✓ Not Detected'}
   ${nmcAssessment.categories.sexualContent.evidence}
`;
  }

  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Key Drivers
${result.key_drivers?.map((d: string) => `- ${d}`).join('\n') || '- No key drivers available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return report;
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
            UAE Ministry of Education - UAE BookGuard
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
UAE BookGuard - Protecting Young Minds

Generated by UAE BookGuard Evaluation System
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
          <div class="age-badge">UAE: ${result.recommended_age || result.recommended_minimum_age || 'Not specified'}</div>
          <p>${result.age_rationale || 'No rationale provided.'}</p>
        </div>

        ${evaluation.nmcAssessment && evaluation.nmcAssessment.enabled ? `
          <div class="section">
            <h3>🛡️ NMC Standards Assessment</h3>
            <div class="age-badge" style="background: linear-gradient(135deg, #a855f7, #7c3aed);">NMC: ${evaluation.nmcAssessment.finalAgeBand}</div>
            <p style="margin-bottom: 10px; font-style: italic; color: #666;">Content evaluation across 5 National Media Council regulatory categories:</p>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 6px; margin-top: 8px;">
              <div style="padding: 8px; border-radius: 6px; border-left: 3px solid ${evaluation.nmcAssessment.categories.gambling.detected ? '#a855f7' : '#10b981'}; background: ${evaluation.nmcAssessment.categories.gambling.detected ? '#faf5ff' : '#f0fdf4'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="font-size: 10px;">🎰 Gambling</strong>
                  <span style="font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${evaluation.nmcAssessment.categories.gambling.detected ? '#a855f7' : '#10b981'}; color: white;">${evaluation.nmcAssessment.categories.gambling.ageBand}</span>
                </div>
                <p style="font-size: 9px; color: #555;">${evaluation.nmcAssessment.categories.gambling.evidence}</p>
              </div>
              
              <div style="padding: 8px; border-radius: 6px; border-left: 3px solid ${evaluation.nmcAssessment.categories.language.detected ? '#f59e0b' : '#10b981'}; background: ${evaluation.nmcAssessment.categories.language.detected ? '#fffbeb' : '#f0fdf4'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="font-size: 10px;">📝 Language & Profanity</strong>
                  <span style="font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${evaluation.nmcAssessment.categories.language.detected ? '#f59e0b' : '#10b981'}; color: white;">${evaluation.nmcAssessment.categories.language.ageBand}</span>
                </div>
                <p style="font-size: 9px; color: #555;">${evaluation.nmcAssessment.categories.language.evidence}</p>
              </div>
              
              <div style="padding: 8px; border-radius: 6px; border-left: 3px solid ${evaluation.nmcAssessment.categories.violence.detected ? '#ef4444' : '#10b981'}; background: ${evaluation.nmcAssessment.categories.violence.detected ? '#fef2f2' : '#f0fdf4'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="font-size: 10px;">⚔️ Violence & Terror</strong>
                  <span style="font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${evaluation.nmcAssessment.categories.violence.detected ? '#ef4444' : '#10b981'}; color: white;">${evaluation.nmcAssessment.categories.violence.ageBand}</span>
                </div>
                <p style="font-size: 9px; color: #555;">${evaluation.nmcAssessment.categories.violence.evidence}</p>
              </div>
              
              <div style="padding: 8px; border-radius: 6px; border-left: 3px solid ${evaluation.nmcAssessment.categories.substanceUse.detected ? '#fb923c' : '#10b981'}; background: ${evaluation.nmcAssessment.categories.substanceUse.detected ? '#fff7ed' : '#f0fdf4'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="font-size: 10px;">🍺 Alcohol, Smoking & Drugs</strong>
                  <span style="font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${evaluation.nmcAssessment.categories.substanceUse.detected ? '#fb923c' : '#10b981'}; color: white;">${evaluation.nmcAssessment.categories.substanceUse.ageBand}</span>
                </div>
                <p style="font-size: 9px; color: #555;">${evaluation.nmcAssessment.categories.substanceUse.evidence}</p>
              </div>
              
              <div style="padding: 8px; border-radius: 6px; border-left: 3px solid ${evaluation.nmcAssessment.categories.sexualContent.detected ? '#ec4899' : '#10b981'}; background: ${evaluation.nmcAssessment.categories.sexualContent.detected ? '#fdf2f8' : '#f0fdf4'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="font-size: 10px;">💕 Sex & Nudity</strong>
                  <span style="font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${evaluation.nmcAssessment.categories.sexualContent.detected ? '#ec4899' : '#10b981'}; color: white;">${evaluation.nmcAssessment.categories.sexualContent.ageBand}</span>
                </div>
                <p style="font-size: 9px; color: #555;">${evaluation.nmcAssessment.categories.sexualContent.evidence}</p>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="section">
          <h3>💎 Key Values & Lessons</h3>
          <p>${result.lessons_learned || 'No lessons documented.'}</p>
          ${result.key_drivers && result.key_drivers.length > 0 ? `
            <ul class="values-list">
              ${result.key_drivers.map((d: string) => `<li>${d}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
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
      padding: 20px;
      font-size: 11px;
    }

    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 25px;
      border-radius: 15px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
      text-align: center;
    }

    .logo {
      width: 50px;
      height: 50px;
      background: white;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
      font-weight: 700;
    }

    .header .subtitle {
      font-size: 12px;
      opacity: 0.95;
      margin-bottom: 12px;
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
      padding: 10px 20px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }

    .stat-number {
      font-size: 20px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 10px;
      opacity: 0.9;
      margin-top: 3px;
    }

    .book-card {
      background: white;
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      page-break-inside: avoid;
    }

    .book-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      border-bottom: 2px solid #10b981;
      padding-bottom: 10px;
    }

    .book-header h2 {
      font-size: 16px;
      color: #1a1a1a;
      flex: 1;
      line-height: 1.2;
    }

    .book-number {
      color: #10b981;
      margin-right: 10px;
    }

    .badge {
      padding: 5px 12px;
      border-radius: 15px;
      font-weight: 600;
      font-size: 10px;
      white-space: nowrap;
    }

    .badge.whitelisted {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .book-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
      padding: 10px;
      background: #f8fffe;
      border-radius: 8px;
      border-left: 3px solid #10b981;
    }

    .meta-item {
      font-size: 10px;
      color: #555;
    }

    .meta-item strong {
      color: #10b981;
      margin-right: 5px;
    }

    .section {
      margin: 12px 0;
    }

    .section h3 {
      font-size: 13px;
      color: #1a1a1a;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .section p {
      line-height: 1.4;
      color: #555;
      margin-bottom: 6px;
      font-size: 10px;
    }

    .system-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      border-left: 3px solid #10b981;
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
      font-size: 11px;
      margin-bottom: 5px;
      color: #1a1a1a;
    }

    .system-card p {
      font-size: 10px;
      line-height: 1.3;
    }

    .rating-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .age-badge {
      display: inline-block;
      background: linear-gradient(135deg, #a855f7, #7c3aed);
      color: white;
      padding: 6px 15px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
    }

    .min-age {
      font-size: 10px;
      color: #059669;
      font-weight: 600;
      margin-top: 5px;
    }

    .values-list {
      list-style: none;
      padding: 0;
      margin: 8px 0;
    }

    .values-list li {
      padding: 5px 0;
      padding-left: 20px;
      position: relative;
      line-height: 1.3;
      font-size: 10px;
    }

    .values-list li:before {
      content: "✨";
      position: absolute;
      left: 0;
      font-size: 10px;
    }

    .footer {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 15px;
      margin-top: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    .footer h3 {
      color: #10b981;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .footer p {
      color: #666;
      margin: 3px 0;
      font-size: 10px;
    }

    .methodology-page {
      background: white;
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      page-break-before: always;
      page-break-after: always;
    }

    .methodology-title {
      font-size: 18px;
      color: #10b981;
      text-align: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #10b981;
    }

    .methodology-intro {
      margin-bottom: 12px;
      padding: 10px;
      background: linear-gradient(135deg, #f0fdf4 0%, #e8f5e9 100%);
      border-radius: 8px;
    }

    .methodology-intro p {
      font-size: 10px;
      line-height: 1.4;
      color: #333;
      margin: 0;
    }

    .systems-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }

    .system-detail {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 8px;
      border-left: 3px solid #10b981;
    }

    .system-detail.cultural-detail {
      border-left-color: #10b981;
      background: linear-gradient(to right, #f0fdf4, #ffffff);
    }

    .system-detail.safety-detail {
      border-left-color: #3b82f6;
      background: linear-gradient(to right, #eff6ff, #ffffff);
    }

    .system-detail.theme-detail {
      border-left-color: #a855f7;
      background: linear-gradient(to right, #faf5ff, #ffffff);
    }

    .system-detail.language-detail {
      border-left-color: #f97316;
      background: linear-gradient(to right, #fff7ed, #ffffff);
    }

    .system-detail h3 {
      font-size: 11px;
      margin-bottom: 5px;
      color: #1a1a1a;
    }

    .system-detail p {
      font-size: 9px;
      line-height: 1.3;
      margin: 3px 0;
      color: #555;
    }

    .system-detail ul {
      margin: 3px 0;
      padding-left: 15px;
    }

    .system-detail li {
      font-size: 9px;
      line-height: 1.3;
      margin: 2px 0;
    }

    .verdict-section {
      margin-bottom: 12px;
    }

    .verdict-section h3 {
      font-size: 12px;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-align: center;
    }

    .verdict-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }

    .verdict-item {
      padding: 8px;
      border-radius: 8px;
      text-align: center;
    }

    .verdict-item.whitelisted-verdict {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 2px solid #10b981;
    }

    .verdict-item.guidance-verdict {
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
      border: 2px solid #f59e0b;
    }

    .verdict-item.rejected-verdict {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border: 2px solid #ef4444;
    }

    .verdict-item h4 {
      font-size: 11px;
      margin-bottom: 5px;
    }

    .verdict-item p {
      font-size: 9px;
      line-height: 1.3;
      margin: 0;
    }

    .methodology-footer {
      background: #f8fffe;
      padding: 8px;
      border-radius: 8px;
      border-left: 3px solid #10b981;
    }

    .methodology-footer p {
      font-size: 9px;
      line-height: 1.3;
      margin: 3px 0;
      color: #555;
    }

    @media print {
      body {
        background: white;
        padding: 20px;
      }
      
      /* Force methodology page to be on its own page */
      .methodology-page {
        page-break-before: always;
        page-break-after: always;
        page-break-inside: avoid;
        break-inside: avoid;
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
    <div class="subtitle">UAE BookGuard</div>
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

  <div class="methodology-page">
    <h2 class="methodology-title">📋 Evaluation Methodology & Scoring System</h2>
    
    <div class="methodology-intro">
      <p>UAE BookGuard employs a rigorous 4-System Evaluation Framework to assess children's and family books for content appropriateness, cultural alignment, and age suitability. Each book undergoes comprehensive AI-powered analysis using advanced language models trained to evaluate content against specific criteria.</p>
    </div>

    <div class="systems-grid">
      <div class="system-detail cultural-detail">
        <h3>System 1: Cultural Values Assessment</h3>
        <p><strong>Purpose:</strong> Evaluates alignment with Islamic, Arab, and UAE cultural ethics and values.</p>
        <p><strong>Rating Scale:</strong></p>
        <ul>
          <li><strong>Safe:</strong> Fully aligned with cultural values, promotes positive Islamic/Arab principles</li>
          <li><strong>Moderate:</strong> Minor cultural considerations, may require context or discussion</li>
          <li><strong>Severe:</strong> Contains elements that conflict with core cultural values (automatic rejection)</li>
        </ul>
        <p><strong>Key Criteria:</strong> Religious respect, family values, modesty standards, cultural traditions, moral lessons</p>
      </div>

      <div class="system-detail safety-detail">
        <h3>System 2: Child Safety Assessment</h3>
        <p><strong>Purpose:</strong> Identifies potentially harmful content including violence, inappropriate themes, or disturbing imagery.</p>
        <p><strong>Rating Scale:</strong></p>
        <ul>
          <li><strong>Safe:</strong> Age-appropriate content with no concerning elements</li>
          <li><strong>Moderate:</strong> Mild themes that may require parental guidance or context</li>
          <li><strong>Severe:</strong> Contains harmful, disturbing, or inappropriate content (automatic rejection)</li>
        </ul>
        <p><strong>Key Criteria:</strong> Violence levels, scary content, age-inappropriate themes, emotional impact, character behavior</p>
      </div>

      <div class="system-detail theme-detail">
        <h3>System 3: Theme Complexity Assessment</h3>
        <p><strong>Purpose:</strong> Evaluates thematic sophistication and developmental readiness requirements.</p>
        <p><strong>Scoring:</strong> Age-based recommendations (e.g., "8-10 years", "6+ years")</p>
        <p><strong>Key Criteria:</strong> Abstract concepts, moral complexity, emotional depth, narrative structure, psychological themes, required cognitive maturity</p>
      </div>

      <div class="system-detail language-detail">
        <h3>System 4: Language Complexity Assessment</h3>
        <p><strong>Purpose:</strong> Analyzes reading level, vocabulary difficulty, and linguistic sophistication.</p>
        <p><strong>Scoring:</strong> Minimum age recommendations based on language proficiency</p>
        <p><strong>Key Criteria:</strong> Vocabulary difficulty, sentence complexity, reading fluency requirements, comprehension level, linguistic patterns</p>
      </div>
    </div>

    <div class="verdict-section">
      <h3>Final Verdict Determination</h3>
      <div class="verdict-grid">
        <div class="verdict-item whitelisted-verdict">
          <h4>✅ Whitelisted</h4>
          <p>Book is safe, culturally aligned, and appropriate for the recommended age group. Passes all four systems with Safe ratings in Systems 1 & 2.</p>
        </div>
        <div class="verdict-item guidance-verdict">
          <h4>🟡 Parent Guidance</h4>
          <p>Book is generally safe but contains elements requiring parental context, discussion, or supervision. May have Moderate ratings in Systems 1 or 2.</p>
        </div>
        <div class="verdict-item rejected-verdict">
          <h4>🚫 Not Whitelisted</h4>
          <p>Book contains Severe violations in System 1 (Cultural Values) or System 2 (Child Safety). Automatic rejection regardless of other factors.</p>
        </div>
      </div>
    </div>

    <div class="methodology-footer">
      <p><strong>AI Analysis:</strong> Powered by GPT-4o with evidence-based evaluation including textual quotes, page references, and detailed reasoning.</p>
      <p><strong>Report Contents:</strong> Each whitelisted book includes executive summary, all 4 systems assessments, age recommendations, key lessons, and cultural values alignment.</p>
    </div>
  </div>

  ${booksHTML}

  <div class="footer">
    <h3>🌟 UAE BookGuard</h3>
    <p>Protecting Young Minds • Building Future Generations</p>
    <p style="font-size: 12px; color: #999; margin-top: 20px;">Generated by UAE BookGuard Evaluation System • ${timestamp}</p>
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
