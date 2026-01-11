import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const { userId } = input;
    const now = new Date().toISOString();

    console.log('[Reminders] Getting pending reminders for user:', userId);

    try {
      const results = await query(`SELECT * FROM reminders WHERE userId = $userId AND enabled = true AND status = 'pending' AND triggerAt <= $now ORDER BY triggerAt ASC`, { userId, now });

      const reminders = (results || []).map((row: any) => ({
        id: row.id,
        userId: row.userId,
        title: row.title,
        body: row.body,
        triggerAt: row.triggerAt,
        type: row.type,
        relatedEntityId: row.relatedEntityId,
        relatedEntityType: row.relatedEntityType,
        recurring: row.recurring ? JSON.parse(row.recurring) : null,
      }));

      return {
        success: true,
        reminders,
        count: reminders.length,
      };
    } catch (error) {
      console.error('[Reminders] Error getting pending reminders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reminders: [],
      };
    }
  });
