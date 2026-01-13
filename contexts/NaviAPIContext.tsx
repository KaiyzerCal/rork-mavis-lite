import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { useApp } from './AppContext';
import type { Quest, Skill, VaultEntry, MemoryItem, ChatMessage, DailyCheckIn, NaviProfile } from '@/types';

const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Network request failed') ||
    message.includes('JSON Parse error') ||
    message.includes('Unexpected character') ||
    message.includes('fetch failed') ||
    message.includes('Failed to fetch') ||
    message.includes('network') ||
    message.includes('ECONNREFUSED')
  );
};

export interface NaviDatabaseAPI {
  stats: {
    get: () => Promise<{
      level: number;
      xp: number;
      rank: string;
      characterClass: any;
      totalXP: number;
      questsCompleted: number;
      skillsCount: number;
    }>;
    update: (updates: { xp?: number; level?: number }) => Promise<void>;
  };
  
  quests: {
    getAll: (filter?: { status?: Quest['status']; tag?: string }) => Promise<Quest[]>;
    create: (quest: Omit<Quest, 'id' | 'createdAt' | 'status'>) => Promise<Quest>;
    updateStatus: (questId: string, status: Quest['status']) => Promise<{ quest: Quest; xpDelta?: number }>;
    delete: (questId: string) => Promise<void>;
    acceptQuest: (questId: string) => Promise<void>;
    declineQuest: (questId: string) => Promise<void>;
    completeQuest: (questId: string) => Promise<void>;
  };
  
  skills: {
    getAll: () => Promise<Skill[]>;
    create: (skill: Omit<Skill, 'id'>) => Promise<Skill>;
    updateLevel: (skillId: string, xpDelta: number) => Promise<Skill>;
    delete: (skillId: string) => Promise<void>;
  };
  
  vault: {
    getAll: (filter?: { tag?: string }) => Promise<VaultEntry[]>;
    create: (entry: Omit<VaultEntry, 'id' | 'date'>) => Promise<VaultEntry>;
    update: (entryId: string, updates: Partial<VaultEntry>) => Promise<VaultEntry>;
    delete: (entryId: string) => Promise<void>;
  };
  
  conversations: {
    save: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<ChatMessage>;
    load: (threadId?: string, limit?: number) => Promise<ChatMessage[]>;
    clear: () => Promise<void>;
  };
  
  memory: {
    save: (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MemoryItem>;
    load: (filter?: { type?: MemoryItem['type'] }) => Promise<MemoryItem[]>;
    delete: (itemId: string) => Promise<void>;
    getRelevant: () => Promise<MemoryItem[]>;
  };
  
  navi: {
    getProfile: () => Promise<NaviProfile>;
    updateProfile: (updates: Partial<NaviProfile>) => Promise<NaviProfile>;
    incrementBond: (type: 'message' | 'positive' | 'emotional') => Promise<void>;
    incrementInteraction: () => Promise<void>;
  };
  
  sync: {
    omnisync: () => Promise<{
      success: boolean;
      message: string;
      timestamp: string;
      snapshot: any;
    }>;
    getFullState: () => Promise<any>;
  };
  
  dailyCheckIn: {
    create: (checkIn: Omit<DailyCheckIn, 'id' | 'date'>) => Promise<DailyCheckIn>;
    getToday: () => Promise<DailyCheckIn | undefined>;
  };
}

export const [NaviAPIProvider, useNaviAPI] = createContextHook((): NaviDatabaseAPI => {
  const {
    state,
    updateCharacterClassXP,
    addQuest,
    updateQuest,
    acceptQuest,
    declineQuest,
    completeQuest,
    deleteQuest,
    addSkill,
    addSkillXP,
    deleteSkill,
    addVaultEntry,
    updateVaultEntry,
    deleteVaultEntry,
    saveChatMessage,
    getChatHistory,
    clearChatHistory,
    addMemoryItem,
    deleteMemoryItem,
    getRelevantMemories,
    updateNaviProfile,
    incrementBondOnMessage,
    incrementBondOnPositiveEngagement,
    incrementBondOnEmotionalDisclosure,
    incrementNaviInteraction,
    addDailyCheckIn,
    getTodayCheckIn,
    omnisync,
  } = useApp();
  
  const conversationSaveMutation = trpc.conversations.save.useMutation();
  const memorySaveMutation = trpc.memory.save.useMutation();
  const naviProfileUpdateMutation = trpc.navi.updateProfile.useMutation();
  const appStateSyncMutation = trpc.appstate.sync.useMutation();
  
  const userId = state.user.id;
  
  const statsAPI = {
    get: async () => {
      const characterClass = state.user.characterClass;
      const totalXP = state.leaderboard.find(l => l.id === 'me')?.xp || 0;
      const questsCompleted = state.quests.filter(q => q.status === 'completed').length;
      
      return {
        level: characterClass?.level || 1,
        xp: characterClass?.xp || 0,
        rank: characterClass?.rank || 'Novice',
        characterClass,
        totalXP,
        questsCompleted,
        skillsCount: state.skills.length,
      };
    },
    update: async (updates: { xp?: number; level?: number }) => {
      if (updates.xp) {
        updateCharacterClassXP(updates.xp);
      }
    },
  };
  
  const questsAPI = {
    getAll: async (filter?: { status?: Quest['status']; tag?: string }) => {
      let quests = state.quests;
      
      if (filter?.status) {
        quests = quests.filter(q => q.status === filter.status);
      }
      
      return quests;
    },
    create: async (quest: Omit<Quest, 'id' | 'createdAt' | 'status'>) => {
      addQuest(quest);
      const newQuest: Quest = {
        ...quest,
        id: `q-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      return newQuest;
    },
    updateStatus: async (questId: string, status: Quest['status']) => {
      const quest = state.quests.find(q => q.id === questId);
      if (!quest) throw new Error('Quest not found');
      
      updateQuest(questId, { status });
      
      return { 
        quest: { ...quest, status },
        xpDelta: status === 'completed' ? quest.xpReward : undefined
      };
    },
    delete: async (questId: string) => {
      deleteQuest(questId);
    },
    acceptQuest: async (questId: string) => {
      acceptQuest(questId);
    },
    declineQuest: async (questId: string) => {
      declineQuest(questId);
    },
    completeQuest: async (questId: string) => {
      completeQuest(questId);
    },
  };
  
  const skillsAPI = {
    getAll: async () => {
      return state.skills;
    },
    create: async (skill: Omit<Skill, 'id'>) => {
      addSkill(skill);
      const newSkill: Skill = {
        ...skill,
        id: `s-${Date.now()}`,
      };
      return newSkill;
    },
    updateLevel: async (skillId: string, xpDelta: number) => {
      addSkillXP(skillId, xpDelta);
      const skill = state.skills.find(s => s.id === skillId);
      if (!skill) throw new Error('Skill not found');
      return skill;
    },
    delete: async (skillId: string) => {
      deleteSkill(skillId);
    },
  };
  
  const vaultAPI = {
    getAll: async (filter?: { tag?: string }) => {
      let entries = state.vault;
      
      if (filter?.tag) {
        entries = entries.filter(e => e.tags.includes(filter.tag!));
      }
      
      return entries;
    },
    create: async (entry: Omit<VaultEntry, 'id' | 'date'>) => {
      addVaultEntry(entry);
      const newEntry: VaultEntry = {
        ...entry,
        id: `v-${Date.now()}`,
        date: new Date().toISOString(),
      };
      return newEntry;
    },
    update: async (entryId: string, updates: Partial<VaultEntry>) => {
      updateVaultEntry(entryId, updates);
      const entry = state.vault.find(e => e.id === entryId);
      if (!entry) throw new Error('Vault entry not found');
      return { ...entry, ...updates };
    },
    delete: async (entryId: string) => {
      deleteVaultEntry(entryId);
    },
  };
  
  const conversationsAPI = {
    save: async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      const effectiveContent = message.full_output || message.content || '';
      
      console.log('[NaviAPI] 💾 Saving conversation...', { 
        role: message.role, 
        contentLength: message.content?.length || 0,
        fullOutputLength: message.full_output?.length || 0,
        effectiveLength: effectiveContent.length,
        messageId,
      });
      
      const fullMessage: ChatMessage = {
        id: messageId,
        role: message.role,
        content: effectiveContent,
        full_output: effectiveContent,
        timestamp: timestamp,
        output_tokens: message.output_tokens || effectiveContent.length,
        is_summary: message.is_summary || false,
        metadata: {
          ...message.metadata,
          savedAt: timestamp,
          contentLength: effectiveContent.length,
          wasTruncated: false,
        },
      };
      
      saveChatMessage(fullMessage);
      console.log('[NaviAPI] ✅ Message saved locally with ID:', messageId);
      
      try {
        const result = await conversationSaveMutation.mutateAsync({
          userId,
          role: message.role === 'user' ? 'user' : 'assistant',
          content: effectiveContent,
          fullOutput: effectiveContent,
          metadata: fullMessage.metadata,
        });
        
        console.log('[NaviAPI] ✅ Message also synced to backend:', result.id);
      } catch (error) {
        if (!isNetworkError(error)) {
          console.log('[NaviAPI] ⚠️ Backend sync failed, message saved locally only');
        }
      }
      
      return fullMessage;
    },
    load: async (threadId?: string, limit?: number) => {
      console.log('[NaviAPI] Loading conversations from backend...');
      
      try {
        const messages = getChatHistory();
        console.log('[NaviAPI] Loaded from local storage:', messages.length);
        return messages;
      } catch (error) {
        console.error('[NaviAPI] Failed to load from backend:', error);
        return getChatHistory();
      }
    },
    clear: async () => {
      clearChatHistory();
    },
  };
  
  const memoryAPI = {
    save: async (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      console.log('[NaviAPI] Saving memory to backend...', { type: item.type, importance: item.importanceScore });
      
      try {
        const mappedType = item.type === 'identity' ? 'preference' : 
                          item.type === 'pattern' ? 'insight' : 
                          item.type === 'win' ? 'achievement' : 
                          item.type === 'struggle' ? 'challenge' : 
                          item.type as 'preference' | 'goal' | 'challenge' | 'insight' | 'achievement' | 'relationship';
        
        const result = await memorySaveMutation.mutateAsync({
          userId,
          type: mappedType,
          content: item.content,
          importanceScore: item.importanceScore as 0 | 1 | 2 | 3,
          tags: item.sourceTags,
        });
        
        console.log('[NaviAPI] Memory saved to backend:', result.id);
        
        const newItem: MemoryItem = {
          id: result.id,
          type: item.type,
          content: result.content,
          importanceScore: item.importanceScore,
          sourceTags: result.tags || [],
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };
        
        addMemoryItem(newItem);
        
        return newItem;
      } catch (error) {
        if (!isNetworkError(error)) {
          console.log('[NaviAPI] Failed to save memory to backend, saving locally only');
        }
        const newItem: MemoryItem = {
          ...item,
          id: `mem-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addMemoryItem(newItem);
        return newItem;
      }
    },
    load: async (filter?: { type?: MemoryItem['type'] }) => {
      let items = state.memoryItems;
      
      if (filter?.type) {
        items = items.filter(m => m.type === filter.type);
      }
      
      return items;
    },
    delete: async (itemId: string) => {
      deleteMemoryItem(itemId);
    },
    getRelevant: async () => {
      return getRelevantMemories();
    },
  };
  
  const naviAPI = {
    getProfile: async () => {
      return state.settings.navi.profile;
    },
    updateProfile: async (updates: Partial<NaviProfile>) => {
      console.log('[NaviAPI] Updating Navi profile in backend...', updates);
      
      try {
        const result = await naviProfileUpdateMutation.mutateAsync({
          userId,
          ...updates,
        });
        
        console.log('[NaviAPI] Navi profile updated in backend');
        
        updateNaviProfile(updates);
        
        const fullProfile: NaviProfile = {
          ...state.settings.navi.profile,
          ...result,
        };
        return fullProfile;
      } catch (error) {
        if (!isNetworkError(error)) {
          console.log('[NaviAPI] Failed to update Navi profile in backend, updating locally only');
        }
        updateNaviProfile(updates);
        return { ...state.settings.navi.profile, ...updates };
      }
    },
    incrementBond: async (type: 'message' | 'positive' | 'emotional') => {
      if (type === 'message') {
        incrementBondOnMessage();
      } else if (type === 'positive') {
        incrementBondOnPositiveEngagement();
      } else if (type === 'emotional') {
        incrementBondOnEmotionalDisclosure();
      }
      
      const profile = state.settings.navi.profile;
      try {
        await naviProfileUpdateMutation.mutateAsync({
          userId,
          affection: profile.affection,
          trust: profile.trust,
          loyalty: profile.loyalty,
          bondLevel: profile.bondLevel,
        });
      } catch {
        console.log('[NaviAPI] Bond update saved locally (backend sync skipped)');
      }
    },
    incrementInteraction: async () => {
      incrementNaviInteraction();
      
      const profile = state.settings.navi.profile;
      try {
        await naviProfileUpdateMutation.mutateAsync({
          userId,
          interactionCount: profile.interactionCount,
        });
      } catch {
        console.log('[NaviAPI] Interaction count saved locally (backend sync skipped)');
      }
    },
  };
  
  const syncAPI = {
    omnisync: async () => {
      console.log('[NaviAPI] Starting omnisync to backend...');
      
      try {
        await appStateSyncMutation.mutateAsync({
          userId,
          quests: state.quests,
          skills: state.skills,
          vault: state.vault,
          dailyCheckIns: state.dailyCheckIns,
        });
        
        console.log('[NaviAPI] Omnisync completed successfully');
        
        return omnisync();
      } catch {
        console.log('[NaviAPI] Backend sync skipped, performing local sync');
        return omnisync();
      }
    },
    getFullState: async () => {
      return state;
    },
  };
  
  const dailyCheckInAPI = {
    create: async (checkIn: Omit<DailyCheckIn, 'id' | 'date'>) => {
      addDailyCheckIn(checkIn);
      const today = new Date().toISOString().split('T')[0];
      const newCheckIn: DailyCheckIn = {
        ...checkIn,
        id: `dc-${Date.now()}`,
        date: today,
      };
      return newCheckIn;
    },
    getToday: async () => {
      return getTodayCheckIn();
    },
  };
  
  return {
    stats: statsAPI,
    quests: questsAPI,
    skills: skillsAPI,
    vault: vaultAPI,
    conversations: conversationsAPI,
    memory: memoryAPI,
    navi: naviAPI,
    sync: syncAPI,
    dailyCheckIn: dailyCheckInAPI,
  };
});
