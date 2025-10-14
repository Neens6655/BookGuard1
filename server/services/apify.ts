import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export interface GoodreadsBookData {
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
  lastFetched?: string;
}

export async function searchGoodreadsBook(title: string, author?: string): Promise<GoodreadsBookData | null> {
  try {
    if (!process.env.APIFY_API_TOKEN) {
      console.warn("APIFY_API_TOKEN not configured, skipping Goodreads lookup");
      return null;
    }

    const searchQuery = author ? `${title} ${author}` : title;
    
    const input = {
      search: searchQuery,
      maxItems: 1,
      proxy: {
        useApifyProxy: true,
      }
    };

    const run = await client.actor("epctex/goodreads-scraper").call(input);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log(`No Goodreads results found for: ${searchQuery}`);
      return null;
    }

    const book: any = items[0];
    
    return {
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
      lastFetched: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Apify Goodreads search error:", error);
    return null;
  }
}
