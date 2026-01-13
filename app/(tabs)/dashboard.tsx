import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, CheckCircle, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';

import { useApp } from '@/contexts/AppContext';
import { MBTI_QUESTIONS, MBTI_TO_ARCHETYPE } from '@/constants/archetypes';
import type { MBTIType } from '@/types';

export default function Dashboard() {
  const { state, isLoaded, calculateLevel, setCharacterClass } = useApp();

  const insets = useSafeAreaInsets();

  const [assessmentVisible, setAssessmentVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isLoaded && !state.user.hasCompletedAssessment) {
      setAssessmentVisible(true);
    }
  }, [isLoaded, state.user.hasCompletedAssessment]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const currentXP = state.leaderboard[0]?.xp || 0;
  const currentLevel = calculateLevel(currentXP);
  const activeQuests = (state.quests || []).filter((q) => q.status === 'active').slice(0, 3);
  const completedQuests = (state.quests || []).filter((q) => q.status === 'completed');



  const handleAnswerQuestion = (dimension: string) => {
    const newAnswers = { ...answers, [MBTI_QUESTIONS[currentQuestion].id]: dimension };
    setAnswers(newAnswers);

    if (currentQuestion < MBTI_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const mbti = calculateMBTI(newAnswers);
      setCharacterClass(mbti);
      setAssessmentVisible(false);
      Alert.alert(
        'Character Class Unlocked!',
        `You are a ${MBTI_TO_ARCHETYPE[mbti]}! Check your stats and start your journey.`,
        [{ text: 'Begin', style: 'default' }]
      );
    }
  };

  const calculateMBTI = (answersMap: Record<string, string>): MBTIType => {
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.values(answersMap).forEach((dim) => {
      counts[dim as keyof typeof counts]++;
    });

    const e_i = counts.E >= counts.I ? 'E' : 'I';
    const s_n = counts.S >= counts.N ? 'S' : 'N';
    const t_f = counts.T >= counts.F ? 'T' : 'F';
    const j_p = counts.J >= counts.P ? 'J' : 'P';

    return `${e_i}${s_n}${t_f}${j_p}` as MBTIType;
  };

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back, Player</Text>
              <Text style={styles.playerSubtext}>Ready to level up?</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl {currentLevel}</Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>Total XP</Text>
              <Text style={styles.xpValue}>{currentXP.toLocaleString()}</Text>
            </View>
            <View style={styles.xpBarContainer}>
              <View
                style={[
                  styles.xpBar,
                  {
                    width: `${Math.min(
                      ((currentXP % 1000) / 1000) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.xpSubtext}>
              {1000 - (currentXP % 1000)} XP to next level
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Quests</Text>
            {activeQuests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No active quests</Text>
              </View>
            ) : (
              activeQuests.map((quest) => {
                const completedMilestones = quest.milestones.filter(m => m.completed).length;
                const totalMilestones = quest.milestones.length;
                return (
                  <View key={`dashboard-quest-${quest.id}`} style={styles.questCard}>
                    <View style={styles.questHeader}>
                      <Target size={18} color="#6366f1" />
                      <Text style={styles.questTitle}>{quest.title}</Text>
                      {quest.relatedToClass && (
                        <View style={styles.classQuestBadge}>
                          <Text style={styles.classQuestText}>Class</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.questProgress}>
                      <View style={styles.questProgressBar}>
                        <View
                          style={[
                            styles.questProgressFill,
                            { width: `${(completedMilestones / totalMilestones) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.questProgressText}>
                        {completedMilestones}/{totalMilestones}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>



          {completedQuests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Recently Completed</Text>
                <TouchableOpacity onPress={() => router.push('/quests')}>
                  <Text style={styles.sectionLink}>View All</Text>
                </TouchableOpacity>
              </View>
              {completedQuests.slice(0, 5).map((quest) => (
                <View key={`completed-quest-${quest.id}`} style={styles.completedCard}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text style={styles.completedText}>{quest.title}</Text>
                  <Text style={styles.completedXP}>+{quest.xpReward} XP</Text>
                </View>
              ))}
            </View>
          )}


        </ScrollView>



        <Modal
          visible={assessmentVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {}}
        >
          <View style={[styles.assessmentContainer, { paddingTop: insets.top }]}>
            <View style={styles.assessmentHeader}>
              {currentQuestion > 0 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  <ChevronLeft size={20} color="#6366f1" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.assessmentTitle}>Discover Your Character Class</Text>
              <Text style={styles.assessmentSubtitle}>
                Answer these questions to unlock your archetype and begin your journey
              </Text>
              <View style={styles.assessmentProgressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentQuestion + 1) / MBTI_QUESTIONS.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.assessmentProgressText}>
                Question {currentQuestion + 1} of {MBTI_QUESTIONS.length}
              </Text>
            </View>

            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                {MBTI_QUESTIONS[currentQuestion].question}
              </Text>
              <View style={styles.optionsContainer}>
                {MBTI_QUESTIONS[currentQuestion].options.map((option, optionIdx) => (
                  <TouchableOpacity
                    key={`option-${currentQuestion}-${optionIdx}`}
                    style={styles.optionButton}
                    onPress={() => handleAnswerQuestion(option.dimension)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{option.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  playerSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  xpCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  xpLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  xpValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#6366f1',
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  xpSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#475569',
    textTransform: 'uppercase' as const,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    minWidth: 35,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
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
  taskMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  taskDue: {
    fontSize: 12,
    color: '#94a3b8',
  },
  xpBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  habitCardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
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
  habitCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#0f172a',
    marginLeft: 12,
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#f59e0b',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
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
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  goalPicker: {
    maxHeight: 120,
  },
  goalOption: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  goalOptionSelected: {
    backgroundColor: '#6366f1',
  },
  goalOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#475569',
  },
  goalOptionTextSelected: {
    color: '#ffffff',
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    padding: 14,
  },
  cadencePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  cadenceOption: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cadenceOptionSelected: {
    backgroundColor: '#6366f1',
  },
  cadenceOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#475569',
  },
  cadenceOptionTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  assessmentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  assessmentHeader: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  assessmentTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  assessmentSubtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 20,
  },
  assessmentProgressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  assessmentProgressText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  questionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#0f172a',
    lineHeight: 32,
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 24,
  },
  questCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
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
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    flex: 1,
  },
  classQuestBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classQuestText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  questProgressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  completedToggle: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  completedToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  completedCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  completedXP: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  completedCategory: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6366f1',
    textTransform: 'uppercase' as const,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
});
