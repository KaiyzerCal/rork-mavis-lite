import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useApp } from '@/contexts/AppContext';
import type { AppState, ChatThread } from '@/types';


const DEFAULT_USER_ID = 'mavis-user-default';
const SYNC_DEBOUNCE_MS = 3000;
const AUTO_SYNC_INTERVAL_MS = 120000;
const MAX_RETRY_COUNT = 2;
const RETRY_BACKOFF_MS = 60000;

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

function computeStateHash(state: AppState): string {
  return JSON.stringify({
    questCount: state.quests.length,
    skillCount: state.skills.length,
    vaultCount: state.vault.length,
    memoryCount: state.memoryItems.length,
    chatCount: state.chatHistory.reduce((acc, t) => acc + t.messages.length, 0),
    naviInteraction: state.settings.navi.profile.interactionCount,
    naviBond: state.settings.navi.profile.bondLevel,
    naviXP: state.settings.navi.profile.xp,
    naviLevel: state.settings.navi.profile.level,
    journalCount: state.journal.length,
    dailyCheckInCount: state.dailyCheckIns.length,
    sessionSummaryCount: state.sessionSummaries.length,
    relationshipMemoryCount: state.relationshipMemories.length,
    fileCount: state.files.length,
    imageCount: state.generatedImages.length,
    councilCount: state.customCouncilMembers.length,
    leaderboardXP: state.leaderboard.find(l => l.id === 'me')?.xp || 0,
    userName: state.user.name,
    hasAssessment: state.user.hasCompletedAssessment,
    characterLevel: state.user.characterClass?.level || 0,
    statsHash: state.stats.map(s => `${s.id}:${s.value}`).join(','),
    theme: state.settings.theme,
    evolutionCount: state.archetypeEvolutions.filter(e => e.unlocked).length,
  });
}

export const [BackendSyncProvider, useBackendSync] = createContextHook(() => {
  const { state, isLoaded, ltmBlocks } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [backendChecked, setBackendChecked] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedStateRef = useRef<string>('');
  const retryCountRef = useRef(0);
  const backendCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoggedOfflineRef = useRef(false);

  const fullStateSyncMutation = trpc.fullstate.sync.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        console.log('[BackendSync] Synced successfully at', data.timestamp);
        console.log('[BackendSync] Synced counts:', data.syncedCounts);
        setLastSyncTime(data.timestamp);
        setSyncError(null);
        setPendingSyncCount(0);
        setBackendAvailable(true);
        setBackendChecked(true);
        retryCountRef.current = 0;
        hasLoggedOfflineRef.current = false;
      } else {
        console.log('[BackendSync] Sync returned error:', data.error);
        setSyncError(data.error || 'Unknown sync error');
      }
    },
    onError: (error) => {
      if (isNetworkError(error)) {
        if (!hasLoggedOfflineRef.current) {
          console.log('[BackendSync] Backend unavailable - data saved locally');
          hasLoggedOfflineRef.current = true;
        }
        setBackendAvailable(false);
        setBackendChecked(true);
        retryCountRef.current += 1;
        
        if (retryCountRef.current <= MAX_RETRY_COUNT) {
          if (backendCheckTimeoutRef.current) {
            clearTimeout(backendCheckTimeoutRef.current);
          }
          backendCheckTimeoutRef.current = setTimeout(() => {
            hasLoggedOfflineRef.current = false;
            setBackendAvailable(true);
          }, RETRY_BACKOFF_MS);
        }
      } else {
        console.log('[BackendSync] Error:', error.message);
        setSyncError(error.message);
      }
      setIsOnline(false);
    },
  });

  const chatSyncMutation = trpc.chat.sync.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        console.log('[BackendSync] Chat synced:', data.messageCount, 'messages');
        setBackendAvailable(true);
        retryCountRef.current = 0;
        hasLoggedOfflineRef.current = false;
      }
    },
    onError: (error) => {
      if (isNetworkError(error)) {
        setBackendAvailable(false);
      }
    },
  });

  const fullStateQuery = trpc.fullstate.load.useQuery(
    { userId: DEFAULT_USER_ID },
    { enabled: false }
  );

  const stateRef = useRef(state);
  const isLoadedRef = useRef(isLoaded);
  const isSyncingRef = useRef(isSyncing);
  const ltmBlocksRef = useRef(ltmBlocks);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  useEffect(() => {
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);
  
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    ltmBlocksRef.current = ltmBlocks;
  }, [ltmBlocks]);

  const backendAvailableRef = useRef(backendAvailable);
  const backendCheckedRef = useRef(backendChecked);
  
  useEffect(() => {
    backendAvailableRef.current = backendAvailable;
  }, [backendAvailable]);
  
  useEffect(() => {
    backendCheckedRef.current = backendChecked;
  }, [backendChecked]);

  const syncFullState = useCallback(async () => {
    if (!isLoadedRef.current || isSyncingRef.current) {
      return;
    }

    if (backendCheckedRef.current && !backendAvailableRef.current && retryCountRef.current >= MAX_RETRY_COUNT) {
      return;
    }

    const currentState = stateRef.current;
    const stateHash = computeStateHash(currentState);

    if (stateHash === lastSyncedStateRef.current) {
      return;
    }

    setIsSyncing(true);

    try {
      console.log('[BackendSync] Starting full state sync...');
      await fullStateSyncMutation.mutateAsync({
        userId: DEFAULT_USER_ID,
        user: currentState.user,
        skills: currentState.skills,
        quests: currentState.quests,
        vault: currentState.vault,
        memoryItems: currentState.memoryItems,
        chatHistory: currentState.chatHistory,
        naviProfile: currentState.settings.navi.profile,
        dailyCheckIns: currentState.dailyCheckIns,
        sessionSummaries: currentState.sessionSummaries,
        journal: currentState.journal,
        leaderboard: currentState.leaderboard,
        settings: currentState.settings,
        stats: currentState.stats,
        sessions: currentState.sessions,
        tools: currentState.tools,
        network: currentState.network,
        archetypeEvolutions: currentState.archetypeEvolutions,
        customCouncilMembers: currentState.customCouncilMembers,
        relationshipMemories: currentState.relationshipMemories,
        naviState: currentState.naviState,
        files: currentState.files,
        generatedImages: currentState.generatedImages,
        ltmBlocks: ltmBlocksRef.current,
      });

      lastSyncedStateRef.current = stateHash;
      setIsOnline(true);
    } catch {
    } finally {
      setIsSyncing(false);
    }
  }, [fullStateSyncMutation]);

  const syncChat = useCallback(async (thread: ChatThread) => {
    if (!thread || !thread.id) return;

    if (backendCheckedRef.current && !backendAvailableRef.current && retryCountRef.current >= MAX_RETRY_COUNT) {
      return;
    }

    try {
      await chatSyncMutation.mutateAsync({
        userId: DEFAULT_USER_ID,
        threadId: thread.id,
        messages: thread.messages,
      });
    } catch {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    setPendingSyncCount(prev => prev + 1);

    syncTimeoutRef.current = setTimeout(() => {
      syncFullState();
    }, SYNC_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFromBackend = useCallback(async (): Promise<Partial<AppState> | null> => {
    if (backendCheckedRef.current && !backendAvailableRef.current && retryCountRef.current >= MAX_RETRY_COUNT) {
      return null;
    }

    try {
      console.log('[BackendSync] Loading full state from backend...');
      const result = await fullStateQuery.refetch();
      
      if (result.data?.exists) {
        console.log('[BackendSync] Loaded state from backend successfully');
        setBackendAvailable(true);
        setBackendChecked(true);
        retryCountRef.current = 0;
        hasLoggedOfflineRef.current = false;

        const data = result.data;

        const loadedState: Partial<AppState> = {
          user: data.user || undefined,
          skills: data.skills || [],
          quests: data.quests || [],
          vault: data.vault || [],
          memoryItems: data.memoryItems || [],
          chatHistory: data.chatHistory || [],
          dailyCheckIns: data.dailyCheckIns || [],
          sessionSummaries: data.sessionSummaries || [],
          journal: data.journal || [],
          leaderboard: data.leaderboard || [],
          stats: data.stats || [],
          sessions: data.sessions || [],
          tools: data.tools || [],
          network: data.network || [],
          archetypeEvolutions: data.archetypeEvolutions || [],
          customCouncilMembers: data.customCouncilMembers || [],
          relationshipMemories: data.relationshipMemories || [],
          naviState: data.naviState || undefined,
          files: data.files || [],
          generatedImages: data.generatedImages || [],
        };

        if (data.settings) {
          loadedState.settings = data.settings;
        } else if (data.naviProfile) {
          loadedState.settings = {
            ...loadedState.settings,
            navi: { profile: data.naviProfile },
          } as AppState['settings'];
        }

        console.log('[BackendSync] Loaded data summary:', {
          quests: loadedState.quests?.length,
          skills: loadedState.skills?.length,
          vault: loadedState.vault?.length,
          memories: loadedState.memoryItems?.length,
          chatThreads: loadedState.chatHistory?.length,
          journal: loadedState.journal?.length,
          files: loadedState.files?.length,
          images: loadedState.generatedImages?.length,
        });

        return loadedState;
      }

      setBackendChecked(true);
      return null;
    } catch (error) {
      if (isNetworkError(error)) {
        if (!hasLoggedOfflineRef.current) {
          console.log('[BackendSync] Backend unavailable - using local storage');
          hasLoggedOfflineRef.current = true;
        }
        setBackendAvailable(false);
      }
      setBackendChecked(true);
      return null;
    }
  }, [fullStateQuery]);

  const forceSync = useCallback(async () => {
    retryCountRef.current = 0;
    hasLoggedOfflineRef.current = false;
    setBackendAvailable(true);
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    lastSyncedStateRef.current = '';
    await syncFullState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      if (backendAvailable && pendingSyncCount > 0) {
        syncFullState();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (backendCheckTimeoutRef.current) {
        clearTimeout(backendCheckTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, pendingSyncCount, backendAvailable]);

  const chatHistoryLength = state.chatHistory.length;
  const firstThreadMessageCount = state.chatHistory[0]?.messages?.length || 0;
  const hasSyncedChatRef = useRef(false);
  
  useEffect(() => {
    if (isLoaded && chatHistoryLength > 0 && firstThreadMessageCount > 0) {
      const currentThread = state.chatHistory[0];
      if (currentThread && !hasSyncedChatRef.current) {
        hasSyncedChatRef.current = true;
        syncChat(currentThread);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, chatHistoryLength, firstThreadMessageCount]);

  const hasInitialSyncRef = useRef(false);
  
  useEffect(() => {
    if (isLoaded && !hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
      debouncedSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const questsLength = state.quests.length;
  const skillsLength = state.skills.length;
  const vaultLength = state.vault.length;
  const memoryItemsLength = state.memoryItems.length;
  const dailyCheckInsLength = state.dailyCheckIns.length;
  const journalLength = state.journal.length;
  const sessionSummariesLength = state.sessionSummaries.length;
  const relationshipMemoriesLength = state.relationshipMemories.length;
  const filesLength = state.files.length;
  const imagesLength = state.generatedImages.length;
  const councilLength = state.customCouncilMembers.length;
  const naviInteractionCount = state.settings.navi.profile.interactionCount;
  const naviBondLevel = state.settings.navi.profile.bondLevel;
  const naviXP = state.settings.navi.profile.xp;
  const characterLevel = state.user.characterClass?.level || 0;
  const userName = state.user.name;
  const hasAssessment = state.user.hasCompletedAssessment;
  const leaderboardXP = state.leaderboard.find(l => l.id === 'me')?.xp || 0;
  const ltmBlocksLength = ltmBlocks.length;
  const ltmDetailCount = ltmBlocks.reduce((s, b) => s + b.details.length, 0);
  
  useEffect(() => {
    if (isLoaded && hasInitialSyncRef.current) {
      debouncedSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    questsLength,
    skillsLength,
    vaultLength,
    memoryItemsLength,
    dailyCheckInsLength,
    journalLength,
    sessionSummariesLength,
    relationshipMemoriesLength,
    filesLength,
    imagesLength,
    councilLength,
    naviInteractionCount,
    naviBondLevel,
    naviXP,
    characterLevel,
    userName,
    hasAssessment,
    leaderboardXP,
    ltmBlocksLength,
    ltmDetailCount,
  ]);

  const resetBackendStatus = useCallback(() => {
    retryCountRef.current = 0;
    hasLoggedOfflineRef.current = false;
    setBackendAvailable(true);
    setSyncError(null);
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    isOnline,
    pendingSyncCount,
    backendAvailable,
    backendChecked,
    syncFullState,
    syncChat,
    forceSync,
    loadFromBackend,
    debouncedSync,
    resetBackendStatus,
  };
});

export function useSyncOnChange<T>(
  data: T,
  syncFn: () => void
) {
  const prevDataRef = useRef<string>('');

  useEffect(() => {
    const dataHash = JSON.stringify(data);
    if (dataHash !== prevDataRef.current) {
      prevDataRef.current = dataHash;
      syncFn();
    }
  }, [data, syncFn]);
}
