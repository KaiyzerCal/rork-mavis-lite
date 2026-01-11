import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const { userId } = input;

    console.log('[Analytics] Getting streaks for user:', userId);

    try {
      const checkIns = await query(`SELECT date FROM daily_checkins WHERE userId = $userId ORDER BY date DESC`, { userId });

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      const dates = (checkIns || []).map((c: any) => new Date(c.date));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const date of dates) {
        date.setHours(0, 0, 0, 0);
        
        if (!lastDate) {
          tempStreak = 1;
          const diffFromToday = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
          if (diffFromToday <= 1) {
            currentStreak = tempStreak;
          }
        } else {
          const diff = Math.floor((lastDate.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
          if (diff === 1) {
            tempStreak++;
            if (currentStreak > 0) {
              currentStreak = tempStreak;
            }
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        lastDate = date;
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      const questsCompleted = await query(`SELECT DATE(completedAt) as date, COUNT(*) as count FROM quests WHERE userId = $userId AND status = 'completed' GROUP BY DATE(completedAt) ORDER BY date DESC LIMIT 30`, { userId });

      const activeQuests = await query(`SELECT COUNT(*) as count FROM quests WHERE userId = $userId AND status = 'active'`, { userId });

      return {
        success: true,
        streaks: {
          currentCheckInStreak: currentStreak,
          longestCheckInStreak: longestStreak,
          lastCheckIn: dates[0]?.toISOString() || null,
        },
        questActivity: {
          activeQuests: activeQuests?.[0]?.count || 0,
          recentCompletions: questsCompleted || [],
        },
      };
    } catch (error) {
      console.error('[Analytics] Error getting streaks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        streaks: null,
      };
    }
  });
