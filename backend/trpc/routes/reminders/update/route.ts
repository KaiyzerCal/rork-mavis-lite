import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    reminderId: z.string(),
    userId: z.string(),
    title: z.string().optional(),
    body: z.string().optional(),
    triggerAt: z.string().optional(),
    enabled: z.boolean().optional(),
    status: z.enum(['pending', 'triggered', 'dismissed', 'completed']).optional(),
  }))
  .mutation(async ({ input }) => {
    const { reminderId, userId, ...updates } = input;
    const timestamp = new Date().toISOString();

    console.log('[Reminders] Updating reminder:', reminderId, 'for user:', userId);

    try {
      const existing = await query(`SELECT * FROM reminders WHERE id = $reminderId AND userId = $userId LIMIT 1`, { reminderId, userId });

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: 'Reminder not found',
        };
      }

      const reminder = existing[0];
      const updatedReminder = {
        title: updates.title ?? reminder.title,
        body: updates.body ?? reminder.body,
        triggerAt: updates.triggerAt ?? reminder.triggerAt,
        enabled: updates.enabled ?? reminder.enabled,
        status: updates.status ?? reminder.status,
        updatedAt: timestamp,
      };

      await query(`UPDATE reminders SET title = $title, body = $body, triggerAt = $triggerAt, enabled = $enabled, status = $status, updatedAt = $updatedAt WHERE id = $reminderId AND userId = $userId`, {
        reminderId,
        userId,
        ...updatedReminder,
      });

      return {
        success: true,
        reminder: {
          id: reminderId,
          userId,
          ...updatedReminder,
        },
      };
    } catch (error) {
      console.error('[Reminders] Error updating reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
