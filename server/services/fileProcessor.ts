import { promises as fs } from 'fs';
import path from 'path';
import mammoth from 'mammoth';

export async function extractTextFromFile(filePath: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  
  try {
    switch (ext) {
      case '.txt':
        return await extractFromTxt(filePath);
      case '.pdf':
        return await extractFromPdf(filePath);
      case '.doc':
      case '.docx':
        return await extractFromWord(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}

async function extractFromTxt(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Safety limit for large books (same as Python version)
  return content.slice(0, 18000);
}

async function extractFromPdf(filePath: string): Promise<string> {
  // @ts-ignore - pdf-parse uses CommonJS and doesn't have proper ESM types
  const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'));
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  
  // Safety limit for large books
  return data.text.slice(0, 18000);
}

async function extractFromWord(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  
  // Safety limit for large books
  return result.value.slice(0, 18000);
}
