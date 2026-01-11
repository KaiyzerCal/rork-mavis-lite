import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  xp: z.number(),
  tags: z.array(z.string()),
  notes: z.string(),
  subSkills: z.array(z.object({
    id: z.string(),
    name: z.string(),
    level: z.number(),
    xp: z.number(),
    notes: z.string(),
  })).optional(),
});

const QuestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  category: z.string(),
  difficulty: z.string(),
  xpReward: z.number(),
  relatedToClass: z.boolean(),
  status: z.string(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  milestones: z.array(z.object({
    id: z.string(),
    description: z.string(),
    completed: z.boolean(),
  })),
  associatedSkills: z.array(z.string()).optional(),
});

const VaultEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  content: z.string(),
  date: z.string(),
  tags: z.array(z.string()),
  mood: z.number().optional(),
  energy: z.number().optional(),
});

const MemoryItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  importanceScore: z.number(),
  sourceTags: z.array(z.string()),
});

const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  timestamp: z.string(),
  full_output: z.string().optional(),
  output_tokens: z.number().optional(),
  is_summary: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const ChatThreadSchema = z.object({
  id: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  focusRhythm: z.string(),
  timezone: z.string(),
  hasCompletedAssessment: z.boolean(),
  characterClass: z.object({
    mbti: z.string(),
    archetype: z.string(),
    level: z.number(),
    rank: z.string(),
    xp: z.number(),
    traits: z.array(z.string()),
    strengths: z.array(z.string()),
    growthAreas: z.array(z.string()),
    hiddenClass: z.string().optional(),
    hiddenClassUnlockedAt: z.string().optional(),
  }).optional(),
});

const NaviProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  personalityPreset: z.string(),
  skinId: z.string(),
  currentMode: z.string(),
  level: z.number(),
  xp: z.number(),
  rank: z.string(),
  bondLevel: z.number(),
  affection: z.number(),
  loyalty: z.number(),
  trust: z.number(),
  bondTitle: z.string(),
  personalityState: z.string(),
  unlockedFeatures: z.array(z.string()),
  interactionCount: z.number(),
  lastInteraction: z.string().optional(),
  avatarDescription: z.string(),
  memoryEnabled: z.boolean(),
  avatar: z.object({
    type: z.string(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    backgroundColor: z.string(),
    shape: z.string(),
  }),
  coreStats: z.object({
    logic: z.number(),
    creativity: z.number(),
    empathy: z.number(),
    efficiency: z.number(),
  }),
  enabledModes: z.object({
    life_os: z.boolean(),
    work_os: z.boolean(),
    social_os: z.boolean(),
    metaverse_os: z.boolean(),
  }),
});

const DailyCheckInSchema = z.object({
  id: z.string(),
  date: z.string(),
  energy: z.number(),
  stress: z.number(),
  mood: z.number(),
  mainGoal: z.string().optional(),
});

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    user: UserSchema.optional(),
    skills: z.array(SkillSchema).optional(),
    quests: z.array(QuestSchema).optional(),
    vault: z.array(VaultEntrySchema).optional(),
    memoryItems: z.array(MemoryItemSchema).optional(),
    chatHistory: z.array(ChatThreadSchema).optional(),
    naviProfile: NaviProfileSchema.optional(),
    dailyCheckIns: z.array(DailyCheckInSchema).optional(),
    sessionSummaries: z.array(z.any()).optional(),
    journal: z.array(z.any()).optional(),
    leaderboard: z.array(z.any()).optional(),
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
        lastSync: timestamp,
        syncVersion: 1,
      };

      const existing = await query(`SELECT * FROM full_state WHERE userId = $userId LIMIT 1`, { userId });

      if (!existing || existing.length === 0) {
        await query(`INSERT INTO full_state (userId, user, skills, quests, vault, memoryItems, chatHistory, naviProfile, dailyCheckIns, sessionSummaries, journal, leaderboard, lastSync, syncVersion) VALUES ($userId, $user, $skills, $quests, $vault, $memoryItems, $chatHistory, $naviProfile, $dailyCheckIns, $sessionSummaries, $journal, $leaderboard, $lastSync, $syncVersion)`, fullState);
        console.log('[FullState Sync] Created new state record');
      } else {
        await query(`UPDATE full_state SET user = $user, skills = $skills, quests = $quests, vault = $vault, memoryItems = $memoryItems, chatHistory = $chatHistory, naviProfile = $naviProfile, dailyCheckIns = $dailyCheckIns, sessionSummaries = $sessionSummaries, journal = $journal, leaderboard = $leaderboard, lastSync = $lastSync, syncVersion = syncVersion + 1 WHERE userId = $userId`, fullState);
        console.log('[FullState Sync] Updated existing state record');
      }

      const questCount = input.quests?.length || 0;
      const skillCount = input.skills?.length || 0;
      const memoryCount = input.memoryItems?.length || 0;
      const chatCount = input.chatHistory?.reduce((acc, thread) => acc + thread.messages.length, 0) || 0;

      return {
        success: true,
        timestamp,
        syncedCounts: {
          quests: questCount,
          skills: skillCount,
          memories: memoryCount,
          messages: chatCount,
          vault: input.vault?.length || 0,
          checkIns: input.dailyCheckIns?.length || 0,
        },
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
        },
      };
    }
  });
