import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    questId: z.string(),
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const { questId, userId } = input;

    console.log('[Quests] Getting quest:', questId, 'for user:', userId);

    try {
      const result = await query(`SELECT * FROM quests WHERE id = $questId AND userId = $userId LIMIT 1`, { questId, userId });

      if (!result || result.length === 0) {
        return {
          success: false,
          error: 'Quest not found',
          quest: null,
        };
      }

      const quest = result[0];
      return {
        success: true,
        quest: {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: quest.difficulty,
          deadline: quest.deadline,
          status: quest.status,
          createdAt: quest.createdAt,
          createdBy: quest.createdBy,
          completedAt: quest.completedAt,
          xpReward: quest.xpReward,
          associatedSkills: quest.associatedSkills ? JSON.parse(quest.associatedSkills) : [],
          milestones: quest.milestones ? JSON.parse(quest.milestones) : [],
        },
      };
    } catch (error) {
      console.error('[Quests] Error getting quest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        quest: null,
      };
    }
  });
