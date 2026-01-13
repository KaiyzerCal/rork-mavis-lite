import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';

export default publicProcedure
  .input(z.object({
    query: z.string().min(1),
    numResults: z.number().min(1).max(10).optional().default(5),
    searchType: z.enum(['web', 'image', 'news']).optional().default('web'),
  }))
  .mutation(async ({ input }) => {
    const { query, numResults, searchType } = input;
    const timestamp = new Date().toISOString();

    console.log('[Google Search] Searching for:', query, 'type:', searchType);

    try {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!apiKey || !searchEngineId) {
        console.log('[Google Search] API keys not configured, returning mock results');
        return {
          success: true,
          query,
          searchType,
          results: [
            {
              title: `Search result for "${query}"`,
              link: 'https://example.com',
              snippet: `This is a placeholder result for your search query: ${query}. Configure GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID for real results.`,
              displayLink: 'example.com',
            }
          ],
          totalResults: 1,
          timestamp,
          isMock: true,
        };
      }

      const searchTypeParam = searchType === 'image' ? '&searchType=image' : '';
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${numResults}${searchTypeParam}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Search failed');
      }

      const results = (data.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
        thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src,
        image: searchType === 'image' ? item.link : undefined,
      }));

      return {
        success: true,
        query,
        searchType,
        results,
        totalResults: parseInt(data.searchInformation?.totalResults || '0', 10),
        timestamp,
        isMock: false,
      };
    } catch (error) {
      console.error('[Google Search] Error:', error);
      return {
        success: false,
        query,
        searchType,
        results: [],
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  });
