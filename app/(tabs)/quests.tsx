import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ActionSheetIOS,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, Sparkle, CheckCircle, XCircle, Zap, Edit2, Trash2, Check, Plus, X, ChevronDown, Copy } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { copyToClipboard } from '@/lib/clipboard';
import { QUEST_DIFFICULTIES, QUEST_DIFFICULTY_LABELS, QUEST_DIFFICULTY_DESCRIPTIONS, QUEST_XP_VALUES, QuestDifficulty } from '@/constants/questCategories';

export default function Quests() {
  const { state, isLoaded, completeQuest, toggleQuestMilestone, updateQuest, acceptQuest, declineQuest, addQuest, deleteQuest } = useApp();
  const insets = useSafeAreaInsets();
  
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editingQuest, setEditingQuest] = useState<string | null>(null);
  const [questForm, setQuestForm] = useState({ 
    title: '', 
    description: '',
    milestones: [] as { id: string; description: string; completed: boolean }[],
  });
  const [newQuestForm, setNewQuestForm] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly' | 'long-term' | 'storyline' | 'one-time',
    category: 'health' as 'health' | 'learning' | 'work' | 'finance' | 'relationship' | 'other',
    difficulty: 'standard' as QuestDifficulty,
    relatedToClass: false,
    milestones: ['', '', ''],
    associatedSkills: [] as string[],
  });
  const [selectionMode, setSelectionMode] = useState<'none' | 'skills' | 'difficulty'>('none');

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const pendingQuests = state.quests.filter(q => q.status === 'pending');
  const activeQuests = state.quests.filter(q => q.status === 'active');
  const completedQuests = state.quests.filter(q => q.status === 'completed');

  const handleEditQuest = (questId: string) => {
    const quest = state.quests.find(q => q.id === questId);
    if (quest) {
      setQuestForm({ 
        title: quest.title, 
        description: quest.description,
        milestones: quest.milestones.map(m => ({ ...m })),
      });
      setEditingQuest(questId);
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = () => {
    if (!editingQuest) return;
    const validMilestones = questForm.milestones.filter(m => m.description.trim());
    updateQuest(editingQuest, {
      title: questForm.title,
      description: questForm.description,
      milestones: validMilestones,
    });
    setEditModalVisible(false);
    setEditingQuest(null);
  };

  const handleAddMilestone = () => {
    setQuestForm(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { id: `m-${Date.now()}-${prev.milestones.length}`, description: '', completed: false },
      ],
    }));
  };

  const handleUpdateMilestone = (index: number, description: string) => {
    setQuestForm(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => 
        i === index ? { ...m, description } : m
      ),
    }));
  };

  const handleRemoveMilestone = (index: number) => {
    setQuestForm(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const handleCompleteQuest = (questId: string) => {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest) return;

    const allMilestonesComplete = quest.milestones.every(m => m.completed);
    if (!allMilestonesComplete) {
      Alert.alert(
        'Quest Incomplete',
        'You must complete all milestones before completing this quest.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Complete Quest',
      `Complete "${quest.title}" and earn ${quest.xpReward} XP?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: () => {
            completeQuest(questId);
            Alert.alert('Quest Completed!', `You earned ${quest.xpReward} XP!`);
          },
        },
      ]
    );
  };

  const renderQuest = (quest: typeof state.quests[0], status: 'pending' | 'active' | 'completed') => {
    const allMilestonesComplete = quest.milestones.every(m => m.completed);
    const completedMilestones = quest.milestones.filter(m => m.completed).length;

    return (
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
          {status === 'completed' && (
            <View style={styles.completedBadge}>
              <CheckCircle size={14} color="#10b981" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>

        <View style={styles.questTitleRow}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <TouchableOpacity
            style={styles.copyQuestButton}
            onPress={() => copyToClipboard(`${quest.title}\n${quest.description}\n\nMilestones:\n${quest.milestones.map(m => `${m.completed ? '✅' : '⬜'} ${m.description}`).join('\n')}\n\nXP: ${quest.xpReward}`)}
            activeOpacity={0.7}
          >
            <Copy size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        <Text style={styles.questDescription}>{quest.description}</Text>

        <View style={styles.questMilestones}>
          <Text style={styles.milestonesTitle}>
            Milestones ({completedMilestones}/{quest.milestones.length})
          </Text>
          {quest.milestones.map((milestone, milestoneIdx) => (
            <TouchableOpacity
              key={`${quest.id}-milestone-${milestoneIdx}`}
              style={styles.milestone}
              onPress={() => status === 'active' && toggleQuestMilestone(quest.id, milestone.id)}
              disabled={status !== 'active'}
              activeOpacity={0.7}
            >
              <View style={[styles.milestoneCheckbox, milestone.completed && styles.milestoneCheckboxCompleted]}>
                {milestone.completed && <Check size={14} color="#ffffff" strokeWidth={3} />}
              </View>
              <Text style={[styles.milestoneText, milestone.completed && styles.milestoneTextCompleted]}>
                {milestone.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.questFooter}>
          <View style={styles.questReward}>
            <Zap size={14} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.questRewardText}>+{quest.xpReward} XP</Text>
          </View>

          {status === 'pending' && (
            <View style={styles.questActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => acceptQuest(quest.id)}
              >
                <CheckCircle size={18} color="#ffffff" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => declineQuest(quest.id)}
              >
                <XCircle size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          )}

          {status === 'active' && (
            <View style={styles.questActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditQuest(quest.id)}
              >
                <Edit2 size={16} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteActionButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Quest',
                    `Are you sure you want to delete "${quest.title}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteQuest(quest.id) },
                    ]
                  );
                }}
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.completeQuestButton, !allMilestonesComplete && styles.completeQuestButtonDisabled]}
                onPress={() => handleCompleteQuest(quest.id)}
                disabled={!allMilestonesComplete}
              >
                <CheckCircle size={18} color="#ffffff" />
                <Text style={styles.completeQuestButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'completed' && (
            <View style={styles.questActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditQuest(quest.id)}
              >
                <Edit2 size={16} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteActionButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Quest',
                    `Are you sure you want to delete "${quest.title}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteQuest(quest.id) },
                    ]
                  );
                }}
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Target size={32} color="#6366f1" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Quests</Text>
            <Text style={styles.subtitle}>Your journey to greatness</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {pendingQuests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏳ Pending ({pendingQuests.length})</Text>
              {pendingQuests.map((quest) => renderQuest(quest, 'pending'))}
            </View>
          )}

          {activeQuests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚔️ Active ({activeQuests.length})</Text>
              {activeQuests.map((quest) => renderQuest(quest, 'active'))}
            </View>
          )}

          {completedQuests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Completed ({completedQuests.length})</Text>
              {completedQuests.map((quest) => renderQuest(quest, 'completed'))}
            </View>
          )}

          {state.quests.length === 0 && (
            <View style={styles.emptyState}>
              <Target size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Quests Yet</Text>
              <Text style={styles.emptyText}>
                Create your own quest or ask Mavis AI to create personalized quests!
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setAddModalVisible(true)}
              >
                <Text style={styles.emptyAddButtonText}>Create Quest</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>

        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Quest</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                      style={styles.input}
                      value={questForm.title}
                      onChangeText={(text) => setQuestForm({ ...questForm, title: text })}
                      placeholder="Quest title"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={questForm.description}
                      onChangeText={(text) => setQuestForm({ ...questForm, description: text })}
                      placeholder="Quest description"
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <View style={styles.milestonesHeader}>
                      <Text style={styles.label}>Milestones</Text>
                      <TouchableOpacity 
                        style={styles.addMilestoneButton} 
                        onPress={handleAddMilestone}
                      >
                        <Plus size={18} color="#6366f1" />
                        <Text style={styles.addMilestoneText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    {questForm.milestones.length === 0 ? (
                      <View style={styles.emptyMilestones}>
                        <Text style={styles.emptyMilestonesText}>No milestones yet. Add some to track your progress!</Text>
                      </View>
                    ) : (
                      questForm.milestones.map((milestone, idx) => (
                        <View key={`edit-milestone-${milestone.id}-${idx}`} style={styles.milestoneEditRow}>
                          <View style={[
                            styles.milestoneStatusDot, 
                            milestone.completed && styles.milestoneStatusDotCompleted
                          ]} />
                          <TextInput
                            style={styles.milestoneEditInput}
                            value={milestone.description}
                            onChangeText={(text) => handleUpdateMilestone(idx, text)}
                            placeholder={`Milestone ${idx + 1}`}
                            placeholderTextColor="#94a3b8"
                          />
                          <TouchableOpacity
                            style={styles.removeMilestoneButton}
                            onPress={() => handleRemoveMilestone(idx)}
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={addModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
              keyboardVerticalOffset={0}
            >
              <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { paddingTop: insets.top > 0 ? insets.top : 24 }]}>
                <Text style={styles.modalTitle}>Create Quest</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                      style={styles.input}
                      value={newQuestForm.title}
                      onChangeText={(text) => setNewQuestForm({ ...newQuestForm, title: text })}
                      placeholder="Enter quest title"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newQuestForm.description}
                      onChangeText={(text) => setNewQuestForm({ ...newQuestForm, description: text })}
                      placeholder="What is this quest about?"
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Quest Difficulty</Text>
                    <TouchableOpacity
                      style={styles.difficultySelector}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          const options = QUEST_DIFFICULTIES.map(d => 
                            `${QUEST_DIFFICULTY_LABELS[d]} (${QUEST_XP_VALUES[d]} XP)`
                          );
                          options.push('Cancel');
                          
                          ActionSheetIOS.showActionSheetWithOptions(
                            {
                              options,
                              cancelButtonIndex: options.length - 1,
                              title: 'Select Quest Difficulty',
                            },
                            (buttonIndex) => {
                              if (buttonIndex < QUEST_DIFFICULTIES.length) {
                                setNewQuestForm({ 
                                  ...newQuestForm, 
                                  difficulty: QUEST_DIFFICULTIES[buttonIndex] 
                                });
                              }
                            }
                          );
                        } else {
                          setSelectionMode('difficulty');
                        }
                      }}
                    >
                      <View style={styles.difficultySelectorContent}>
                        <View>
                          <Text style={styles.difficultySelectorTitle}>
                            {QUEST_DIFFICULTY_LABELS[newQuestForm.difficulty]}
                          </Text>
                          <Text style={styles.difficultySelectorDescription}>
                            {QUEST_DIFFICULTY_DESCRIPTIONS[newQuestForm.difficulty]}
                          </Text>
                        </View>
                        <ChevronDown size={20} color="#64748b" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <View style={styles.formRow}>
                      <Text style={styles.label}>Quest Type</Text>
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          newQuestForm.relatedToClass && styles.checkboxChecked,
                        ]}
                        onPress={() =>
                          setNewQuestForm({
                            ...newQuestForm,
                            relatedToClass: !newQuestForm.relatedToClass,
                          })
                        }
                      >
                        {newQuestForm.relatedToClass && (
                          <Check size={16} color="#ffffff" strokeWidth={3} />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.checkboxLabel}>Character Class Quest</Text>
                    </View>
                    {newQuestForm.relatedToClass && (
                      <Text style={styles.helperText}>
                        ⚡ This quest will award XP to your Character Class level
                      </Text>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Associated Skills (Skill Proficiency)</Text>
                    <TouchableOpacity
                      style={styles.skillSelectorButton}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          if (state.skills.length === 0) {
                            Alert.alert('No Skills', 'Create skills first before associating them with quests.');
                            return;
                          }
                          
                          const options = state.skills.map(skill => {
                            const isSelected = newQuestForm.associatedSkills.includes(skill.id);
                            return `${isSelected ? '✓ ' : ''}${skill.name} (Lvl ${skill.level})`;
                          });
                          options.push('Done');
                          
                          ActionSheetIOS.showActionSheetWithOptions(
                            {
                              options,
                              cancelButtonIndex: options.length - 1,
                              title: 'Select Skills (tap to toggle)',
                              message: `${newQuestForm.associatedSkills.length} selected`,
                            },
                            (buttonIndex) => {
                              if (buttonIndex < state.skills.length) {
                                const selectedSkill = state.skills[buttonIndex];
                                const isCurrentlySelected = newQuestForm.associatedSkills.includes(selectedSkill.id);
                                
                                if (isCurrentlySelected) {
                                  setNewQuestForm({
                                    ...newQuestForm,
                                    associatedSkills: newQuestForm.associatedSkills.filter(id => id !== selectedSkill.id),
                                  });
                                } else {
                                  setNewQuestForm({
                                    ...newQuestForm,
                                    associatedSkills: [...newQuestForm.associatedSkills, selectedSkill.id],
                                  });
                                }
                              }
                            }
                          );
                        } else {
                          setSelectionMode('skills');
                        }
                      }}
                    >
                      <Text style={styles.skillSelectorText}>
                        {newQuestForm.associatedSkills.length > 0
                          ? `${newQuestForm.associatedSkills.length} skill(s) selected`
                          : 'Select Skills'}
                      </Text>
                    </TouchableOpacity>
                    {newQuestForm.associatedSkills.length > 0 && (
                      <>
                        <View style={styles.selectedSkillsContainer}>
                        {newQuestForm.associatedSkills.map((skillId) => {
                          const skill = state.skills.find((s) => s.id === skillId);
                          if (!skill) return null;
                          return (
                            <View key={skillId} style={styles.selectedSkillChip}>
                              <Text style={styles.selectedSkillChipText}>{skill.name}</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setNewQuestForm({
                                    ...newQuestForm,
                                    associatedSkills: newQuestForm.associatedSkills.filter((id) => id !== skillId),
                                  });
                                }}
                              >
                                <X size={14} color="#64748b" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                        </View>
                        <Text style={styles.helperText}>
                          🎓 Completing this quest will award XP to selected skills
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Milestones</Text>
                    {newQuestForm.milestones.map((milestone, idx) => (
                      <TextInput
                        key={`milestone-input-${idx}`}
                        style={[styles.input, { marginBottom: 8 }]}
                        value={milestone}
                        onChangeText={(text) => {
                          const updated = [...newQuestForm.milestones];
                          updated[idx] = text;
                          setNewQuestForm({ ...newQuestForm, milestones: updated });
                        }}
                        placeholder={`Milestone ${idx + 1}`}
                        placeholderTextColor="#94a3b8"
                      />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                      if (!newQuestForm.title.trim()) {
                        Alert.alert('Error', 'Please enter a quest title');
                        return;
                      }
                      if (!newQuestForm.description.trim()) {
                        Alert.alert('Error', 'Please enter a quest description');
                        return;
                      }

                      const milestones = newQuestForm.milestones
                        .filter(m => m.trim())
                        .map((m, idx) => ({
                          id: `m-${Date.now()}-${idx}`,
                          description: m,
                          completed: false,
                        }));

                      addQuest({
                        title: newQuestForm.title,
                        description: newQuestForm.description,
                        type: newQuestForm.type,
                        category: newQuestForm.category,
                        difficulty: newQuestForm.difficulty,
                        xpReward: QUEST_XP_VALUES[newQuestForm.difficulty],
                        relatedToClass: newQuestForm.relatedToClass,
                        milestones,
                        associatedSkills: newQuestForm.associatedSkills,
                      });

                      setNewQuestForm({
                        title: '',
                        description: '',
                        type: 'daily' as 'daily' | 'weekly' | 'long-term' | 'storyline' | 'one-time',
                        category: 'health',
                        difficulty: 'standard' as QuestDifficulty,
                        relatedToClass: false,
                        milestones: ['', '', ''],
                        associatedSkills: [],
                      });
                      setAddModalVisible(false);
                      Alert.alert('Success', 'Quest created successfully!');
                    }}
                  >
                    <Text style={styles.saveButtonText}>Create Quest</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <Modal
          visible={selectionMode === 'skills'}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectionMode('none')}
        >
          <View style={[styles.fullScreenModal, { paddingTop: insets.top }]}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity onPress={() => setSelectionMode('none')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.fullScreenTitle}>Select Skills</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView 
              style={styles.fullScreenContent}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {state.skills.length === 0 ? (
                <View style={styles.emptySkillsState}>
                  <Text style={styles.emptySkillsText}>
                    No skills available. Create skills first!
                  </Text>
                </View>
              ) : (
                state.skills.map((skill) => {
                  const isSelected = newQuestForm.associatedSkills.includes(skill.id);
                  return (
                    <TouchableOpacity
                      key={skill.id}
                      style={[styles.skillSelectItem, isSelected && styles.skillSelectItemSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setNewQuestForm({
                            ...newQuestForm,
                            associatedSkills: newQuestForm.associatedSkills.filter((id) => id !== skill.id),
                          });
                        } else {
                          setNewQuestForm({
                            ...newQuestForm,
                            associatedSkills: [...newQuestForm.associatedSkills, skill.id],
                          });
                        }
                      }}
                    >
                      <View style={styles.skillSelectInfo}>
                        <Text style={[styles.skillSelectName, isSelected && styles.skillSelectNameSelected]}>
                          {skill.name}
                        </Text>
                        <Text style={styles.skillSelectLevel}>Level {skill.level}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.skillSelectCheckmark}>
                          <Check size={20} color="#6366f1" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={[styles.fullScreenFooter, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setSelectionMode('none')}
              >
                <Text style={styles.saveButtonText}>Done ({newQuestForm.associatedSkills.length} selected)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={selectionMode === 'difficulty'}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectionMode('none')}
        >
          <View style={[styles.fullScreenModal, { paddingTop: insets.top }]}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity onPress={() => setSelectionMode('none')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.fullScreenTitle}>Quest Difficulty</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView 
              style={styles.fullScreenContent}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {QUEST_DIFFICULTIES.map((difficulty) => {
                const isSelected = newQuestForm.difficulty === difficulty;
                const xp = QUEST_XP_VALUES[difficulty];
                
                return (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.difficultyOption,
                      isSelected && styles.difficultyOptionSelected,
                    ]}
                    onPress={() => {
                      setNewQuestForm({ ...newQuestForm, difficulty });
                      setSelectionMode('none');
                    }}
                  >
                    <View style={styles.difficultyOptionContent}>
                      <View style={styles.difficultyOptionHeader}>
                        <Text
                          style={[
                            styles.difficultyOptionTitle,
                            isSelected && styles.difficultyOptionTitleSelected,
                          ]}
                        >
                          {QUEST_DIFFICULTY_LABELS[difficulty]}
                        </Text>
                        <View style={styles.difficultyXpBadge}>
                          <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                          <Text style={styles.difficultyXpText}>{xp} XP</Text>
                        </View>
                      </View>
                      <Text style={styles.difficultyOptionDescription}>
                        {QUEST_DIFFICULTY_DESCRIPTIONS[difficulty]}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.difficultyCheckmark}>
                        <Check size={20} color="#6366f1" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    fontSize: 34,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 17,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
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
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  questTypeBox: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questType: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#6366f1',
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
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#166534',
  },
  questTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  questTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 8,
    flex: 1,
  },
  copyQuestButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginTop: 2,
  },
  questDescription: {
    fontSize: 17,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 16,
  },
  questMilestones: {
    marginBottom: 16,
  },
  milestonesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  milestoneCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneCheckboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  milestoneText: {
    fontSize: 17,
    color: '#0f172a',
    flex: 1,
  },
  milestoneTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  questReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  questRewardText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  questActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  declineButton: {
    backgroundColor: '#f1f5f9',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#eef2ff',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionButton: {
    backgroundColor: '#fee2e2',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeQuestButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeQuestButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  completeQuestButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    height: '92%',
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  skillSelectorButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  skillSelectorText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500' as const,
  },
  selectedSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  selectedSkillChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  emptySkillsState: {
    padding: 32,
    alignItems: 'center',
  },
  emptySkillsText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  skillSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  skillSelectItemSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  skillSelectInfo: {
    flex: 1,
  },
  skillSelectName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  skillSelectNameSelected: {
    color: '#6366f1',
  },
  skillSelectLevel: {
    fontSize: 13,
    color: '#64748b',
  },
  skillSelectCheckmark: {
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600' as const,
    flex: 1,
  },
  difficultySelector: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  difficultySelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultySelectorTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  difficultySelectorDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  difficultyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  difficultyOptionSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  difficultyOptionContent: {
    flex: 1,
  },
  difficultyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  difficultyOptionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  difficultyOptionTitleSelected: {
    color: '#6366f1',
  },
  difficultyXpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyXpText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  difficultyOptionDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  difficultyCheckmark: {
    marginLeft: 12,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 17,
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  fullScreenTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  fullScreenContent: {
    flex: 1,
  },
  fullScreenFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addMilestoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addMilestoneText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  emptyMilestones: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyMilestonesText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  milestoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  milestoneStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cbd5e1',
  },
  milestoneStatusDotCompleted: {
    backgroundColor: '#10b981',
  },
  milestoneEditInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 12,
  },
  removeMilestoneButton: {
    padding: 8,
  },
});
