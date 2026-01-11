import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    reminderId: z.string(),
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { reminderId, userId } = input;

    console.log('[Reminders] Deleting reminder:', reminderId, 'for user:', userId);

    try {
      const existing = await query(`SELECT * FROM reminders WHERE id = $reminderId AND userId = $userId LIMIT 1`, { reminderId, userId });

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: 'Reminder not found',
        };
      }

      await query(`DELETE FROM reminders WHERE id = $reminderId AND userId = $userId`, { reminderId, userId });

      return {
        success: true,
        deletedReminderId: reminderId,
      };
    } catch (error) {
      console.error('[Reminders] Error deleting reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
