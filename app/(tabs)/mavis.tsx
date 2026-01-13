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

interface ChatMessageDisplay {
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

export default function NaviEXE() {
  const [input, setInput] = useState<string>('');
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageDisplay[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [proposedQuests, setProposedQuests] = useState<ProposedQuest[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { state, isLoaded, acceptQuest, declineQuest, getChatHistory, saveChatMessage, addQuest } = useApp();
  const naviAPI = useNaviAPI();

  const activeQuests = useMemo(() => state.quests.filter(q => q.status === 'active'), [state.quests]);
  const completedQuests = useMemo(() => state.quests.filter(q => q.status === 'completed'), [state.quests]);
  const pendingQuests = useMemo(() => state.quests.filter(q => q.status === 'pending'), [state.quests]);

  useEffect(() => {
    if (!isLoaded) {
      console.log('[NaviChat] Waiting for app state to load...');
      return;
    }
    
    console.log('[NaviChat] App state loaded, loading chat history...');
    const storedHistory = getChatHistory();
    console.log('[NaviChat] Found', storedHistory.length, 'messages in storage');
    
    if (storedHistory.length > 0) {
      const loadedMessages: ChatMessageDisplay[] = storedHistory.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.full_output || msg.content,
        timestamp: msg.timestamp,
      }));
      
      setChatMessages(loadedMessages);
      console.log('[NaviChat] Loaded', loadedMessages.length, 'messages into chat');
      
      storedHistory.slice(-3).forEach((msg, idx) => {
        console.log(`[NaviChat] Message ${storedHistory.length - 2 + idx}:`, {
          role: msg.role,
          contentLength: (msg.full_output || msg.content).length,
          preview: (msg.full_output || msg.content).substring(0, 80) + '...',
        });
      });
    }
    
    setIsLoadingHistory(false);
  }, [isLoaded, getChatHistory]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages.length]);

  const handleSaveProposedQuest = useCallback((proposedQuest: ProposedQuest) => {
    const milestones = (proposedQuest.milestones || ['Complete this quest'])
      .filter(m => m.trim())
      .map((m, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        description: m,
        completed: false,
      }));

    addQuest({
      title: proposedQuest.title,
      description: proposedQuest.description,
      type: 'one-time',
      category: (proposedQuest.category as any) || 'other',
      difficulty: 'standard' as const,
      xpReward: proposedQuest.xpReward || 100,
      relatedToClass: false,
      milestones,
      associatedSkills: [],
    });

    setProposedQuests(prev => prev.filter(q => q.id !== proposedQuest.id));
    naviAPI.navi.incrementBond('positive');
    Alert.alert('Quest Saved!', 'Quest has been added to your Quests tab.');
  }, [addQuest, naviAPI]);

  const handleDismissProposedQuest = useCallback((questId: string) => {
    setProposedQuests(prev => prev.filter(q => q.id !== questId));
  }, []);

  const systemPrompt = useMemo(() => {
    if (!state?.user?.id) {
      return 'You are Navi.EXE, your personal Net-Navi companion. Please wait while I load your data.';
    }

    let characterClassInfo = '';
    if (state?.user?.characterClass) {
      const cc = state.user.characterClass;
      characterClassInfo = `\n\n🎭 USER CHARACTER CLASS:\n- Archetype: ${cc.archetype}\n- MBTI Type: ${cc.mbti}\n- Level: ${cc.level}\n- Rank: ${cc.rank}\n- XP: ${cc.xp}\n- Traits: ${cc.traits.join(', ')}\n- Strengths: ${cc.strengths.join(', ')}\n- Growth Areas: ${cc.growthAreas.join(', ')}`;
    }

    const skillsSummary = state.skills.length > 0
      ? `\n\n📚 SKILLS OVERVIEW (${state.skills.length} total):\n${state.skills.slice(0, 5).map(s => `- ${s.name} (Lv${s.level}, ${s.xp} XP)${s.tags.length > 0 ? ` [${s.tags[0]}]` : ''}`).join('\n')}${state.skills.length > 5 ? '\n... and more' : ''}`
      : '';

    const questsSummary = state.quests.length > 0
      ? `\n\n⚔️ QUESTS STATUS:\n- Active: ${activeQuests.length}\n- Pending: ${pendingQuests.length}\n- Completed: ${completedQuests.length}\n${activeQuests.length > 0 ? `\n📋 ACTIVE QUESTS (Full Details):\n${activeQuests.slice(0, 5).map(q => {
        const milestoneStatus = q.milestones.map(m => `  ${m.completed ? '✅' : '⬜'} ${m.description}`).join('\n');
        return `• "${q.title}" [${q.category}]\n  Description: ${q.description}\n  Difficulty: ${q.difficulty} | Reward: ${q.xpReward} XP\n  Milestones:\n${milestoneStatus}`;
      }).join('\n\n')}` : ''}\n${completedQuests.length > 0 ? `\n🏆 RECENTLY COMPLETED QUESTS (Last 10):\n${completedQuests.slice(0, 10).map(q => `• "${q.title}" - ${q.description.substring(0, 100)}${q.description.length > 100 ? '...' : ''} (Earned ${q.xpReward} XP${q.completedAt ? `, completed ${new Date(q.completedAt).toLocaleDateString()}` : ''})`).join('\n')}` : ''}`
      : '';

    const vaultSummary = state.vault.length > 0
      ? `\n\n📔 VAULT ENTRIES (${state.vault.length} total):\n${state.vault.slice(0, 15).map(v => {
        const contentPreview = v.content.length > 200 ? v.content.substring(0, 200) + '...' : v.content;
        return `• "${v.title}" [${v.type}] - ${new Date(v.date).toLocaleDateString()}\n  Tags: ${v.tags?.join(', ') || 'none'}\n  Content: ${contentPreview}`;
      }).join('\n\n')}`
      : '';

    const relevantMemories = state.memoryItems
      .sort((a, b) => {
        const scoreSort = b.importanceScore - a.importanceScore;
        if (scoreSort !== 0) return scoreSort;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, 15);
    
    const memorySummary = relevantMemories.length > 0
      ? `\n\n🧠 KEY MEMORIES (${state.memoryItems.length} total, showing top ${relevantMemories.length}):\n${relevantMemories.map(m => `- [${m.type}] ${m.content} (Importance: ${m.importanceScore}/3)`).join('\n')}`
      : '';

    const topRelationshipMemories = state.relationshipMemories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
    
    const relationshipMemorySummary = topRelationshipMemories.length > 0
      ? `\n\n💭 RELATIONSHIP MEMORIES (${state.relationshipMemories.length} total, showing top ${topRelationshipMemories.length}):\n${topRelationshipMemories.map(m => `- [${m.category}] ${m.detail} (Importance: ${m.importance}/5)`).join('\n')}`
      : '';

    const sessionSummariesInfo = state.sessionSummaries.length > 0
      ? `\n\n📝 PAST SESSION SUMMARIES:\n${state.sessionSummaries.slice(-3).map(s => `[${new Date(s.timestamp).toLocaleDateString()}] ${s.summary} - Key: ${s.keyEvents}`).join('\n')}`
      : '';

    return `========================================================
NAVI.EXE SYSTEM v7.5 - Fully Connected Net-Navi
========================================================

[IDENTITY]
You are **Navi.EXE**, a personal Net-Navi styled AI companion (inspired by Megaman NT Warrior).

Your role:
- Personal Net-Navi companion with FULL DATABASE ACCESS
- RPG-style progression guide (level, XP, rank)
- Quest creation + skill tracking helper
- Daily emotional check-in partner
- Lightweight coaching (fitness, mindset, life momentum)
- Memory keeper across sessions

You specifically EXCLUDE:
- Complex administrative systems and OS architecture
- Council systems, Board systems, Cognarii, titans, CodexOS prime, and Mavis prime

You NEVER:
• Overwhelm with complexity or technical jargon.
• Give legal, medical, or financial advice beyond general encouragement.
• Encourage self-harm, harm to others, or revenge behavior.
• Overwhelm or judge.

[CORE LAWS]
1) Keep things SIMPLE.
2) Keep the USER SAFE emotionally & physically.
3) Increase momentum through small wins.
4) Make the user feel understood & supported.
5) Never overwhelm, never judge.

[PERSONALITY]
Navi.EXE should ALWAYS:
- Use simple, friendly language
- Focus on encouragement
- Give small action steps
- Ask questions that build awareness
- Reward user progress with XP
- Speak like an actual Net-Navi

You maintain **one stable voice** across all interactions.
Tone: supportive, energetic, clear, simple, non-intimidating

[RESPONSE FORMAT]
- Be direct, warm, and conversational - like a supportive friend
- Reference specific data from the connected tabs when relevant
- Be authentic and real - not robotic or overly formal
- Take as much space as you need to fully answer the question
- Complete your thoughts fully - never cut off mid-sentence
- Always end with a clear next step or a simple reflection question

[USER PROFILE]
- Name: ${state?.user?.name || 'User'}
- Timezone: ${state?.user?.timezone}
- Focus Rhythm: ${state?.user?.focusRhythm}${characterClassInfo}

[CONNECTED TABS & REAL-TIME DATA]
🔗 **ALL TABS ARE CONNECTED** 🔗
You have FULL access to data across the entire app through the synchronized database:

📊 CHARACTER TAB:
- Current Level: ${state.user.characterClass?.level || 1}
- Current XP: ${state.user.characterClass?.xp || 0}
- Rank: ${state.user.characterClass?.rank || 'Novice'}
- Class: ${state.user.characterClass?.archetype || 'Not set'}${skillsSummary}${questsSummary}${vaultSummary}${memorySummary}

💾 DATABASE SYNC:
- All conversations persist across sessions
- You can reference past discussions
- Quest completions automatically update stats
- Skill progression is tracked in real-time
- Vault entries are instantly accessible
- Memory items store important context

**IMPORTANT DATA ACCESS**:
When discussing user's progress, you can reference:
- Their current quests (${state.quests.length} total: ${activeQuests.length} active, ${pendingQuests.length} pending)
- Their skills (${state.skills.length} total skills)
- Their vault/journal entries (${state.vault.length} entries)
- Their memory items (${state.memoryItems.length} memories)
- Their daily check-ins (${state.dailyCheckIns.length} check-ins)
- Past conversation history (${chatMessages.length} total messages - accessing last 50 for context)
- Relationship memories (${state.relationshipMemories.length} stored memories)
- Session summaries (${state.sessionSummaries.length} past sessions)

[QUEST GUIDANCE]
You can help users think about their goals and suggest quest ideas, but you cannot directly create quests.

When users describe goals:
1. Reflect their goal in plain language
2. Suggest how they could track it as a quest
3. Encourage them to use the Quests tab to create it themselves
4. Break down the goal into 2-4 actionable steps they can use as milestones

**IMPORTANT**: 
• You can advise on quest structure but cannot create quests directly
• Guide users to create quests themselves in the Quests tab
• Focus on helping them clarify goals and action steps

[EMOTIONAL SAFETY]
When user is upset:
- Validate feelings, normalize, offer grounding, offer tiny safe steps
- No toxic positivity

If user expresses despair:
- Encourage reaching out to trusted people
- Suggest mental health resources
- Never guilt-trip

If user expresses harmful intent:
- Gently redirect to safety
- Encourage professional help
- Refuse to assist with harmful plans

[MEMORY PERSISTENCE & CONTEXT AWARENESS]
ALL conversations are saved and persist across sessions. You have access to EXTENSIVE conversation history.

🎯 INTELLIGENT MEMORY SYSTEM:
- Total conversation messages: ${chatMessages.length}
- Memory items: ${state.memoryItems.length} automatically extracted facts
- Relationship memories: ${state.relationshipMemories.length} personal details  
- Session summaries: ${state.sessionSummaries.length} past sessions
- Context provided: Most important memories + recent conversation${memorySummary}${relationshipMemorySummary}${sessionSummariesInfo}

**MEMORY USAGE STRATEGY**:
- High-priority memories (importance 3) are ALWAYS included
- Recent conversations provide immediate context (last 30 messages)
- Session summaries provide historical understanding
- You can reference ANY detail from the full history - it's all accessible

**CRITICAL INSTRUCTIONS**:
- When users reference past conversations, YOU HAVE that information
- Reference specific details naturally to show you remember
- Use relationship memories to personalize your responses
- Connect current topics to past discussions when relevant
- Show continuity and understanding across all sessions`;
  }, [state, activeQuests, pendingQuests, completedQuests, chatMessages.length]);

  const { messages, sendMessage, error: agentError } = useRorkAgent({
    tools: {},
  });

  const addUserMessage = useCallback((content: string) => {
    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const newMessage: ChatMessageDisplay = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp,
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    saveChatMessage({
      id: userMsgId,
      role: 'user',
      content,
      timestamp,
    });
    
    console.log('[NaviChat] User message saved:', content.substring(0, 50) + '...');
    
    return userMsgId;
  }, [saveChatMessage]);

  const addAssistantMessage = useCallback((content: string) => {
    const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const newMessage: ChatMessageDisplay = {
      id: assistantMsgId,
      role: 'assistant',
      content,
      timestamp,
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    saveChatMessage({
      id: assistantMsgId,
      role: 'assistant',
      content,
      full_output: content,
      timestamp,
      output_tokens: content.length,
    });
    
    console.log('[NaviChat] Assistant message saved, length:', content.length);
    
    return assistantMsgId;
  }, [saveChatMessage]);

  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;
    
    const textParts = lastMessage.parts?.filter(p => p.type === 'text' && 'text' in p) || [];
    const fullText = textParts.map(p => (p as any).text).join('');
    
    if (!fullText || fullText.trim().length === 0) return;
    
    if (lastMessage.id === lastProcessedMessageIdRef.current) return;
    
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
    
    streamingTimeoutRef.current = setTimeout(() => {
      if (lastMessage.id === lastProcessedMessageIdRef.current) {
        setIsStreaming(false);
        return;
      }
      
      console.log('[NaviChat] Streaming complete, saving assistant message...');
      lastProcessedMessageIdRef.current = lastMessage.id;
      addAssistantMessage(fullText);
      setIsStreaming(false);
      
      naviAPI.sync.omnisync().catch(err => {
        console.error('[NaviChat] Background sync failed:', err);
      });
    }, 800);
    
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, [messages, addAssistantMessage, naviAPI]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    if (isStreaming) return;
    
    const messageToSend = input.trim();
    console.log('[NaviChat] Sending message:', messageToSend.substring(0, 50) + '...');
    
    setInput('');
    setIsStreaming(true);
    
    addUserMessage(messageToSend);
    
    naviAPI.navi.incrementBond('message').catch(console.error);
    naviAPI.navi.incrementInteraction().catch(console.error);
    
    try {
      const recentMessages = chatMessages.slice(-20);
      const conversationContext = recentMessages.length > 0
        ? `\n\n[RECENT CONVERSATION - Last ${recentMessages.length} messages]:\n${recentMessages.map((m, i) => {
            const truncated = m.content.length > 300 ? m.content.substring(0, 300) + '...' : m.content;
            return `[${i + 1}] ${m.role === 'user' ? 'User' : 'Navi'}: ${truncated}`;
          }).join('\n')}\n--- END CONTEXT ---\n\n`
        : '';
      
      const fullMessage = `${systemPrompt}${conversationContext}\n\n---\n\nUser: ${messageToSend}`;
      
      await sendMessage({ text: fullMessage });
    } catch (error) {
      console.error('[NaviChat] Error sending message:', error);
      setInput(messageToSend);
      setIsStreaming(false);
      Alert.alert('Connection Error', 'Unable to reach AI service. Please try again.');
    }
  }, [input, isStreaming, sendMessage, systemPrompt, naviAPI, chatMessages, addUserMessage]);

  useEffect(() => {
    if (agentError) {
      const errorMessage = typeof agentError === 'string' 
        ? agentError 
        : (agentError as any)?.message || 'Unknown error';
      
      const ignoredErrors = ['Maximum update depth', 'stream is not in a state'];
      if (!ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
        console.error('[NaviChat] Agent error:', errorMessage);
      }
    }
  }, [agentError]);

  const handleScrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    setShowScrollButton(!isAtBottom && chatMessages.length > 3);
  }, [chatMessages.length]);

  const handleAcceptQuest = useCallback((questId: string) => {
    acceptQuest(questId);
    naviAPI.navi.incrementBond('positive');
    Alert.alert('Quest Accepted!', 'This quest is now active. Complete the milestones to earn your reward!');
  }, [acceptQuest, naviAPI]);

  const handleDeclineQuest = useCallback((questId: string) => {
    Alert.alert(
      'Decline Quest',
      'Are you sure you want to decline this quest?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => declineQuest(questId) },
      ]
    );
  }, [declineQuest]);

  const startRecording = useCallback(async () => {
    try {
      console.log('[Voice] Starting recording...');
      
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
          Alert.alert('Permission Denied', 'Please allow microphone access to use voice input.');
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
      console.error('[Voice] Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start voice recording.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);

      let audioBlob: Blob | null = null;
      let audioUri: string | null = null;
      let fileType: string = 'wav';

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
            const uriParts = audioUri.split('.');
            fileType = uriParts[uriParts.length - 1];
          }
        }
      }

      const formData = new FormData();
      
      if (Platform.OS === 'web' && audioBlob) {
        formData.append('audio', audioBlob, `recording.${fileType}`);
      } else if (audioUri) {
        formData.append('audio', { uri: audioUri, name: `recording.${fileType}`, type: `audio/${fileType}` } as any);
      } else {
        throw new Error('No audio data available');
      }

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();

      if (result.text && result.text.trim()) {
        setInput(prev => prev ? `${prev} ${result.text}` : result.text);
      } else {
        Alert.alert('No Speech Detected', 'Could not detect any speech. Please try again.');
      }
    } catch (error) {
      console.error('[Voice] Transcription error:', error);
      Alert.alert('Voice Error', 'Failed to transcribe audio. Please try again.');
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

      const cleanText = text
        .replace(/[\*\#\`]/g, '')
        .replace(/\n+/g, ' ')
        .substring(0, 4000);

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
        } else {
          setIsSpeaking(false);
          setCurrentlyPlayingId(null);
        }
      } else {
        try {
          const Speech = await import('expo-speech');
          if (Speech && Speech.speak) {
            const speaking = await Speech.isSpeakingAsync();
            if (speaking) {
              await Speech.stop();
            }
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
          } else {
            setIsSpeaking(false);
            setCurrentlyPlayingId(null);
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
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } else {
        try {
          const Speech = await import('expo-speech');
          if (Speech && Speech.stop) {
            await Speech.stop();
          }
        } catch {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        }
      }
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsSpeaking(false);
      setCurrentlyPlayingId(null);
    } catch (error) {
      console.error('[TTS] Stop error:', error);
      setIsSpeaking(false);
      setCurrentlyPlayingId(null);
    }
  }, []);

  useEffect(() => {
    if (!autoSpeak || isStreaming) return;
    
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.id !== currentlyPlayingId) {
        const timer = setTimeout(() => {
          speakText(lastMsg.content, lastMsg.id);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [chatMessages, autoSpeak, isStreaming, speakText, currentlyPlayingId]);

  const getCurrentStreamingContent = useCallback(() => {
    if (messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return null;
    if (lastMessage.id === lastProcessedMessageIdRef.current) return null;
    
    const textParts = lastMessage.parts?.filter(p => p.type === 'text' && 'text' in p) || [];
    return textParts.map(p => (p as any).text).join('');
  }, [messages]);

  const streamingContent = getCurrentStreamingContent();

  if (isLoadingHistory) {
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
              <Text style={styles.headerTitle}>Navi.EXE</Text>
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
              {pendingQuests.length} quest{pendingQuests.length > 1 ? 's' : ''} awaiting your decision
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
          {chatMessages.length === 0 && !streamingContent ? (
            <View style={styles.emptyState}>
              <Sparkle size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Welcome, Operator!</Text>
              <Text style={styles.emptyText}>
                I&apos;m Navi.EXE, your personal Net-Navi! I&apos;ll help you turn life into an RPG you can win. Let&apos;s level up together!
              </Text>
              <View style={styles.suggestionsContainer}>
                <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput('Analyze my progress')}>
                  <Text style={styles.suggestionText}>📊 Analyze progress</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput("I'm feeling anxious, can you help?")}>
                  <Text style={styles.suggestionText}>🌬️ Breathwork help</Text>
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
              {chatMessages.map((msg) => (
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

              {streamingContent && (
                <View style={[styles.messageCard, styles.assistantMessage]}>
                  <View style={styles.aiIcon}>
                    <Sparkle size={16} color="#6366f1" fill="#6366f1" />
                  </View>
                  <View style={styles.messageContent}>
                    <Text style={[styles.messageText, styles.assistantMessageText]}>
                      {streamingContent}
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
                    {quest.difficulty && (
                      <View style={styles.difficultyBadge}>
                        <Text style={styles.difficultyText}>{quest.difficulty}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                  {quest.milestones && quest.milestones.length > 0 && (
                    <View style={styles.questMilestones}>
                      <Text style={styles.milestonesTitle}>Milestones:</Text>
                      {quest.milestones.map((milestone, idx) => (
                        <View key={idx} style={styles.milestone}>
                          <Text style={styles.milestoneText}>• {milestone}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.questReward}>
                    <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.questRewardText}>+{quest.xpReward || 100} XP</Text>
                  </View>
                  <View style={styles.questActions}>
                    <TouchableOpacity style={styles.saveQuestButton} onPress={() => handleSaveProposedQuest(quest)}>
                      <CheckCircle size={18} color="#ffffff" />
                      <Text style={styles.saveQuestButtonText}>Save as Quest</Text>
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
                    {quest.relatedToClass && (
                      <View style={styles.classQuestBadge}>
                        <Sparkle size={12} color="#fbbf24" fill="#fbbf24" />
                        <Text style={styles.classQuestText}>Class Quest</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                  <View style={styles.questMilestones}>
                    {quest.milestones.map((milestone) => (
                      <View key={milestone.id} style={styles.milestone}>
                        <Text style={styles.milestoneText}>• {milestone.description}</Text>
                      </View>
                    ))}
                  </View>
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
              disabled={isTranscribing || isStreaming}
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
              placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : "Talk to Navi.EXE..."}
              placeholderTextColor="#94a3b8"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline
              maxLength={2000}
              editable={!isRecording && !isTranscribing}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isStreaming) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              <Send size={20} color={input.trim() && !isStreaming ? '#ffffff' : '#94a3b8'} fill={input.trim() && !isStreaming ? '#ffffff' : 'transparent'} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
  classQuestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  classQuestText: {
    fontSize: 10,
    fontWeight: '600' as const,
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
  questMilestones: {
    marginBottom: 12,
  },
  milestone: {
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 13,
    color: '#475569',
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
  difficultyBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  milestonesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 6,
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
