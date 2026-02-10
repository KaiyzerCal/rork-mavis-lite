import { SQLiteStorage } from '@/lib/storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { INITIAL_STATE } from '@/constants/seedData';
import type { AppState, CharacterClass, JournalEntry, Quest, Skill, SubSkill, MBTIType, ChatThread, ChatMessage, CouncilMember, VaultEntry, DailyCheckIn, NaviProfile, NaviPersonalityPreset, NaviSkin, NaviMode, MemoryItem, BondTitle, NaviPersonalityState, BondFeature, SessionSummary, RelationshipMemory, AppFile, GeneratedImage } from '@/types';
import { MBTI_TO_ARCHETYPE, ARCHETYPE_DATA } from '@/constants/archetypes';
import { checkHiddenClassUnlock } from '@/constants/hiddenClasses';
import { calculateNaviLevelFromXP, getNaviRank, getQuestXPForNavi, getInteractionXP, getQuestCompletionBonus, getBondLevel, getMemoryExtractionPatterns, BOND_LEVELS } from '@/constants/naviLeveling';
import { compressMemories, loadLongTermMemory, saveLongTermMemory, buildSystemStateBlock, buildCompactMemoryContext, type CompressedMemoryBlock, type LongTermMemoryStore } from '@/lib/memoryEngine';

function isValidArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value !== null && value !== undefined;
}

function safeArray<T>(value: unknown, fallback: T[]): T[] {
  return isValidArray<T>(value) ? value : fallback;
}

const STORAGE_KEY = '@mavis_lite_state';

export const [AppProvider, useApp] = createContextHook(() => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [ltmBlocks, setLtmBlocks] = useState<CompressedMemoryBlock[]>([]);
  const ltmLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    loadState();
    loadLTM();
  }, []);

  const loadLTM = async () => {
    try {
      console.log('[AppContext] Loading long-term memory...');
      const ltm = await loadLongTermMemory();
      if (ltm.blocks.length > 0) {
        setLtmBlocks(ltm.blocks);
        console.log('[AppContext] Loaded', ltm.blocks.length, 'LTM blocks');
      }
      ltmLoadedRef.current = true;
    } catch (error) {
      console.error('[AppContext] Failed to load LTM:', error);
      ltmLoadedRef.current = true;
    }
  };

  useEffect(() => {
    if (isLoaded) {
      const saveState = async () => {
        try {
          await SQLiteStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
          console.error('Failed to save state:', error);
        }
      };
      saveState();
    }
  }, [state, isLoaded]);

  const loadState = async () => {
    try {
      console.log('[AppContext] 💾 Loading state from SQLite...');
      const stored = await SQLiteStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[AppContext] 💾 Parsed state, checking chatHistory...');
        
        const chatHistory = safeArray(parsed.chatHistory, INITIAL_STATE.chatHistory);
        console.log('[AppContext] 💾 Chat history threads:', chatHistory.length);
        
        if (chatHistory.length > 0) {
          const firstThread = chatHistory[0];
          console.log('[AppContext] 💾 FULLPERSIST v4: First thread messages:', firstThread.messages?.length || 0);
          
          if (firstThread.messages && firstThread.messages.length > 0) {
            console.log('[AppContext] 💾 FULLPERSIST v4: Loading messages from storage');
            const lastThree = firstThread.messages.slice(-3);
            lastThree.forEach((msg: ChatMessage, idx: number) => {
              console.log(`[AppContext] 💾 Message ${firstThread.messages.length - 3 + idx + 1}:`, {
                role: msg.role,
                contentLength: msg.content.length,
                fullOutputLength: msg.full_output?.length || 0,
                hasFullOutput: !!msg.full_output,
                contentMatchesFullOutput: msg.content === msg.full_output,
                contentFirst100: msg.content.substring(0, 100) + '...',
                contentLast100: '...' + msg.content.substring(Math.max(0, msg.content.length - 100)),
                persistVersion: msg.metadata?.persistVersion,
              });
            });
          }
        }
        
        const mergedState: AppState = {
          ...INITIAL_STATE,
          user: parsed.user && typeof parsed.user === 'object' ? { ...INITIAL_STATE.user, ...parsed.user } : INITIAL_STATE.user,
          skills: safeArray(parsed.skills, INITIAL_STATE.skills),
          stats: safeArray(parsed.stats, INITIAL_STATE.stats),
          journal: safeArray(parsed.journal, INITIAL_STATE.journal),
          sessions: safeArray(parsed.sessions, INITIAL_STATE.sessions),
          tools: safeArray(parsed.tools, INITIAL_STATE.tools),
          network: safeArray(parsed.network, INITIAL_STATE.network),
          leaderboard: safeArray(parsed.leaderboard, INITIAL_STATE.leaderboard),
          quests: safeArray(parsed.quests, INITIAL_STATE.quests),
          archetypeEvolutions: safeArray(parsed.archetypeEvolutions, INITIAL_STATE.archetypeEvolutions),
          chatHistory: chatHistory,
          customCouncilMembers: safeArray(parsed.customCouncilMembers, INITIAL_STATE.customCouncilMembers),
          vault: safeArray(parsed.vault, INITIAL_STATE.vault),
          dailyCheckIns: safeArray(parsed.dailyCheckIns, INITIAL_STATE.dailyCheckIns),
          memoryItems: safeArray(parsed.memoryItems, INITIAL_STATE.memoryItems),
          sessionSummaries: safeArray(parsed.sessionSummaries, INITIAL_STATE.sessionSummaries),
          relationshipMemories: safeArray(parsed.relationshipMemories, INITIAL_STATE.relationshipMemories),
          naviState: parsed.naviState && typeof parsed.naviState === 'object' ? { ...INITIAL_STATE.naviState, ...parsed.naviState } : INITIAL_STATE.naviState,
          settings: parsed.settings && typeof parsed.settings === 'object' ? { 
            ...INITIAL_STATE.settings, 
            ...parsed.settings,
            navi: parsed.settings.navi && typeof parsed.settings.navi === 'object' && parsed.settings.navi.profile
              ? { profile: { ...INITIAL_STATE.settings.navi.profile, ...parsed.settings.navi.profile } }
              : INITIAL_STATE.settings.navi
          } : INITIAL_STATE.settings,
        };
        setState(mergedState);
        console.log('[AppContext] ✅ State loaded successfully');
      } else {
        console.log('[AppContext] 🆕 No stored state found, using initial state');
        setState(INITIAL_STATE);
      }
    } catch (error) {
      console.error('[AppContext] ❌ Failed to load state:', error);
      setState(INITIAL_STATE);
    } finally {
      setIsLoaded(true);
    }
  };







  const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `j-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      journal: [newEntry, ...prev.journal],
    }));
  }, []);



  const addSkill = useCallback((skill: Omit<Skill, 'id'>) => {
    const newSkill: Skill = {
      ...skill,
      id: `s-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill],
    }));
  }, []);

  const updateSkill = useCallback((skillId: string, updates: Partial<Skill>) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === skillId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const deleteSkill = useCallback((skillId: string) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== skillId),
    }));
  }, []);

  const addSkillXP = useCallback((skillId: string, xpAmount: number) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => {
        if (s.id === skillId) {
          const newXP = s.xp + xpAmount;
          const newLevel = Math.max(1, Math.floor(Math.pow(newXP / 100, 0.8)));
          console.log(`[Skills] ${s.name} gained ${xpAmount} XP. Total: ${newXP} XP, Level: ${s.level} → ${newLevel}`);
          if (newLevel > s.level) {
            console.log(`[Skills] 🎉 ${s.name} LEVELED UP to Level ${newLevel}!`);
          }
          return { ...s, xp: newXP, level: newLevel };
        }
        return s;
      }),
    }));
  }, []);

  const addSubSkill = useCallback((skillId: string, subSkill: Omit<SubSkill, 'id'>) => {
    const newSubSkill: SubSkill = {
      ...subSkill,
      id: `ss-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => {
        if (s.id === skillId) {
          return { ...s, subSkills: [...(s.subSkills || []), newSubSkill] };
        }
        return s;
      }),
    }));
  }, []);

  const updateSubSkill = useCallback((skillId: string, subSkillId: string, updates: Partial<SubSkill>) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => {
        if (s.id === skillId) {
          return {
            ...s,
            subSkills: (s.subSkills || []).map((ss) =>
              ss.id === subSkillId ? { ...ss, ...updates } : ss
            ),
          };
        }
        return s;
      }),
    }));
  }, []);

  const deleteSubSkill = useCallback((skillId: string, subSkillId: string) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => {
        if (s.id === skillId) {
          return {
            ...s,
            subSkills: (s.subSkills || []).filter((ss) => ss.id !== subSkillId),
          };
        }
        return s;
      }),
    }));
  }, []);

  const addSubSkillXP = useCallback((skillId: string, subSkillId: string, xpAmount: number) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => {
        if (s.id === skillId) {
          return {
            ...s,
            subSkills: (s.subSkills || []).map((ss) => {
              if (ss.id === subSkillId) {
                const newXP = ss.xp + xpAmount;
                const newLevel = Math.max(1, Math.floor(Math.pow(newXP / 100, 0.8)));
                console.log(`[SubSkills] ${ss.name} gained ${xpAmount} XP. Total: ${newXP} XP, Level: ${ss.level} → ${newLevel}`);
                if (newLevel > ss.level) {
                  console.log(`[SubSkills] 🎉 ${ss.name} LEVELED UP to Level ${newLevel}!`);
                }
                return { ...ss, xp: newXP, level: newLevel };
              }
              return ss;
            }),
          };
        }
        return s;
      }),
    }));
  }, []);

  const setCharacterClass = useCallback((mbti: MBTIType) => {
    const archetype = MBTI_TO_ARCHETYPE[mbti];
    const archetypeInfo = ARCHETYPE_DATA[archetype];
    
    const characterClass: CharacterClass = {
      mbti,
      archetype,
      level: 1,
      rank: archetypeInfo.ranks[0],
      xp: 0,
      traits: archetypeInfo.traits,
      strengths: archetypeInfo.strengths,
      growthAreas: archetypeInfo.growthAreas,
    };

    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        characterClass,
        hasCompletedAssessment: true,
      },
    }));
  }, []);

  const updateCharacterClassXP = useCallback((xpAmount: number) => {
    setState((prev) => {
      if (!prev.user.characterClass) return prev;

      const newXP = prev.user.characterClass.xp + xpAmount;
      const newLevel = Math.floor(Math.pow(newXP / 200, 0.9)) + 1;
      const archetype = prev.user.characterClass.archetype;
      const ranks = ARCHETYPE_DATA[archetype].ranks;
      const rankIndex = Math.min(Math.floor(newLevel / 5), ranks.length - 1);

      const completedQuests = prev.quests.filter(q => q.status === 'completed').length;
      const naviBondLevel = prev.settings.navi.profile.bondLevel;
      const naviInteractionCount = prev.settings.navi.profile.interactionCount;

      const unlockedHiddenClass = checkHiddenClassUnlock(
        newLevel,
        naviBondLevel,
        completedQuests,
        naviInteractionCount
      );

      let hiddenClass = prev.user.characterClass.hiddenClass;
      let hiddenClassUnlockedAt = prev.user.characterClass.hiddenClassUnlockedAt;

      if (unlockedHiddenClass && unlockedHiddenClass !== hiddenClass) {
        hiddenClass = unlockedHiddenClass;
        hiddenClassUnlockedAt = new Date().toISOString();
        console.log(`[Character] 🌟 Hidden class unlocked: ${hiddenClass} at level ${newLevel}!`);
      }

      return {
        ...prev,
        user: {
          ...prev.user,
          characterClass: {
            ...prev.user.characterClass,
            xp: newXP,
            level: newLevel,
            rank: ranks[rankIndex],
            hiddenClass,
            hiddenClassUnlockedAt,
          },
        },
      };
    });
  }, []);

  const toggleQuestMilestone = useCallback((questId: string, milestoneId: string) => {
    setState((prev) => ({
      ...prev,
      quests: prev.quests.map((q) => {
        if (q.id === questId) {
          const updatedMilestones = q.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          return { ...q, milestones: updatedMilestones };
        }
        return q;
      }),
    }));
  }, []);

  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'createdAt' | 'status'>) => {
    console.log('[AppContext] 🎯 Adding quest:', quest.title, 'Difficulty:', quest.difficulty, 'XP:', quest.xpReward);
    const newQuest: Quest = {
      ...quest,
      id: `q-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      quests: [newQuest, ...prev.quests],
    }));
  }, []);

  const updateQuest = useCallback((questId: string, updates: Partial<Quest>) => {
    setState((prev) => ({
      ...prev,
      quests: prev.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
    }));
  }, []);

  const acceptQuest = useCallback((questId: string) => {
    setState((prev) => ({
      ...prev,
      quests: prev.quests.map((q) =>
        q.id === questId ? { ...q, status: 'active' as const } : q
      ),
    }));
  }, []);

  const declineQuest = useCallback((questId: string) => {
    setState((prev) => ({
      ...prev,
      quests: prev.quests.map((q) =>
        q.id === questId ? { ...q, status: 'declined' as const } : q
      ),
    }));
  }, []);

  const completeQuest = useCallback((questId: string) => {
    const quests = safeArray<Quest>(state.quests, []);
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    setState((prev) => {
      const updatedQuests = prev.quests.map((q) =>
        q.id === questId
          ? { ...q, status: 'completed' as const, completedAt: new Date().toISOString() }
          : q
      );

      const updatedLeaderboard = prev.leaderboard.map((l) =>
        l.id === 'me' ? { ...l, xp: l.xp + quest.xpReward } : l
      );

      let updatedUser = prev.user;
      if (quest.relatedToClass && prev.user.characterClass) {
        const newClassXP = prev.user.characterClass.xp + quest.xpReward;
        const newLevel = Math.floor(Math.pow(newClassXP / 200, 0.9)) + 1;
        const archetype = prev.user.characterClass.archetype;
        const ranks = ARCHETYPE_DATA[archetype].ranks;
        const rankIndex = Math.min(Math.floor(newLevel / 2), ranks.length - 1);

        updatedUser = {
          ...prev.user,
          characterClass: {
            ...prev.user.characterClass,
            xp: newClassXP,
            level: newLevel,
            rank: ranks[rankIndex],
          },
        };
      }

      let updatedSkills = prev.skills;
      if (quest.associatedSkills && quest.associatedSkills.length > 0) {
        updatedSkills = prev.skills.map((skill) => {
          if (quest.associatedSkills?.includes(skill.id)) {
            const skillXPReward = Math.floor(quest.xpReward / quest.associatedSkills.length);
            const newXP = skill.xp + skillXPReward;
            const newLevel = Math.floor(Math.pow(newXP / 100, 0.8));
            return { ...skill, xp: newXP, level: Math.max(1, newLevel) };
          }
          return skill;
        });
      }

      const completedMilestones = quest.milestones.filter(m => m.completed).length;
      const naviXPFromQuest = getQuestXPForNavi(quest.difficulty, quest.xpReward);
      const naviXPBonus = getQuestCompletionBonus(completedMilestones, quest.milestones.length);
      const totalNaviXP = naviXPFromQuest + naviXPBonus;
      
      const currentNaviProfile = prev.settings.navi.profile;
      const newNaviXP = currentNaviProfile.xp + totalNaviXP;
      const newNaviLevel = calculateNaviLevelFromXP(newNaviXP);
      const newNaviRank = getNaviRank(newNaviLevel);
      
      console.log(`[Navi] 🎮 Quest completed! Navi gained ${totalNaviXP} XP (${naviXPFromQuest} from quest + ${naviXPBonus} bonus)`);
      console.log(`[Navi] 📊 XP: ${currentNaviProfile.xp} → ${newNaviXP}, Level: ${currentNaviProfile.level} → ${newNaviLevel}`);
      
      if (newNaviLevel > currentNaviProfile.level) {
        console.log(`[Navi] 🎉 LEVEL UP! Navi is now Level ${newNaviLevel} - ${newNaviRank.name}!`);
      }

      return {
        ...prev,
        user: updatedUser,
        quests: updatedQuests,
        leaderboard: updatedLeaderboard,
        skills: updatedSkills,
        settings: {
          ...prev.settings,
          navi: {
            profile: {
              ...currentNaviProfile,
              xp: newNaviXP,
              level: newNaviLevel,
              rank: newNaviRank.name,
            },
          },
        },
      };
    });
  }, [state.quests]);

  const unlockEvolution = useCallback((evolutionId: string) => {
    setState((prev) => ({
      ...prev,
      archetypeEvolutions: prev.archetypeEvolutions.map((e) =>
        e.id === evolutionId ? { ...e, unlocked: true } : e
      ),
    }));
  }, []);

  const calculateLevel = useCallback((xp: number): number => {
    let level = 1;
    let requiredXP = 200;

    while (xp >= requiredXP) {
      level++;
      requiredXP = Math.floor(200 * Math.pow(level, 1.25));
    }

    return level;
  }, []);

  const calculateXPForNextLevel = useCallback((currentXP: number): number => {
    const currentLevel = calculateLevel(currentXP);
    return Math.floor(200 * Math.pow(currentLevel + 1, 1.25));
  }, [calculateLevel]);

  const saveChatMessage = useCallback((message: ChatMessage) => {
    const content = message.full_output || message.content || '';
    
    if (!content || content.trim().length === 0) {
      console.warn('[AppContext] ⚠️ Empty message content, skipping save');
      return;
    }
    
    console.log('[AppContext] 💾 === SAVING MESSAGE ===' );
    console.log('[AppContext] 💾 ID:', message.id);
    console.log('[AppContext] 💾 Role:', message.role);
    console.log('[AppContext] 💾 Content length:', content.length);
    console.log('[AppContext] 💾 Preview:', content.substring(0, 100));
    
    setState((prev) => {
      const chatHistory = safeArray<ChatThread>(prev.chatHistory, []);
      
      let currentThread = chatHistory[0];
      if (!currentThread || !currentThread.id) {
        currentThread = {
          id: `thread-${Date.now()}`,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log('[AppContext] 💾 Created new thread:', currentThread.id);
      }

      const existingMessages = currentThread.messages || [];
      const messageExists = existingMessages.some(m => m.id === message.id);
      
      if (messageExists) {
        console.log('[AppContext] ⚠️ Message already exists, skipping:', message.id);
        return prev;
      }

      const messageToSave: ChatMessage = {
        id: message.id,
        role: message.role,
        content: content,
        full_output: content,
        timestamp: message.timestamp || new Date().toISOString(),
        output_tokens: content.length,
        is_summary: false,
        metadata: {
          ...(message.metadata || {}),
          savedAt: new Date().toISOString(),
          persistVersion: 'v8',
        },
      };

      const updatedMessages = [...existingMessages, messageToSave];
      
      const updatedThread: ChatThread = {
        ...currentThread,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };

      const otherThreads = chatHistory.slice(1);
      const newChatHistory = [updatedThread, ...otherThreads];
      
      const userCount = updatedMessages.filter(m => m.role === 'user').length;
      const assistantCount = updatedMessages.filter(m => m.role === 'assistant').length;
      
      console.log('[AppContext] ✅ MESSAGE SAVED');
      console.log('[AppContext] ✅ Thread now has', updatedMessages.length, 'messages');
      console.log('[AppContext] ✅ User:', userCount, '| Assistant:', assistantCount);
      
      return {
        ...prev,
        chatHistory: newChatHistory,
      };
    });
  }, []);

  const getChatHistory = useCallback((): ChatMessage[] => {
    const chatHistory = safeArray<ChatThread>(state.chatHistory, []);
    const messages = chatHistory[0]?.messages || [];
    
    console.log('[AppContext] 📖 Getting chat history:', messages.length, 'messages');
    
    if (messages.length > 0) {
      const userCount = messages.filter(m => m.role === 'user').length;
      const assistantCount = messages.filter(m => m.role === 'assistant').length;
      console.log('[AppContext] 📖 User:', userCount, '| Assistant:', assistantCount);
    }
    
    return messages;
  }, [state.chatHistory]);

  const clearChatHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      chatHistory: [],
    }));
  }, []);

  const addCouncilMember = useCallback((member: Omit<CouncilMember, 'id'>) => {
    if (!member || !member.name || !member.role || !member.specialty) {
      console.error('Invalid council member data:', member);
      return;
    }
    
    const newMember: CouncilMember = {
      name: member.name,
      role: member.role,
      specialty: member.specialty,
      class: member.class || 'Advisory',
      notes: member.notes,
      id: `cm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setState((prev) => ({
      ...prev,
      customCouncilMembers: [...(safeArray<CouncilMember>(prev.customCouncilMembers, [])), newMember],
    }));
  }, []);

  const updateCouncilMember = useCallback((memberId: string, updates: Partial<CouncilMember>) => {
    if (!memberId || !updates) {
      console.error('Invalid update data for council member');
      return;
    }
    
    setState((prev) => ({
      ...prev,
      customCouncilMembers: safeArray<CouncilMember>(prev.customCouncilMembers, []).map((m: CouncilMember) =>
        m && m.id === memberId ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const deleteCouncilMember = useCallback((memberId: string) => {
    if (!memberId) {
      console.error('Invalid member ID for deletion');
      return;
    }
    
    setState((prev) => ({
      ...prev,
      customCouncilMembers: safeArray<CouncilMember>(prev.customCouncilMembers, []).filter((m: CouncilMember) => m && m.id !== memberId),
    }));
  }, []);

  const deleteQuest = useCallback((questId: string) => {
    setState((prev) => ({
      ...prev,
      quests: prev.quests.filter((q) => q.id !== questId),
    }));
  }, []);

  const addVaultEntry = useCallback((entry: Omit<VaultEntry, 'id' | 'date'>) => {
    const newEntry: VaultEntry = {
      ...entry,
      id: `v-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      vault: [newEntry, ...prev.vault],
    }));
  }, []);

  const updateVaultEntry = useCallback((entryId: string, updates: Partial<VaultEntry>) => {
    setState((prev) => ({
      ...prev,
      vault: prev.vault.map((e) => (e.id === entryId ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteVaultEntry = useCallback((entryId: string) => {
    setState((prev) => ({
      ...prev,
      vault: prev.vault.filter((e) => e.id !== entryId),
    }));
  }, []);

  const addDailyCheckIn = useCallback((checkIn: Omit<DailyCheckIn, 'id' | 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const dailyCheckIns = safeArray<DailyCheckIn>(state.dailyCheckIns, []);
    const existingToday = dailyCheckIns.find(c => c.date === today);
    
    if (existingToday) {
      setState((prev) => ({
        ...prev,
        dailyCheckIns: prev.dailyCheckIns.map((c) =>
          c.date === today ? { ...c, ...checkIn } : c
        ),
      }));
    } else {
      const newCheckIn: DailyCheckIn = {
        ...checkIn,
        id: `dc-${Date.now()}`,
        date: today,
      };
      setState((prev) => ({
        ...prev,
        dailyCheckIns: [newCheckIn, ...prev.dailyCheckIns],
      }));
    }
  }, [state.dailyCheckIns]);

  const getTodayCheckIn = useCallback((): DailyCheckIn | undefined => {
    const today = new Date().toISOString().split('T')[0];
    const dailyCheckIns = safeArray<DailyCheckIn>(state.dailyCheckIns, []);
    return dailyCheckIns.find(c => c.date === today);
  }, [state.dailyCheckIns]);

  const updateNaviProfile = useCallback((updates: Partial<NaviProfile>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        navi: {
          profile: {
            ...prev.settings.navi.profile,
            ...updates,
          },
        },
      },
    }));
  }, []);

  const updateNaviPersonality = useCallback((preset: NaviPersonalityPreset) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        navi: {
          profile: {
            ...prev.settings.navi.profile,
            personalityPreset: preset,
          },
        },
      },
    }));
  }, []);

  const updateNaviSkin = useCallback((skinId: NaviSkin) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        navi: {
          profile: {
            ...prev.settings.navi.profile,
            skinId,
          },
        },
      },
    }));
  }, []);

  const updateNaviMode = useCallback((mode: NaviMode | 'auto') => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        navi: {
          profile: {
            ...prev.settings.navi.profile,
            currentMode: mode,
          },
        },
      },
    }));
  }, []);

  const updateNaviAvatar = useCallback((avatar: Partial<NaviProfile['avatar']>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        navi: {
          profile: {
            ...prev.settings.navi.profile,
            avatar: {
              ...prev.settings.navi.profile.avatar,
              ...avatar,
            },
          },
        },
      },
    }));
  }, []);

  const updateNaviName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        navi: {
          profile: {
            ...prev.settings.navi.profile,
            name,
          },
        },
      },
    }));
  }, []);

  const resetCharacterClass = useCallback(() => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        characterClass: undefined,
        hasCompletedAssessment: false,
      },
    }));
  }, []);

  const incrementNaviInteraction = useCallback(() => {
    setState((prev) => {
      const currentProfile = prev.settings.navi.profile;
      const interactionXP = getInteractionXP();
      const newXP = currentProfile.xp + interactionXP;
      const newLevel = calculateNaviLevelFromXP(newXP);
      const newRank = getNaviRank(newLevel);
      
      if (newLevel > currentProfile.level) {
        console.log(`[Navi] 🎉 LEVEL UP from interaction! Navi is now Level ${newLevel} - ${newRank.name}!`);
      }
      
      return {
        ...prev,
        settings: {
          ...prev.settings,
          navi: {
            profile: {
              ...currentProfile,
              interactionCount: currentProfile.interactionCount + 1,
              lastInteraction: new Date().toISOString(),
              xp: newXP,
              level: newLevel,
              rank: newRank.name,
            },
          },
        },
      };
    });
  }, []);

  const addNaviXP = useCallback((amount: number, reason?: string) => {
    setState((prev) => {
      const currentProfile = prev.settings.navi.profile;
      const newXP = currentProfile.xp + amount;
      const newLevel = calculateNaviLevelFromXP(newXP);
      const newRank = getNaviRank(newLevel);
      
      console.log(`[Navi] ⭐ Gained ${amount} XP${reason ? ` (${reason})` : ''}`);
      console.log(`[Navi] 📊 XP: ${currentProfile.xp} → ${newXP}`);
      
      if (newLevel > currentProfile.level) {
        console.log(`[Navi] 🎉 LEVEL UP! Navi is now Level ${newLevel} - ${newRank.name}!`);
      }
      
      return {
        ...prev,
        settings: {
          ...prev.settings,
          navi: {
            profile: {
              ...currentProfile,
              xp: newXP,
              level: newLevel,
              rank: newRank.name,
            },
          },
        },
      };
    });
  }, []);

  const addMemoryItem = useCallback((item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      memoryItems: [newItem, ...prev.memoryItems],
    }));
  }, []);

  const updateMemoryItem = useCallback((itemId: string, updates: Partial<MemoryItem>) => {
    setState((prev) => ({
      ...prev,
      memoryItems: prev.memoryItems.map((item) =>
        item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ),
    }));
  }, []);

  const deleteMemoryItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      memoryItems: prev.memoryItems.filter((item) => item.id !== itemId),
    }));
  }, []);

  const getRelevantMemories = useCallback((): MemoryItem[] => {
    const memoryItems = safeArray<MemoryItem>(state.memoryItems, []);
    return memoryItems
      .sort((a, b) => {
        const scoreSort = b.importanceScore - a.importanceScore;
        if (scoreSort !== 0) return scoreSort;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, 10);
  }, [state.memoryItems]);

  const updateBondMetrics = useCallback((affectionChange: number, trustChange: number, loyaltyChange: number) => {
    setState((prev) => {
      const currentProfile = prev.settings.navi.profile;
      const newAffection = Math.min(100, Math.max(0, currentProfile.affection + affectionChange));
      const newTrust = Math.min(100, Math.max(0, currentProfile.trust + trustChange));
      const newLoyalty = Math.min(100, Math.max(0, currentProfile.loyalty + loyaltyChange));

      const bondLevelData = getBondLevel(newAffection);
      const newBondLevel = bondLevelData.level;
      const newBondTitle = bondLevelData.title as BondTitle;
      const newPersonalityState = bondLevelData.personalityState as NaviPersonalityState;
      const newUnlockedFeatures: BondFeature[] = [...currentProfile.unlockedFeatures];

      for (const level of BOND_LEVELS) {
        if (newAffection >= level.minAffection) {
          for (const feature of level.features) {
            if (!newUnlockedFeatures.includes(feature as BondFeature)) {
              newUnlockedFeatures.push(feature as BondFeature);
              console.log(`[Bond] 🌟 New feature unlocked: ${feature}`);
            }
          }
        }
      }

      if (newBondLevel > currentProfile.bondLevel) {
        console.log(`[Bond] 💖 BOND LEVEL UP! ${currentProfile.bondLevel} → ${newBondLevel} (${newBondTitle})`);
      }

      return {
        ...prev,
        settings: {
          ...prev.settings,
          navi: {
            profile: {
              ...currentProfile,
              affection: newAffection,
              trust: newTrust,
              loyalty: newLoyalty,
              bondLevel: newBondLevel,
              bondTitle: newBondTitle,
              personalityState: newPersonalityState,
              unlockedFeatures: newUnlockedFeatures,
            },
          },
        },
      };
    });
  }, []);

  const incrementBondOnMessage = useCallback(() => {
    updateBondMetrics(1, 1, 0);
  }, [updateBondMetrics]);

  const incrementBondOnPositiveEngagement = useCallback(() => {
    updateBondMetrics(3, 2, 1);
  }, [updateBondMetrics]);

  const incrementBondOnEmotionalDisclosure = useCallback(() => {
    updateBondMetrics(2, 5, 0);
  }, [updateBondMetrics]);

  const addRelationshipMemory = useCallback((category: string, detail: string, importance: 1 | 2 | 3 | 4 | 5 = 3) => {
    const newMemory = {
      id: `rel-mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      detail: detail.trim(),
      lastUpdated: new Date().toISOString(),
      importance,
    };
    
    setState((prev) => {
      const existingMemories = safeArray<RelationshipMemory>(prev.relationshipMemories, []);
      const isDuplicate = existingMemories.some(m => 
        m.category === category && 
        (m.detail.toLowerCase().includes(detail.toLowerCase().substring(0, 30)) ||
         detail.toLowerCase().includes(m.detail.toLowerCase().substring(0, 30)))
      );
      
      if (isDuplicate) {
        console.log('[RelMemory] Duplicate memory detected, skipping:', category);
        return prev;
      }
      
      console.log('[RelMemory] 💾 Storing new relationship memory:', category, '-', detail.substring(0, 50));
      return {
        ...prev,
        relationshipMemories: [newMemory, ...existingMemories].slice(0, 100),
      };
    });
  }, []);

  const extractAndStoreMemoriesFromMessage = useCallback((messageContent: string) => {
    if (!messageContent || messageContent.length < 20) return;
    
    console.log('[AutoMemory] 🔍 Scanning message for important information...');
    const patterns = getMemoryExtractionPatterns();
    let memoriesFound = 0;
    
    for (const patternGroup of patterns) {
      for (const pattern of patternGroup.patterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        
        while ((match = regex.exec(messageContent)) !== null) {
          const fullMatch = match[0];
          if (fullMatch && fullMatch.length >= 15 && fullMatch.length <= 200) {
            addRelationshipMemory(patternGroup.category, fullMatch, patternGroup.importance);
            memoriesFound++;
            
            if (memoriesFound >= 3) {
              console.log('[AutoMemory] ✅ Extracted', memoriesFound, 'memories from message');
              return;
            }
          }
        }
      }
    }
    
    if (memoriesFound > 0) {
      console.log('[AutoMemory] ✅ Extracted', memoriesFound, 'memories from message');
    }
  }, [addRelationshipMemory]);

  const addFile = useCallback((file: Omit<AppFile, 'id' | 'createdAt'>) => {
    const newFile: AppFile = {
      ...file,
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      files: [newFile, ...prev.files],
    }));
    console.log('[Files] 📁 Added file:', newFile.name);
    return newFile;
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));
    console.log('[Files] 🗑️ Deleted file:', fileId);
  }, []);

  const updateFile = useCallback((fileId: string, updates: Partial<AppFile>) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.map((f) => (f.id === fileId ? { ...f, ...updates } : f)),
    }));
  }, []);

  const addGeneratedImage = useCallback((image: Omit<GeneratedImage, 'id' | 'createdAt'>) => {
    const newImage: GeneratedImage = {
      ...image,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      generatedImages: [newImage, ...prev.generatedImages],
    }));
    console.log('[Images] 🎨 Generated image added');
    return newImage;
  }, []);

  const deleteGeneratedImage = useCallback((imageId: string) => {
    setState((prev) => ({
      ...prev,
      generatedImages: prev.generatedImages.filter((img) => img.id !== imageId),
    }));
  }, []);

  const extractMemoriesFromConversation = useCallback((messages: ChatMessage[]): MemoryItem[] => {
    console.log('[MEMORY EXTRACT] Analyzing conversation for important memories...');
    const extractedMemories: MemoryItem[] = [];
    
    const recentMessages = messages.slice(-20);
    const conversationText = recentMessages.map(m => `${m.role}: ${m.full_output || m.content}`).join('\n');
    
    const goalPatterns = /\b(want to|need to|planning to|goal is|trying to|working on|hoping to)\s+([^.!?]{10,100})/gi;
    const preferencePatterns = /\b(I (like|love|prefer|enjoy|hate|dislike))\s+([^.!?]{5,80})/gi;
    const identityPatterns = /\b(I am|I'm|I consider myself|I identify as)\s+([^.!?]{5,80})/gi;
    const relationshipPatterns = /\b(my (partner|spouse|friend|family|boss|colleague))\s+([^.!?]{10,100})/gi;
    const strugglePatterns = /\b(struggling with|having trouble|difficult|hard time with|challenge is)\s+([^.!?]{10,100})/gi;
    
    let match;
    
    while ((match = goalPatterns.exec(conversationText)) !== null) {
      if (match[2] && match[2].length > 10) {
        extractedMemories.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'goal',
          content: match[2].trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importanceScore: 3,
          sourceTags: ['auto-extracted', 'conversation'],
        });
      }
    }
    
    while ((match = preferencePatterns.exec(conversationText)) !== null) {
      if (match[0] && match[0].length > 10) {
        extractedMemories.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'preference',
          content: match[0].trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importanceScore: 2,
          sourceTags: ['auto-extracted', 'preference'],
        });
      }
    }
    
    while ((match = identityPatterns.exec(conversationText)) !== null) {
      if (match[0] && match[0].length > 10) {
        extractedMemories.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'identity',
          content: match[0].trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importanceScore: 3,
          sourceTags: ['auto-extracted', 'identity'],
        });
      }
    }
    
    while ((match = relationshipPatterns.exec(conversationText)) !== null) {
      if (match[0] && match[0].length > 15) {
        extractedMemories.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'relationship',
          content: match[0].trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importanceScore: 2,
          sourceTags: ['auto-extracted', 'relationship'],
        });
      }
    }
    
    while ((match = strugglePatterns.exec(conversationText)) !== null) {
      if (match[0] && match[0].length > 15) {
        extractedMemories.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'struggle',
          content: match[0].trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importanceScore: 3,
          sourceTags: ['auto-extracted', 'challenge'],
        });
      }
    }
    
    console.log('[MEMORY EXTRACT] Extracted', extractedMemories.length, 'memories from conversation');
    return extractedMemories.slice(0, 10);
  }, []);

  const createSessionSummary = useCallback((messages: ChatMessage[]): SessionSummary | null => {
    if (messages.length < 4) return null;
    
    console.log('[SESSION SUMMARY] Creating summary for', messages.length, 'messages');
    
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    const topics: string[] = [];
    
    userMessages.forEach(msg => {
      const content = (msg.full_output || msg.content).toLowerCase();
      if (content.includes('quest') || content.includes('goal')) topics.push('Quests/Goals');
      if (content.includes('skill') || content.includes('learn')) topics.push('Skills/Learning');
      if (content.includes('feel') || content.includes('emotion') || content.includes('anxious') || content.includes('stress')) topics.push('Emotional');
      if (content.includes('progress') || content.includes('achievement')) topics.push('Progress Review');
      if (content.includes('help') || content.includes('advice')) topics.push('Guidance');
    });
    
    const uniqueTopics = Array.from(new Set(topics));
    const summary = `Conversation about ${uniqueTopics.slice(0, 3).join(', ') || 'general topics'} (${messages.length} messages exchanged)`;
    const keyEvents = `User engaged with ${userMessages.length} questions/inputs. Navi provided ${assistantMessages.length} responses.`;
    
    return {
      id: `summary-${Date.now()}`,
      sessionId: `session-${Date.now()}`,
      summary,
      keyEvents,
      timestamp: new Date().toISOString(),
    };
  }, []);

  const getSystemStateBlock = useCallback((): string => {
    return buildSystemStateBlock(state, ltmBlocks);
  }, [state, ltmBlocks]);

  const getMemoryContext = useCallback((): string => {
    return buildCompactMemoryContext(ltmBlocks);
  }, [ltmBlocks]);

  const omnisync = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
    snapshot: {
      userIdentity: string;
      questCount: number;
      skillCount: number;
      memoryCount: number;
      vaultCount: number;
      chatCount: number;
      bondLevel: number;
      ltmBlocks: number;
    };
  }> => {
    try {
      console.log('[OMNISYNC] Starting total state synchronization...');
      
      const chatHistory = safeArray<ChatThread>(state.chatHistory, []);
      const allMessages = chatHistory.flatMap(thread => thread.messages);
      
      const extractedMemories = extractMemoriesFromConversation(allMessages);
      const sessionSummary = createSessionSummary(allMessages);
      
      let updatedState = { ...state };
      
      if (extractedMemories.length > 0) {
        console.log('[OMNISYNC] Adding', extractedMemories.length, 'auto-extracted memories');
        const existingMemories = safeArray<MemoryItem>(state.memoryItems, []);
        const newMemories = extractedMemories.filter(newMem => 
          !existingMemories.some(existing => 
            existing.content.toLowerCase().includes(newMem.content.toLowerCase().substring(0, 30))
          )
        );
        updatedState = {
          ...updatedState,
          memoryItems: [...existingMemories, ...newMemories],
        };
      }
      
      let updatedSummaries = safeArray<SessionSummary>(state.sessionSummaries, []);
      if (sessionSummary && allMessages.length >= 10) {
        console.log('[OMNISYNC] Creating session summary');
        updatedSummaries = [...updatedSummaries, sessionSummary];
        updatedState = {
          ...updatedState,
          sessionSummaries: updatedSummaries,
        };
      }
      
      console.log('[OMNISYNC] Compressing memories to long-term storage...');
      const compressedBlocks = compressMemories(
        safeArray<MemoryItem>(updatedState.memoryItems, []),
        safeArray<RelationshipMemory>(updatedState.relationshipMemories, []),
        updatedSummaries,
        ltmBlocks
      );
      
      const ltmStore: LongTermMemoryStore = {
        version: 2,
        lastCompressed: new Date().toISOString(),
        blocks: compressedBlocks,
        rawMemoryCount: (updatedState.memoryItems?.length || 0) + (updatedState.relationshipMemories?.length || 0),
        compressionRuns: (ltmBlocks.length > 0 ? 1 : 0) + 1,
      };
      
      await saveLongTermMemory(ltmStore);
      setLtmBlocks(compressedBlocks);
      console.log('[OMNISYNC] Long-term memory compressed:', compressedBlocks.length, 'blocks with', compressedBlocks.reduce((s, b) => s + b.details.length, 0), 'total details');
      
      setState(updatedState);
      
      const snapshot = {
        userIdentity: state.user.name,
        questCount: state.quests.length,
        skillCount: state.skills.length,
        memoryCount: updatedState.memoryItems.length,
        vaultCount: state.vault.length,
        chatCount: allMessages.length,
        bondLevel: state.settings.navi.profile.bondLevel,
        ltmBlocks: compressedBlocks.length,
      };
      
      console.log('[OMNISYNC] Creating state snapshot:', snapshot);
      
      await SQLiteStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      console.log('[OMNISYNC] State saved to SQLite');
      
      const rollbackKey = `${STORAGE_KEY}_backup_${Date.now()}`;
      await SQLiteStorage.setItem(rollbackKey, JSON.stringify(updatedState));
      console.log('[OMNISYNC] Rollback snapshot created:', rollbackKey);
      
      const allKeys = await SQLiteStorage.getAllKeys();
      const backupKeys = allKeys.filter(key => key.startsWith(`${STORAGE_KEY}_backup_`));
      if (backupKeys.length > 3) {
        const sortedKeys = backupKeys.sort();
        const toDelete = sortedKeys.slice(0, sortedKeys.length - 3);
        await SQLiteStorage.multiRemove(toDelete);
        console.log('[OMNISYNC] Cleaned up old backups:', toDelete.length);
      }
      
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        message: `Omnisync Complete. ${compressedBlocks.length} memory blocks compressed. All systems synchronized.`,
        timestamp,
        snapshot,
      };
    } catch (error) {
      console.error('[OMNISYNC] Failed:', error);
      return {
        success: false,
        message: `Omnisync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        snapshot: {
          userIdentity: state.user.name,
          questCount: 0,
          skillCount: 0,
          memoryCount: 0,
          vaultCount: 0,
          chatCount: 0,
          bondLevel: 0,
          ltmBlocks: 0,
        },
      };
    }
  }, [state, extractMemoriesFromConversation, createSessionSummary, ltmBlocks]);

  return useMemo(() => ({
    state,
    isLoaded,
    ltmBlocks,
    getSystemStateBlock,
    getMemoryContext,
    addJournalEntry,
    addSkill,
    updateSkill,
    deleteSkill,
    addSkillXP,
    addSubSkill,
    updateSubSkill,
    deleteSubSkill,
    addSubSkillXP,
    calculateLevel,
    calculateXPForNextLevel,
    setCharacterClass,
    updateCharacterClassXP,
    addQuest,
    updateQuest,
    acceptQuest,
    declineQuest,
    completeQuest,
    deleteQuest,
    toggleQuestMilestone,
    unlockEvolution,
    saveChatMessage,
    getChatHistory,
    clearChatHistory,
    addCouncilMember,
    updateCouncilMember,
    deleteCouncilMember,
    addVaultEntry,
    updateVaultEntry,
    deleteVaultEntry,
    addDailyCheckIn,
    getTodayCheckIn,
    updateNaviProfile,
    updateNaviPersonality,
    updateNaviSkin,
    updateNaviMode,
    updateNaviAvatar,
    updateNaviName,
    resetCharacterClass,
    incrementNaviInteraction,
    addNaviXP,
    addMemoryItem,
    updateMemoryItem,
    deleteMemoryItem,
    getRelevantMemories,
    updateBondMetrics,
    incrementBondOnMessage,
    incrementBondOnPositiveEngagement,
    incrementBondOnEmotionalDisclosure,
    addRelationshipMemory,
    extractAndStoreMemoriesFromMessage,
    omnisync,
    addFile,
    deleteFile,
    updateFile,
    addGeneratedImage,
    deleteGeneratedImage,
  }), [state, isLoaded, ltmBlocks, getSystemStateBlock, getMemoryContext, addJournalEntry, addSkill, updateSkill, deleteSkill, addSkillXP, addSubSkill, updateSubSkill, deleteSubSkill, addSubSkillXP, calculateLevel, calculateXPForNextLevel, setCharacterClass, updateCharacterClassXP, addQuest, updateQuest, acceptQuest, declineQuest, completeQuest, deleteQuest, toggleQuestMilestone, unlockEvolution, saveChatMessage, getChatHistory, clearChatHistory, addCouncilMember, updateCouncilMember, deleteCouncilMember, addVaultEntry, updateVaultEntry, deleteVaultEntry, addDailyCheckIn, getTodayCheckIn, updateNaviProfile, updateNaviPersonality, updateNaviSkin, updateNaviMode, updateNaviAvatar, updateNaviName, resetCharacterClass, incrementNaviInteraction, addNaviXP, addMemoryItem, updateMemoryItem, deleteMemoryItem, getRelevantMemories, updateBondMetrics, incrementBondOnMessage, incrementBondOnPositiveEngagement, incrementBondOnEmotionalDisclosure, addRelationshipMemory, extractAndStoreMemoriesFromMessage, omnisync, addFile, deleteFile, updateFile, addGeneratedImage, deleteGeneratedImage]);
});
