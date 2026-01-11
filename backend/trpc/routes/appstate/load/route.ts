import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const result = await query(`
      SELECT * FROM app_state WHERE userId = $userId LIMIT 1
    `, { userId: input.userId });

    if (result.length === 0) {
      return {
        quests: [],
        skills: [],
        vault: [],
        dailyCheckIns: [],
        lastSync: null,
      };
    }

    const row = result[0];
    return {
      quests: row.quests ? JSON.parse(row.quests) : [],
      skills: row.skills ? JSON.parse(row.skills) : [],
      vault: row.vault ? JSON.parse(row.vault) : [],
      dailyCheckIns: row.dailyCheckIns ? JSON.parse(row.dailyCheckIns) : [],
      lastSync: row.lastSync,
    };
  });
