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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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
  Files,
  Image as ImageIcon,
  Upload,
  File,
  Camera,
  ImagePlus,
  Copy,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import type { VaultEntry, AppFile, GeneratedImage, FileType } from '@/types';
import CopyButton from '@/components/CopyButton';
import { copyToClipboard } from '@/lib/clipboard';

const ENTRY_TYPES = [
  { id: 'note' as const, label: 'Note', icon: FileText, color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'win' as const, label: 'Win', icon: Trophy, color: '#f59e0b', bgColor: '#fef3c7' },
  { id: 'reflection' as const, label: 'Reflection', icon: MessageCircle, color: '#8b5cf6', bgColor: '#f3e8ff' },
  { id: 'insight' as const, label: 'Insight', icon: Lightbulb, color: '#10b981', bgColor: '#ecfdf5' },
];

const FILE_TYPE_CONFIG = {
  txt: { icon: FileText, color: '#3b82f6', label: 'Text' },
  doc: { icon: FileText, color: '#2563eb', label: 'Document' },
  pdf: { icon: File, color: '#dc2626', label: 'PDF' },
  image: { icon: ImageIcon, color: '#10b981', label: 'Image' },
  other: { icon: File, color: '#64748b', label: 'Other' },
};

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { state, addVaultEntry, updateVaultEntry, deleteVaultEntry, addFile, deleteFile, deleteGeneratedImage } = useApp();
  const [mainTab, setMainTab] = useState<'entries' | 'files'>('entries');
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
  const [filesTab, setFilesTab] = useState<'files' | 'images'>('files');
  const [selectedFile, setSelectedFile] = useState<AppFile | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showFileModal, setShowFileModal] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      const fileExtension = asset.name.split('.').pop()?.toLowerCase() || 'other';
      let fileType: FileType = 'other';
      
      if (['txt', 'text'].includes(fileExtension)) fileType = 'txt';
      else if (['doc', 'docx'].includes(fileExtension)) fileType = 'doc';
      else if (fileExtension === 'pdf') fileType = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) fileType = 'image';

      addFile({
        name: asset.name,
        type: fileType,
        uri: asset.uri,
        size: asset.size || 0,
        mimeType: asset.mimeType || 'application/octet-stream',
        tags: [],
      });

      Alert.alert('✓ File Added', `${asset.name} has been uploaded successfully`);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      const fileName = asset.uri.split('/').pop() || `image-${Date.now()}.jpg`;

      addFile({
        name: fileName,
        type: 'image',
        uri: asset.uri,
        size: asset.fileSize || 0,
        mimeType: 'image/jpeg',
        tags: ['uploaded'],
        thumbnail: asset.uri,
      });

      Alert.alert('✓ Image Added', 'Image uploaded successfully');
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      const fileName = `photo-${Date.now()}.jpg`;

      addFile({
        name: fileName,
        type: 'image',
        uri: asset.uri,
        size: asset.fileSize || 0,
        mimeType: 'image/jpeg',
        tags: ['photo'],
        thumbnail: asset.uri,
      });

      Alert.alert('✓ Photo Captured', 'Photo saved successfully');
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          deleteFile(fileId);
          setShowFileModal(false);
          setSelectedFile(null);
        } 
      },
    ]);
  };

  const handleDeleteImage = (imageId: string) => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          deleteGeneratedImage(imageId);
          setShowImageModal(false);
          setSelectedImage(null);
        } 
      },
    ]);
  };

  const filteredFiles = state.files.filter(file => 
    searchQuery.trim() === '' || 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredImages = state.generatedImages.filter(image =>
    searchQuery.trim() === '' ||
    image.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

        <View style={styles.mainTabsContainer}>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'entries' && styles.mainTabActive]}
            onPress={() => setMainTab('entries')}
          >
            <Archive size={18} color={mainTab === 'entries' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.mainTabText, mainTab === 'entries' && styles.mainTabTextActive]}>
              Entries
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'files' && styles.mainTabActive]}
            onPress={() => setMainTab('files')}
          >
            <Files size={18} color={mainTab === 'files' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.mainTabText, mainTab === 'files' && styles.mainTabTextActive]}>
              Files
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {mainTab === 'files' && (
          <View style={styles.filesTabsContainer}>
            <TouchableOpacity
              style={[styles.filesTab, filesTab === 'files' && styles.filesTabActive]}
              onPress={() => setFilesTab('files')}
            >
              <FileText size={16} color={filesTab === 'files' ? '#6366f1' : '#64748b'} />
              <Text style={[styles.filesTabText, filesTab === 'files' && styles.filesTabTextActive]}>
                Files ({state.files.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filesTab, filesTab === 'images' && styles.filesTabActive]}
              onPress={() => setFilesTab('images')}
            >
              <ImageIcon size={16} color={filesTab === 'images' ? '#6366f1' : '#64748b'} />
              <Text style={[styles.filesTabText, filesTab === 'images' && styles.filesTabTextActive]}>
                Images ({state.generatedImages.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}


        {mainTab === 'entries' ? (
          <>
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
                  
                  <View style={styles.entryTitleRow}>
                    <Text style={styles.entryTitle} numberOfLines={2}>{entry.title}</Text>
                    <TouchableOpacity
                      style={styles.entryCopyButton}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        copyToClipboard(`${entry.title}\n\n${entry.content}${entry.tags.length > 0 ? '\n\nTags: ' + entry.tags.join(', ') : ''}`);
                      }}
                      activeOpacity={0.7}
                    >
                      <Copy size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
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
          </>
        ) : (
          <>
            {filesTab === 'files' ? (
              <>
                <View style={styles.uploadSection}>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                    <Upload size={20} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Upload File</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <ImagePlus size={20} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Add Image</Text>
                  </TouchableOpacity>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                      <Camera size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {filteredFiles.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Files size={40} color="#cbd5e1" />
                    </View>
                    <Text style={styles.emptyTitle}>No files yet</Text>
                    <Text style={styles.emptyText}>Upload documents, images, or create files</Text>
                  </View>
                ) : (
                  <View style={styles.filesList}>
                    {filteredFiles.map((file) => {
                      const config = FILE_TYPE_CONFIG[file.type] || FILE_TYPE_CONFIG.other;
                      const Icon = config.icon;
                      return (
                        <TouchableOpacity
                          key={file.id}
                          style={styles.fileCard}
                          onPress={() => {
                            setSelectedFile(file);
                            setShowFileModal(true);
                          }}
                        >
                          {file.type === 'image' && file.thumbnail ? (
                            <Image source={{ uri: file.thumbnail }} style={styles.fileImage} />
                          ) : (
                            <View style={[styles.fileIcon, { backgroundColor: config.color + '20' }]}>
                              <Icon size={24} color={config.color} />
                            </View>
                          )}
                          <View style={styles.fileInfo}>
                            <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
                            <View style={styles.fileMetaRow}>
                              <Text style={styles.fileType}>{config.label}</Text>
                              <Text style={styles.fileMeta}>• {formatFileSize(file.size)}</Text>
                              <Text style={styles.fileMeta}>• {formatDate(file.createdAt)}</Text>
                            </View>
                            {file.tags.length > 0 && (
                              <View style={styles.fileTagsList}>
                                {file.tags.slice(0, 2).map(tag => (
                                  <View key={tag} style={styles.fileTag}>
                                    <Text style={styles.fileTagText}>#{tag}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <>
                {filteredImages.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <ImageIcon size={40} color="#cbd5e1" />
                    </View>
                    <Text style={styles.emptyTitle}>No generated images</Text>
                    <Text style={styles.emptyText}>Generated images will appear here</Text>
                  </View>
                ) : (
                  <View style={styles.imagesGrid}>
                    {filteredImages.map((image) => (
                      <TouchableOpacity
                        key={image.id}
                        style={styles.imageCard}
                        onPress={() => {
                          setSelectedImage(image);
                          setShowImageModal(true);
                        }}
                      >
                        <Image source={{ uri: image.url }} style={styles.generatedImage} />
                        <View style={styles.imageOverlay}>
                          <Text style={styles.imagePrompt} numberOfLines={2}>{image.prompt}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
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

      {/* File Detail Modal */}
      <Modal visible={showFileModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            {selectedFile && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>File Details</Text>
                  <TouchableOpacity onPress={() => setShowFileModal(false)}>
                    <X size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {selectedFile.type === 'image' && selectedFile.thumbnail && (
                  <Image source={{ uri: selectedFile.thumbnail }} style={styles.modalImage} />
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedFile.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{FILE_TYPE_CONFIG[selectedFile.type].label}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>{formatFileSize(selectedFile.size)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{new Date(selectedFile.createdAt).toLocaleString()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>URI</Text>
                  <View style={styles.uriRow}>
                    <Text style={styles.uriText} numberOfLines={1}>{selectedFile.uri}</Text>
                    <CopyButton text={selectedFile.uri} size={16} />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFile(selectedFile.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete File</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Detail Modal */}
      <Modal visible={showImageModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            {selectedImage && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Generated Image</Text>
                  <TouchableOpacity onPress={() => setShowImageModal(false)}>
                    <X size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <Image source={{ uri: selectedImage.url }} style={styles.modalImage} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prompt</Text>
                  <Text style={styles.detailValue}>{selectedImage.prompt}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>{selectedImage.size}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{new Date(selectedImage.createdAt).toLocaleString()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>URL</Text>
                  <View style={styles.uriRow}>
                    <Text style={styles.uriText} numberOfLines={1}>{selectedImage.url}</Text>
                    <CopyButton text={selectedImage.url} size={16} />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteImage(selectedImage.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete Image</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  entryTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
    flex: 1,
  },
  entryCopyButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginTop: 2,
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
  mainTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  mainTabActive: {
    backgroundColor: '#eef2ff',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  mainTabTextActive: {
    color: '#6366f1',
  },
  filesTabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filesTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
  },
  filesTabActive: {
    backgroundColor: '#eef2ff',
  },
  filesTabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  filesTabTextActive: {
    color: '#6366f1',
  },
  uploadSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
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
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  filesList: {
    gap: 12,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
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
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  fileType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6366f1',
    textTransform: 'uppercase' as const,
  },
  fileMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fileTagsList: {
    flexDirection: 'row',
    gap: 6,
  },
  fileTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fileTagText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
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
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  imagePrompt: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500' as const,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  detailValue: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 22,
  },
  uriRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  uriText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
  },
  modalActions: {
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
});
