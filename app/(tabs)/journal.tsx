import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Smile, Frown, Meh, Battery, BatteryLow, Copy } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { copyToClipboard } from '@/lib/clipboard';

const MOOD_ICONS = [
  { value: 1, icon: Frown, color: '#ef4444' },
  { value: 3, icon: Frown, color: '#f97316' },
  { value: 5, icon: Meh, color: '#f59e0b' },
  { value: 7, icon: Smile, color: '#84cc16' },
  { value: 10, icon: Smile, color: '#10b981' },
];

const ENERGY_ICONS = [
  { value: 2, icon: BatteryLow, color: '#ef4444' },
  { value: 5, icon: Battery, color: '#f59e0b' },
  { value: 8, icon: Battery, color: '#10b981' },
];

export default function Journal() {
  const { state, isLoaded, addJournalEntry } = useApp();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newEntry, setNewEntry] = useState<{
    mood: number;
    energy: number;
    text: string;
  }>({
    mood: 5,
    energy: 5,
    text: '',
  });

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const handleAddEntry = () => {
    if (!newEntry.text.trim()) return;

    addJournalEntry({
      date: new Date().toISOString().split('T')[0],
      mood: newEntry.mood,
      energy: newEntry.energy,
      text: newEntry.text,
      tags: [],
    });

    setNewEntry({ mood: 5, energy: 5, text: '' });
    setModalVisible(false);
  };

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Player Journal</Text>
            <Text style={styles.subtitle}>Document your journey</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {state.journal.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Start journaling your thoughts and feelings</Text>
            </View>
          ) : (
            state.journal.map((entry) => {
              const moodColor =
                entry.mood <= 3
                  ? '#ef4444'
                  : entry.mood <= 6
                    ? '#f59e0b'
                    : '#10b981';
              const energyColor =
                entry.energy <= 3
                  ? '#ef4444'
                  : entry.energy <= 6
                    ? '#f59e0b'
                    : '#10b981';

              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{entry.date}</Text>
                    <View style={styles.moodEnergy}>
                      <View style={styles.moodBadge}>
                        <Smile size={14} color={moodColor} />
                        <Text style={[styles.moodText, { color: moodColor }]}>
                          {entry.mood}/10
                        </Text>
                      </View>
                      <View style={styles.energyBadge}>
                        <Battery size={14} color={energyColor} />
                        <Text style={[styles.energyText, { color: energyColor }]}>
                          {entry.energy}/10
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.entryTextRow}>
                    <Text style={styles.entryText}>{entry.text}</Text>
                    <TouchableOpacity
                      style={styles.copyEntryButton}
                      onPress={() => copyToClipboard(`${entry.date} | Mood: ${entry.mood}/10 | Energy: ${entry.energy}/10\n\n${entry.text}`)}
                      activeOpacity={0.7}
                    >
                      <Copy size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                  {entry.tags.length > 0 && (
                    <View style={styles.tags}>
                      {entry.tags.map((tag, tagIdx) => (
                        <View key={`${entry.id}-tag-${tagIdx}`} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Entry</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>How are you feeling?</Text>
                <View style={styles.moodSelector}>
                  {MOOD_ICONS.map((mood, mIdx) => {
                    const Icon = mood.icon;
                    return (
                      <TouchableOpacity
                        key={`mood-icon-${mIdx}`}
                        style={[
                          styles.moodButton,
                          newEntry.mood === mood.value && {
                            backgroundColor: mood.color,
                          },
                        ]}
                        onPress={() => setNewEntry({ ...newEntry, mood: mood.value })}
                      >
                        <Icon
                          size={24}
                          color={newEntry.mood === mood.value ? '#ffffff' : mood.color}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>Mood: {newEntry.mood}/10</Text>
                  <View style={styles.slider}>
                    {[...Array(10)].map((_, i) => (
                      <TouchableOpacity
                        key={`mood-slider-${i}`}
                        style={[
                          styles.sliderDot,
                          i + 1 <= newEntry.mood && styles.sliderDotActive,
                        ]}
                        onPress={() => setNewEntry({ ...newEntry, mood: i + 1 })}
                      />
                    ))}
                  </View>
                </View>

                <Text style={styles.label}>Energy Level</Text>
                <View style={styles.energySelector}>
                  {ENERGY_ICONS.map((energy, eIdx) => {
                    const Icon = energy.icon;
                    return (
                      <TouchableOpacity
                        key={`energy-icon-${eIdx}`}
                        style={[
                          styles.energyButton,
                          newEntry.energy >= energy.value - 1 &&
                            newEntry.energy <= energy.value + 1 && {
                              backgroundColor: energy.color,
                            },
                        ]}
                        onPress={() => setNewEntry({ ...newEntry, energy: energy.value })}
                      >
                        <Icon
                          size={24}
                          color={
                            newEntry.energy >= energy.value - 1 &&
                            newEntry.energy <= energy.value + 1
                              ? '#ffffff'
                              : energy.color
                          }
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>Energy: {newEntry.energy}/10</Text>
                  <View style={styles.slider}>
                    {[...Array(10)].map((_, i) => (
                      <TouchableOpacity
                        key={`energy-slider-${i}`}
                        style={[
                          styles.sliderDot,
                          i + 1 <= newEntry.energy && styles.sliderDotActive,
                        ]}
                        onPress={() => setNewEntry({ ...newEntry, energy: i + 1 })}
                      />
                    ))}
                  </View>
                </View>

                <Text style={styles.label}>What&apos;s on your mind?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newEntry.text}
                  onChangeText={(text) => setNewEntry({ ...newEntry, text })}
                  placeholder="Write about your day, thoughts, or feelings..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={6}
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddEntry}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </TouchableOpacity>
              </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  moodEnergy: {
    flexDirection: 'row',
    gap: 8,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  energyText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  entryTextRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    gap: 8,
  },
  entryText: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 22,
    flex: 1,
  },
  copyEntryButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6366f1',
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 16,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  energySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  energyButton: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  sliderContainer: {
    marginBottom: 12,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 8,
  },
  slider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderDot: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  sliderDotActive: {
    backgroundColor: '#6366f1',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
