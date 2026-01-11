import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const result = await query(`
      SELECT * FROM navi_profiles 
      WHERE userId = $userId
      LIMIT 1
    `, {
      userId: input.userId,
    });

    if (result.length === 0) {
      return {
        userId: input.userId,
        name: 'Navi.EXE',
        personalityPreset: 'balanced',
        personalityState: 'Supportive',
        currentMode: 'standard',
        skinId: 'megaman',
        level: 1,
        xp: 0,
        rank: 'Net-Navi',
        affection: 50,
        trust: 50,
        loyalty: 50,
        bondLevel: 1,
        bondTitle: 'New Partner',
        unlockedFeatures: [],
        interactionCount: 0,
        lastInteraction: new Date().toISOString(),
        avatar: {
          type: 'cpu' as const,
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          backgroundColor: '#dbeafe',
          shape: 'hexagon' as const,
        },
      };
    }

    const row = result[0];
    return {
      userId: row.userId,
      name: row.name,
      personalityPreset: row.personalityPreset,
      personalityState: row.personalityState,
      currentMode: row.currentMode,
      skinId: row.skinId,
      level: row.level,
      xp: row.xp,
      rank: row.rank,
      affection: row.affection,
      trust: row.trust,
      loyalty: row.loyalty,
      bondLevel: row.bondLevel,
      bondTitle: row.bondTitle,
      unlockedFeatures: row.unlockedFeatures ? JSON.parse(row.unlockedFeatures) : [],
      interactionCount: row.interactionCount,
      lastInteraction: row.lastInteraction,
      avatar: row.avatar ? JSON.parse(row.avatar) : {
        type: 'cpu',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        backgroundColor: '#dbeafe',
        shape: 'hexagon',
      },
    };
  });
