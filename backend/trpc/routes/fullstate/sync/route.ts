import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    user: z.any().optional(),
    skills: z.array(z.any()).optional(),
    quests: z.array(z.any()).optional(),
    vault: z.array(z.any()).optional(),
    memoryItems: z.array(z.any()).optional(),
    chatHistory: z.array(z.any()).optional(),
    naviProfile: z.any().optional(),
    dailyCheckIns: z.array(z.any()).optional(),
    sessionSummaries: z.array(z.any()).optional(),
    journal: z.array(z.any()).optional(),
    leaderboard: z.array(z.any()).optional(),
    settings: z.any().optional(),
    stats: z.array(z.any()).optional(),
    sessions: z.array(z.any()).optional(),
    tools: z.array(z.any()).optional(),
    network: z.array(z.any()).optional(),
    archetypeEvolutions: z.array(z.any()).optional(),
    customCouncilMembers: z.array(z.any()).optional(),
    relationshipMemories: z.array(z.any()).optional(),
    naviState: z.any().optional(),
    files: z.array(z.any()).optional(),
    generatedImages: z.array(z.any()).optional(),
    ltmBlocks: z.array(z.any()).optional(),
  }))
  .mutation(async ({ input }) => {
    const timestamp = new Date().toISOString();
    const { userId } = input;

    console.log('[FullState Sync] Syncing full state for user:', userId);

    try {
      const fullState = {
        userId,
        user: JSON.stringify(input.user || {}),
        skills: JSON.stringify(input.skills || []),
        quests: JSON.stringify(input.quests || []),
        vault: JSON.stringify(input.vault || []),
        memoryItems: JSON.stringify(input.memoryItems || []),
        chatHistory: JSON.stringify(input.chatHistory || []),
        naviProfile: JSON.stringify(input.naviProfile || {}),
        dailyCheckIns: JSON.stringify(input.dailyCheckIns || []),
        sessionSummaries: JSON.stringify(input.sessionSummaries || []),
        journal: JSON.stringify(input.journal || []),
        leaderboard: JSON.stringify(input.leaderboard || []),
        settings: JSON.stringify(input.settings || {}),
        stats: JSON.stringify(input.stats || []),
        sessions: JSON.stringify(input.sessions || []),
        tools: JSON.stringify(input.tools || []),
        network: JSON.stringify(input.network || []),
        archetypeEvolutions: JSON.stringify(input.archetypeEvolutions || []),
        customCouncilMembers: JSON.stringify(input.customCouncilMembers || []),
        relationshipMemories: JSON.stringify(input.relationshipMemories || []),
        naviState: JSON.stringify(input.naviState || {}),
        files: JSON.stringify(input.files || []),
        generatedImages: JSON.stringify(input.generatedImages || []),
        ltmBlocks: JSON.stringify(input.ltmBlocks || []),
        lastSync: timestamp,
        syncVersion: 1,
      };

      const existing = await query(`SELECT * FROM full_state WHERE userId = $userId LIMIT 1`, { userId });

      if (!existing || existing.length === 0 || (Array.isArray(existing[0]?.result) && existing[0].result.length === 0)) {
        const hasResult = existing && existing.length > 0 && existing[0]?.result && existing[0].result.length > 0;
        
        if (!hasResult) {
          await query(`INSERT INTO full_state (userId, user, skills, quests, vault, memoryItems, chatHistory, naviProfile, dailyCheckIns, sessionSummaries, journal, leaderboard, settings, stats, sessions, tools, network, archetypeEvolutions, customCouncilMembers, relationshipMemories, naviState, files, generatedImages, ltmBlocks, lastSync, syncVersion) VALUES ($userId, $user, $skills, $quests, $vault, $memoryItems, $chatHistory, $naviProfile, $dailyCheckIns, $sessionSummaries, $journal, $leaderboard, $settings, $stats, $sessions, $tools, $network, $archetypeEvolutions, $customCouncilMembers, $relationshipMemories, $naviState, $files, $generatedImages, $ltmBlocks, $lastSync, $syncVersion)`, fullState);
          console.log('[FullState Sync] Created new state record');
        } else {
          await query(`UPDATE full_state SET user = $user, skills = $skills, quests = $quests, vault = $vault, memoryItems = $memoryItems, chatHistory = $chatHistory, naviProfile = $naviProfile, dailyCheckIns = $dailyCheckIns, sessionSummaries = $sessionSummaries, journal = $journal, leaderboard = $leaderboard, settings = $settings, stats = $stats, sessions = $sessions, tools = $tools, network = $network, archetypeEvolutions = $archetypeEvolutions, customCouncilMembers = $customCouncilMembers, relationshipMemories = $relationshipMemories, naviState = $naviState, files = $files, generatedImages = $generatedImages, ltmBlocks = $ltmBlocks, lastSync = $lastSync, syncVersion = syncVersion + 1 WHERE userId = $userId`, fullState);
          console.log('[FullState Sync] Updated existing state record');
        }
      } else {
        await query(`UPDATE full_state SET user = $user, skills = $skills, quests = $quests, vault = $vault, memoryItems = $memoryItems, chatHistory = $chatHistory, naviProfile = $naviProfile, dailyCheckIns = $dailyCheckIns, sessionSummaries = $sessionSummaries, journal = $journal, leaderboard = $leaderboard, settings = $settings, stats = $stats, sessions = $sessions, tools = $tools, network = $network, archetypeEvolutions = $archetypeEvolutions, customCouncilMembers = $customCouncilMembers, relationshipMemories = $relationshipMemories, naviState = $naviState, files = $files, generatedImages = $generatedImages, ltmBlocks = $ltmBlocks, lastSync = $lastSync, syncVersion = syncVersion + 1 WHERE userId = $userId`, fullState);
        console.log('[FullState Sync] Updated existing state record');
      }

      const syncedCounts = {
        quests: input.quests?.length || 0,
        skills: input.skills?.length || 0,
        memories: input.memoryItems?.length || 0,
        messages: input.chatHistory?.reduce((acc: number, thread: any) => acc + (thread.messages?.length || 0), 0) || 0,
        vault: input.vault?.length || 0,
        checkIns: input.dailyCheckIns?.length || 0,
        journal: input.journal?.length || 0,
        files: input.files?.length || 0,
        images: input.generatedImages?.length || 0,
        relationshipMemories: input.relationshipMemories?.length || 0,
        ltmBlocks: input.ltmBlocks?.length || 0,
      };

      console.log('[FullState Sync] Synced counts:', syncedCounts);

      return {
        success: true,
        timestamp,
        syncedCounts,
      };
    } catch (error) {
      console.error('[FullState Sync] Error:', error);
      return {
        success: false,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedCounts: {
          quests: 0,
          skills: 0,
          memories: 0,
          messages: 0,
          vault: 0,
          checkIns: 0,
          journal: 0,
          files: 0,
          images: 0,
          relationshipMemories: 0,
          ltmBlocks: 0,
        },
      };
    }
  });
