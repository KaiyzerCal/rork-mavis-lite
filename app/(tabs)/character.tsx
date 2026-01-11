import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, TrendingUp, Target, Award, Sparkle, Zap, CheckCircle, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, Palette, User, Hexagon, Circle, Square, Diamond, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useApp } from '@/contexts/AppContext';
import { ARCHETYPE_DATA } from '@/constants/archetypes';
import { HIDDEN_CLASSES, getHiddenClassProgress } from '@/constants/hiddenClasses';
import NaviAvatar from '@/components/NaviAvatar';
import type { HiddenClass, NaviAvatarStyle } from '@/types';

type TabType = 'character' | 'skills' | 'navi';

const AVATAR_STYLES: { id: NaviAvatarStyle; name: string; category: string }[] = [
  { id: 'classic', name: 'Classic', category: 'Basic' },
  { id: 'cyber', name: 'Cyber', category: 'Basic' },
  { id: 'guardian', name: 'Guardian', category: 'Basic' },
  { id: 'sage', name: 'Sage', category: 'Basic' },
  { id: 'phantom', name: 'Phantom', category: 'Basic' },
  { id: 'nova', name: 'Nova', category: 'Basic' },
  { id: 'sentinel', name: 'Sentinel', category: 'Basic' },
  { id: 'oracle', name: 'Oracle', category: 'Basic' },
  { id: 'nexus', name: 'Nexus', category: 'Basic' },
  { id: 'prism', name: 'Prism', category: 'Basic' },
  { id: 'warrior_male', name: 'Warrior (M)', category: 'Humanoid' },
  { id: 'warrior_female', name: 'Warrior (F)', category: 'Humanoid' },
  { id: 'assassin', name: 'Assassin', category: 'Humanoid' },
  { id: 'paladin', name: 'Paladin', category: 'Humanoid' },
  { id: 'mecha_unit', name: 'Mecha Unit', category: 'Machine' },
  { id: 'golem_stone', name: 'Stone Golem', category: 'Machine' },
  { id: 'beast_wolf', name: 'Wolf', category: 'Beast' },
  { id: 'beast_dragon', name: 'Dragon', category: 'Beast' },
  { id: 'demon_lord', name: 'Demon Lord', category: 'Mythical' },
  { id: 'angel_seraph', name: 'Seraph', category: 'Mythical' },
  { id: 'spirit_flame', name: 'Flame Spirit', category: 'Elemental' },
  { id: 'spirit_ice', name: 'Ice Spirit', category: 'Elemental' },
  { id: 'alien_grey', name: 'Grey Alien', category: 'Alien' },
  { id: 'alien_nova', name: 'Nova Alien', category: 'Alien' },
  { id: 'slime_cute', name: 'Cute Slime', category: 'Creature' },
];

const COLOR_PRESETS = [
  { name: 'Indigo', primary: '#6366f1', secondary: '#818cf8', bg: '#1e1b4b' },
  { name: 'Emerald', primary: '#10b981', secondary: '#34d399', bg: '#064e3b' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#fb7185', bg: '#4c0519' },
  { name: 'Amber', primary: '#f59e0b', secondary: '#fbbf24', bg: '#451a03' },
  { name: 'Cyan', primary: '#06b6d4', secondary: '#22d3ee', bg: '#083344' },
  { name: 'Purple', primary: '#a855f7', secondary: '#c084fc', bg: '#3b0764' },
  { name: 'Crimson', primary: '#dc2626', secondary: '#ef4444', bg: '#450a0a' },
  { name: 'Sky', primary: '#0ea5e9', secondary: '#38bdf8', bg: '#0c4a6e' },
  { name: 'Lime', primary: '#84cc16', secondary: '#a3e635', bg: '#1a2e05' },
  { name: 'Fuchsia', primary: '#d946ef', secondary: '#e879f9', bg: '#4a044e' },
  { name: 'Orange', primary: '#f97316', secondary: '#fb923c', bg: '#431407' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#2dd4bf', bg: '#042f2e' },
];

const SHAPE_OPTIONS: { id: 'circle' | 'rounded-square' | 'hexagon' | 'diamond'; name: string; icon: any }[] = [
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'rounded-square', name: 'Square', icon: Square },
  { id: 'hexagon', name: 'Hexagon', icon: Hexagon },
  { id: 'diamond', name: 'Diamond', icon: Diamond },
];

export default function Character() {
  const { state, isLoaded, calculateLevel, addSkill, updateSkill, deleteSkill, addSubSkill, updateSubSkill, deleteSubSkill, updateNaviAvatar } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('character');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [subSkillModalVisible, setSubSkillModalVisible] = useState<boolean>(false);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editingSubSkill, setEditingSubSkill] = useState<{ skillId: string; subSkillId: string } | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    tags: '',
    notes: '',
  });
  const [subSkillFormData, setSubSkillFormData] = useState({
    name: '',
    notes: '',
  });

  const calculateXPForLevel = (level: number): number => {
    return Math.floor(200 * Math.pow(level, 1.25));
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const characterClass = state.user.characterClass;
  const totalXP = state.leaderboard.find(l => l.id === 'me')?.xp || 0;
  const playerLevel = calculateLevel(totalXP);

  if (!characterClass) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.noClassContainer}>
          <Shield size={64} color="#cbd5e1" />
          <Text style={styles.noClassTitle}>No Character Class</Text>
          <Text style={styles.noClassText}>
            Complete the assessment on the Dashboard to discover your character class
          </Text>
        </View>
      </View>
    );
  }

  const archetypeInfo = ARCHETYPE_DATA[characterClass.archetype];
  const currentRankIndex = archetypeInfo.ranks.indexOf(characterClass.rank);
  const nextRank = currentRankIndex < archetypeInfo.ranks.length - 1 
    ? archetypeInfo.ranks[currentRankIndex + 1]
    : null;

  const xpForNextLevel = Math.floor(200 * Math.pow(characterClass.level + 1, 1.25));
  const xpProgress = (characterClass.xp / xpForNextLevel) * 100;

  const classQuests = state.quests.filter(q => q.relatedToClass);
  const completedClassQuests = classQuests.filter(q => q.status === 'completed');
  const activeClassQuests = classQuests.filter(q => q.status === 'active');
  const pendingClassQuests = classQuests.filter(q => q.status === 'pending');

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Shield size={32} color="#6366f1" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Character</Text>
            <Text style={styles.subtitle}>Your progression & skills</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'character' && styles.tabActive]}
            onPress={() => setActiveTab('character')}
          >
            <Text style={[styles.tabText, activeTab === 'character' && styles.tabTextActive]}>
              Class
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'skills' && styles.tabActive]}
            onPress={() => setActiveTab('skills')}
          >
            <Text style={[styles.tabText, activeTab === 'skills' && styles.tabTextActive]}>
              Skills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'navi' && styles.tabActive]}
            onPress={() => setActiveTab('navi')}
          >
            <Text style={[styles.tabText, activeTab === 'navi' && styles.tabTextActive]}>
              Navi
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'character' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.classCard}>
            <View style={styles.classHeader}>
              <View style={styles.classIconContainer}>
                <Sparkle size={32} color="#6366f1" fill="#6366f1" />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.archetypeName}>{characterClass.archetype}</Text>
                <Text style={styles.mbtiType}>{characterClass.mbti}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Lv {characterClass.level}</Text>
              </View>
            </View>

            <Text style={styles.rankLabel}>Current Rank</Text>
            <View style={styles.rankContainer}>
              <Award size={20} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.rankText}>{characterClass.rank}</Text>
            </View>

            {nextRank && (
              <View style={styles.nextRankInfo}>
                <Text style={styles.nextRankLabel}>Next Rank: {nextRank}</Text>
              </View>
            )}

            <Text style={styles.description}>{archetypeInfo.description}</Text>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <Text style={styles.cardTitle}>Class XP Progress</Text>
              <View style={styles.xpBadge}>
                <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.xpValue}>{characterClass.xp}</Text>
              </View>
            </View>
            <View style={styles.xpBarContainer}>
              <View
                style={[
                  styles.xpBar,
                  { width: `${Math.min(xpProgress, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.xpSubtext}>
              {xpForNextLevel - characterClass.xp} XP to level {characterClass.level + 1}
            </Text>
          </View>

          {characterClass.hiddenClass && (
            <View style={styles.hiddenClassCard}>
              <View style={styles.hiddenClassHeader}>
                <View style={styles.hiddenClassIcon}>
                  <Sparkle size={24} color="#a855f7" fill="#a855f7" />
                </View>
                <Text style={styles.hiddenClassTitle}>Hidden Class Unlocked!</Text>
              </View>
              <Text style={styles.hiddenClassName}>{characterClass.hiddenClass}</Text>
              <Text style={styles.hiddenClassDescription}>
                {HIDDEN_CLASSES[characterClass.hiddenClass].description}
              </Text>
              <View style={styles.hiddenClassTraits}>
                {HIDDEN_CLASSES[characterClass.hiddenClass].traits.map((trait, idx) => (
                  <View key={idx} style={styles.hiddenClassTrait}>
                    <Text style={styles.hiddenClassTraitText}>{trait}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.hiddenClassAbility}>
                <Text style={styles.hiddenClassAbilityLabel}>Special Ability:</Text>
                <Text style={styles.hiddenClassAbilityText}>
                  {HIDDEN_CLASSES[characterClass.hiddenClass].specialAbility}
                </Text>
              </View>
            </View>
          )}

          {!characterClass.hiddenClass && (
            <View style={styles.nextHiddenClassCard}>
              <View style={styles.nextHiddenClassHeader}>
                <Text style={styles.nextHiddenClassTitle}>Next Hidden Class</Text>
              </View>
              {(() => {
                const targetLevels: [number, HiddenClass][] = [
                  [10, 'Soul-Linked Warrior'],
                  [20, 'Navi Ascendant'],
                  [30, 'Transcendent Operator'],
                  [40, 'Master of Duality'],
                  [50, 'Eternal Companion'],
                ];
                
                const nextTarget = targetLevels.find(([level]) => characterClass.level < level);
                
                if (!nextTarget) {
                  return (
                    <Text style={styles.nextHiddenClassText}>
                      All hidden classes unlocked!
                    </Text>
                  );
                }
                
                const [targetLevel, targetClass] = nextTarget;
                const completedQuests = state.quests.filter(q => q.status === 'completed').length;
                const naviBondLevel = state.settings.navi.profile.bondLevel;
                const naviInteractionCount = state.settings.navi.profile.interactionCount;
                
                const progress = getHiddenClassProgress(
                  characterClass.level,
                  naviBondLevel,
                  completedQuests,
                  naviInteractionCount,
                  targetClass
                );
                
                return (
                  <View>
                    <Text style={styles.nextHiddenClassName}>{targetClass}</Text>
                    <Text style={styles.nextHiddenClassLevel}>Unlocks at Level {targetLevel}</Text>
                    <View style={styles.hiddenClassRequirements}>
                      <View style={[styles.requirementRow, progress.progress.level.met && styles.requirementMet]}>
                        <CheckCircle size={16} color={progress.progress.level.met ? '#10b981' : '#94a3b8'} />
                        <Text style={[styles.requirementText, progress.progress.level.met && styles.requirementMetText]}>
                          Level {progress.progress.level.current}/{progress.progress.level.required}
                        </Text>
                      </View>
                      <View style={[styles.requirementRow, progress.progress.naviBond.met && styles.requirementMet]}>
                        <CheckCircle size={16} color={progress.progress.naviBond.met ? '#10b981' : '#94a3b8'} />
                        <Text style={[styles.requirementText, progress.progress.naviBond.met && styles.requirementMetText]}>
                          Navi Bond Level {progress.progress.naviBond.current}/{progress.progress.naviBond.required}
                        </Text>
                      </View>
                      <View style={[styles.requirementRow, progress.progress.quests.met && styles.requirementMet]}>
                        <CheckCircle size={16} color={progress.progress.quests.met ? '#10b981' : '#94a3b8'} />
                        <Text style={[styles.requirementText, progress.progress.quests.met && styles.requirementMetText]}>
                          Complete {progress.progress.quests.current}/{progress.progress.quests.required} Quests
                        </Text>
                      </View>
                      <View style={[styles.requirementRow, progress.progress.interactions.met && styles.requirementMet]}>
                        <CheckCircle size={16} color={progress.progress.interactions.met ? '#10b981' : '#94a3b8'} />
                        <Text style={[styles.requirementText, progress.progress.interactions.met && styles.requirementMetText]}>
                          {progress.progress.interactions.current}/{progress.progress.interactions.required} Navi Interactions
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Overall Stats</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Player Level:</Text>
              <Text style={styles.statValue}>{playerLevel}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total XP:</Text>
              <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Class Quests Completed:</Text>
              <Text style={styles.statValue}>{completedClassQuests.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Class Quests:</Text>
              <Text style={styles.statValue}>{activeClassQuests.length}</Text>
            </View>
          </View>

          <View style={styles.traitsSection}>
            <View style={styles.traitCard}>
              <View style={styles.traitHeader}>
                <TrendingUp size={20} color="#10b981" />
                <Text style={styles.traitTitle}>Strengths</Text>
              </View>
              {characterClass.strengths.map((strength, index) => (
                <View key={`strength-${index}-${strength.substring(0, 20).replace(/\s/g, '-')}`} style={styles.traitItem}>
                  <View style={styles.traitDot} />
                  <Text style={styles.traitText}>{strength}</Text>
                </View>
              ))}
            </View>

            <View style={styles.traitCard}>
              <View style={styles.traitHeader}>
                <Target size={20} color="#f59e0b" />
                <Text style={styles.traitTitle}>Growth Areas</Text>
              </View>
              {characterClass.growthAreas.map((area, index) => (
                <View key={`growth-${index}-${area.substring(0, 20).replace(/\s/g, '-')}`} style={styles.traitItem}>
                  <View style={[styles.traitDot, styles.traitDotGrowth]} />
                  <Text style={styles.traitText}>{area}</Text>
                </View>
              ))}
            </View>

            <View style={styles.traitCard}>
              <View style={styles.traitHeader}>
                <Sparkle size={20} color="#6366f1" fill="#6366f1" />
                <Text style={styles.traitTitle}>Traits</Text>
              </View>
              <View style={styles.traitsGrid}>
                {characterClass.traits.map((trait, index) => (
                  <View key={`trait-${index}-${trait.substring(0, 20).replace(/\s/g, '-')}`} style={styles.traitChip}>
                    <Text style={styles.traitChipText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.classQuestsCard}>
            <View style={styles.classQuestsHeader}>
              <Text style={styles.cardTitle}>Class Quests</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/quests')}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.classQuestsSubtitle}>
              Complete class quests to earn XP and advance your character
            </Text>

            {classQuests.length === 0 ? (
              <View style={styles.emptyClassQuests}>
                <Target size={40} color="#cbd5e1" />
                <Text style={styles.emptyClassQuestsText}>
                  No class quests yet. Create class quests in the Quests tab!
                </Text>
              </View>
            ) : (
              <View style={styles.classQuestsList}>
                {pendingClassQuests.length > 0 && (
                  <View style={styles.classQuestsSection}>
                    <Text style={styles.classQuestsSectionTitle}>
                      ⏳ Pending ({pendingClassQuests.length})
                    </Text>
                    {pendingClassQuests.slice(0, 3).map((quest) => {
                      const completedMilestones = quest.milestones.filter((m) => m.completed).length;
                      return (
                        <View key={quest.id} style={styles.classQuestItem}>
                          <View style={styles.classQuestInfo}>
                            <Text style={styles.classQuestTitle}>{quest.title}</Text>
                            <Text style={styles.classQuestProgress}>
                              {completedMilestones}/{quest.milestones.length} milestones
                            </Text>
                          </View>
                          <View style={styles.classQuestXP}>
                            <Zap size={12} color="#f59e0b" fill="#f59e0b" />
                            <Text style={styles.classQuestXPText}>+{quest.xpReward}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {activeClassQuests.length > 0 && (
                  <View style={styles.classQuestsSection}>
                    <Text style={styles.classQuestsSectionTitle}>
                      ⚔️ Active ({activeClassQuests.length})
                    </Text>
                    {activeClassQuests.slice(0, 3).map((quest) => {
                      const completedMilestones = quest.milestones.filter((m) => m.completed).length;
                      return (
                        <View key={quest.id} style={styles.classQuestItem}>
                          <View style={styles.classQuestInfo}>
                            <Text style={styles.classQuestTitle}>{quest.title}</Text>
                            <Text style={styles.classQuestProgress}>
                              {completedMilestones}/{quest.milestones.length} milestones
                            </Text>
                          </View>
                          <View style={styles.classQuestXP}>
                            <Zap size={12} color="#f59e0b" fill="#f59e0b" />
                            <Text style={styles.classQuestXPText}>+{quest.xpReward}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {completedClassQuests.length > 0 && (
                  <View style={styles.classQuestsSection}>
                    <Text style={styles.classQuestsSectionTitle}>
                      ✅ Completed ({completedClassQuests.length})
                    </Text>
                    {completedClassQuests.slice(0, 3).map((quest) => (
                      <View key={quest.id} style={styles.classQuestItemCompleted}>
                        <CheckCircle size={16} color="#10b981" />
                        <View style={styles.classQuestInfo}>
                          <Text style={styles.classQuestTitleCompleted}>{quest.title}</Text>
                        </View>
                        <View style={styles.classQuestXP}>
                          <Zap size={12} color="#10b981" fill="#10b981" />
                          <Text style={styles.classQuestXPTextCompleted}>+{quest.xpReward}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.ranksCard}>
            <Text style={styles.cardTitle}>Rank Progression</Text>
            <Text style={styles.ranksSubtitle}>
              Complete class quests to advance through the ranks
            </Text>
            <View style={styles.ranksList}>
              {archetypeInfo.ranks.map((rank, index) => {
                const isUnlocked = index <= currentRankIndex;
                const isCurrent = index === currentRankIndex;
                return (
                  <View key={`rank-${index}-${rank.replace(/\s/g, '-')}`} style={styles.rankRow}>
                    <View
                      style={[
                        styles.rankIndicator,
                        isUnlocked && styles.rankIndicatorUnlocked,
                        isCurrent && styles.rankIndicatorCurrent,
                      ]}
                    >
                      {isUnlocked ? (
                        <Award
                          size={16}
                          color={isCurrent ? '#f59e0b' : '#10b981'}
                          fill={isCurrent ? '#f59e0b' : '#10b981'}
                        />
                      ) : (
                        <Shield size={16} color="#cbd5e1" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.rankName,
                        isUnlocked && styles.rankNameUnlocked,
                        isCurrent && styles.rankNameCurrent,
                      ]}
                    >
                      {rank}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          </ScrollView>
        ) : activeTab === 'skills' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.skillsTabHeader}>
              <Text style={styles.skillsTabTitle}>Track and level up your skills</Text>
              <TouchableOpacity
                style={styles.addSkillButton}
                onPress={() => {
                  setEditingSkill(null);
                  setFormData({ name: '', tags: '', notes: '' });
                  setModalVisible(true);
                }}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {state.skills.length === 0 ? (
              <View style={styles.emptySkillsState}>
                <TrendingUp size={40} color="#cbd5e1" />
                <Text style={styles.emptySkillsText}>
                  No skills tracked yet. Tap + to add your first skill!
                </Text>
              </View>
            ) : (
              <View style={styles.skillsList}>
                {state.skills.map((skill) => {
                  const currentLevelXP = calculateXPForLevel(skill.level);
                  const nextLevelXP = calculateXPForLevel(skill.level + 1);
                  const progressToNext = skill.xp - currentLevelXP;
                  const xpNeeded = nextLevelXP - currentLevelXP;
                  const progressPercent = (progressToNext / xpNeeded) * 100;
                  const isExpanded = expandedSkills.has(skill.id);
                  const hasSubSkills = skill.subSkills && skill.subSkills.length > 0;

                  return (
                    <View key={skill.id} style={styles.skillCard}>
                      <TouchableOpacity
                        onPress={() => {
                          if (hasSubSkills) {
                            const newExpanded = new Set(expandedSkills);
                            if (isExpanded) {
                              newExpanded.delete(skill.id);
                            } else {
                              newExpanded.add(skill.id);
                            }
                            setExpandedSkills(newExpanded);
                          }
                        }}
                        activeOpacity={hasSubSkills ? 0.7 : 1}
                      >
                        <View style={styles.skillCardHeader}>
                          <View style={styles.skillCardIcon}>
                            <TrendingUp size={20} color="#6366f1" strokeWidth={2} />
                          </View>
                          <View style={styles.skillCardInfo}>
                            <Text style={styles.skillCardName}>{skill.name}</Text>
                            <View style={styles.skillCardTags}>
                              {skill.tags.slice(0, 2).map((tag, tagIndex) => (
                                <View key={`${skill.id}-tag-${tagIndex}`} style={styles.skillTag}>
                                  <Text style={styles.skillTagText}>{tag}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          <View style={styles.skillCardRight}>
                            <View style={styles.skillLevelBadge}>
                              <Text style={styles.skillLevelNumber}>{skill.level}</Text>
                            </View>
                            {hasSubSkills && (
                              <View style={styles.skillExpandIcon}>
                                {isExpanded ? (
                                  <ChevronUp size={16} color="#64748b" />
                                ) : (
                                  <ChevronDown size={16} color="#64748b" />
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.skillCardActions}>
                        <TouchableOpacity
                          style={styles.skillCardActionButton}
                          onPress={() => {
                            setEditingSkill(skill.id);
                            setFormData({
                              name: skill.name,
                              tags: skill.tags.join(', '),
                              notes: skill.notes,
                            });
                            setModalVisible(true);
                          }}
                        >
                          <Edit2 size={14} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.skillCardActionButton}
                          onPress={() => {
                            Alert.alert(
                              'Delete Skill',
                              `Are you sure you want to delete ${skill.name}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: () => deleteSkill(skill.id),
                                },
                              ]
                            );
                          }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.skillCardActionButton, styles.addSubSkillActionButton]}
                          onPress={() => {
                            setSelectedSkillId(skill.id);
                            setEditingSubSkill(null);
                            setSubSkillFormData({ name: '', notes: '' });
                            setSubSkillModalVisible(true);
                          }}
                        >
                          <Plus size={14} color="#6366f1" />
                        </TouchableOpacity>
                      </View>

                      {skill.notes && (
                        <Text style={styles.skillCardNotes}>{skill.notes}</Text>
                      )}

                      <View style={styles.skillCardXP}>
                        <View style={styles.skillCardXPInfo}>
                          <Text style={styles.skillCardXPText}>
                            {progressToNext.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                          </Text>
                          <Text style={styles.skillCardTotalXP}>Total: {skill.xp.toLocaleString()}</Text>
                        </View>
                        <View style={styles.skillCardXPBar}>
                          <View
                            style={[
                              styles.skillCardXPBarFill,
                              { width: `${Math.min(progressPercent, 100)}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {isExpanded && hasSubSkills && (
                        <View style={styles.subSkillsContainer}>
                          <Text style={styles.subSkillsTitle}>Sub-Skills</Text>
                          {(skill.subSkills || []).map((subSkill) => {
                            const subCurrentLevelXP = calculateXPForLevel(subSkill.level);
                            const subNextLevelXP = calculateXPForLevel(subSkill.level + 1);
                            const subProgressToNext = subSkill.xp - subCurrentLevelXP;
                            const subXPNeeded = subNextLevelXP - subCurrentLevelXP;
                            const subProgressPercent = (subProgressToNext / subXPNeeded) * 100;

                            return (
                              <View key={subSkill.id} style={styles.subSkillCard}>
                                <View style={styles.subSkillHeader}>
                                  <Text style={styles.subSkillName}>{subSkill.name}</Text>
                                  <View style={styles.subSkillActions}>
                                    <TouchableOpacity
                                      style={styles.subSkillActionButton}
                                      onPress={() => {
                                        setSelectedSkillId(skill.id);
                                        setEditingSubSkill({ skillId: skill.id, subSkillId: subSkill.id });
                                        setSubSkillFormData({
                                          name: subSkill.name,
                                          notes: subSkill.notes,
                                        });
                                        setSubSkillModalVisible(true);
                                      }}
                                    >
                                      <Edit2 size={12} color="#64748b" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.subSkillActionButton}
                                      onPress={() => {
                                        Alert.alert(
                                          'Delete Sub-Skill',
                                          `Are you sure you want to delete ${subSkill.name}?`,
                                          [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                              text: 'Delete',
                                              style: 'destructive',
                                              onPress: () => deleteSubSkill(skill.id, subSkill.id),
                                            },
                                          ]
                                        );
                                      }}
                                    >
                                      <Trash2 size={12} color="#ef4444" />
                                    </TouchableOpacity>
                                    <View style={styles.subSkillLevel}>
                                      <Text style={styles.subSkillLevelText}>Lv{subSkill.level}</Text>
                                    </View>
                                  </View>
                                </View>
                                {subSkill.notes && (
                                  <Text style={styles.subSkillNotes}>{subSkill.notes}</Text>
                                )}
                                <View style={styles.subSkillXpSection}>
                                  <Text style={styles.subSkillXpText}>
                                    {subProgressToNext.toLocaleString()} / {subXPNeeded.toLocaleString()} XP
                                  </Text>
                                  <View style={styles.subSkillXpBar}>
                                    <View
                                      style={[
                                        styles.subSkillXpBarFill,
                                        { width: `${Math.min(subProgressPercent, 100)}%` },
                                      ]}
                                    />
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        ) : activeTab === 'navi' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.naviPreviewCard}>
              <Text style={styles.naviPreviewTitle}>Avatar Preview</Text>
              <View style={styles.naviPreviewContainer}>
                <NaviAvatar
                  primaryColor={state.settings.navi.profile.avatar.primaryColor}
                  secondaryColor={state.settings.navi.profile.avatar.secondaryColor}
                  backgroundColor={state.settings.navi.profile.avatar.backgroundColor}
                  style={state.settings.navi.profile.avatar.style}
                  shape={state.settings.navi.profile.avatar.shape}
                  glowEnabled={state.settings.navi.profile.avatar.glowEnabled}
                  size={140}
                />
              </View>
              <Text style={styles.naviNameText}>{state.settings.navi.profile.name}</Text>
              <Text style={styles.naviStyleText}>
                {AVATAR_STYLES.find(s => s.id === state.settings.navi.profile.avatar.style)?.name || 'Classic'} • 
                Level {state.settings.navi.profile.level}
              </Text>
            </View>

            <View style={styles.naviSectionCard}>
              <View style={styles.naviSectionHeader}>
                <User size={20} color="#6366f1" />
                <Text style={styles.naviSectionTitle}>Avatar Style</Text>
              </View>
              <Text style={styles.naviSectionSubtitle}>Choose your Navi appearance</Text>
              
              {['Basic', 'Humanoid', 'Machine', 'Beast', 'Mythical', 'Elemental', 'Alien', 'Creature'].map((category) => {
                const stylesInCategory = AVATAR_STYLES.filter(s => s.category === category);
                if (stylesInCategory.length === 0) return null;
                
                return (
                  <View key={category} style={styles.styleCategoryContainer}>
                    <Text style={styles.styleCategoryTitle}>{category}</Text>
                    <View style={styles.styleGrid}>
                      {stylesInCategory.map((style) => (
                        <TouchableOpacity
                          key={style.id}
                          style={[
                            styles.styleOption,
                            state.settings.navi.profile.avatar.style === style.id && styles.styleOptionSelected,
                          ]}
                          onPress={() => updateNaviAvatar({ style: style.id })}
                        >
                          <View style={styles.styleOptionPreview}>
                            <NaviAvatar
                              primaryColor={state.settings.navi.profile.avatar.primaryColor}
                              secondaryColor={state.settings.navi.profile.avatar.secondaryColor}
                              backgroundColor={state.settings.navi.profile.avatar.backgroundColor}
                              style={style.id}
                              shape={state.settings.navi.profile.avatar.shape}
                              glowEnabled={false}
                              size={48}
                            />
                          </View>
                          <Text style={[
                            styles.styleOptionText,
                            state.settings.navi.profile.avatar.style === style.id && styles.styleOptionTextSelected,
                          ]}>
                            {style.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.naviSectionCard}>
              <View style={styles.naviSectionHeader}>
                <Palette size={20} color="#6366f1" />
                <Text style={styles.naviSectionTitle}>Color Theme</Text>
              </View>
              <Text style={styles.naviSectionSubtitle}>Select a color scheme for your Navi</Text>
              
              <View style={styles.colorGrid}>
                {COLOR_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.name}
                    style={[
                      styles.colorOption,
                      state.settings.navi.profile.avatar.primaryColor === preset.primary && styles.colorOptionSelected,
                    ]}
                    onPress={() => updateNaviAvatar({
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary,
                      backgroundColor: preset.bg,
                    })}
                  >
                    <View style={styles.colorSwatchContainer}>
                      <View style={[styles.colorSwatchBg, { backgroundColor: preset.bg }]} />
                      <View style={[styles.colorSwatchPrimary, { backgroundColor: preset.primary }]} />
                      <View style={[styles.colorSwatchSecondary, { backgroundColor: preset.secondary }]} />
                    </View>
                    <Text style={[
                      styles.colorOptionText,
                      state.settings.navi.profile.avatar.primaryColor === preset.primary && styles.colorOptionTextSelected,
                    ]}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.naviSectionCard}>
              <View style={styles.naviSectionHeader}>
                <Hexagon size={20} color="#6366f1" />
                <Text style={styles.naviSectionTitle}>Frame Shape</Text>
              </View>
              <Text style={styles.naviSectionSubtitle}>Choose the avatar frame shape</Text>
              
              <View style={styles.shapeGrid}>
                {SHAPE_OPTIONS.map((shape) => {
                  const IconComponent = shape.icon;
                  return (
                    <TouchableOpacity
                      key={shape.id}
                      style={[
                        styles.shapeOption,
                        state.settings.navi.profile.avatar.shape === shape.id && styles.shapeOptionSelected,
                      ]}
                      onPress={() => updateNaviAvatar({ shape: shape.id })}
                    >
                      <IconComponent 
                        size={28} 
                        color={state.settings.navi.profile.avatar.shape === shape.id ? '#6366f1' : '#64748b'} 
                      />
                      <Text style={[
                        styles.shapeOptionText,
                        state.settings.navi.profile.avatar.shape === shape.id && styles.shapeOptionTextSelected,
                      ]}>
                        {shape.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.naviSectionCard}>
              <View style={styles.naviSectionHeader}>
                <Sun size={20} color="#6366f1" />
                <Text style={styles.naviSectionTitle}>Effects</Text>
              </View>
              
              <View style={styles.effectRow}>
                <View style={styles.effectInfo}>
                  <Text style={styles.effectLabel}>Glow Effect</Text>
                  <Text style={styles.effectDescription}>Add a subtle glow around your Navi</Text>
                </View>
                <Switch
                  value={state.settings.navi.profile.avatar.glowEnabled}
                  onValueChange={(value) => updateNaviAvatar({ glowEnabled: value })}
                  trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
                  thumbColor={state.settings.navi.profile.avatar.glowEnabled ? '#6366f1' : '#94a3b8'}
                />
              </View>
            </View>

            <View style={styles.naviStatsCard}>
              <Text style={styles.naviStatsTitle}>Navi Stats</Text>
              <View style={styles.naviStatRow}>
                <Text style={styles.naviStatLabel}>Bond Level</Text>
                <Text style={styles.naviStatValue}>{state.settings.navi.profile.bondLevel}</Text>
              </View>
              <View style={styles.naviStatRow}>
                <Text style={styles.naviStatLabel}>Bond Title</Text>
                <Text style={styles.naviStatValue}>{state.settings.navi.profile.bondTitle}</Text>
              </View>
              <View style={styles.naviStatRow}>
                <Text style={styles.naviStatLabel}>Interactions</Text>
                <Text style={styles.naviStatValue}>{state.settings.navi.profile.interactionCount}</Text>
              </View>
              <View style={styles.naviStatRow}>
                <Text style={styles.naviStatLabel}>Personality</Text>
                <Text style={styles.naviStatValue}>{state.settings.navi.profile.personalityPreset}</Text>
              </View>
            </View>
          </ScrollView>
        ) : null}

        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <X size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Skill Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Public Speaking"
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Tags (comma-separated)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., communication, career"
                    placeholderTextColor="#94a3b8"
                    value={formData.tags}
                    onChangeText={(text) => setFormData({ ...formData, tags: text })}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add your notes..."
                    placeholderTextColor="#94a3b8"
                    value={formData.notes}
                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, !formData.name.trim() && styles.saveButtonDisabled]}
                  onPress={() => {
                    if (!formData.name.trim()) return;
                    
                    const tags = formData.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0);

                    if (editingSkill) {
                      updateSkill(editingSkill, {
                        name: formData.name.trim(),
                        tags,
                        notes: formData.notes.trim(),
                      });
                    } else {
                      addSkill({
                        name: formData.name.trim(),
                        level: 1,
                        xp: 0,
                        tags,
                        notes: formData.notes.trim(),
                        subSkills: [],
                      });
                    }
                    setModalVisible(false);
                    setFormData({ name: '', tags: '', notes: '' });
                  }}
                  disabled={!formData.name.trim()}
                >
                  <Text style={styles.saveButtonText}>
                    {editingSkill ? 'Update Skill' : 'Add Skill'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={subSkillModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setSubSkillModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingSubSkill ? 'Edit Sub-Skill' : 'Add Sub-Skill'}
                  </Text>
                  <TouchableOpacity onPress={() => setSubSkillModalVisible(false)}>
                    <X size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Sub-Skill Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Storytelling"
                    placeholderTextColor="#94a3b8"
                    value={subSkillFormData.name}
                    onChangeText={(text) => setSubSkillFormData({ ...subSkillFormData, name: text })}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add your notes..."
                    placeholderTextColor="#94a3b8"
                    value={subSkillFormData.notes}
                    onChangeText={(text) => setSubSkillFormData({ ...subSkillFormData, notes: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, !subSkillFormData.name.trim() && styles.saveButtonDisabled]}
                  onPress={() => {
                    if (!subSkillFormData.name.trim() || !selectedSkillId) return;

                    if (editingSubSkill) {
                      updateSubSkill(editingSubSkill.skillId, editingSubSkill.subSkillId, {
                        name: subSkillFormData.name.trim(),
                        notes: subSkillFormData.notes.trim(),
                      });
                    } else {
                      addSubSkill(selectedSkillId, {
                        name: subSkillFormData.name.trim(),
                        level: 1,
                        xp: 0,
                        notes: subSkillFormData.notes.trim(),
                      });
                    }
                    setSubSkillModalVisible(false);
                    setSubSkillFormData({ name: '', notes: '' });
                    setEditingSubSkill(null);
                    setSelectedSkillId(null);
                  }}
                  disabled={!subSkillFormData.name.trim()}
                >
                  <Text style={styles.saveButtonText}>
                    {editingSubSkill ? 'Update Sub-Skill' : 'Add Sub-Skill'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  noClassContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noClassTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 8,
  },
  noClassText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  classIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  archetypeName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  mbtiType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  rankLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rankText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  nextRankInfo: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  nextRankLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  xpCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  xpBarContainer: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  xpSubtext: {
    fontSize: 13,
    color: '#64748b',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  traitsSection: {
    gap: 16,
    marginBottom: 16,
  },
  traitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
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
  traitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  traitTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  traitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  traitDotGrowth: {
    backgroundColor: '#f59e0b',
  },
  traitText: {
    fontSize: 15,
    color: '#0f172a',
    flex: 1,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitChip: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  traitChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  ranksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ranksSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
  },
  ranksList: {
    gap: 12,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankIndicatorUnlocked: {
    backgroundColor: '#dcfce7',
  },
  rankIndicatorCurrent: {
    backgroundColor: '#fef3c7',
  },
  rankName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#94a3b8',
  },
  rankNameUnlocked: {
    color: '#0f172a',
  },
  rankNameCurrent: {
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  currentBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  classQuestsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  classQuestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllButton: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  classQuestsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyClassQuests: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyClassQuestsText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
  },
  classQuestsList: {
    gap: 16,
  },
  classQuestsSection: {
    gap: 8,
  },
  classQuestsSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  classQuestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  classQuestItemCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 10,
  },
  classQuestInfo: {
    flex: 1,
  },
  classQuestTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  classQuestTitleCompleted: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#166534',
  },
  classQuestProgress: {
    fontSize: 12,
    color: '#64748b',
  },
  classQuestXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classQuestXPText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  classQuestXPTextCompleted: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  skillsOverviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  skillsOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptySkillsState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptySkillsText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
  },
  topSkillsSection: {
    marginBottom: 16,
  },
  topSkillsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  improvementSkillsSection: {
    marginTop: 8,
  },
  improvementSkillsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  skillOverviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  skillOverviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  improvementSkillIcon: {
    backgroundColor: '#fef3c7',
  },
  skillOverviewInfo: {
    flex: 1,
  },
  skillOverviewName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  skillOverviewStats: {
    fontSize: 13,
    color: '#64748b',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  skillsTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skillsTabTitle: {
    fontSize: 16,
    color: '#64748b',
    flex: 1,
  },
  addSkillButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsList: {
    gap: 16,
  },
  skillCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  skillCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  skillCardInfo: {
    flex: 1,
  },
  skillCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  skillCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  skillTagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  skillCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skillLevelBadge: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillLevelNumber: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  skillExpandIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillCardActions: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  skillCardActionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addSubSkillActionButton: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  skillCardNotes: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 18,
  },
  skillCardXP: {
    marginTop: 6,
  },
  skillCardXPInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  skillCardXPText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  skillCardTotalXP: {
    fontSize: 11,
    color: '#94a3b8',
  },
  skillCardXPBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  skillCardXPBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  subSkillsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  subSkillsTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 10,
  },
  subSkillCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  subSkillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subSkillName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    flex: 1,
  },
  subSkillActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subSkillActionButton: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subSkillLevel: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 2,
  },
  subSkillLevelText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#6366f1',
  },
  subSkillNotes: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 16,
  },
  subSkillXpSection: {
    marginTop: 2,
  },
  subSkillXpText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 4,
  },
  subSkillXpBar: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  subSkillXpBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  hiddenClassCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9d5ff',
    ...Platform.select({
      ios: {
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  hiddenClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  hiddenClassIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenClassTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#7c3aed',
  },
  hiddenClassName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#581c87',
    marginBottom: 8,
  },
  hiddenClassDescription: {
    fontSize: 15,
    color: '#6b21a8',
    lineHeight: 22,
    marginBottom: 16,
  },
  hiddenClassTraits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  hiddenClassTrait: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  hiddenClassTraitText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#7c3aed',
  },
  hiddenClassAbility: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  hiddenClassAbilityLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#7c3aed',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  hiddenClassAbilityText: {
    fontSize: 14,
    color: '#581c87',
    lineHeight: 20,
  },
  nextHiddenClassCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  nextHiddenClassHeader: {
    marginBottom: 16,
  },
  nextHiddenClassTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  nextHiddenClassName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#6366f1',
    marginBottom: 6,
  },
  nextHiddenClassLevel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  nextHiddenClassText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  hiddenClassRequirements: {
    gap: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  requirementMet: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  requirementText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  requirementMetText: {
    color: '#166534',
    fontWeight: '600' as const,
  },
  naviPreviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  naviPreviewTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  naviPreviewContainer: {
    marginBottom: 16,
  },
  naviNameText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  naviStyleText: {
    fontSize: 14,
    color: '#64748b',
  },
  naviSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  naviSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  naviSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  naviSectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  styleCategoryContainer: {
    marginBottom: 16,
  },
  styleCategoryTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleOption: {
    width: 72,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f8fafc',
  },
  styleOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  styleOptionPreview: {
    marginBottom: 6,
  },
  styleOptionText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#64748b',
    textAlign: 'center',
  },
  styleOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 72,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f8fafc',
  },
  colorOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  colorSwatchContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  colorSwatchBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  colorSwatchPrimary: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    left: 0,
  },
  colorSwatchSecondary: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    right: 0,
  },
  colorOptionText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#64748b',
    textAlign: 'center',
  },
  colorOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  shapeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  shapeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f8fafc',
  },
  shapeOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  shapeOptionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
    marginTop: 8,
  },
  shapeOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  effectInfo: {
    flex: 1,
  },
  effectLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  effectDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  naviStatsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  naviStatsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  naviStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  naviStatLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  naviStatValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
});
