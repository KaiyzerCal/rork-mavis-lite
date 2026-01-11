import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    questId: z.string(),
    userId: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    difficulty: z.enum(['minor', 'standard', 'hard', 'major', 'side', 'legendary']).optional(),
    deadline: z.string().optional().nullable(),
    status: z.enum(['pending', 'active', 'completed', 'declined']).optional(),
    associatedSkills: z.array(z.string()).optional(),
    milestones: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    })).optional(),
  }))
  .mutation(async ({ input }) => {
    const { questId, userId, ...updates } = input;
    const timestamp = new Date().toISOString();

    console.log('[Quests] Updating quest:', questId, 'for user:', userId);

    try {
      const existing = await query(`SELECT * FROM quests WHERE id = $questId AND userId = $userId LIMIT 1`, { questId, userId });

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: 'Quest not found',
        };
      }

      const quest = existing[0];
      const updatedQuest = {
        ...quest,
        title: updates.title ?? quest.title,
        description: updates.description ?? quest.description,
        category: updates.category ?? quest.category,
        difficulty: updates.difficulty ?? quest.difficulty,
        deadline: updates.deadline !== undefined ? updates.deadline : quest.deadline,
        status: updates.status ?? quest.status,
        associatedSkills: updates.associatedSkills ? JSON.stringify(updates.associatedSkills) : quest.associatedSkills,
        milestones: updates.milestones ? JSON.stringify(updates.milestones) : quest.milestones,
        updatedAt: timestamp,
        completedAt: updates.status === 'completed' && quest.status !== 'completed' ? timestamp : quest.completedAt,
      };

      await query(`UPDATE quests SET title = $title, description = $description, category = $category, difficulty = $difficulty, deadline = $deadline, status = $status, associatedSkills = $associatedSkills, milestones = $milestones, updatedAt = $updatedAt, completedAt = $completedAt WHERE id = $questId AND userId = $userId`, {
        questId,
        userId,
        title: updatedQuest.title,
        description: updatedQuest.description,
        category: updatedQuest.category,
        difficulty: updatedQuest.difficulty,
        deadline: updatedQuest.deadline,
        status: updatedQuest.status,
        associatedSkills: updatedQuest.associatedSkills,
        milestones: updatedQuest.milestones,
        updatedAt: updatedQuest.updatedAt,
        completedAt: updatedQuest.completedAt,
      });

      return {
        success: true,
        quest: {
          ...updatedQuest,
          associatedSkills: updates.associatedSkills || (quest.associatedSkills ? JSON.parse(quest.associatedSkills) : []),
          milestones: updates.milestones || (quest.milestones ? JSON.parse(quest.milestones) : []),
        },
      };
    } catch (error) {
      console.error('[Quests] Error updating quest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
