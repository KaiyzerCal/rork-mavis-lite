import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    threadId: z.string().optional(),
    role: z.enum(['user', 'assistant', 'tool']),
    content: z.string(),
    fullOutput: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }))
  .mutation(async ({ input }) => {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();
    const threadId = input.threadId || `thread-${Date.now()}`;

    const messageData = {
      userId: input.userId,
      threadId,
      role: input.role,
      content: input.content,
      full_output: input.fullOutput || input.content,
      timestamp,
      metadata: input.metadata || {},
    };

    await query(`CREATE type::thing('chat_messages', $id) CONTENT $data`, {
      id: messageId,
      data: messageData,
    });

    return {
      id: messageId,
      threadId,
      role: input.role,
      content: input.content,
      full_output: input.fullOutput || input.content,
      timestamp,
      metadata: input.metadata,
    };
  });
