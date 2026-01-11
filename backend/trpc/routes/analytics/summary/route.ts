import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { userId, startDate, endDate } = input;
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const defaultEndDate = endDate || now.toISOString();

    console.log('[Analytics] Getting summary for user:', userId);

    try {
      const questsCompleted = await query(`SELECT COUNT(*) as count FROM quests WHERE userId = $userId AND status = 'completed' AND completedAt >= $startDate AND completedAt <= $endDate`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const questsCreated = await query(`SELECT COUNT(*) as count FROM quests WHERE userId = $userId AND createdAt >= $startDate AND createdAt <= $endDate`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const totalXPEarned = await query(`SELECT SUM(xpReward) as total FROM quests WHERE userId = $userId AND status = 'completed' AND completedAt >= $startDate AND completedAt <= $endDate`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const vaultEntries = await query(`SELECT COUNT(*) as count FROM vault_entries WHERE userId = $userId AND date >= $startDate AND date <= $endDate`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const chatMessages = await query(`SELECT COUNT(*) as count FROM chat_messages WHERE userId = $userId AND timestamp >= $startDate AND timestamp <= $endDate`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const memories = await query(`SELECT COUNT(*) as count FROM memory_items WHERE userId = $userId AND createdAt >= $startDate AND createdAt <= $endDate`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const eventCounts = await query(`SELECT eventType, COUNT(*) as count FROM analytics_events WHERE userId = $userId AND timestamp >= $startDate AND timestamp <= $endDate GROUP BY eventType`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const screenViews = await query(`SELECT screen, COUNT(*) as count FROM analytics_events WHERE userId = $userId AND eventType = 'screen_view' AND timestamp >= $startDate AND timestamp <= $endDate GROUP BY screen ORDER BY count DESC LIMIT 10`, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      return {
        success: true,
        period: {
          startDate: defaultStartDate,
          endDate: defaultEndDate,
        },
        summary: {
          questsCompleted: questsCompleted?.[0]?.count || 0,
          questsCreated: questsCreated?.[0]?.count || 0,
          totalXPEarned: totalXPEarned?.[0]?.total || 0,
          vaultEntries: vaultEntries?.[0]?.count || 0,
          chatMessages: chatMessages?.[0]?.count || 0,
          memoriesCreated: memories?.[0]?.count || 0,
        },
        eventBreakdown: eventCounts || [],
        topScreens: screenViews || [],
      };
    } catch (error) {
      console.error('[Analytics] Error getting summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        summary: null,
      };
    }
  });
