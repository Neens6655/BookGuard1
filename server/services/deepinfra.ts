const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
// Use Chat Completions API for vision models
const CHAT_API_URL = "https://api.deepinfra.com/v1/openai/chat/completions";
const OCR_MODEL = "deepseek-ai/DeepSeek-OCR";

export interface OCRResult {
  text: string;
  pageCount?: number;
  format: string;
}

/**
 * Extract text from images or scanned PDFs using DeepSeek-OCR
 * @param imageBuffer - Buffer containing the image/PDF data
 * @param filename - Original filename to determine format
 * @param prompt - OCR prompt (default: markdown conversion)
 * @returns Extracted text content
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  filename: string,
  prompt: string = "<|grounding|>Convert the document to markdown."
): Promise<OCRResult> {
  if (!DEEPINFRA_API_KEY) {
    throw new Error("DEEPINFRA_API_KEY is not configured. Please add it to your environment secrets.");
  }

  try {
    // Encode image as base64
    const base64Image = imageBuffer.toString('base64');
    
    // Determine image format from filename
    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = getMimeType(extension);
    
    // Construct messages for DeepSeek-OCR - IMAGE MUST COME FIRST!
    const messages = [{
      role: "user",
      content: [
        { 
          type: "image_url", 
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        },
        { 
          type: "text", 
          text: `<image>\n${prompt}` 
        }
      ]
    }];

    console.log(`Starting OCR extraction for ${filename} (${extension})`);
    console.log('Request payload:', JSON.stringify({ model: OCR_MODEL, messages }, null, 2));
    
    // Call DeepInfra Chat Completions API for vision
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPINFRA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OCR_MODEL,
        messages,
        max_tokens: 8192,
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepInfra API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as any;
    
    // ENHANCED DEBUGGING
    console.log('─────────────────────────────────────');
    console.log('📥 API RESPONSE RECEIVED');
    console.log('Response keys:', Object.keys(data));
    console.log('Choices count:', data.choices?.length);
    
    if (data.choices?.[0]) {
      console.log('Choice[0] keys:', Object.keys(data.choices[0]));
      console.log('Message keys:', Object.keys(data.choices[0].message || {}));
      console.log('Content type:', typeof data.choices[0].message?.content);
      console.log('Content preview (first 200 chars):', 
        String(data.choices[0].message?.content).substring(0, 200));
    }
    console.log('─────────────────────────────────────');
    
    const extractedText = data.choices?.[0]?.message?.content;

    if (!extractedText) {
      console.error('❌ No content in response. Full structure:', JSON.stringify(data, null, 2));
      throw new Error("No text extracted from OCR response");
    }

    // Check if the response is a data URL (PDF/image) instead of text
    if (typeof extractedText === 'string' && extractedText.startsWith('data:')) {
      console.error('❌ API returned base64 data instead of text');
      console.error('Data URL prefix:', extractedText.substring(0, 50));
      console.error('This suggests the API is echoing the input instead of extracting text');
      throw new Error("API returned a file instead of extracted text. The OCR model may not be processing the image correctly.");
    }

    console.log(`✓ OCR extraction completed: ${extractedText.length} characters extracted`);

    return {
      text: extractedText,
      format: extension
    };

  } catch (error) {
    console.error("DeepSeek OCR extraction error:", error);
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
    'pdf': 'application/pdf'
  };

  return mimeTypes[extension] || 'image/jpeg';
}

/**
 * Test DeepInfra API connection
 */
export async function testDeepInfraConnection(): Promise<boolean> {
  if (!DEEPINFRA_API_KEY) {
    console.error("DEEPINFRA_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPINFRA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OCR_MODEL,
        messages: [{ role: "user", content: "Hello!" }]
      })
    });

    return response.ok;
  } catch (error) {
    console.error("DeepInfra connection test failed:", error);
    return false;
  }
}
