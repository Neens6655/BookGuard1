import { promises as fs } from 'fs';
import path from 'path';

export async function extractTextFromFile(filePath: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  
  try {
    switch (ext) {
      case '.txt':
        return await extractFromTxt(filePath);
      case '.pdf':
        // For now, return placeholder - in production would use pdf-parse
        throw new Error('PDF processing not implemented yet - please use TXT files for now');
      case '.doc':
      case '.docx':
        // For now, return placeholder - in production would use mammoth
        throw new Error('Word document processing not implemented yet - please use TXT files for now');
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
