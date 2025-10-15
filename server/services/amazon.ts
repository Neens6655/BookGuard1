import { ApifyClient } from 'apify-client';
import { compareTwoStrings } from 'string-similarity';
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
      
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`${operationName} attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

// Normalize text for comparison (Unicode-aware)
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

// IMPROVEMENT 1: Enhanced similarity with fuzzy matching
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 100;
  
  // Use string-similarity for fuzzy matching
  const fuzzyScore = compareTwoStrings(s1, s2) * 100;
  
  // Boost score if one contains the other
  if (s2.includes(s1) || s1.includes(s2)) {
    return Math.min(100, fuzzyScore + 15);
  }
  
  // Handle subtitle variations (e.g., "Title: Subtitle")
  const s2MainTitle = s2.split(/[:\(]/)[0].trim();
  if (s2MainTitle !== s2 && normalizeText(str1).includes(s2MainTitle)) {
    return Math.min(100, fuzzyScore + 20);
  }
  
  return Math.round(fuzzyScore);
}

// IMPROVEMENT 1: Author and publisher verification
function verifyAuthor(searchAuthor: string | undefined, productAuthor: string | undefined): boolean {
  if (!searchAuthor || !productAuthor) return false;
  
  const s1 = normalizeText(searchAuthor);
  const s2 = normalizeText(productAuthor);
  
  // Check if either contains the other (handles "J.K. Rowling" vs "Rowling, J.K.")
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  // Last name matching
  const lastName1 = s1.split(' ').pop() || '';
  const lastName2 = s2.split(' ').pop() || '';
  
  return lastName1.length > 0 && lastName1 === lastName2;
}

function verifyPublisher(searchPublisher: string | undefined, productPublisher: string | undefined): boolean {
  if (!searchPublisher || !productPublisher) return false;
  
  const similarity = calculateSimilarity(searchPublisher, productPublisher);
  return similarity >= 70; // 70% threshold for publisher match
}

// IMPROVEMENT 1: ISBN extraction from text
function extractISBN(text: string): string | null {
  if (!text) return null;
  
  // Match ISBN-13 (978/979 prefix)
  const isbn13Match = text.match(/(?:ISBN[-:]?\s*(?:13)?[:\/\s]?)?((?:978|979)[\d\s-]{10,17}\d)/i);
  if (isbn13Match) {
    return isbn13Match[1].replace(/[\s-]/g, '');
  }
  
  // Match ISBN-10
  const isbn10Match = text.match(/(?:ISBN[-:]?\s*(?:10)?[:\/\s]?)?(\d{9}[\dXx])/i);
  if (isbn10Match) {
    return isbn10Match[1].replace(/[\s-]/g, '');
  }
  
  return null;
}

// IMPROVEMENT 4: Format detection and scoring
function getFormatScore(format: string): number {
  const normalizedFormat = format.toLowerCase();
  
  // Prioritize physical books
  if (normalizedFormat.includes('hardcover') || normalizedFormat.includes('hardback')) return 100;
  if (normalizedFormat.includes('paperback')) return 95;
  if (normalizedFormat.includes('board book')) return 90;
  
  // Lower priority for digital
  if (normalizedFormat.includes('kindle') || normalizedFormat.includes('ebook')) return 30;
  if (normalizedFormat.includes('audiobook') || normalizedFormat.includes('audio')) return 20;
  
  return 50; // Unknown format
}

function detectFormat(productDetails: any): string {
  // Try to detect from binding/format field
  const binding = productDetails.info_table?.['Binding'] || 
                  productDetails.info_table?.['Format'] ||
                  productDetails.binding ||
                  productDetails.format;
  
  if (binding) return String(binding);
  
  // Detect from title
  const title = String(productDetails.name || productDetails.title || '').toLowerCase();
  if (title.includes('kindle') || title.includes('ebook')) return 'Kindle Edition';
  if (title.includes('hardcover')) return 'Hardcover';
  if (title.includes('paperback')) return 'Paperback';
  if (title.includes('audiobook')) return 'Audiobook';
  
  return 'Unknown';
}

export interface AmazonEdition {
  asin: string;
  title: string;
  format: string;
  readingAge?: string;
  gradeLevel?: string;
  amazonUrl: string;
  publisher?: string;
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
  // IMPROVEMENT 5: Quality signals
  isbn?: string;
  matchQuality?: 'high' | 'medium' | 'low';
  matchMethod?: 'isbn' | 'title_author' | 'title_only' | 'partial';
  authorMatch?: boolean;
  publisherMatch?: boolean;
  format?: string;
  // IMPROVEMENT 2: Multiple editions
  alternativeEditions?: AmazonEdition[];
  editionsCompared?: number;
  ageConsensus?: string;
}

// Extract age-related information from Amazon product details
function extractAgeInfo(productDetails: any): { targetAge?: string; readingAge?: string; gradeLevel?: string; publisher?: string } {
  const result: { targetAge?: string; readingAge?: string; gradeLevel?: string; publisher?: string } = {};
  
  // Check product features array
  if (productDetails.features && Array.isArray(productDetails.features)) {
    for (const feature of productDetails.features) {
      const featureText = feature.toLowerCase();
      
      const ageMatch = featureText.match(/(?:ages?|for)\s*(\d+)\s*(?:-|to|and up|\+|years?)/i);
      if (ageMatch && !result.targetAge) {
        result.targetAge = feature.trim();
      }
      
      if (featureText.includes('reading age') || featureText.includes('reading level')) {
        result.readingAge = feature.trim();
      }
      
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
  
  // Check info_table (most reliable)
  const detailsObj = productDetails.details || productDetails.info_table;
  if (detailsObj) {
    if (detailsObj['Reading age'] || detailsObj['reading age']) {
      result.readingAge = detailsObj['Reading age'] || detailsObj['reading age'];
      if (!result.targetAge) {
        result.targetAge = result.readingAge;
      }
    }
    
    if (detailsObj['Grade level'] || detailsObj['grade level']) {
      result.gradeLevel = detailsObj['Grade level'] || detailsObj['grade level'];
    }
    
    if (detailsObj['Age Range'] || detailsObj['age range'] || detailsObj['Customer recommended age']) {
      result.targetAge = detailsObj['Age Range'] || detailsObj['age range'] || detailsObj['Customer recommended age'];
    }
    
    // Extract publisher
    if (detailsObj['Publisher'] || detailsObj['publisher']) {
      result.publisher = detailsObj['Publisher'] || detailsObj['publisher'];
    }
  }
  
  if (result.readingAge && !result.targetAge) {
    result.targetAge = result.readingAge;
  }
  
  return result;
}

// IMPROVEMENT 2: Compare ages across multiple editions
function findAgeConsensus(editions: AmazonEdition[]): string | undefined {
  const ages = editions
    .map(e => e.readingAge)
    .filter((age): age is string => !!age);
  
  if (ages.length === 0) return undefined;
  
  // Count occurrences
  const ageCounts = new Map<string, number>();
  ages.forEach(age => {
    ageCounts.set(age, (ageCounts.get(age) || 0) + 1);
  });
  
  // Find most common
  let maxCount = 0;
  let consensus: string | undefined;
  ageCounts.forEach((count, age) => {
    if (count > maxCount) {
      maxCount = count;
      consensus = age;
    }
  });
  
  // Return consensus if at least 2 editions agree
  if (maxCount >= 2) {
    return `${consensus} (${maxCount}/${ages.length} editions)`;
  }
  
  return undefined;
}

export async function searchAmazonBook(
  title: string, 
  author?: string,
  publisher?: string,
  isbn?: string
): Promise<AmazonBookData | null> {
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

    // IMPROVEMENT 3: Better search strategy - try ISBN first
    let searchResults: any[] = [];
    let searchMethod: 'isbn' | 'title_author' | 'title_only' = 'title_author';
    
    if (isbn) {
      console.log(`Amazon search: Trying ISBN "${isbn}" first...`);
      const isbnResults = await searchByQuery(isbn, 3);
      if (isbnResults.length > 0) {
        searchResults = isbnResults;
        searchMethod = 'isbn';
        console.log(`Amazon search: Found ${searchResults.length} results via ISBN`);
      }
    }
    
    // Fallback: Search with title + author
    if (searchResults.length === 0 && author) {
      const query = `${title} ${author}`;
      console.log(`Amazon search: Looking for "${query}"...`);
      searchResults = await searchByQuery(query, 5); // Get more results for better matching
      searchMethod = 'title_author';
    }
    
    // Fallback: Search with title only
    if (searchResults.length === 0) {
      console.log(`Amazon search: Trying title only "${title}"...`);
      searchResults = await searchByQuery(title, 5);
      searchMethod = 'title_only';
    }

    if (searchResults.length === 0) {
      console.log(`No Amazon results found for: ${title}`);
      return {
        status: 'unavailable',
        message: 'No results found on Amazon'
      };
    }

    // IMPROVEMENT 1 & 4: Smart matching with author verification and format preference
    let bestMatch: any = null;
    let bestScore = 0;
    let authorMatches = false;
    let publisherMatches = false;

    for (const result of searchResults) {
      let score = calculateSimilarity(title, String(result.title || ''));
      
      // IMPROVEMENT 1: Boost score for author match
      const resultAuthor = result.author || result.by;
      if (author && verifyAuthor(author, resultAuthor)) {
        score = Math.min(100, score + 20);
        authorMatches = true;
      }
      
      // IMPROVEMENT 4: Format preference - physical books get priority
      const format = detectFormat(result);
      const formatScore = getFormatScore(format);
      
      // Apply format boost for high-quality matches
      if (score >= 60 && formatScore > 50) {
        score = Math.min(100, score + (formatScore / 10));
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }
    }

    console.log(`Amazon search: Best match "${bestMatch?.title}" (${bestScore}% similarity)`);

    // Require minimum confidence based on search method
    const minConfidence = searchMethod === 'isbn' ? 30 : 40;
    if (bestScore < minConfidence) {
      console.log(`Amazon search: Match confidence too low (${bestScore}%), skipping`);
      return {
        status: 'unavailable',
        message: 'No reliable match found on Amazon',
        matchConfidence: bestScore,
        matchMethod: searchMethod === 'isbn' ? 'isbn' : searchMethod === 'title_author' ? 'title_author' : 'partial',
        matchQuality: 'low'
      };
    }

    const asin = String(bestMatch.asin || '');
    const amazonUrl = String(bestMatch.url || '');

    // IMPROVEMENT 2: Fetch multiple editions
    const allEditions: AmazonEdition[] = [];
    
    // Fetch details for top matches (up to 5 different formats/editions)
    const editionsToCheck = searchResults
      .slice(0, 5)
      .filter(r => calculateSimilarity(title, String(r.title || '')) >= 70);
    
    for (const edition of editionsToCheck) {
      try {
        const editionDetails = await fetchProductDetails(String(edition.url || ''), String(edition.asin || ''));
        if (editionDetails) {
          const ageInfo = extractAgeInfo(editionDetails);
          allEditions.push({
            asin: String(edition.asin || ''),
            title: String(edition.title || ''),
            format: detectFormat(editionDetails),
            readingAge: ageInfo.readingAge,
            gradeLevel: ageInfo.gradeLevel,
            amazonUrl: String(edition.url || ''),
            publisher: ageInfo.publisher
          });
          
          // Check publisher match
          if (publisher && ageInfo.publisher && verifyPublisher(publisher, ageInfo.publisher)) {
            publisherMatches = true;
          }
        }
      } catch (error) {
        console.log(`Failed to fetch edition ${edition.asin}:`, error);
      }
    }

    // Get primary edition details (best match)
    const primaryDetails = await fetchProductDetails(amazonUrl, asin);
    if (!primaryDetails) {
      return {
        status: 'error',
        message: 'Product found but details unavailable'
      };
    }

    const primaryAgeInfo = extractAgeInfo(primaryDetails);
    const primaryFormat = detectFormat(primaryDetails);
    
    // IMPROVEMENT 2: Calculate age consensus
    const ageConsensus = findAgeConsensus(allEditions);

    // IMPROVEMENT 5: Determine match quality
    let matchQuality: 'high' | 'medium' | 'low' = 'medium';
    if (searchMethod === 'isbn' || (bestScore >= 90 && authorMatches)) {
      matchQuality = 'high';
    } else if (bestScore >= 70 && authorMatches) {
      matchQuality = 'high';
    } else if (bestScore >= 60) {
      matchQuality = 'medium';
    } else {
      matchQuality = 'low';
    }

    const result: AmazonBookData = {
      status: 'ok',
      ...primaryAgeInfo,
      asin: asin || undefined,
      amazonUrl: amazonUrl || undefined,
      marketplace: 'AE',
      matchConfidence: bestScore,
      matchedTitle: String(bestMatch.title || ''),
      lastFetched: new Date().toISOString(),
      // IMPROVEMENT 5: Quality signals
      isbn: isbn,
      matchQuality,
      matchMethod: searchMethod === 'isbn' ? 'isbn' : searchMethod === 'title_author' ? 'title_author' : 'title_only',
      authorMatch: authorMatches,
      publisherMatch: publisherMatches,
      format: primaryFormat,
      // IMPROVEMENT 2: Multiple editions
      alternativeEditions: allEditions.length > 1 ? allEditions.slice(0, 5) : undefined,
      editionsCompared: allEditions.length,
      ageConsensus: ageConsensus,
    };

    console.log(`Amazon lookup complete: ${JSON.stringify({
      readingAge: result.readingAge,
      matchQuality: result.matchQuality,
      editionsCompared: result.editionsCompared,
      ageConsensus: result.ageConsensus
    })}`);

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

// Helper: Search Amazon by query
async function searchByQuery(query: string, maxItems: number = 5): Promise<any[]> {
  const searchInput = {
    query: query,
    maxItems: maxItems,
    country: "AE",
  };

  const searchResultsRaw = await retryWithBackoff(
    async () => {
      const runResult = await client.actor("pintostudio/amazon-search-products-scraper").call(searchInput);
      const { items } = await client.dataset(runResult.defaultDatasetId).listItems();
      return items;
    },
    3,
    2000,
    `Amazon search for "${query}"`
  );

  const searchResults = searchResultsRaw && searchResultsRaw[0]?.results && Array.isArray(searchResultsRaw[0].results)
    ? searchResultsRaw[0].results.slice(0, maxItems)
    : [];

  console.log(`Amazon search: Extracted ${searchResults.length} products`);
  return searchResults;
}

// Helper: Fetch product details
async function fetchProductDetails(url: string, asin: string): Promise<any | null> {
  const detailsInput = {
    urls: [url],
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
    return null;
  }

  return detailsResults[0];
}
