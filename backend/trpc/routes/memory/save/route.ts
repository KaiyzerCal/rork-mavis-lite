import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    type: z.enum(['preference', 'goal', 'challenge', 'insight', 'achievement', 'relationship']),
    content: z.string(),
    importanceScore: z.number().min(0).max(3),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input }) => {
    const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();

    const memoryData = {
      userId: input.userId,
      type: input.type,
      content: input.content,
      importanceScore: input.importanceScore,
      tags: input.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await query(`CREATE type::thing('memory_items', $id) CONTENT $data`, {
      id: memoryId,
      data: memoryData,
    });

    return {
      id: memoryId,
      userId: input.userId,
      type: input.type,
      content: input.content,
      importanceScore: input.importanceScore,
      tags: input.tags,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
