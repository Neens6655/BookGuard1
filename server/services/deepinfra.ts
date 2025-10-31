import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OCRResult {
  text: string;
  pageCount?: number;
  format: string;
}

/**
 * Extract text from images using GPT-4 Vision (GPT-4o)
 * @param imageBuffer - Buffer containing the image data
 * @param filename - Original filename to determine format
 * @param prompt - Custom OCR prompt (optional)
 * @returns Extracted text content
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  filename: string,
  prompt: string = "Please extract all the text from this image. Preserve the layout and formatting as much as possible. Return only the extracted text."
): Promise<OCRResult> {
  try {
    // Encode image as base64
    const base64Image = imageBuffer.toString('base64');
    
    // Determine image format from filename
    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = getMimeType(extension);
    
    console.log(`Starting OCR extraction for ${filename} (${extension}) using GPT-4 Vision`);
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0,
    });

    const extractedText = response.choices[0]?.message?.content;

    if (!extractedText) {
      throw new Error("No text extracted from image");
    }

    console.log(`✓ OCR extraction completed: ${extractedText.length} characters extracted`);

    return {
      text: extractedText,
      format: extension
    };

  } catch (error) {
    console.error("GPT-4 Vision OCR extraction error:", error);
    throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
  };

  return mimeTypes[extension] || 'image/jpeg';
}
