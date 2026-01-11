import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    type: z.enum(['preference', 'goal', 'challenge', 'insight', 'achievement', 'relationship']).optional(),
    limit: z.number().optional().default(50),
  }))
  .query(async ({ input }) => {
    const sql = input.type
      ? `
        SELECT * FROM memory_items 
        WHERE userId = $userId AND type = $type
        ORDER BY importanceScore DESC, updatedAt DESC
        LIMIT $limit
      `
      : `
        SELECT * FROM memory_items 
        WHERE userId = $userId
        ORDER BY importanceScore DESC, updatedAt DESC
        LIMIT $limit
      `;

    const result = await query(sql, {
      userId: input.userId,
      type: input.type,
      limit: input.limit,
    });

    return result.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      content: row.content,
      importanceScore: row.importanceScore,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  });
