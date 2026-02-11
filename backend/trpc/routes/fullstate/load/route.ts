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

      let row: any = null;

      if (result && result.length > 0) {
        if (result[0]?.result && Array.isArray(result[0].result) && result[0].result.length > 0) {
          row = result[0].result[0];
        } else if (result[0] && !result[0].result) {
          row = result[0];
        }
      }

      if (!row) {
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
          settings: null,
          stats: [],
          sessions: [],
          tools: [],
          network: [],
          archetypeEvolutions: [],
          customCouncilMembers: [],
          relationshipMemories: [],
          naviState: null,
          files: [],
          generatedImages: [],
          ltmBlocks: [],
          lastSync: null,
          syncVersion: 0,
        };
      }

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

      const loaded = {
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
        settings: parseJSON(row.settings, null),
        stats: parseJSON(row.stats, []),
        sessions: parseJSON(row.sessions, []),
        tools: parseJSON(row.tools, []),
        network: parseJSON(row.network, []),
        archetypeEvolutions: parseJSON(row.archetypeEvolutions, []),
        customCouncilMembers: parseJSON(row.customCouncilMembers, []),
        relationshipMemories: parseJSON(row.relationshipMemories, []),
        naviState: parseJSON(row.naviState, null),
        files: parseJSON(row.files, []),
        generatedImages: parseJSON(row.generatedImages, []),
        ltmBlocks: parseJSON(row.ltmBlocks, []),
        lastSync: row.lastSync || null,
        syncVersion: row.syncVersion || 0,
      };

      console.log('[FullState Load] Loaded state:', {
        quests: loaded.quests.length,
        skills: loaded.skills.length,
        vault: loaded.vault.length,
        memories: loaded.memoryItems.length,
        chatThreads: loaded.chatHistory.length,
        journal: loaded.journal.length,
        files: loaded.files.length,
        images: loaded.generatedImages.length,
        ltmBlocks: loaded.ltmBlocks.length,
      });

      return loaded;
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
        settings: null,
        stats: [],
        sessions: [],
        tools: [],
        network: [],
        archetypeEvolutions: [],
        customCouncilMembers: [],
        relationshipMemories: [],
        naviState: null,
        files: [],
        generatedImages: [],
        ltmBlocks: [],
        lastSync: null,
        syncVersion: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
