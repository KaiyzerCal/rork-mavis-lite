import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    threadId: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { userId, threadId } = input;

    console.log('[Chat Load] Loading chat for user:', userId, threadId ? `thread: ${threadId}` : 'all threads');

    try {
      let result;
      if (threadId) {
        result = await query(`SELECT * FROM chat_threads WHERE userId = $userId AND threadId = $threadId LIMIT 1`, { userId, threadId });
      } else {
        result = await query(`SELECT * FROM chat_threads WHERE userId = $userId ORDER BY lastMessageAt DESC`, { userId });
      }

      if (!result || result.length === 0) {
        return {
          threads: [],
          totalMessages: 0,
        };
      }

      const threads = result.map((row: any) => {
        let messages = [];
        if (row.messages) {
          try {
            messages = typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages;
          } catch {
            messages = [];
          }
        }
        return {
          id: row.threadId,
          messages,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          messageCount: row.messageCount || messages.length,
        };
      });

      const totalMessages = threads.reduce((acc: number, t: any) => acc + (t.messageCount || 0), 0);

      return {
        threads,
        totalMessages,
      };
    } catch (error) {
      console.error('[Chat Load] Error:', error);
      return {
        threads: [],
        totalMessages: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
