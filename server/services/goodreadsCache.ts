import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, lt, sql } from "drizzle-orm";
import { goodreadsCache } from "@shared/schema";
import type { GoodreadsBookData } from "./apify";

// Initialize database connection
let db: ReturnType<typeof drizzle> | null = null;
if (process.env.DATABASE_URL) {
  try {
    const sqlClient = neon(process.env.DATABASE_URL);
    db = drizzle(sqlClient);
  } catch (error) {
    console.error("Failed to initialize Goodreads cache database:", error);
  }
}

// Cache duration: 7 days
const CACHE_DURATION_DAYS = 7;

// Normalize text for cache key
function normalizeForCache(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate cache key from title and author
function generateCacheKey(title: string, author?: string): string {
  const normalizedTitle = normalizeForCache(title);
  const normalizedAuthor = author ? normalizeForCache(author) : '';
  return `${normalizedTitle}|${normalizedAuthor}`;
}

// Get cached Goodreads data
export async function getCachedGoodreadsData(
  title: string,
  author?: string
): Promise<GoodreadsBookData | null> {
  if (!db) {
    console.log('Goodreads cache: Database not available');
    return null;
  }

  try {
    const cacheKey = generateCacheKey(title, author);
    
    const cached = await db
      .select()
      .from(goodreadsCache)
      .where(eq(goodreadsCache.cacheKey, cacheKey))
      .limit(1);

    if (cached.length === 0) {
      console.log(`Goodreads cache: MISS for "${title}"`);
      return null;
    }

    const entry = cached[0];
    
    // Check if cache is still valid
    if (new Date() > new Date(entry.expiresAt)) {
      console.log(`Goodreads cache: EXPIRED for "${title}"`);
      // Delete expired entry
      await db.delete(goodreadsCache).where(eq(goodreadsCache.id, entry.id));
      return null;
    }

    console.log(`Goodreads cache: HIT for "${title}" (${Math.round((new Date(entry.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining)`);
    
    return {
      ...entry.data,
      lastFetched: entry.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Goodreads cache lookup error:', error);
    return null;
  }
}

// Set Goodreads data in cache
export async function setCachedGoodreadsData(
  title: string,
  author: string | undefined,
  data: GoodreadsBookData
): Promise<void> {
  if (!db) {
    console.log('Goodreads cache: Database not available, skipping cache write');
    return;
  }

  // Only cache successful responses
  if (data.status !== 'ok') {
    console.log(`Goodreads cache: Skipping cache for non-OK status (${data.status})`);
    return;
  }

  try {
    const cacheKey = generateCacheKey(title, author);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_DURATION_DAYS);

    // Upsert: delete existing and insert new
    await db.delete(goodreadsCache).where(eq(goodreadsCache.cacheKey, cacheKey));
    
    await db.insert(goodreadsCache).values({
      cacheKey,
      title,
      author: author || null,
      data: {
        status: data.status,
        message: data.message,
        rating: data.rating,
        ratingsCount: data.ratingsCount,
        reviewsCount: data.reviewsCount,
        genres: data.genres,
        publishedYear: data.publishedYear,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        isbn: data.isbn,
        pageCount: data.pageCount,
        goodreadsUrl: data.goodreadsUrl,
        reviews: data.reviews,
        matchConfidence: data.matchConfidence,
        matchedTitle: data.matchedTitle,
      },
      expiresAt,
    });

    console.log(`Goodreads cache: STORED "${title}" (expires in ${CACHE_DURATION_DAYS} days)`);
  } catch (error) {
    console.error('Goodreads cache write error:', error);
  }
}

// Clean up expired cache entries (run periodically)
export async function cleanExpiredCache(): Promise<number> {
  if (!db) return 0;

  try {
    const result = await db
      .delete(goodreadsCache)
      .where(lt(goodreadsCache.expiresAt, new Date()));
    
    const deletedCount = result.rowCount || 0;
    if (deletedCount > 0) {
      console.log(`Goodreads cache: Cleaned ${deletedCount} expired entries`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Goodreads cache cleanup error:', error);
    return 0;
  }
}
