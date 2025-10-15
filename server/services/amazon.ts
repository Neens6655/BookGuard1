import { ApifyClient } from 'apify-client';
import { getCachedAmazonData, setCachedAmazonData } from './amazonCache';

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        console.error(`${operationName} failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`${operationName} attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

// Normalize text for similarity comparison (Unicode-aware)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate string similarity (0-100%)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 100;
  
  if (s2.includes(s1) || s1.includes(s2)) {
    const shorterLength = Math.min(s1.length, s2.length);
    const longerLength = Math.max(s1.length, s2.length);
    return Math.round(100 - ((longerLength - shorterLength) / longerLength) * 20);
  }
  
  const s2MainTitle = s2.split(':')[0].trim();
  if (s2MainTitle !== s2 && normalizeText(str1).includes(s2MainTitle)) {
    return 95;
  }
  
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 0));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);
  
  if (union.size === 0) return 0;
  
  const jaccardScore = Math.round((intersection.size / union.size) * 100);
  
  if (intersection.size === Math.min(words1.size, words2.size)) {
    return Math.min(100, jaccardScore + 30);
  }
  
  return jaccardScore;
}

export interface AmazonBookData {
  status: 'ok' | 'unavailable' | 'error';
  message?: string;
  targetAge?: string;
  readingAge?: string;
  gradeLevel?: string;
  asin?: string;
  amazonUrl?: string;
  marketplace?: string;
  matchConfidence?: number;
  matchedTitle?: string;
  lastFetched?: string;
}

// Extract age-related information from Amazon product details
function extractAgeInfo(productDetails: any): { targetAge?: string; readingAge?: string; gradeLevel?: string } {
  const result: { targetAge?: string; readingAge?: string; gradeLevel?: string } = {};
  
  // Check product features array for age information
  if (productDetails.features && Array.isArray(productDetails.features)) {
    for (const feature of productDetails.features) {
      const featureText = feature.toLowerCase();
      
      // Match patterns like "Ages 8-12", "Age 5 and up", "5-7 years"
      const ageMatch = featureText.match(/(?:ages?|for)\s*(\d+)\s*(?:-|to|and up|\+|years?)/i);
      if (ageMatch && !result.targetAge) {
        result.targetAge = feature.trim();
      }
      
      // Match reading age patterns
      if (featureText.includes('reading age') || featureText.includes('reading level')) {
        result.readingAge = feature.trim();
      }
      
      // Match grade level patterns
      if (featureText.includes('grade') && (featureText.includes('level') || /grade\s*\d/.test(featureText))) {
        result.gradeLevel = feature.trim();
      }
    }
  }
  
  // Check product description
  if (productDetails.description && !result.targetAge) {
    const descText = productDetails.description;
    const ageMatch = descText.match(/(?:ages?|for children)\s*(\d+)\s*(?:-|to)\s*(\d+)/i);
    if (ageMatch) {
      result.targetAge = `Ages ${ageMatch[1]}-${ageMatch[2]}`;
    }
  }
  
  // Check details/specifications object
  if (productDetails.details) {
    const details = productDetails.details;
    
    if (details['Reading age'] || details['reading age']) {
      result.readingAge = details['Reading age'] || details['reading age'];
    }
    
    if (details['Grade level'] || details['grade level']) {
      result.gradeLevel = details['Grade level'] || details['grade level'];
    }
    
    if (details['Age Range'] || details['age range'] || details['Customer recommended age']) {
      result.targetAge = details['Age Range'] || details['age range'] || details['Customer recommended age'];
    }
  }
  
  return result;
}

export async function searchAmazonBook(title: string, author?: string): Promise<AmazonBookData | null> {
  try {
    if (!process.env.APIFY_API_TOKEN) {
      console.warn("APIFY_API_TOKEN not configured, skipping Amazon lookup");
      return {
        status: 'unavailable',
        message: 'Apify API token not configured'
      };
    }

    // Check cache first
    const cachedData = await getCachedAmazonData(title, author);
    if (cachedData) {
      return cachedData;
    }

    const searchQuery = author ? `${title} ${author}` : title;
    
    // Step 1: Search for the book to get ASIN
    console.log(`Amazon search: Looking for "${searchQuery}"...`);
    
    const searchInput = {
      keyword: searchQuery,
      maxItems: 3, // Get top 3 results for better matching
      country: "AE", // UAE Amazon marketplace
    };

    const searchResults = await retryWithBackoff(
      async () => {
        const runResult = await client.actor("pintostudio/amazon-search-products-scraper").call(searchInput);
        const { items } = await client.dataset(runResult.defaultDatasetId).listItems();
        return items;
      },
      3,
      2000,
      `Amazon search for "${searchQuery}"`
    );

    if (!searchResults || searchResults.length === 0) {
      console.log(`No Amazon results found for: ${searchQuery}`);
      return {
        status: 'unavailable',
        message: 'No results found on Amazon'
      };
    }

    // Find best matching result
    let bestMatch = searchResults[0];
    let bestScore = calculateSimilarity(title, bestMatch.title || '');

    for (const result of searchResults.slice(1)) {
      const score = calculateSimilarity(title, result.title || '');
      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }
    }

    console.log(`Amazon search: Best match "${bestMatch.title}" (${bestScore}% similarity)`);

    // Require at least 40% confidence
    if (bestScore < 40) {
      console.log(`Amazon search: Match confidence too low (${bestScore}%), skipping`);
      return {
        status: 'unavailable',
        message: 'No reliable match found on Amazon',
        matchConfidence: bestScore,
      };
    }

    const asin = bestMatch.asin;
    const amazonUrl = bestMatch.url;

    if (!asin) {
      console.log('Amazon search: No ASIN found in search result');
      return {
        status: 'error',
        message: 'Product found but missing ASIN'
      };
    }

    // Step 2: Get detailed product information
    console.log(`Amazon details: Fetching product details for ASIN ${asin}...`);
    
    const detailsInput = {
      products: [{ asin }],
      country: "AE",
    };

    const detailsResults = await retryWithBackoff(
      async () => {
        const runResult = await client.actor("logical_scrapers/amazon-product-scraper").call(detailsInput);
        const { items } = await client.dataset(runResult.defaultDatasetId).listItems();
        return items;
      },
      3,
      2000,
      `Amazon details for ASIN ${asin}`
    );

    if (!detailsResults || detailsResults.length === 0) {
      console.log('Amazon details: No details found');
      return {
        status: 'error',
        message: 'Product found but details unavailable'
      };
    }

    const productDetails = detailsResults[0];
    const ageInfo = extractAgeInfo(productDetails);

    const result: AmazonBookData = {
      status: 'ok',
      ...ageInfo,
      asin,
      amazonUrl,
      marketplace: 'AE',
      matchConfidence: bestScore,
      matchedTitle: bestMatch.title,
      lastFetched: new Date().toISOString(),
    };

    console.log(`Amazon lookup complete: ${JSON.stringify(ageInfo)}`);

    // Cache the result
    await setCachedAmazonData(title, author, result);

    return result;

  } catch (error: any) {
    console.error('Amazon lookup error:', error);
    
    if (error?.statusCode === 402) {
      return {
        status: 'unavailable',
        message: 'Apify actor subscription required'
      };
    }
    
    if (error?.statusCode === 401) {
      return {
        status: 'unavailable',
        message: 'Invalid Apify API token'
      };
    }
    
    return {
      status: 'error',
      message: error?.message || 'Failed to fetch Amazon data'
    };
  }
}
