import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// Normalize text for similarity comparison (Unicode-aware)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalize Unicode to decomposed form
    .normalize('NFKD')
    // Remove ALL combining marks (accents, Arabic diacritics, etc.) across all scripts
    .replace(/\p{M}/gu, '')
    // Remove punctuation and special chars but keep letters/numbers/spaces (Unicode-aware)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate string similarity (0-100%) with subtitle awareness
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 100;
  
  // Check if s1 is contained in s2 (or vice versa) - good for matching "The Alchemist" with "The Alchemist: Subtitle"
  if (s2.includes(s1) || s1.includes(s2)) {
    // If one is a substring of the other, consider it a high match
    const shorterLength = Math.min(s1.length, s2.length);
    const longerLength = Math.max(s1.length, s2.length);
    // Give 100% if perfect substring, scale down based on length difference
    return Math.round(100 - ((longerLength - shorterLength) / longerLength) * 20);
  }
  
  // For titles with subtitles (e.g., "Title: Subtitle"), extract main title before colon
  const s2MainTitle = s2.split(':')[0].trim();
  if (s2MainTitle !== s2 && normalizeText(str1).includes(s2MainTitle)) {
    return 95; // High confidence if matches main title before colon
  }
  
  // Word overlap similarity (Jaccard)
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 0));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);
  
  if (union.size === 0) return 0;
  
  // Jaccard similarity percentage
  const jaccardScore = Math.round((intersection.size / union.size) * 100);
  
  // Boost score if all words from shorter string are in longer string
  if (intersection.size === Math.min(words1.size, words2.size)) {
    return Math.min(100, jaccardScore + 30);
  }
  
  return jaccardScore;
}

export interface GoodreadsReview {
  author: string;
  userUrl?: string;
  rating: number;
  text: string;
  date: string;
  numOfLikes?: number;
}

export interface GoodreadsBookData {
  status: 'ok' | 'unavailable' | 'error';
  message?: string;
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
  genres?: string[];
  publishedYear?: number;
  description?: string;
  coverImageUrl?: string;
  isbn?: string;
  pageCount?: number;
  goodreadsUrl?: string;
  reviews?: GoodreadsReview[];
  lastFetched?: string;
  matchConfidence?: number; // 0-100% similarity score
  matchedTitle?: string; // Title that was matched from Goodreads
}

export async function searchGoodreadsBook(title: string, author?: string): Promise<GoodreadsBookData | null> {
  try {
    if (!process.env.APIFY_API_TOKEN) {
      console.warn("APIFY_API_TOKEN not configured, skipping Goodreads lookup");
      return {
        status: 'unavailable',
        message: 'Apify API token not configured'
      };
    }

    const searchQuery = author ? `${title} ${author}` : title;
    
    const input = {
      search: searchQuery,
      maxItems: 1,
      includeReviews: true,
      proxy: {
        useApifyProxy: true,
      }
    };

    const run = await client.actor("epctex/goodreads-scraper").call(input);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log(`No Goodreads results found for: ${searchQuery}`);
      return {
        status: 'unavailable',
        message: 'No results found on Goodreads'
      };
    }

    const book: any = items[0];
    
    // Calculate title similarity
    const matchedTitle = String(book.title || '');
    const titleSimilarity = calculateSimilarity(title, matchedTitle);
    
    // Calculate author similarity if author provided
    let authorSimilarity = 100; // Default to perfect match if no author
    if (author && book.authorName) {
      authorSimilarity = calculateSimilarity(author, String(book.authorName));
    }
    
    // Overall confidence is weighted average (title 70%, author 30%)
    const matchConfidence = Math.round(titleSimilarity * 0.7 + authorSimilarity * 0.3);
    
    console.log(`Goodreads match for "${title}": "${matchedTitle}" (${matchConfidence}% confidence)`);
    
    // Reject low-confidence matches (below 40%)
    if (matchConfidence < 40) {
      console.log(`Rejecting Goodreads match due to low confidence: ${matchConfidence}%`);
      return {
        status: 'unavailable',
        message: `No reliable match found (${matchConfidence}% confidence)`
      };
    }
    
    // Process reviews - take top 10
    const reviews: GoodreadsReview[] = [];
    if (Array.isArray(book.reviews)) {
      reviews.push(...book.reviews.slice(0, 10).map((review: any) => ({
        author: String(review.author || 'Anonymous'),
        userUrl: review.userUrl ? String(review.userUrl) : undefined,
        rating: review.rating ? parseInt(String(review.rating)) : 0,
        text: String(review.text || review.html || ''),
        date: String(review.date || ''),
        numOfLikes: review.numOfLikes ? parseInt(String(review.numOfLikes)) : undefined,
      })));
    }
    
    return {
      status: 'ok',
      rating: book.rating ? parseFloat(String(book.rating)) : undefined,
      ratingsCount: book.ratingsCount ? parseInt(String(book.ratingsCount).replace(/,/g, '')) : undefined,
      reviewsCount: book.reviewsCount ? parseInt(String(book.reviewsCount).replace(/,/g, '')) : undefined,
      genres: Array.isArray(book.genres) ? book.genres : [],
      publishedYear: book.publishedYear ? parseInt(String(book.publishedYear)) : undefined,
      description: book.description ? String(book.description) : undefined,
      coverImageUrl: book.image || book.coverImageUrl || book.imageUrl ? String(book.image || book.coverImageUrl || book.imageUrl) : undefined,
      isbn: book.isbn ? String(book.isbn) : undefined,
      pageCount: book.pageCount || book.pages ? parseInt(String(book.pageCount || book.pages)) : undefined,
      goodreadsUrl: book.url ? String(book.url) : undefined,
      reviews: reviews.length > 0 ? reviews : undefined,
      lastFetched: new Date().toISOString(),
      matchConfidence,
      matchedTitle,
    };

  } catch (error: any) {
    console.error("Apify Goodreads search error:", error);
    
    // Check for specific error types
    if (error?.statusCode === 403 || error?.message?.includes('actor-is-not-rented')) {
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
      message: error?.message || 'Failed to fetch Goodreads data'
    };
  }
}
