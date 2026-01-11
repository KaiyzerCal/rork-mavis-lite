import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const QUEST_XP_VALUES: Record<string, number> = {
  minor: 50,
  standard: 100,
  hard: 200,
  major: 350,
  side: 75,
  legendary: 500,
};

export const createQuestProcedure = protectedProcedure
  .input(
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string().optional(),
      difficulty: z.enum(['minor', 'standard', 'hard', 'major', 'side', 'legendary']).optional(),
      deadline: z.string().optional(),
      associatedSkills: z.array(z.string()).optional(),
    })
  )
  .mutation(async ({ input }: { input: { title: string; description: string; category?: string; difficulty?: 'minor' | 'standard' | 'hard' | 'major' | 'side' | 'legendary'; deadline?: string; associatedSkills?: string[] } }) => {
    const questId = `q-${Date.now()}`;
    
    const difficulty = input.difficulty || 'standard';
    const xpReward = QUEST_XP_VALUES[difficulty];
    
    const quest = {
      id: questId,
      title: input.title,
      description: input.description,
      category: input.category || 'General',
      difficulty,
      deadline: input.deadline,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      createdBy: 'Navi.EXE',
      xpReward,
      associatedSkills: input.associatedSkills || [],
      milestones: [],
    };
    
    console.log('[Quests] Created quest:', quest);
    
    return quest;
  });

export default createQuestProcedure;
