import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  timestamp: z.string(),
  full_output: z.string().optional(),
  output_tokens: z.number().optional(),
  is_summary: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    threadId: z.string(),
    messages: z.array(ChatMessageSchema),
  }))
  .mutation(async ({ input }) => {
    const timestamp = new Date().toISOString();
    const { userId, threadId, messages } = input;

    console.log('[Chat Sync] Syncing', messages.length, 'messages for thread:', threadId);

    try {
      const existing = await query(`SELECT * FROM chat_threads WHERE threadId = $threadId LIMIT 1`, { threadId });

      const threadData = {
        userId,
        threadId,
        messages: JSON.stringify(messages),
        messageCount: messages.length,
        lastMessageAt: messages.length > 0 ? messages[messages.length - 1].timestamp : timestamp,
        updatedAt: timestamp,
      };

      if (!existing || existing.length === 0) {
        await query(`INSERT INTO chat_threads (userId, threadId, messages, messageCount, lastMessageAt, createdAt, updatedAt) VALUES ($userId, $threadId, $messages, $messageCount, $lastMessageAt, $updatedAt, $updatedAt)`, { ...threadData, createdAt: timestamp });
        console.log('[Chat Sync] Created new thread');
      } else {
        await query(`UPDATE chat_threads SET messages = $messages, messageCount = $messageCount, lastMessageAt = $lastMessageAt, updatedAt = $updatedAt WHERE threadId = $threadId`, threadData);
        console.log('[Chat Sync] Updated existing thread');
      }

      return {
        success: true,
        timestamp,
        messageCount: messages.length,
      };
    } catch (error) {
      console.error('[Chat Sync] Error:', error);
      return {
        success: false,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
