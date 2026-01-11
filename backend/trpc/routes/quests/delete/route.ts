import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    questId: z.string(),
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { questId, userId } = input;

    console.log('[Quests] Deleting quest:', questId, 'for user:', userId);

    try {
      const existing = await query(`SELECT * FROM quests WHERE id = $questId AND userId = $userId LIMIT 1`, { questId, userId });

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: 'Quest not found',
        };
      }

      await query(`DELETE FROM quests WHERE id = $questId AND userId = $userId`, { questId, userId });

      return {
        success: true,
        deletedQuestId: questId,
      };
    } catch (error) {
      console.error('[Quests] Error deleting quest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
