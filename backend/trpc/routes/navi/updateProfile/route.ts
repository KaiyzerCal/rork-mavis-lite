import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    name: z.string().optional(),
    personalityPreset: z.string().optional(),
    personalityState: z.string().optional(),
    currentMode: z.string().optional(),
    skinId: z.string().optional(),
    level: z.number().optional(),
    xp: z.number().optional(),
    rank: z.string().optional(),
    affection: z.number().optional(),
    trust: z.number().optional(),
    loyalty: z.number().optional(),
    bondLevel: z.number().optional(),
    bondTitle: z.string().optional(),
    unlockedFeatures: z.array(z.string()).optional(),
    interactionCount: z.number().optional(),
    avatar: z.object({
      type: z.string(),
      primaryColor: z.string(),
      secondaryColor: z.string(),
      backgroundColor: z.string(),
      shape: z.string(),
    }).optional(),
  }))
  .mutation(async ({ input }) => {
    const timestamp = new Date().toISOString();
    const { userId, ...updates } = input;
    
    const profileData = {
      userId,
      name: updates.name || 'Navi.EXE',
      personalityPreset: updates.personalityPreset || 'balanced',
      personalityState: updates.personalityState || 'Supportive',
      currentMode: updates.currentMode || 'standard',
      skinId: updates.skinId || 'megaman',
      level: updates.level ?? 1,
      xp: updates.xp ?? 0,
      rank: updates.rank || 'Net-Navi',
      affection: updates.affection ?? 50,
      trust: updates.trust ?? 50,
      loyalty: updates.loyalty ?? 50,
      bondLevel: updates.bondLevel ?? 1,
      bondTitle: updates.bondTitle || 'New Partner',
      unlockedFeatures: updates.unlockedFeatures || [],
      interactionCount: updates.interactionCount ?? 0,
      lastInteraction: timestamp,
      avatar: updates.avatar || {
        type: 'cpu',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        backgroundColor: '#dbeafe',
        shape: 'hexagon',
      },
    };

    const existing = await query(`SELECT * FROM type::thing('navi_profiles', $userId)`, { userId });

    if (!existing || existing.length === 0 || !existing[0]) {
      await query(`CREATE type::thing('navi_profiles', $userId) CONTENT $data`, {
        userId,
        data: profileData,
      });
    } else {
      const updateData: any = { lastInteraction: timestamp };
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });
      
      await query(`UPDATE type::thing('navi_profiles', $userId) MERGE $data`, {
        userId,
        data: updateData,
      });
    }

    const result = await query(`SELECT * FROM type::thing('navi_profiles', $userId)`, { userId });

    const row = result[0] || profileData;
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
      unlockedFeatures: row.unlockedFeatures,
      interactionCount: row.interactionCount,
      lastInteraction: row.lastInteraction,
      avatar: row.avatar,
    };
  });
