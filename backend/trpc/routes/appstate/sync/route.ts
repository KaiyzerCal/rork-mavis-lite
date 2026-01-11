import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    quests: z.array(z.any()).optional(),
    skills: z.array(z.any()).optional(),
    vault: z.array(z.any()).optional(),
    dailyCheckIns: z.array(z.any()).optional(),
  }))
  .mutation(async ({ input }) => {
    const timestamp = new Date().toISOString();
    const { userId } = input;

    const stateData = {
      userId,
      quests: input.quests || [],
      skills: input.skills || [],
      vault: input.vault || [],
      dailyCheckIns: input.dailyCheckIns || [],
      lastSync: timestamp,
    };

    const existing = await query(`SELECT * FROM type::thing('app_state', $userId)`, { userId });

    if (!existing || existing.length === 0 || !existing[0]) {
      await query(`CREATE type::thing('app_state', $userId) CONTENT $data`, {
        userId,
        data: stateData,
      });
    } else {
      await query(`UPDATE type::thing('app_state', $userId) MERGE $data`, {
        userId,
        data: stateData,
      });
    }

    return {
      success: true,
      timestamp,
    };
  });
