import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    memoryId: z.string(),
    userId: z.string(),
    type: z.enum(['preference', 'goal', 'challenge', 'insight', 'achievement', 'relationship']).optional(),
    content: z.string().optional(),
    importanceScore: z.number().min(0).max(3).optional(),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input }) => {
    const { memoryId, userId, ...updates } = input;
    const timestamp = new Date().toISOString();

    console.log('[Memory] Updating memory:', memoryId, 'for user:', userId);

    try {
      const existing = await query(`SELECT * FROM memory_items WHERE id = $memoryId AND userId = $userId LIMIT 1`, { memoryId, userId });

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: 'Memory not found',
        };
      }

      const memory = existing[0];
      const updatedMemory = {
        type: updates.type ?? memory.type,
        content: updates.content ?? memory.content,
        importanceScore: updates.importanceScore ?? memory.importanceScore,
        tags: updates.tags ? JSON.stringify(updates.tags) : memory.tags,
        updatedAt: timestamp,
      };

      await query(`UPDATE memory_items SET type = $type, content = $content, importanceScore = $importanceScore, tags = $tags, updatedAt = $updatedAt WHERE id = $memoryId AND userId = $userId`, {
        memoryId,
        userId,
        type: updatedMemory.type,
        content: updatedMemory.content,
        importanceScore: updatedMemory.importanceScore,
        tags: updatedMemory.tags,
        updatedAt: updatedMemory.updatedAt,
      });

      return {
        success: true,
        memory: {
          id: memoryId,
          userId,
          ...updatedMemory,
          tags: updates.tags || (memory.tags ? JSON.parse(memory.tags) : []),
        },
      };
    } catch (error) {
      console.error('[Memory] Error updating memory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
