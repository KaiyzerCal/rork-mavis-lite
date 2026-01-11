import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    console.log('[FullState Load] Loading full state for user:', input.userId);

    try {
      const result = await query(`SELECT * FROM full_state WHERE userId = $userId LIMIT 1`, { userId: input.userId });

      if (!result || result.length === 0) {
        console.log('[FullState Load] No state found for user');
        return {
          exists: false,
          user: null,
          skills: [],
          quests: [],
          vault: [],
          memoryItems: [],
          chatHistory: [],
          naviProfile: null,
          dailyCheckIns: [],
          sessionSummaries: [],
          journal: [],
          leaderboard: [],
          lastSync: null,
          syncVersion: 0,
        };
      }

      const row = result[0];
      console.log('[FullState Load] Found state, parsing...');

      const parseJSON = (data: any, fallback: any = []) => {
        if (!data) return fallback;
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return fallback;
          }
        }
        return data;
      };

      return {
        exists: true,
        user: parseJSON(row.user, null),
        skills: parseJSON(row.skills, []),
        quests: parseJSON(row.quests, []),
        vault: parseJSON(row.vault, []),
        memoryItems: parseJSON(row.memoryItems, []),
        chatHistory: parseJSON(row.chatHistory, []),
        naviProfile: parseJSON(row.naviProfile, null),
        dailyCheckIns: parseJSON(row.dailyCheckIns, []),
        sessionSummaries: parseJSON(row.sessionSummaries, []),
        journal: parseJSON(row.journal, []),
        leaderboard: parseJSON(row.leaderboard, []),
        lastSync: row.lastSync || null,
        syncVersion: row.syncVersion || 0,
      };
    } catch (error) {
      console.error('[FullState Load] Error:', error);
      return {
        exists: false,
        user: null,
        skills: [],
        quests: [],
        vault: [],
        memoryItems: [],
        chatHistory: [],
        naviProfile: null,
        dailyCheckIns: [],
        sessionSummaries: [],
        journal: [],
        leaderboard: [],
        lastSync: null,
        syncVersion: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
