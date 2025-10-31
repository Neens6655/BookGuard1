import Replicate from "replicate";
import { promises as fs } from "fs";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Extract text from images using DeepSeek OCR via Replicate
 * Supports: JPG, PNG, WEBP, GIF, BMP
 */
export async function extractTextWithDeepSeekOCR(imagePath: string): Promise<string> {
  try {
    console.log(`Starting DeepSeek OCR extraction for: ${imagePath}`);
    
    // Read the image file and convert to base64 data URI
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(imagePath);
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    // Run DeepSeek OCR model
    const output = await replicate.run(
      "lucataco/deepseek-ocr:cb3b474fbfc56b1664c8c7841550bccecbe7b74c30e45ce938ffca1180b4dff5",
      {
        input: {
          image: dataUri,
          task_type: "Free OCR", // Plain text extraction
          resolution_size: "Gundam (Recommended)", // Best balance of speed/accuracy
        },
      }
    ) as unknown as string;
    
    console.log(`DeepSeek OCR completed. Extracted ${output?.length || 0} characters`);
    
    if (!output || typeof output !== 'string') {
      throw new Error('DeepSeek OCR returned invalid output');
    }
    
    // Clean up the output text
    const cleanedText = output.trim();
    
    if (cleanedText.length < 10) {
      throw new Error('DeepSeek OCR extracted very little text. The image may not contain readable text.');
    }
    
    return cleanedText;
    
  } catch (error) {
    console.error('DeepSeek OCR error:', error);
    
    if (error instanceof Error) {
      throw new Error(`DeepSeek OCR failed: ${error.message}`);
    }
    
    throw new Error('DeepSeek OCR failed with unknown error');
  }
}

/**
 * Get MIME type from file path
 */
function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
  };
  
  return mimeTypes[ext || ''] || 'image/jpeg';
}
