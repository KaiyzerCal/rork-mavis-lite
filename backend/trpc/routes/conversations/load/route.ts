import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    threadId: z.string().optional(),
    limit: z.number().optional().default(100),
  }))
  .query(async ({ input }) => {
    const sql = input.threadId
      ? `
        SELECT * FROM chat_messages 
        WHERE userId = $userId AND threadId = $threadId
        ORDER BY timestamp DESC
        LIMIT $limit
      `
      : `
        SELECT * FROM chat_messages 
        WHERE userId = $userId
        ORDER BY timestamp DESC
        LIMIT $limit
      `;

    const result = await query(sql, {
      userId: input.userId,
      threadId: input.threadId,
      limit: input.limit,
    });

    return result.map((row: any) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      full_output: row.full_output,
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    })).reverse();
  });
