import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Archive, 
  Plus, 
  X, 
  FileText, 
  Trophy, 
  Lightbulb, 
  MessageCircle, 
  Trash2, 
  Calendar,
  Search,
  ChevronRight,
  Sparkles,
  Tag,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import type { VaultEntry } from '@/types';

const ENTRY_TYPES = [
  { id: 'note' as const, label: 'Note', icon: FileText, color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'win' as const, label: 'Win', icon: Trophy, color: '#f59e0b', bgColor: '#fef3c7' },
  { id: 'reflection' as const, label: 'Reflection', icon: MessageCircle, color: '#8b5cf6', bgColor: '#f3e8ff' },
  { id: 'insight' as const, label: 'Insight', icon: Lightbulb, color: '#10b981', bgColor: '#ecfdf5' },
];

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { state, addVaultEntry, updateVaultEntry, deleteVaultEntry } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entryForm, setEntryForm] = useState({
    type: 'note' as VaultEntry['type'],
    title: '',
    content: '',
    tags: [] as string[],
    mood: undefined as number | undefined,
    energy: undefined as number | undefined,
  });
  const [tagInput, setTagInput] = useState<string>('');
  const [filterType, setFilterType] = useState<VaultEntry['type'] | 'all'>('all');

  const openModal = (entry?: VaultEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEntryForm({
        type: entry.type,
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        mood: entry.mood,
        energy: entry.energy,
      });
    } else {
      setEditingEntry(null);
      setEntryForm({
        type: 'note',
        title: '',
        content: '',
        tags: [],
        mood: undefined,
        energy: undefined,
      });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!entryForm.title.trim() || !entryForm.content.trim()) {
      Alert.alert('Error', 'Please enter a title and content');
      return;
    }

    if (editingEntry) {
      updateVaultEntry(editingEntry.id, { ...entryForm });
    } else {
      addVaultEntry({ ...entryForm });
    }
    setModalVisible(false);
  };

  const handleDelete = (entryId: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVaultEntry(entryId) },
    ]);
  };

  const addTag = () => {
    if (tagInput.trim() && !entryForm.tags.includes(tagInput.trim())) {
      setEntryForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setEntryForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const filteredEntries = useMemo(() => {
    let entries = filterType === 'all' 
      ? state.vault 
      : state.vault.filter(e => e.type === filterType);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.content.toLowerCase().includes(query) ||
        e.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    return entries;
  }, [state.vault, filterType, searchQuery]);

  const entryCounts = useMemo(() => {
    return {
      all: state.vault.length,
      note: state.vault.filter(e => e.type === 'note').length,
      win: state.vault.filter(e => e.type === 'win').length,
      reflection: state.vault.filter(e => e.type === 'reflection').length,
      insight: state.vault.filter(e => e.type === 'insight').length,
    };
  }, [state.vault]);

  const getTypeConfig = (type: VaultEntry['type']) => {
    return ENTRY_TYPES.find(t => t.id === type) || ENTRY_TYPES[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Archive size={28} color="#0f172a" />
            <Text style={styles.headerTitle}>Vault</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => openModal()} 
            activeOpacity={0.7}
          >
            <Plus size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, filterType === 'all' && styles.filterPillTextActive]}>
              All ({entryCounts.all})
            </Text>
          </TouchableOpacity>
          {ENTRY_TYPES.map(type => {
            const Icon = type.icon;
            const isActive = filterType === type.id;
            const count = entryCounts[type.id];
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.filterPill, 
                  isActive && { backgroundColor: type.color }
                ]}
                onPress={() => setFilterType(type.id)}
                activeOpacity={0.7}
              >
                <Icon size={14} color={isActive ? '#ffffff' : type.color} />
                <Text style={[
                  styles.filterPillText, 
                  isActive && styles.filterPillTextActive,
                  !isActive && { color: type.color }
                ]}>
                  {type.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Sparkles size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching entries' : 'Your vault is empty'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Start capturing your wins, insights, and reflections'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
                <Plus size={18} color="#ffffff" />
                <Text style={styles.emptyButtonText}>Create First Entry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.entriesGrid}>
            {filteredEntries.map((entry) => {
              const typeConfig = getTypeConfig(entry.type);
              const Icon = typeConfig.icon;
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryCard}
                  onPress={() => openModal(entry)}
                  activeOpacity={0.7}
                >
                  <View style={styles.entryCardHeader}>
                    <View style={[styles.entryTypeIcon, { backgroundColor: typeConfig.bgColor }]}>
                      <Icon size={16} color={typeConfig.color} />
                    </View>
                    <View style={styles.entryMeta}>
                      <Text style={[styles.entryTypeLabel, { color: typeConfig.color }]}>
                        {typeConfig.label}
                      </Text>
                      <View style={styles.entryDateRow}>
                        <Calendar size={12} color="#94a3b8" />
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </View>
                  
                  <Text style={styles.entryTitle} numberOfLines={2}>{entry.title}</Text>
                  <Text style={styles.entryPreview} numberOfLines={3}>{entry.content}</Text>
                  
                  {entry.tags.length > 0 && (
                    <View style={styles.entryTags}>
                      {entry.tags.slice(0, 3).map(tag => (
                        <View key={tag} style={styles.entryTag}>
                          <Text style={styles.entryTagText}>#{tag}</Text>
                        </View>
                      ))}
                      {entry.tags.length > 3 && (
                        <Text style={styles.moreTagsText}>+{entry.tags.length - 3}</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true} 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalForm} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeGrid}>
                  {ENTRY_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = entryForm.type === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.typeOption,
                          isSelected && { backgroundColor: type.bgColor, borderColor: type.color }
                        ]}
                        onPress={() => setEntryForm(prev => ({ ...prev, type: type.id }))}
                        activeOpacity={0.7}
                      >
                        <Icon size={22} color={isSelected ? type.color : '#94a3b8'} />
                        <Text style={[
                          styles.typeOptionText,
                          isSelected && { color: type.color, fontWeight: '600' as const }
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.formInput}
                  value={entryForm.title}
                  onChangeText={(text) => setEntryForm(prev => ({ ...prev, title: text }))}
                  placeholder="Give your entry a title..."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Content</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={entryForm.content}
                  onChangeText={(text) => setEntryForm(prev => ({ ...prev, content: text }))}
                  placeholder="Write your thoughts..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Tags</Text>
                <View style={styles.tagInputRow}>
                  <View style={styles.tagInputWrapper}>
                    <Tag size={16} color="#94a3b8" />
                    <TextInput
                      style={styles.tagInputField}
                      value={tagInput}
                      onChangeText={setTagInput}
                      placeholder="Add a tag..."
                      placeholderTextColor="#94a3b8"
                      onSubmitEditing={addTag}
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.tagAddButton, !tagInput.trim() && styles.tagAddButtonDisabled]} 
                    onPress={addTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus size={18} color={tagInput.trim() ? '#ffffff' : '#94a3b8'} />
                  </TouchableOpacity>
                </View>
                {entryForm.tags.length > 0 && (
                  <View style={styles.tagsList}>
                    {entryForm.tags.map(tag => (
                      <TouchableOpacity 
                        key={tag} 
                        style={styles.tagChip} 
                        onPress={() => removeTag(tag)} 
                        activeOpacity={0.7}
                      >
                        <Text style={styles.tagChipText}>#{tag}</Text>
                        <X size={14} color="#6366f1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {editingEntry && (
                <TouchableOpacity
                  style={styles.deleteEntryButton}
                  onPress={() => {
                    setModalVisible(false);
                    handleDelete(editingEntry.id);
                  }}
                >
                  <Trash2 size={18} color="#ef4444" />
                  <Text style={styles.deleteEntryButtonText}>Delete Entry</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {editingEntry ? 'Save Changes' : 'Create Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  filterScroll: {
    marginHorizontal: -20,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#6366f1',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  entriesGrid: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
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
  entryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryMeta: {
    flex: 1,
    marginLeft: 12,
  },
  entryTypeLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  entryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  entryDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
  },
  entryPreview: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  entryTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entryTagText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
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
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    maxHeight: 480,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTextArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  tagInputField: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 14,
  },
  tagAddButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagAddButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6366f1',
  },
  deleteEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  deleteEntryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});
