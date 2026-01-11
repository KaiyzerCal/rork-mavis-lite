import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    memoryId: z.string(),
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { memoryId, userId } = input;

    console.log('[Memory] Deleting memory:', memoryId, 'for user:', userId);

    try {
      const existing = await query(`SELECT * FROM memory_items WHERE id = $memoryId AND userId = $userId LIMIT 1`, { memoryId, userId });

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: 'Memory not found',
        };
      }

      await query(`DELETE FROM memory_items WHERE id = $memoryId AND userId = $userId`, { memoryId, userId });

      return {
        success: true,
        deletedMemoryId: memoryId,
      };
    } catch (error) {
      console.error('[Memory] Error deleting memory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
