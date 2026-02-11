import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, ChevronRight, Heart, Shield, Lock, Database, MessageSquare, Brain, User, Plus, X, Sparkles, TrendingUp, Award, Zap, Star, ChevronUp } from 'lucide-react-native';
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
      case 'memory': return <Brain size={14} color="#8b5cf6" />;
      case 'communication': return <MessageCircle size={14} color="#10b981" />;
      case 'special': return <Sparkles size={14} color="#f59e0b" />;
      default: return <Zap size={14} color="#6366f1" />;
    }
  };

  const getCategoryColor = (category: NaviAbility['category']) => {
    switch (category) {
      case 'support': return '#fce7f3';
      case 'analysis': return '#dbeafe';
      case 'memory': return '#ede9fe';
      case 'communication': return '#d1fae5';
      case 'special': return '#fef3c7';
      default: return '#e0e7ff';
    }
  };

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Navi.EXE</Text>
            <Text style={styles.headerSubtitle}>Your Net-Navi companion</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.talkButton}
            onPress={() => router.push('/mavis')}
            activeOpacity={0.8}
          >
            <MessageCircle size={28} color="#ffffff" />
            <Text style={styles.talkButtonText}>Talk to {naviProfile.name}</Text>
            <ChevronRight size={28} color="#ffffff" style={styles.talkButtonIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.naviCard}
            onPress={() => router.push('/mavis')}
            activeOpacity={0.9}
          >
            <NaviAvatar
              style={naviProfile.avatar.style || 'classic'}
              primaryColor={naviProfile.avatar.primaryColor}
              secondaryColor={naviProfile.avatar.secondaryColor}
              backgroundColor={naviProfile.avatar.backgroundColor}
              size={140}
              glowEnabled={naviProfile.avatar.glowEnabled !== false}
            />
            <Text style={styles.naviName}>{naviProfile.name}</Text>
            
            <View style={[styles.rankBadge, { backgroundColor: currentRank.color + '20', borderColor: currentRank.color }]}>
              <Award size={16} color={currentRank.color} />
              <Text style={[styles.rankText, { color: currentRank.color }]}>{currentRank.name}</Text>
            </View>

            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>Level {naviProfile.level}</Text>
              <View style={styles.xpBarContainer}>
                <View style={[styles.xpBarFill, { width: `${xpProgress.percentage}%` }]} />
              </View>
              <Text style={styles.xpText}>{xpProgress.current} / {xpProgress.required} XP</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={22} color="#6366f1" />
              <Text style={styles.sectionTitle}>Level Progress</Text>
            </View>
            
            <View style={styles.progressCard}>
              <View style={styles.levelProgressRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Lv.{naviProfile.level}</Text>
                </View>
                <View style={styles.progressBarLarge}>
                  <View style={[styles.progressBarLargeFill, { width: `${xpProgress.percentage}%` }]} />
                </View>
                <View style={[styles.levelBadge, styles.levelBadgeNext]}>
                  <Text style={styles.levelBadgeTextNext}>Lv.{naviProfile.level + 1}</Text>
                </View>
              </View>
              
              <View style={styles.xpDetailsRow}>
                <Text style={styles.totalXPText}>{naviProfile.xp.toLocaleString()} Total XP</Text>
                <Text style={styles.xpNeededText}>{(xpProgress.required - xpProgress.current).toLocaleString()} XP to level up</Text>
              </View>

              {nextRank && (
                <View style={styles.nextRankPreview}>
                  <ChevronUp size={16} color="#64748b" />
                  <Text style={styles.nextRankText}>
                    Next Rank: <Text style={[styles.nextRankName, { color: nextRank.color }]}>{nextRank.name}</Text> at Level {nextRank.minLevel}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={22} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Abilities ({unlockedAbilities.length}/{NAVI_ABILITIES.length})</Text>
            </View>

            {nextAbility && (
              <View style={styles.nextAbilityCard}>
                <Lock size={18} color="#94a3b8" />
                <View style={styles.nextAbilityContent}>
                  <Text style={styles.nextAbilityTitle}>Next Unlock: {nextAbility.name}</Text>
                  <Text style={styles.nextAbilityDesc}>{nextAbility.description}</Text>
                  <Text style={styles.nextAbilityLevel}>Unlocks at Level {nextAbility.unlockLevel}</Text>
                </View>
              </View>
            )}

            <View style={styles.abilitiesGrid}>
              {(showAllAbilities ? unlockedAbilities : unlockedAbilities.slice(0, 6)).map((ability) => (
                <View key={ability.id} style={[styles.abilityCard, { backgroundColor: getCategoryColor(ability.category) }]}>
                  <View style={styles.abilityHeader}>
                    {getCategoryIcon(ability.category)}
                    <Text style={styles.abilityLevel}>Lv.{ability.unlockLevel}</Text>
                  </View>
                  <Text style={styles.abilityName}>{ability.name}</Text>
                  <Text style={styles.abilityDesc} numberOfLines={2}>{ability.description}</Text>
                </View>
              ))}
            </View>

            {unlockedAbilities.length > 6 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllAbilities(!showAllAbilities)}
              >
                <Text style={styles.showMoreText}>
                  {showAllAbilities ? 'Show Less' : `Show ${unlockedAbilities.length - 6} More`}
                </Text>
                <ChevronRight size={16} color="#6366f1" style={showAllAbilities ? styles.rotateUp : undefined} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bond Status</Text>
            
            <View style={styles.bondMetricCard}>
              <View style={styles.metricHeader}>
                <Heart size={20} color="#ec4899" fill="#ec4899" />
                <Text style={styles.metricLabel}>Affection</Text>
                <Text style={styles.metricValue}>{naviProfile.affection}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${bondPercentage}%`, backgroundColor: '#ec4899' }]} />
              </View>
            </View>

            <View style={styles.bondMetricCard}>
              <View style={styles.metricHeader}>
                <Shield size={20} color="#3b82f6" fill="#3b82f6" />
                <Text style={styles.metricLabel}>Trust</Text>
                <Text style={styles.metricValue}>{naviProfile.trust}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${trustPercentage}%`, backgroundColor: '#3b82f6' }]} />
              </View>
            </View>

            <View style={styles.bondMetricCard}>
              <View style={styles.metricHeader}>
                <Star size={20} color="#8b5cf6" fill="#8b5cf6" />
                <Text style={styles.metricLabel}>Loyalty</Text>
                <Text style={styles.metricValue}>{naviProfile.loyalty}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${loyaltyPercentage}%`, backgroundColor: '#8b5cf6' }]} />
              </View>
            </View>

            <View style={styles.bondBadgeContainer}>
              <Text style={styles.bondLevelLabel}>Bond Level {naviProfile.bondLevel}</Text>
              <View style={styles.bondTitleBadge}>
                <Text style={styles.bondTitleText}>{naviProfile.bondTitle}</Text>
              </View>
            </View>
          </View>

          {naviProfile.unlockedFeatures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bond Abilities</Text>
              {naviProfile.unlockedFeatures.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <Sparkles size={18} color="#10b981" fill="#10b981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{naviProfile.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: currentRank.color + '15' }]}>
              <Text style={[styles.statValue, { color: currentRank.color }]}>{currentRank.name}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{naviProfile.interactionCount}</Text>
              <Text style={styles.statLabel}>Interactions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{unlockedAbilities.length}</Text>
              <Text style={styles.statLabel}>Abilities</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Configuration</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Personality</Text>
                <Text style={styles.infoValue}>
                  {naviProfile.personalityPreset.charAt(0).toUpperCase() + naviProfile.personalityPreset.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Mode</Text>
                <Text style={styles.infoValue}>
                  {naviProfile.currentMode === 'auto' ? 'Auto' : 
                   naviProfile.currentMode === 'life_os' ? 'Life-OS' :
                   naviProfile.currentMode === 'work_os' ? 'Work-OS' :
                   naviProfile.currentMode === 'social_os' ? 'Social-OS' :
                   'Metaverse-OS'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Customize Navi & Avatar in Settings</Text>
              <ChevronRight size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoHint}>
            <Text style={styles.infoHintText}>💡 Complete quests together to level up Navi!</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Control</Text>
            {ltmBlocks.length > 0 && (
              <View style={styles.ltmStatusCard}>
                <Brain size={16} color="#8b5cf6" />
                <Text style={styles.ltmStatusText}>
                  {ltmBlocks.length} memory blocks | {ltmBlocks.reduce((s, b) => s + b.details.length, 0)} total facts stored
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.omnisyncButton, isSyncing && styles.omnisyncButtonDisabled]}
              onPress={handleOmnisync}
              activeOpacity={0.7}
              disabled={isSyncing}
            >
              <Database size={24} color="#ffffff" />
              <View style={styles.omnisyncTextContainer}>
                <Text style={styles.omnisyncButtonText}>
                  {isSyncing ? 'Synchronizing...' : '/omnisync'}
                </Text>
                <Text style={styles.omnisyncButtonSubtext}>
                  {isSyncing ? 'Saving all data...' : 'Save all state & create backup'}
                </Text>
              </View>
              {!isSyncing && <ChevronRight size={24} color="#ffffff" />}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 Full Conversation Log</Text>
            <Text style={styles.sectionSubtitle}>{chatMessages.length} messages stored • Last 20 shown</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chatLogScroll}>
              {chatMessages.slice(-20).map((msg, idx) => (
                <View key={`msg-${idx}`} style={[
                  styles.miniMessageCard,
                  msg.role === 'user' ? styles.miniUserMessage : styles.miniAssistantMessage
                ]}>
                  {msg.role === 'assistant' && <Sparkles size={12} color="#6366f1" />}
                  {msg.role === 'user' && <User size={12} color="#ffffff" />}
                  <Text style={[
                    styles.miniMessageText,
                    msg.role === 'user' ? styles.miniUserText : styles.miniAssistantText
                  ]} numberOfLines={3}>
                    {(msg.full_output || msg.content).substring(0, 80)}...
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Brain size={20} color="#6366f1" />
              <Text style={styles.sectionTitle}>Relationship Memory</Text>
            </View>
            {relationshipMemories.length > 0 ? (
              <View style={styles.memoryList}>
                {relationshipMemories.slice(0, 15).map((memory, idx) => (
                  <View key={`mem-${idx}`} style={styles.memoryCard}>
                    <Text style={styles.memoryCategory}>{memory.category}</Text>
                    <Text style={styles.memoryDetail}>{memory.detail}</Text>
                    <View style={styles.importanceIndicator}>
                      {Array.from({ length: memory.importance }).map((_, i) => (
                        <View key={i} style={styles.importanceDot} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyMemoryState}>
                <Text style={styles.emptyMemoryText}>No memories stored yet. Navi will learn about you as you chat.</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.addMemoryButton}
              onPress={() => setShowMemoryForm(!showMemoryForm)}
            >
              {showMemoryForm ? <X size={16} color="#6366f1" /> : <Plus size={16} color="#6366f1" />}
              <Text style={styles.addMemoryButtonText}>
                {showMemoryForm ? 'Cancel' : 'Add Memory Manually'}
              </Text>
            </TouchableOpacity>
            {showMemoryForm && (
              <View style={styles.memoryForm}>
                <TextInput
                  style={styles.memoryInput}
                  placeholder="Category (e.g., Preference, Goal)"
                  placeholderTextColor="#94a3b8"
                  value={newMemoryCategory}
                  onChangeText={setNewMemoryCategory}
                />
                <TextInput
                  style={[styles.memoryInput, styles.memoryInputMultiline]}
                  placeholder="Detail..."
                  placeholderTextColor="#94a3b8"
                  value={newMemoryDetail}
                  onChangeText={setNewMemoryDetail}
                  multiline
                />
                <TouchableOpacity
                  style={styles.saveMemoryButton}
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
                  <Text style={styles.saveMemoryButtonText}>Save Memory</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <MessageSquare size={20} color="#6366f1" />
              <Text style={styles.sectionTitle}>Navi.EXE State</Text>
            </View>
            <View style={styles.naviStateCard}>
              <View style={styles.naviStateRow}>
                <Text style={styles.naviStateLabel}>Persona Name:</Text>
                <Text style={styles.naviStateValue}>{naviState.personaName}</Text>
              </View>
              <View style={styles.naviStateRow}>
                <Text style={styles.naviStateLabel}>Bond Level:</Text>
                <Text style={styles.naviStateValue}>{naviState.bondLevel}</Text>
              </View>
              <View style={styles.naviStateRow}>
                <Text style={styles.naviStateLabel}>Total Messages:</Text>
                <Text style={styles.naviStateValue}>{chatMessages.length}</Text>
              </View>
              <View style={styles.naviStateRow}>
                <Text style={styles.naviStateLabel}>Style Notes:</Text>
                <Text style={styles.naviStateValueMulti}>{naviState.styleNotes}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  talkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  talkButtonText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  talkButtonIcon: {
    marginLeft: 'auto' as 'auto',
  },
  naviCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  naviName: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#0f172a',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 2,
    gap: 6,
  },
  rankText: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  levelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  xpBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 5,
  },
  xpText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  levelProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeNext: {
    backgroundColor: '#e0e7ff',
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  levelBadgeTextNext: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  progressBarLarge: {
    flex: 1,
    height: 14,
    backgroundColor: '#e2e8f0',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressBarLargeFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 7,
  },
  xpDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalXPText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#6366f1',
  },
  xpNeededText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  nextRankPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nextRankText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  nextRankName: {
    fontWeight: '700' as const,
  },
  nextAbilityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  nextAbilityContent: {
    flex: 1,
  },
  nextAbilityTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  nextAbilityDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 6,
  },
  nextAbilityLevel: {
    fontSize: 12,
    color: '#94a3b8',
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
    minHeight: 100,
  },
  abilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  abilityLevel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  abilityName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  abilityDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 4,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  rotateUp: {
    transform: [{ rotate: '-90deg' }],
  },
  bondMetricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  metricLabel: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '600' as const,
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700' as const,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  bondBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bondLevelLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  bondTitleBadge: {
    backgroundColor: '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bondTitleText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  featureText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '600' as const,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 0,
    minWidth: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700' as const,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  omnisyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  omnisyncButtonDisabled: {
    backgroundColor: '#94a3b8',
    ...Platform.select({
      ios: {
        shadowColor: '#94a3b8',
        shadowOpacity: 0.2,
      },
    }),
  },
  omnisyncTextContainer: {
    flex: 1,
  },
  omnisyncButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  omnisyncButtonSubtext: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#ffffff',
    opacity: 0.85,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  chatLogScroll: {
    marginTop: 8,
  },
  miniMessageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 180,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniUserMessage: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  miniAssistantMessage: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  miniMessageText: {
    fontSize: 12,
    marginTop: 6,
  },
  miniUserText: {
    color: '#ffffff',
  },
  miniAssistantText: {
    color: '#0f172a',
  },
  memoryList: {
    gap: 12,
  },
  memoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  memoryCategory: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#6366f1',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  memoryDetail: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 8,
  },
  importanceIndicator: {
    flexDirection: 'row' as const,
    gap: 4,
  },
  importanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  emptyMemoryState: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  emptyMemoryText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  addMemoryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  addMemoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  memoryForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  memoryInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#0f172a',
  },
  memoryInputMultiline: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  saveMemoryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveMemoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  naviStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  naviStateRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  naviStateLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  naviStateValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  naviStateValueMulti: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
    flex: 1,
    marginLeft: 8,
  },
  infoHint: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  infoHintText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
  ltmStatusCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  ltmStatusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6d28d9',
    flex: 1,
  },
});
