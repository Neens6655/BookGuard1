import { promises as fs } from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
// @ts-ignore - epub-parser doesn't have TypeScript types
import EPub from 'epub-parser';
// @ts-ignore - rtf-parser doesn't have TypeScript types
import rtfParse from 'rtf-parser';
import AdmZip from 'adm-zip';
import { createCanvas } from 'canvas';

// Use require for CommonJS modules
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

// Increased text limit to utilize GPT-4o's 128K token context window
// 100,000 chars ≈ 25,000 words ≈ 200 pages (uses ~40% of GPT-4o capacity)
const MAX_CHARS = 100000;

export async function extractTextFromFile(filePath: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  
  try {
    let extractedText: string;
    
    switch (ext) {
      case '.txt':
        extractedText = await extractFromTxt(filePath);
        break;
      case '.pdf':
        extractedText = await extractFromPdf(filePath);
        break;
      case '.doc':
      case '.docx':
        extractedText = await extractFromWord(filePath);
        break;
      case '.epub':
        extractedText = await extractFromEpub(filePath);
        break;
      case '.rtf':
        extractedText = await extractFromRtf(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
    
    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content could be extracted from the file. The file may be empty or corrupted.');
    }
    
    if (extractedText.trim().length < 100) {
      throw new Error('Insufficient text content extracted (minimum 100 characters required). Please upload a complete book file.');
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}

async function extractFromTxt(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return smartExtract(content);
}

async function extractFromPdf(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return smartExtract(data.text);
}

async function extractFromWord(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return smartExtract(result.value);
}

async function extractFromEpub(filePath: string): Promise<string> {
  try {
    const epub = await EPub.parse(filePath);
    
    // Extract text from all sections
    let fullText = '';
    
    // Add title and author if available
    if (epub.metadata?.title) {
      fullText += `${epub.metadata.title}\n\n`;
    }
    if (epub.metadata?.creator) {
      fullText += `By ${epub.metadata.creator}\n\n`;
    }
    
    // Extract content from sections
    if (epub.sections) {
      for (const section of epub.sections) {
        if (section.htmlString) {
          // Strip HTML tags and get plain text
          const text = section.htmlString
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          fullText += text + '\n\n';
        }
      }
    }
    
    return smartExtract(fullText);
  } catch (error) {
    console.error('EPUB parsing error:', error);
    throw new Error(`Failed to parse EPUB file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractFromRtf(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const rtfContent = dataBuffer.toString('utf-8');
    
    // Parse RTF to plain text using callback-based API
    const doc = await new Promise<any>((resolve, reject) => {
      rtfParse.string(rtfContent, (err: any, doc: any) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
    
    let fullText = '';
    
    // Extract text content from RTF document
    if (doc && doc.content) {
      fullText = extractTextFromRtfNode(doc.content);
    }
    
    return smartExtract(fullText);
  } catch (error) {
    console.error('RTF parsing error:', error);
    throw new Error(`Failed to parse RTF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to recursively extract text from RTF nodes
function extractTextFromRtfNode(node: any): string {
  if (typeof node === 'string') {
    return node;
  }
  
  if (Array.isArray(node)) {
    return node.map(extractTextFromRtfNode).join('');
  }
  
  if (node && typeof node === 'object') {
    if (node.content) {
      return extractTextFromRtfNode(node.content);
    }
    if (node.value) {
      return node.value;
    }
  }
  
  return '';
}

// Smart extraction strategy for long texts with research-backed sampling
// Uses enhanced 3-point sampling to avoid "lost in the middle" LLM issue
function smartExtract(text: string): string {
  if (text.length <= MAX_CHARS) {
    return text;
  }
  
  // Research-backed allocation: 35% beginning, 30% middle, 35% end
  // Overlap: 15% between sections to preserve narrative continuity
  const beginningSize = Math.floor(MAX_CHARS * 0.35);
  const middleSize = Math.floor(MAX_CHARS * 0.30);
  const endSize = Math.floor(MAX_CHARS * 0.35);
  const overlapSize = Math.floor(beginningSize * 0.15); // 15% overlap
  
  // Extract beginning section
  const beginning = text.slice(0, beginningSize);
  
  // Extract middle section (from center, with overlap from beginning)
  const middleStart = Math.floor(text.length / 2) - Math.floor(middleSize / 2);
  const middleWithOverlap = text.slice(
    Math.max(0, middleStart - overlapSize),
    middleStart + middleSize + overlapSize
  );
  
  // Extract end section (with overlap from middle)
  const endStart = Math.max(0, text.length - endSize - overlapSize);
  const end = text.slice(endStart);
  
  return `${beginning}\n\n[... continuing story ...]\n\n${middleWithOverlap}\n\n[... approaching conclusion ...]\n\n${end}`;
}

// Extract cover image from file and return as base64 data URL
export async function extractCoverImage(filePath: string, filename: string): Promise<string | null> {
  const ext = path.extname(filename).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        // PDF cover extraction removed - rely on Goodreads covers instead
        return null;
      case '.epub':
        return await extractCoverFromEpub(filePath);
      case '.doc':
      case '.docx':
        return await extractCoverFromWord(filePath);
      case '.txt':
      case '.rtf':
        // Text and RTF files don't have cover images
        return null;
      default:
        return null;
    }
  } catch (error) {
    console.error('Cover extraction error:', error);
    return null;
  }
}

// PDF cover extraction removed - causes rendering errors
// Users will see Goodreads covers when available, or placeholder icons

async function extractCoverFromEpub(filePath: string): Promise<string | null> {
  try {
    const epub = await EPub.parse(filePath);
    
    // Get cover image ID from metadata
    const coverImageId = epub.metadata?.cover;
    
    if (!coverImageId || !epub.manifest) {
      return null;
    }
    
    // Find cover image in manifest
    const coverManifest = epub.manifest[coverImageId];
    if (!coverManifest) {
      return null;
    }
    
    // Read the image file from the EPUB (which is a ZIP)
    const zip = new AdmZip(filePath);
    const coverEntry = zip.getEntry(coverManifest.href);
    
    if (!coverEntry) {
      return null;
    }
    
    // Get image buffer
    const imageBuffer = coverEntry.getData();
    
    // Determine MIME type from file extension or manifest
    const mimeType = coverManifest['media-type'] || 'image/jpeg';
    
    // Convert to base64 data URL
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return dataUrl;
  } catch (error) {
    console.error('EPUB cover extraction error:', error);
    return null;
  }
}

async function extractCoverFromWord(filePath: string): Promise<string | null> {
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    
    // Look for images in word/media/ folder
    // Typically, the first image is the cover
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('word/media/')) {
        const imageBuffer = entry.getData();
        
        // Determine MIME type from file extension
        const ext = path.extname(entry.entryName).toLowerCase();
        const mimeType = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        }[ext] || 'image/jpeg';
        
        // Convert to base64 data URL
        const base64 = imageBuffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        return dataUrl;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Word cover extraction error:', error);
    return null;
  }
}
