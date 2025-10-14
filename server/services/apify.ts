import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

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
      coverImageUrl: book.coverImageUrl || book.imageUrl ? String(book.coverImageUrl || book.imageUrl) : undefined,
      isbn: book.isbn ? String(book.isbn) : undefined,
      pageCount: book.pageCount || book.pages ? parseInt(String(book.pageCount || book.pages)) : undefined,
      goodreadsUrl: book.url ? String(book.url) : undefined,
      reviews: reviews.length > 0 ? reviews : undefined,
      lastFetched: new Date().toISOString(),
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
