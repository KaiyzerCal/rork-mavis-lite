import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    title: z.string(),
    body: z.string().optional(),
    triggerAt: z.string(),
    type: z.enum(['quest_deadline', 'daily_checkin', 'custom', 'milestone', 'recurring']),
    relatedEntityId: z.string().optional(),
    relatedEntityType: z.string().optional(),
    recurring: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      days: z.array(z.number()).optional(),
      time: z.string(),
    }).optional(),
    enabled: z.boolean().optional(),
  }))
  .mutation(async ({ input }) => {
    const { userId, title, body, triggerAt, type, relatedEntityId, relatedEntityType, recurring, enabled } = input;
    const reminderId = `reminder-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();

    console.log('[Reminders] Creating reminder:', title, 'for user:', userId);

    try {
      await query(`INSERT INTO reminders (id, userId, title, body, triggerAt, type, relatedEntityId, relatedEntityType, recurring, enabled, status, createdAt, updatedAt) VALUES ($id, $userId, $title, $body, $triggerAt, $type, $relatedEntityId, $relatedEntityType, $recurring, $enabled, $status, $createdAt, $updatedAt)`, {
        id: reminderId,
        userId,
        title,
        body: body || '',
        triggerAt,
        type,
        relatedEntityId: relatedEntityId || '',
        relatedEntityType: relatedEntityType || '',
        recurring: recurring ? JSON.stringify(recurring) : '',
        enabled: enabled !== false,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return {
        success: true,
        reminder: {
          id: reminderId,
          userId,
          title,
          body,
          triggerAt,
          type,
          relatedEntityId,
          relatedEntityType,
          recurring,
          enabled: enabled !== false,
          status: 'pending',
          createdAt: timestamp,
        },
      };
    } catch (error) {
      console.error('[Reminders] Error creating reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
