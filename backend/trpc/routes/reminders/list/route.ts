import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    status: z.enum(['pending', 'triggered', 'dismissed', 'completed']).optional(),
    type: z.enum(['quest_deadline', 'daily_checkin', 'custom', 'milestone', 'recurring']).optional(),
    upcoming: z.boolean().optional(),
    limit: z.number().optional().default(50),
  }))
  .query(async ({ input }) => {
    const { userId, status, type, upcoming, limit } = input;

    console.log('[Reminders] Listing reminders for user:', userId);

    try {
      let sql = `SELECT * FROM reminders WHERE userId = $userId AND enabled = true`;
      const params: Record<string, any> = { userId, limit };

      if (status) {
        sql += ` AND status = $status`;
        params.status = status;
      }

      if (type) {
        sql += ` AND type = $type`;
        params.type = type;
      }

      if (upcoming) {
        sql += ` AND triggerAt >= $now`;
        params.now = new Date().toISOString();
      }

      sql += ` ORDER BY triggerAt ASC LIMIT $limit`;

      const results = await query(sql, params);

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
        enabled: row.enabled,
        status: row.status,
        createdAt: row.createdAt,
      }));

      return {
        success: true,
        reminders,
        count: reminders.length,
      };
    } catch (error) {
      console.error('[Reminders] Error listing reminders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reminders: [],
      };
    }
  });
