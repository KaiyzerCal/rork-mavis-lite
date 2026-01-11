import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    searchQuery: z.string().optional(),
    types: z.array(z.enum(['preference', 'goal', 'challenge', 'insight', 'achievement', 'relationship'])).optional(),
    tags: z.array(z.string()).optional(),
    minImportance: z.number().min(0).max(3).optional(),
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
  }))
  .query(async ({ input }) => {
    const { userId, searchQuery, types, tags, minImportance, limit, offset } = input;

    console.log('[Memory] Searching memories for user:', userId, 'query:', searchQuery);

    try {
      let sql = `SELECT * FROM memory_items WHERE userId = $userId`;
      const params: Record<string, any> = { userId, limit, offset };

      if (types && types.length > 0) {
        sql += ` AND type IN (${types.map((_, i) => `$type${i}`).join(', ')})`;
        types.forEach((type, i) => {
          params[`type${i}`] = type;
        });
      }

      if (minImportance !== undefined) {
        sql += ` AND importanceScore >= $minImportance`;
        params.minImportance = minImportance;
      }

      if (searchQuery) {
        sql += ` AND content LIKE $searchQuery`;
        params.searchQuery = `%${searchQuery}%`;
      }

      sql += ` ORDER BY importanceScore DESC, updatedAt DESC LIMIT $limit OFFSET $offset`;

      const results = await query(sql, params);

      let filteredResults = results || [];
      if (tags && tags.length > 0) {
        filteredResults = filteredResults.filter((memory: any) => {
          const memoryTags = memory.tags ? JSON.parse(memory.tags) : [];
          return tags.some(tag => memoryTags.includes(tag));
        });
      }

      const memories = filteredResults.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        type: row.type,
        content: row.content,
        importanceScore: row.importanceScore,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      return {
        success: true,
        memories,
        count: memories.length,
        hasMore: memories.length === limit,
      };
    } catch (error) {
      console.error('[Memory] Error searching memories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        memories: [],
        count: 0,
        hasMore: false,
      };
    }
  });
