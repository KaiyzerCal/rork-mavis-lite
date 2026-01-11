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

export const [BackendSyncProvider, useBackendSync] = createContextHook(() => {
  const { state, isLoaded } = useApp();
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
        console.log('[BackendSync] Synced successfully');
        setLastSyncTime(data.timestamp);
        setSyncError(null);
        setPendingSyncCount(0);
        setBackendAvailable(true);
        setBackendChecked(true);
        retryCountRef.current = 0;
        hasLoggedOfflineRef.current = false;
      } else {
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
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  useEffect(() => {
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);
  
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

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
    const stateHash = JSON.stringify({
      questCount: currentState.quests.length,
      skillCount: currentState.skills.length,
      vaultCount: currentState.vault.length,
      memoryCount: currentState.memoryItems.length,
      chatCount: currentState.chatHistory.reduce((acc, t) => acc + t.messages.length, 0),
      naviInteraction: currentState.settings.navi.profile.interactionCount,
    });

    if (stateHash === lastSyncedStateRef.current) {
      return;
    }

    setIsSyncing(true);

    try {
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
      });

      lastSyncedStateRef.current = stateHash;
      setIsOnline(true);
    } catch {
      // Error handled by mutation onError
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
      // Error handled by mutation onError
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
      const result = await fullStateQuery.refetch();
      
      if (result.data?.exists) {
        console.log('[BackendSync] Loaded state from backend');
        setBackendAvailable(true);
        setBackendChecked(true);
        retryCountRef.current = 0;
        hasLoggedOfflineRef.current = false;
        return {
          user: result.data.user,
          skills: result.data.skills || [],
          quests: result.data.quests || [],
          vault: result.data.vault || [],
          memoryItems: result.data.memoryItems || [],
          chatHistory: result.data.chatHistory || [],
          dailyCheckIns: result.data.dailyCheckIns || [],
          sessionSummaries: result.data.sessionSummaries || [],
          journal: result.data.journal || [],
          leaderboard: result.data.leaderboard || [],
        } as Partial<AppState>;
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

  const questsLength = state.quests.length;
  const skillsLength = state.skills.length;
  const vaultLength = state.vault.length;
  const memoryItemsLength = state.memoryItems.length;
  const dailyCheckInsLength = state.dailyCheckIns.length;
  const naviInteractionCount = state.settings.navi.profile.interactionCount;
  const naviBondLevel = state.settings.navi.profile.bondLevel;
  const hasInitialSyncRef = useRef(false);
  
  useEffect(() => {
    if (isLoaded && !hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
      debouncedSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);
  
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
    naviInteractionCount,
    naviBondLevel,
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
