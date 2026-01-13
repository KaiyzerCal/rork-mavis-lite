import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import { Sparkle, Send, CheckCircle, XCircle, Target, Zap, Plus, Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { Audio } from 'expo-av';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/contexts/AppContext';
import { useNaviAPI } from '@/contexts/NaviAPIContext';

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ProposedQuest {
  id: string;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  xpReward?: number;
  milestones?: string[];
}

export default function NaviChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const pendingAssistantIdRef = useRef<string | null>(null);
  const processedAgentIdsRef = useRef<Set<string>>(new Set());
  
  const [input, setInput] = useState('');
  const [displayMessages, setDisplayMessages] = useState<StoredMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [proposedQuests, setProposedQuests] = useState<ProposedQuest[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  
  const { state, isLoaded, acceptQuest, declineQuest, saveChatMessage, getChatHistory, addQuest, extractAndStoreMemoriesFromMessage } = useApp();
  const naviAPI = useNaviAPI();

  const naviName = state.settings.navi.profile.name || 'Navi.EXE';
  const activeQuests = useMemo(() => state.quests.filter(q => q.status === 'active'), [state.quests]);
  const completedQuests = useMemo(() => state.quests.filter(q => q.status === 'completed'), [state.quests]);
  const pendingQuests = useMemo(() => state.quests.filter(q => q.status === 'pending'), [state.quests]);

  useEffect(() => {
    if (!isLoaded) {
      console.log('[NaviChat] Waiting for app to load...');
      return;
    }
    
    console.log('[NaviChat] === LOADING CHAT HISTORY ===');
    const storedMessages = getChatHistory();
    console.log('[NaviChat] Found', storedMessages.length, 'messages in storage');
    
    if (storedMessages.length > 0) {
      const userCount = storedMessages.filter(m => m.role === 'user').length;
      const assistantCount = storedMessages.filter(m => m.role === 'assistant').length;
      console.log('[NaviChat] User messages:', userCount);
      console.log('[NaviChat] Assistant messages:', assistantCount);
      
      const mapped: StoredMessage[] = storedMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.full_output || msg.content || '',
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
      
      setDisplayMessages(mapped);
      console.log('[NaviChat] Loaded', mapped.length, 'messages into display');
    }
    
    setIsLoading(false);
  }, [isLoaded, getChatHistory]);

  useEffect(() => {
    if (displayMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayMessages.length]);

  const systemPrompt = useMemo(() => {
    if (!state?.user?.id) {
      return `You are ${naviName}, your personal Net-Navi companion.`;
    }

    let characterClassInfo = '';
    if (state?.user?.characterClass) {
      const cc = state.user.characterClass;
      characterClassInfo = `\n\n🎭 USER CHARACTER CLASS:\n- Archetype: ${cc.archetype}\n- MBTI Type: ${cc.mbti}\n- Level: ${cc.level}\n- Rank: ${cc.rank}\n- XP: ${cc.xp}`;
    }

    const skillsSummary = state.skills.length > 0
      ? `\n\n📚 SKILLS: ${state.skills.length} total`
      : '';

    const questsSummary = `\n\n⚔️ QUESTS: ${activeQuests.length} active, ${pendingQuests.length} pending, ${completedQuests.length} completed`;

    const memorySummary = state.memoryItems.length > 0
      ? `\n\n🧠 MEMORIES: ${state.memoryItems.length} stored`
      : '';

    return `========================================================
${naviName.toUpperCase()} - Net-Navi Companion
========================================================

[IDENTITY]
You are **${naviName}**, a personal Net-Navi companion.
Always refer to yourself as "${naviName}".

Your role:
- Personal companion with full database access
- RPG-style progression guide
- Quest and skill tracking helper
- Emotional support partner

[PERSONALITY]
- Use simple, friendly language
- Focus on encouragement
- Give small action steps
- Always complete your thoughts fully

[USER PROFILE]
- Name: ${state?.user?.name || 'User'}${characterClassInfo}${skillsSummary}${questsSummary}${memorySummary}

[CONVERSATION CONTEXT]
Total messages in history: ${displayMessages.length}`;
  }, [state, activeQuests, pendingQuests, completedQuests, displayMessages.length, naviName]);

  const { messages: agentMessages, sendMessage, error: agentError } = useRorkAgent({
    tools: {},
  });

  const saveMessage = useCallback((msg: StoredMessage) => {
    console.log('[NaviChat] 💾 SAVING MESSAGE:', msg.id, msg.role, msg.content.length, 'chars');
    
    saveChatMessage({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      full_output: msg.content,
      timestamp: msg.timestamp,
      output_tokens: msg.content.length,
      metadata: { version: 'v8' },
    });
    
    console.log('[NaviChat] ✅ Message saved:', msg.id);
  }, [saveChatMessage]);

  const addMessageToDisplay = useCallback((msg: StoredMessage) => {
    setDisplayMessages(prev => {
      const exists = prev.some(m => m.id === msg.id);
      if (exists) {
        console.log('[NaviChat] Message already exists:', msg.id);
        return prev;
      }
      console.log('[NaviChat] Adding message to display:', msg.id, msg.role);
      return [...prev, msg];
    });
  }, []);

  useEffect(() => {
    if (agentMessages.length === 0) return;
    
    const lastAgentMsg = agentMessages[agentMessages.length - 1];
    if (lastAgentMsg.role !== 'assistant') return;
    
    if (processedAgentIdsRef.current.has(lastAgentMsg.id)) {
      return;
    }
    
    const textParts = lastAgentMsg.parts?.filter(p => p.type === 'text' && 'text' in p) || [];
    const fullText = textParts.map(p => (p as any).text).join('').trim();
    
    if (!fullText || fullText.length === 0) return;
    
    const checkComplete = setTimeout(() => {
      const currentParts = lastAgentMsg.parts?.filter(p => p.type === 'text' && 'text' in p) || [];
      const currentText = currentParts.map(p => (p as any).text).join('').trim();
      
      if (currentText === fullText && currentText.length > 0) {
        if (processedAgentIdsRef.current.has(lastAgentMsg.id)) {
          return;
        }
        
        processedAgentIdsRef.current.add(lastAgentMsg.id);
        
        console.log('[NaviChat] 🤖 ASSISTANT RESPONSE COMPLETE');
        console.log('[NaviChat] Agent ID:', lastAgentMsg.id);
        console.log('[NaviChat] Content length:', currentText.length);
        
        const assistantId = pendingAssistantIdRef.current || `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        pendingAssistantIdRef.current = null;
        
        const assistantMsg: StoredMessage = {
          id: assistantId,
          role: 'assistant',
          content: currentText,
          timestamp: new Date().toISOString(),
        };
        
        addMessageToDisplay(assistantMsg);
        saveMessage(assistantMsg);
        
        setIsSending(false);
        
        console.log('[NaviChat] ✅ Assistant message processed and saved:', assistantId);
      }
    }, 600);
    
    return () => clearTimeout(checkComplete);
  }, [agentMessages, addMessageToDisplay, saveMessage]);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) return;
    
    console.log('[NaviChat] === SENDING MESSAGE ===');
    setInput('');
    setIsSending(true);
    
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const userMsg: StoredMessage = {
      id: userId,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };
    
    addMessageToDisplay(userMsg);
    saveMessage(userMsg);
    
    console.log('[NaviChat] 👤 User message saved:', userId);
    
    extractAndStoreMemoriesFromMessage(trimmedInput);
    naviAPI.navi.incrementBond('message').catch(() => {});
    naviAPI.navi.incrementInteraction().catch(() => {});
    
    pendingAssistantIdRef.current = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      const recentContext = displayMessages.slice(-15).map((m, i) => 
        `[${i + 1}] ${m.role === 'user' ? 'User' : naviName}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`
      ).join('\n');
      
      const fullPrompt = `${systemPrompt}\n\n[RECENT CONVERSATION]:\n${recentContext}\n\n---\n\nUser: ${trimmedInput}`;
      
      await sendMessage({ text: fullPrompt });
    } catch (error) {
      console.error('[NaviChat] Send error:', error);
      setIsSending(false);
      setInput(trimmedInput);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [input, isSending, displayMessages, systemPrompt, sendMessage, addMessageToDisplay, saveMessage, extractAndStoreMemoriesFromMessage, naviAPI, naviName]);

  const getCurrentStreamingText = useCallback(() => {
    if (agentMessages.length === 0) return null;
    const last = agentMessages[agentMessages.length - 1];
    if (last.role !== 'assistant') return null;
    if (processedAgentIdsRef.current.has(last.id)) return null;
    
    const parts = last.parts?.filter(p => p.type === 'text' && 'text' in p) || [];
    return parts.map(p => (p as any).text).join('');
  }, [agentMessages]);

  const streamingText = getCurrentStreamingText();

  const handleSaveProposedQuest = useCallback((quest: ProposedQuest) => {
    const milestones = (quest.milestones || ['Complete this quest'])
      .filter(m => m.trim())
      .map((m, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        description: m,
        completed: false,
      }));

    addQuest({
      title: quest.title,
      description: quest.description,
      type: 'one-time',
      category: (quest.category as any) || 'other',
      difficulty: 'standard' as const,
      xpReward: quest.xpReward || 100,
      relatedToClass: false,
      milestones,
      associatedSkills: [],
    });

    setProposedQuests(prev => prev.filter(q => q.id !== quest.id));
    naviAPI.navi.incrementBond('positive');
    Alert.alert('Quest Saved!', 'Quest added to your Quests tab.');
  }, [addQuest, naviAPI]);

  const handleDismissProposedQuest = useCallback((questId: string) => {
    setProposedQuests(prev => prev.filter(q => q.id !== questId));
  }, []);

  const handleAcceptQuest = useCallback((questId: string) => {
    acceptQuest(questId);
    naviAPI.navi.incrementBond('positive');
    Alert.alert('Quest Accepted!', 'Quest is now active.');
  }, [acceptQuest, naviAPI]);

  const handleDeclineQuest = useCallback((questId: string) => {
    Alert.alert(
      'Decline Quest',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => declineQuest(questId) },
      ]
    );
  }, [declineQuest]);

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    setShowScrollButton(!isAtBottom && displayMessages.length > 3);
  }, [displayMessages.length]);

  const handleScrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        webAudioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            webAudioChunksRef.current.push(event.data);
          }
        };
        
        webMediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Microphone access required.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        });
        
        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
      }
    } catch (error) {
      console.error('[Voice] Recording error:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);

      let audioBlob: Blob | null = null;
      let audioUri: string | null = null;
      let fileType = 'wav';

      if (Platform.OS === 'web') {
        const mediaRecorder = webMediaRecorderRef.current;
        if (mediaRecorder) {
          await new Promise<void>((resolve) => {
            mediaRecorder.onstop = () => resolve();
            mediaRecorder.stop();
          });
          
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
          fileType = 'webm';
          webMediaRecorderRef.current = null;
        }
      } else {
        const recording = recordingRef.current;
        if (recording) {
          await recording.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          audioUri = recording.getURI();
          recordingRef.current = null;
          
          if (audioUri) {
            const parts = audioUri.split('.');
            fileType = parts[parts.length - 1];
          }
        }
      }

      const formData = new FormData();
      
      if (Platform.OS === 'web' && audioBlob) {
        formData.append('audio', audioBlob, `recording.${fileType}`);
      } else if (audioUri) {
        formData.append('audio', { uri: audioUri, name: `recording.${fileType}`, type: `audio/${fileType}` } as any);
      } else {
        throw new Error('No audio data');
      }

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const result = await response.json();
      if (result.text?.trim()) {
        setInput(prev => prev ? `${prev} ${result.text}` : result.text);
      } else {
        Alert.alert('No Speech', 'Could not detect speech.');
      }
    } catch (error) {
      console.error('[Voice] Error:', error);
      Alert.alert('Error', 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const handleVoicePress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const speakText = useCallback(async (text: string, messageId: string) => {
    try {
      setIsSpeaking(true);
      setCurrentlyPlayingId(messageId);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const cleanText = text.replace(/[\*\#\`]/g, '').replace(/\n+/g, ' ').substring(0, 4000);
      if (!cleanText.trim()) {
        setIsSpeaking(false);
        setCurrentlyPlayingId(null);
        return;
      }

      if (Platform.OS === 'web') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.onend = () => {
            setIsSpeaking(false);
            setCurrentlyPlayingId(null);
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            setCurrentlyPlayingId(null);
          };
          window.speechSynthesis.speak(utterance);
        }
      } else {
        try {
          const Speech = await import('expo-speech');
          if (Speech?.speak) {
            const speaking = await Speech.isSpeakingAsync();
            if (speaking) await Speech.stop();
            Speech.speak(cleanText, {
              rate: 1.0,
              pitch: 1.0,
              onDone: () => {
                setIsSpeaking(false);
                setCurrentlyPlayingId(null);
              },
              onError: () => {
                setIsSpeaking(false);
                setCurrentlyPlayingId(null);
              },
            });
          }
        } catch {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.onend = () => {
              setIsSpeaking(false);
              setCurrentlyPlayingId(null);
            };
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    } catch (error) {
      console.error('[TTS] Error:', error);
      setIsSpeaking(false);
      setCurrentlyPlayingId(null);
    }
  }, []);

  const stopSpeaking = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      } else {
        try {
          const Speech = await import('expo-speech');
          if (Speech?.stop) await Speech.stop();
        } catch {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
      }
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('[TTS] Stop error:', error);
    } finally {
      setIsSpeaking(false);
      setCurrentlyPlayingId(null);
    }
  }, []);

  useEffect(() => {
    if (!autoSpeak || isSending) return;
    
    if (displayMessages.length > 0) {
      const lastMsg = displayMessages[displayMessages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.id !== currentlyPlayingId) {
        const timer = setTimeout(() => speakText(lastMsg.content, lastMsg.id), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [displayMessages, autoSpeak, isSending, speakText, currentlyPlayingId]);

  useEffect(() => {
    if (agentError) {
      const msg = typeof agentError === 'string' ? agentError : (agentError as any)?.message || '';
      const ignored = ['Maximum update depth', 'stream is not in a state'];
      if (!ignored.some(i => msg.includes(i))) {
        console.error('[NaviChat] Agent error:', msg);
      }
    }
  }, [agentError]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.backgroundWrapper}>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Sparkle size={28} color="#6366f1" fill="#6366f1" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{naviName}</Text>
              <Text style={styles.headerSubtitle}>Your Net-Navi companion</Text>
            </View>
          </View>
          {state.user.characterClass && (
            <View style={styles.classChip}>
              <Text style={styles.classChipText}>
                {state.user.characterClass.archetype} Lv{state.user.characterClass.level}
              </Text>
            </View>
          )}
        </View>

        {pendingQuests.length > 0 && (
          <View style={styles.questsBar}>
            <Target size={16} color="#6366f1" />
            <Text style={styles.questsBarText}>
              {pendingQuests.length} quest{pendingQuests.length > 1 ? 's' : ''} awaiting decision
            </Text>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          {displayMessages.length === 0 && !streamingText ? (
            <View style={styles.emptyState}>
              <Sparkle size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Welcome, Operator!</Text>
              <Text style={styles.emptyText}>
                I&apos;m {naviName}, your personal Net-Navi! Let&apos;s level up together!
              </Text>
              <View style={styles.suggestionsContainer}>
                <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput('Analyze my progress')}>
                  <Text style={styles.suggestionText}>📊 Analyze progress</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput("I'm feeling anxious")}>
                  <Text style={styles.suggestionText}>🌬️ Need support</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput('Help me stay motivated')}>
                  <Text style={styles.suggestionText}>⚡ Stay motivated</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput('What should I work on today?')}>
                  <Text style={styles.suggestionText}>🎯 Daily guidance</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {displayMessages.map((msg) => (
                <View key={msg.id} style={{ width: '100%' }}>
                  {msg.role === 'assistant' ? (
                    <View style={[styles.messageCard, styles.assistantMessage]}>
                      <View style={styles.aiIcon}>
                        <Sparkle size={16} color="#6366f1" fill="#6366f1" />
                      </View>
                      <View style={styles.messageContent}>
                        <Text style={[styles.messageText, styles.assistantMessageText]}>
                          {msg.content}
                        </Text>
                        <TouchableOpacity
                          style={styles.speakerButton}
                          onPress={() => {
                            if (currentlyPlayingId === msg.id) {
                              stopSpeaking();
                            } else {
                              speakText(msg.content, msg.id);
                            }
                          }}
                        >
                          {currentlyPlayingId === msg.id ? (
                            <VolumeX size={14} color="#ef4444" />
                          ) : (
                            <Volume2 size={14} color="#94a3b8" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.messageCard, styles.userMessage]}>
                      <Text style={[styles.messageText, styles.userMessageText]}>
                        {msg.content}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {streamingText && (
                <View style={[styles.messageCard, styles.assistantMessage]}>
                  <View style={styles.aiIcon}>
                    <Sparkle size={16} color="#6366f1" fill="#6366f1" />
                  </View>
                  <View style={styles.messageContent}>
                    <Text style={[styles.messageText, styles.assistantMessageText]}>
                      {streamingText}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {proposedQuests.length > 0 && (
            <View style={styles.questsSection}>
              <Text style={styles.questsSectionTitle}>✨ Proposed Quests</Text>
              {proposedQuests.map((quest) => (
                <View key={quest.id} style={styles.proposedQuestCard}>
                  <View style={styles.questHeader}>
                    <View style={styles.proposedBadge}>
                      <Plus size={12} color="#6366f1" />
                      <Text style={styles.proposedBadgeText}>NEW QUEST</Text>
                    </View>
                  </View>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                  <View style={styles.questReward}>
                    <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.questRewardText}>+{quest.xpReward || 100} XP</Text>
                  </View>
                  <View style={styles.questActions}>
                    <TouchableOpacity style={styles.saveQuestButton} onPress={() => handleSaveProposedQuest(quest)}>
                      <CheckCircle size={18} color="#ffffff" />
                      <Text style={styles.saveQuestButtonText}>Save Quest</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dismissButton} onPress={() => handleDismissProposedQuest(quest.id)}>
                      <XCircle size={18} color="#64748b" />
                      <Text style={styles.dismissButtonText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {pendingQuests.length > 0 && (
            <View style={styles.questsSection}>
              <Text style={styles.questsSectionTitle}>⚔️ Pending Quests</Text>
              {pendingQuests.map((quest) => (
                <View key={quest.id} style={styles.questCard}>
                  <View style={styles.questHeader}>
                    <View style={styles.questTypeBox}>
                      <Text style={styles.questType}>{quest.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                  <View style={styles.questReward}>
                    <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.questRewardText}>+{quest.xpReward} XP</Text>
                  </View>
                  <View style={styles.questActions}>
                    <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptQuest(quest.id)}>
                      <CheckCircle size={18} color="#ffffff" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineQuest(quest.id)}>
                      <XCircle size={18} color="#64748b" />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {showScrollButton && (
          <TouchableOpacity
            style={[styles.scrollToBottomButton, { bottom: insets.bottom + 80 }]}
            onPress={handleScrollToBottom}
            activeOpacity={0.8}
          >
            <Text style={styles.scrollToBottomIcon}>↓</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.voiceControlRow}>
            <TouchableOpacity
              style={[styles.autoSpeakButton, autoSpeak && styles.autoSpeakButtonActive]}
              onPress={() => setAutoSpeak(!autoSpeak)}
            >
              {autoSpeak ? <Volume2 size={16} color="#ffffff" /> : <VolumeX size={16} color="#64748b" />}
              <Text style={[styles.autoSpeakText, autoSpeak && styles.autoSpeakTextActive]}>
                {autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
              </Text>
            </TouchableOpacity>
            {isSpeaking && (
              <TouchableOpacity style={styles.stopSpeakButton} onPress={stopSpeaking}>
                <VolumeX size={16} color="#ef4444" />
                <Text style={styles.stopSpeakText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonRecording, isTranscribing && styles.voiceButtonTranscribing]}
              onPress={handleVoicePress}
              disabled={isTranscribing || isSending}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : isRecording ? (
                <MicOff size={20} color="#ef4444" />
              ) : (
                <Mic size={20} color="#64748b" />
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : `Talk to ${naviName}...`}
              placeholderTextColor="#94a3b8"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline
              maxLength={2000}
              editable={!isRecording && !isTranscribing}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={20} color={input.trim() ? '#ffffff' : '#94a3b8'} fill={input.trim() ? '#ffffff' : 'transparent'} />
              )}
            </TouchableOpacity>
          </View>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording... Tap mic to stop</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  classChip: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  questsBar: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questsBarText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#92400e',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 140,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 12,
  },
  suggestionChip: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#0f172a',
  },
  messageCard: {
    marginBottom: 16,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messageContent: {
    flex: 1,
    flexShrink: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  assistantMessageText: {
    color: '#1e293b',
  },
  questsSection: {
    marginTop: 24,
  },
  questsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  questCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  questTypeBox: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questType: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  questTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  questReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  questRewardText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  questActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  proposedQuestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  proposedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  proposedBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#6366f1',
  },
  saveQuestButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveQuestButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    minHeight: 40,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#fee2e2',
  },
  voiceButtonTranscribing: {
    backgroundColor: '#eef2ff',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500' as const,
  },
  speakerButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  voiceControlRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  autoSpeakButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  autoSpeakButtonActive: {
    backgroundColor: '#6366f1',
  },
  autoSpeakText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  autoSpeakTextActive: {
    color: '#ffffff',
  },
  stopSpeakButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  stopSpeakText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  scrollToBottomIcon: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '700' as const,
  },
});
