import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, ChevronRight, Heart, Shield, Lock, Database, MessageSquare, Brain, User, Plus, X, Sparkles, TrendingUp, Award, Zap, Star, ChevronUp, Activity } from 'lucide-react-native';
import { router } from 'expo-router';

import { useApp } from '@/contexts/AppContext';
import { useBackendSync } from '@/contexts/BackendSyncContext';
import type { RelationshipMemory } from '@/types';
import NaviAvatar from '@/components/NaviAvatar';
import { 
  getNaviXPProgress, 
  getNaviRank, 
  getNextNaviRank, 
  getUnlockedAbilities, 
  getNextAbility,
  NAVI_ABILITIES,
  type NaviAbility,
} from '@/constants/naviLeveling';

function AnimatedBar({ percentage, color, delay = 0 }: { percentage: number; color: string; delay?: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default function NaviScreen() {
  const insets = useSafeAreaInsets();
  const { state, omnisync, getChatHistory, ltmBlocks } = useApp();
  const { forceSync } = useBackendSync();
  const naviProfile = state.settings.navi.profile;
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showMemoryForm, setShowMemoryForm] = useState<boolean>(false);
  const [newMemoryCategory, setNewMemoryCategory] = useState<string>('');
  const [newMemoryDetail, setNewMemoryDetail] = useState<string>('');
  const [showAllAbilities, setShowAllAbilities] = useState<boolean>(false);

  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const chatBtnAnim = useRef(new Animated.Value(0)).current;
  const syncPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(heroFadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(chatBtnAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isSyncing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(syncPulseAnim, { toValue: 0.92, duration: 400, useNativeDriver: true }),
          Animated.timing(syncPulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isSyncing]);
  
  const chatMessages = getChatHistory();
  const relationshipMemories = state.relationshipMemories || [];
  const naviState = state.naviState || { personaName: 'Navi.EXE', bondLevel: 1, styleNotes: '', lastSessionAt: '', totalMessages: 0 };

  const bondPercentage = Math.round((naviProfile.affection / 100) * 100);
  const trustPercentage = Math.round((naviProfile.trust / 100) * 100);
  const loyaltyPercentage = Math.round((naviProfile.loyalty / 100) * 100);

  const xpProgress = useMemo(() => getNaviXPProgress(naviProfile.xp), [naviProfile.xp]);
  const currentRank = useMemo(() => getNaviRank(naviProfile.level), [naviProfile.level]);
  const nextRank = useMemo(() => getNextNaviRank(naviProfile.level), [naviProfile.level]);
  const unlockedAbilities = useMemo(() => getUnlockedAbilities(naviProfile.level), [naviProfile.level]);
  const nextAbility = useMemo(() => getNextAbility(naviProfile.level), [naviProfile.level]);

  const handleOmnisync = async () => {
    setIsSyncing(true);
    try {
      const result = await omnisync();
      if (result.success) {
        console.log('[NaviScreen] Omnisync complete, triggering backend force sync...');
        try {
          await forceSync();
          console.log('[NaviScreen] Backend force sync triggered after omnisync');
        } catch (syncError) {
          console.warn('[NaviScreen] Backend sync after omnisync failed (data saved locally):', syncError);
        }
        Alert.alert(
          'Omnisync Complete',
          `${result.message}\n\nSnapshot:\n` +
          `• User: ${result.snapshot.userIdentity}\n` +
          `• Quests: ${result.snapshot.questCount}\n` +
          `• Skills: ${result.snapshot.skillCount}\n` +
          `• Memories: ${result.snapshot.memoryCount}\n` +
          `• Vault Entries: ${result.snapshot.vaultCount}\n` +
          `• Chat Messages: ${result.snapshot.chatCount}\n` +
          `• Bond Level: ${result.snapshot.bondLevel}\n` +
          `• LTM Blocks: ${result.snapshot.ltmBlocks}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Omnisync Failed', result.message, [{ text: 'OK' }]);
      }
    } catch {
      Alert.alert('Omnisync Error', 'Failed to synchronize state', [{ text: 'OK' }]);
    } finally {
      setIsSyncing(false);
    }
  };

  const getCategoryIcon = (category: NaviAbility['category']) => {
    switch (category) {
      case 'support': return <Heart size={14} color="#ec4899" />;
      case 'analysis': return <TrendingUp size={14} color="#3b82f6" />;
      case 'memory': return <Brain size={14} color="#a78bfa" />;
      case 'communication': return <MessageCircle size={14} color="#34d399" />;
      case 'special': return <Sparkles size={14} color="#fbbf24" />;
      default: return <Zap size={14} color="#818cf8" />;
    }
  };

  const getCategoryColor = (category: NaviAbility['category']) => {
    switch (category) {
      case 'support': return '#1a0a14';
      case 'analysis': return '#0a1428';
      case 'memory': return '#140a28';
      case 'communication': return '#0a1e14';
      case 'special': return '#1e1a0a';
      default: return '#0f0f28';
    }
  };

  const getCategoryBorder = (category: NaviAbility['category']) => {
    switch (category) {
      case 'support': return '#ec489930';
      case 'analysis': return '#3b82f630';
      case 'memory': return '#a78bfa30';
      case 'communication': return '#34d39930';
      case 'special': return '#fbbf2430';
      default: return '#818cf830';
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.heroSection, { opacity: heroFadeAnim, transform: [{ translateY: heroFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTitle}>Navi.EXE</Text>
              <Text style={styles.heroSubtitle}>Net-Navi Companion</Text>
            </View>
            <View style={[styles.rankChip, { backgroundColor: currentRank.color + '25', borderColor: currentRank.color + '60' }]}>
              <Award size={14} color={currentRank.color} />
              <Text style={[styles.rankChipText, { color: currentRank.color }]}>{currentRank.name}</Text>
            </View>
          </View>

          <View style={styles.avatarSection}>
            <NaviAvatar
              style={naviProfile.avatar.style || 'classic'}
              primaryColor={naviProfile.avatar.primaryColor}
              secondaryColor={naviProfile.avatar.secondaryColor}
              backgroundColor={naviProfile.avatar.backgroundColor}
              size={130}
              glowEnabled={naviProfile.avatar.glowEnabled !== false}
            />
          </View>

          <Text style={styles.naviNameText}>{naviProfile.name}</Text>
          <Text style={styles.levelLabel}>Level {naviProfile.level}</Text>

          <View style={styles.xpContainer}>
            <AnimatedBar percentage={xpProgress.percentage} color={currentRank.color} />
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>{xpProgress.current} XP</Text>
              <Text style={styles.xpLabelFaded}>{xpProgress.required} XP</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: chatBtnAnim, transform: [{ scale: chatBtnAnim }] }}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push('/mavis')}
            activeOpacity={0.85}
            testID="talk-to-navi"
          >
            <View style={styles.chatBtnIcon}>
              <MessageCircle size={22} color="#ffffff" />
            </View>
            <View style={styles.chatBtnContent}>
              <Text style={styles.chatBtnTitle}>Talk to {naviProfile.name}</Text>
              <Text style={styles.chatBtnSub}>{chatMessages.length} messages in history</Text>
            </View>
            <ChevronRight size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{naviProfile.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={[styles.statChip, { borderColor: currentRank.color + '40' }]}>
            <Text style={[styles.statValue, { color: currentRank.color }]}>{currentRank.name}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{naviProfile.interactionCount}</Text>
            <Text style={styles.statLabel}>Talks</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{unlockedAbilities.length}</Text>
            <Text style={styles.statLabel}>Skills</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={18} color="#ec4899" />
            <Text style={styles.cardTitle}>Bond Status</Text>
            <View style={styles.bondChip}>
              <Text style={styles.bondChipText}>Lv.{naviProfile.bondLevel} {naviProfile.bondTitle}</Text>
            </View>
          </View>

          <View style={styles.bondRow}>
            <View style={styles.bondMetric}>
              <View style={styles.bondMetricHead}>
                <Heart size={14} color="#ec4899" fill="#ec4899" />
                <Text style={styles.bondMetricLabel}>Affection</Text>
                <Text style={styles.bondMetricVal}>{naviProfile.affection}</Text>
              </View>
              <AnimatedBar percentage={bondPercentage} color="#ec4899" delay={100} />
            </View>
            <View style={styles.bondMetric}>
              <View style={styles.bondMetricHead}>
                <Shield size={14} color="#3b82f6" fill="#3b82f6" />
                <Text style={styles.bondMetricLabel}>Trust</Text>
                <Text style={styles.bondMetricVal}>{naviProfile.trust}</Text>
              </View>
              <AnimatedBar percentage={trustPercentage} color="#3b82f6" delay={200} />
            </View>
            <View style={styles.bondMetric}>
              <View style={styles.bondMetricHead}>
                <Star size={14} color="#a78bfa" fill="#a78bfa" />
                <Text style={styles.bondMetricLabel}>Loyalty</Text>
                <Text style={styles.bondMetricVal}>{naviProfile.loyalty}</Text>
              </View>
              <AnimatedBar percentage={loyaltyPercentage} color="#a78bfa" delay={300} />
            </View>
          </View>
        </View>

        {xpProgress && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TrendingUp size={18} color="#818cf8" />
              <Text style={styles.cardTitle}>Level Progress</Text>
            </View>
            <View style={styles.levelProgressRow}>
              <View style={styles.lvlBadge}>
                <Text style={styles.lvlBadgeText}>Lv.{naviProfile.level}</Text>
              </View>
              <View style={styles.levelBarWrap}>
                <AnimatedBar percentage={xpProgress.percentage} color="#818cf8" />
              </View>
              <View style={[styles.lvlBadge, styles.lvlBadgeNext]}>
                <Text style={styles.lvlBadgeNextText}>Lv.{naviProfile.level + 1}</Text>
              </View>
            </View>
            <View style={styles.xpDetailsRow}>
              <Text style={styles.xpDetailText}>{naviProfile.xp.toLocaleString()} Total XP</Text>
              <Text style={styles.xpDetailFaded}>{(xpProgress.required - xpProgress.current).toLocaleString()} to next</Text>
            </View>
            {nextRank && (
              <View style={styles.nextRankRow}>
                <ChevronUp size={14} color="#64748b" />
                <Text style={styles.nextRankText}>
                  Next Rank: <Text style={{ color: nextRank.color, fontWeight: '700' as const }}>{nextRank.name}</Text> at Level {nextRank.minLevel}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Zap size={18} color="#fbbf24" />
            <Text style={styles.cardTitle}>Abilities</Text>
            <Text style={styles.abilityCount}>{unlockedAbilities.length}/{NAVI_ABILITIES.length}</Text>
          </View>

          {nextAbility && (
            <View style={styles.nextAbilityRow}>
              <Lock size={16} color="#64748b" />
              <View style={styles.nextAbilityContent}>
                <Text style={styles.nextAbilityName}>{nextAbility.name}</Text>
                <Text style={styles.nextAbilityDesc}>{nextAbility.description}</Text>
                <Text style={styles.nextAbilityLvl}>Unlocks at Level {nextAbility.unlockLevel}</Text>
              </View>
            </View>
          )}

          <View style={styles.abilitiesGrid}>
            {(showAllAbilities ? unlockedAbilities : unlockedAbilities.slice(0, 6)).map((ability) => (
              <View key={ability.id} style={[styles.abilityCard, { backgroundColor: getCategoryColor(ability.category), borderColor: getCategoryBorder(ability.category) }]}>
                <View style={styles.abilityTop}>
                  {getCategoryIcon(ability.category)}
                  <Text style={styles.abilityLvl}>Lv.{ability.unlockLevel}</Text>
                </View>
                <Text style={styles.abilityName}>{ability.name}</Text>
                <Text style={styles.abilityDesc} numberOfLines={2}>{ability.description}</Text>
              </View>
            ))}
          </View>

          {unlockedAbilities.length > 6 && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllAbilities(!showAllAbilities)}>
              <Text style={styles.showMoreText}>{showAllAbilities ? 'Show Less' : `Show ${unlockedAbilities.length - 6} More`}</Text>
              <ChevronRight size={14} color="#818cf8" style={showAllAbilities ? { transform: [{ rotate: '-90deg' }] } : undefined} />
            </TouchableOpacity>
          )}
        </View>

        {naviProfile.unlockedFeatures.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Sparkles size={18} color="#34d399" />
              <Text style={styles.cardTitle}>Bond Abilities</Text>
            </View>
            {naviProfile.unlockedFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Sparkles size={14} color="#34d399" fill="#34d399" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={18} color="#818cf8" />
            <Text style={styles.cardTitle}>Configuration</Text>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Personality</Text>
            <Text style={styles.configVal}>
              {naviProfile.personalityPreset.charAt(0).toUpperCase() + naviProfile.personalityPreset.slice(1)}
            </Text>
          </View>
          <View style={styles.configDivider} />
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Mode</Text>
            <Text style={styles.configVal}>
              {naviProfile.currentMode === 'auto' ? 'Auto' : 
               naviProfile.currentMode === 'life_os' ? 'Life-OS' :
               naviProfile.currentMode === 'work_os' ? 'Work-OS' :
               naviProfile.currentMode === 'social_os' ? 'Social-OS' :
               'Metaverse-OS'}
            </Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <Text style={styles.settingsBtnText}>Customize in Settings</Text>
            <ChevronRight size={16} color="#818cf8" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Database size={18} color="#34d399" />
            <Text style={styles.cardTitle}>System Control</Text>
          </View>
          {ltmBlocks.length > 0 && (
            <View style={styles.ltmChip}>
              <Brain size={14} color="#a78bfa" />
              <Text style={styles.ltmText}>
                {ltmBlocks.length} memory blocks | {ltmBlocks.reduce((s, b) => s + b.details.length, 0)} facts stored
              </Text>
            </View>
          )}
          <Animated.View style={{ transform: [{ scale: syncPulseAnim }] }}>
            <TouchableOpacity
              style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
              onPress={handleOmnisync}
              activeOpacity={0.8}
              disabled={isSyncing}
              testID="omnisync-btn"
            >
              <Database size={22} color="#ffffff" />
              <View style={styles.syncBtnContent}>
                <Text style={styles.syncBtnTitle}>{isSyncing ? 'Synchronizing...' : '/omnisync'}</Text>
                <Text style={styles.syncBtnSub}>{isSyncing ? 'Saving all data...' : 'Save all state & create backup'}</Text>
              </View>
              {!isSyncing && <ChevronRight size={22} color="rgba(255,255,255,0.6)" />}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MessageSquare size={18} color="#818cf8" />
            <Text style={styles.cardTitle}>Conversation Log</Text>
            <Text style={styles.msgCount}>{chatMessages.length} msgs</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chatScroll}>
            {chatMessages.slice(-20).map((msg, idx) => (
              <View key={`msg-${idx}`} style={[styles.miniMsg, msg.role === 'user' ? styles.miniMsgUser : styles.miniMsgAssistant]}>
                {msg.role === 'assistant' && <Sparkles size={11} color="#818cf8" />}
                {msg.role === 'user' && <User size={11} color="#ffffff" />}
                <Text style={[styles.miniMsgText, msg.role === 'user' ? styles.miniMsgTextUser : styles.miniMsgTextAssistant]} numberOfLines={3}>
                  {(msg.full_output || msg.content).substring(0, 80)}...
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Brain size={18} color="#a78bfa" />
            <Text style={styles.cardTitle}>Relationship Memory</Text>
          </View>
          {relationshipMemories.length > 0 ? (
            <View style={styles.memoryList}>
              {relationshipMemories.slice(0, 15).map((memory, idx) => (
                <View key={`mem-${idx}`} style={styles.memoryItem}>
                  <Text style={styles.memoryCat}>{memory.category}</Text>
                  <Text style={styles.memoryDetail}>{memory.detail}</Text>
                  <View style={styles.importanceRow}>
                    {Array.from({ length: memory.importance }).map((_, i) => (
                      <View key={i} style={styles.importanceDot} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyMem}>
              <Text style={styles.emptyMemText}>No memories stored yet. Chat with Navi to build memories.</Text>
            </View>
          )}
          <TouchableOpacity style={styles.addMemBtn} onPress={() => setShowMemoryForm(!showMemoryForm)}>
            {showMemoryForm ? <X size={14} color="#818cf8" /> : <Plus size={14} color="#818cf8" />}
            <Text style={styles.addMemText}>{showMemoryForm ? 'Cancel' : 'Add Memory Manually'}</Text>
          </TouchableOpacity>
          {showMemoryForm && (
            <View style={styles.memForm}>
              <TextInput
                style={styles.memInput}
                placeholder="Category (e.g., Preference, Goal)"
                placeholderTextColor="#4a5568"
                value={newMemoryCategory}
                onChangeText={setNewMemoryCategory}
              />
              <TextInput
                style={[styles.memInput, styles.memInputMulti]}
                placeholder="Detail..."
                placeholderTextColor="#4a5568"
                value={newMemoryDetail}
                onChangeText={setNewMemoryDetail}
                multiline
              />
              <TouchableOpacity
                style={styles.saveMemBtn}
                onPress={() => {
                  if (newMemoryCategory.trim() && newMemoryDetail.trim()) {
                    const newMemory: RelationshipMemory = {
                      id: `mem-${Date.now()}`,
                      category: newMemoryCategory.trim(),
                      detail: newMemoryDetail.trim(),
                      importance: 3,
                      lastUpdated: new Date().toISOString(),
                    };
                    (state as any).setState?.((prev: any) => ({
                      ...prev,
                      relationshipMemories: [newMemory, ...prev.relationshipMemories],
                    }));
                    setNewMemoryCategory('');
                    setNewMemoryDetail('');
                    setShowMemoryForm(false);
                  }
                }}
              >
                <Text style={styles.saveMemBtnText}>Save Memory</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MessageSquare size={18} color="#818cf8" />
            <Text style={styles.cardTitle}>Navi.EXE State</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Persona</Text>
            <Text style={styles.stateVal}>{naviState.personaName}</Text>
          </View>
          <View style={styles.configDivider} />
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Bond Level</Text>
            <Text style={styles.stateVal}>{naviState.bondLevel}</Text>
          </View>
          <View style={styles.configDivider} />
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Messages</Text>
            <Text style={styles.stateVal}>{chatMessages.length}</Text>
          </View>
          {naviState.styleNotes ? (
            <>
              <View style={styles.configDivider} />
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Style</Text>
                <Text style={[styles.stateVal, { flex: 1, textAlign: 'right' as const }]} numberOfLines={2}>{naviState.styleNotes}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.hintCard}>
          <Sparkles size={16} color="#fbbf24" />
          <Text style={styles.hintText}>Complete quests together to level up Navi!</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0f1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#f1f5f9',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 5,
  },
  rankChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  avatarSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  naviNameText: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#f1f5f9',
    letterSpacing: 0.3,
  },
  levelLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  xpContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  xpLabelFaded: {
    fontSize: 12,
    color: '#475569',
  },
  chatButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  chatBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtnContent: {
    flex: 1,
  },
  chatBtnTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  chatBtnSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#141824',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#e2e8f0',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#141824',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#e2e8f0',
    flex: 1,
  },
  bondChip: {
    backgroundColor: '#fbbf2420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bondChipText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fbbf24',
  },
  bondRow: {
    gap: 14,
  },
  bondMetric: {
    gap: 8,
  },
  bondMetricHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bondMetricLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600' as const,
    flex: 1,
  },
  bondMetricVal: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700' as const,
  },
  levelProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  lvlBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  lvlBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  lvlBadgeNext: {
    backgroundColor: '#1e293b',
  },
  lvlBadgeNextText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  levelBarWrap: {
    flex: 1,
  },
  xpDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpDetailText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#818cf8',
  },
  xpDetailFaded: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  nextRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  nextRankText: {
    fontSize: 13,
    color: '#64748b',
  },
  abilityCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  nextAbilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0c0f1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
  },
  nextAbilityContent: {
    flex: 1,
  },
  nextAbilityName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#e2e8f0',
    marginBottom: 3,
  },
  nextAbilityDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
    marginBottom: 4,
  },
  nextAbilityLvl: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  abilityCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    borderWidth: 1,
  },
  abilityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  abilityLvl: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  abilityName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#e2e8f0',
    marginBottom: 3,
  },
  abilityDesc: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    gap: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#818cf8',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1e14',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#34d39920',
  },
  featureText: {
    fontSize: 13,
    color: '#34d399',
    fontWeight: '600' as const,
    flex: 1,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  configLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  configVal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#e2e8f0',
  },
  configDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 6,
  },
  settingsBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#818cf8',
  },
  ltmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#140a28',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a78bfa25',
  },
  ltmText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#a78bfa',
    flex: 1,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    padding: 18,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  syncButtonDisabled: {
    backgroundColor: '#475569',
    ...Platform.select({
      ios: { shadowColor: '#475569', shadowOpacity: 0.15 },
    }),
  },
  syncBtnContent: {
    flex: 1,
  },
  syncBtnTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  syncBtnSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  chatScroll: {
    marginTop: 4,
  },
  miniMsg: {
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 160,
    borderWidth: 1,
  },
  miniMsgUser: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  miniMsgAssistant: {
    backgroundColor: '#1e293b',
    borderColor: '#2d3748',
  },
  miniMsgText: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  miniMsgTextUser: {
    color: '#ffffff',
  },
  miniMsgTextAssistant: {
    color: '#cbd5e1',
  },
  msgCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  memoryList: {
    gap: 10,
  },
  memoryItem: {
    backgroundColor: '#0c0f1a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  memoryCat: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#818cf8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  memoryDetail: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
    marginBottom: 6,
  },
  importanceRow: {
    flexDirection: 'row',
    gap: 4,
  },
  importanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  emptyMem: {
    padding: 18,
    backgroundColor: '#0c0f1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  emptyMemText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
  },
  addMemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  addMemText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#818cf8',
  },
  memForm: {
    backgroundColor: '#0c0f1a',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  memInput: {
    backgroundColor: '#141824',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    fontSize: 14,
    color: '#e2e8f0',
  },
  memInputMulti: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  saveMemBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  saveMemBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  stateLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  stateVal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#e2e8f0',
  },
  hintCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e1a0a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fbbf2420',
  },
  hintText: {
    fontSize: 13,
    color: '#fbbf24',
    fontWeight: '600' as const,
    flex: 1,
  },
});
